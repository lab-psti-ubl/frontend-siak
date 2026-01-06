import { User, AbsensiGuru, JadwalPelajaran, TahunAjaran, IzinGuru, Kelas, MataPelajaran } from '../../../../../types';

export const getAbsensiForDate = (absensiGuru: AbsensiGuru[], tanggal: string, tahunAjaranId?: string, semester?: number): AbsensiGuru[] => {
  return absensiGuru.filter(a => {
    let match = a.tanggal === tanggal;
    if (tahunAjaranId && match) {
      match = a.tahunAjaranId === tahunAjaranId;
    }
    if (semester !== undefined && match) {
      match = a.semester === semester;
    }
    return match;
  });
};

/**
 * Cek apakah tanggal tertentu ada di database (ada dokumen AbsensiGuru untuk tanggal tersebut)
 * Jika ada setidaknya satu data absensi untuk tanggal tersebut, berarti tanggal ada di database
 */
export const isTanggalExistsInDatabase = (absensiGuru: AbsensiGuru[], tanggal: string, tahunAjaranId?: string, semester?: number): boolean => {
  const absensiForDate = getAbsensiForDate(absensiGuru, tanggal, tahunAjaranId, semester);
  return absensiForDate.length > 0;
};

export const getGuruAbsensiForDate = (absensiGuru: AbsensiGuru[], guruId: string, tanggal: string, tahunAjaranId?: string): AbsensiGuru | undefined => {
  return absensiGuru.find(a => {
    let match = a.guruId === guruId && a.tanggal === tanggal;
    if (tahunAjaranId && match) {
      match = a.tahunAjaranId === tahunAjaranId;
    }
    return match;
  });
};

export const getGuruIzinForDate = (izinGuru: IzinGuru[], guruId: string, tanggal: string, tahunAjaranId?: string): IzinGuru | undefined => {
  return izinGuru.find(i => {
    let match = i.guruId === guruId &&
      i.status === 'diterima' &&
      i.jenis !== 'izin_dispen' &&
      i.tanggalMulai <= tanggal &&
      i.tanggalSelesai >= tanggal;
    if (tahunAjaranId && match) {
      match = i.tahunAjaranId === tahunAjaranId;
    }
    return match;
  });
};

export const getJadwalGuruForDate = (
  jadwalPelajaran: JadwalPelajaran[],
  guruId: string,
  tanggal: string,
  activeTahunAjaran: TahunAjaran | undefined
): JadwalPelajaran[] => {
  const dayName = new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
  return jadwalPelajaran.filter(j =>
    j.guruId === guruId &&
    j.hari === dayName &&
    j.tahunAjaran === activeTahunAjaran?.tahun &&
    j.semester === activeTahunAjaran?.semester
  );
};

export const getKelasName = (kelas: Kelas[], kelasId: string): string => {
  return kelas.find(k => k.id === kelasId)?.name || 'Unknown';
};

export const getMapelName = (mataPelajaran: MataPelajaran[], mapelId: string): string => {
  return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
};

export const getGuruAbsensiStatus = (absensi: AbsensiGuru | undefined): string => {
  if (!absensi) {
    return 'belum_absen';
  }

  // Prioritize keteranganAbsensi from database (most accurate)
  if (absensi.keteranganAbsensi) {
    const keterangan = absensi.keteranganAbsensi.toLowerCase();
    if (keterangan === 'hadir') return 'hadir';
    if (keterangan === 'izin') return 'izin';
    if (keterangan === 'sakit') return 'sakit';
    if (keterangan === 'alfa') return 'alfa';
    if (keterangan === 'bolos') return 'bolos';
    if (keterangan === 'dispen') return 'dispen';
  }

  // Fallback to statusMasuk/statusKeluar logic
  if (absensi.statusKeluar === 'alfa' || absensi.statusMasuk === 'alfa') {
    return 'alfa';
  }

  if (absensi.statusMasuk === 'izin' || absensi.statusKeluar === 'izin') {
    return 'izin';
  }

  if (absensi.statusMasuk === 'sakit' || absensi.statusKeluar === 'sakit') {
    return 'sakit';
  }

  if (absensi.statusMasuk === 'tidak_masuk' || !absensi.jamMasuk) {
    return 'alfa';
  }

  if (absensi.statusMasuk === 'tepat_waktu') {
    return 'hadir';
  }

  if (absensi.statusMasuk === 'terlambat') {
    return 'terlambat';
  }

  return 'hadir';
};

/**
 * Menghitung keterangan absensi guru berdasarkan logika:
 * - "-": jika tanggal tidak ada di database (tidak ada dokumen AbsensiGuru untuk tanggal tersebut)
 * - HADIR: jika ada absen masuk (terlambat/tepat waktu) DAN absen keluar (pulang awal/tepat waktu)
 * - BOLOS: jika ada absen masuk tapi absen keluar alfa
 * - IZIN/SAKIT: jika ada izin atau sakit sebelum melakukan absen masuk
 * - DISPEN: jika ada absen masuk tapi untuk absen pulang melakukan izin atau sakit
 * - ALFA: jika tanggal ada di database tapi guru tidak memiliki record absensi
 * 
 * @param absensi - Data absensi guru untuk tanggal tertentu (undefined jika guru tidak ada di array)
 * @param izinAktif - Data izin aktif untuk tanggal tertentu
 * @param tanggalExistsInDB - Apakah tanggal tersebut ada di database (ada dokumen AbsensiGuru)
 */
