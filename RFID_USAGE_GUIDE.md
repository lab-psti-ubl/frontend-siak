# Panduan Penggunaan Sistem Data Alat RFID

## Deskripsi Fitur

Sistem Data Alat RFID adalah fitur di halaman admin yang memungkinkan pengelolaan perangkat RFID untuk sistem scanning absen guru dan murid secara otomatis.

## Fitur Utama

### 1. Menu Data Alat RFID
- Lokasi: **Dashboard Admin > Kelola Alat > Data Alat RFID**
- Tabel berisi informasi lengkap alat RFID yang sudah ditambahkan

### 2. Kolom Tabel
- **Nama Alat**: Nama perangkat RFID (contoh: RFID Reader Pintu Masuk)
- **Lokasi**: Lokasi pemasangan alat (contoh: Ruang Guru Lantai 1)
- **Token**: Kode unik untuk akses dashboard monitoring (ditampilkan singkat, dapat disalin)
- **Status**: Aktif atau Nonaktif
- **Aksi**:
  - 👁️ Tombol Monitoring - Buka tab baru untuk dashboard scanning
  - ⚡ Tombol Power - Aktifkan/Nonaktifkan alat
  - 🗑️ Tombol Delete - Hapus alat

### 3. Menambah Alat RFID Baru
1. Klik tombol "Tambah Alat RFID" (warna biru)
2. Isi form:
   - **Nama Alat**: Berikan nama deskriptif untuk alat
   - **Lokasi**: Tentukan lokasi pemasangan
3. Klik tombol "Tambah Alat"
4. Sistem otomatis akan membuat **Token Unik** untuk setiap alat

### 4. Monitoring RFID (Dashboard Scanning)
#### Cara Membuka Dashboard Monitoring
1. Klik tombol **Monitoring** (👁️) pada baris alat yang ingin dimonitor
2. Sebuah tab browser baru akan membuka halaman monitoring
3. Masukkan **Token** yang tertera di tabel untuk autentikasi

#### Fitur di Dashboard Monitoring
- **Autentikasi Token**: Form login yang mengharuskan masukkan token
- **Area Scanning**: Tampilan besar dengan pesan "Tap your RFID card on the reader"
- **Riwayat Scanning**: 20 scan terakhir ditampilkan di sebelah kanan
- **GUID Display**: Menampilkan GUID/kartu yang terakhir di-scan

#### Proses Scanning & Absen
1. **Untuk Guru**:
   - Tap kartu RFID di reader
   - Jika belum absen masuk hari ini → Sistem catat absen masuk
   - Jika sudah absen masuk → Sistem catat absen keluar

2. **Untuk Murid**:
   - Tap kartu RFID di reader
   - Jika belum absen masuk hari ini → Sistem catat absen masuk
   - Jika sudah absen masuk → Sistem catat absen pulang

#### Data yang Diproses
- Mengecek RFID GUID milik guru/murid di database
- Membaca tipe absen (masuk/keluar) berdasarkan catatan hari ini
- Menyimpan data otomatis ke sistem absensi
- Menampilkan notifikasi sukses/gagal
- Memutar suara untuk feedback

## Operasi Alat

### Menyalin Token
1. Klik ikon copy (📋) pada kolom Token
2. Token akan disalin ke clipboard
3. Gunakan untuk akses dashboard monitoring

### Mengaktifkan/Menonaktifkan Alat
1. Klik tombol power (⚡) pada alat
2. Status akan berubah dari Aktif ke Nonaktif atau sebaliknya
3. Alat nonaktif tidak bisa diakses untuk scanning

### Menghapus Alat
1. Klik tombol hapus (🗑️) pada alat
2. Alat akan terhapus dari sistem
3. Semua data scan alat tersebut akan hilang (tidak bisa dipulihkan)

## Persyaratan Teknis

### RFID Card Setup
- Setiap guru dan murid harus memiliki **RFID GUID** yang terdaftar di data profil mereka
- RFID GUID diisi di field `rfidGuid` pada data guru/murid

### Kompatibilitas
- Dashboard monitoring dapat diakses di browser modern (Chrome, Firefox, Safari, Edge)
- Dukungan WebSocket untuk real-time scanning
- Browser harus mengijinkan akses keyboard untuk input RFID

### Browser Requirements
- Resolusi minimum: 1024x768 pixel
- JavaScript harus diaktifkan
- Local Storage harus tersedia

## Alur Kerja Lengkap

```
1. Admin membuka Menu "Data Alat RFID"
   ↓
2. Admin menambah alat baru (nama + lokasi)
   ↓
3. Sistem auto-generate Token unik
   ↓
4. Admin klik tombol "Monitoring"
   ↓
5. Tab baru membuka halaman monitoring
   ↓
6. Admin/Guru masukkan Token untuk autentikasi
   ↓
7. Dashboard siap menerima scan RFID card
   ↓
8. Guru/Murid tap card RFID di reader
   ↓
9. Sistem deteksi GUID dan proses absen otomatis
   ↓
10. Riwayat scan ditampilkan real-time
   ↓
11. Data absen tersimpan di database
```

## Tips Penggunaan

1. **Token Security**:
   - Token adalah kode rahasia untuk akses dashboard
   - Jangan bagikan token ke orang yang tidak berwenang
   - Setiap alat memiliki token unik yang berbeda

2. **Monitoring Dashboard**:
   - Buka dalam tab terpisah untuk monitoring real-time
   - Jangan tutup browser saat monitoring sedang berjalan
   - Dashboard akan tetap aktif menerima scan meski page tidak aktif

3. **Data RFID**:
   - Pastikan semua guru dan murid memiliki RFID GUID di profil
   - RFID GUID dapat diperoleh dari kartu/badge yang dimiliki
   - Setiap GUID harus unik per orang

4. **Troubleshooting**:
   - Jika scan gagal "Tidak Terdaftar": Pastikan RFID GUID ada di profil guru/murid
   - Jika token tidak valid: Copy token yang benar dari tabel
   - Jika alat tidak muncul: Refresh halaman atau klik "Tambah Alat RFID" lagi

## Data yang Tersimpan

Semua data alat RFID dan scan disimpan di **localStorage** browser dengan key:
- `alatRfid` - Daftar alat RFID
- `absensiGuru` - Data absensi guru
- `absensi` - Data absensi murid

## Security & Privacy

- Token untuk setiap alat berbeda dan tidak dapat diguess
- Dashboard monitoring hanya bisa diakses dengan token yang benar
- Tidak ada password yang disimpan untuk dashboard
- Data scan disimpan lokal di browser

---

**Versi**: 1.0
**Terakhir Diperbarui**: 16 November 2024
