import { User, Kelas, MataPelajaran, JadwalPelajaran, TahunAjaran, AbsensiGuru } from '../types';
import { Jurusan, PengaturanAbsen, PengaturanIstirahat, DataKepsek } from '../types';
import { generateQRCodeData } from './qrCodeGenerator';

// Initialize admin user - used for all education levels
export const initializeAdminUser = () => {
  const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

  // Check if admin already exists
  const adminExists = users.find(u => u.email === 'admin@sekolah.com');

  if (!adminExists) {
    const adminUser: User = {
      id: 'admin1',
      name: 'Administrator',
      email: 'admin@sekolah.com',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    users.push(adminUser);
    localStorage.setItem('users', JSON.stringify(users));
    console.log('Admin user initialized successfully');
  }
};

// Minimal initialization for SD/SMP (only admin and basic settings)
export const initializeMinimalData = () => {
  // Initialize admin user first
  initializeAdminUser();

  // Initialize empty arrays for basic entities
  localStorage.setItem('jurusan', JSON.stringify([]));
  localStorage.setItem('kelas', JSON.stringify([]));
  localStorage.setItem('mataPelajaran', JSON.stringify([]));
  localStorage.setItem('jadwalPelajaran', JSON.stringify([]));
  localStorage.setItem('sesiAbsensi', JSON.stringify([]));
  localStorage.setItem('absensi', JSON.stringify([]));
  localStorage.setItem('suratIzin', JSON.stringify([]));
  localStorage.setItem('absensiGuru', JSON.stringify([]));
  localStorage.setItem('izinGuru', JSON.stringify([]));
  localStorage.setItem('guruMapel', JSON.stringify([]));
  localStorage.setItem('nilai', JSON.stringify([]));
  localStorage.setItem('infoSekolah', JSON.stringify([]));
  localStorage.setItem('pengumumanKelulusan', JSON.stringify([]));
  localStorage.setItem('statusKenaikanKelas', JSON.stringify([]));
  localStorage.setItem('statusBagiRaport', JSON.stringify([]));
  localStorage.setItem('alumni', JSON.stringify([]));
  localStorage.setItem('riwayatWaliKelas', JSON.stringify([]));
  localStorage.setItem('alatRfid', JSON.stringify([]));

  // Don't initialize tahun ajaran automatically - let admin add it
  localStorage.setItem('tahunAjaran', JSON.stringify([]));

  // Initialize default settings
  const defaultPengaturan: PengaturanAbsen[] = [
    {
      id: 'pengaturan1',
      jamMasuk: '07:00',
      toleransiMasuk: 15,
      jamPulang: '14:00',
      toleransiPulang: 15,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem('pengaturanAbsen', JSON.stringify(defaultPengaturan));

  const defaultPengaturanSKS: any[] = [
    {
      id: 'pengaturan-sks-1',
      durasiPerSKS: 45,
      istirahatAntarSKS: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem('pengaturanSKS', JSON.stringify(defaultPengaturanSKS));

  const defaultPengaturanIstirahat: PengaturanIstirahat[] = [
    {
      id: 'pengaturan-istirahat-1',
      jamMulai: '10:00',
      jamSelesai: '10:30',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem('pengaturanIstirahat', JSON.stringify(defaultPengaturanIstirahat));

  const defaultDataKepsek: DataKepsek[] = [];
  localStorage.setItem('dataKepsek', JSON.stringify(defaultDataKepsek));
};

export const initializeData = () => {
  // Clear all existing data first to ensure fresh start
  const keysToReset = [
    'users', 'jurusan', 'kelas', 'mataPelajaran', 'jadwalPelajaran',
    'tahunAjaran', 'sesiAbsensi', 'absensi', 'suratIzin', 'absensiGuru',
    'izinGuru', 'guruMapel', 'nilai', 'infoSekolah', 'pengumumanKelulusan',
    'statusKenaikanKelas', 'statusBagiRaport', 'alumni', 'riwayatWaliKelas',
    'pengaturanAbsen', 'pengaturanSKS', 'pengaturanIstirahat', 'dataKepsek', 'alatRfid'
  ];
  
  keysToReset.forEach(key => {
    localStorage.removeItem(key);
  });

  // Initialize users if not exists
  // Always reinitialize users with fresh seed data
    const users: User[] = [
      {
        id: 'admin1',
        name: 'Administrator',
        email: 'admin@sekolah.com',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'guru1',
        name: 'Bu Sari Matematika',
        email: 'sari@sekolah.com',
        role: 'guru',
        nip: '196501011990032001',
        password: 'abc1234',
        
        isWaliKelas: true,
        kelasWali: 'kelas1',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'guru2',
        name: 'Pak Budi Fisika',
        email: 'budi@sekolah.com',
        role: 'guru',
        nip: '197503151995121002',
        password: 'abc1234',

        isWaliKelas: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'murid1',
        name: 'Ahmad Fauzi',
        email: 'ahmad@student.com',
        role: 'murid',
        nisn: '1234567890',
        password: 'abc1234',
        kelasId: 'kelas1',
        isActive: true,
        qrCode: generateQRCodeData('murid1', '1234567890', 'Ahmad Fauzi', 'kelas1'),
        whatsappOrtu: '081234567890',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'murid2',
        name: 'Siti Nurhaliza',
        email: 'siti@student.com',
        role: 'murid',
        nisn: '1234567891',
        password: 'abc1234',
        kelasId: 'kelas1',
        isActive: true,
        qrCode: generateQRCodeData('murid2', '1234567891', 'Siti Nurhaliza', 'kelas1'),
        whatsappOrtu: '081234567891',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'murid3',
        name: 'Budi Santoso',
        email: 'budi@student.com',
        role: 'murid',
        nisn: '1234567892',
        password: 'abc1234',
        kelasId: 'kelas1',
        isActive: true,
        qrCode: generateQRCodeData('murid3', '1234567892', 'Budi Santoso', 'kelas1'),
        whatsappOrtu: '081234567892',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'murid4',
        name: 'Dewi Sartika',
        email: 'dewi@student.com',
        role: 'murid',
        nisn: '1234567893',
        password: 'abc1234',
        kelasId: 'kelas2',
        isActive: true,
        qrCode: generateQRCodeData('murid4', '1234567893', 'Dewi Sartika', 'kelas2'),
        whatsappOrtu: '081234567893',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('users', JSON.stringify(users));

  // Initialize jurusan
  // Always reinitialize jurusan with fresh seed data
    const jurusan: Jurusan[] = [
      {
        id: 'jurusan1',
        name: 'Ilmu Pengetahuan Alam',
        code: 'IPA',
        description: 'Program studi yang fokus pada mata pelajaran sains',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'jurusan2',
        name: 'Ilmu Pengetahuan Sosial',
        code: 'IPS',
        description: 'Program studi yang fokus pada mata pelajaran sosial',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'jurusan3',
        name: 'Bahasa',
        code: 'BHS',
        description: 'Program studi yang fokus pada mata pelajaran bahasa',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('jurusan', JSON.stringify(jurusan));

  // Initialize kelas
  // Always reinitialize kelas with fresh seed data
    const kelas: Kelas[] = [
      {
        id: 'kelas1',
        name: 'XII IPA 1',
        tingkat: 12,
        jurusanId: 'jurusan1',
        waliKelasId: 'guru1',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'kelas2',
        name: 'XII IPA 2',
        tingkat: 12,
        jurusanId: 'jurusan1',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('kelas', JSON.stringify(kelas));

  // Initialize mata pelajaran
  // Always reinitialize mata pelajaran with fresh seed data
    const mataPelajaran: MataPelajaran[] = [
      // Mata Pelajaran Umum (untuk semua jurusan)
      { id: 'mapel1', name: 'Matematika', code: 'MTK', sks: 4, keterangan: 'umum', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel2', name: 'Bahasa Indonesia', code: 'BIN', sks: 4, keterangan: 'umum', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel3', name: 'Bahasa Inggris', code: 'BIG', sks: 3, keterangan: 'umum', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel4', name: 'Pendidikan Agama', code: 'PAI', sks: 2, keterangan: 'umum', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel5', name: 'Pendidikan Kewarganegaraan', code: 'PKN', sks: 2, keterangan: 'umum', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel6', name: 'Sejarah Indonesia', code: 'SEJ', sks: 2, keterangan: 'umum', semester: 'ganjil', tingkatKelas: [10, 11] },
      { id: 'mapel7', name: 'Seni Budaya', code: 'SBD', sks: 2, keterangan: 'umum', semester: 'ganjil', tingkatKelas: [10, 11] },
      { id: 'mapel8', name: 'Pendidikan Jasmani', code: 'PJK', sks: 2, keterangan: 'umum', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      
      // Mata Pelajaran Jurusan IPA
      { id: 'mapel9', name: 'Fisika', code: 'FIS', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan1', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel10', name: 'Kimia', code: 'KIM', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan1', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel11', name: 'Biologi', code: 'BIO', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan1', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel12', name: 'Matematika Peminatan', code: 'MTKP', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan1', semester: 'ganjil', tingkatKelas: [11, 12] },
      
      // Mata Pelajaran Jurusan IPS
      { id: 'mapel13', name: 'Ekonomi', code: 'EKO', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan2', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel14', name: 'Geografi', code: 'GEO', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan2', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel15', name: 'Sosiologi', code: 'SOS', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan2', semester: 'genap', tingkatKelas: [11, 12] },
      { id: 'mapel16', name: 'Sejarah Peminatan', code: 'SEJP', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan2', semester: 'ganjil', tingkatKelas: [11, 12] },
      
      // Mata Pelajaran Jurusan Bahasa
      { id: 'mapel17', name: 'Bahasa dan Sastra Indonesia', code: 'BSI', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan3', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel18', name: 'Bahasa dan Sastra Inggris', code: 'BSE', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan3', semester: 'keduanya', tingkatKelas: [10, 11, 12] },
      { id: 'mapel19', name: 'Bahasa Asing Lain', code: 'BAL', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan3', semester: 'genap', tingkatKelas: [11, 12] },
      { id: 'mapel20', name: 'Antropologi', code: 'ANT', sks: 4, keterangan: 'jurusan', jurusanId: 'jurusan3', semester: 'ganjil', tingkatKelas: [12] },
    ];
    localStorage.setItem('mataPelajaran', JSON.stringify(mataPelajaran));

  // Initialize jadwal
  // Always reinitialize jadwal with fresh seed data
    const jadwal: JadwalPelajaran[] = [
      {
        id: 'jadwal1',
        kelasId: 'kelas1',
        mataPelajaranId: 'mapel1',
        guruId: 'guru1',
        hari: 'senin',
        jamMulai: '07:00',
        jamSelesai: '08:30',
        semester: 2,
        tahunAjaran: '2025/2026',
      },
      {
        id: 'jadwal2',
        kelasId: 'kelas1',
        mataPelajaranId: 'mapel2',
        guruId: 'guru2',
        hari: 'selasa',
        jamMulai: '08:30',
        jamSelesai: '10:00',
        semester: 2,
        tahunAjaran: '2025/2026',
      },
      {
        id: 'jadwal3',
        kelasId: 'kelas1',
        mataPelajaranId: 'mapel3',
        guruId: 'guru2',
        hari: 'rabu',
        jamMulai: '10:00',
        jamSelesai: '11:30',
        semester: 2,
        tahunAjaran: '2025/2026',
      },
      {
        id: 'jadwal4',
        kelasId: 'kelas2',
        mataPelajaranId: 'mapel1',
        guruId: 'guru1',
        hari: 'kamis',
        jamMulai: '07:00',
        jamSelesai: '08:30',
        semester: 2,
        tahunAjaran: '2025/2026',
      },
    ];
    localStorage.setItem('jadwalPelajaran', JSON.stringify(jadwal));

  // Initialize tahun ajaran
  // Always reinitialize tahun ajaran with fresh seed data
    const tahunAjaran: TahunAjaran[] = [
      {
        id: 'ta1',
        tahun: '2025/2026',
        semester: 2,
        isActive: true,
        tanggalMulai: '2025-01-01',
        tanggalSelesai: '2025-11-30',
      },
    ];
    localStorage.setItem('tahunAjaran', JSON.stringify(tahunAjaran));

  // Initialize empty arrays for other entities
  // Always reset to empty arrays
    localStorage.setItem('sesiAbsensi', JSON.stringify([]));
    localStorage.setItem('absensi', JSON.stringify([]));
    localStorage.setItem('suratIzin', JSON.stringify([]));
    const defaultAbsensiGuru: AbsensiGuru[] = [];
    localStorage.setItem('absensiGuru', JSON.stringify(defaultAbsensiGuru));
    localStorage.setItem('izinGuru', JSON.stringify([]));
    localStorage.setItem('guruMapel', JSON.stringify([]));
    localStorage.setItem('nilai', JSON.stringify([]));
  
  // Initialize info sekolah
    localStorage.setItem('infoSekolah', JSON.stringify([]));
  
  // Initialize pengumuman kelulusan
    localStorage.setItem('pengumumanKelulusan', JSON.stringify([]));
  
  // Initialize status kenaikan kelas
    localStorage.setItem('statusKenaikanKelas', JSON.stringify([]));
  
  // Initialize status bagi raport
    localStorage.setItem('statusBagiRaport', JSON.stringify([]));
  
  // Initialize alumni
    localStorage.setItem('alumni', JSON.stringify([]));
  
  // Initialize riwayat wali kelas
    localStorage.setItem('riwayatWaliKelas', JSON.stringify([]));
  
  // Initialize pengaturan absen
  // Always reinitialize pengaturan absen with fresh seed data
    const defaultPengaturan: PengaturanAbsen[] = [
      {
        id: 'pengaturan1',
        jamMasuk: '08:00',
        toleransiMasuk: 15,
        jamPulang: '16:00',
        toleransiPulang: 15,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('pengaturanAbsen', JSON.stringify(defaultPengaturan));

  // Initialize pengaturan SKS
  // Always reinitialize pengaturan SKS with fresh seed data
    const defaultPengaturanSKS: PengaturanSKS[] = [
      {
        id: 'pengaturan-sks-1',
        durasiPerSKS: 45, // 45 menit per SKS
        istirahatAntarSKS: 0, // Tidak ada istirahat antar SKS dalam 1 mata pelajaran
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('pengaturanSKS', JSON.stringify(defaultPengaturanSKS));

  // Initialize pengaturan istirahat
  // Always reinitialize pengaturan istirahat with fresh seed data
    const defaultPengaturanIstirahat: PengaturanIstirahat[] = [
      {
        id: 'pengaturan-istirahat-1',
        jamMulai: '12:00',
        jamSelesai: '13:00',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('pengaturanIstirahat', JSON.stringify(defaultPengaturanIstirahat));

  // Initialize data kepala sekolah
  // Always reinitialize data kepala sekolah with fresh seed data
    const defaultDataKepsek: DataKepsek[] = [];
    localStorage.setItem('dataKepsek', JSON.stringify(defaultDataKepsek));

  // Initialize alat RFID
  // Always reinitialize alat RFID with fresh seed data
    const defaultAlatRfid: any[] = [];
    localStorage.setItem('alatRfid', JSON.stringify(defaultAlatRfid));
};