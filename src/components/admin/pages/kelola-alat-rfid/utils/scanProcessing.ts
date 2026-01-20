import { AlatRFID, Guru, Murid, AbsensiGuru, Absensi, PengaturanAbsen, Kelas, IzinGuru } from '../../../../../types';
import {
  ScanResult,
  ScanLogEntry,
  calculateAttendanceStatus,
  getUserInfo,
  getAbsenStatusMessage,
  playSound,
  isAttendanceDayAllowed
} from './rfidMonitoringUtils';
import { apiService } from '../../../../../services/apiService';
import { getLocalTimeISOString } from '../../../../../utils/absensiUtils';

export interface ScanProcessingParams {
  scannedData: string;
  currentAlat: AlatRFID;
  absensiGuru: AbsensiGuru[];
  absensi: Absensi[];
  users: any[];
  kelas: Kelas[];
  pengaturanAbsen: PengaturanAbsen[];
  izinGuru: IzinGuru[];
}

export interface ScanProcessingResult {
  logEntry: ScanLogEntry;
  scanResult: ScanResult;
}

export const processScan = async (
  params: ScanProcessingParams,
  onSetAbsensiGuru: (data: AbsensiGuru[]) => void,
  onSetAbsensi: (data: Absensi[]) => void
): Promise<ScanProcessingResult | null> => {
  const { scannedData, currentAlat, absensiGuru, absensi, users, kelas, pengaturanAbsen, izinGuru } = params;

  if (currentAlat?.status === 'nonaktif') {
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: 'Alat Nonaktif',
      tipeUser: '-',
      tipeAbsen: '-',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      status: 'gagal',
    };
    playSound('error');
    return null;
  }

  const userInfo = getUserInfo(scannedData, users);

  if (!userInfo) {
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: 'Tidak Terdaftar',
      tipeUser: '-',
      tipeAbsen: '-',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      status: 'gagal',
    };
    playSound('error');

    const scanResult: ScanResult = {
      user: { name: 'Tidak Terdaftar' },
      role: '-',
      tipeAbsen: '-',
      status: 'gagal',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      statusMessage: 'Kartu Tidak Terdaftar',
      isError: true,
      errorType: 'not_registered',
    };

    return { logEntry, scanResult };
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date();
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const timeString = `${hours}:${minutes}`;

  // Get enableEarlyDeparture from pengaturan sistem
  let enableEarlyDeparture = false;
  try {
    const pengaturanResponse = await apiService.getEnableEarlyDeparture();
    if (pengaturanResponse.success) {
      enableEarlyDeparture = pengaturanResponse.enableEarlyDeparture ?? false;
    }
  } catch (error) {
    console.error('Error fetching enableEarlyDeparture:', error);
    // Default to false if error
    enableEarlyDeparture = false;
  }

  if (userInfo.role === 'guru') {
    return await processGuruScan(
      userInfo.user as Guru,
      today,
      timeString,
      absensiGuru,
      pengaturanAbsen,
      izinGuru,
      onSetAbsensiGuru,
      enableEarlyDeparture
    );
  } else if (userInfo.role === 'murid') {
    return await processMuridScan(
      userInfo.user as Murid,
      today,
      timeString,
      absensi,
      kelas,
      pengaturanAbsen,
      onSetAbsensi,
      enableEarlyDeparture
    );
  }

  return null;
};

