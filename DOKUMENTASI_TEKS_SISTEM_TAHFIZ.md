# DOKUMENTASI TEKS SISTEM TAHFIZ

Dokumentasi ini berisi semua teks/kalimat yang muncul di setiap halaman dan menu untuk sistem sekolah tahfiz.

---

## 1. KEPALA SEKOLAH (Sistem Tahfiz)

### 1.1. Dashboard
**File**: `KepalaSekolahDashboard.tsx`

#### Header/Welcome Section
- "Selamat Datang" / "Welcome"
- Tanggal saat ini (format: hari, tanggal bulan tahun)
- "Tahun" / "Year"
- Tahun aktif (contoh: "2024")

#### Statistik Utama (Main Stats)
- "Total Ustadz" / "Jumlah Ustadz"
- "Total Santri" / "Jumlah Santri"
- "Total Kelas"
- "Kehadiran Ustadz Hari Ini"

#### Status Sistem
- "Status Sistem"
- "Tahun Aktif"
- Tahun (contoh: "2024")
- "Aktif"
- "Tidak Aktif"
- "Tingkat Kehadiran Ustadz"
- "dari" / "of"
- "ustadz"
- "Tidak ada jadwal hari ini"
- "Jadwal Aktif"
- "Tahun"
- Jumlah jadwal (angka)
- "Pengaturan Absen"
- Jam masuk - Jam pulang (contoh: "07:00 - 14:00")
- "Belum dikonfigurasi"
- "Perlu Setup"

#### Ringkasan Akademik
- "Ringkasan Akademik"
- "Jadwal Aktif"
- Jumlah jadwal aktif
- "Wali Kelas"
- Jumlah wali kelas
- "Kelas Aktif"
- Jumlah kelas aktif
- "Kehadiran Ustadz Hari Ini"
- Persentase kehadiran

#### Ringkasan Hari Ini
- "Ringkasan Hari Ini"
- "Ustadz Mengajar"
- Jumlah ustadz mengajar
- "sudah absen masuk"
- "Total Santri"
- Jumlah total santri
- "dari kelas aktif" / "from active classes"
- "Tahun"

---

### 1.2. Kehadiran Ustadz (Absen Guru)
**File**: `AbsenGuru.tsx` (Admin)

#### Header
- "Absen Guru" / "Kehadiran Guru"
- "Kelola kehadiran guru"

#### Filter dan Pencarian
- "Cari nama guru atau NIP..."
- "Semua Status"
- "Tepat Waktu"
- "Terlambat"
- "Tidak Hadir"
- Pilih tanggal
- "Filter"

#### Tabel/List
- "Nama Guru/Ustadz"
- "NIP"
- "Jam Masuk"
- "Jam Pulang"
- "Status Masuk"
- "Status Pulang"
- "Aksi"
- "Lihat Detail"
- "Edit"

#### Detail Absensi
- "Detail Absensi"
- "Tanggal"
- "Jam Masuk"
- "Jam Pulang"
- "Status Kehadiran"
- "Keterangan"
- "Tutup"

---

### 1.3. Tahfiz Quran - Data Santri
**File**: `DataSantriKepalaSekolah.tsx`

#### Header
- "Data Santri Tahfiz Qur'an"
- "Pantau progress hafalan santri"

#### Pencarian dan Filter
- "Cari nama, email, atau NISN..."
- "Menampilkan"
- "dari"
- "santri"

#### Tabel/List Santri
- "Santri"
- "Kelas"
- "Progress Hafalan"
- "Juz"
- "Surah"
- "Ayat"
- "Aksi"
- "Lihat Detail"

#### Detail Progress
- "Detail Progress Hafalan"
- "Nama Santri"
- "Kelas Tahfiz"
- "Ustadz Pembimbing"
- "Progress Hafalan"
- "Juz telah dihapal"
- "Surah telah dihapal"
- "Total ayat dihapal"
- "Daftar Tes Hafalan"
- "Tanggal Tes"
- "Hasil Tes"
- "Mumtaz"
- "Jayid Jiddan"
- "Jayid"
- "Maqbul"
- "Belum dites"
- "Tutup"

---

### 1.4. Tahfiz Quran - Data Ustadz
**File**: `DataUstadzKepalaSekolah.tsx`

#### Header
- "Data Ustadz Tahfiz Qur'an"
- "Pantau data ustadz dan progress santri"

#### Statistik
- "Total Ustadz"
- "Total Kelas"
- "Total Santri"

#### Pencarian
- "Cari nama, email, atau NIP..."
- "Menampilkan"
- "dari"
- "ustadz"

#### Tabel/List Ustadz
- "Ustadz"
- "NIP"
- "Kelas"
- "Jumlah Santri"
- "Aksi"
- "Lihat Detail"

#### Detail Ustadz
- "Detail Ustadz"
- "Nama"
- "NIP"
- "Email"
- "Nomor Telepon"
- "Kelas yang Diampu"
- "Jumlah Santri"
- "Status"
- "Aktif"
- "Tidak Aktif"
- "Tutup"

---

## 2. ADMIN (Sistem Tahfiz)

### 2.1. Dashboard
**File**: `AdminDashboard.tsx`

#### Welcome Section
- "Selamat Datang, Admin!"
- Tanggal saat ini (format: hari, tanggal bulan tahun)

#### Statistik Utama
- "Jumlah Ustadz"
- "Jumlah Santri"
- "Jumlah Kelas/Bilik"
- "Sesi Hari Ini"

#### Menunggu Persetujuan
- "Menunggu Persetujuan"
- "Surat Izin Santri"
- "menunggu"
- "pending"
- "Perlu ditinjau"
- "Semua Terverifikasi"
- "Tidak ada pengajuan yang menunggu persetujuan"

#### Aktivitas Terbaru
- "Aktivitas Terbaru"
- "Sesi absensi aktif"
- "Dibuka"
- "Sistem"
- "Hari ini"
- "Semua Berjalan Lancar"
- "Tidak ada aktivitas yang memerlukan perhatian khusus"

#### Aksi Cepat
- "Aksi Cepat"
- "Urus Ustadz" / "Kelola Ustadz"
- "Tambah & edit data ustadz"
- "Urus Santri" / "Kelola Santri"
- "Tambah & edit data santri"
- "Data Jadwal Tahfiz"
- "Atur jadwal tahfiz"

---

### 2.2. Kelola Absen Guru - Absen Guru
**File**: `AbsenGuru.tsx`

#### Header
- "Absen Guru"
- "Kelola kehadiran guru dan ustadz"

#### Filter dan Pencarian
- "Cari nama guru atau NIP..."
- "Filter Status"
- "Semua Status"
- "Tepat Waktu"
- "Terlambat"
- "Tidak Hadir"
- Pilih tanggal
- "Tampilkan"

#### Statistik
- "Total Guru Hari Ini"
- "Sudah Absen"
- "Belum Absen"
- "Tingkat Kehadiran"

