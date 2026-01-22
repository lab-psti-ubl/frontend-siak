import { Absensi, SesiAbsensi, JadwalPelajaran, MataPelajaran, User, TahunAjaran, Kelas, PengaturanAbsen } from '../../../../types';
import { parseAdminAttendanceQRCode, parseTeacherAttendanceQRCode } from '../../../../utils/qrCodeGenerator';
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../../../../utils/notificationUtils';
import { apiService } from '../../../../services/apiService';
import { isAttendanceDayAllowed, getDayNameInIndonesian } from '../../../../utils/attendanceDayValidation';
import { ScanResult } from '../../../ui/QRScanner';
import { getLocalTimeISOString } from '../../../../utils/absensiUtils';

interface QRScanHandlerParams {
  qrData: string;
  user: User | null;
  sesiAbsensi: SesiAbsensi[];
  refreshSesiAbsensi: () => Promise<void>;
  jadwalPelajaran: JadwalPelajaran[];
  mataPelajaran: MataPelajaran[];
  tahunAjaran: TahunAjaran[];
  kelas: Kelas[];
  users: User[];
  pengaturanAbsen: PengaturanAbsen[];
  refreshAbsensi: () => Promise<void>;
  createAbsensiAPI: (absensi: Partial<Absensi>) => Promise<Absensi>;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  lastProcessedScan: {data: string, time: number} | null;
  setLastProcessedScan: (scan: {data: string, time: number} | null) => void;
  SCAN_DEBOUNCE_TIME: number;
  kelasIdOverride?: string;
}

