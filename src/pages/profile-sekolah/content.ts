export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  coverGradient?: string;
  imageUrl?: string;
};

export type AchievementItem = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  level?: 'Kota' | 'Provinsi' | 'Nasional' | 'Internasional';
  coverGradient?: string;
  imageUrl?: string;
};

export const newsItems: NewsItem[] = [
  {
    id: 'pembukaan-ppdb-2026',
    title: 'Pembukaan Pendaftaran Peserta Didik Baru 2026',
    excerpt: 'SPMB dibuka! Cek jadwal, persyaratan, dan jalur pendaftaran.',
    date: '2026-03-10',
    coverGradient: 'from-sky-600 to-emerald-600',
    content:
      'Pendaftaran peserta didik baru tahun 2026 telah dibuka. Calon peserta didik dapat memilih jalur pendaftaran sesuai ketentuan. Pastikan menyiapkan dokumen yang dibutuhkan dan mengikuti jadwal seleksi.\n\nUntuk informasi lengkap, silakan kunjungi halaman Informasi SPMB di aplikasi.',
  },
  {
    id: 'kunjungan-industri',
    title: 'Kunjungan Industri: Belajar Langsung di Dunia Kerja',
    excerpt: 'Siswa mengikuti kunjungan industri untuk mengenal budaya kerja dan teknologi terbaru.',
    date: '2026-02-21',
    coverGradient: 'from-amber-500 to-rose-600',
    content:
      'Kegiatan kunjungan industri bertujuan memperkuat pemahaman peserta didik terhadap praktik kerja di industri. Siswa mendapatkan wawasan tentang proses kerja, standar keselamatan, hingga kebutuhan kompetensi yang relevan.\n\nKegiatan ini juga menjadi sarana memperluas jejaring kemitraan sekolah dengan DU/DI.',
  },
  {
    id: 'workshop-kurikulum',
    title: 'Workshop Kurikulum Berbasis Proyek',
    excerpt: 'Guru menyusun perangkat ajar berbasis proyek untuk meningkatkan kompetensi.',
    date: '2026-01-30',
    coverGradient: 'from-violet-600 to-fuchsia-600',
    content:
      'Workshop internal dilaksanakan untuk menyusun perangkat ajar berbasis proyek (PjBL). Fokus kegiatan adalah penyelarasan capaian pembelajaran, rubrik penilaian, dan integrasi budaya kerja industri ke dalam pembelajaran.\n\nHasil workshop akan diterapkan pada semester berjalan.',
  },
];

export const achievementItems: AchievementItem[] = [
  {
    id: 'lks-provinsi-rpl-2026',
    title: 'Juara 2 LKS Provinsi Bidang RPL',
    excerpt: 'Tim RPL meraih Juara 2 pada LKS tingkat provinsi.',
    date: '2026-03-01',
    level: 'Provinsi',
    coverGradient: 'from-emerald-600 to-teal-600',
    content:
      'Prestasi membanggakan diraih oleh peserta didik bidang Rekayasa Perangkat Lunak. Melalui persiapan intensif, tim berhasil menunjukkan kemampuan dalam perancangan dan pengembangan aplikasi sesuai studi kasus lomba.\n\nTerima kasih kepada pembimbing, orang tua, dan seluruh pihak yang telah mendukung.',
  },
  {
    id: 'pencak-silat-kota',
    title: 'Juara 1 Pencak Silat Tingkat Kota',
    excerpt: 'Ekstrakurikuler pencak silat membawa pulang medali emas.',
    date: '2026-02-08',
    level: 'Kota',
    coverGradient: 'from-rose-600 to-orange-500',
    content:
      'Atlet pencak silat sekolah meraih Juara 1 pada kejuaraan tingkat kota. Prestasi ini menjadi bukti pembinaan yang konsisten serta semangat juang tinggi.\n\nSemoga capaian ini menjadi motivasi untuk berprestasi di tingkat yang lebih tinggi.',
  },
  {
    id: 'inovasi-teknologi-nasional',
    title: 'Finalis Lomba Inovasi Teknologi Nasional',
    excerpt: 'Proyek IoT siswa masuk babak final lomba inovasi tingkat nasional.',
    date: '2025-12-12',
    level: 'Nasional',
    coverGradient: 'from-indigo-600 to-sky-600',
    content:
      'Proyek inovasi berbasis IoT yang dikembangkan oleh siswa berhasil lolos ke babak final tingkat nasional. Proyek ini menggabungkan sensor, dashboard pemantauan, dan notifikasi otomatis.\n\nSelamat dan sukses untuk tim serta pembimbing. Terus berkarya dan berinovasi.',
  },
];