export const getKeteranganAbsensi = (
  absensi: AbsensiGuru | undefined, 
  izinAktif: IzinGuru | undefined,
  tanggalExistsInDB: boolean = true
): string => {
  // Jika tanggal tidak ada di database, return "-"
  if (!tanggalExistsInDB) {
    return '-';
  }

  // Jika tanggal ada di database tapi tidak ada absensi untuk guru ini
  // (guru tidak ada di array guru pada dokumen AbsensiGuru untuk tanggal tersebut)
  // return "Alfa"
  if (!absensi) {
    // Tapi jika ada izin aktif, tetap prioritaskan izin
    if (izinAktif) {
      return izinAktif.jenis === 'sakit' ? 'Sakit' : 'Izin';
    }
    // Tidak ada absensi dan tidak ada izin, berarti Alfa (guru tidak ada di array)
    return 'Alfa';
  }
  const statusMasuk = absensi.statusMasuk;
  const statusKeluar = absensi.statusKeluar;
  const hasJamMasuk = !!absensi.jamMasuk;
  const hasJamKeluar = !!absensi.jamKeluar;

  // Prioritas 1: IZIN/SAKIT dari status masuk (cek dulu sebelum logika lain)
  if (statusMasuk === 'izin') {
    return 'Izin';
  }
  if (statusMasuk === 'sakit') {
    return 'Sakit';
  }
  if (statusMasuk === 'alfa') {
    // Jika status masuk alfa, langsung return Alfa
    return 'Alfa';
  }

  // Cek apakah absen masuk valid (terlambat atau tepat waktu)
  const isMasukHadir = statusMasuk === 'tepat_waktu' || statusMasuk === 'terlambat';

  // Prioritas 2: IZIN/SAKIT - jika ada izin/sakit aktif SEBELUM melakukan absen masuk
  // (tidak ada jamMasuk yang valid)
  if (izinAktif) {
    // Jika belum ada jam masuk yang valid (belum absen masuk)
    if (!hasJamMasuk || !isMasukHadir) {
      // Jika ada izin aktif dan belum ada absen masuk yang valid, berarti Izin/Sakit
      return izinAktif.jenis === 'sakit' ? 'Sakit' : 'Izin';
    }
  }

  // Prioritas 3: HADIR - jika ada absen masuk (terlambat/tepat waktu) DAN absen keluar (pulang awal/tepat waktu)
  if (isMasukHadir && hasJamMasuk && hasJamKeluar) {
    if (statusKeluar === 'tepat_waktu' || statusKeluar === 'pulang_awal') {
      return 'Hadir';
    }
  }

  // Prioritas 4: DISPEN - jika ada absen masuk tapi untuk absen pulang melakukan izin atau sakit
  if (isMasukHadir && hasJamMasuk) {
    if (statusKeluar === 'izin' || statusKeluar === 'sakit') {
      return 'Dispen';
    }
  }

  // Prioritas 5: BOLOS - jika ada absen masuk tapi absen keluar alfa
  if (isMasukHadir && hasJamMasuk) {
    if (statusKeluar === 'alfa') {
      return 'Bolos';
    }
  }

  // Prioritas 6: ALFA - jika status keluar alfa
  if (statusKeluar === 'alfa') {
    return 'Alfa';
  }

  // Jika tidak memiliki absen masuk dan absen keluar = Alfa
  if (!hasJamMasuk && !hasJamKeluar) {
    return 'Alfa';
  }

  // Jika hanya ada status masuk tapi tidak ada status keluar yang jelas
  if (hasJamMasuk && !hasJamKeluar && statusKeluar === 'tidak_keluar') {
    // Jika ada jam masuk tapi belum ada keluar, belum bisa ditentukan (tunggu keluar atau auto alfa)
    return '-';
  }

  // Fallback untuk kasus lainnya
  return '-';
};

export const calculateAttendanceStats = (
  absensiGuru: AbsensiGuru[],
  izinGuru: IzinGuru[],
  gurus: User[],
  tanggal: string,
  tahunAjaranId?: string,
  getPengaturanAbsen?: () => any
) => {
  const absensiHariIni = getAbsensiForDate(absensiGuru, tanggal, tahunAjaranId);

  const stats = {
    totalGuru: gurus.length,
    sudahAbsenMasuk: absensiHariIni.filter(a => a.jamMasuk).length,
    sudahAbsenKeluar: absensiHariIni.filter(a => a.jamKeluar).length,
    tepatWaktuMasuk: absensiHariIni.filter(a => a.statusMasuk === 'tepat_waktu').length,
    terlambat: absensiHariIni.filter(a => a.statusMasuk === 'terlambat').length,
    tidakMasuk: gurus.length - absensiHariIni.filter(a => a.jamMasuk).length,
    izin: gurus.filter(guru => getGuruIzinForDate(izinGuru, guru.id, tanggal, tahunAjaranId)).length,
  };

  return stats;
};
