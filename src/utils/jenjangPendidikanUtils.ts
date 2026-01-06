import { PengaturanJenjangPendidikan } from '../types';
import { apiService } from '../services/apiService';

// Cache for jenjang
let jenjangCache: 'SD' | 'SMP' | 'SMA/SMK' | null = null;
let jenjangCacheTime: number = 0;
const JENJANG_CACHE_DURATION = 60000; // 1 minute

// Cache for tingkat range
let tingkatRangeCache: { awal: number; akhir: number } | null = null;

export const getActiveJenjang = async (): Promise<'SD' | 'SMP' | 'SMA/SMK' | null> => {
  // Check cache first
  if (jenjangCache !== null && (Date.now() - jenjangCacheTime) < JENJANG_CACHE_DURATION) {
    return jenjangCache;
  }

  try {
    const result = await apiService.getActiveJenjang();
    if (result.success) {
      jenjangCache = result.activeJenjang || null;
      jenjangCacheTime = Date.now();
      
      // Cache tingkat range if available
      if (result.tingkatAwal && result.tingkatAkhir) {
        tingkatRangeCache = {
          awal: result.tingkatAwal,
          akhir: result.tingkatAkhir,
        };
      }
      
      return jenjangCache;
    }
  } catch (error) {
    console.error('Error getting active jenjang:', error);
    // Fallback to localStorage for backward compatibility
    const pengaturanJenjang = localStorage.getItem('pengaturanJenjangPendidikan');
    if (pengaturanJenjang) {
      try {
        const jenjangList: PengaturanJenjangPendidikan[] = JSON.parse(pengaturanJenjang);
        const activeJenjang = jenjangList.find(j => j.isActive);
        const jenjang = activeJenjang?.jenjang || null;
        jenjangCache = jenjang;
        jenjangCacheTime = Date.now();
        return jenjang;
      } catch {
        return null;
      }
    }
  }
  
  return null;
};

// Synchronous version for backward compatibility (uses cache)
export const getActiveJenjangSync = (): 'SD' | 'SMP' | 'SMA/SMK' | null => {
  if (jenjangCache !== null) {
    return jenjangCache;
  }
  // Fallback to localStorage
  const pengaturanJenjang = localStorage.getItem('pengaturanJenjangPendidikan');
  if (pengaturanJenjang) {
    try {
      const jenjangList: PengaturanJenjangPendidikan[] = JSON.parse(pengaturanJenjang);
      const activeJenjang = jenjangList.find(j => j.isActive);
      return activeJenjang?.jenjang || null;
    } catch {
      return null;
    }
  }
  return null;
};

export const isJurusanRequired = async (): Promise<boolean> => {
  const jenjang = await getActiveJenjang();
  return jenjang === 'SMA/SMK';
};

export const isJurusanRequiredSync = (): boolean => {
  const jenjang = getActiveJenjangSync();
  return jenjang === 'SMA/SMK';
};

export const getTingkatKelasOptions = async (): Promise<number[]> => {
  const jenjang = await getActiveJenjang();

  switch (jenjang) {
    case 'SD':
      return [1, 2, 3, 4, 5, 6];
    case 'SMP':
      return [7, 8, 9];
    case 'SMA/SMK':
      return [10, 11, 12];
    default:
      return [];
  }
};

export const getTingkatKelasOptionsSync = (): number[] => {
  const jenjang = getActiveJenjangSync();

  switch (jenjang) {
    case 'SD':
      return [1, 2, 3, 4, 5, 6];
    case 'SMP':
      return [7, 8, 9];
    case 'SMA/SMK':
      return [10, 11, 12];
    default:
      return [];
  }
};

export const getMinTingkat = async (): Promise<number> => {
  const options = await getTingkatKelasOptions();
  if (options.length === 0) {
    throw new Error('Jenjang pendidikan belum dikonfigurasi. Silakan hubungi administrator.');
  }
  return Math.min(...options);
};

export const getMinTingkatSync = (): number => {
  const options = getTingkatKelasOptionsSync();
  if (options.length === 0) {
    throw new Error('Jenjang pendidikan belum dikonfigurasi. Silakan hubungi administrator.');
  }
  return Math.min(...options);
};

// Fungsi eksplisit untuk mendapatkan tingkat awal (alias dari getMinTingkat)
export const getTingkatAwal = async (): Promise<number> => {
  // Try to get from cache first
  if (tingkatRangeCache) {
    return tingkatRangeCache.awal;
  }
  return await getMinTingkat();
};

export const getTingkatAwalSync = (): number => {
  // Try to get from cache first
  if (tingkatRangeCache) {
    return tingkatRangeCache.awal;
  }
  return getMinTingkatSync();
};

export const formatTingkatKelas = async (tingkat: number): Promise<string> => {
  const jenjang = await getActiveJenjang();

  switch (jenjang) {
    case 'SD':
      return `${tingkat}`;
    case 'SMP':
      return `${tingkat}`;
    case 'SMA/SMK':
      if (tingkat === 10) return 'X';
      if (tingkat === 11) return 'XI';
      if (tingkat === 12) return 'XII';
      return `${tingkat}`;
    default:
      return `${tingkat}`;
  }
};