export const handleAdminQRScanIntegrated = async ({
  qrData,
  user,
  jadwalPelajaran,
  mataPelajaran,
  tahunAjaran,
  kelas,
  users,
  pengaturanAbsen,
  refreshAbsensi,
  createAbsensiAPI,
  setRefreshKey,
  lastProcessedScan,
  setLastProcessedScan,
  SCAN_DEBOUNCE_TIME,
  kelasIdOverride
}: QRScanHandlerParams): Promise<ScanResult | null> => {
  const currentTime = Date.now();
  const currentTime24 = new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const effectiveKelasId = kelasIdOverride || user?.kelasId;

  if (lastProcessedScan &&
      lastProcessedScan.data === qrData &&
      (currentTime - lastProcessedScan.time) < SCAN_DEBOUNCE_TIME) {
    console.log('Duplicate QR scan detected, ignoring...');
    return null;
  }

  setLastProcessedScan({ data: qrData, time: currentTime });

  if (!user) {
    const result: ScanResult = {
      statusMessage: 'User tidak valid!',
      isError: true,
      errorType: 'not_registered'
    };
    showErrorNotification('Error', 'User tidak valid!');
    return result;
  }

  if (!effectiveKelasId) {
    const result: ScanResult = {
      user,
      role: 'murid',
      timestamp: currentTime24,
      statusMessage: 'Kelas Anda belum ditetapkan, hubungi admin.',
      isError: true,
      errorType: 'not_registered'
    };
    showErrorNotification('Kelas Tidak Ditemukan', 'Kelas Anda belum ditetapkan. Hubungi admin untuk mengatur kelas.');
    return result;
  }

  const today = new Date().toISOString().split('T')[0];

  const parsedAdmin = parseAdminAttendanceQRCode(qrData);
  const parsedTeacher = parseTeacherAttendanceQRCode(qrData);

  let isValidQR = false;
  let validatorName = '';

  if (parsedAdmin.isValid) {
    isValidQR = true;
    validatorName = parsedAdmin.adminName;
  } else if (parsedTeacher.isValid) {
    const wali = users.find(u => u.id === parsedTeacher.guruId && u.role === 'guru') ||
      users.find(u => parsedTeacher.nip && u.nip === parsedTeacher.nip && u.role === 'guru');

    if (!wali) {
      const result: ScanResult = {
        statusMessage: 'QR Code bukan milik guru atau guru tidak ditemukan!',
        isError: true,
        errorType: 'not_registered'
      };
      showErrorNotification('Guru Tidak Ditemukan', 'QR Code bukan milik guru atau guru tidak ditemukan!');
      return result;
    }

    const muridKelas = kelas.find(k => k.id === effectiveKelasId);
    if (!muridKelas) {
      const result: ScanResult = {
        user: user,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: 'Kelas Anda tidak ditemukan di sistem!',
        isError: true,
        errorType: 'not_registered'
      };
      showErrorNotification('Kelas Tidak Ditemukan', 'Kelas Anda tidak ditemukan di sistem!');
      return result;
    }

    if (muridKelas.waliKelasId === wali.id) {
      isValidQR = true;
      validatorName = wali.name;
    } else {
      const result: ScanResult = {
        user: user,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: 'QR Code bukan milik wali kelas Anda!',
        isError: true,
        errorType: 'not_registered'
      };
      showErrorNotification('QR Code Tidak Sesuai', 'QR Code bukan milik wali kelas Anda!');
      return result;
    }
  } else {
    const result: ScanResult = {
      statusMessage: 'QR Code tidak valid atau tidak dikenali! Gunakan QR Code Admin atau Wali Kelas Anda.',
      isError: true,
      errorType: 'not_registered'
    };
    showErrorNotification('QR Code Tidak Valid', 'QR Code tidak valid atau tidak dikenali! Gunakan QR Code Admin atau Wali Kelas Anda.');
    return result;
  }

  // Get today's absensi from API
  let todayAbsensiData: Absensi[] = [];
  try {
    const response = await apiService.getAbsensiByMuridIdAndTanggal(user.id, today);
    if (response.success && response.absensi) {
      todayAbsensiData = response.absensi;
    }
  } catch (error) {
    console.error('Error fetching today absensi:', error);
  }

  // Find today's absensi (one record per day in new structure)
  const todayAbsensi = todayAbsensiData.find((a: Absensi) =>
    a.muridId === user.id && a.tanggal === today
  );

  // Check if already checked in/out using new structure
  const alreadyCheckedIn = todayAbsensi?.jamMasuk || todayAbsensi?.statusMasuk;
  const alreadyCheckedOut = todayAbsensi?.jamKeluar || todayAbsensi?.statusKeluar;

  // Backward compatibility: check old structure
  const oldMasuk = todayAbsensiData.find((a: Absensi) =>
    a.muridId === user.id && a.tipeAbsen === 'masuk'
  );
  const oldPulang = todayAbsensiData.find((a: Absensi) =>
    a.muridId === user.id && a.tipeAbsen === 'pulang'
  );

  const hasMasuk = alreadyCheckedIn || !!oldMasuk;
  const hasPulang = alreadyCheckedOut || !!oldPulang;

  // Check if today is a school day for murid
  if (!isAttendanceDayAllowed(today, 'murid', pengaturanAbsen)) {
    const dayName = getDayNameInIndonesian(today);
    const result: ScanResult = {
      user: user,
      role: 'murid',
      timestamp: currentTime24,
      statusMessage: `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`,
      isError: true,
      errorType: 'not_registered'
    };
    showErrorNotification(
      'Absensi Tidak Diizinkan',
      `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`
    );
    return result;
  }

  let tipeAbsen: 'masuk' | 'pulang' = 'masuk';

  if (hasMasuk && !hasPulang) {
    tipeAbsen = 'pulang';
  } else if (hasMasuk && hasPulang) {
    const result: ScanResult = {
      user: user,
      role: 'murid',
      tipeAbsen: 'Sudah Terpenuhi',
      timestamp: currentTime24,
      statusMessage: 'Anda sudah melakukan absen masuk dan pulang hari ini!',
      isError: false,
      status: 'sudah_terpenuhi'
    };
    showWarningNotification('Sudah Absen', 'Anda sudah melakukan absen masuk dan pulang hari ini!');
    return result;
  }

  // Check if trying to absen masuk but current time has passed jam pulang
  if (tipeAbsen === 'masuk') {
    const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
    if (activePengaturan) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);
      
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
      
      if (currentTimeMinutes > jamPulangMinutes) {
        const result: ScanResult = {
          user: user,
          role: 'murid',
          timestamp: currentTime24,
          statusMessage: `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Anda tidak dapat melakukan absen masuk.`,
          isError: true,
          errorType: 'not_registered'
        };
        showErrorNotification(
          'Tidak Dapat Absen Masuk', 
          `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Anda tidak dapat melakukan absen masuk.`
        );
        return result;
      }
    }
  }

  // Get active tahun ajaran
  const activeTA = tahunAjaran.find(ta => ta.isActive);
  if (!activeTA) {
    const result: ScanResult = {
      user: user,
      role: 'murid',
      timestamp: currentTime24,
      statusMessage: 'Tidak ada tahun ajaran aktif',
      isError: true,
      errorType: 'not_registered'
    };
    showErrorNotification('Error', 'Tidak ada tahun ajaran aktif');
    return result;
  }

  const now = new Date();
  const nowISO = getLocalTimeISOString();
  // currentTime24 already declared at the beginning of the function

  // Use new structure: one document per day
  const newAbsensi: Partial<Absensi> = {
    id: `${today}-${effectiveKelasId}-${user.id}`, // No tipeAbsen in ID
    muridId: user.id,
    tanggal: today,
    kelasId: effectiveKelasId,
    method: 'admin-qr',
    tahunAjaranId: activeTA.id,
    semester: activeTA.semester,
    statusAbsen: 'tepat_waktu',
  };

  if (tipeAbsen === 'masuk') {
    newAbsensi.jamMasuk = nowISO;
    newAbsensi.statusMasuk = 'tepat_waktu'; // Will be calculated by backend if needed
    // Legacy fields for backward compatibility
    newAbsensi.tipeAbsen = 'masuk';
    newAbsensi.status = 'hadir';
    newAbsensi.waktu = nowISO;
  } else {
    newAbsensi.jamKeluar = nowISO;
    newAbsensi.statusKeluar = 'tepat_waktu'; // Will be calculated by backend if needed
    // Legacy fields for backward compatibility
    newAbsensi.tipeAbsen = 'pulang';
    newAbsensi.status = 'hadir';
    newAbsensi.waktu = nowISO;
  }

  try {
    await createAbsensiAPI(newAbsensi);
    await refreshAbsensi();
    
    const tipeLabel = tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang';
    const result: ScanResult = {
      user: user,
      role: 'murid',
      tipeAbsen: tipeLabel,
      status: 'tepat_waktu',
      timestamp: currentTime24,
      statusMessage: `Absen ${tipeLabel} berhasil. Status: Tepat Waktu`,
      isError: false
    };
    
    showSuccessNotification(`Absen ${tipeLabel} Berhasil!`, `${validatorName} - ${new Date().toLocaleTimeString('id-ID')}`);

    setRefreshKey(prev => prev + 1);
    return result;
  } catch (error: any) {
    console.error('Error creating absensi:', error);
    const result: ScanResult = {
      user: user,
      role: 'murid',
      tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
      timestamp: currentTime24,
      statusMessage: error.message || 'Gagal menyimpan absensi',
      isError: true,
      errorType: 'absen_failed'
    };
    showErrorNotification('Error', 'Gagal menyimpan absensi');
    return result;
  }
};

