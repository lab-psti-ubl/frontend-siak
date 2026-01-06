import {
  Nilai,
  User,
  JadwalPelajaran,
  MataPelajaran
} from '../../../../../../types';

export const getMapelName = (mapelId: string, mataPelajaran: MataPelajaran[]) => {
  return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
};

export const getGuruName = (
  mapelId: string,
  jadwalKelas: JadwalPelajaran[],
  users: User[]
) => {
  const jadwal = jadwalKelas.find(j => j.mataPelajaranId === mapelId);
  if (!jadwal) return 'Unknown';
  return users.find(u => u.id === jadwal.guruId)?.name || 'Unknown';
};

export const getNilaiMurid = (
  muridId: string,
  mapelId: string,
  kelasWali: string,
  selectedPeriod: { tahun: string; semester: number },
  nilai: Nilai[]
) => {
  return nilai.find(n =>
    n.muridId === muridId &&
    n.mataPelajaranId === mapelId &&
    n.kelasId === kelasWali &&
    n.semester === selectedPeriod.semester &&
    n.tahunAjaran === selectedPeriod.tahun
  );
};

export const getClassStats = (
  mapelId: string,
  kelasWali: string,
  selectedPeriod: { tahun: string; semester: number },
  nilai: Nilai[]
) => {
  const nilaiMapel = nilai.filter(n =>
    n.mataPelajaranId === mapelId &&
    n.kelasId === kelasWali &&
    n.semester === selectedPeriod.semester &&
    n.tahunAjaran === selectedPeriod.tahun &&
    n.nilaiAkhir !== null
  );

  if (nilaiMapel.length === 0) return { rata: 0, tertinggi: 0, terendah: 0, gradeDistribution: {} };

  const nilaiAkhirList = nilaiMapel.map(n => n.nilaiAkhir!);
  const rata = nilaiAkhirList.reduce((sum, n) => sum + n, 0) / nilaiAkhirList.length;
  const tertinggi = Math.max(...nilaiAkhirList);
  const terendah = Math.min(...nilaiAkhirList);

  const gradeDistribution = nilaiMapel.reduce((acc, n) => {
    const grade = n.grade || 'E';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { rata, tertinggi, terendah, gradeDistribution };
};