#### Tabel Kehadiran
- "Nama"
- "NIP"
- "Jam Masuk"
- "Status Masuk"
- "Jam Pulang"
- "Status Pulang"
- "Aksi"
- "Edit"
- "Lihat"
- "QR Code"

#### Modal Edit
- "Edit Absensi Guru"
- "Nama Guru"
- "Tanggal"
- "Jam Masuk"
- "Jam Pulang"
- "Status Masuk"
- "Status Pulang"
- "Tepat Waktu"
- "Terlambat"
- "Keterangan"
- "Simpan"
- "Batal"

---

### 2.3. Verifikasi Izin Guru
**File**: `IzinGuruAdmin.tsx`

#### Header
- "Verifikasi Izin Guru"
- "Kelola permohonan izin dari guru"

#### Filter Status
- "Semua Status"
- "Menunggu"
- "Disetujui"
- "Ditolak"

#### Statistik
- "Total Pengajuan"
- "Menunggu Verifikasi"
- "Disetujui"
- "Ditolak"

#### Tabel Izin
- "Guru"
- "Jenis Izin"
- "Tanggal Mulai"
- "Tanggal Selesai"
- "Status"
- "Aksi"
- "Lihat Detail"

#### Detail Izin
- "Detail Izin Guru"
- "Nama Guru"
- "Jenis Izin"
- "Sakit"
- "Izin"
- "Cuti"
- "Lainnya"
- "Periode"
- "dari" / "sampai"
- "Alasan"
- "Bukti Pendukung"
- "Lihat Bukti"
- "Tidak ada bukti"
- "Status"
- "Menunggu Verifikasi"
- "Disetujui"
- "Ditolak"
- "Setujui"
- "Tolak"
- "Tutup"

---

### 2.4. Info & Pengumuman - Beri Info
**File**: `BeriInfo.tsx`

#### Header
- "Beri Info"
- "Kirim informasi dan pengumuman ke guru, ustadz, dan santri"

#### Form
- "Judul Informasi"
- "Masukkan judul..."
- "Isi Informasi"
- "Masukkan isi informasi..."
- "Penerima"
- "Semua Pengguna"
- "Guru/Ustadz"
- "Santri"
- "Kirim Informasi"

#### Riwayat Informasi
- "Riwayat Informasi Terkirim"
- "Tanggal"
- "Judul"
- "Penerima"
- "Dikirim ke"
- "Aksi"
- "Hapus"
- "Belum ada informasi terkirim"

---

### 2.5. Kelola Alat - Data Alat RFID
**File**: `ManajemenAlatRFID.tsx`

#### Header
- "Manajemen Alat RFID"
- "Kelola perangkat RFID untuk absensi"

#### Tambah Alat
- "Tambah Alat RFID"
- "Nama Alat"
- "Masukkan nama alat..."
- "Lokasi"
- "Masukkan lokasi..."
- "Token Akses"
- "Token akan digenerate otomatis"
- "Status"
- "Aktif"
- "Tidak Aktif"
- "Simpan"
- "Batal"

#### Tabel Alat
- "Nama Alat"
- "Lokasi"
- "Token"
- "Status"
- "Terakhir Digunakan"
- "Aksi"
- "Edit"
- "Hapus"
- "Belum ada alat RFID"
- "Tambah alat RFID pertama untuk memulai"

---

### 2.6. Tahfiz Quran - Data Kelas/Ruangan (Bilik)
**File**: `DataKelasTahfiz.tsx`

#### Header
- "Data Kelas / Ruangan Tahfiz"
- "Kelola kelas tahfiz, ruangan, dan penugasan ustadz"

#### Pencarian
- "Cari nama kelas, ruangan, atau ustadz..."
- "Menampilkan"
- "dari"
- "kelas"

#### Tabel Kelas
- "Nama Kelas"
- "Ruangan"
- "Nama Ustadz"
- "Jumlah Santri"
- "santri"
- "Aksi"
- "Lihat detail kelas"
- "Edit kelas"
- "Hapus kelas"

#### Tambah/Edit Kelas
- "Tambah Kelas Tahfiz"
- "Edit Kelas Tahfiz"
- "Nama Kelas"
- "Masukkan nama kelas..."
- "Ruangan/Bilik"
- "Masukkan nama ruangan..."
- "Ustadz Pembimbing"
- "Pilih ustadz..."
- "Simpan"
- "Batal"

#### Empty State
- "Belum ada data kelas"
- "Tambahkan kelas tahfiz pertama untuk memulai"
- "Tidak ada hasil"
- "Ubah kata kunci pencarian Anda"
- "Tambah Kelas Pertama"

#### Detail Kelas
- "Detail Kelas Tahfiz"
- "Kelola santri di kelas tahfiz ini"
- "Masukkan Santri"
- "Santri di Kelas"
- "Nama Santri"
- "Progress Hafalan"
- "Aksi"
- "Lihat Progress"
- "Hapus"
- "Belum ada santri"
- "Tambahkan santri ke kelas ini untuk memulai"

#### Modal Masukkan Santri
- "Masukkan Santri ke Kelas"
- "Cari santri berdasarkan nama, email, NISN, atau nomor telepon"
- "Tidak ada santri yang cocok"
- "Pilih Semua"
- "Nama"
- "Email"
- "NISN"
- "Nomor Telepon"
- "Simpan"
- "Tutup"

#### Konfirmasi Hapus
- "Hapus Kelas"
- "Apakah Anda yakin ingin menghapus kelas"
- "Ya, Hapus"
- "Batal"

---

### 2.7. Tahfiz Quran - Data Jadwal Tahfiz
**File**: `DataJadwalTahfiz.tsx`

#### Header
- "Data Jadwal Tahfiz"
- "Kelola jadwal pengajian per kelas beserta pengajar dan waktu"

#### Pencarian
- "Cari kelas, ruangan, ustadz, atau hari..."
- "Menampilkan"
- "dari"
- "jadwal"

#### Tabel Jadwal
- "Nama Kelas"
- "Ruangan"
- "Nama Ustadz"
- "Hari"
- "Senin"
- "Selasa"
- "Rabu"
- "Kamis"
- "Jum'at"
- "Sabtu"
- "Minggu"
- "Waktu"
- Format: "HH:MM - HH:MM"
- "Aksi"
- "Lihat detail"
- "Edit jadwal"
- "Hapus jadwal"

#### Tambah/Edit Jadwal
- "Tambah Jadwal Tahfiz"
- "Edit Jadwal Tahfiz"
- "Pilih Kelas"
- "Pilih kelas tahfiz..."
- "Hari"
- "Pilih hari..."
- "Jam Mulai"
- "Jam Selesai"
- "Simpan"
- "Batal"

#### Detail Jadwal
- "Detail Jadwal Tahfiz"
- "Kelas"
- "Ruangan"
- "Pengampu"
- "Belum diatur"
- "Hari"
- "Waktu"
- "Edit Jadwal"
- "Tutup"

