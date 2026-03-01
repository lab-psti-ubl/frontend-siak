# DOKUMENTASI TEKS - ADMIN (Sistem Tahfiz)

Dokumentasi ini berisi semua teks/kalimat yang muncul di halaman Admin untuk sistem sekolah tahfiz.

---

## 1. DASHBOARD
**File**: `AdminDashboard.tsx`

### Welcome Section
- "Selamat Datang, Admin!"
- Tanggal saat ini (format: hari, tanggal bulan tahun)

### Statistik Utama
- "Jumlah Ustadz"
- Jumlah total ustadz
- "Jumlah Santri"
- Jumlah total santri
- "Jumlah Kelas/Bilik"
- Jumlah total kelas
- "Sesi Hari Ini"
- Jumlah sesi hari ini

### Menunggu Persetujuan
- "Menunggu Persetujuan"
- "Surat Izin Santri"
- "[X] menunggu"
- "[X] pending"
- "Perlu ditinjau"
- "Perlu ditinjau wali kelas"
- "Semua Terverifikasi"
- "Tidak ada pengajuan yang menunggu persetujuan"

### Aktivitas Terbaru
- "Aktivitas Terbaru"
- "Sesi absensi aktif"
- "Kelas [nama] - Ustadz [nama]"
- "Dibuka [waktu]"
- "Sistem"
- "Hari ini"
- "Semua Berjalan Lancar"
- "Tidak ada aktivitas yang memerlukan perhatian khusus"

### Aksi Cepat
- "Aksi Cepat"
- "Urus Ustadz"
- "Kelola Ustadz"
- "Tambah & edit data ustadz"
- "Urus Santri"
- "Kelola Santri"
- "Tambah & edit data santri"
- "Data Jadwal Tahfiz"
- "Atur jadwal tahfiz"
- "Data Kelas Tahfiz"
- "Kelola kelas tahfiz"

---

## 2. KELOLA ABSEN GURU
**File**: `AbsenGuru.tsx`

### Header
- "Absen Guru"
- "Kelola kehadiran guru dan ustadz"

### Filter dan Pencarian
- "Cari nama guru atau NIP..."
- "Filter Status"
- "Semua Status"
- "Tepat Waktu"
- "Terlambat"
- "Tidak Hadir"
- Pilih tanggal
- "Tampilkan"

### Statistik
- "Total Guru Hari Ini"
- "Sudah Absen"
- "Belum Absen"
- "Tingkat Kehadiran"

### Tabel Kehadiran
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

### Modal Edit
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

## 3. VERIFIKASI IZIN GURU
**File**: `IzinGuruAdmin.tsx`

### Header
- "Verifikasi Izin Guru"
- "Kelola permohonan izin dari guru"

### Filter Status
- "Semua Status"
- "Menunggu"
- "Disetujui"
- "Ditolak"

### Statistik
- "Total Pengajuan"
- "Menunggu Verifikasi"
- "Disetujui"
- "Ditolak"

### Tabel Izin
- "Guru"
- "Jenis Izin"
- "Tanggal Mulai"
- "Tanggal Selesai"
- "Status"
- "Aksi"
- "Lihat Detail"

### Detail Izin Modal
- "Detail Izin Guru"
- "Nama Guru"
- "Jenis Izin"
- "Sakit"
- "Izin"
- "Cuti"
- "Lainnya"
- "Periode"
- "[tanggal] sampai [tanggal]"
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

## 4. INFO & PENGUMUMAN - BERI INFO
**File**: `BeriInfo.tsx`

### Header
- "Beri Info"
- "Kirim informasi dan pengumuman ke guru, ustadz, dan santri"

### Form
- "Judul Informasi"
- "Masukkan judul..."
- "Isi Informasi"
- "Masukkan isi informasi..."
- "Penerima"
- "Semua Pengguna"
- "Guru/Ustadz"
- "Santri"
- "Kirim Informasi"

### Riwayat Informasi
- "Riwayat Informasi Terkirim"
- "Tanggal"
- "Judul"
- "Penerima"
- "Dikirim ke [jumlah] pengguna"
- "Aksi"
- "Hapus"
- "Belum ada informasi terkirim"