export const getKehadiranAbsensiIntegrated = (
  absensi: Absensi[],
  muridId: string,
  month: number,
  year: number
): Absensi[] => {
  return absensi.filter(a => {
    if (a.muridId !== muridId) {
      return false;
    }

    // Use new structure: one record per day
    // Check tanggal field first, then fallback to waktu for backward compatibility
    let date: Date;
    if (a.tanggal) {
      date = new Date(a.tanggal);
    } else if (a.waktu) {
      date = new Date(a.waktu);
    } else {
      return false;
    }

    if (month > 0 && year > 0) {
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    }
    return true;
  });
};

export const getAvailableMonthsYearsKehadiranIntegrated = (
  absensi: Absensi[],
  muridId: string,
  tahunAjaran?: TahunAjaran[]
): { months: number[]; years: number[]; monthsYears: Array<{month: number; year: number}> } => {
  const kehadiranAbsensi = absensi.filter(a => a.muridId === muridId);

  const monthsYearsSet = new Set<string>();

  kehadiranAbsensi.forEach(a => {
    // Use tanggal field first, then fallback to waktu for backward compatibility
    let date: Date;
    if (a.tanggal) {
      date = new Date(a.tanggal);
    } else if (a.waktu) {
      date = new Date(a.waktu);
    } else {
      return;
    }
    monthsYearsSet.add(`${date.getMonth() + 1},${date.getFullYear()}`);
  });

  // Add all months (1-12) for each year from tahunAjaran if available
  if (tahunAjaran && tahunAjaran.length > 0) {
    tahunAjaran.forEach(ta => {
      const startYear = parseInt(ta.tahun.split('/')[0]);
      const endYear = parseInt(ta.tahun.split('/')[1]);

      for (let month = 1; month <= 12; month++) {
        monthsYearsSet.add(`${month},${startYear}`);
        monthsYearsSet.add(`${month},${endYear}`);
      }
    });
  }

  const monthsYearsArray = Array.from(monthsYearsSet)
    .map(my => {
      const [month, year] = my.split(',');
      return { month: parseInt(month), year: parseInt(year) };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

  const months = [...new Set(monthsYearsArray.map(my => my.month))].sort((a, b) => a - b);
  const years = [...new Set(monthsYearsArray.map(my => my.year))].sort((a, b) => a - b);

  return { months, years, monthsYears: monthsYearsArray };
};

export const getTodayKehadiranStatsIntegrated = (
  absensi: Absensi[],
  muridId: string
): { isMasuk: boolean; isPulang: boolean; waktuMasuk?: string; waktuPulang?: string } => {
  const today = new Date().toISOString().split('T')[0];

  // Find today's absensi (one record per day in new structure)
  const todayAbsensi = absensi.find(a =>
    a.muridId === muridId && a.tanggal === today
  );

  // Use new structure first
  if (todayAbsensi) {
    const isMasuk = !!(todayAbsensi.jamMasuk || todayAbsensi.statusMasuk);
    const isPulang = !!(todayAbsensi.jamKeluar || todayAbsensi.statusKeluar);
    
    let waktuMasuk: string | undefined;
    let waktuPulang: string | undefined;

    if (todayAbsensi.jamMasuk) {
      waktuMasuk = new Date(todayAbsensi.jamMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else if (todayAbsensi.waktu && todayAbsensi.tipeAbsen === 'masuk') {
      // Backward compatibility
      waktuMasuk = new Date(todayAbsensi.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    if (todayAbsensi.jamKeluar) {
      waktuPulang = new Date(todayAbsensi.jamKeluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else if (todayAbsensi.waktu && todayAbsensi.tipeAbsen === 'pulang') {
      // Backward compatibility
      waktuPulang = new Date(todayAbsensi.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    return { isMasuk, isPulang, waktuMasuk, waktuPulang };
  }

  // Backward compatibility: check old structure (separate records)
  const todayAbsensiOld = absensi.filter(a =>
    a.muridId === muridId &&
    a.tipeAbsen !== undefined &&
    (a.waktu?.startsWith(today) || a.tanggal === today)
  );

  const masuk = todayAbsensiOld.find(a => a.tipeAbsen === 'masuk');
  const pulang = todayAbsensiOld.find(a => a.tipeAbsen === 'pulang');

  return {
    isMasuk: !!masuk,
    isPulang: !!pulang,
    waktuMasuk: masuk?.waktu ? new Date(masuk.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined,
    waktuPulang: pulang?.waktu ? new Date(pulang.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined,
  };
};

export const getAbsensiDetailForDisplay = (
  absensi: Absensi[],
  muridId: string,
  selectedDate: string
): { masuk?: Absensi; pulang?: Absensi; status: 'hadir' | 'izin' | 'sakit' | 'alfa' | null } => {
  // Find day's absensi (one record per day in new structure)
  const dayAbsensi = absensi.find(a =>
    a.muridId === muridId && a.tanggal === selectedDate
  );

  if (dayAbsensi) {
    // New structure: one record contains both masuk and pulang
    // Create virtual objects for compatibility
    const masuk: Absensi | undefined = dayAbsensi.jamMasuk || dayAbsensi.statusMasuk ? {
      ...dayAbsensi,
      tipeAbsen: 'masuk',
      waktu: dayAbsensi.jamMasuk || dayAbsensi.waktu || '',
      status: dayAbsensi.statusMasuk === 'izin' ? 'izin' :
              dayAbsensi.statusMasuk === 'sakit' ? 'sakit' :
              dayAbsensi.statusMasuk === 'alfa' ? 'alfa' :
              dayAbsensi.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
    } : undefined;

    const pulang: Absensi | undefined = dayAbsensi.jamKeluar || dayAbsensi.statusKeluar ? {
      ...dayAbsensi,
      tipeAbsen: 'pulang',
      waktu: dayAbsensi.jamKeluar || dayAbsensi.waktu || '',
      status: dayAbsensi.statusKeluar === 'izin' ? 'izin' :
              dayAbsensi.statusKeluar === 'sakit' ? 'sakit' :
              dayAbsensi.statusKeluar === 'alfa' ? 'alfa' :
              dayAbsensi.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
    } : undefined;

    let status: 'hadir' | 'izin' | 'sakit' | 'alfa' | null = null;
    if (dayAbsensi.statusMasuk) {
      if (dayAbsensi.statusMasuk === 'izin') status = 'izin';
      else if (dayAbsensi.statusMasuk === 'sakit') status = 'sakit';
      else if (dayAbsensi.statusMasuk === 'alfa') status = 'alfa';
      else if (dayAbsensi.statusMasuk === 'tepat_waktu' || dayAbsensi.statusMasuk === 'terlambat' || dayAbsensi.statusMasuk === 'hadir') status = 'hadir';
    } else if (dayAbsensi.status) {
      status = dayAbsensi.status as any;
    }

    return { masuk, pulang, status };
  }

  // Backward compatibility: check old structure (separate records)
  const dayAbsensiOld = absensi.filter(a =>
    a.muridId === muridId &&
    a.tipeAbsen !== undefined &&
    (a.waktu?.startsWith(selectedDate) || a.tanggal === selectedDate)
  );

  const masukOld = dayAbsensiOld.find(a => a.tipeAbsen === 'masuk');
  const pulangOld = dayAbsensiOld.find(a => a.tipeAbsen === 'pulang');

  let status: 'hadir' | 'izin' | 'sakit' | 'alfa' | null = null;
  if (masukOld?.status) {
    status = masukOld.status as any;
  }

  return {
    masuk: masukOld,
    pulang: pulangOld,
    status,
  };
};

export const getAbsenMasukStatus = (
  waktuAbsen: string,
  pengaturanAbsen: PengaturanAbsen | undefined
): 'hadir' | 'terlambat' => {
  if (!pengaturanAbsen) return 'hadir';

  const [jamMasuk, menitMasuk] = pengaturanAbsen.jamMasuk.split(':').map(Number);
  const [jamAbsen, menitAbsen] = waktuAbsen.split(':').map(Number);

  const jamMasukMs = jamMasuk * 60 + menitMasuk;
  const jamAbsenMs = jamAbsen * 60 + menitAbsen;

  const batasTerlambat = jamMasukMs + pengaturanAbsen.toleransiMasuk;

  return jamAbsenMs <= batasTerlambat ? 'hadir' : 'terlambat';
};

export const getAbsenPulangStatus = (
  waktuAbsen: string,
  pengaturanAbsen: PengaturanAbsen | undefined
): 'hadir' | 'pulang_cepat' => {
  if (!pengaturanAbsen) return 'hadir';

  const [jamPulang, menitPulang] = pengaturanAbsen.jamPulang.split(':').map(Number);
  const [jamAbsen, menitAbsen] = waktuAbsen.split(':').map(Number);

  const jamPulangMs = jamPulang * 60 + menitPulang;
  const jamAbsenMs = jamAbsen * 60 + menitAbsen;

  const batasPulangAwal = jamPulangMs - pengaturanAbsen.toleransiPulang;

  return jamAbsenMs >= batasPulangAwal ? 'hadir' : 'pulang_cepat';
};

export const determineKeterangan = (
  masukAbsensi: Absensi | null,
  pulangAbsensi: Absensi | null,
  pengaturanAbsen: PengaturanAbsen | undefined
): 'Hadir' | 'Izin' | 'Sakit' | 'Bolos' | 'Dispen' | 'Alfa' | '-' => {
  if (!masukAbsensi && !pulangAbsensi) {
    return '-';
  }

  if (!masukAbsensi) {
    return 'Bolos';
  }

  // Check statusMasuk first (new structure), then fallback to status (old structure)
  const masukStatus = masukAbsensi.statusMasuk || masukAbsensi.status;
  
  if (masukStatus === 'izin') {
    return 'Izin';
  }

  if (masukStatus === 'sakit') {
    return 'Sakit';
  }

  if (masukStatus === 'alfa') {
    return 'Bolos';
  }

  if (!pulangAbsensi) {
    return '-';
  }

  // Check statusKeluar first (new structure), then fallback to status (old structure)
  const pulangStatus = pulangAbsensi.statusKeluar || pulangAbsensi.status;

  if (pulangStatus === 'izin') {
    return 'Dispen';
  }

  if (pulangStatus === 'sakit') {
    return 'Dispen';
  }

  if (pulangStatus === 'alfa') {
    return 'Bolos';
  }

  return 'Hadir';
};