export const formatTingkatKelasSync = (tingkat: number): string => {
  const jenjang = getActiveJenjangSync();

  switch (jenjang) {
    case 'SD':
      return `${tingkat}`;
    case 'SMP':
      return `${tingkat}`;
    case 'SMA/SMK':
      if (tingkat === 10) return 'X';
      if (tingkat === 11) return 'XI';
      if (tingkat === 12) return 'XII';
      return `${tingkat}`;
    default:
      return `${tingkat}`;
  }
};

export const getJenjangLabel = async (): Promise<string> => {
  const jenjang = await getActiveJenjang();

  switch (jenjang) {
    case 'SD':
      return 'Sekolah Dasar';
    case 'SMP':
      return 'Sekolah Menengah Pertama';
    case 'SMA/SMK':
      return 'Sekolah Menengah Atas/Kejuruan';
    default:
      return 'Belum Dipilih';
  }
};

export const getJenjangLabelSync = (): string => {
  const jenjang = getActiveJenjangSync();

  switch (jenjang) {
    case 'SD':
      return 'Sekolah Dasar';
    case 'SMP':
      return 'Sekolah Menengah Pertama';
    case 'SMA/SMK':
      return 'Sekolah Menengah Atas/Kejuruan';
    default:
      return 'Belum Dipilih';
  }
};

export const shouldShowJurusan = async (): Promise<boolean> => {
  return await isJurusanRequired();
};

export const shouldShowJurusanSync = (): boolean => {
  return isJurusanRequiredSync();
};

export const validateTingkatKelas = async (tingkat: number): Promise<boolean> => {
  const validOptions = await getTingkatKelasOptions();
  return validOptions.includes(tingkat);
};

export const validateTingkatKelasSync = (tingkat: number): boolean => {
  const validOptions = getTingkatKelasOptionsSync();
  return validOptions.includes(tingkat);
};

export const getMaxTingkat = async (): Promise<number> => {
  const options = await getTingkatKelasOptions();
  if (options.length === 0) {
    throw new Error('Jenjang pendidikan belum dikonfigurasi. Silakan hubungi administrator.');
  }
  return Math.max(...options);
};

export const getMaxTingkatSync = (): number => {
  const options = getTingkatKelasOptionsSync();
  if (options.length === 0) {
    throw new Error('Jenjang pendidikan belum dikonfigurasi. Silakan hubungi administrator.');
  }
  return Math.max(...options);
};

// Fungsi eksplisit untuk mendapatkan tingkat akhir (alias dari getMaxTingkat)
export const getTingkatAkhir = async (): Promise<number> => {
  // Try to get from cache first
  if (tingkatRangeCache) {
    return tingkatRangeCache.akhir;
  }
  return await getMaxTingkat();
};

export const getTingkatAkhirSync = (): number => {
  // Try to get from cache first
  if (tingkatRangeCache) {
    return tingkatRangeCache.akhir;
  }
  return getMaxTingkatSync();
};

// Fungsi untuk mendapatkan range tingkat (awal dan akhir)
export const getTingkatRange = async (): Promise<{ awal: number; akhir: number }> => {
  const awal = await getTingkatAwal();
  const akhir = await getTingkatAkhir();
  return { awal, akhir };
};

export const getTingkatRangeSync = (): { awal: number; akhir: number } => {
  const awal = getTingkatAwalSync();
  const akhir = getTingkatAkhirSync();
  return { awal, akhir };
};

export const isMaxTingkat = async (tingkat: number): Promise<boolean> => {
  return tingkat === await getMaxTingkat();
};

export const isMaxTingkatSync = (tingkat: number): boolean => {
  return tingkat === getMaxTingkatSync();
};

export const getGraduationTingkatLabel = async (): Promise<string> => {
  const maxTingkat = await getMaxTingkat();
  const formatted = await formatTingkatKelas(maxTingkat);
  return `kelas ${formatted}`;
};

export const getGraduationTingkatLabelSync = (): string => {
  const maxTingkat = getMaxTingkatSync();
  const formatted = formatTingkatKelasSync(maxTingkat);
  return `kelas ${formatted}`;
};

export const getGraduationKelasText = async (capitalize: boolean = false): Promise<string> => {
  const maxTingkat = await getMaxTingkat();
  const formatted = await formatTingkatKelas(maxTingkat);
  return capitalize ? `Kelas ${formatted}` : `kelas ${formatted}`;
};

export const getGraduationKelasTextSync = (capitalize: boolean = false): string => {
  const maxTingkat = getMaxTingkatSync();
  const formatted = formatTingkatKelasSync(maxTingkat);
  return capitalize ? `Kelas ${formatted}` : `kelas ${formatted}`;
};

export const getGraduationShortLabel = async (): Promise<string> => {
  const maxTingkat = await getMaxTingkat();
  return await formatTingkatKelas(maxTingkat);
};

