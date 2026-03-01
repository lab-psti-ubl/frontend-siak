import { PengaturanAbsen, Guru, Murid, AbsensiGuru, Absensi } from '../../../../../types';

export interface ScanResult {
  user: any;
  role: string;
  tipeAbsen: string;
  status: string;
  timestamp: string;
  statusMessage: string;
  isError?: boolean;
  errorType?: 'not_registered' | 'absen_failed' | 'early_departure';
  departureTime?: string;
  izinInfo?: {
    jenis: 'izin' | 'sakit' | 'cuti';
    alasan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
  } | null;
  /** Status masuk/keluar dari record absensi guru (alfa, tidak_masuk, tidak_keluar) agar modal tidak menampilkan "sudah absen" jika status tidak valid. */
  statusMasuk?: string;
  statusKeluar?: string;
}

export interface ScanLogEntry {
  id: string;
  namaUser: string;
  tipeUser: string;
  tipeAbsen: string;
  timestamp: string;
  status: string;
}

export const getActivePengaturanAbsen = (pengaturanAbsen: PengaturanAbsen[]): PengaturanAbsen | null => {
  const active = pengaturanAbsen.find(p => p.isActive);
  return active || null;
};

// Re-export from shared utility
export { isAttendanceDayAllowed } from '../../../../../utils/attendanceDayValidation';

export const calculateAttendanceStatus = (attendanceTime: string, tipeAbsen: 'masuk' | 'pulang' | 'keluar', pengaturanAbsen: PengaturanAbsen[]): string => {
  const pengaturan = getActivePengaturanAbsen(pengaturanAbsen);
  if (!pengaturan) return 'tepat_waktu';

  const [attendanceHour, attendanceMin] = attendanceTime.split(':').map(Number);
  const attendanceDate = new Date();
  attendanceDate.setHours(attendanceHour, attendanceMin, 0, 0);

  if (tipeAbsen === 'masuk') {
    const [jamMasukHour, jamMasukMin] = pengaturan.jamMasuk.split(':').map(Number);
    const jamMasukDate = new Date();
    jamMasukDate.setHours(jamMasukHour, jamMasukMin, 0, 0);

    const batasTerlambat = new Date(jamMasukDate.getTime() + pengaturan.toleransiMasuk * 60000);

    if (attendanceDate > batasTerlambat) {
      return 'terlambat';
    }
    return 'tepat_waktu';
  } else if (tipeAbsen === 'pulang' || tipeAbsen === 'keluar') {
    const [jamPulangHour, jamPulangMin] = pengaturan.jamPulang.split(':').map(Number);
    const jamPulangDate = new Date();
    jamPulangDate.setHours(jamPulangHour, jamPulangMin, 0, 0);

    const batasPulangAwal = new Date(jamPulangDate.getTime() - pengaturan.toleransiPulang * 60000);

    if (attendanceDate < batasPulangAwal) {
      return 'pulang_cepat';
    }
    return 'tepat_waktu';
  }

  return 'tepat_waktu';
};

export const getUserInfo = (scannedData: string, users: any[]): { user: any; role: string } | null => {
  const guru = users.find((u: any) => (u.rfidGuid === scannedData || u.nip === scannedData) && u.role === 'guru' && u.isActive !== false);
  if (guru) return { user: guru, role: 'guru' };

  // Check murid and santri (santri also has role 'murid' but may have isFromMurid flag)
  const murid = users.find((u: any) => 
    (u.rfidGuid === scannedData || u.nisn === scannedData) && 
    u.role === 'murid' && 
    u.isActive !== false
  );
  if (murid) return { user: murid, role: 'murid' };

  return null;
};

export const getAbsenStatusMessage = (status: string, tipeAbsen: string): string => {
  if (status === 'sudah_terpenuhi') {
    return 'Absen hari ini sudah terpenuhi';
  }
  if (status === 'tepat_waktu' && tipeAbsen === 'masuk') {
    return 'Berhasil Absen Masuk Tepat Waktu';
  }
  if (status === 'terlambat' && tipeAbsen === 'masuk') {
    return 'Berhasil Absen Masuk Terlambat';
  }
  // Saat sistem pulang cepat aktif, absen pulang yang berhasil ditampilkan sebagai "Berhasil Absen Pulang" (bukan "Pulang Cepat")
  if (status === 'pulang_cepat' && (tipeAbsen === 'pulang' || tipeAbsen === 'keluar')) {
    return 'Berhasil Absen Pulang';
  }
  if (status === 'tepat_waktu' && (tipeAbsen === 'pulang' || tipeAbsen === 'keluar')) {
    return 'Berhasil Absen Pulang';
  }
  return 'Absen Berhasil';
};

export const generateSpeechMessage = (namaUser: string, status: string, tipeAbsen: string, errorType?: 'not_registered' | 'absen_failed' | 'early_departure', izinInfo?: { jenis: 'izin' | 'sakit' | 'cuti' } | null): string => {
  let message = '';

  // Normalize tipeAbsen to lowercase for comparison
  const normalizedTipeAbsen = tipeAbsen.toLowerCase();

  // Check if there's izin/sakit info
  if (izinInfo) {
    if (izinInfo.jenis === 'izin') {
      message = `${namaUser} sedang izin hari ini`;
    } else if (izinInfo.jenis === 'sakit') {
      message = `${namaUser} sedang sakit hari ini`;
    } else if (izinInfo.jenis === 'cuti') {
      message = `${namaUser} sedang cuti hari ini`;
    }
    return message;
  }

  if (errorType === 'not_registered') {
    message = 'Kartu Tidak Terdaftar';
  } else if (errorType === 'absen_failed') {
    message = 'Absen Gagal';
  } else if (errorType === 'early_departure') {
    message = 'Belum Waktunya Pulang, Silahkan Tunggu';
  } else if (status === 'sudah_terpenuhi') {
    message = `${namaUser} sudah Absen Hari Ini`;
  } else if (status === 'tepat_waktu' && normalizedTipeAbsen === 'masuk') {
    message = `${namaUser} sudah Masuk Tepat Waktu`;
  } else if (status === 'terlambat' && normalizedTipeAbsen === 'masuk') {
    message = `${namaUser} sudah Masuk Terlambat`;
  } else if (status === 'pulang_cepat' && (normalizedTipeAbsen === 'pulang' || tipeAbsen === 'keluar')) {
    message = `${namaUser} sudah Absen Pulang`;
  } else if (status === 'tepat_waktu' && (normalizedTipeAbsen === 'pulang' || tipeAbsen === 'keluar')) {
    message = `${namaUser} sudah Absen Pulang`;
  }

  return message;
};

export const playSound = (type: 'success' | 'error') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (type === 'success') {
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } else {
    oscillator.frequency.value = 400;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }
};
