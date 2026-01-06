import { Kelas, TahunAjaran, Nilai, JadwalPelajaran, RiwayatKelasMurid } from '../../../../types';
import { getTingkatKelasOptionsSync, formatTingkatKelasSync, getMinTingkatSync, getMaxTingkatSync, shouldShowJurusanSync } from '../../../../utils/jenjangPendidikanUtils';

export const getKelasForTahunAjaran = (
  currentKelasId: string,
  targetTahunAjaran: string,
  kelas: Kelas[],
  activeTahunAjaran: TahunAjaran | undefined
): Kelas | null => {
  const currentKelas = kelas.find(k => k.id === currentKelasId);
  if (!currentKelas) return null;

  if (targetTahunAjaran === activeTahunAjaran?.tahun) {
    return currentKelas;
  }

  const currentYear = parseInt(activeTahunAjaran?.tahun.split('/')[0] || '2024');
  const targetYear = parseInt(targetTahunAjaran.split('/')[0]);
  const yearDiff = currentYear - targetYear;

  const targetTingkat = currentKelas.tingkat - yearDiff;

  const minTingkat = getMinTingkatSync();
  const maxTingkat = getMaxTingkatSync();

  if (targetTingkat < minTingkat || targetTingkat > maxTingkat) {
    return null;
  }

  const showJurusan = shouldShowJurusanSync();

  const targetKelas = kelas.find(k => {
    if (k.tingkat !== targetTingkat) return false;

    if (showJurusan && currentKelas.jurusanId) {
      return k.jurusanId === currentKelas.jurusanId &&
        k.name.includes(currentKelas.name.split(' ').slice(1).join(' '));
    } else {
      return k.name.includes(currentKelas.name.split(' ').slice(1).join(' '));
    }
  });

  return targetKelas || {
    ...currentKelas,
    id: `virtual-${currentKelas.id}-${targetTingkat}`,
    name: `${formatTingkatKelasSync(targetTingkat)} ${currentKelas.name.split(' ').slice(1).join(' ')}`,
    tingkat: targetTingkat,
    jurusanId: showJurusan ? currentKelas.jurusanId : undefined
  };
};

export const getAvailableSemesters = (
  tahunAjaranValue: string, 
  tahunAjaran: TahunAjaran[],
  nilai?: Nilai[],
  jadwalPelajaran?: JadwalPelajaran[],
  muridId?: string,
  kelasId?: string
): TahunAjaran[] => {
  const semestersFromTahunAjaran = tahunAjaran
    .filter(ta => ta.tahun === tahunAjaranValue)
    .map(ta => ta.semester);

  // Ambil semester dari data nilai
  const semestersFromNilai = new Set<number>();
  if (nilai && muridId) {
    nilai
      .filter(n => n.tahunAjaran === tahunAjaranValue && n.muridId === muridId)
      .forEach(n => semestersFromNilai.add(n.semester));
  }

  // Ambil semester dari jadwal pelajaran
  const semestersFromJadwal = new Set<number>();
  if (jadwalPelajaran && kelasId) {
    jadwalPelajaran
      .filter(j => j.tahunAjaran === tahunAjaranValue && j.kelasId === kelasId)
      .forEach(j => semestersFromJadwal.add(j.semester));
  }

  // Gabungkan semua semester yang ditemukan
  const allSemesters = new Set([
    ...semestersFromTahunAjaran,
    ...Array.from(semestersFromNilai),
    ...Array.from(semestersFromJadwal)
  ]);

  // Konversi ke array TahunAjaran untuk kompatibilitas
  return Array.from(allSemesters)
    .sort((a, b) => a - b)
    .map(sem => ({
      id: `sem-${sem}`,
      tahun: tahunAjaranValue,
      semester: sem,
      isActive: false,
      tanggalMulai: '',
      tanggalSelesai: ''
    }));
};

export const getAvailableTahunAjaran = (
  tahunAjaran: TahunAjaran[],
  riwayatKelasMurid?: RiwayatKelasMurid[],
  muridId?: string,
  activeTahunAjaran?: TahunAjaran
): TahunAjaran[] => {
  // Get all tahun ajaran IDs from riwayat kelas murid
  const tahunAjaranIdsFromRiwayat = riwayatKelasMurid && muridId
    ? riwayatKelasMurid
        .filter(r => r.muridId === muridId)
        .map(r => r.tahunAjaran)
    : [];

  // Get tahun ajaran strings from tahun ajaran data
  const tahunAjaranFromRiwayat = tahunAjaran
    .filter(ta => tahunAjaranIdsFromRiwayat.includes(ta.id))
    .map(ta => ta.tahun);

  // Combine with active tahun ajaran
  const allTahunAjaran = [...new Set(tahunAjaranFromRiwayat)];
  
  // Always include active tahun ajaran if it exists
  if (activeTahunAjaran && !allTahunAjaran.includes(activeTahunAjaran.tahun)) {
    allTahunAjaran.push(activeTahunAjaran.tahun);
  }

  // If no tahun ajaran found from riwayat, use all available tahun ajaran from database
  if (allTahunAjaran.length === 0 && tahunAjaran.length > 0) {
    return Array.from(
      new Map(tahunAjaran.map(ta => [ta.tahun, ta])).values()
    ).sort((a, b) => {
      const yearA = parseInt(a.tahun.split('/')[0]);
      const yearB = parseInt(b.tahun.split('/')[0]);
      return yearB - yearA;
    });
  }

  // Return tahun ajaran objects sorted by year
  return allTahunAjaran
    .map(tahun => tahunAjaran.find(ta => ta.tahun === tahun))
    .filter((ta): ta is TahunAjaran => ta !== undefined)
    .sort((a, b) => {
      const yearA = parseInt(a.tahun.split('/')[0]);
      const yearB = parseInt(b.tahun.split('/')[0]);
      return yearB - yearA;
    });
};
