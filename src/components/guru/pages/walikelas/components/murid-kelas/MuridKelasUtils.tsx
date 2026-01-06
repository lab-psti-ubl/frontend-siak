import { User, Kelas, JadwalPelajaran, SesiAbsensi, Absensi, MataPelajaran, TahunAjaran } from '../../../../../../types';

export const getKelasForTahunAjaran = (
  currentKelasId: string,
  targetTahunAjaran: string,
  kelas: Kelas[],
  activeTahunAjaran?: TahunAjaran
) => {
  const currentKelas = kelas.find(k => k.id === currentKelasId);
  if (!currentKelas) return null;

  if (targetTahunAjaran === activeTahunAjaran?.tahun) {
    return currentKelas;
  }

  const currentYear = parseInt(activeTahunAjaran?.tahun.split('/')[0] || '2024');
  const targetYear = parseInt(targetTahunAjaran.split('/')[0]);
  const yearDiff = currentYear - targetYear;

  const targetTingkat = currentKelas.tingkat - yearDiff;

  if (targetTingkat < 10 || targetTingkat > 12) {
    return null;
  }

  const targetKelas = kelas.find(k =>
    k.tingkat === targetTingkat &&
    k.jurusanId === currentKelas.jurusanId &&
    k.name.includes(currentKelas.name.split(' ').slice(1).join(' '))
  );

  return targetKelas || {
    ...currentKelas,
    id: `virtual-${currentKelas.id}-${targetTingkat}`,
    name: `${targetTingkat === 10 ? 'X' : targetTingkat === 11 ? 'XI' : 'XII'} ${currentKelas.name.split(' ').slice(1).join(' ')}`,
    tingkat: targetTingkat
  };
};

export const getMuridForSelectedPeriod = (
  selectedTahunAjaran: string,
  targetKelas: Kelas | null,
  users: User[],
  kelas: Kelas[],
  userKelasWali: string,
  activeTahunAjaran?: TahunAjaran
) => {
  if (!targetKelas) return [];

  if (selectedTahunAjaran === activeTahunAjaran?.tahun) {
    return users.filter(u => u.role === 'murid' && u.kelasId === userKelasWali);
  }

  const currentYear = parseInt(activeTahunAjaran?.tahun.split('/')[0] || '2024');
  const targetYear = parseInt(selectedTahunAjaran.split('/')[0]);
  const yearDiff = currentYear - targetYear;

  const expectedCurrentTingkat = targetKelas.tingkat + yearDiff;

  if (expectedCurrentTingkat > 12) {
    return [];
  }

  const currentWaliKelas = kelas.find(k => k.id === userKelasWali);
  if (!currentWaliKelas) return [];

  return users.filter(u => {
    if (u.role !== 'murid' || u.kelasId !== userKelasWali) {
      return false;
    }

    return currentWaliKelas.tingkat === expectedCurrentTingkat;
  });
};

export const getAttendanceStats = (muridId: string, sesiKelas: SesiAbsensi[], absensi: Absensi[]) => {
  const muridAbsensi = absensi.filter(a => {
    const sesi = sesiKelas.find(s => s.id === a.sesiId);
    return sesi && a.muridId === muridId;
  });

  const stats = {
    hadir: muridAbsensi.filter(a => a.status === 'hadir').length,
    izin: muridAbsensi.filter(a => a.status === 'izin').length,
    sakit: muridAbsensi.filter(a => a.status === 'sakit').length,
    alfa: muridAbsensi.filter(a => a.status === 'alfa').length,
    total: muridAbsensi.length
  };

  const attendanceRate = stats.total > 0 ?
    ((stats.hadir / stats.total) * 100).toFixed(1) : '0';

  return { ...stats, attendanceRate: parseFloat(attendanceRate) };
};

export const getDetailedAttendance = (
  muridId: string,
  sesiAbsensi: SesiAbsensi[],
  jadwalKelas: JadwalPelajaran[],
  mataPelajaran: MataPelajaran[],
  users: User[],
  absensi: Absensi[]
) => {
  const filteredSesi = sesiAbsensi.filter(s => {
    const jadwal = jadwalKelas.find(j => j.id === s.jadwalId);
    return jadwal;
  });

  return filteredSesi.map(sesi => {
    const jadwal = jadwalKelas.find(j => j.id === sesi.jadwalId);
    const mapel = mataPelajaran.find(m => m.id === jadwal?.mataPelajaranId);
    const guru = users.find(u => u.id === jadwal?.guruId);
    const attendance = absensi.find(a => a.sesiId === sesi.id && a.muridId === muridId);

    return {
      tanggal: sesi.tanggal,
      mataPelajaran: mapel?.name || 'Unknown',
      guru: guru?.name || 'Unknown',
      jam: jadwal ? `${jadwal.jamMulai} - ${jadwal.jamSelesai}` : 'Unknown',
      status: attendance?.status || 'alfa',
      waktu: attendance?.waktu || '-',
      keterangan: attendance?.keterangan || '-'
    };
  }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
};

export const calculateOverallStats = (muridKelas: User[], sesiKelas: SesiAbsensi[], absensi: Absensi[]) => {
  return muridKelas.reduce((acc, murid) => {
    const stats = getAttendanceStats(murid.id, sesiKelas, absensi);
    acc.totalHadir += stats.hadir;
    acc.totalIzin += stats.izin;
    acc.totalSakit += stats.sakit;
    acc.totalAlfa += stats.alfa;
    acc.totalSesi += stats.total;
    return acc;
  }, {
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlfa: 0,
    totalSesi: 0
  });
};

export const getAvailableTahunAjaran = (tahunAjaran: TahunAjaran[]) => {
  return Array.from(
    new Map(tahunAjaran.map(ta => [ta.tahun, ta])).values()
  ).sort((a, b) => {
    const yearA = parseInt(a.tahun.split('/')[0]);
    const yearB = parseInt(b.tahun.split('/')[0]);
    return yearB - yearA;
  });
};

export const getAvailableSemesters = (tahunAjaranValue: string, tahunAjaran: TahunAjaran[]) => {
  return tahunAjaran
    .filter(ta => ta.tahun === tahunAjaranValue)
    .sort((a, b) => a.semester - b.semester);
};
