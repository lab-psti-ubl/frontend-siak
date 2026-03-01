import { TahfizSchedule, SesiAbsensiTahfiz, User } from '../types';
import { getTodayIndonesia, getCurrentTimeIndonesia } from './absensiUtils';

export type TahfizClass = {
  id: string;
  namaKelas: string;
  ruangan: string;
  ustadzId: string;
  santriIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type MonitoringStatusTahfiz = 'jadwal_kosong' | 'belum_ada_guru' | 'sudah_ada_guru' | 'sesi_ditutup';

export interface KelasTahfizMonitoring {
  kelasId: string;
  kelasName: string;
  currentStatus: MonitoringStatusTahfiz;
  jadwalInfo: {
    ustadzName?: string;
    jamMulai?: string;
    jamSelesai?: string;
  } | null;
  sesiInfo: {
    jamBuka?: string;
    jamTutup?: string;
  } | null;
  allJadwalHariIni?: Array<{
    ustadzName?: string;
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
  return getCurrentTimeIndonesia();
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

export function getKelasTahfizMonitoringStatus(
  kelasId: string,
  kelasTahfiz: TahfizClass[],
  jadwalTahfiz: TahfizSchedule[],
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[],
  users: User[]
): KelasTahfizMonitoring {
  const currentDay = getCurrentDayInIndonesian();
  const currentTime = getCurrentTimeString();
  const today = getTodayIndonesia();

  const kelasData = kelasTahfiz.find(k => k.id === kelasId);
  const ustadz = kelasData ? users.find(u => u.id === kelasData.ustadzId) : undefined;

  const jadwalForDay = jadwalTahfiz.filter(
    j => j.kelasId === kelasId && j.hari === currentDay
  );

  const monitoring: KelasTahfizMonitoring = {
    kelasId,
    kelasName: kelasData?.namaKelas || 'Unknown',
    currentStatus: 'jadwal_kosong',
    jadwalInfo: null,
    sesiInfo: null,
    allJadwalHariIni: jadwalForDay.map(j => ({
      ustadzName: ustadz?.name,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
    })),
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

  monitoring.jadwalInfo = {
    ustadzName: ustadz?.name,
    jamMulai: currentJadwal.jamMulai,
    jamSelesai: currentJadwal.jamSelesai,
  };

  const currentSesi = sesiAbsensiTahfiz.find(
    s => s.jadwalId === currentJadwal.id && s.tanggal === today
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

export function getStatusDisplayTahfiz(status: MonitoringStatusTahfiz): string {
  switch (status) {
    case 'jadwal_kosong':
      return 'Jadwal Kosong';
    case 'belum_ada_guru':
      return 'Belum ada Ustaz/ah';
    case 'sudah_ada_guru':
      return 'Sudah ada Ustaz/ah';
    case 'sesi_ditutup':
      return 'Sesi Tahfiz Ditutup';
    default:
      return 'Unknown';
  }
}