#### Empty State
- "Belum ada jadwal"
- "Tambahkan jadwal tahfiz pertama untuk memulai"
- "Tidak ada hasil"
- "Tidak ditemukan jadwal dengan kata kunci"
- "Ubah kata kunci pencarian Anda"

#### Konfirmasi
- "Hapus Jadwal"
- "Apakah Anda yakin ingin menghapus jadwal"
- "hari"
- "Ya, Hapus"
- "Batal"

---

### 2.8. Tahfiz Quran - Data Ustadz
**File**: `DataUstadz.tsx`

#### Header
- "Data Ustadz"
- "Kelola data ustadz pengajar Tahfiz Qur'an"
- Jumlah ustadz (contoh: "(15 ustadz)")

#### Pencarian
- "Cari nama, email, atau NIP..."
- "Menampilkan"
- "dari"
- "ustadz"

#### Tabel Ustadz
- "Ustadz"
- "Kontak"
- Email
- Nomor telepon
- "NIP"
- "Status"
- "Aktif"
- "Tidak Aktif"
- "Aksi"
- "Lihat detail"
- "Lihat QR Code"
- "Edit"
- "Hapus"

#### Detail Ustadz
- "Detail Ustadz"
- "NIP"
- "Informasi Kontak"
- Email
- Nomor telepon
- "(WhatsApp)"
- "Tidak ada nomor telepon"
- "Status"
- "Bergabung"
- Tanggal bergabung
- "Lihat QR Code"
- "Tutup"

#### Tambah/Edit Ustadz
- "Tambah Ustadz"
- "Edit Data Ustadz"
- "Nama Lengkap"
- "Email"
- "NIP"
- "Nomor Telepon"
- "Foto Profil"
- "Pilih foto..."
- "Status"
- "Aktif"
- "Tidak Aktif"
- "Simpan"
- "Batal"

#### QR Code Modal
- "QR Code - [Nama Ustadz]"
- "NIP: [NIP]"
- "Cara Penggunaan"
- "QR Code ini digunakan untuk absensi ustadz"
- "Tunjukkan kepada admin saat sesi absensi dibuka"
- "Unduh untuk backup atau cetak kartu pegawai"
- "Unduh QR Code"
- "Gagal membuat QR Code"

#### Empty State
- "Belum ada data ustadz"
- "Tambahkan ustadz pertama untuk memulai"
- "Tidak ada hasil"
- "Tidak ditemukan ustadz dengan kata kunci"
- "Tambah Ustadz Pertama"

#### Konfirmasi
- "Hapus Data Ustadz"
- "Apakah Anda yakin ingin menghapus ustadz"
- "dari daftar ustadz?"
- "Tindakan ini tidak akan menghapus data guru dari sistem"
- "Ya, Hapus"
- "Batal"

#### Toggle Status
- "Klik untuk nonaktifkan"
- "Klik untuk aktifkan"

#### Toast Messages
- "Ustadz berhasil ditambahkan"
- "Ustadz berhasil diperbarui"
- "Ustadz berhasil dihapus"
- "Ustadz berhasil diaktifkan"
- "Ustadz berhasil dinonaktifkan"
- "Gagal menghapus ustadz"
- "Gagal mengubah status ustadz"
- "Terjadi kesalahan saat menghapus ustadz"
- "Terjadi kesalahan saat mengubah status ustadz"

---

### 2.9. Tahfiz Quran - Data Santri
**File**: `DataSantri.tsx`

#### Header
- "Data Santri"
- "Kelola data santri pengajar Tahfiz Qur'an"
- Jumlah santri (contoh: "(25 santri)")

#### Tombol Aksi Header
- "Tambah Semua Murid"
- "Menambahkan..."
- "Tambah Santri"

#### Pencarian
- "Cari nama, email, atau NISN..."
- "Menampilkan"
- "dari"
- "santri"

#### Tabel Santri
- "Santri"
- "Kontak"
- Email
- Nomor WhatsApp orang tua
- "NISN"
- "Status"
- "Aktif"
- "Tidak Aktif"
- "Aksi"
- "Lihat detail"
- "Lihat QR Code"
- "Edit"
- "Hapus"

#### Detail Santri
- "Detail Santri"
- "NISN"
- "Informasi Kontak"
- Email
- Nomor WhatsApp orang tua
- "(WhatsApp)"
- "Tidak ada nomor WhatsApp orang tua"
- "Status"
- "Bergabung"
- Tanggal bergabung
- "Lihat QR Code"
- "Tutup"

#### Tambah/Edit Santri
- "Tambah Santri"
- "Edit Data Santri"
- "Pilih Murid"
- "Pilih murid yang akan ditambahkan sebagai santri..."
- "Cari murid..."
- "Nama"
- "Email"
- "NISN"
- "Status"
- "Aktif"
- "Tidak Aktif"
- "Simpan"
- "Batal"

#### QR Code Modal
- "QR Code - [Nama Santri]"
- "NISN: [NISN]"
- "Cara Penggunaan"
- "QR Code ini digunakan untuk absensi santri"
- "Tunjukkan kepada ustadz saat sesi absensi dibuka"
- "Unduh untuk backup atau cetak kartu pelajar"
- "Unduh QR Code"
- "Gagal membuat QR Code"

#### Empty State
- "Belum ada data santri"
- "Tambahkan santri pertama untuk memulai"
- "Tidak ada hasil"
- "Tidak ditemukan santri dengan kata kunci"
- "Tambah Santri Pertama"

#### Konfirmasi Tambah Semua
- "Tambah Semua Murid"
- "Apakah Anda yakin ingin menambahkan semua murid sebagai santri?"
- "Tindakan ini akan menambahkan semua murid yang belum menjadi santri"
- "Ya, Tambah Semua"
- "Batal"

#### Konfirmasi Hapus
- "Hapus Data Santri"
- "Apakah Anda yakin ingin menghapus santri"
- "dari daftar santri?"
- "Tindakan ini tidak akan menghapus data murid dari sistem"
- "Ya, Hapus"
- "Batal"

#### Toggle Status
- "Klik untuk nonaktifkan"
- "Klik untuk aktifkan"

#### Toast Messages
- "Berhasil menambahkan [X] santri"
- "Santri berhasil ditambahkan"
- "Santri berhasil diperbarui"
- "Santri berhasil dihapus"
- "Santri berhasil diaktifkan"
- "Santri berhasil dinonaktifkan"
- "Gagal menambahkan semua murid sebagai santri"
- "Gagal menghapus santri"
- "Gagal mengubah status santri"
- "Terjadi kesalahan saat menambahkan semua murid sebagai santri"
- "Terjadi kesalahan saat menghapus santri"
- "Terjadi kesalahan saat mengubah status santri"

---

### 2.10. Pengaturan
**File**: `PengaturanAbsen.tsx`

#### Tab Menu
- "Pengaturan Absen"
- "Jam Istirahat"
- "Pengaturan Nilai"
- "Data Kepsek"
- "Profil Sekolah"
- "Background KTA"
- "Pengaturan Sistem"
- "Pengaturan Bahasa"

