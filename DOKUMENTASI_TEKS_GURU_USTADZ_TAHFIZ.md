# DOKUMENTASI TEKS - GURU/USTADZ (Sistem Tahfiz)

Dokumentasi ini berisi semua teks/kalimat yang muncul di halaman Guru/Ustadz untuk sistem sekolah tahfiz.

---

## 1. DASHBOARD
**File**: `GuruDashboard.tsx`

### Welcome Section
- "Selamat Datang, [Nama Ustadz]!"
- Tanggal saat ini (format: hari, tanggal bulan tahun)

### Menu Cards
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

### Statistik (jika wali kelas)
- "Kelas yang Diampu"
- "Jumlah Santri"
- "Kehadiran Hari Ini"

---

## 2. ABSEN - ABSEN SAYA
**File**: `AbsenGuru.tsx` (Guru)

### Header
- "Absen Saya"
- "Kelola kehadiran Anda"

### Kartu Hari Ini
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

### Info Jam Kerja
- "Jam Kerja"
- "Jam Masuk: [waktu]"
- "Jam Pulang: [waktu]"
- "Batas Terlambat: [X] menit"

### QR Code Saya
- "QR Code Saya"
- "Tampilkan QR Code untuk absensi"
- "Lihat QR"
- "Download QR"

### Riwayat Absensi
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

## 3. PENGAJUAN IZIN
**File**: `IzinGuru.tsx`

### Header
- "Pengajuan Izin"
- "Ajukan dan kelola izin Anda"

### Statistik
- "Total Pengajuan"
- "Menunggu"
- "Disetujui"
- "Ditolak"

### Form Pengajuan
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

### Riwayat Pengajuan
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

### Detail Izin
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

## 4. ABSEN SISWA (untuk kehadiran umum santri)
**File**: `AbsenSiswa.tsx`

### Header
- "Absen Santri"
- "Kelola kehadiran santri di kelas"

### Pilih Kelas
- "Pilih Kelas"
- "Pilih kelas yang akan diabsen..."

### Tanggal
- "Tanggal"
- Pilih tanggal
- "Hari ini"
- "Kemarin"

### Statistik Kehadiran
- "Total Santri"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"

### Tabel Absensi
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

### Simpan
- "Simpan Absensi"
- "Absensi berhasil disimpan"

---

## 5. TAHFIZ QURAN - DATA SANTRI TAHFIZ
**File**: `DataSantriTahfizGuru.tsx`

### Header
- "Data Santri Tahfiz"
- "Kelola data santri di kelas tahfiz Anda"

### Filter Kelas
- "Pilih Kelas"
- "Semua Kelas"
- Nama kelas

### Pencarian
- "Cari nama santri..."
- "Menampilkan"
- "dari"
- "santri"

### Tabel Santri
- "Santri"
- "NISN"
- "Kelas"
- "Progress Hafalan"
- "Aksi"
- "Lihat Progress"
- "Detail"

### Detail Santri
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

## 6. TAHFIZ QURAN - JADWAL TAHFIZ
**File**: `JadwalTahfizGuru.tsx`

### Header
- "Jadwal Tahfiz Saya"
- "Lihat jadwal mengajar tahfiz Anda"

### Filter
- "Hari"
- "Semua Hari"
- "Senin"
- "Selasa"
- "Rabu"
- "Kamis"
- "Jum'at"
- "Sabtu"
- "Minggu"

### Kartu Jadwal
- "Kelas"
- "Ruangan"
- "Hari"
- "Waktu"
- Format: "HH:MM - HH:MM"
- "Jumlah Santri"
- "santri"
- "Lihat Detail Kelas"

### Empty State
- "Belum ada jadwal"
- "Anda belum memiliki jadwal tahfiz yang ditugaskan"

---

## 7. TAHFIZ QURAN - ABSENSI TAHFIZ (sesi hafalan)
**File**: `AbsensiTahfiz.tsx`

### Header
- "Absensi Tahfiz"
- "Kelola sesi absensi hafalan"

### Pilih Jadwal
- "Pilih Jadwal"
- "Pilih jadwal tahfiz..."
- Hari, waktu, kelas

### Info Sesi
- "Status Sesi"
- "Belum Dibuka"
- "Sedang Berlangsung"
- "Ditutup"
- "Waktu Buka"
- "Waktu Tutup"

