# DOKUMENTASI TEKS - KEPALA SEKOLAH (Sistem Tahfiz)

Dokumentasi ini berisi semua teks/kalimat yang muncul di halaman Kepala Sekolah untuk sistem sekolah tahfiz.

---

## 1. DASHBOARD
**File**: `KepalaSekolahDashboard.tsx`

### Header/Welcome Section
- "Selamat Datang"
- Tanggal saat ini (format: hari, tanggal bulan tahun)
- "Tahun"
- Tahun aktif (contoh: "2024")

### Statistik Utama (Main Stats)
- "Total Ustadz"
- "Total Santri"
- "Total Kelas"
- "Kehadiran Ustadz Hari Ini"
- Persentase (contoh: "85.5%")

### Status Sistem
- "Status Sistem"
- "Tahun Aktif"
- Tahun (contoh: "2024")
- "Aktif"
- "Tidak Aktif"
- "Tingkat Kehadiran Ustadz"
- "[X] dari [Y] ustadz"
- "Tidak ada jadwal hari ini"
- "Jadwal Aktif"
- "Tahun [tahun]"
- Jumlah jadwal (angka)
- "Pengaturan Absen"
- Jam masuk - Jam pulang (contoh: "07:00 - 14:00")
- "Belum dikonfigurasi"
- "Perlu Setup"

### Ringkasan Akademik
- "Ringkasan Akademik"
- "Jadwal Aktif"
- Jumlah jadwal aktif
- "Wali Kelas"
- Jumlah wali kelas
- "Kelas Aktif"
- Jumlah kelas aktif
- "Kehadiran Ustadz Hari Ini"
- Persentase kehadiran

### Ringkasan Hari Ini
- "Ringkasan Hari Ini"
- "Ustadz Mengajar"
- Jumlah ustadz mengajar
- "sudah absen masuk"
- "Total Santri"
- Jumlah total santri
- "dari kelas aktif"
- "dari [X] kelas aktif"
- "Tahun"

---

## 2. KEHADIRAN USTADZ (Absen Guru)
**File**: `AbsenGuru.tsx` (Admin/Kepala Sekolah)

### Header
- "Absen Guru"
- "Kehadiran Guru"
- "Kelola kehadiran guru"

### Filter dan Pencarian
- "Cari nama guru atau NIP..."
- "Semua Status"
- "Tepat Waktu"
- "Terlambat"
- "Tidak Hadir"
- Pilih tanggal
- "Filter"

### Statistik
- "Total Guru Hari Ini"
- "Sudah Absen"
- "Belum Absen"
- "Tingkat Kehadiran"
- Persentase

### Tabel/List
- "Nama Guru/Ustadz"
- "NIP"
- "Jam Masuk"
- "Jam Pulang"
- "Status Masuk"
- "Status Pulang"
- "Aksi"
- "Lihat Detail"
- "Edit"
- "QR Code"

### Detail Absensi Modal
- "Detail Absensi"
- "Tanggal"
- "Jam Masuk"
- "Jam Pulang"
- "Status Kehadiran"
- "Keterangan"
- "Tutup"

### Edit Absensi Modal
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

### Empty State
- "Belum ada data absensi"
- "Data absensi akan muncul di sini"

### Toast Messages
- "Absensi berhasil disimpan"
- "Absensi berhasil diperbarui"
- "Gagal menyimpan absensi"
- "Gagal memperbarui absensi"

---

## 3. TAHFIZ QURAN - DATA SANTRI
**File**: `DataSantriKepalaSekolah.tsx`

### Header
- "Data Santri Tahfiz Qur'an"
- "Pantau progress hafalan santri"

### Pencarian dan Filter
- "Cari nama, email, atau NISN..."
- "Menampilkan"
- "dari"
- "santri"

### Filter Kelas
- "Semua Kelas"
- "Pilih Kelas"
- Nama kelas

### Tabel/List Santri
- "Santri"
- "NISN"
- "Kelas"
- "Progress Hafalan"
- "Juz"
- "[X] Juz"
- "Surah"
- "[X] Surah"
- "Ayat"
- "[X] Ayat"
- "Aksi"
- "Lihat Detail"
- "Lihat Progress"