#### Pengaturan Absen
- "Pengaturan Absensi"
- "Atur jam masuk, jam pulang, dan toleransi keterlambatan"
- "Jam Masuk"
- "Jam Pulang"
- "Batas Keterlambatan (menit)"
- "Batas Pulang Cepat (menit)"
- "Simpan Pengaturan"
- "Pengaturan berhasil disimpan"

#### Pengaturan Sistem
- "Pengaturan Sistem"
- "Kelola pengaturan sistem aplikasi"
- "Tipe Sistem"
- "Pilih tipe sistem yang akan digunakan"
- "Sistem Sekolah UMUM"
- "Hanya menampilkan fitur sekolah umum, fitur tahfiz tidak ditampilkan"
- "Sistem Sekolah Umum + Tahfiz"
- "Menampilkan semua fitur sekolah umum dan tahfiz"
- "Sistem Tahfiz"
- "Hanya menampilkan fitur tahfiz"
- "Pulang Cepat"
- "Aktifkan fitur pulang cepat untuk memungkinkan guru dan murid melakukan absensi pulang sebelum waktu yang ditentukan"
- "Reset Database"
- "Hapus semua data dan reset sistem ke kondisi awal"

#### Konfirmasi Perubahan Sistem
- "Konfirmasi Pemindahan Sistem"
- "Anda akan memindahkan sistem ke:"
- "Silakan masukkan sandi aktivasi untuk melanjutkan"
- "Sandi Aktivasi"
- "Masukkan sandi aktivasi"
- "Sandi aktivasi harus diisi"
- "Sandi aktivasi salah. Silakan coba lagi"
- "Sandi aktivasi diperlukan untuk keamanan sistem"
- "Simpan"
- "Batal"

#### Reset Database
- "Reset Database"
- "PERINGATAN!"
- "Tindakan ini akan menghapus SEMUA data dari database dan mengembalikan sistem ke kondisi awal"
- "Semua data murid, guru, kelas, absensi, dan nilai akan dihapus"
- "Data pengaturan akan direset ke default"
- "Hanya akun admin default yang akan tetap ada"
- "Tindakan ini TIDAK DAPAT DIBATALKAN"
- "Pastikan Anda telah membuat backup data sebelum melakukan reset"
- "Ya, Reset Database"
- "Batal"

---

## 3. GURU/USTADZ (Sistem Tahfiz)

### 3.1. Dashboard
**File**: `GuruDashboard.tsx`

#### Welcome Section
- "Selamat Datang, [Nama Ustadz]!"
- Tanggal saat ini (format: hari, tanggal bulan tahun)

#### Menu Cards
- "Absen"
- "Absen masuk dan pulang"
- "Pengajuan Izin"
- "Ajukan izin sakit atau cuti"
- "Absen Siswa"
- "Kelola kehadiran santri"
- "Tahfiz Quran"
- "Kelola hafalan santri"
- "Profil"
- "Lihat dan edit profil"

#### Statistik (jika wali kelas)
- "Kelas yang Diampu"
- "Jumlah Santri"
- "Kehadiran Hari Ini"

---

### 3.2. Absen - Absen Saya
**File**: `AbsenGuru.tsx` (Guru)

#### Header
- "Absen Saya"
- "Kelola kehadiran Anda"

#### Kartu Hari Ini
- "Kehadiran Hari Ini"
- Tanggal
- "Status"
- "Belum Absen"
- "Sudah Absen Masuk"
- "Sudah Absen Pulang"
- "Jam Masuk"
- "Jam Pulang"
- "Status Masuk"
- "Tepat Waktu"
- "Terlambat"
- "Status Pulang"
- "Tepat Waktu"
- "Pulang Cepat"
- "Absen Masuk"
- "Absen Pulang"

#### Info Jam Kerja
- "Jam Kerja"
- "Jam Masuk: [waktu]"
- "Jam Pulang: [waktu]"
- "Batas Terlambat: [X] menit"

#### QR Code Saya
- "QR Code Saya"
- "Tampilkan QR Code untuk absensi"
- "Lihat QR"
- "Download QR"

#### Riwayat Absensi
- "Riwayat Absensi"
- "Lihat Riwayat"
- Filter bulan/tahun
- "Bulan"
- "Tahun"
- "Tampilkan"
- Tabel riwayat
- "Tanggal"
- "Jam Masuk"
- "Status Masuk"
- "Jam Pulang"
- "Status Pulang"

---

### 3.3. Pengajuan Izin
**File**: `IzinGuru.tsx`

#### Header
- "Pengajuan Izin"
- "Ajukan dan kelola izin Anda"

#### Statistik
- "Total Pengajuan"
- "Menunggu"
- "Disetujui"
- "Ditolak"

#### Form Pengajuan
- "Ajukan Izin Baru"
- "Jenis Izin"
- "Sakit"
- "Izin"
- "Cuti"
- "Lainnya"
- "Tanggal Mulai"
- "Tanggal Selesai"
- "Alasan"
- "Jelaskan alasan izin..."
- "Bukti Pendukung"
- "Upload file (opsional)"
- "Pilih file..."
- "Jadwal Pengganti"
- "Pilih guru pengganti (opsional)"
- "Ajukan Izin"

#### Riwayat Pengajuan
- "Riwayat Pengajuan Izin"
- "Tanggal Pengajuan"
- "Jenis"
- "Periode"
- "Status"
- "Menunggu"
- "Disetujui"
- "Ditolak"
- "Aksi"
- "Lihat"
- "Edit"
- "Hapus"

#### Detail Izin
- "Detail Pengajuan Izin"
- "Jenis Izin"
- "Periode"
- "Alasan"
- "Bukti Pendukung"
- "Lihat Bukti"
- "Tidak ada bukti"
- "Guru Pengganti"
- "Tidak ada pengganti"
- "Status"
- "Diajukan pada"
- "Tutup"

---

### 3.4. Absen Siswa (untuk kehadiran umum santri)
**File**: `AbsenSiswa.tsx`

#### Header
- "Absen Santri"
- "Kelola kehadiran santri di kelas"

#### Pilih Kelas
- "Pilih Kelas"
- "Pilih kelas yang akan diabsen..."

#### Tanggal
- "Tanggal"
- Pilih tanggal
- "Hari ini"
- "Kemarin"

#### Statistik Kehadiran
- "Total Santri"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"

#### Tabel Absensi
- "Nama Santri"
- "NISN"
- "Status"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"
- "Keterangan"
- "Aksi"
- "Edit"

#### Simpan
- "Simpan Absensi"
- "Absensi berhasil disimpan"

---

### 3.5. Tahfiz Quran - Data Santri Tahfiz
**File**: `DataSantriTahfizGuru.tsx`

#### Header
- "Data Santri Tahfiz"
- "Kelola data santri di kelas tahfiz Anda"

#### Filter Kelas
- "Pilih Kelas"
- "Semua Kelas"
- Nama kelas

