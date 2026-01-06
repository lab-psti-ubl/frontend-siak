import { Nilai, NilaiTugas, KomponenNilai, Absensi, SesiAbsensi, PengaturanGrade, PengaturanKomponenNilai } from '../types';
import { getGradesFromLocalStorage, getDefaultGrades } from '../components/admin/pages/pengaturan/components/GradeSettingsUtils';

// Cache untuk grade dari API
let gradeApiCache: PengaturanGrade[] | null = null;

// Cache untuk komponen nilai dari API
let komponenNilaiApiCache: PengaturanKomponenNilai[] | null = null;

// Cache untuk nilai minimal dari API
let nilaiMinimalApiCache: NilaiMinimalSettings | null = null;

// Fungsi untuk set grade cache dari API (dipanggil dari komponen yang sudah load data)
export const setGradeCache = (grades: PengaturanGrade[]) => {
  gradeApiCache = grades;
};

// Fungsi untuk set komponen nilai cache dari API (dipanggil dari komponen yang sudah load data)
export const setKomponenNilaiCache = (komponenNilai: PengaturanKomponenNilai[]) => {
  komponenNilaiApiCache = komponenNilai;
};

// Fungsi untuk set nilai minimal cache dari API (dipanggil dari komponen yang sudah load data)
export const setNilaiMinimalCache = (nilaiMinimal: NilaiMinimalSettings) => {
  nilaiMinimalApiCache = nilaiMinimal;
};

// Fungsi untuk mendapatkan grade dengan prioritas: API cache -> localStorage -> default
export const getGrades = (): PengaturanGrade[] => {
  if (gradeApiCache && gradeApiCache.length > 0) {
    return gradeApiCache;
  }
  // Fallback ke localStorage jika API cache belum tersedia
  return getGradesFromLocalStorage();
};

const DEFAULT_KOMPONEN_NILAI: KomponenNilai = {
  kehadiran: 20,
  tugas: 30,
  uts: 25,
  uas: 25
};

const DEFAULT_SEMUA_KOMPONEN = [
  { id: '1', nama: 'UTS', persentase: 25, isDefault: true, hasNilai: false },
  { id: '2', nama: 'UAS', persentase: 25, isDefault: true, hasNilai: false },
  { id: '3', nama: 'Tugas', persentase: 30, isDefault: true, hasNilai: true },
  { id: '4', nama: 'Kehadiran', persentase: 20, isDefault: true, hasNilai: false },
];

export const getKomponenNilai = (): KomponenNilai => {
  // Prioritas: API cache -> localStorage -> default
  if (komponenNilaiApiCache && komponenNilaiApiCache.length > 0) {
    return {
      kehadiran: komponenNilaiApiCache.find(k => k.nama === 'Kehadiran')?.persentase ?? DEFAULT_KOMPONEN_NILAI.kehadiran,
      tugas: komponenNilaiApiCache.find(k => k.nama === 'Tugas')?.persentase ?? DEFAULT_KOMPONEN_NILAI.tugas,
      uts: komponenNilaiApiCache.find(k => k.nama === 'UTS')?.persentase ?? DEFAULT_KOMPONEN_NILAI.uts,
      uas: komponenNilaiApiCache.find(k => k.nama === 'UAS')?.persentase ?? DEFAULT_KOMPONEN_NILAI.uas,
    };
  }

  try {
    const stored = window.localStorage.getItem('pengaturanKomponenNilai');
    if (!stored) return DEFAULT_KOMPONEN_NILAI;

    const komponenArray = JSON.parse(stored);
    return {
      kehadiran: komponenArray.find((k: any) => k.nama === 'Kehadiran')?.persentase ?? DEFAULT_KOMPONEN_NILAI.kehadiran,
      tugas: komponenArray.find((k: any) => k.nama === 'Tugas')?.persentase ?? DEFAULT_KOMPONEN_NILAI.tugas,
      uts: komponenArray.find((k: any) => k.nama === 'UTS')?.persentase ?? DEFAULT_KOMPONEN_NILAI.uts,
      uas: komponenArray.find((k: any) => k.nama === 'UAS')?.persentase ?? DEFAULT_KOMPONEN_NILAI.uas,
    };
  } catch (error) {
    console.error('Error reading komponen nilai from localStorage:', error);
    return DEFAULT_KOMPONEN_NILAI;
  }
};

