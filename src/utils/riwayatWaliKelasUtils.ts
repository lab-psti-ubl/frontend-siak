import { Guru, JadwalPelajaran } from '../types';

export interface RiwayatKelasWaliEntry {
  kelasId: string;
  tahunAjaran: string;
  semester: number;
}

export const ensureRiwayatWaliKelas = (
  guru: Guru,
  currentKelasWali: string | undefined,
  currentTahunAjaran: string,
  currentSemester: number
): RiwayatKelasWaliEntry[] => {
  if (!guru.isWaliKelas || !currentKelasWali) {
    return guru.riwayatKelasWali || [];
  }

  const riwayat = guru.riwayatKelasWali || [];

  const exists = riwayat.some(
    r => r.kelasId === currentKelasWali &&
         r.tahunAjaran === currentTahunAjaran &&
         r.semester === currentSemester
  );

  if (!exists) {
    return [
      ...riwayat,
      {
        kelasId: currentKelasWali,
        tahunAjaran: currentTahunAjaran,
        semester: currentSemester
      }
    ];
  }

  return riwayat;
};

export const getKelasWaliByTahunAjaran = (
  guru: Guru,
  tahunAjaran: string,
  semester: number
): string | undefined => {
  if (!guru.riwayatKelasWali || guru.riwayatKelasWali.length === 0) {
    return guru.kelasWali;
  }

  const riwayat = guru.riwayatKelasWali.find(
    r => r.tahunAjaran === tahunAjaran && r.semester === semester
  );

  if (riwayat) {
    return riwayat.kelasId;
  }

  return guru.kelasWali;
};

export const getAllTahunAjaranWaliKelas = (
  guru: Guru,
  currentTahunAjaran?: string
): string[] => {
  const tahunSet = new Set<string>();

  if (guru.riwayatKelasWali && guru.riwayatKelasWali.length > 0) {
    guru.riwayatKelasWali.forEach(r => {
      tahunSet.add(r.tahunAjaran);
    });
  }

  if (currentTahunAjaran && guru.kelasWali) {
    tahunSet.add(currentTahunAjaran);
  }

  return Array.from(tahunSet).sort((a, b) => b.localeCompare(a));
};

export const getAllSemestersForTahunAjaran = (
  guru: Guru,
  tahunAjaran: string
): number[] => {
  const semesterSet = new Set<number>();

  if (guru.riwayatKelasWali && guru.riwayatKelasWali.length > 0) {
    guru.riwayatKelasWali
      .filter(r => r.tahunAjaran === tahunAjaran)
      .forEach(r => {
        semesterSet.add(r.semester);
      });
  }

  return semesterSet.size > 0 ? Array.from(semesterSet).sort() : [1, 2];
};

export const syncRiwayatWaliKelasFromJadwal = (
  allGuru: Guru[],
  jadwalPelajaran: JadwalPelajaran[]
): Guru[] => {
  const updatedGuru = [...allGuru];

  jadwalPelajaran.forEach(jadwal => {
    const guruIndex = updatedGuru.findIndex(g =>
      g.role === 'guru' &&
      g.id === jadwal.guruId &&
      g.isWaliKelas &&
      g.kelasWali === jadwal.kelasId
    );

    if (guruIndex !== -1) {
      const guru = updatedGuru[guruIndex];
      const riwayat = guru.riwayatKelasWali || [];

      const exists = riwayat.some(
        r => r.kelasId === jadwal.kelasId &&
             r.tahunAjaran === jadwal.tahunAjaran &&
             r.semester === jadwal.semester
      );

      if (!exists) {
        updatedGuru[guruIndex] = {
          ...guru,
          riwayatKelasWali: [
            ...riwayat,
            {
              kelasId: jadwal.kelasId,
              tahunAjaran: jadwal.tahunAjaran,
              semester: jadwal.semester
            }
          ]
        };
      }
    }
  });

  return updatedGuru;
};