#### Pencarian
- "Cari nama santri..."
- "Menampilkan"
- "dari"
- "santri"

#### Tabel Santri
- "Santri"
- "NISN"
- "Kelas"
- "Progress Hafalan"
- "Aksi"
- "Lihat Progress"
- "Detail"

#### Detail Santri
- "Detail Santri"
- "Nama"
- "NISN"
- "Kelas Tahfiz"
- "Progress Hafalan"
- "Juz telah dihapal"
- "Surah telah dihapal"
- "Total ayat dihapal"
- "Riwayat Tes Hafalan"
- "Tambah Tes Baru"
- "Tutup"

---

### 3.6. Tahfiz Quran - Jadwal Tahfiz
**File**: `JadwalTahfizGuru.tsx`

#### Header
- "Jadwal Tahfiz Saya"
- "Lihat jadwal mengajar tahfiz Anda"

#### Filter
- "Hari"
- "Semua Hari"
- "Senin"
- "Selasa"
- "Rabu"
- "Kamis"
- "Jum'at"
- "Sabtu"
- "Minggu"

#### Kartu Jadwal
- "Kelas"
- "Ruangan"
- "Hari"
- "Waktu"
- Format: "HH:MM - HH:MM"
- "Jumlah Santri"
- "santri"
- "Lihat Detail Kelas"

#### Empty State
- "Belum ada jadwal"
- "Anda belum memiliki jadwal tahfiz yang ditugaskan"

---

### 3.7. Tahfiz Quran - Absensi Tahfiz (sesi hafalan)
**File**: `AbsensiTahfiz.tsx`

#### Header
- "Absensi Tahfiz"
- "Kelola sesi absensi hafalan"

#### Pilih Jadwal
- "Pilih Jadwal"
- "Pilih jadwal tahfiz..."
- Hari, waktu, kelas

#### Info Sesi
- "Status Sesi"
- "Belum Dibuka"
- "Sedang Berlangsung"
- "Ditutup"
- "Waktu Buka"
- "Waktu Tutup"

#### Tombol Aksi
- "Buka Sesi"
- "Tutup Sesi"
- "Tampilkan QR"

#### QR Code untuk Absensi
- "QR Code Absensi Tahfiz"
- "Scan QR code ini untuk absensi"
- "Kelas: [nama kelas]"
- "Waktu: [waktu]"
- "Download QR"
- "Tutup"

#### Daftar Kehadiran
- "Daftar Kehadiran"
- "Nama Santri"
- "NISN"
- "Waktu Absen"
- "Metode"
- "QR Code"
- "Manual"
- "Status"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"
- "Aksi"
- "Ubah Status"

#### Statistik
- "Total Santri"
- "Sudah Absen"
- "Belum Absen"
- "Tingkat Kehadiran"

#### Absen Manual
- "Tambah Absen Manual"
- "Pilih Santri"
- "Status"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"
- "Keterangan"
- "Simpan"
- "Batal"

---

### 3.8. Tahfiz Quran - Riwayat Absen Tahfiz
**File**: `RiwayatAbsensiTahfiz.tsx`

#### Header
- "Riwayat Absensi Tahfiz"
- "Lihat riwayat kehadiran santri di sesi tahfiz"

#### Filter
- "Pilih Kelas"
- "Semua Kelas"
- "Pilih Bulan"
- "Pilih Tahun"
- "Tampilkan"

#### Tabel Riwayat
- "Tanggal"
- "Kelas"
- "Total Santri"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"
- "Tingkat Kehadiran"
- "Aksi"
- "Lihat Detail"

#### Detail Sesi
- "Detail Absensi Tahfiz"
- "Tanggal"
- "Kelas"
- "Waktu"
- "Dibuka"
- "Ditutup"
- "Daftar Kehadiran"
- Tabel kehadiran per santri
- "Export Excel"
- "Export PDF"
- "Tutup"

---

### 3.9. Tahfiz Quran - Progress Tahfiz (tes hapalan)
**File**: `ProgressTahfiz.tsx`

#### Header
- "Progress Tahfiz"
- "Kelola tes dan progress hafalan santri"

#### Pilih Kelas
- "Pilih Kelas"
- "Pilih kelas tahfiz..."

#### Daftar Santri
- "Nama Santri"
- "NISN"
- "Progress Hafalan"
- "Juz"
- "Surah"
- "Ayat"
- "Tes Terakhir"
- "Aksi"
- "Tes Hafalan"
- "Lihat Progress"

#### Form Tes Hafalan
- "Tes Hafalan Santri"
- "Nama Santri"
- "Juz"
- "Pilih juz..."
- 1-30
- "Surah"
- "Pilih surah..."
- "Ayat Dari"
- "Ayat Sampai"
- "Hasil Tes"
- "Mumtaz" (95-100)
- "Jayid Jiddan" (85-94)
- "Jayid" (75-84)
- "Maqbul" (60-74)
- "Penilaian Detail"
- "Kelancaran Hafalan"
- "Sangat Lancar"
- "Lancar"
- "Cukup Lancar"
- "Kurang Lancar"
- "Tidak Lancar"
- "Ketepatan Ayat"
- "Sangat Tepat"
- "Tepat"
- "Cukup Tepat"
- "Kurang Tepat"
- "Tidak Tepat"
- "Tajwid"
- "Sangat Baik"
- "Baik"
- "Cukup"
- "Kurang"
- "Tidak Baik"
- "Fashahah (Kejelasan Bacaan)"
- "Sangat Jelas"
- "Jelas"
- "Cukup Jelas"
- "Kurang Jelas"
- "Tidak Jelas"
- "Catatan/Perbaikan"
- "Masukkan catatan untuk santri..."
- "Simpan Hasil Tes"
- "Batal"

#### Detail Progress
- "Detail Progress Hafalan"
- "Nama Santri"
- "Kelas"
- "Total Progress"
- "Juz telah dihapal"
- "Surah telah dihapal"
- "Total ayat dihapal"
- "Riwayat Tes Hafalan"
- "Tanggal Tes"
- "Materi"
- "Hasil"
- "Catatan"
- "Aksi"
- "Lihat Detail"
- "Edit"
- "Hapus"
- "Tutup"

---

### 3.10. Tahfiz Quran - Izin Santri
**File**: `IzinSantriTahfiz.tsx`

#### Header
- "Izin Santri Tahfiz"
- "Kelola izin santri di kelas tahfiz"

#### Filter Status
- "Semua Status"
- "Menunggu"
- "Disetujui"
- "Ditolak"

#### Filter Kelas
- "Semua Kelas"
- Nama kelas

#### Statistik
- "Total Pengajuan"
- "Menunggu"
- "Disetujui"
- "Ditolak"

#### Tabel Izin
- "Santri"
- "Kelas"
- "Jenis"
- "Sakit"
- "Izin"
- "Tanggal"
- "Alasan"
- "Status"
- "Aksi"
- "Lihat"
- "Setujui"
- "Tolak"

