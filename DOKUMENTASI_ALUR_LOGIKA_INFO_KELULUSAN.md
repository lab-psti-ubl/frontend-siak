# Dokumentasi Alur Logika Menu Beri Info & Pengumuman Kelulusan

## Daftar Isi
1. [Menu Beri Info](#menu-beri-info)
2. [Menu Pengumuman Kelulusan](#menu-pengumuman-kelulusan)
3. [Pembuatan Tahun Ajaran Baru](#pembuatan-tahun-ajaran-baru)
4. [Logika Wali Kelas pada Kenaikan Kelas](#logika-wali-kelas-pada-kenaikan-kelas)
5. [Pembuatan Kelas Baru saat Kenaikan Kelas](#pembuatan-kelas-baru-saat-kenaikan-kelas)
6. [Proses Kelulusan dan Data Alumni](#proses-kelulusan-dan-data-alumni)
7. [Kenaikan Kelas Murid](#kenaikan-kelas-murid)
8. [Tampilan Menu Info Kelulusan di Halaman Guru dan Murid](#tampilan-menu-info-kelulusan-di-halaman-guru-dan-murid)

---

## Menu Beri Info

### Lokasi File
- **Komponen**: `src/components/admin/pages/info-pengumuman/BeriInfo.tsx`
- **Path di Admin**: Info & Pengumuman > Beri Infod

### Alur Logika

#### 1. **Jenis Informasi yang Dapat Dibuat**

Menu Beri Info mendukung 4 jenis informasi:

##### a. **Informasi Umum**
- **Target**: Semua, Guru, atau Murid
- **Semester**: Bisa dibuat kapan saja
- **Fungsi**: Mengirim informasi umum ke pengguna

##### b. **Pengumuman Kelulusan** (Hanya Semester Genap)
- **Target**: Otomatis ke murid kelas tingkat akhir (XII/12)
- **Semester**: Hanya bisa dibuat di semester 2
- **Fungsi**:
  - Membuat record `PengumumanKelulusan` dengan `isPublished: true`
  - Menyimpan snapshot ID murid kelas tingkat akhir saat pengumuman dibuat (`snapshotMuridIds`)
  - Otomatis mempublish raport semester 2 untuk semua kelas tingkat akhir
  - Membuat menu "Info Kelulusan" muncul di halaman guru wali kelas tingkat akhir dan murid tingkat akhir

**Alur Detail:**
```typescript
1. Admin memilih jenis "kelulusan" di form
2. Sistem validasi:
   - Harus semester 2
   - Tidak boleh ada pengumuman kelulusan aktif untuk tahun ajaran yang sama
3. Sistem mengambil snapshot ID semua murid kelas tingkat akhir yang aktif
4. Membuat record PengumumanKelulusan dengan:
   - tahunAjaran: tahun ajaran aktif
   - isPublished: true
   - snapshotMuridIds: array ID murid kelas tingkat akhir
5. Otomatis membuat StatusKenaikanKelas untuk semua kelas tingkat akhir dengan isPublished: true
6. Menyimpan InfoSekolah dengan jenis "kelulusan"
```

##### c. **Pengumuman Kenaikan Kelas** (Hanya Semester Genap)
- **Target**: Otomatis ke semua murid (kecuali tingkat akhir)
- **Semester**: Hanya bisa dibuat di semester 2
- **Fungsi**:
  - Membuat `StatusKenaikanKelas` untuk semua kelas (kecuali tingkat akhir)
  - Status dibuat dengan `isPublished: false` (wali kelas harus publish manual)
  - Mengaktifkan tombol "Sebarkan Raport" di menu Raport Murid untuk wali kelas

**Alur Detail:**
```typescript
1. Admin memilih jenis "kenaikan_kelas" di form
2. Sistem validasi: Harus semester 2
3. Untuk setiap kelas (kecuali tingkat akhir):
   - Cek apakah sudah ada StatusKenaikanKelas untuk tahun ajaran dan semester ini
   - Jika belum ada, buat StatusKenaikanKelas baru dengan isPublished: false
4. Menyimpan InfoSekolah dengan jenis "kenaikan_kelas"
```

##### d. **Bagi Raport Semester Ganjil** (Hanya Semester Ganjil)
- **Target**: Semua murid
- **Semester**: Hanya bisa dibuat di semester 1
- **Fungsi**:
  - Membuat `StatusBagiRaport` untuk semua kelas dengan `isPublished: false`
  - **OTOMATIS membuat semester genap** untuk tahun ajaran yang sama (tapi belum aktif)
  - Mengaktifkan tombol "Sebarkan Raport" di menu Raport Murid untuk semua wali kelas

**Alur Detail:**
```typescript
1. Admin memilih jenis "bagi_raport" di form
2. Sistem validasi: Harus semester 1
3. Untuk setiap kelas:
   - Cek apakah sudah ada StatusBagiRaport untuk tahun ajaran dan semester ini
   - Jika sudah ada, update dengan isPublished: false
   - Jika belum ada, buat StatusBagiRaport baru dengan isPublished: false
4. OTOMATIS membuat semester genap:
   - Cek apakah semester genap untuk tahun ajaran yang sama sudah ada
   - Jika belum ada, buat TahunAjaran baru dengan:
     - tahun: sama dengan tahun ajaran aktif
     - semester: 2
     - isActive: false (belum aktif, perlu aktivasi manual)
5. Menyimpan InfoSekolah dengan jenis "bagi_raport"
```

---

## Menu Pengumuman Kelulusan

### Lokasi File
- **Komponen**: `src/components/admin/pages/info-pengumuman/PengumumanKelulusan.tsx`
- **Utils**: `src/components/admin/pages/info-pengumuman/utils/pengumumanUtils.ts`
- **Path di Admin**: Info & Pengumuman > Pengumuman Kelulusan

### Kondisi Akses
- **Hanya tersedia di Semester Genap** (semester 2)
- Jika semester ganjil, menampilkan pesan bahwa pengumuman kelulusan hanya tersedia di semester genap

### Alur Logika

#### 1. **Buat Pengumuman Kelulusan**

**Tombol**: "Buat Pengumuman Kelulusan"

**Fungsi** (`createPengumumanKelulusan`):
```typescript
1. Cek apakah sudah ada pengumuman aktif untuk tahun ajaran ini
2. Ambil snapshot ID semua murid kelas tingkat akhir yang aktif
3. Buat PengumumanKelulusan dengan:
   - tahunAjaran: tahun ajaran aktif
   - isPublished: true
   - snapshotMuridIds: array ID murid (untuk menjaga data konsisten)
4. Otomatis publish raport untuk semua kelas tingkat akhir
5. Set flag hasGivenKenaikanKelasInfo untuk tahun ajaran ini
```

**Penting**: `snapshotMuridIds` digunakan untuk menjaga konsistensi data. Meskipun murid sudah dipindahkan ke kelas lain atau menjadi alumni, data kelulusan tetap menampilkan murid yang ada saat pengumuman dibuat.

#### 2. **Beri Info Kenaikan Kelas**

**Tombol**: "Beri Info Kenaikan Kelas" (muncul setelah pengumuman dibuat)

**Fungsi** (`handleBeriInfoKenaikanKelas`):
```typescript
1. Untuk setiap kelas:
   - Cek apakah sudah ada StatusKenaikanKelas untuk tahun ajaran dan semester ini
   - Jika belum ada, buat StatusKenaikanKelas baru dengan isPublished: false
2. Set flag hasGivenKenaikanKelasInfo = true untuk tahun ajaran dan semester ini
3. Tampilkan notifikasi sukses
```

**Efek**:
- Mengaktifkan tombol "Sebarkan Raport" di menu Raport Murid untuk semua wali kelas
- Wali kelas dapat menyebarkan raport semester 2 kepada murid

#### 3. **Proses Kenaikan Kelas & Kelulusan**

**Tombol**: "Proses Kenaikan Kelas & Kelulusan" (muncul setelah "Beri Info Kenaikan Kelas" diklik)

**Fungsi** (`processKenaikanKelasAndKelulusanAction` → `executeKenaikanKelasAndKelulusan`):

**Langkah-langkah Proses:**

##### a. **Membuat Riwayat Wali Kelas** (SEBELUM proses utama)
```typescript
1. Ambil semua kelas tingkat akhir yang punya wali kelas
2. Untuk setiap kelas tingkat akhir:
   - Hitung jumlah murid lulus dan tidak lulus
   - Buat record RiwayatWaliKelas dengan:
     - guruId: ID wali kelas
     - kelasId: ID kelas
     - jumlahMuridLulus: jumlah murid yang lulus
     - jumlahMuridTidakLulus: jumlah murid yang tidak lulus
     - tahunAjaran: tahun ajaran aktif
     - tanggalKelulusan: tanggal sekarang
3. Simpan riwayat ke localStorage
```

##### b. **Proses Kelulusan Murid Tingkat Akhir**
```typescript
1. Ambil semua murid kelas tingkat akhir (tingkat maksimal)
2. Untuk setiap murid:
   - Generate raport data semester 2
   - Hitung kelulusan berdasarkan:
     - nilaiAkhir >= nilaiAkhirMinimal (default: 70)
     - tingkatKehadiran >= tingkatKehadiranMinimal (default: 75%)
   - Jika LULUS:
     - Buat record Alumni dengan:
       - muridId: ID murid
       - tahunLulus: tahun ajaran aktif
       - nilaiAkhir: nilai akhir dari raport
       - tingkatKehadiran: tingkat kehadiran dari raport
       - waliKelasSebelumnya: ID wali kelas
     - Tandai murid sebagai isActive: false
     - Pindahkan murid ke kelas "Alumni" (tingkat 99)
   - Jika TIDAK LULUS:
     - Murid tetap di kelas tingkat akhir (tidak ada perubahan)
```

##### c. **Proses Kenaikan Kelas Murid (Bukan Tingkat Akhir)**
```typescript
1. Ambil semua murid kelas di bawah tingkat akhir
2. Untuk setiap murid:
   - Generate raport data semester 2
   - Hitung kenaikan kelas berdasarkan:
     - nilaiAkhir >= nilaiAkhirMinimal (default: 70)
     - tingkatKehadiran >= tingkatKehadiranMinimal (default: 75%)
   - Jika NAIK KELAS:
     - Tentukan kelas target berdasarkan tingkat berikutnya
     - Contoh: "X IPA 1" → "XI IPA 1"
     - Simpan hasil ke kenaikanResults
   - Jika TIDAK NAIK KELAS:
     - Murid tetap di kelas yang sama
     - Simpan alasan tidak naik kelas
```

##### d. **Hitung Ranking Alumni**
```typescript
1. Sort alumni berdasarkan nilaiAkhir (tertinggi ke terendah)
2. Hitung peringkatSekolah untuk setiap alumni
3. Group alumni berdasarkan kelasId
4. Untuk setiap kelas, hitung peringkatKelas
```

##### e. **Buat Tahun Ajaran Baru**
```typescript
1. Parse tahun ajaran aktif (format: "2023/2024")
2. Buat tahun ajaran baru dengan:
   - tahun: "2024/2025" (tahun + 1)
   - semester: 1 (mulai dari semester ganjil)
   - isActive: false (BELUM AKTIF - perlu aktivasi manual)
   - isAutoCreated: true (tandai dibuat otomatis)
```

##### f. **Buat Kelas Baru untuk Tahun Ajaran Baru**
```typescript
Fungsi: autoCreateKelasForNextYear()

1. Analisis kenaikanResults untuk menentukan kelas yang dibutuhkan
2. Untuk setiap murid yang naik kelas:
   - Tentukan tingkat target (tingkat sekarang + 1)
   - Tentukan nama kelas target (contoh: "XI IPA 1")
   - Cek apakah kelas dengan nama tersebut sudah ada
   - Jika belum ada:
     - Buat kelas baru dengan:
       - name: nama kelas target
       - tingkat: tingkat target
       - jurusanId: jurusan dari kelas lama (jika ada)
3. Return array kelas baru yang dibuat
```

**Contoh:**
- Murid dari "X IPA 1" naik kelas → butuh kelas "XI IPA 1"
- Murid dari "X IPA 2" naik kelas → butuh kelas "XI IPA 2"
- Sistem akan membuat kelas-kelas tersebut jika belum ada

##### g. **Update Data Murid**
```typescript
1. Murid yang LULUS:
   - Set isActive: false
   - Set kelasId: ID kelas Alumni

2. Murid yang NAIK KELAS:
   - Update kelasId ke kelas target (kelas baru atau kelas yang sudah ada)
   - Tetap isActive: true

3. Murid yang TIDAK NAIK KELAS:
   - Tetap di kelas yang sama
   - Tetap isActive: true
```

##### h. **Proses Transisi Wali Kelas**
```typescript
Fungsi: handleWaliKelasTransitions()

Sistem wali kelas memiliki 3 mode (dari pengaturan wali kelas):

1. MODE HAPUS:
   - Semua wali kelas dilepas dari jabatannya
   - Set isWaliKelas: false
   - Set kelasWali: undefined

2. MODE TETAP:
   - Wali kelas tetap di kelas yang sama
   - Tidak ada perubahan

3. MODE OTOMATIS (default):
   - Untuk wali kelas kelas tingkat akhir:
     - Dilepas dari jabatan (karena murid sudah lulus)
     - Set isWaliKelas: false
   - Untuk wali kelas kelas di bawah tingkat akhir:
     - Cari kelas target berdasarkan tingkat berikutnya
     - Contoh: wali kelas "X IPA 1" → pindah ke "XI IPA 1"
     - Update kelasWali ke ID kelas target
     - Jika kelas target tidak ditemukan, lepas jabatan
```

##### i. **Update Kelas dengan Wali Kelas Baru**
```typescript
Fungsi: updateKelasWithNewWaliKelas()

1. Buat mapping kelasId → guruId dari data users yang sudah diupdate
2. Untuk setiap kelas:
   - Jika ada wali kelas baru, set waliKelasId
   - Jika tidak ada wali kelas, hapus waliKelasId
```

##### j. **Nonaktifkan Semua Tahun Ajaran**
```typescript
1. Set isActive: false untuk semua tahun ajaran yang ada
2. Tambahkan tahun ajaran baru (yang sudah dibuat) ke daftar tahun ajaran
3. Tahun ajaran baru masih belum aktif (isActive: false)
```

##### k. **Tandai Pengumuman Sudah Diproses**
```typescript
1. Update PengumumanKelulusan dengan:
   - isProcessed: true
   - snapshotMuridIds: tetap dipertahankan
2. Hapus flag hasGivenKenaikanKelasInfo untuk tahun ajaran ini
```

### Hasil Proses

Setelah proses selesai, sistem menampilkan modal dengan ringkasan:
- Jumlah murid yang naik kelas
- Jumlah murid yang lulus
- Jumlah alumni baru
- Jumlah kelas baru yang dibuat
- Jumlah murid yang dipindahkan
- Jumlah wali kelas yang mengikuti muridnya
- **PENTING**: Tahun ajaran baru sudah dibuat tapi belum aktif, perlu aktivasi manual

---

## Pembuatan Tahun Ajaran Baru

### Kapan Dibuat?

Tahun ajaran baru dibuat **otomatis** saat proses "Proses Kenaikan Kelas & Kelulusan" dijalankan.

### Detail Pembuatan

**Lokasi**: `src/utils/kelasUtils.ts` - fungsi `processKenaikanKelasAndKelulusan()`

**Logika**:
```typescript
1. Parse tahun ajaran aktif (format: "2023/2024")
   - startYear = 2023
   - endYear = 2024

2. Buat tahun ajaran baru:
   - tahun: "2024/2025" (startYear + 1 / endYear + 1)
   - semester: 1 (mulai dari semester ganjil)
   - isActive: false (BELUM AKTIF)
   - isAutoCreated: true
   - tanggalMulai: '' (kosong, perlu diisi manual)
   - tanggalSelesai: '' (kosong, perlu diisi manual)

3. Semua tahun ajaran lama dinonaktifkan (isActive: false)
```

### Aktivasi Manual

**PENTING**: Tahun ajaran baru **TIDAK otomatis aktif**. Admin harus:
1. Buka menu: **Kelola Akademik > Tahun Ajaran**
2. Cari tahun ajaran baru yang dibuat otomatis
3. Edit tahun ajaran:
   - Isi tanggal mulai dan tanggal selesai
   - Set `isActive: true`
4. Simpan

**Alasan**: Memberi fleksibilitas admin untuk mengatur kapan tahun ajaran baru dimulai.

---

## Logika Wali Kelas pada Kenaikan Kelas

### Pengaturan Wali Kelas

Sistem memiliki 3 mode pengaturan wali kelas (dari menu pengaturan):

1. **MODE HAPUS**: Semua wali kelas dilepas saat kenaikan kelas
2. **MODE TETAP**: Wali kelas tetap di kelas yang sama
3. **MODE OTOMATIS**: Wali kelas mengikuti muridnya ke tingkat berikutnya

### Lokasi File
- **Fungsi**: `src/utils/kelasUtils.ts` - `handleWaliKelasTransitions()`
- **Pengaturan**: Disimpan di localStorage dengan key `waliKelasSettings`

### Alur Detail Mode Otomatis

```typescript
1. Untuk setiap guru yang isWaliKelas = true:
   
   a. Jika wali kelas kelas TINGKAT AKHIR:
      - Dilepas dari jabatan (karena murid sudah lulus)
      - Set isWaliKelas: false
      - Set kelasWali: undefined
   
   b. Jika wali kelas kelas DI BAWAH TINGKAT AKHIR:
      - Tentukan tingkat target (tingkat sekarang + 1)
      - Generate nama kelas target:
        Contoh: "X IPA 1" → "XI IPA 1"
      - Cari kelas target di daftar kelas (termasuk kelas baru)
      - Jika ditemukan:
        - Update kelasWali ke ID kelas target
        - Wali kelas mengikuti muridnya
      - Jika tidak ditemukan:
        - Lepas jabatan (isWaliKelas: false)
        - Kelas target akan dibuat otomatis atau manual
```

### Update Kelas dengan Wali Kelas Baru

**Fungsi**: `updateKelasWithNewWaliKelas()`

```typescript
1. Buat mapping kelasId → guruId dari users yang sudah diupdate
2. Untuk setiap kelas:
   - Jika ada wali kelas baru di mapping:
     - Set waliKelasId ke ID guru
   - Jika tidak ada:
     - Hapus waliKelasId (set undefined)
```

---

## Pembuatan Kelas Baru saat Kenaikan Kelas

### Lokasi File
- **Fungsi**: `src/utils/kelasUtils.ts` - `autoCreateKelasForNextYear()`

### Alur Logika

```typescript
1. Analisis kenaikanResults:
   - Ambil semua murid yang isNaikKelas = true
   - Untuk setiap murid:
     - Ambil kelasLama dan kelasBaru
     - Cari kelas lama di database untuk dapat tingkat dan jurusan
     - Tentukan tingkat target (tingkat + 1)
     - Extract pattern dari nama kelas baru
       Contoh: "XI IPA 1" → pattern: "IPA 1"

2. Buat Map kelas yang dibutuhkan:
   - Key: nama kelas (contoh: "XI IPA 1")
   - Value: { tingkat, jurusanId, pattern }

3. Untuk setiap kelas yang dibutuhkan:
   - Cek apakah kelas dengan nama tersebut sudah ada
   - Jika BELUM ADA:
     - Buat kelas baru:
       - id: auto-generated
       - name: nama kelas target
       - tingkat: tingkat target
       - jurusanId: jurusan dari kelas lama (jika ada)
       - createdAt: timestamp sekarang
   - Jika SUDAH ADA:
     - Skip (kelas akan digunakan untuk murid naik kelas)

4. Return array kelas baru yang dibuat
```

### Contoh Skenario

**Skenario 1: Kelas Baru Dibutuhkan**
- Murid dari "X IPA 1" naik kelas → butuh "XI IPA 1"
- "XI IPA 1" belum ada → **Buat kelas baru "XI IPA 1"**

**Skenario 2: Kelas Sudah Ada**
- Murid dari "X IPA 1" naik kelas → butuh "XI IPA 1"
- "XI IPA 1" sudah ada → **Gunakan kelas yang sudah ada**

**Skenario 3: Multiple Murid, Satu Kelas**
- 5 murid dari "X IPA 1" naik kelas → semua butuh "XI IPA 1"
- Sistem hanya membuat 1 kelas "XI IPA 1" (tidak duplikat)

### Penentuan Jurusan

- **SMA/SMK**: Kelas baru akan memiliki `jurusanId` yang sama dengan kelas lama
- **SD/SMP**: Kelas baru tidak memiliki `jurusanId` (karena tidak ada jurusan)

---

## Proses Kelulusan dan Data Alumni

### Lokasi File
- **Fungsi**: `src/utils/kelasUtils.ts` - `processKenaikanKelasAndKelulusan()`

### Alur Kelulusan

#### 1. **Identifikasi Murid yang Lulus**

```typescript
1. Ambil semua murid kelas tingkat akhir (tingkat maksimal)
2. Untuk setiap murid:
   - Generate raport data semester 2
   - Hitung kelulusan:
     - nilaiAkhir >= 70 (default)
     - tingkatKehadiran >= 75% (default)
   - Jika LULUS → tambah ke daftar kelulusan
   - Jika TIDAK LULUS → tetap di kelas tingkat akhir
```

#### 2. **Pembuatan Data Alumni**

**Untuk setiap murid yang LULUS:**

```typescript
const alumniData: Alumni = {
  id: `alumni-${murid.id}-${Date.now()}`,
  muridId: murid.id,
  nama: murid.name,
  nisn: murid.nisn || '',
  kelasId: currentKelas.id, // ID kelas saat lulus
  namaKelas: currentKelas.name, // Nama kelas saat lulus
  jurusanId: currentKelas.jurusanId, // Jurusan (jika ada)
  namaJurusan: currentJurusan?.name, // Nama jurusan (jika ada)
  tahunLulus: activeTahunAjaran.tahun, // Tahun ajaran saat lulus
  nilaiAkhir: raportData.overallGrade, // Nilai akhir dari raport
  tingkatKehadiran: raportData.attendanceRate, // Tingkat kehadiran
  peringkatKelas: 1, // Akan dihitung nanti
  peringkatSekolah: 1, // Akan dihitung nanti
  tanggalLulus: new Date().toISOString(),
  waliKelasSebelumnya: waliKelas?.id, // ID wali kelas
  namaWaliKelasSebelumnya: waliKelas?.name, // Nama wali kelas
  nipWaliKelasSebelumnya: waliKelas?.nip, // NIP wali kelas
  createdAt: new Date().toISOString(),
};
```

#### 3. **Perhitungan Ranking**

```typescript
1. Sort semua alumni berdasarkan nilaiAkhir (tertinggi → terendah)
2. Hitung peringkatSekolah:
   - Alumni dengan nilai tertinggi = peringkat 1
   - Alumni dengan nilai terendah = peringkat terakhir

3. Group alumni berdasarkan kelasId
4. Untuk setiap kelas:
   - Sort alumni di kelas tersebut berdasarkan nilaiAkhir
   - Hitung peringkatKelas:
     - Alumni dengan nilai tertinggi di kelas = peringkat 1
```

#### 4. **Update Status Murid**

```typescript
1. Set isActive: false (murid tidak lagi aktif)
2. Set kelasId: ID kelas Alumni (tingkat 99)
3. Murid tidak bisa login lagi (karena isActive: false)
4. Data murid tetap ada di database untuk referensi
```

#### 5. **Kelas Alumni**

Sistem otomatis membuat atau menggunakan kelas "Alumni":
- **Nama**: "Alumni"
- **Tingkat**: 99 (khusus untuk alumni)
- **Fungsi**: Menyimpan referensi kelas untuk murid yang sudah lulus

---

## Kenaikan Kelas Murid

### Lokasi File
- **Fungsi**: `src/utils/kelasUtils.ts` - `processKenaikanKelasAndKelulusan()`

### Alur Kenaikan Kelas

#### 1. **Identifikasi Murid yang Naik Kelas**

```typescript
1. Ambil semua murid kelas di bawah tingkat akhir
2. Untuk setiap murid:
   - Generate raport data semester 2
   - Hitung kenaikan kelas:
     - nilaiAkhir >= 70 (default)
     - tingkatKehadiran >= 75% (default)
   - Jika NAIK KELAS:
     - Tentukan kelas target (tingkat + 1)
     - Contoh: "X IPA 1" → "XI IPA 1"
   - Jika TIDAK NAIK KELAS:
     - Tetap di kelas yang sama
     - Simpan alasan tidak naik kelas
```

#### 2. **Penentuan Kelas Target**

```typescript
1. Ambil tingkat kelas sekarang
2. Tentukan tingkat target (tingkat + 1)
3. Format nama kelas target:
   - Ambil label tingkat (X, XI, XII atau 7, 8, 9)
   - Ganti label tingkat dengan tingkat target
   - Contoh:
     - "X IPA 1" → "XI IPA 1"
     - "7 A" → "8 A"
```

#### 3. **Pembuatan Kelas Baru (Jika Diperlukan)**

Lihat bagian [Pembuatan Kelas Baru saat Kenaikan Kelas](#pembuatan-kelas-baru-saat-kenaikan-kelas)

#### 4. **Update Data Murid**

```typescript
1. Untuk murid yang NAIK KELAS:
   - Update kelasId ke ID kelas target
   - Tetap isActive: true
   - Murid bisa login dan menggunakan sistem

2. Untuk murid yang TIDAK NAIK KELAS:
   - Tetap di kelas yang sama
   - Tetap isActive: true
   - Murid bisa login dan menggunakan sistem
```

#### 5. **Murid Pindah ke Tingkat Selanjutnya**

Setelah proses selesai:
- Murid yang naik kelas **langsung** berada di tingkat berikutnya
- Data kelasId sudah diupdate
- Murid bisa langsung menggunakan sistem dengan kelas baru
- **TIDAK perlu** aktivasi manual untuk murid

---

## Tampilan Menu Info Kelulusan di Halaman Guru dan Murid

### Lokasi File
- **Sidebar**: `src/components/layout/Sidebar.tsx`
- **Guru**: `src/components/guru/pages/walikelas/InfoKelulusan.tsx`
- **Murid**: `src/components/murid/pages/info-kelulusan/InfoKelulusanMurid.tsx`

### Kondisi Menu Muncul

#### **Untuk Guru (Wali Kelas)**

Menu "Info Kelulusan" muncul di sidebar **Wali Kelas** jika:

```typescript
1. User adalah wali kelas (isWaliKelas = true)
2. User memiliki kelasWali (kelas yang diwalikan)
3. Kelas yang diwalikan adalah kelas tingkat akhir (tingkat maksimal)
4. Ada PengumumanKelulusan yang isPublished = true
5. PengumumanKelulusan tahunAjaran = tahun ajaran aktif
6. Tahun ajaran aktif semester = 2 (semester genap)
```

**Kode di Sidebar**:
```typescript
...(users.find(u => u.id === user?.id && u.kelasWali && 
  kelas.find(k => k.id === u.kelasWali && isMaxTingkatSync(k.tingkat))) ?
  [{ id: 'info-kelulusan', label: 'Info Kelulusan', icon: GraduationCap }]
    .filter(() => {
      const activeTahunAjaran = JSON.parse(localStorage.getItem('tahunAjaran') || '[]')
        .find((ta: any) => ta.isActive);
      return activeTahunAjaran?.semester === 2;
    }) : []
),
```

**Path**: `/dashboard/info-kelulusan`

**Fitur yang Ditampilkan**:
- Statistik kelulusan kelas (total murid, lulus, tidak lulus, tingkat kelulusan)
- Kartu pengumuman kelulusan
- Daftar murid terbaik kelas
- Tabel data kelulusan semua murid di kelas
- Export data kelulusan ke Excel

#### **Untuk Murid**

Menu "Info Kelulusan" muncul di sidebar jika:

```typescript
1. User adalah murid (role = 'murid')
2. Murid berada di kelas tingkat akhir (tingkat maksimal)
3. Ada PengumumanKelulusan yang isPublished = true
4. PengumumanKelulusan tahunAjaran = tahun ajaran aktif
5. Tahun ajaran aktif semester = 2 (semester genap)
```

**Kode di Sidebar**:
```typescript
...((() => {
  const muridUser = users.find(u => u.id === user?.id);
  const muridKelas = kelas.find(k => k.id === muridUser?.kelasId);
  const activeTahunAjaran = JSON.parse(localStorage.getItem('tahunAjaran') || '[]')
    .find((ta: any) => ta.isActive);
  const pengumumanKelulusan = JSON.parse(localStorage.getItem('pengumumanKelulusan') || '[]')
    .find((p: any) => p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun);

  return (muridKelas && isMaxTingkatSync(muridKelas.tingkat) && 
    pengumumanKelulusan && activeTahunAjaran?.semester === 2) ?
    [{ id: 'info-kelulusan-murid', label: 'Info Kelulusan', icon: GraduationCap }] : [];
})(),
```

**Path**: `/dashboard/info-kelulusan-murid`

**Fitur yang Ditampilkan**:
- Status kelulusan pribadi (LULUS / TIDAK LULUS)
- Kartu raport dengan nilai akhir dan tingkat kehadiran
- Peringkat di kelas
- Peringkat di sekolah
- Daftar murid terbaik kelas
- Daftar murid terbaik sekolah
- Tombol lihat detail kelulusan
- Tombol lihat raport lengkap

### Alur Data

#### **Guru Wali Kelas**

```typescript
1. Sistem mengambil murid di kelas wali kelas:
   - Filter users dengan kelasId = user.kelasWali
   - Filter role = 'murid' dan isActive !== false

2. Generate kelulusan data untuk setiap murid:
   - Ambil raport data semester 2
   - Hitung kelulusan berdasarkan nilai dan kehadiran
   - Gunakan snapshotMuridIds dari pengumuman jika ada

3. Tampilkan statistik dan data kelulusan
```

#### **Murid**

```typescript
1. Sistem mengambil data murid sendiri:
   - Generate raport data semester 2 untuk user.id
   - Hitung kelulusan pribadi

2. Sistem mengambil data semua murid kelas tingkat akhir:
   - Untuk peringkat kelas
   - Untuk peringkat sekolah
   - Untuk daftar murid terbaik

3. Tampilkan status kelulusan dan peringkat
```

### Penggunaan Snapshot

**Penting**: Sistem menggunakan `snapshotMuridIds` dari `PengumumanKelulusan` untuk menjaga konsistensi data.

**Alasan**:
- Setelah proses kenaikan kelas, murid yang lulus sudah dipindahkan ke kelas Alumni
- Tanpa snapshot, sistem tidak bisa menampilkan data kelulusan yang benar
- Dengan snapshot, sistem tetap menampilkan murid yang ada saat pengumuman dibuat

**Implementasi**:
```typescript
// Di PengumumanKelulusan.tsx
if (activePengumuman?.snapshotMuridIds && activePengumuman.snapshotMuridIds.length > 0) {
  // Gunakan snapshot
  muridKelas12 = users.filter(u => 
    activePengumuman.snapshotMuridIds!.includes(u.id)
  );
} else {
  // Fallback ke data sekarang (untuk backward compatibility)
  muridKelas12 = users.filter(u => {
    const muridKelas = kelas.find(k => k.id === u.kelasId);
    return u.role === 'murid' && muridKelas && 
      isMaxTingkat(muridKelas.tingkat) && u.isActive !== false;
  });
}
```

---

## Ringkasan Alur Lengkap

### Skenario: Dari Semester Ganjil ke Semester Genap hingga Tahun Ajaran Baru

#### **Semester Ganjil (Semester 1)**

1. **Admin membuat "Bagi Raport Semester Ganjil"**:
   - Membuat `StatusBagiRaport` untuk semua kelas
   - **OTOMATIS membuat semester genap** (belum aktif)
   - Wali kelas dapat menyebarkan raport semester ganjil

2. **Admin mengaktifkan semester genap**:
   - Buka menu Tahun Ajaran
   - Aktifkan semester genap untuk tahun ajaran yang sama

#### **Semester Genap (Semester 2)**

3. **Admin membuat "Pengumuman Kelulusan"**:
   - Membuat `PengumumanKelulusan` dengan `isPublished: true`
   - Menyimpan snapshot ID murid kelas tingkat akhir
   - Menu "Info Kelulusan" muncul di guru dan murid

4. **Admin klik "Beri Info Kenaikan Kelas"**:
   - Membuat `StatusKenaikanKelas` untuk semua kelas
   - Wali kelas dapat menyebarkan raport semester genap

5. **Wali kelas menyebarkan raport**:
   - Wali kelas klik "Sebarkan Raport" di menu Raport Murid
   - Murid dapat melihat raport semester genap

6. **Admin klik "Proses Kenaikan Kelas & Kelulusan"**:
   - Membuat riwayat wali kelas
   - Memproses kelulusan murid tingkat akhir
   - Memproses kenaikan kelas murid di bawah tingkat akhir
   - Membuat data alumni
   - Membuat kelas baru untuk tahun ajaran baru
   - Memindahkan murid ke kelas baru
   - Memproses transisi wali kelas
   - **Membuat tahun ajaran baru** (belum aktif)
   - Menonaktifkan semua tahun ajaran lama

7. **Admin mengaktifkan tahun ajaran baru**:
   - Buka menu Tahun Ajaran
   - Edit tahun ajaran baru
   - Isi tanggal mulai dan tanggal selesai
   - Set `isActive: true`
   - Simpan

8. **Sistem siap untuk tahun ajaran baru**:
   - Murid sudah berada di kelas baru
   - Wali kelas sudah ditetapkan (sesuai pengaturan)
   - Kelas baru sudah dibuat
   - Tahun ajaran baru sudah aktif

---

## Catatan Penting

1. **Tahun Ajaran Baru**: Selalu dibuat dengan `isActive: false`. Admin harus mengaktifkannya manual.

2. **Snapshot Murid**: Digunakan untuk menjaga konsistensi data kelulusan meskipun murid sudah dipindahkan.

3. **Kelas Alumni**: Otomatis dibuat atau digunakan untuk menyimpan murid yang sudah lulus.

4. **Wali Kelas**: Transisi wali kelas tergantung pengaturan (Hapus/Tetap/Otomatis).

5. **Kelas Baru**: Hanya dibuat jika belum ada. Jika sudah ada, akan digunakan.

6. **Murid Tidak Naik Kelas**: Tetap di kelas yang sama, tidak dipindahkan.

7. **Murid Tidak Lulus**: Tetap di kelas tingkat akhir, tidak dipindahkan ke alumni.

8. **Proses Tidak Dapat Dibatalkan**: Setelah "Proses Kenaikan Kelas & Kelulusan" dijalankan, perubahan tidak bisa dibatalkan.

---

## File-file Terkait

### Komponen
- `src/components/admin/pages/info-pengumuman/BeriInfo.tsx`
- `src/components/admin/pages/info-pengumuman/PengumumanKelulusan.tsx`
- `src/components/guru/pages/walikelas/InfoKelulusan.tsx`
- `src/components/murid/pages/info-kelulusan/InfoKelulusanMurid.tsx`

### Utils
- `src/utils/kelasUtils.ts` - Logika utama kenaikan kelas dan kelulusan
- `src/components/admin/pages/info-pengumuman/utils/pengumumanUtils.ts` - Utils pengumuman kelulusan

### Layout
- `src/components/layout/Sidebar.tsx` - Menu sidebar untuk semua role

### Types
- `src/types/index.ts` - Type definitions untuk semua entitas

---

**Dokumentasi ini dibuat untuk membantu memahami alur logika sistem informasi kelulusan dan kenaikan kelas.**