### Detail Progress Modal
- "Detail Progress Hafalan"
- "Nama Santri"
- "NISN"
- "Kelas Tahfiz"
- "Ustadz Pembimbing"
- "Progress Hafalan"
- "Juz telah dihapal"
- "Surah telah dihapal"
- "Total ayat dihapal"
- "Daftar Tes Hafalan"
- "Tanggal Tes"
- "Materi Hafalan"
- "Juz [nomor]"
- "Surah [nama]"
- "Ayat [dari]-[sampai]"
- "Hasil Tes"
- "Mumtaz" (95-100)
- "Jayid Jiddan" (85-94)
- "Jayid" (75-84)
- "Maqbul" (60-74)
- "Belum dites"
- "Catatan"
- "Aksi"
- "Lihat Detail Tes"
- "Tutup"

### Empty State
- "Belum ada data santri"
- "Tambahkan santri untuk memulai"
- "Tidak ada hasil pencarian"
- "Ubah kata kunci pencarian Anda"

### Loading State
- "Memuat data santri..."
- "Memuat progress hafalan..."

---

## 4. TAHFIZ QURAN - DATA USTADZ
**File**: `DataUstadzKepalaSekolah.tsx`

### Header
- "Data Ustadz Tahfiz Qur'an"
- "Pantau data ustadz dan progress santri"

### Statistik Cards
- "Total Ustadz"
- Jumlah ustadz
- "Total Kelas"
- Jumlah kelas
- "Total Santri"
- Jumlah santri

### Pencarian
- "Cari nama, email, atau NIP..."
- "Menampilkan"
- "dari"
- "ustadz"

### Tabel/List Ustadz
- "Ustadz"
- "NIP"
- "Email"
- "Nomor Telepon"
- "Kelas"
- "[X] Kelas"
- "Jumlah Santri"
- "[X] Santri"
- "Status"
- "Aktif"
- "Tidak Aktif"
- "Aksi"
- "Lihat Detail"

### Detail Ustadz Modal
- "Detail Ustadz"
- "Foto Profil"
- "Nama"
- "NIP"
- "Email"
- "Nomor Telepon"
- "Hubungi via WhatsApp"
- "Tidak ada nomor telepon"
- "Kelas yang Diampu"
- "Jumlah Santri di Kelas"
- "Tidak ada kelas"
- "Ustadz belum ditugaskan ke kelas manapun"
- "Status"
- "Aktif"
- "Tidak Aktif"
- "Bergabung"
- Tanggal bergabung
- "Tutup"

### Kelas Diampu
- "Daftar Kelas"
- "Nama Kelas"
- "Ruangan"
- "Jumlah Santri"
- "Lihat Santri"

### Detail Santri di Kelas
- "Daftar Santri di Kelas [nama kelas]"
- "Nama Santri"
- "NISN"
- "Progress Hafalan"
- "Juz [X]"
- "Surah [X]"
- "Ayat [X]"
- "Lihat Progress"

### Empty State
- "Belum ada data ustadz"
- "Data ustadz akan ditampilkan di sini"
- "Tidak ada hasil pencarian"
- "Ubah kata kunci pencarian Anda"

### Loading State
- "Memuat data ustadz..."
- "Memuat data kelas..."

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
- "Tutup"
- "Kembali"
- "Refresh"
- "Filter"
- "Cari"
- "Export"

### Terminologi Tahfiz
- "Juz" - Bagian Al-Quran (1-30)
- "Surah" - Nama surat dalam Al-Quran
- "Ayat" - Ayat dalam Al-Quran
- "Hafalan" - Hafalan Al-Quran
- "Tahfiz" - Program menghafal Al-Quran
- "Santri" - Siswa tahfiz
- "Ustadz" - Guru tahfiz
- "Bilik" - Ruangan kelas tahfiz

---

**Dibuat:** {{ current_date }}
**Role:** Kepala Sekolah
**Sistem:** Sekolah Tahfiz Management System