#### Detail Izin
- "Detail Surat Izin"
- "Nama Santri"
- "NISN"
- "Kelas"
- "Jenis Izin"
- "Tanggal Mulai"
- "Tanggal Selesai"
- "Alasan"
- "Bukti Pendukung"
- "Lihat Bukti"
- "Tidak ada bukti"
- "Status"
- "Menunggu Verifikasi"
- "Disetujui"
- "Ditolak"
- "Setujui Izin"
- "Tolak Izin"
- "Tutup"

---

### 3.11. Profil
**File**: `ProfilGuru.tsx`

#### Tab Menu
- "Akun"
- "Password"
- "QR Code"
- "Kartu Pegawai"

#### Tab Akun
- "Informasi Akun"
- "Foto Profil"
- "Ubah Foto"
- "Hapus Foto"
- "Nama Lengkap"
- "Email"
- "NIP"
- "Nomor Telepon"
- "Simpan Perubahan"

#### Tab Password
- "Ubah Password"
- "Password Lama"
- "Masukkan password lama..."
- "Password Baru"
- "Masukkan password baru..."
- "Konfirmasi Password Baru"
- "Masukkan ulang password baru..."
- "Ubah Password"

#### Tab QR Code
- "QR Code Absensi"
- "Gunakan QR code ini untuk absensi"
- "Download QR Code"
- "NIP: [NIP]"

#### Tab Kartu Pegawai
- "Kartu Pegawai"
- "Preview kartu pegawai Anda"
- Bagian Depan
- Logo sekolah
- Nama sekolah
- Foto
- Nama
- NIP
- Jabatan: "Ustadz"
- Bagian Belakang
- QR Code
- Nama
- NIP
- Alamat sekolah
- "Download Kartu"
- "Print Kartu"

---

## 4. MURID/SANTRI (Sistem Tahfiz)

### 4.1. Dashboard
**File**: `MuridDashboard.tsx`

#### Welcome Section
- "Selamat Datang, [Nama Santri]!"
- Tanggal saat ini

#### Menu Cards
- "QR Code Saya"
- "Untuk absensi"
- "Tahfiz Quran"
- "Jadwal dan progress hafalan"
- "Absen Kehadiran"
- "Kehadiran umum santri"
- "Pengajuan Izin"
- "Ajukan surat izin"
- "Profil"
- "Lihat dan edit profil"

#### Statistik Hafalan
- "Progress Hafalan Saya"
- "Juz"
- "Surah"
- "Ayat"

#### Jadwal Hari Ini
- "Jadwal Tahfiz Hari Ini"
- "Belum ada jadwal"

---

### 4.2. QR Code Saya
**File**: `QRCodeMurid.tsx`

#### Header
- "QR Code Absensi Saya"
- "Tunjukkan QR code ini saat absensi"

#### QR Code Display
- QR Code
- "Nama: [nama]"
- "NISN: [nisn]"
- "Download QR Code"

#### Petunjuk
- "Cara Menggunakan"
- "Buka sesi absensi tahfiz"
- "Tunjukkan QR code ini ke ustadz"
- "Tunggu konfirmasi absensi berhasil"
- "QR code bersifat unik untuk setiap santri"

---

### 4.3. Tahfiz Quran - Jadwal Tahfiz
**File**: `JadwalTahfizMurid.tsx`

#### Header
- "Jadwal Tahfiz"
- "Lihat jadwal pengajian tahfiz Anda"

#### Peringatan (jika belum terdaftar)
- "Anda belum terdaftar sebagai santri"
- "Untuk melihat jadwal tahfiz, Anda perlu terdaftar sebagai santri terlebih dahulu"

#### Pencarian
- "Cari kelas, ruangan, ustadz, atau hari..."
- "Menampilkan"
- "dari"
- "jadwal"

#### Kartu Jadwal
- "Kelas"
- "Ruangan"
- "Ustadz"
- "Hari"
- "Senin" - "Minggu"
- "Waktu"
- Format: "HH:MM - HH:MM"

#### Highlight Hari Ini
- "Hari ini"
- Badge hijau untuk jadwal hari ini

#### Empty State
- "Belum ada jadwal"
- "Anda belum memiliki jadwal tahfiz yang ditugaskan"
- "Ubah kata kunci pencarian Anda"

---

### 4.4. Tahfiz Quran - Absensi Tahfiz
**File**: `AbsensiSantriTahfiz.tsx`

#### Header
- "Absensi Santri"
- "Absensi untuk kegiatan tahfiz Qur'an"

#### Info Kelas
- "Kelas"
- Nama kelas

#### Peringatan (jika belum terdaftar)
- "Anda belum terdaftar sebagai santri"
- "Untuk melakukan absensi tahfiz, Anda perlu terdaftar sebagai santri terlebih dahulu"

#### Statistik Kehadiran
- "Tingkat Kehadiran"
- "Hadir"
- "Izin"
- "Sakit"
- "Alfa"

#### Jadwal Hari Ini
- "Jadwal Tahfiz Hari Ini"
- "Scan QR ketika ustadz membuka sesi"
- "Kelas"
- "Dibuka"
- "Ditutup"
- "Sesi Ditutup"
- "Scan QR"
- "Ustadz belum membuka sesi"

#### Empty State
- "Tidak ada jadwal tahfiz hari ini"
- "Nikmati hari istirahatmu!"

#### Riwayat Absensi
- "Lihat Riwayat Absensi"
- "Riwayat"
- "Filter Riwayat Absensi"
- "Pilih periode untuk melihat riwayat"
- "Kembali ke Jadwal Hari Ini"
- "Kembali"
- "Pilih Bulan & Tahun"
- "Menampilkan data untuk"
- "Riwayat Absensi"
- "Detail kehadiran per sesi"

#### Tabel Riwayat
- "Tanggal"
- "Mata Pelajaran"
- "Ustadz"
- "Kelas"
- "Waktu"
- "Status"
- "Metode"
- "QR Code"
- "Manual"

#### Empty Riwayat
- "Tidak ada riwayat absensi"
- "Tidak ada data untuk [bulan tahun]"

#### QR Scanner
- Membuka kamera
- "Scan QR Code"
- "Arahkan kamera ke QR Code"
- "Tutup Scanner"

#### Toast Messages
- "User tidak valid!"
- "Sesi absensi tahfiz tidak ditemukan!"
- "Sesi absensi tahfiz sudah ditutup!"
- "Jadwal tahfiz tidak ditemukan!"
- "Anda bukan santri dari kelas ini!"
- "Anda sudah melakukan absensi untuk tahfiz ini!"
- "Absensi Berhasil!"
- "Gagal menyimpan absensi tahfiz"
- "QR Code tidak valid atau tidak dikenali!"

---

### 4.5. Tahfiz Quran - Progress Hapalan
**File**: `ProgressHapalanMurid.tsx`

#### Header
- "Progress Hapalan"
- "Lihat progress hafalan Al-Qur'an Anda"