export const getSemuaKomponenNilai = (): Array<{ id: string; nama: string; persentase: number; isDefault?: boolean; hasNilai?: boolean }> => {
  // Prioritas: API cache -> localStorage -> default
  if (komponenNilaiApiCache && komponenNilaiApiCache.length > 0) {
    return komponenNilaiApiCache;
  }

  try {
    const stored = window.localStorage.getItem('pengaturanKomponenNilai');
    if (!stored) {
      return DEFAULT_SEMUA_KOMPONEN;
    }

    const komponenArray = JSON.parse(stored);
    return Array.isArray(komponenArray) ? komponenArray : DEFAULT_SEMUA_KOMPONEN;
  } catch (error) {
    console.error('Error reading semua komponen nilai from localStorage:', error);
    return DEFAULT_SEMUA_KOMPONEN;
  }
};

export const KOMPONEN_NILAI: KomponenNilai = getKomponenNilai();

interface NilaiMinimalSettings {
  nilaiAkhirMinimal: number;
  tingkatKehadiranMinimal: number;
}

const DEFAULT_NILAI_MINIMAL: NilaiMinimalSettings = {
  nilaiAkhirMinimal: 70,
  tingkatKehadiranMinimal: 75,
};

export const getNilaiMinimalSettings = (): NilaiMinimalSettings => {
  // Prioritas: API cache -> localStorage -> default
  if (nilaiMinimalApiCache) {
    return nilaiMinimalApiCache;
  }

  try {
    const stored = window.localStorage.getItem('pengaturanNilaiMinimal');
    if (!stored) return DEFAULT_NILAI_MINIMAL;

    const settings = JSON.parse(stored);
    return {
      nilaiAkhirMinimal: settings.nilaiAkhirMinimal ?? DEFAULT_NILAI_MINIMAL.nilaiAkhirMinimal,
      tingkatKehadiranMinimal: settings.tingkatKehadiranMinimal ?? DEFAULT_NILAI_MINIMAL.tingkatKehadiranMinimal,
    };
  } catch (error) {
    console.error('Error reading nilai minimal settings from localStorage:', error);
    return DEFAULT_NILAI_MINIMAL;
  }
};

export const calculateKehadiran = (
  muridId: string,
  mataPelajaranId: string,
  kelasId: string,
  guruId: string,
  semester: number,
  tahunAjaran: string,
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  jadwalPelajaran: any[]
): number => {
  // Get all schedules for this teacher, subject, and class in the current semester
  const relevantSchedules = jadwalPelajaran.filter(j =>
    j.guruId === guruId &&
    j.mataPelajaranId === mataPelajaranId &&
    j.kelasId === kelasId &&
    j.semester === semester &&
    j.tahunAjaran === tahunAjaran
  );

  if (relevantSchedules.length === 0) return 100;

  // Get all sessions for these schedules
  const scheduleIds = relevantSchedules.map(s => s.id);
  const subjectSessions = sesiAbsensi.filter(s =>
    scheduleIds.includes(s.jadwalId)
  );

  if (subjectSessions.length === 0) return 100; // No sessions opened yet = 100%

  // Count attendance from dataAbsensi inside each session (new structure from database)
  let hadirCount = 0;
  let totalSessions = subjectSessions.length;

  subjectSessions.forEach(session => {
    // Check if session has dataAbsensi (new structure from database)
    if (session.dataAbsensi && Array.isArray(session.dataAbsensi)) {
      const studentRecord = session.dataAbsensi.find(a => a.muridId === muridId);
      if (studentRecord && studentRecord.status === 'hadir') {
        hadirCount++;
      }
    } else {
      // Fallback to old structure using separate absensi array with sesiId
      const studentAttendance = absensi.find(a =>
        a.muridId === muridId &&
        a.sesiId === session.id
      );
      if (studentAttendance && studentAttendance.status === 'hadir') {
        hadirCount++;
      }
    }
  });

  return totalSessions > 0 ? (hadirCount / totalSessions) * 100 : 100;
};