---

## 5. KELOLA ALAT - DATA ALAT RFID
**File**: `ManajemenAlatRFID.tsx`

### Header
- "Manajemen Alat RFID"
- "Kelola perangkat RFID untuk absensi"

### Tambah Alat Modal
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

### Tabel Alat
- "Nama Alat"
- "Lokasi"
- "Token"
- "Status"
- "Terakhir Digunakan"
- "Aksi"
- "Edit"
- "Hapus"
- "Copy Token"

### Empty State
- "Belum ada alat RFID"
- "Tambah alat RFID pertama untuk memulai"

---

## 6. TAHFIZ QURAN - DATA KELAS/RUANGAN (BILIK)
**File**: `DataKelasTahfiz.tsx`

### Header
- "Data Kelas / Ruangan Tahfiz"
- "Kelola kelas tahfiz, ruangan, dan penugasan ustadz"

### Pencarian
- "Cari nama kelas, ruangan, atau ustadz..."
- "Menampilkan"
- "dari"
- "kelas"

### Tabel Kelas
- "Nama Kelas"
- "Ruangan"
- "Nama Ustadz"
- "Jumlah Santri"
- "[X] santri"
- "Aksi"
- "Lihat detail kelas"
- "Edit kelas"
- "Hapus kelas"

### Tambah/Edit Kelas Modal
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

### Empty State
- "Belum ada data kelas"
- "Tambahkan kelas tahfiz pertama untuk memulai"
- "Tidak ada hasil"
- "Ubah kata kunci pencarian Anda"
- "Tambah Kelas Pertama"

### Detail Kelas
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

### Modal Masukkan Santri
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

### Konfirmasi Hapus
- "Hapus Kelas"
- "Apakah Anda yakin ingin menghapus kelas"
- "Ya, Hapus"
- "Batal"

---

## 7. TAHFIZ QURAN - DATA JADWAL TAHFIZ
**File**: `DataJadwalTahfiz.tsx`

### Header
- "Data Jadwal Tahfiz"
- "Kelola jadwal pengajian per kelas beserta pengajar dan waktu"

### Pencarian
- "Cari kelas, ruangan, ustadz, atau hari..."
- "Menampilkan"
- "dari"
- "jadwal"

### Daftar Jadwal
- "Daftar Jadwal Tahfiz"
- "Memuat data jadwal..."

### Tabel Jadwal
- "Nama Kelas"
- "Ruangan"
- "Nama Ustadz"
- "Hari"
- "Senin" sampai "Minggu"
- "Waktu"
- Format: "HH:MM - HH:MM"
- "Aksi"
- "Lihat detail"
- "Edit jadwal"
- "Hapus jadwal"

### Tambah/Edit Jadwal Modal
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

### Detail Jadwal Modal
- "Detail Jadwal Tahfiz"
- "Kelas"
- "Ruangan"
- "Pengampu"
- "Belum diatur"
- "Hari"
- "Waktu"
- "Edit Jadwal"
- "Tutup"
- "Data jadwal tidak ditemukan"

### Empty State
- "Belum ada jadwal"
- "Tambahkan jadwal tahfiz pertama untuk memulai"
- "Tidak ada hasil"
- "Tidak ditemukan jadwal dengan kata kunci"
- "Ubah kata kunci pencarian Anda"

### Konfirmasi
- "Hapus Jadwal"
- "Apakah Anda yakin ingin menghapus jadwal"
- "hari"
- "Ya, Hapus"
- "Batal"

### Toast Messages
- "Jadwal tahfiz berhasil ditambahkan"
- "Jadwal tahfiz berhasil diperbarui"
- "Jadwal tahfiz berhasil dihapus"
- "Terjadi kesalahan saat menyimpan jadwal"
- "Gagal menghapus jadwal tahfiz"

---

## 8. TAHFIZ QURAN - DATA USTADZ
**File**: `DataUstadz.tsx`

### Header
- "Data Ustadz"
- "Kelola data ustadz pengajar Tahfiz Qur'an"
- "([X] ustadz)"

### Pencarian
- "Cari nama, email, atau NIP..."
- "Menampilkan"
- "dari"
- "ustadz"

