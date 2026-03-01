# DOKUMENTASI TEKS - MURID/SANTRI (Sistem Tahfiz)

Dokumentasi ini berisi semua teks/kalimat yang muncul di halaman Murid/Santri untuk sistem sekolah tahfiz.

---

## 1. DASHBOARD
**File**: `MuridDashboard.tsx`

### Welcome Section
- "Selamat Datang, [Nama Santri]!"
- Tanggal saat ini

### Menu Cards
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

### Statistik Hafalan
- "Progress Hafalan Saya"
- "Juz"
- "Surah"
- "Ayat"

### Jadwal Hari Ini
- "Jadwal Tahfiz Hari Ini"
- "Belum ada jadwal"

---

## 2. QR CODE SAYA
**File**: `QRCodeMurid.tsx`

### Header
- "QR Code Absensi Saya"
- "Tunjukkan QR code ini saat absensi"

### QR Code Display
- QR Code
- "Nama: [nama]"
- "NISN: [nisn]"
- "Download QR Code"

### Petunjuk
- "Cara Menggunakan"
- "Buka sesi absensi tahfiz"
- "Tunjukkan QR code ini ke ustadz"
- "Tunggu konfirmasi absensi berhasil"
- "QR code bersifat unik untuk setiap santri"

---

## 3. TAHFIZ QURAN - JADWAL TAHFIZ
**File**: `JadwalTahfizMurid.tsx`

### Header
- "Jadwal Tahfiz"
- "Lihat jadwal pengajian tahfiz Anda"

### Peringatan (jika belum terdaftar)
- "Anda belum terdaftar sebagai santri"
- "Untuk melihat jadwal tahfiz, Anda perlu terdaftar sebagai santri terlebih dahulu"

### Pencarian
- "Cari kelas, ruangan, ustadz, atau hari..."
- "Menampilkan"
- "dari"
- "jadwal"

### Kartu Jadwal
- "Kelas"
- "Ruangan"
- "Ustadz"
- "Hari"
- "Senin" - "Minggu"
- "Waktu"
- Format: "HH:MM - HH:MM"

### Highlight Hari Ini
- "Hari ini"
- Badge hijau untuk jadwal hari ini

### Empty State
- "Belum ada jadwal"
- "Anda belum memiliki jadwal tahfiz yang ditugaskan"
- "Ubah kata kunci pencarian Anda"

---

## 4. TAHFIZ QURAN - ABSENSI TAHFIZ
**File**: `AbsensiSantriTahfiz.tsx`

### Header
- "Absensi Santri"
- "Absensi untuk kegiatan tahfiz Qur'an"

### Info Kelas
- "Kelas"
- Nama kelas

### Peringatan (jika belum terdaftar)
- "Anda belum terdaftar sebagai santri"
- "Untuk melakukan absensi tahfiz, Anda perlu terdaftar sebagai santri terlebih dahulu"

### Statistik Kehadiran
- "Tingkat Kehadiran"
- "Hadir"
- "Izin"
- "Sakit"
- "Alfa"

### Jadwal Hari Ini
- "Jadwal Tahfiz Hari Ini"
- "Scan QR ketika ustadz membuka sesi"
- "Kelas"
- "Dibuka"
- "Ditutup"
- "Sesi Ditutup"
- "Scan QR"
- "Ustadz belum membuka sesi"

### Empty State
- "Tidak ada jadwal tahfiz hari ini"
- "Nikmati hari istirahatmu!"

### Riwayat Absensi
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

### Tabel Riwayat
- "Tanggal"
- "Mata Pelajaran"
- "Ustadz"
- "Kelas"
- "Waktu"
- "Status"
- "Metode"
- "QR Code"
- "Manual"

### Empty Riwayat
- "Tidak ada riwayat absensi"
- "Tidak ada data untuk [bulan tahun]"

### QR Scanner
- Membuka kamera
- "Scan QR Code"
- "Arahkan kamera ke QR Code"
- "Tutup Scanner"

### Toast Messages
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

## 5. TAHFIZ QURAN - PROGRESS HAPALAN
**File**: `ProgressHapalanMurid.tsx`

### Header
- "Progress Hapalan"
- "Lihat progress hafalan Al-Qur'an Anda"