/**
 * Calculate attendance rate from daily attendance (absen kehadiran) for a student in a specific semester
 * This is used for graduation/promotion requirements
 */
export const calculateKehadiranFromDailyAttendance = (
  muridId: string,
  kelasId: string,
  tahunAjaranId: string,
  semester: number,
  absensi: Absensi[]
): number => {
  // Filter absensi for this student, class, year, and semester
  const muridAbsensi = absensi.filter(a =>
    a.muridId === muridId &&
    a.kelasId === kelasId &&
    a.tahunAjaranId === tahunAjaranId &&
    a.semester === semester
  );

  if (muridAbsensi.length === 0) return 100; // No attendance records = 100% (default)

  // Get unique dates that have attendance records for this class
  const uniqueDates = new Set<string>();
  absensi.forEach(a => {
    if (a.kelasId === kelasId && a.tahunAjaranId === tahunAjaranId && a.semester === semester && a.tanggal) {
      uniqueDates.add(a.tanggal);
    }
  });

  if (uniqueDates.size === 0) return 100;

  // Group murid absensi by tanggal
  const absensiByDate: Record<string, Absensi> = {};
  muridAbsensi.forEach(abs => {
    if (!absensiByDate[abs.tanggal]) {
      absensiByDate[abs.tanggal] = abs;
    }
  });

  let hadirCount = 0;
  let totalDays = 0;

  // Process each unique date
  uniqueDates.forEach(tanggal => {
    totalDays++;
    const dayAbsensi = absensiByDate[tanggal];

    if (!dayAbsensi) {
      // Date exists in database but student has no record = alfa (not counted as hadir)
      return;
    }

    // Get status from new structure (statusMasuk/statusKeluar) or old structure (status)
    const statusMasuk = dayAbsensi.statusMasuk || dayAbsensi.status;
    const statusKeluar = dayAbsensi.statusKeluar;
    const jamMasuk = dayAbsensi.jamMasuk;

    // If there's jamMasuk or statusMasuk indicates attendance, check status
    const hasMasuk = jamMasuk || statusMasuk === 'tepat_waktu' || statusMasuk === 'hadir' || statusMasuk === 'terlambat';

    if (hasMasuk) {
      // Check if status is hadir (not izin, sakit, or alfa)
      if (statusMasuk === 'hadir' || statusMasuk === 'tepat_waktu' || statusMasuk === 'terlambat') {
        // If there's pulang status, check it too
        if (statusKeluar) {
          // If pulang status is izin or sakit, it's dispensation (dispen), not counted as hadir
          if (statusKeluar === 'izin' || statusKeluar === 'sakit') {
            return; // Not counted as hadir
          }
          // If pulang status is alfa or tidak_keluar, it's bolos, not counted as hadir
          if (statusKeluar === 'alfa' || statusKeluar === 'tidak_keluar') {
            return; // Not counted as hadir
          }
          // Both masuk and pulang are valid, count as hadir
          if (statusKeluar === 'hadir' || statusKeluar === 'tepat_waktu' || statusKeluar === 'pulang_awal' || statusKeluar === 'pulang_cepat') {
            hadirCount++;
            return;
          }
        }
        // Masuk is valid and no pulang status yet (or valid), count as hadir
        hadirCount++;
      } else if (statusMasuk === 'izin' || statusMasuk === 'sakit') {
        // Izin or sakit, not counted as hadir
        return;
      } else if (statusMasuk === 'alfa' || statusMasuk === 'tidak_masuk') {
        // Alfa, not counted as hadir
        return;
      } else if (statusMasuk && (statusMasuk === 'hadir' || statusMasuk === 'tepat_waktu' || statusMasuk === 'terlambat')) {
        // Fallback: if status is hadir/tepat_waktu/terlambat, count as hadir
        hadirCount++;
      }
    } else {
      // No masuk record, check status
      if (statusMasuk === 'izin' || statusMasuk === 'sakit' || statusMasuk === 'alfa' || statusMasuk === 'tidak_masuk') {
        // Not counted as hadir
        return;
      }
      // If status exists and is 'hadir', count it
      if (statusMasuk === 'hadir' || (dayAbsensi.status === 'hadir')) {
        hadirCount++;
      }
    }
  });

  return totalDays > 0 ? (hadirCount / totalDays) * 100 : 100;
};