export const getGraduationShortLabelSync = (): string => {
  const maxTingkat = getMaxTingkatSync();
  return formatTingkatKelasSync(maxTingkat);
};

export const getSchoolName = (): string => {
  try {
    const data = localStorage.getItem('profilSekolah');
    if (data) {
      const profilSekolah = JSON.parse(data);
      return profilSekolah.namaSekolah || 'Sekolah';
    }
  } catch (error) {
    console.error('Error reading school name from localStorage:', error);
  }
  return 'Sekolah';
};

export const getJenjangShortLabel = async (): Promise<string> => {
  const jenjang = await getActiveJenjang();
  switch (jenjang) {
    case 'SD':
      return 'SD';
    case 'SMP':
      return 'SMP';
    case 'SMA/SMK':
      return 'SMA';
    default:
      return '';
  }
};

export const getJenjangShortLabelSync = (): string => {
  const jenjang = getActiveJenjangSync();
  switch (jenjang) {
    case 'SD':
      return 'SD';
    case 'SMP':
      return 'SMP';
    case 'SMA/SMK':
      return 'SMA';
    default:
      return '';
  }
};

export const getNonMaxTingkatLabel = async (): Promise<string> => {
  const tingkatOptions = await getTingkatKelasOptions();
  const minTingkat = Math.min(...tingkatOptions);
  const maxTingkat = Math.max(...tingkatOptions);
  const secondToLastTingkat = maxTingkat - 1;

  const minFormatted = await formatTingkatKelas(minTingkat);
  const secondToLastFormatted = await formatTingkatKelas(secondToLastTingkat);

  return `Kelas ${minFormatted}-${secondToLastFormatted}`;
};

export const getNonMaxTingkatLabelSync = (): string => {
  const tingkatOptions = getTingkatKelasOptionsSync();
  const minTingkat = Math.min(...tingkatOptions);
  const maxTingkat = Math.max(...tingkatOptions);
  const secondToLastTingkat = maxTingkat - 1;

  const minFormatted = formatTingkatKelasSync(minTingkat);
  const secondToLastFormatted = formatTingkatKelasSync(secondToLastTingkat);

  return `Kelas ${minFormatted}-${secondToLastFormatted}`;
};

export const getJenjangDescription = async (): Promise<string> => {
  const jenjang = await getActiveJenjang();
  const tingkatOptions = await getTingkatKelasOptions();

  if (tingkatOptions.length === 0) {
    return 'Jenjang pendidikan belum dikonfigurasi';
  }

  const minTingkat = Math.min(...tingkatOptions);
  const maxTingkat = Math.max(...tingkatOptions);
  const minFormatted = await formatTingkatKelas(minTingkat);
  const maxFormatted = await formatTingkatKelas(maxTingkat);

  switch (jenjang) {
    case 'SD':
      return `Jenjang pendidikan dasar untuk kelas ${minFormatted}-${maxFormatted}`;
    case 'SMP':
      return `Jenjang pendidikan menengah pertama untuk kelas ${minFormatted}-${maxFormatted}`;
    case 'SMA/SMK':
      return `Jenjang pendidikan menengah atas untuk kelas ${minFormatted}-${maxFormatted}`;
    default:
      return 'Jenjang pendidikan belum dikonfigurasi';
  }
};

export const getJenjangDescriptionSync = (): string => {
  const jenjang = getActiveJenjangSync();
  const tingkatOptions = getTingkatKelasOptionsSync();

  if (tingkatOptions.length === 0) {
    return 'Jenjang pendidikan belum dikonfigurasi';
  }

  const minTingkat = Math.min(...tingkatOptions);
  const maxTingkat = Math.max(...tingkatOptions);
  const minFormatted = formatTingkatKelasSync(minTingkat);
  const maxFormatted = formatTingkatKelasSync(maxTingkat);

  switch (jenjang) {
    case 'SD':
      return `Jenjang pendidikan dasar untuk kelas ${minFormatted}-${maxFormatted}`;
    case 'SMP':
      return `Jenjang pendidikan menengah pertama untuk kelas ${minFormatted}-${maxFormatted}`;
    case 'SMA/SMK':
      return `Jenjang pendidikan menengah atas untuk kelas ${minFormatted}-${maxFormatted}`;
    default:
      return 'Jenjang pendidikan belum dikonfigurasi';
  }
};

export const getCardDisplayLabel = async (): Promise<string> => {
  const jenjang = await getActiveJenjang();

  switch (jenjang) {
    case 'SD':
    case 'SMP':
      return 'Tingkat';
    case 'SMA/SMK':
      return 'Jurusan';
    default:
      return 'Tingkat';
  }
};

export const getCardDisplayLabelSync = (): string => {
  const jenjang = getActiveJenjangSync();

  switch (jenjang) {
    case 'SD':
    case 'SMP':
      return 'Tingkat';
    case 'SMA/SMK':
      return 'Jurusan';
    default:
      return 'Tingkat';
  }
};