#### Statistik Progress
- "Juz"
- "Juz telah dihapal"
- "Surah"
- "Surah telah dihapal"
- "Ayat"
- "Total ayat dihapal"

#### Daftar Progress
- "Daftar Progress Hafalan"
- "Total"
- "progress"

#### Pagination
- "Halaman"
- "dari"
- "Menampilkan"
- "Sebelumnya"
- "Selanjutnya"

#### Loading
- "Memuat data progress..."

#### Tabel Progress
- "Tanggal"
- "Tanggal Tes"
- Juz [nomor]
- Surah
- Ayat [dari]-[sampai]
- "Hasil Tes"
- "Mumtaz" (95-100) - Hijau
- "Jayid Jiddan" (85-94) - Biru
- "Jayid" (75-84) - Kuning
- "Maqbul" (60-74) - Oranye
- "Belum dites"
- "Aksi"
- "Pelajari Hapalan"
- "Pelajari"
- "Hafalan Diterima"
- "Diterima"
- "Detail Perbaikan"
- "Perbaikan"

#### Empty State
- "Belum ada progress hafalan"
- "Progress hafalan Anda akan ditampilkan di sini setelah data ditambahkan oleh ustadz"

---

#### Modal Pelajari Hapalan
**File**: `PreviewHapalanModal.tsx`

- "Pelajari Hapalan Al-Quran"
- "Tutup"
- "Memuat data ayat Al-Quran..."
- Juz [nomor]
- Surah
- Ayat [dari]-[sampai]
- "[jumlah] Ayat"
- Teks Arab per ayat
- Tombol audio per ayat
- "Gagal mengambil data surat"
- "Surat tidak ditemukan"
- "Data ayat tidak ditemukan"
- "Gagal memuat data ayat"

#### Audio Player
**File**: `AudioPlayer.tsx`

- "Izin Diperlukan untuk Memutar Audio"
- "Browser memerlukan interaksi Anda untuk memutar audio. Silakan klik tombol di bawah untuk memberikan izin"
- "Izinkan & Putar Audio"
- "Memuat..."
- "Putar"
- "Jeda"
- "Stop"
- "Klik tombol 'Izinkan & Putar' terlebih dahulu"
- "Putar Audio"

#### Error Messages
- "Pemutaran audio dibatalkan"
- "Error jaringan saat memuat audio. Periksa koneksi internet Anda"
- "Error dekode audio. Format mungkin tidak didukung"
- "Format audio tidak didukung atau URL tidak valid"
- "Gagal memuat audio ayat. Silakan coba lagi"
- "Audio tidak tersedia untuk ayat ini. Silakan coba lagi nanti"
- "Gagal memuat audio. Silakan coba lagi nanti"
- "Gagal memutar audio. Silakan coba lagi atau refresh halaman"
- "Browser tidak mengizinkan pemutaran audio. Silakan periksa pengaturan browser"
- "Gagal memutar audio setelah izin diberikan"

---

#### Modal Hasil Tes (Mumtaz/Jayid Jiddan)
**File**: `HasilTesModal.tsx`

- "Hasil Tes Hapalan Al-Quran"
- "Tutup"
- "✅ BOLEH LANJUT"
- "✅ BOLEH LANJUT (dengan murajaah)"
- "Tanggal Tes"
- Juz [nomor]
- Surah
- Ayat [dari]-[sampai]
- "[jumlah] Ayat"
- "Memuat data ayat Al-Quran..."
- Teks Arab per ayat
- Tombol audio per ayat

##### Catatan Mumtaz
- "Alhamdulillah, Anda lancar dalam pembacaan hafalan surah [nama] ayat [dari] sampai [sampai], dengan makhraj dan tajwid yang sangat baik. Hafalan dinyatakan mumtaz dan Anda diperkenankan melanjutkan hafalan ke surah/ayat selanjutnya."

##### Catatan Jayid Jiddan
- "Alhamdulillah, Anda membaca hafalan surah [nama] ayat [dari] sampai [sampai] dengan baik. Terdapat kesalahan ringan yang tidak mengganggu hafalan secara keseluruhan. Hafalan dinyatakan jayid jiddan dan Anda diperkenankan melanjutkan hafalan, dengan catatan tetap memperbanyak murajaah."

---

#### Modal Detail Perbaikan (Jayid/Maqbul)
**File**: `DetailPerbaikanModal.tsx`

- "Detail Perbaikan Hapalan"
- "Tutup"
- "⚠️ PERBAIKAN TERLEBIH DAHULU"
- "❌ WAJIB PERBAIKAN"
- "Tanggal Tes"
- Juz [nomor]
- Surah
- Ayat [dari]-[sampai]
- "[jumlah] Ayat"
- "Memuat data ayat Al-Quran..."
- Teks Arab per ayat
- Tombol audio per ayat

##### Catatan Jayid
- "Anda telah membaca hafalan surah [nama] ayat [dari] sampai [sampai], namun masih terdapat beberapa kesalahan dalam kelancaran dan tajwid. Hafalan dinyatakan jayid dan Anda perlu memperbaiki hafalan surah/ayat tersebut sebelum melanjutkan ke hafalan berikutnya."

##### Catatan Maqbul
- "Anda membaca hafalan surah [nama] ayat [dari] sampai [sampai], namun masih terdapat banyak kesalahan dalam hafalan dan tajwid. Hafalan dinyatakan maqbul/dho'if dan Anda diwajibkan mengulang serta memperbaiki hafalan sebelum melanjutkan ke ayat selanjutnya."

##### Poin Perbaikan
- "Poin Perbaikan"
- "a. Kelancaran Hafalan"
- Catatan detail
- "b. Ketepatan Ayat"
- Catatan detail
- "c. Tajwid"
- Catatan detail
- "d. Fashahah (Kejelasan Bacaan)"
- Catatan detail
- "Catatan Perbaikan"
- Catatan tambahan dari ustadz

---

### 4.6. Absen Kehadiran (kehadiran umum santri)
**File**: `AbsenKehadiran.tsx`

#### Header
- "Absen Kehadiran"
- "Kelola kehadiran umum Anda"

#### Info Hari Ini
- "Kehadiran Hari Ini"
- Tanggal
- "Status Anda"
- "Belum Diabsen"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"

#### Riwayat Kehadiran
- "Riwayat Kehadiran"
- Filter bulan/tahun
- "Bulan"
- "Tahun"
- "Tampilkan"

#### Tabel Riwayat
- "Tanggal"
- "Hari"
- "Status"
- "Keterangan"

#### Statistik
- "Tingkat Kehadiran"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"
- Persentase per kategori

---

### 4.7. Pengajuan Izin
**File**: `SuratIzinMurid.tsx`

#### Header
- "Pengajuan Izin"
- "Ajukan surat izin sakit atau izin"

#### Statistik
- "Total Pengajuan"
- "Menunggu"
- "Disetujui"
- "Ditolak"