### Daftar Ustadz
- "Daftar Ustadz"

### Tabel Ustadz
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

### Detail Ustadz Modal
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

### Tambah/Edit Ustadz Modal
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

### QR Code Modal
- "QR Code - [Nama Ustadz]"
- "NIP: [NIP]"
- "Cara Penggunaan"
- "QR Code ini digunakan untuk absensi ustadz"
- "Tunjukkan kepada admin saat sesi absensi dibuka"
- "Unduh untuk backup atau cetak kartu pegawai"
- "Unduh QR Code"
- "Gagal membuat QR Code"

### Empty State
- "Belum ada data ustadz"
- "Tambahkan ustadz pertama untuk memulai"
- "Tidak ada hasil"
- "Tidak ditemukan ustadz dengan kata kunci"
- "Tambah Ustadz Pertama"

### Konfirmasi
- "Hapus Data Ustadz"
- "Apakah Anda yakin ingin menghapus ustadz"
- "dari daftar ustadz?"
- "Tindakan ini tidak akan menghapus data guru dari sistem"
- "Ya, Hapus"
- "Batal"

### Toggle Status
- "Klik untuk nonaktifkan"
- "Klik untuk aktifkan"

### Toast Messages
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

## 9. TAHFIZ QURAN - DATA SANTRI
**File**: `DataSantri.tsx`

### Header
- "Data Santri"
- "Kelola data santri pengajar Tahfiz Qur'an"
- "([X] santri)"

### Tombol Aksi Header
- "Tambah Semua Murid"
- "Menambahkan..."
- "Tambah Santri"

### Pencarian
- "Cari nama, email, atau NISN..."
- "Menampilkan"
- "dari"
- "santri"

### Daftar Santri
- "Daftar Santri"

### Tabel Santri
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

### Detail Santri Modal
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

### Tambah/Edit Santri Modal
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

### QR Code Modal
- "QR Code - [Nama Santri]"
- "NISN: [NISN]"
- "Cara Penggunaan"
- "QR Code ini digunakan untuk absensi santri"
- "Tunjukkan kepada ustadz saat sesi absensi dibuka"
- "Unduh untuk backup atau cetak kartu pelajar"
- "Unduh QR Code"
- "Gagal membuat QR Code"

### Empty State
- "Belum ada data santri"
- "Tambahkan santri pertama untuk memulai"
- "Tidak ada hasil"
- "Tidak ditemukan santri dengan kata kunci"
- "Tambah Santri Pertama"

### Konfirmasi Tambah Semua
- "Tambah Semua Murid"
- "Apakah Anda yakin ingin menambahkan semua murid sebagai santri?"
- "Tindakan ini akan menambahkan semua murid yang belum menjadi santri"
- "Ya, Tambah Semua"
- "Batal"

### Konfirmasi Hapus
- "Hapus Data Santri"
- "Apakah Anda yakin ingin menghapus santri"
- "dari daftar santri?"
- "Tindakan ini tidak akan menghapus data murid dari sistem"
- "Ya, Hapus"
- "Batal"

### Toggle Status
- "Klik untuk nonaktifkan"
- "Klik untuk aktifkan"

### Toast Messages
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

## 10. PENGATURAN
**File**: `PengaturanAbsen.tsx`

### Tab Menu
- "Pengaturan Absen"
- "Jam Istirahat"
- "Pengaturan Nilai"
- "Data Kepsek"
- "Profil Sekolah"
- "Background KTA"
- "Pengaturan Sistem"
- "Pengaturan Bahasa"

### Pengaturan Absen
- "Pengaturan Absensi"
- "Atur jam masuk, jam pulang, dan toleransi keterlambatan"
- "Jam Masuk"
- "Jam Pulang"
- "Batas Keterlambatan (menit)"
- "Batas Pulang Cepat (menit)"
- "Simpan Pengaturan"
- "Pengaturan berhasil disimpan"

### Pengaturan Sistem
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

### Konfirmasi Perubahan Sistem
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

### Reset Database
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

**Dibuat:** {{ current_date }}
**Role:** Admin
**Sistem:** Sekolah Tahfiz Management System
