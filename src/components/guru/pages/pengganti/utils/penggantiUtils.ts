import { JadwalPelajaran, IzinGuru, Guru } from '../../../../../types';
import { getHariFromDate } from '../../izin-guru/utils/izinGuruUtils';
import { getTodayIndonesia, getCurrentTimeIndonesia } from '../../../../../utils/absensiUtils';

export const getActiveIzinForSubstitute = (userId: string, izinGuru: IzinGuru[] = []): IzinGuru | null => {
  const today = getTodayIndonesia();
  const currentTime = getCurrentTimeIndonesia();

  return izinGuru.find(i => {
    // Check if user is assigned as substitute
    const isAssigned = i.guruPenggantiList?.some(gp => gp.guruPenggantiId === userId);
    if (!isAssigned || i.status !== 'diterima') return false;
    
    // For izin_dispen, check if today matches tanggalMulai and current time is within jamMulai-jamSelesai
    if (i.jenis === 'izin_dispen') {
      if (i.tanggalMulai === today && i.jamMulai && i.jamSelesai) {
        return currentTime >= i.jamMulai && currentTime <= i.jamSelesai;
      }
      return false;
    }
    
    // For other types, check if today is within tanggalMulai-tanggalSelesai
    return i.tanggalMulai <= today && i.tanggalSelesai >= today;
  }) || null;
};

export const isJadwalFinishedOnDate = (jadwal: JadwalPelajaran, tanggal: string): boolean => {
  const today = getTodayIndonesia();
  if (tanggal !== today) {
    return false;
  }
  const currentTime = getCurrentTimeIndonesia();
  return currentTime >= jadwal.jamSelesai;
};

export const getSchedulesForSubstitute = (
  userId: string, 
  izin: IzinGuru | null,
  jadwalPelajaran: JadwalPelajaran[] = [],
  activeTahunAjaran: any = null
): JadwalPelajaran[] => {
  if (!izin || !izin.guruPenggantiList || izin.guruPenggantiList.length === 0) return [];
  if (!activeTahunAjaran) return [];

  // Filter guruPenggantiList to only include assignments for this replacement teacher
  const assignedSchedules = izin.guruPenggantiList.filter(gp => gp.guruPenggantiId === userId);

  if (assignedSchedules.length === 0) return [];

  // Get all assigned jadwalIds for this replacement teacher
  const assignedJadwalIds = new Set(assignedSchedules.map(gp => gp.jadwalId));

  const originalTeacher = izin.guruId;
  const startDate = new Date(izin.tanggalMulai);
  const endDate = new Date(izin.tanggalSelesai);

  const schedules: JadwalPelajaran[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const hari = getHariFromDate(dateStr);

    // Filter schedules that:
    // 1. Are in the assigned jadwalIds for this replacement teacher
    // 2. Belong to the original teacher
    // 3. Match the day
    // 4. Match tahun ajaran and semester
    // 5. Haven't finished yet (jam selesai > current time for today)
    const daySchedules = jadwalPelajaran.filter(j => {
      const isAssigned = assignedJadwalIds.has(j.id);
      const matchesTeacher = j.guruId === originalTeacher;
      const matchesDay = j.hari === hari;
      const matchesTahunAjaran = j.tahunAjaran === activeTahunAjaran.tahun;
      const matchesSemester = j.semester === activeTahunAjaran.semester;
      const notFinished = !isJadwalFinishedOnDate(j, dateStr);

      return isAssigned && matchesTeacher && matchesDay && matchesTahunAjaran && matchesSemester && notFinished;
    });

    schedules.push(...daySchedules);
  }

  return schedules;
};

export const getGroupedSchedulesByDate = (
  userId: string, 
  izin: IzinGuru | null,
  jadwalPelajaran: JadwalPelajaran[] = [],
  activeTahunAjaran: any = null
): Map<string, JadwalPelajaran[]> => {
  if (!izin || !izin.guruPenggantiList || izin.guruPenggantiList.length === 0) return new Map();
  if (!activeTahunAjaran) return new Map();

  // Filter guruPenggantiList to only include assignments for this replacement teacher
  const assignedSchedules = izin.guruPenggantiList.filter(gp => gp.guruPenggantiId === userId);

  if (assignedSchedules.length === 0) return new Map();

  // Get all assigned jadwalIds for this replacement teacher
  const assignedJadwalIds = new Set(assignedSchedules.map(gp => gp.jadwalId));

  const originalTeacher = izin.guruId;
  const startDate = new Date(izin.tanggalMulai);
  const endDate = new Date(izin.tanggalSelesai);

  const groupedSchedules = new Map<string, JadwalPelajaran[]>();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const hari = getHariFromDate(dateStr);

    // Filter schedules that:
    // 1. Are in the assigned jadwalIds for this replacement teacher
    // 2. Belong to the original teacher
    // 3. Match the day
    // 4. Match tahun ajaran and semester
    // 5. Haven't finished yet (jam selesai > current time for today)
    const daySchedules = jadwalPelajaran.filter(j => {
      const isAssigned = assignedJadwalIds.has(j.id);
      const matchesTeacher = j.guruId === originalTeacher;
      const matchesDay = j.hari === hari;
      const matchesTahunAjaran = j.tahunAjaran === activeTahunAjaran.tahun;
      const matchesSemester = j.semester === activeTahunAjaran.semester;
      const notFinished = !isJadwalFinishedOnDate(j, dateStr);

      return isAssigned && matchesTeacher && matchesDay && matchesTahunAjaran && matchesSemester && notFinished;
    });

    if (daySchedules.length > 0) {
      groupedSchedules.set(dateStr, daySchedules);
    }
  }

  return groupedSchedules;
};

export const getGuruNameById = (guruId: string, gurus: Guru[] = []): string => {
  const guru = gurus.find(u => u.id === guruId && u.role === 'guru');
  return guru?.name || 'Tidak diketahui';
};
