export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'guru' | 'murid' | 'kepala_sekolah';
  avatar?: string;
  profileImage?: string;
  createdAt: string;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Guru extends User {
  role: 'guru';
  username?: string;
  nip: string;
  password: string;
  subject?: string;
  isWaliKelas: boolean;
  kelasWali?: string;
  isActive?: boolean;
  rfidGuid?: string;
  riwayatKelasWali?: Array<{
    kelasId: string;
    tahunAjaran: string;
    semester: number;
  }>;
}

export interface Murid extends User {
  role: 'murid';
  nisn: string;
  password: string;
  kelasId: string;
  qrCode: string;
  whatsappOrtu?: string;
  isActive?: boolean;
  rfidGuid?: string;
}

export interface Kelas {
  id: string;
  name: string;
  tingkat: number;
  jurusanId?: string;
  waliKelasId?: string;
  createdAt: string;
}

export interface Jurusan {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MataPelajaran {
  id: string;
  name: string;
  code: string;
  sks: number;
  keterangan: 'umum' | 'jurusan' | 'agama';
  jurusanId?: string; // Only for 'jurusan' type
  semester: 'ganjil' | 'genap' | 'keduanya';
  tingkatKelas: number[]; // Array of class levels [10, 11, 12]
}

export interface JadwalPelajaran {
  id: string;
  kelasId: string;
  mataPelajaranId: string;
  guruId: string;
  hari: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
  jamMulai: string;
  jamSelesai: string;
  semester: number;
  tahunAjaran: string;
}

export type HariTahfiz =
  | 'senin'
  | 'selasa'
  | 'rabu'
  | 'kamis'
  | 'jumat'
  | 'sabtu'
  | 'minggu';

export interface TahfizSchedule {
  id: string;
  kelasId: string;
  hari: HariTahfiz;
  jamMulai: string;
  jamSelesai: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AbsensiPelajaran {
  id: string;
  muridId: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa' | 'terlambat' | 'pulang_cepat';
  waktu: string; // ISO timestamp
  keterangan?: string;
  method: 'qr' | 'manual' | 'admin-qr';
  statusAbsen?: 'hadir' | 'terlambat' | 'pulang_cepat' | 'tepat_waktu';
  keteranganAbsensi?: 'Hadir' | 'Izin' | 'Sakit' | 'Bolos' | 'Dispen' | 'Alfa';
  // Informasi sumber data (untuk kebutuhan audit/fallback)
  sumberData?: 'worker' | 'server';
  sumberDataUpdatedAt?: string;
}

export interface SesiAbsensi {
  id: string;
  jadwalId: string;
  tanggal: string;
  jamBuka: string;
  jamTutup?: string;
  status: 'dibuka' | 'ditutup';
  createdBy: string;
  jurnal?: JurnalMengajar;
  dataAbsensi?: AbsensiPelajaran[]; // Array of absensi pelajaran murid
  tahunAjaranId: string;
  semester: number;
}

export interface SesiAbsensiTahfiz {
  id: string;
  jadwalId: string;
  tanggal: string;
  jamBuka: string;
  jamTutup?: string;
  status: 'dibuka' | 'ditutup';
  createdBy: string;
  dataAbsensi?: AbsensiPelajaran[]; // Array of absensi pelajaran murid
  tahun: string; // Only year, no semester
}

export interface JurnalMengajar {
  judul: string;
  deskripsi: string;
  waktuInput: string;
  file?: {
    name: string;
    type: string;
    data: string;
    size: number;
  };
}

export interface FotoMengajarTahfiz {
  id: string;
  fotoBase64: string;
  waktuFoto: string;
  keterangan?: string;
}

export interface PertemuanTahfiz {
  tanggal: string;
  judul: string;
  deskripsi: string;
  waktuInput: string;
  file?: {
    name: string;
    type: string;
    data: string;
    size: number;
  };
  fotoMengajar?: FotoMengajarTahfiz; // One photo per pertemuan
}

export interface JurnalTahfiz {
  id: string;
  jadwalId: string;
  kelasId: string;
  // Old structure fields (for backward compatibility)
  tanggal?: string;
  judul?: string;
  deskripsi?: string;
  waktuInput?: string;
  file?: {
    name: string;
    type: string;
    data: string;
    size: number;
  };
  fotoMengajar?: FotoMengajarTahfiz;
  // New structure field
  pertemuan?: PertemuanTahfiz[];
  tahun: string; // Only year, no semester
  createdAt: string;
  updatedAt: string;
}

export interface Absensi {
  id: string;
  // sesiId is deprecated; do not rely on it. Use tanggal + kelasId instead
  sesiId?: string;
  muridId: string;
  // Required daily attendance identifiers
  tanggal: string; // 'YYYY-MM-DD'
  kelasId: string;
  // Masuk and pulang in one structure (like AbsensiGuru)
  jamMasuk?: string; // ISO timestamp or time string
  jamKeluar?: string; // ISO timestamp or time string
  statusMasuk: 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa' | 'hadir';
  statusKeluar?: 'tepat_waktu' | 'pulang_awal' | 'tidak_keluar' | 'izin' | 'sakit' | 'alfa' | 'pulang_cepat';
  // Legacy fields for backward compatibility (deprecated)
  tipeAbsen?: 'masuk' | 'pulang'; // Deprecated, kept for migration
  status?: 'hadir' | 'izin' | 'sakit' | 'alfa' | 'terlambat' | 'pulang_cepat'; // Deprecated
  waktu?: string; // ISO timestamp - deprecated, use jamMasuk/jamKeluar
  keterangan?: string;
  method?: 'qr' | 'manual' | 'admin-qr';
  tahunAjaranId: string;
  semester: number;
  statusAbsen?: 'hadir' | 'terlambat' | 'pulang_cepat' | 'tepat_waktu';
  keteranganAbsensi?: 'Hadir' | 'Izin' | 'Sakit' | 'Bolos' | 'Dispen' | 'Alfa';
}

// Non-session based daily attendance aggregation per class and type
export interface AbsenHarianMuridRecord {
  muridId: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa';
  waktu?: string;
  keterangan?: string;
  method?: 'qr' | 'manual' | 'admin-qr';
  statusAbsen?: 'hadir' | 'terlambat' | 'pulang_cepat' | 'tepat_waktu';
  keteranganAbsensi?: 'Hadir' | 'Izin' | 'Sakit' | 'Bolos' | 'Dispen' | 'Alfa';
}

export interface AbsenHarianMurid {
  id: string; // `${tanggal}-${kelasId}-${tipeAbsen}`
  tanggal: string; // 'YYYY-MM-DD'
  kelasId: string;
  tipeAbsen: 'masuk' | 'pulang';
  records: AbsenHarianMuridRecord[];
}

export interface SuratIzin {
  id: string;
  muridId: string;
  jenis: 'izin' | 'sakit' | 'izin_dispen';
  alasan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  jamMulai?: string;
  jamSelesai?: string;
  bukti?: string;
  status: 'menunggu' | 'diterima' | 'ditolak';
  keterangan?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  tahunAjaranId: string;
  createdAt: string;
}

export interface TahunAjaran {
  id: string;
  tahun: string;
  semester: number;
  isActive: boolean;
  tanggalMulai: string;
  tanggalSelesai: string;
  isAutoCreated?: boolean;
}

export interface AbsensiGuru {
  id: string;
  guruId: string;
  tanggal: string;
  jamMasuk?: string;
  jamKeluar?: string;
  statusMasuk: 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa';
  statusKeluar: 'tepat_waktu' | 'pulang_awal' | 'tidak_keluar' | 'izin' | 'sakit' | 'alfa';
  keterangan?: string;
  keteranganAbsensi?: 'Hadir' | 'Izin' | 'Sakit' | 'Bolos' | 'Dispen' | 'Alfa';
  fotoMengajar?: FotoMengajar[];
  tahunAjaranId: string;
  semester: number;
  createdAt: string;
}

export interface FotoMengajar {
  id: string;
  jadwalId: string;
  mataPelajaranId: string;
  kelasId: string;
  fotoBase64: string;
  waktuFoto: string;
  keterangan?: string;
}

export interface PengaturanAbsen {
  id: string;
  jamMasuk: string;
  toleransiMasuk: number; // dalam menit
  jamPulang: string;
  toleransiPulang: number; // dalam menit
  hariSekolah?: number[]; // Array hari sekolah untuk murid (0=Minggu, 1=Senin, ..., 6=Sabtu)
  hariKerja?: number[]; // Array hari kerja untuk guru (0=Minggu, 1=Senin, ..., 6=Sabtu)
  isActive: boolean;
  enableManualAbsen?: boolean; // Enable/disable manual attendance
  createdAt: string;
}

export interface PengaturanSKS {
  id: string;
  durasiPerSKS: number; // dalam menit (default: 45 menit)
  istirahatAntarSKS: number; // dalam menit (default: 0 menit)
  isActive: boolean;
  createdAt: string;
}

export interface PengaturanIstirahat {
  id: string;
  jamMulai: string; // jam mulai istirahat (default: 12:00)
  jamSelesai: string; // jam selesai istirahat (default: 13:00)
  isActive: boolean;
  createdAt: string;
}

export interface GuruPenggantiJadwal {
  jadwalId: string;
  tanggal: string;
  guruPenggantiId: string;
}

export interface IzinGuru {
  id: string;
  guruId: string;
  jenis: 'izin' | 'sakit' | 'cuti' | 'izin_dispen';
  alasan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  jamMulai?: string;
  jamSelesai?: string;
  bukti?: string;
  guruPenggantiList?: GuruPenggantiJadwal[];
  status: 'menunggu' | 'diterima' | 'ditolak';
  keterangan?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  tahunAjaranId: string;
  createdAt: string;
}

export interface GuruMapel {
  id: string;
  guruId: string;
  mataPelajaranId: string;
  isActive: boolean;
  createdAt: string;
}

// CBT (Computer Based Test)
export interface CBTKelas {
  id: string;
  guruId: string;
  tingkat: number;
  mataPelajaranId: string;
  semester: number;
  tahunAjaran: string;
  createdAt: string;
  updatedAt: string;
}

export type CBTQuestionType =
  | 'pilihan_ganda'
  | 'pilihan_ganda_kompleks'
  | 'benar_salah'
  | 'menjodohkan'
  | 'essay'
  | 'custom';

export type CBTConcreteQuestionType = Exclude<CBTQuestionType, 'custom'>;

export interface CBTOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface CBTMatchingPair {
  id: string;
  left: string;
  right: string;
}

/** Satu item soal di dalam array bank (embedded, tanpa ref ke kelas/bank) */
export interface CBTSoalItem {
  id: string;
  tipe: CBTQuestionType;
  pertanyaan: string;
  poin: number;
  opsi?: CBTOption[];
  jawabanBenar?: any;
  pasanganMenjodohkan?: CBTMatchingPair[];
  menjodohkanScoring?: 'semua_benar' | 'minimal_benar';
  menjodohkanMinimalBenar?: number;
  gambar?: string | null;
}

export interface CBTBankSoal {
  id: string;
  cbtKelasId: string;
  guruId: string;
  judul: string;
  kategoriId: string;
  kategoriNama: string;
  tipe: CBTQuestionType;
  /** Maksimal jumlah soal yang boleh ditambahkan ke bank ini */
  totalSoal?: number;
  /**
   * Jika tipe = 'custom', tentukan kuota per tipe soal (yang dipilih).
   * Contoh: { pilihan_ganda: 10, essay: 5 }
   */
  customKuota?: Partial<Record<CBTConcreteQuestionType, number>>;
  /** Semua soal di bank ini (misal 50 soal pilihan ganda = 50 item) */
  soal?: CBTSoalItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CBTSoalInputAssignment {
  id: string;
  guruId: string;
  kategoriId: string;
  kategoriNama: string;
  mataPelajaranId: string;
  tingkat: number;
  jurusanId?: string;
  tahunAjaran: string;
  semester: number;
  createdAt: string;
  updatedAt: string;
}

export interface CBTUjian {
  id: string;
  guruId: string;
  cbtKelasId: string;
  kelasId: string;
  mataPelajaranId: string;
  bankSoalId: string;
  bankSoalJudul: string;
  kategoriId: string;
  kategoriNama: string;
  /** Menandai apakah komponen nilai ini bertipe ganda (memiliki nilai ke-1, ke-2, dst) */
  kategoriHasNilai?: boolean;
  /** Untuk kategori ganda: tugas ke-1, ke-2, dst */
  kategoriKe?: number | null;
  tahunAjaran: string;
  semester: number;
  judulUjian: string;
  tanggalMulai: string; // 'YYYY-MM-DD'
  jamMulai: string; // 'HH:mm'
  tanggalSelesai: string; // 'YYYY-MM-DD'
  jamSelesai: string; // 'HH:mm'
  durasiMenit: number;
  acakSoal: boolean;
  tunjukanHasilNilai: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CBTUjianResponse {
  soalId: string;
  tipe: CBTQuestionType;
  selectedOptionIds?: string[];
  jawabanBoolean?: boolean;
  jawabanEssay?: string;
  /** Untuk menjodohkan: mapping jawaban murid per item kiri */
  jawabanMenjodohkan?: Array<{ leftId: string; rightId: string }>;
  poinAuto?: number;
  isCorrectAuto?: boolean;
  /** Untuk essay manual: true = benar, false = salah (backend bisa pakai ini atau isCorrectAuto) */
  isCorrect?: boolean;
}

export interface CBTUjianAttempt {
  id: string;
  ujianId: string;
  muridId: string;
  kelasId: string;
  mataPelajaranId: string;
  status: 'belum_mulai' | 'sedang' | 'selesai';
  startedAt: string;
  finishedAt?: string | null;
  durasiMenit: number;
  skorAuto?: number;
  skorEssayManual?: number | null;
  skorTotal?: number | null;
  responses?: CBTUjianResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Nilai {
  id: string;
  muridId: string;
  mataPelajaranId: string;
  kelasId: string;
  guruId: string;
  semester: number;
  tahunAjaran: string;
  tugas: NilaiTugas[];
  uts: number | null;
  uas: number | null;
  nilaiAkhir: number | null;
  grade: string | null;
  komponenDinamis?: NilaiKomponen[];
  createdAt: string;
  updatedAt: string;
}

export interface NilaiTugas {
  id: string;
  nama: string;
  nilai: number;
  tanggal: string;
  keterangan?: string;
}

export interface NilaiKomponen {
  id: string;
  komponenId: string;
  komponenNama: string;
  nilai: number;
  tanggal: string;
  keterangan?: string;
}

export interface KomponenNilai {
  kehadiran: number; // 10%
  tugas: number;     // 30%
  uts: number;       // 30%
  uas: number;       // 30%
}

export interface PengaturanGrade {
  id: string;
  grade: string;
  minNilai: number;
  maxNilai: number;
  deskripsi?: string;
  isDefault?: boolean;
}

export interface PengaturanKomponenNilai {
  id: string;
  nama: string;
  persentase: number;
  isDefault?: boolean;
  hasNilai?: boolean;
  createdAt?: string;
}

export interface InfoSekolah {
  id: string;
  judul: string;
  konten: string;
  jenis: 'umum' | 'kelulusan' | 'kenaikan_kelas' | 'bagi_raport';
  target: 'semua' | 'guru' | 'murid' | 'kelas_12';
  kelasId?: string; // untuk kenaikan kelas spesifik
  gambar?: string; // Base64 image atau URL gambar poster
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
}

export interface PengumumanKelulusan {
  id: string;
  tahunAjaran: string;
  tanggalPengumuman: string;
  isPublished: boolean;
  isProcessed?: boolean;
  snapshotMuridIds?: string[]; // Snapshot of murid IDs at time of announcement
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
}

export interface StatusKenaikanKelas {
  id: string;
  kelasIds: string[]; // Array of kelas IDs
  tahunAjaran: string;
  semester: number;
  isPublished: boolean;
  publishedKelasIds?: string[]; // Array of kelas IDs that have been published
  publishedBy?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface StatusBagiRaport {
  id: string;
  kelasId: string;
  tahunAjaran: string;
  semester: number;
  isPublished: boolean;
  publishedBy?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface RiwayatKelasMurid {
  id: string;
  muridId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: number;
  status: 'aktif' | 'naik' | 'tidak_naik' | 'lulus' | 'tidak_lulus';
  createdAt: string;
}

export interface Alumni {
  id: string;
  muridId: string;
  nama: string;
  nisn: string;
  kelasId: string;
  namaKelas: string;
  jurusanId?: string;
  namaJurusan?: string;
  tahunLulus: string;
  nilaiAkhir: number;
  tingkatKehadiran: number;
  peringkatKelas: number;
  peringkatSekolah: number;
  tanggalLulus: string;
  waliKelasSebelumnya?: string; // ID guru yang menjadi wali kelas saat murid ini lulus
  namaWaliKelasSebelumnya?: string; // Nama guru wali kelas
  nipWaliKelasSebelumnya?: string; // NIP guru wali kelas
  createdAt: string;
}

export interface RiwayatWaliKelas {
  id: string;
  guruId: string;
  kelasId: string;
  namaKelas: string;
  tahunAjaran: string;
  jumlahMuridLulus: number;
  jumlahMuridTidakLulus: number;
  tanggalKelulusan: string;
  createdAt: string;
}

export interface DataKepsek {
  id: string;
  nama: string;
  email: string;
  password: string;
  nip?: string;
  noHP?: string;
  createdAt: string;
}

export interface ProfilSekolah {
  id: string;
  namaSekolah: string;
  npsn?: string;
  alamat: string;
  kota?: string;
  provinsi?: string;
  kodePos?: string;
  email?: string;
  nomorTelepon?: string;
  website?: string;
  logoSekolah?: string;
  deskripsi?: string;
  misiSekolah?: string;
  visiSekolah?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LandingBerita {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LandingPrestasi {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  level?: 'Kota' | 'Provinsi' | 'Nasional' | 'Internasional';
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface BackgroundKTA {
  id: string;
  backgroundDepanBase64?: string;
  backgroundBelakangBase64?: string;
  backgroundDepanMuridBase64?: string;
  backgroundBelakangMuridBase64?: string;
  backgroundDepanGuruBase64?: string;
  backgroundBelakangGuruBase64?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AlatRFID {
  id: string;
  namaAlat: string;
  lokasi: string;
  token: string;
  /** Jenis absen: 'rfid' | 'facerecognition' */
  jenisAbsen?: 'rfid' | 'facerecognition';
  status: 'aktif' | 'nonaktif';
  createdAt: string;
  updatedAt?: string;
}

export interface ScanRFID {
  id: string;
  alatRfidId: string;
  rfidGuid: string;
  userId: string;
  tipeAbsen: 'masuk' | 'keluar';
  timestamp: string;
  status: 'berhasil' | 'gagal';
  keterangan?: string;
}

export interface WaliKelasSettings {
  system: 'otomatis' | 'tetap' | 'hapus';
  lastUpdated: string;
}

export interface PengaturanJenjangPendidikan {
  id: string;
  jenjang: 'SD' | 'SMP' | 'SMA/SMK';
  isActive: boolean;
  tingkatAwal?: number;  // SD: 1, SMP: 7, SMA/SMK: 10
  tingkatAkhir?: number; // SD: 6, SMP: 9, SMA/SMK: 12
  createdAt: string;
}

export interface SystemActivation {
  id: string;
  isSystemActive: boolean;
  activatedAt?: string;
  activatedBy?: string;
  createdAt: string;
}

// Legacy interface for backward compatibility (flattened structure)
export interface CapaianPembelajaran {
  id: string;
  guruId: string;
  tingkat: number;
  mataPelajaranId: string;
  capaianPembelajaran: string;
  tahunAjaran: string;
  semester: number;
  createdAt: string;
}

// New interface for array-based structure
export interface CapaianPembelajaranKelas {
  id: string;
  guruId: string;
  tahunAjaran: string;
  semester: number;
  tingkatData: Array<{
    tingkat: number;
    mataPelajaranData: Array<{
      mataPelajaranId: string;
      capaianPembelajaran: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
  guru?: {
    id: string;
    name: string;
    nip: string;
  };
}

export interface Ekstrakulikuler {
  id: string;
  nama: string;
  deskripsi?: string;
  pembinaId: string;
  pembina?: {
    id: string;
    name: string;
    nip?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
// Legacy interface for backward compatibility (flattened structure)
export interface NilaiEkstrakulikuler {
  id: string;
  muridId: string;
  ekstrakulikulerId: string;
  nilai: number;
  predikat: string;
  keterangan: string;
  semester: number;
  tahunAjaran: string;
  createdAt: string;
  updatedAt: string;
  ekstrakulikuler?: {
    id: string;
    nama: string;
    deskripsi?: string;
  };
  murid?: {
    id: string;
    name: string;
    nisn: string;
  };
}

// New interface for class-based structure (like Kokulikuler)
export interface NilaiEkstrakulikulerKelas {
  id: string;
  kelasId: string;
  waliKelasId: string;
  tahunAjaran: string;
  semester: number;
  muridData: Array<{
    muridId: string;
    nilaiEkstrakulikuler: Array<{
      ekstrakulikulerId: string;
      nilai: number;
      predikat: string;
      keterangan: string;
      ekstrakulikuler?: {
        id: string;
        nama: string;
        deskripsi?: string;
      };
    }>;
    murid?: {
      id: string;
      name: string;
      nisn: string;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  kelas?: {
    id: string;
    name: string;
    tingkat: number;
  };
  waliKelas?: {
    id: string;
    name: string;
    nip: string;
  };
}

// New interface for class-based structure (like Kokulikuler)
export interface NilaiEkstrakulikulerKelas {
  id: string;
  kelasId: string;
  waliKelasId: string;
  tahunAjaran: string;
  semester: number;
  muridData: Array<{
    muridId: string;
    nilaiEkstrakulikuler: Array<{
      ekstrakulikulerId: string;
      nilai: number;
      predikat: string;
      keterangan: string;
      ekstrakulikuler?: {
        id: string;
        nama: string;
        deskripsi?: string;
      };
    }>;
    murid?: {
      id: string;
      name: string;
      nisn: string;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  kelas?: {
    id: string;
    name: string;
    tingkat: number;
  };
  waliKelas?: {
    id: string;
    name: string;
    nip: string;
  };
}

export interface Kokulikuler {
  id: string;
  kelasId: string;
  waliKelasId: string;
  tahunAjaran: string;
  semester: number;
  muridData: Array<{
    muridId: string;
    kokulikuler: string;
    murid?: {
      id: string;
      name: string;
      nisn: string;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  kelas?: {
    id: string;
    name: string;
    tingkat: number;
  };
  waliKelas?: {
    id: string;
    name: string;
    nip: string;
  };
}

export interface ERaport {
  id: string;
  kelasId: string;
  waliKelasId: string;
  tahunAjaran: string;
  semester: number;
  kelas: {
    nama: string;
    tingkat: number;
  };
  waliKelas: {
    namaGuru: string;
    nip: string;
  };
  sekolah: {
    namaSekolah: string;
    alamatSekolah: string;
  };
  kepalaSekolah: {
    namaKepalaSekolah: string;
    nip: string;
  };
  muridData: Array<{
    muridId: string;
    namaMurid: string;
    nisn: string;
    kelas: string;
    fase: string;
    semester: number;
    tahunAjaran: string;
    namaOrangTua: string;
    nilaiMataPelajaran: Array<{
      mataPelajaranId: string;
      mataPelajaran: string;
      nilaiAkhir: number;
      capaianPembelajaran: string;
    }>;
    kokulikuler: string;
    nilaiEkstrakulikuler: Array<{
      ekstrakulikulerId: string;
      namaEkstrakulikuler: string;
      predikat: string;
      keterangan: string;
    }>;
    kehadiran: {
      sakit: number;
      izin: number;
      alfa: number;
    };
    catatanWaliKelas: string;
    keteranganKenaikanKelas: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SpmbOpening {
  id: string;
  tahunAjaran: string;
  judul: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  isActive: boolean;
  createdAt: string;
}

export interface SpmbRegistration {
  id: string;
  openingId: string;
  tahunAjaran: string;
  namaLengkap: string;
  jenisKelamin?: 'L' | 'P';
  umur?: number;
  nisn?: string;
  email?: string;
  noWhatsappOrtu: string;
  asalSekolah: string;
  alamat: string;
  pilihanJurusan?: string;
   nikAnak?: string;
   nomorKk?: string;
   tempatLahir?: string;
   tanggalLahir?: string;
   namaOrangTua?: string;
   nikOrangTua?: string;
   pekerjaanOrangTua?: string;
   noHpOrangTua?: string;
   ringkasanNilaiRapor?: number;
   dokumenKk?: string;
   dokumenAktaKelahiran?: string;
   dokumenKtpOrangTua?: string;
   dokumenKartuImunisasi?: string;
   dokumenPasFoto?: string;
   dokumenIjazahAtauSkL?: string;
   dokumenRapor?: string;
   dokumenKip?: string;
   dokumenSertifikatPrestasi?: string;
   dokumenSuratKeteranganSehat?: string;
  assignedToClass?: boolean;
  assignedClassId?: string;
  status: 'pending' | 'diterima' | 'ditolak';
  createdAt: string;
}
