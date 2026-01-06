import { Kelas, JadwalPelajaran, SesiAbsensi, User, MataPelajaran } from '../types';

export type MonitoringStatus = 'jadwal_kosong' | 'belum_ada_guru' | 'sudah_ada_guru' | 'sesi_ditutup';

export interface KelasMonitoring {
  kelasId: string;
  kelasName: string;
  currentStatus: MonitoringStatus;
  jadwalInfo: {
    mataPelajaranName?: string;
    guruName?: string;
    jamMulai?: string;
    jamSelesai?: string;
  } | null;
  sesiInfo: {
    jamBuka?: string;
    jamTutup?: string;
  } | null;
  allJadwalHariIni?: Array<{
    mataPelajaranName?: string;
    guruName?: string;
    jamMulai?: string;
    jamSelesai?: string;
  }>;
}

function getCurrentDayInIndonesian(): string {
  const days: Record<number, string> = {
    0: 'minggu',
    1: 'senin',
    2: 'selasa',
    3: 'rabu',
    4: 'kamis',
    5: 'jumat',
    6: 'sabtu',
  };
  return days[new Date().getDay()];
}

function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isTimeBetween(timeStr: string, startTime: string, endTime: string): boolean {
  const [timeHour, timeMin] = timeStr.split(':').map(Number);
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const timeInSeconds = timeHour * 3600 + timeMin * 60;
  const startInSeconds = startHour * 3600 + startMin * 60;
  const endInSeconds = endHour * 3600 + endMin * 60;

  return timeInSeconds >= startInSeconds && timeInSeconds <= endInSeconds;
}

export function getKelasMonitoringStatus(
  kelasId: string,
  kelas: Kelas[],
  jadwal: JadwalPelajaran[],
  sesiAbsensi: SesiAbsensi[],
  users: User[],
  tahunAjaran: string,
  semester: number,
  mataPelajaran: MataPelajaran[] = []
): KelasMonitoring {
  const currentDay = getCurrentDayInIndonesian();
  const currentTime = getCurrentTimeString();
  const today = new Date().toISOString().split('T')[0];

  const kelasData = kelas.find(k => k.id === kelasId);
  const jadwalForDay = jadwal.filter(
    j =>
      j.kelasId === kelasId &&
      j.hari === currentDay &&
      j.tahunAjaran === tahunAjaran &&
      j.semester === semester
  );

  const monitoring: KelasMonitoring = {
    kelasId,
    kelasName: kelasData?.name || 'Unknown',
    currentStatus: 'jadwal_kosong',
    jadwalInfo: null,
    sesiInfo: null,
    allJadwalHariIni: jadwalForDay.map(j => {
      const guru = users.find(u => u.id === j.guruId);
      const mapel = mataPelajaran.find(m => m.id === j.mataPelajaranId);
      return {
        mataPelajaranName: mapel?.name || j.mataPelajaranId,
        guruName: guru?.name,
        jamMulai: j.jamMulai,
        jamSelesai: j.jamSelesai,
      };
    }),
  };

  if (jadwalForDay.length === 0) {
    return monitoring;
  }

  const currentJadwal = jadwalForDay.find(j =>
    isTimeBetween(currentTime, j.jamMulai, j.jamSelesai)
  );

  if (!currentJadwal) {
    return monitoring;
  }

  const guru = users.find(u => u.id === currentJadwal.guruId);
  const mapel = mataPelajaran.find(m => m.id === currentJadwal.mataPelajaranId);

  monitoring.jadwalInfo = {
    guruName: guru?.name,
    jamMulai: currentJadwal.jamMulai,
    jamSelesai: currentJadwal.jamSelesai,
    mataPelajaranName: mapel?.name || currentJadwal.mataPelajaranId,
  };

  const currentSesi = sesiAbsensi.find(
    s =>
      s.jadwalId === currentJadwal.id &&
      s.tanggal === today
  );

  if (!currentSesi) {
    monitoring.currentStatus = 'belum_ada_guru';
    return monitoring;
  }

  if (currentSesi.status === 'ditutup') {
    monitoring.currentStatus = 'sesi_ditutup';
    monitoring.sesiInfo = {
      jamBuka: currentSesi.jamBuka,
      jamTutup: currentSesi.jamTutup,
    };
    return monitoring;
  }

  if (currentSesi.status === 'dibuka') {
    monitoring.currentStatus = 'sudah_ada_guru';
    monitoring.sesiInfo = {
      jamBuka: currentSesi.jamBuka,
    };
    return monitoring;
  }

  return monitoring;
}

export function getStatusBadgeColor(status: MonitoringStatus): string {
  switch (status) {
    case 'jadwal_kosong':
      return 'bg-gray-100 text-gray-800';
    case 'belum_ada_guru':
      return 'bg-yellow-100 text-yellow-800';
    case 'sudah_ada_guru':
      return 'bg-emerald-100 text-emerald-800';
    case 'sesi_ditutup':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusDisplay(status: MonitoringStatus): string {
  switch (status) {
    case 'jadwal_kosong':
      return 'Jadwal Kosong';
    case 'belum_ada_guru':
      return 'Belum ada Guru';
    case 'sudah_ada_guru':
      return 'Sudah ada Guru';
    case 'sesi_ditutup':
      return 'Sesi Pelajaran Ditutup';
    default:
      return 'Unknown';
  }
}

export function getStatusIcon(status: MonitoringStatus): string {
  switch (status) {
    case 'jadwal_kosong':
      return '📋';
    case 'belum_ada_guru':
      return '⏳';
    case 'sudah_ada_guru':
      return '✅';
    case 'sesi_ditutup':
      return '🔒';
    default:
      return '❓';
  }
}