#### Form Pengajuan
- "Ajukan Surat Izin"
- "Jenis Izin"
- "Sakit"
- "Izin"
- "Tanggal Mulai"
- "Tanggal Selesai"
- "Alasan"
- "Jelaskan alasan izin..."
- "Bukti Pendukung"
- "Upload file (opsional)"
- "Pilih file..."
- "Format: JPG, PNG, PDF (Max 5MB)"
- "Ajukan Izin"

#### Riwayat Pengajuan
- "Riwayat Surat Izin"
- "Tanggal Pengajuan"
- "Jenis"
- "Periode"
- Format: "DD/MM/YYYY - DD/MM/YYYY"
- "Status"
- "Menunggu"
- "Disetujui"
- "Ditolak"
- "Aksi"
- "Lihat"
- "Edit"
- "Hapus"

#### Detail Surat Izin
- "Detail Surat Izin"
- "Jenis Izin"
- "Periode"
- "Alasan"
- "Bukti Pendukung"
- "Lihat Bukti"
- "Tidak ada bukti"
- "Status"
- "Diajukan pada"
- "Disetujui pada"
- "Ditolak pada"
- "Alasan Penolakan"
- "Tutup"

#### Konfirmasi Hapus
- "Hapus Surat Izin"
- "Apakah Anda yakin ingin menghapus surat izin ini?"
- "Ya, Hapus"
- "Batal"

---

### 4.8. Profil
**File**: `ProfilMurid.tsx`

#### Tab Menu
- "Akun"
- "Password"
- "Kartu Pelajar"

#### Tab Akun
- "Informasi Akun"
- "Foto Profil"
- "Ubah Foto"
- "Hapus Foto"
- "Nama Lengkap"
- "Email"
- "NISN"
- "Nomor Telepon Orang Tua"
- "Simpan Perubahan"

#### Tab Password
- "Ubah Password"
- "Password Lama"
- "Masukkan password lama..."
- "Password Baru"
- "Masukkan password baru..."
- "Konfirmasi Password Baru"
- "Masukkan ulang password baru..."
- "Ubah Password"

#### Tab Kartu Pelajar
- "Kartu Pelajar"
- "Preview kartu pelajar Anda"
- Bagian Depan
- Logo sekolah
- Nama sekolah
- Foto
- Nama
- NISN
- Kelas
- Bagian Belakang
- QR Code
- Nama
- NISN
- Alamat sekolah
- "Download Kartu"
- "Print Kartu"

---

## PESAN UMUM (Toast/Notification)

### Success Messages
- "Berhasil"
- "Data berhasil disimpan"
- "Data berhasil diperbarui"
- "Data berhasil dihapus"
- "Absensi berhasil disimpan"
- "Surat izin berhasil diajukan"
- "Password berhasil diubah"
- "Foto profil berhasil diperbarui"
- "QR Code berhasil diunduh"

### Error Messages
- "Terjadi kesalahan"
- "Gagal menyimpan data"
- "Gagal memperbarui data"
- "Gagal menghapus data"
- "Gagal menyimpan absensi"
- "Gagal mengajukan surat izin"
- "Gagal mengubah password"
- "Gagal memperbarui foto profil"
- "Gagal mengunduh QR Code"
- "Password lama tidak sesuai"
- "Password baru tidak sesuai dengan konfirmasi"
- "File terlalu besar"
- "Format file tidak didukung"

### Warning Messages
- "Perhatian"
- "Data belum disimpan"
- "Apakah Anda yakin?"
- "Tindakan ini tidak dapat dibatalkan"

### Info Messages
- "Informasi"
- "Data sedang dimuat..."
- "Harap tunggu..."
- "Tidak ada data"
- "Belum ada data yang tersedia"

---

## TOMBOL UMUM (Common Buttons)

- "Simpan"
- "Save"
- "Batal"
- "Cancel"
- "Tutup"
- "Close"
- "Hapus"
- "Delete"
- "Edit"
- "Lihat"
- "View"
- "Detail"
- "Tambah"
- "Add"
- "Cari"
- "Search"
- "Filter"
- "Export"
- "Download"
- "Upload"
- "Print"
- "Kembali"
- "Back"
- "Selanjutnya"
- "Next"
- "Sebelumnya"
- "Previous"
- "Refresh"
- "Reset"
- "Konfirmasi"
- "Confirm"
- "Ya"
- "Yes"
- "Tidak"
- "No"
- "Aktif"
- "Active"
- "Tidak Aktif"
- "Inactive"
- "Semua"
- "All"
- "Pilih"
- "Select"
- "Scan"
- "Tampilkan"
- "Show"

---

## LABEL STATUS

### Status Kehadiran
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"
- "Tepat Waktu"
- "Terlambat"
- "Pulang Cepat"
- "Belum Absen"
- "Sudah Absen"

### Status Persetujuan
- "Menunggu"
- "Menunggu Verifikasi"
- "Disetujui"
- "Ditolak"

### Status Hasil Tes
- "Mumtaz" (95-100)
- "Jayid Jiddan" (85-94)
- "Jayid" (75-84)
- "Maqbul" (60-74)
- "Belum dites"

### Status Sesi
- "Belum Dibuka"
- "Sedang Berlangsung"
- "Dibuka"
- "Ditutup"

---

## FORMAT WAKTU DAN TANGGAL

- Format tanggal: "DD/MM/YYYY"
- Format hari: "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"
- Format waktu: "HH:MM"
- Format lengkap: "Senin, 15 Januari 2024"
- Format periode: "DD/MM/YYYY - DD/MM/YYYY"

---

## TERMINOLOGI KHUSUS TAHFIZ

- "Juz" - Bagian Al-Quran (1-30)
- "Surah" - Nama surat dalam Al-Quran
- "Ayat" - Ayat dalam Al-Quran
- "Hafalan" / "Hapalan" - Hafalan Al-Quran
- "Tahfiz" - Program menghafal Al-Quran
- "Santri" - Siswa tahfiz
- "Ustadz" - Guru tahfiz
- "Bilik" - Ruangan kelas tahfiz
- "Murajaah" - Mengulang hafalan
- "Tajwid" - Aturan bacaan Al-Quran
- "Makhraj" - Tempat keluarnya huruf
- "Fashahah" - Kejelasan bacaan
- "Mumtaz" - Sangat baik (95-100)
- "Jayid Jiddan" - Baik sekali (85-94)
- "Jayid" - Baik (75-84)
- "Maqbul" - Cukup (60-74)
- "Dho'if" - Lemah

---

**CATATAN:**
- Semua teks dapat ditampilkan dalam Bahasa Indonesia atau Bahasa Malaysia sesuai pengaturan sistem
- Beberapa teks menggunakan sistem internationalization (i18n) dengan key yang didefinisikan di `src/locales/id.json` dan `src/locales/ms.json`
- Teks yang hardcoded langsung di komponen juga telah didokumentasikan
- Nama-nama file komponen disebutkan untuk memudahkan referensi

---

**Dibuat:** {{ current_date }}
**Versi:** 1.0
**Sistem:** Sekolah Tahfiz Management System