### Statistik Progress
- "Juz"
- "Juz telah dihapal"
- "Surah"
- "Surah telah dihapal"
- "Ayat"
- "Total ayat dihapal"

### Daftar Progress
- "Daftar Progress Hafalan"
- "Total"
- "progress"

### Pagination
- "Halaman"
- "dari"
- "Menampilkan"
- "Sebelumnya"
- "Selanjutnya"

### Loading
- "Memuat data progress..."

### Tabel Progress
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

### Empty State
- "Belum ada progress hafalan"
- "Progress hafalan Anda akan ditampilkan di sini setelah data ditambahkan oleh ustadz"

---

### Modal Pelajari Hapalan
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

### Audio Player
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

### Error Messages
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

### Modal Hasil Tes (Mumtaz/Jayid Jiddan)
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

#### Catatan Mumtaz
- "Alhamdulillah, Anda lancar dalam pembacaan hafalan surah [nama] ayat [dari] sampai [sampai], dengan makhraj dan tajwid yang sangat baik. Hafalan dinyatakan mumtaz dan Anda diperkenankan melanjutkan hafalan ke surah/ayat selanjutnya."

#### Catatan Jayid Jiddan
- "Alhamdulillah, Anda membaca hafalan surah [nama] ayat [dari] sampai [sampai] dengan baik. Terdapat kesalahan ringan yang tidak mengganggu hafalan secara keseluruhan. Hafalan dinyatakan jayid jiddan dan Anda diperkenankan melanjutkan hafalan, dengan catatan tetap memperbanyak murajaah."

---

### Modal Detail Perbaikan (Jayid/Maqbul)
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

#### Catatan Jayid
- "Anda telah membaca hafalan surah [nama] ayat [dari] sampai [sampai], namun masih terdapat beberapa kesalahan dalam kelancaran dan tajwid. Hafalan dinyatakan jayid dan Anda perlu memperbaiki hafalan surah/ayat tersebut sebelum melanjutkan ke hafalan berikutnya."

#### Catatan Maqbul
- "Anda membaca hafalan surah [nama] ayat [dari] sampai [sampai], namun masih terdapat banyak kesalahan dalam hafalan dan tajwid. Hafalan dinyatakan maqbul/dho'if dan Anda diwajibkan mengulang serta memperbaiki hafalan sebelum melanjutkan ke ayat selanjutnya."

#### Poin Perbaikan
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

## 6. ABSEN KEHADIRAN (kehadiran umum santri)
**File**: `AbsenKehadiran.tsx`

### Header
- "Absen Kehadiran"
- "Kelola kehadiran umum Anda"

### Info Hari Ini
- "Kehadiran Hari Ini"
- Tanggal
- "Status Anda"
- "Belum Diabsen"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"

### Riwayat Kehadiran
- "Riwayat Kehadiran"
- Filter bulan/tahun
- "Bulan"
- "Tahun"
- "Tampilkan"

### Tabel Riwayat
- "Tanggal"
- "Hari"
- "Status"
- "Keterangan"

### Statistik
- "Tingkat Kehadiran"
- "Hadir"
- "Sakit"
- "Izin"
- "Alfa"
- Persentase per kategori

---

## 7. PENGAJUAN IZIN
**File**: `SuratIzinMurid.tsx`

### Header
- "Pengajuan Izin"
- "Ajukan surat izin sakit atau izin"

### Statistik
- "Total Pengajuan"
- "Menunggu"
- "Disetujui"
- "Ditolak"

### Form Pengajuan
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

### Riwayat Pengajuan
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

### Detail Surat Izin
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

### Konfirmasi Hapus
- "Hapus Surat Izin"
- "Apakah Anda yakin ingin menghapus surat izin ini?"
- "Ya, Hapus"
- "Batal"

---

## 8. PROFIL
**File**: `ProfilMurid.tsx`

### Tab Menu
- "Akun"
- "Password"
- "Kartu Pelajar"

### Tab Akun
- "Informasi Akun"
- "Foto Profil"
- "Ubah Foto"
- "Hapus Foto"
- "Nama Lengkap"
- "Email"
- "NISN"
- "Nomor Telepon Orang Tua"
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

### Tab Kartu Pelajar
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

**Dibuat:** {{ current_date }}
**Role:** Murid/Santri
**Sistem:** Sekolah Tahfiz Management System