### Tombol Aksi
- "Buka Sesi"
- "Tutup Sesi"
- "Tampilkan QR"

### QR Code untuk Absensi
- "QR Code Absensi Tahfiz"
- "Scan QR code ini untuk absensi"
- "Kelas: [nama kelas]"
- "Waktu: [waktu]"
- "Download QR"
- "Tutup"

### Daftar Kehadiran
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

### Statistik
- "Total Santri"
- "Sudah Absen"
- "Belum Absen"
- "Tingkat Kehadiran"

### Absen Manual
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

## 8. TAHFIZ QURAN - RIWAYAT ABSEN TAHFIZ
**File**: `RiwayatAbsensiTahfiz.tsx`

### Header
- "Riwayat Absensi Tahfiz"
- "Lihat riwayat kehadiran santri di sesi tahfiz"

### Filter
- "Pilih Kelas"
- "Semua Kelas"
- "Pilih Bulan"
- "Pilih Tahun"
- "Tampilkan"

### Tabel Riwayat
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

### Detail Sesi
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

## 9. TAHFIZ QURAN - PROGRESS TAHFIZ (tes hapalan)
**File**: `ProgressTahfiz.tsx`

### Header
- "Progress Tahfiz"
- "Kelola tes dan progress hafalan santri"

### Pilih Kelas
- "Pilih Kelas"
- "Pilih kelas tahfiz..."

### Daftar Santri
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

### Form Tes Hafalan
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

### Detail Progress
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

## 10. TAHFIZ QURAN - IZIN SANTRI
**File**: `IzinSantriTahfiz.tsx`

### Header
- "Izin Santri Tahfiz"
- "Kelola izin santri di kelas tahfiz"

### Filter Status
- "Semua Status"
- "Menunggu"
- "Disetujui"
- "Ditolak"

### Filter Kelas
- "Semua Kelas"
- Nama kelas

### Statistik
- "Total Pengajuan"
- "Menunggu"
- "Disetujui"
- "Ditolak"

### Tabel Izin
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

### Detail Izin
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

## 11. PROFIL
**File**: `ProfilGuru.tsx`

### Tab Menu
- "Akun"
- "Password"
- "QR Code"
- "Kartu Pegawai"

### Tab Akun
- "Informasi Akun"
- "Foto Profil"
- "Ubah Foto"
- "Hapus Foto"
- "Nama Lengkap"
- "Email"
- "NIP"
- "Nomor Telepon"
- "Simpan Perubahan"

### Tab Password
- "Ubah Password"
- "Password Lama"
- "Masukkan password lama..."
- "Password Baru"
- "Masukkan password baru..."
- "Konfirmasi Password Baru"
- "Masukkan ulang password baru..."
- "Ubah Password"

### Tab QR Code
- "QR Code Absensi"
- "Gunakan QR code ini untuk absensi"
- "Download QR Code"
- "NIP: [NIP]"

### Tab Kartu Pegawai
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

## FORMAT DAN LABEL UMUM

### Hari
- "Senin"
- "Selasa"
- "Rabu"
- "Kamis"
- "Jum'at"
- "Sabtu"
- "Minggu"

### Format Tanggal
- Format: "DD/MM/YYYY"
- Format lengkap: "Senin, 15 Januari 2024"

### Format Waktu
- Format: "HH:MM"
- Format periode: "HH:MM - HH:MM"

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

### Tombol Umum
- "Lihat"
- "Lihat Detail"
- "Simpan"
- "Batal"
- "Tutup"
- "Kembali"
- "Refresh"
- "Filter"
- "Cari"
- "Export"
- "Download"
- "Upload"

### Terminologi Tahfiz
- "Juz" - Bagian Al-Quran (1-30)
- "Surah" - Nama surat dalam Al-Quran
- "Ayat" - Ayat dalam Al-Quran
- "Hafalan" - Hafalan Al-Quran
- "Tahfiz" - Program menghafal Al-Quran
- "Santri" - Siswa tahfiz
- "Ustadz" - Guru tahfiz
- "Bilik" - Ruangan kelas tahfiz
- "Murajaah" - Mengulang hafalan
- "Tajwid" - Aturan bacaan Al-Quran
- "Makhraj" - Tempat keluarnya huruf
- "Fashahah" - Kejelasan bacaan

---

**Dibuat:** {{ current_date }}
**Role:** Guru/Ustadz
**Sistem:** Sekolah Tahfiz Management System
