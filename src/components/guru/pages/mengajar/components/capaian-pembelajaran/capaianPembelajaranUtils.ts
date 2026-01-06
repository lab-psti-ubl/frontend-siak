import { JadwalPelajaran, Kelas, MataPelajaran } from '../../../../../../types';

/**
 * Get unique grade levels taught by a teacher
 */
export const getAvailableTingkat = (
  jadwalPelajaran: JadwalPelajaran[],
  kelas: Kelas[]
): number[] => {
  if (!jadwalPelajaran.length) return [];
  const kelasIds = [...new Set(jadwalPelajaran.map(j => j.kelasId))];
  const tingkatSet = new Set<number>();
  kelasIds.forEach(kelasId => {
    const kelasData = kelas.find(k => k.id === kelasId);
    if (kelasData) {
      tingkatSet.add(kelasData.tingkat);
    }
  });
  return Array.from(tingkatSet).sort((a, b) => a - b);
};

/**
 * Get available subjects for selected grade level
 */
export const getAvailableMataPelajaran = (
  selectedTingkat: number | '',
  jadwalPelajaran: JadwalPelajaran[],
  kelas: Kelas[],
  mataPelajaran: MataPelajaran[]
): MataPelajaran[] => {
  if (!selectedTingkat || !jadwalPelajaran.length) return [];
  const kelasIdsForTingkat = kelas
    .filter(k => k.tingkat === selectedTingkat)
    .map(k => k.id);
  const mapelIds = jadwalPelajaran
    .filter(j => kelasIdsForTingkat.includes(j.kelasId))
    .map(j => j.mataPelajaranId);
  const uniqueMapelIds = [...new Set(mapelIds)];
  return mataPelajaran.filter(m => uniqueMapelIds.includes(m.id));
};