const processGuruScan = async (
  guru: Guru,
  today: string,
  timeString: string,
  absensiGuru: AbsensiGuru[],
  pengaturanAbsen: PengaturanAbsen[],
  izinGuru: IzinGuru[],
  onSetAbsensiGuru: (data: AbsensiGuru[]) => void,
  enableEarlyDeparture: boolean = false
): Promise<ScanProcessingResult> => {
  // Check if guru has izin/sakit today
  const activeIzin = izinGuru.find(izin => {
    return izin.guruId === guru.id &&
           izin.status === 'diterima' &&
           izin.jenis !== 'izin_dispen' &&
           izin.tanggalMulai <= today &&
           izin.tanggalSelesai >= today;
  });

  // If guru has izin/sakit, return only izin/sakit info without processing attendance
  if (activeIzin) {
    const jenisIzin = activeIzin.jenis === 'izin' ? 'izin' : activeIzin.jenis === 'sakit' ? 'sakit' : 'cuti';
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: guru.name,
      tipeUser: 'Guru',
      tipeAbsen: jenisIzin === 'izin' ? 'Izin' : jenisIzin === 'sakit' ? 'Sakit' : 'Cuti',
      timestamp: timeString,
      status: 'berhasil',
    };
    playSound('success');

    const scanResult: ScanResult = {
      user: guru,
      role: 'guru',
      tipeAbsen: jenisIzin === 'izin' ? 'Izin' : jenisIzin === 'sakit' ? 'Sakit' : 'Cuti',
      status: jenisIzin,
      timestamp: timeString,
      statusMessage: `${guru.name} sedang ${jenisIzin} hari ini`,
      izinInfo: {
        jenis: jenisIzin as 'izin' | 'sakit' | 'cuti',
        alasan: activeIzin.alasan,
        tanggalMulai: activeIzin.tanggalMulai,
        tanggalSelesai: activeIzin.tanggalSelesai,
      },
    };

    return { logEntry, scanResult };
  }

  // Check if today is a work day for guru
  if (!isAttendanceDayAllowed(today, 'guru', pengaturanAbsen)) {
    const daysInIndonesian = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const date = new Date(today + 'T00:00:00');
    const dayName = daysInIndonesian[date.getDay()];
    
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: guru.name,
      tipeUser: 'Guru',
      tipeAbsen: 'Tidak Diizinkan',
      timestamp: timeString,
      status: 'gagal',
    };
    playSound('error');

    const scanResult: ScanResult = {
      user: guru,
      role: 'guru',
      tipeAbsen: 'Tidak Diizinkan',
      status: 'gagal',
      timestamp: timeString,
      statusMessage: `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari kerja yang telah ditentukan.`,
      isError: true,
      errorType: 'absen_failed',
    };

    return { logEntry, scanResult };
  }

  const existingAbsensi = absensiGuru.find(a => a.guruId === guru.id && a.tanggal === today);

  if (existingAbsensi && existingAbsensi.jamMasuk && existingAbsensi.jamKeluar) {
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: guru.name,
      tipeUser: 'Guru',
      tipeAbsen: 'Sudah Terpenuhi',
      timestamp: timeString,
      status: 'berhasil',
    };
    playSound('success');

    const scanResult: ScanResult = {
      user: guru,
      role: 'guru',
      tipeAbsen: 'Sudah Terpenuhi',
      status: 'sudah_terpenuhi',
      timestamp: timeString,
      statusMessage: 'Absen hari ini sudah terpenuhi',
    };

    return { logEntry, scanResult };
  }

  const tipeAbsen = existingAbsensi?.jamMasuk ? 'keluar' : 'masuk';

  // Check if trying to absen masuk but current time has passed jam pulang
  if (tipeAbsen === 'masuk') {
    const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
    if (activePengaturan) {
      const [jamPulang, menitPulang] = activePengaturan.jamPulang.split(':').map(Number);
      const [jamAbsen, menitAbsen] = timeString.split(':').map(Number);

      const jamPulangMinutes = jamPulang * 60 + menitPulang;
      const jamAbsenMinutes = jamAbsen * 60 + menitAbsen;

      if (jamAbsenMinutes > jamPulangMinutes) {
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: guru.name,
          tipeUser: 'Guru',
          tipeAbsen: 'Masuk',
          timestamp: timeString,
          status: 'gagal',
        };
        playSound('error');

        const jamPulangFormatted = `${String(jamPulang).padStart(2, '0')}:${String(menitPulang).padStart(2, '0')}`;

        const scanResult: ScanResult = {
          user: guru,
          role: 'guru',
          tipeAbsen: 'Masuk',
          status: 'gagal',
          timestamp: timeString,
          statusMessage: `Tidak dapat absen masuk. Waktu sudah melewati jam pulang (${jamPulangFormatted})`,
          isError: true,
        };

        return { logEntry, scanResult };
      }
    }
  }

  // Check early departure restriction if toggle is not active (for keluar/pulang)
  if (tipeAbsen === 'keluar' && enableEarlyDeparture === false) {
    const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
    if (activePengaturan) {
      const [jamPulang, menitPulang] = activePengaturan.jamPulang.split(':').map(Number);
      const [jamAbsen, menitAbsen] = timeString.split(':').map(Number);

      const jamPulangMinutes = jamPulang * 60 + menitPulang;
      const jamAbsenMinutes = jamAbsen * 60 + menitAbsen;
      const batasPulang15Menit = jamPulangMinutes - 15;

      // If trying to absen keluar before 15 minutes before jam pulang, reject
      if (jamAbsenMinutes < batasPulang15Menit) {
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: guru.name,
          tipeUser: 'Guru',
          tipeAbsen: 'Keluar',
          timestamp: timeString,
          status: 'gagal',
        };
        playSound('error');

        // Calculate minimum allowed time (15 minutes before jam pulang)
        const minAllowedMinutes = batasPulang15Menit;
        const minAllowedHour = Math.floor(minAllowedMinutes / 60);
        const minAllowedMin = minAllowedMinutes % 60;
        const minAllowedTime = `${String(minAllowedHour).padStart(2, '0')}:${String(minAllowedMin).padStart(2, '0')}`;
        const jamPulangFormatted = `${String(jamPulang).padStart(2, '0')}:${String(menitPulang).padStart(2, '0')}`;

        const scanResult: ScanResult = {
          user: guru,
          role: 'guru',
          tipeAbsen: 'Keluar',
          status: 'gagal',
          timestamp: timeString,
          statusMessage: `Belum waktunya absen keluar. Minimal absen keluar 15 menit sebelum jam pulang (${minAllowedTime} - ${jamPulangFormatted})`,
          isError: true,
          errorType: 'early_departure',
          departureTime: jamPulangFormatted,
        };

        return { logEntry, scanResult };
      }
    }
  }

  const statusAbsen = calculateAttendanceStatus(timeString, tipeAbsen as 'masuk' | 'pulang' | 'keluar', pengaturanAbsen);

  try {
    // Fetch active tahun ajaran
    const tahunAjaranResponse = await apiService.getActiveTahunAjaran();
    if (!tahunAjaranResponse.success || !tahunAjaranResponse.tahunAjaran) {
      console.error('Tahun ajaran aktif tidak ditemukan');
      // Fallback: return error result
      const logEntry: ScanLogEntry = {
        id: `scan-${Date.now()}`,
        namaUser: guru.name,
        tipeUser: 'Guru',
        tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'keluar',
        timestamp: timeString,
        status: 'gagal',
      };
      playSound('error');

      const scanResult: ScanResult = {
        user: guru,
        role: 'guru',
        tipeAbsen: tipeAbsen,
        status: 'gagal',
        timestamp: timeString,
        statusMessage: 'Gagal menyimpan absensi: Tahun ajaran tidak ditemukan',
        isError: true,
      };

      return { logEntry, scanResult };
    }

    const activeTahunAjaran = tahunAjaranResponse.tahunAjaran;

    if (existingAbsensi) {
      // Update existing absensi (keluar)
      // Convert 'pulang_cepat' to 'pulang_awal' for guru (enum requirement)
      const statusKeluarForGuru = statusAbsen === 'pulang_cepat' ? 'pulang_awal' : statusAbsen;
      
      const updateData = {
        jamKeluar: timeString,
        statusKeluar: statusKeluarForGuru,
      };

      const updateResponse = await apiService.updateAbsensiGuru(existingAbsensi.id, updateData);
      
      if (!updateResponse.success) {
        console.error('Gagal update absensi guru:', updateResponse.message);
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: guru.name,
          tipeUser: 'Guru',
          tipeAbsen: 'keluar',
          timestamp: timeString,
          status: 'gagal',
        };
        playSound('error');

        const scanResult: ScanResult = {
          user: guru,
          role: 'guru',
          tipeAbsen: 'keluar',
          status: 'gagal',
          timestamp: timeString,
          statusMessage: 'Gagal menyimpan absensi keluar',
          isError: true,
        };

        return { logEntry, scanResult };
      }

      // Update local state
      const updatedAbsensi: AbsensiGuru = {
        ...existingAbsensi,
        jamKeluar: timeString,
        statusKeluar: statusKeluarForGuru,
      };
      onSetAbsensiGuru(absensiGuru.map(a => a.id === existingAbsensi.id ? updatedAbsensi : a));
    } else {
      // Create new absensi (masuk)
      const newAbsensi = {
        id: `absen-guru-${Date.now()}`,
        guruId: guru.id,
        tanggal: today,
        jamMasuk: timeString,
        statusMasuk: statusAbsen,
        statusKeluar: 'tidak_keluar',
        keteranganAbsensi: 'Hadir',
        tahunAjaranId: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
      };

      const createResponse = await apiService.createAbsensiGuru(newAbsensi);
      
      if (!createResponse.success) {
        console.error('Gagal create absensi guru:', createResponse.message);
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: guru.name,
          tipeUser: 'Guru',
          tipeAbsen: 'masuk',
          timestamp: timeString,
          status: 'gagal',
        };
        playSound('error');

        const scanResult: ScanResult = {
          user: guru,
          role: 'guru',
          tipeAbsen: 'masuk',
          status: 'gagal',
          timestamp: timeString,
          statusMessage: 'Gagal menyimpan absensi masuk',
          isError: true,
        };

        return { logEntry, scanResult };
      }

      // Update local state
      const createdAbsensi: AbsensiGuru = {
        ...newAbsensi,
        createdAt: getLocalTimeISOString(),
      };
      onSetAbsensiGuru([...absensiGuru, createdAbsensi]);
    }

    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: guru.name,
      tipeUser: 'Guru',
      tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'keluar',
      timestamp: timeString,
      status: 'berhasil',
    };
    playSound('success');

    const scanResult: ScanResult = {
      user: guru,
      role: 'guru',
      tipeAbsen: tipeAbsen,
      status: statusAbsen,
      timestamp: timeString,
      statusMessage: getAbsenStatusMessage(statusAbsen, tipeAbsen),
    };

    return { logEntry, scanResult };
  } catch (error: any) {
    console.error('Error processing guru scan:', error);
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: guru.name,
      tipeUser: 'Guru',
      tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'keluar',
      timestamp: timeString,
      status: 'gagal',
    };
    playSound('error');

    const scanResult: ScanResult = {
      user: guru,
      role: 'guru',
      tipeAbsen: tipeAbsen,
      status: 'gagal',
      timestamp: timeString,
      statusMessage: `Error: ${error.message || 'Gagal memproses absensi'}`,
      isError: true,
    };

    return { logEntry, scanResult };
  }
};

