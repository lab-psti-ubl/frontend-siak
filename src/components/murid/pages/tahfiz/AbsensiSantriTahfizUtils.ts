import { TahfizSchedule, SesiAbsensiTahfiz, AbsensiPelajaran, User, KelasTahfiz } from '../../../../types';

export const getJadwalTahfizInfo = (
  jadwalId: string,
  jadwalTahfiz: TahfizSchedule[],
  kelasTahfiz: KelasTahfiz[],
  ustadz: User[]
) => {
  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
  if (!jadwal) return { mapel: 'Tahfiz Qur\'an', ustadz: 'Unknown', waktu: 'Unknown', kelas: 'Unknown' };

  const kelas = kelasTahfiz.find(k => k.id === jadwal.kelasId);
  const kelasName = kelas?.namaKelas || 'Unknown';
  const ustadzName = kelas ? ustadz.find(u => u.id === kelas.ustadzId)?.name || 'Unknown' : 'Unknown';
  const waktu = `${jadwal.jamMulai} - ${jadwal.jamSelesai}`;

  return { mapel: 'Tahfiz Qur\'an', ustadz: ustadzName, waktu, kelas: kelasName };
};

export const getAttendanceStatusTahfiz = (
  sesiId: string,
  userId?: string,
  sesiAbsensiTahfiz?: SesiAbsensiTahfiz[]
): AbsensiPelajaran | undefined => {
  if (!userId || !sesiAbsensiTahfiz) return undefined;

  const session = sesiAbsensiTahfiz.find(s => s.id === sesiId);
  if (!session || !session.dataAbsensi) return undefined;

  return session.dataAbsensi.find(a => a.muridId === userId);
};

export const getFilteredSessionsTahfiz = (
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[],
  mySchedules: TahfizSchedule[],
  selectedMonth: number,
  selectedYear: number
) => {
  const filteredSessions = sesiAbsensiTahfiz.filter(s => {
    const sesiDate = new Date(s.tanggal);
    const sesiMonth = sesiDate.getMonth() + 1;
    const sesiYear = sesiDate.getFullYear();

    const belongsToMySchedule = mySchedules.some(j => j.id === s.jadwalId);

    return belongsToMySchedule &&
           sesiMonth === selectedMonth &&
           sesiYear === selectedYear;
  });

  return filteredSessions.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
};

export const getAvailableMonthsYearsTahfiz = (currentYear: string) => {
  const year = parseInt(currentYear);
  const currentDate = new Date();
  
  // Generate months for the current year
  const months: number[] = [];
  const years: number[] = [year];
  
  // Add months 1-12 for the year
  for (let i = 1; i <= 12; i++) {
    months.push(i);
  }
  
  const monthsYears = months.map(month => ({ year, month }));
  
  return { months, years, monthsYears };
};