/**
 * Get max tugas info from all nilai in the same class
 */
export const getMaxTugasInfo = (nilaiList: Nilai[]): { maxCount: number; uniqueTugasNames: string[] } => {
  if (!nilaiList || nilaiList.length === 0) {
    return { maxCount: 0, uniqueTugasNames: [] };
  }

  const uniqueTugasNames = new Set<string>();
  let maxCount = 0;

  nilaiList.forEach(nilai => {
    if (nilai.tugas && nilai.tugas.length > 0) {
      nilai.tugas.forEach(tugas => {
        if (tugas.nama) {
          uniqueTugasNames.add(tugas.nama);
        }
      });
      if (nilai.tugas.length > maxCount) {
        maxCount = nilai.tugas.length;
      }
    }
  });

  return {
    maxCount,
    uniqueTugasNames: Array.from(uniqueTugasNames).sort()
  };
};

/**
 * Get max count per komponen dinamis from all nilai in the same class
 */
export const getMaxKomponenDinamisInfo = (nilaiList: Nilai[]): Record<string, number> => {
  if (!nilaiList || nilaiList.length === 0) {
    return {};
  }

  const maxCountPerKomponen: Record<string, number> = {};

  nilaiList.forEach(nilai => {
    if (nilai.komponenDinamis && nilai.komponenDinamis.length > 0) {
      // Group by komponenNama
      const groupedByNama: Record<string, any[]> = {};
      nilai.komponenDinamis.forEach(kd => {
        if (kd.komponenNama) {
          if (!groupedByNama[kd.komponenNama]) {
            groupedByNama[kd.komponenNama] = [];
          }
          groupedByNama[kd.komponenNama].push(kd);
        }
      });

      // Update max count per komponen
      Object.keys(groupedByNama).forEach(komponenNama => {
        const count = groupedByNama[komponenNama].length;
        if (!maxCountPerKomponen[komponenNama] || count > maxCountPerKomponen[komponenNama]) {
          maxCountPerKomponen[komponenNama] = count;
        }
      });
    }
  });

  return maxCountPerKomponen;
};

export const calculateRataTugas = (tugas: NilaiTugas[], maxTugasCount?: number | null, uniqueTugasNames?: string[] | null): number => {
  if (!tugas || tugas.length === 0) {
    // If no tugas and we have max count, return 0 (all missing tugas = 0)
    return maxTugasCount && maxTugasCount > 0 ? 0 : 0;
  }

  // If we have unique tugas names, calculate based on those
  if (uniqueTugasNames && uniqueTugasNames.length > 0) {
    let total = 0;
    let count = 0;

    uniqueTugasNames.forEach(tugasName => {
      const tugasItem = tugas.find(t => t.nama === tugasName);
      if (tugasItem) {
        total += tugasItem.nilai || 0;
      }
      // Count all unique tugas names (including missing ones as 0)
      count++;
    });

    return count > 0 ? total / count : 0;
  }

  // Fallback: if we have max count, use it
  if (maxTugasCount && maxTugasCount > 0) {
    const total = tugas.reduce((sum, t) => sum + (t.nilai || 0), 0);
    return total / maxTugasCount;
  }

  // Original logic: calculate based on actual tugas count
  const total = tugas.reduce((sum, t) => sum + (t.nilai || 0), 0);
  return total / tugas.length;
};

export const calculateRataKomponen = (komponen: any[], maxCount?: number | null): number => {
  if (!komponen || komponen.length === 0) {
    // If no komponen and we have max count, return 0 (all missing komponen = 0)
    return maxCount && maxCount > 0 ? 0 : 0;
  }

  // If we have max count, calculate based on that
  if (maxCount && maxCount > 0) {
    const total = komponen.reduce((sum, k) => sum + (k.nilai || 0), 0);
    return total / maxCount;
  }

  // Original logic: calculate based on actual komponen count
  const total = komponen.reduce((sum, k) => sum + (k.nilai || 0), 0);
  return total / komponen.length;
};