const processMuridScan = async (
  murid: Murid,
  today: string,
  timeString: string,
  absensi: Absensi[],
  kelas: Kelas[],
  pengaturanAbsen: PengaturanAbsen[],
  onSetAbsensi: (data: Absensi[]) => void,
  enableEarlyDeparture: boolean = false
): Promise<ScanProcessingResult> => {
  // Handle santri yang tidak memiliki kelasId (isFromMurid: false)
  const isSantriWithoutKelas = (murid as any).isFromMurid === false && !murid.kelasId;
  const kelasId = murid.kelasId || 'santri'; // Use 'santri' as default for santri without kelasId
  
  const kelasInfo = murid.kelasId ? kelas.find(k => k.id === murid.kelasId) : null;
  const muridWithKelas = {
    ...murid,
    namaKelas: kelasInfo?.name || (isSantriWithoutKelas ? 'Santri' : 'Kelas Tidak Ditemukan')
  };

  // Find today's absensi (one record per day in new structure)
  // For santri without kelasId, search without kelasId filter
  const todayAbsensi = isSantriWithoutKelas
    ? absensi.find(a => 
        a.muridId === murid.id && 
        a.tanggal === today &&
        (!a.kelasId || a.kelasId === 'santri')
      )
    : absensi.find(a => 
        a.muridId === murid.id && 
        a.tanggal === today && 
        a.kelasId === murid.kelasId
      );

  // Check if already checked in/out using new structure
  const alreadyCheckedIn = todayAbsensi?.jamMasuk || todayAbsensi?.statusMasuk;
  const alreadyCheckedOut = todayAbsensi?.jamKeluar || todayAbsensi?.statusKeluar;

  // Backward compatibility: check old structure
  const oldMasuk = isSantriWithoutKelas
    ? absensi.find(a => 
        a.muridId === murid.id && 
        a.tanggal === today && 
        (!a.kelasId || a.kelasId === 'santri') &&
        a.tipeAbsen === 'masuk'
      )
    : absensi.find(a => 
        a.muridId === murid.id && 
        a.tanggal === today && 
        a.kelasId === murid.kelasId && 
        a.tipeAbsen === 'masuk'
      );
  const oldPulang = isSantriWithoutKelas
    ? absensi.find(a => 
        a.muridId === murid.id && 
        a.tanggal === today && 
        (!a.kelasId || a.kelasId === 'santri') &&
        a.tipeAbsen === 'pulang'
      )
    : absensi.find(a => 
        a.muridId === murid.id && 
        a.tanggal === today && 
        a.kelasId === murid.kelasId && 
        a.tipeAbsen === 'pulang'
      );

  const hasMasuk = alreadyCheckedIn || !!oldMasuk;
  const hasPulang = alreadyCheckedOut || !!oldPulang;

  if (hasMasuk && hasPulang) {
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: murid.name,
      tipeUser: 'Murid',
      tipeAbsen: 'Sudah Terpenuhi',
      timestamp: timeString,
      status: 'berhasil',
    };
    playSound('success');

    const scanResult: ScanResult = {
      user: muridWithKelas,
      role: 'murid',
      tipeAbsen: 'Sudah Terpenuhi',
      status: 'sudah_terpenuhi',
      timestamp: timeString,
      statusMessage: 'Absen hari ini sudah terpenuhi',
    };

    return { logEntry, scanResult };
  }

  // Check if today is a school day for murid
  if (!isAttendanceDayAllowed(today, 'murid', pengaturanAbsen)) {
    const daysInIndonesian = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const date = new Date(today + 'T00:00:00');
    const dayName = daysInIndonesian[date.getDay()];
    
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: murid.name,
      tipeUser: 'Murid',
      tipeAbsen: 'Tidak Diizinkan',
      timestamp: timeString,
      status: 'gagal',
    };
    playSound('error');

    const scanResult: ScanResult = {
      user: muridWithKelas,
      role: 'murid',
      tipeAbsen: 'Tidak Diizinkan',
      status: 'gagal',
      timestamp: timeString,
      statusMessage: `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`,
      isError: true,
      errorType: 'absen_failed',
    };

    return { logEntry, scanResult };
  }

  const tipeAbsen = hasMasuk ? 'pulang' : 'masuk';

  // Check if trying to absen masuk but current time has passed jam pulang
  if (tipeAbsen === 'masuk') {
    const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
    if (activePengaturan) {
      const [jamPulang, menitPulang] = activePengaturan.jamPulang.split(':').map(Number);
      const [jamAbsen, menitAbsen] = timeString.split(':').map(Number);

      const jamPulangMinutes = jamPulang * 60 + menitPulang;
      const jamAbsenMinutes = jamAbsen * 60 + menitAbsen;

      if (jamAbsenMinutes > jamPulangMinutes) {
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: murid.name,
          tipeUser: 'Murid',
          tipeAbsen: 'Masuk',
          timestamp: timeString,
          status: 'gagal',
        };
        playSound('error');

        const jamPulangFormatted = `${String(jamPulang).padStart(2, '0')}:${String(menitPulang).padStart(2, '0')}`;

        const scanResult: ScanResult = {
          user: muridWithKelas,
          role: 'murid',
          tipeAbsen: 'Masuk',
          status: 'gagal',
          timestamp: timeString,
          statusMessage: `Tidak dapat absen masuk. Waktu sudah melewati jam pulang (${jamPulangFormatted})`,
          isError: true,
        };

        return { logEntry, scanResult };
      }
    }
  }

  // Check early departure restriction if toggle is not active
  if (tipeAbsen === 'pulang' && enableEarlyDeparture === false) {
    const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
    if (activePengaturan) {
      const [jamPulang, menitPulang] = activePengaturan.jamPulang.split(':').map(Number);
      const [jamAbsen, menitAbsen] = timeString.split(':').map(Number);

      const jamPulangMinutes = jamPulang * 60 + menitPulang;
      const jamAbsenMinutes = jamAbsen * 60 + menitAbsen;
      const batasPulang15Menit = jamPulangMinutes - 15;

      // If trying to absen pulang before 15 minutes before jam pulang, reject
      if (jamAbsenMinutes < batasPulang15Menit) {
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: murid.name,
          tipeUser: 'Murid',
          tipeAbsen: 'Pulang',
          timestamp: timeString,
          status: 'gagal',
        };
        playSound('error');

        // Calculate minimum allowed time (15 minutes before jam pulang)
        const minAllowedMinutes = batasPulang15Menit;
        const minAllowedHour = Math.floor(minAllowedMinutes / 60);
        const minAllowedMin = minAllowedMinutes % 60;
        const minAllowedTime = `${String(minAllowedHour).padStart(2, '0')}:${String(minAllowedMin).padStart(2, '0')}`;
        const jamPulangFormatted = `${String(jamPulang).padStart(2, '0')}:${String(menitPulang).padStart(2, '0')}`;

        const scanResult: ScanResult = {
          user: muridWithKelas,
          role: 'murid',
          tipeAbsen: 'Pulang',
          status: 'gagal',
          timestamp: timeString,
          statusMessage: `Belum waktunya absen pulang. Minimal absen pulang 15 menit sebelum jam pulang (${minAllowedTime} - ${jamPulangFormatted})`,
          isError: true,
          errorType: 'early_departure',
          departureTime: jamPulangFormatted,
        };

        return { logEntry, scanResult };
      }
    }
  }

  const statusAbsen = calculateAttendanceStatus(timeString, tipeAbsen as 'masuk' | 'pulang', pengaturanAbsen);
  const now = getLocalTimeISOString();

  try {
    // Fetch active tahun ajaran
    const tahunAjaranResponse = await apiService.getActiveTahunAjaran();
    if (!tahunAjaranResponse.success || !tahunAjaranResponse.tahunAjaran) {
      console.error('Tahun ajaran aktif tidak ditemukan');
      const logEntry: ScanLogEntry = {
        id: `scan-${Date.now()}`,
        namaUser: murid.name,
        tipeUser: 'Murid',
        tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
        timestamp: timeString,
        status: 'gagal',
      };
      playSound('error');

      const scanResult: ScanResult = {
        user: muridWithKelas,
        role: 'murid',
        tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
        status: 'gagal',
        timestamp: timeString,
        statusMessage: 'Gagal menyimpan absensi: Tahun ajaran tidak ditemukan',
        isError: true,
      };

      return { logEntry, scanResult };
    }

    const activeTahunAjaran = tahunAjaranResponse.tahunAjaran;
    const absensiId = `${today}-${kelasId}-${murid.id}`;

    if (todayAbsensi) {
      // Update existing absensi (pulang)
      const updateData: Partial<Absensi> = {
        jamKeluar: now,
        statusKeluar: tipeAbsen === 'pulang' ? (statusAbsen === 'pulang_cepat' ? 'pulang_awal' : 'tepat_waktu') : undefined,
        // Legacy fields for backward compatibility
        tipeAbsen: tipeAbsen as 'masuk' | 'pulang',
        status: 'hadir',
        waktu: now,
        statusAbsen: statusAbsen,
      };

      const updateResponse = await apiService.updateAbsensi(todayAbsensi.id, updateData);
      
      if (!updateResponse.success) {
        console.error('Gagal update absensi:', updateResponse.message);
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: murid.name,
          tipeUser: 'Murid',
          tipeAbsen: 'Pulang',
          timestamp: timeString,
          status: 'gagal',
        };
        playSound('error');

        const scanResult: ScanResult = {
          user: muridWithKelas,
          role: 'murid',
          tipeAbsen: 'Pulang',
          status: 'gagal',
          timestamp: timeString,
          statusMessage: 'Gagal menyimpan absensi pulang',
          isError: true,
        };

        return { logEntry, scanResult };
      }

      // Update local state
      const updatedAbsensi: Absensi = {
        ...todayAbsensi,
        jamKeluar: now,
        statusKeluar: tipeAbsen === 'pulang' ? (statusAbsen === 'pulang_cepat' ? 'pulang_awal' : 'tepat_waktu') : undefined,
        tipeAbsen: tipeAbsen as 'masuk' | 'pulang',
        status: 'hadir',
        waktu: now,
        statusAbsen: statusAbsen,
      };
      onSetAbsensi(absensi.map(a => a.id === todayAbsensi.id ? updatedAbsensi : a));
    } else {
      // Create new absensi (masuk or pulang)
      const newAbsensi: Partial<Absensi> = {
        id: absensiId,
        muridId: murid.id,
        tanggal: today,
        kelasId: kelasId, // Use kelasId (could be 'santri' for santri without kelasId)
        method: 'qr',
        keteranganAbsensi: 'Hadir',
        tahunAjaranId: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
        statusAbsen: statusAbsen,
      };

      if (tipeAbsen === 'masuk') {
        newAbsensi.jamMasuk = now;
        newAbsensi.statusMasuk = statusAbsen === 'terlambat' ? 'terlambat' : 'tepat_waktu';
        // Legacy fields for backward compatibility
        newAbsensi.tipeAbsen = 'masuk';
        newAbsensi.status = 'hadir';
        newAbsensi.waktu = now;
      } else {
        newAbsensi.jamKeluar = now;
        newAbsensi.statusKeluar = statusAbsen === 'pulang_cepat' ? 'pulang_awal' : 'tepat_waktu';
        // Legacy fields for backward compatibility
        newAbsensi.tipeAbsen = 'pulang';
        newAbsensi.status = 'hadir';
        newAbsensi.waktu = now;
      }

      const createResponse = await apiService.createAbsensi(newAbsensi);
      
      if (!createResponse.success) {
        console.error('Gagal create absensi:', createResponse.message);
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: murid.name,
          tipeUser: 'Murid',
          tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
          timestamp: timeString,
          status: 'gagal',
        };
        playSound('error');

        const scanResult: ScanResult = {
          user: muridWithKelas,
          role: 'murid',
          tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
          status: 'gagal',
          timestamp: timeString,
          statusMessage: 'Gagal menyimpan absensi',
          isError: true,
        };

        return { logEntry, scanResult };
      }

      // Update local state
      const createdAbsensi: Absensi = {
        ...newAbsensi as Absensi,
        createdAt: now,
        updatedAt: now,
      };
      onSetAbsensi([...absensi, createdAbsensi]);
    }
  } catch (error: any) {
    console.error('Error processing murid scan:', error);
    const logEntry: ScanLogEntry = {
      id: `scan-${Date.now()}`,
      namaUser: murid.name,
      tipeUser: 'Murid',
      tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
      timestamp: timeString,
      status: 'gagal',
    };
    playSound('error');

    const scanResult: ScanResult = {
      user: muridWithKelas,
      role: 'murid',
      tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
      status: 'gagal',
      timestamp: timeString,
      statusMessage: `Error: ${error.message || 'Gagal memproses absensi'}`,
      isError: true,
    };

    return { logEntry, scanResult };
  }

  const logEntry: ScanLogEntry = {
    id: `scan-${Date.now()}`,
    namaUser: murid.name,
    tipeUser: 'Murid',
    tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
    timestamp: timeString,
    status: 'berhasil',
  };
  playSound('success');

  const scanResult: ScanResult = {
    user: muridWithKelas,
    role: 'murid',
    tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
    status: statusAbsen,
    timestamp: timeString,
    statusMessage: getAbsenStatusMessage(statusAbsen, tipeAbsen),
  };

  return { logEntry, scanResult };
};
