import { JadwalPelajaran, MataPelajaran, User, SesiAbsensi, Absensi } from '../../../../../../types';

export const hariOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

export const hariLabels = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
  minggu: 'Minggu',
};

export const isToday = (hari: string): boolean => {
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
  return hari === today;
};

export const getMapelName = (mataPelajaran: MataPelajaran[], mapelId: string) => {
  return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
};

export const getGuruName = (users: User[], guruId: string) => {
  return users.find(u => u.id === guruId)?.name || 'Unknown';
};

export const groupSchedulesByDay = (jadwalKelas: JadwalPelajaran[]) => {
  return hariOrder.reduce((acc, hari) => {
    acc[hari] = jadwalKelas
      .filter(j => j.hari === hari)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    return acc;
  }, {} as Record<string, JadwalPelajaran[]>);
};

export const getAttendanceHistory = (
  jadwalId: string,
  dateFilter: { start: string; end: string },
  sesiAbsensi: SesiAbsensi[],
  absensi: Absensi[],
  users: User[],
  kelasWali?: string
) => {
  const startDate = new Date(dateFilter.start);
  const endDate = new Date(dateFilter.end);

  const sessions = sesiAbsensi.filter(s => {
    const sesiDate = new Date(s.tanggal);
    return s.jadwalId === jadwalId && sesiDate >= startDate && sesiDate <= endDate;
  });

  return sessions.map(sesi => {
    const attendanceList = absensi.filter(a => a.sesiId === sesi.id);
    const muridKelas = users.filter(u => u.role === 'murid' && u.kelasId === kelasWali);

    const stats = {
      hadir: attendanceList.filter(a => a.status === 'hadir').length,
      izin: attendanceList.filter(a => a.status === 'izin').length,
      sakit: attendanceList.filter(a => a.status === 'sakit').length,
      alfa: muridKelas.length - attendanceList.length,
      total: muridKelas.length,
      attendanceList: attendanceList
    };

    return {
      tanggal: sesi.tanggal,
      jamBuka: sesi.jamBuka,
      jamTutup: sesi.jamTutup,
      status: sesi.status,
      ...stats,
      sesiId: sesi.id
    };
  }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
};

export const getDetailedAttendanceForDate = (
  jadwalId: string,
  tanggal: string,
  sesiAbsensi: SesiAbsensi[],
  absensi: Absensi[],
  users: User[],
  kelasWali?: string
) => {
  const session = sesiAbsensi.find(s => s.jadwalId === jadwalId && s.tanggal === tanggal);
  const muridKelas = users.filter(u => u.role === 'murid' && u.kelasId === kelasWali);

  return muridKelas.map(murid => {
    const attendance = session ? absensi.find(a => a.sesiId === session.id && a.muridId === murid.id) : null;
    return {
      murid,
      attendance: attendance || null,
      status: attendance?.status || 'alfa'
    };
  });
};

export const getJadwalStats = (
  jadwalId: string,
  dateFilter: { start: string; end: string },
  sesiAbsensi: SesiAbsensi[],
  absensi: Absensi[],
  users: User[],
  kelasWali?: string
) => {
  const history = getAttendanceHistory(jadwalId, dateFilter, sesiAbsensi, absensi, users, kelasWali);
  const totalSesi = history.length;
  const totalHadir = history.reduce((sum, h) => sum + h.hadir, 0);
  const totalMurid = history.reduce((sum, h) => sum + h.total, 0);
  const attendanceRate = totalMurid > 0 ? ((totalHadir / totalMurid) * 100).toFixed(1) : '0';

  return {
    totalSesi,
    totalHadir,
    totalMurid,
    attendanceRate: parseFloat(attendanceRate)
  };
};