export const calculateNilaiAkhir = (
  nilaiKehadiran: number,
  rataTugas: number,
  nilaiUTS: number | null,
  nilaiUAS: number | null,
  komponenDinamis?: any[]
): number => {
  const komponen = getKomponenNilai();
  const semuaKomponen = getSemuaKomponenNilai();
  const activeKomponenNames = semuaKomponen.map(k => k.nama);

  const skorKehadiran = (nilaiKehadiran / 100) * komponen.kehadiran;
  const skorTugas = (rataTugas / 100) * komponen.tugas;
  const skorUTS = nilaiUTS ? (nilaiUTS / 100) * komponen.uts : 0;
  const skorUAS = nilaiUAS ? (nilaiUAS / 100) * komponen.uas : 0;

  let skorKomponenDinamis = 0;
  if (komponenDinamis && komponenDinamis.length > 0) {
    const gruppedByNama = {} as Record<string, any[]>;
    komponenDinamis.forEach(kd => {
      if (activeKomponenNames.includes(kd.komponenNama)) {
        if (!gruppedByNama[kd.komponenNama]) {
          gruppedByNama[kd.komponenNama] = [];
        }
        gruppedByNama[kd.komponenNama].push(kd);
      }
    });

    Object.entries(gruppedByNama).forEach(([nama, values]) => {
      const kompConfig = semuaKomponen.find(k => k.nama === nama);
      if (kompConfig) {
        const rataKomponen = calculateRataKomponen(values);
        skorKomponenDinamis += (rataKomponen / 100) * kompConfig.persentase;
      }
    });
  }

  return skorKehadiran + skorTugas + skorUTS + skorUAS + skorKomponenDinamis;
};

export const getKomponenDinamisByKomponen = (
  komponenDinamis: any[],
  komponenNama: string
): number => {
  if (!komponenDinamis || komponenDinamis.length === 0) return 0;

  const semuaKomponen = getSemuaKomponenNilai();
  const activeKomponenNames = semuaKomponen.map(k => k.nama);

  if (!activeKomponenNames.includes(komponenNama)) return 0;

  const filtered = komponenDinamis.filter(kd => kd.komponenNama === komponenNama);
  if (filtered.length === 0) return 0;

  return calculateRataKomponen(filtered);
};

export const getGrade = (nilaiAkhir: number): string => {
  const grades = getGrades();
  const matchedGrade = grades.find(g => nilaiAkhir >= g.minNilai && nilaiAkhir <= g.maxNilai);
  return matchedGrade ? matchedGrade.grade : 'E';
};

export const getGradeColor = (grade: string): string => {
  const gradeUppercase = grade.toUpperCase();
  const grades = getGrades();
  const gradeIndex = grades.findIndex(g => g.grade.toUpperCase() === gradeUppercase);

  const colorSchemes = [
    'text-emerald-600 bg-emerald-100',
    'text-blue-600 bg-blue-100',
    'text-yellow-600 bg-yellow-100',
    'text-orange-600 bg-orange-100',
    'text-red-600 bg-red-100',
    'text-purple-600 bg-purple-100',
    'text-pink-600 bg-pink-100',
    'text-indigo-600 bg-indigo-100',
  ];

  if (gradeIndex >= 0) {
    return colorSchemes[gradeIndex % colorSchemes.length];
  }

  return 'text-gray-600 bg-gray-100';
};

export const updateNilaiAkhir = (
  nilai: Nilai,
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  jadwalPelajaran: any[]
): Nilai => {
  const nilaiKehadiran = calculateKehadiran(
    nilai.muridId,
    nilai.mataPelajaranId,
    nilai.kelasId,
    nilai.guruId,
    nilai.semester,
    nilai.tahunAjaran,
    absensi,
    sesiAbsensi,
    jadwalPelajaran
  );
  const rataTugas = calculateRataTugas(nilai.tugas);
  const nilaiAkhir = calculateNilaiAkhir(nilaiKehadiran, rataTugas, nilai.uts, nilai.uas, nilai.komponenDinamis);
  const grade = getGrade(nilaiAkhir);

  return {
    ...nilai,
    nilaiAkhir,
    grade,
    updatedAt: new Date().toISOString()
  };
};