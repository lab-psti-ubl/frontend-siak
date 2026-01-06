import { User, JadwalPelajaran, SesiAbsensi, Absensi, TahunAjaran, Kelas, Alumni } from '../../../../../../types';
import { exportToExcel } from '../../../../../../utils/exportUtils';
import { getMinTingkat, getMaxTingkat } from '../../../../../../utils/jenjangPendidikanUtils';
import { isTanggalExistsInDatabase } from '../absen-kelas/AbsenKelasUtils';

export const getKelasForTahunAjaran = (
  currentKelasId: string,
  targetTahunAjaran: string,
  activeTahunAjaran: TahunAjaran | undefined,
  kelas: Kelas[]
) => {
  const currentKelas = kelas.find(k => k.id === currentKelasId);
  if (!currentKelas) return null;

  // Jika tahun ajaran yang dipilih sama dengan tahun ajaran aktif, gunakan kelas saat ini
  if (activeTahunAjaran && targetTahunAjaran === activeTahunAjaran.tahun) {
    return currentKelas;
  }

  // Jika ada tahun ajaran aktif, coba hitung mundur
  if (activeTahunAjaran) {
    try {
      // Hitung selisih tahun
      const currentYear = parseInt(activeTahunAjaran.tahun.split('/')[0]);
      const targetYear = parseInt(targetTahunAjaran.split('/')[0]);
      const yearDiff = currentYear - targetYear;

      // Hitung tingkat kelas pada tahun ajaran yang dipilih
      const targetTingkat = currentKelas.tingkat - yearDiff;

      // Jika tingkat kelas tidak valid (di luar range jenjang), return null
      const minTingkat = getMinTingkat();
      const maxTingkat = getMaxTingkat();

      if (targetTingkat >= minTingkat && targetTingkat <= maxTingkat) {
        // Cari kelas dengan tingkat yang sesuai dan jurusan yang sama
        const targetKelas = kelas.find(k =>
          k.tingkat === targetTingkat &&
          k.jurusanId === currentKelas.jurusanId &&
          k.name.includes(currentKelas.name.split(' ').slice(1).join(' '))
        );

        if (targetKelas) {
          return targetKelas;
        }
      }
    } catch (error) {
      // Jika error (misalnya jenjang belum dikonfigurasi), return currentKelas
      // untuk membiarkan data ditampilkan berdasarkan data yang ada
    }
  }

  // Jika tidak ada tahun ajaran aktif atau perhitungan gagal,
  // kembalikan kelas saat ini untuk membiarkan sistem mencari data berdasarkan kelas ini
  return currentKelas;
};

export const getMuridForSelectedPeriod = (
  targetKelas: any,
  selectedTahunAjaran: string,
  activeTahunAjaran: TahunAjaran | undefined,
  users: User[],
  kelas: Kelas[],
  userKelasWali: string,
  alumni: Alumni[] = []
) => {
  if (!targetKelas) return [];

  // Ambil ID murid yang sudah menjadi alumni untuk memastikan mereka dikeluarkan dari daftar
  const alumniMuridIds = new Set(alumni.map(a => a.muridId));

  // Jika tahun ajaran yang dipilih adalah tahun ajaran aktif, gunakan data saat ini
  // Hanya tampilkan murid yang masih aktif (isActive !== false) dan BUKAN alumni
  if (activeTahunAjaran && selectedTahunAjaran === activeTahunAjaran.tahun) {
    return users.filter(u =>
      u.role === 'murid' &&
      u.kelasId === userKelasWali &&
      u.isActive !== false &&
      !alumniMuridIds.has(u.id)
    );
  }

  // Untuk tahun ajaran historis, tampilkan murid yang berada di kelas target
  // Hanya tampilkan murid yang masih aktif (isActive !== false) dan BUKAN alumni
  return users.filter(u =>
    u.role === 'murid' &&
    u.kelasId === targetKelas.id &&
    u.isActive !== false &&
    !alumniMuridIds.has(u.id)
  );
};

export const getAttendanceStats = (
  muridId: string,
  targetKelas: any,
  selectedTahunAjaran: string,
  selectedSemester: number,
  selectedMonth: number,
  selectedYear: number,
  absensi: Absensi[],
  tahunAjaran?: TahunAjaran[]
) => {
  const kelasId = targetKelas?.id || '';
  const datePrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Find tahun ajaran to get semester dates if available
  const taData = tahunAjaran?.find(ta => ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester);

  // Get all dates in the month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const allDatesInMonth: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    allDatesInMonth.push(dateStr);
  }

  // Filter absensi berdasarkan murid, kelas, tahun ajaran, semester, dan bulan
  const muridAbsensi = absensi.filter(a =>
    a.muridId === muridId &&
    a.kelasId === kelasId &&
    a.tahunAjaranId === taData?.id &&
    a.semester === selectedSemester &&
    a.tanggal?.startsWith(datePrefix)
  );

  // Group by tanggal - handle both new structure (one record per day) and old structure (separate records)
  const absensiByDate: Record<string, { masuk?: Absensi; pulang?: Absensi; originalRecord?: Absensi }> = {};

  muridAbsensi.forEach(abs => {
    const dateKey = abs.tanggal;
    if (!absensiByDate[dateKey]) {
      absensiByDate[dateKey] = {};
    }

    // Handle new structure (one record per day with jamMasuk/jamKeluar)
    if (abs.jamMasuk || abs.statusMasuk || abs.jamKeluar || abs.statusKeluar) {
      // Store original record for reference
      absensiByDate[dateKey].originalRecord = abs;
      
      // Create virtual masuk record if exists
      if (abs.jamMasuk || abs.statusMasuk) {
        absensiByDate[dateKey].masuk = {
          ...abs,
          tipeAbsen: 'masuk',
          status: (abs.statusMasuk === 'izin' || abs.statusMasuk === 'sakit' || abs.statusMasuk === 'alfa') 
            ? abs.statusMasuk 
            : (abs.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir'),
          statusMasuk: abs.statusMasuk // Ensure statusMasuk is preserved
        };
      }
      // Create virtual pulang record if exists
      if (abs.jamKeluar || abs.statusKeluar) {
        absensiByDate[dateKey].pulang = {
          ...abs,
          tipeAbsen: 'pulang',
          status: (abs.statusKeluar === 'izin' || abs.statusKeluar === 'sakit' || abs.statusKeluar === 'alfa') 
            ? abs.statusKeluar 
            : (abs.statusKeluar === 'pulang_awal' || abs.statusKeluar === 'pulang_cepat' ? 'pulang_cepat' : 'hadir'),
          statusKeluar: abs.statusKeluar // Ensure statusKeluar is preserved
        };
      }
    } else {
      // Handle old structure (separate records with tipeAbsen)
      if (abs.tipeAbsen === 'masuk') {
        absensiByDate[dateKey].masuk = abs;
      } else if (abs.tipeAbsen === 'pulang') {
        absensiByDate[dateKey].pulang = abs;
      }
    }
  });

  // Count occurrences berdasarkan keterangan (status harian)
  let hadir = 0, izin = 0, sakit = 0, alfa = 0, dispen = 0, bolos = 0;
  let totalHari = 0; // Only count days that exist in database

  // Process all dates in the month
  allDatesInMonth.forEach(dateStr => {
    // Cek apakah tanggal ada di database
    const tanggalExists = isTanggalExistsInDatabase(
      absensi,
      dateStr,
      kelasId,
      taData?.id,
      selectedSemester
    );

    // Jika tanggal tidak ada di database, skip (tidak dihitung)
    if (!tanggalExists) {
      return;
    }

    // Jika tanggal ada di database, hitung sebagai hari aktif
    totalHari++;

    // Cek apakah murid memiliki record untuk tanggal ini
    const dayAbsensi = absensiByDate[dateStr];

    // Jika tanggal ada di database tapi murid tidak memiliki record, count as alfa
    if (!dayAbsensi || (!dayAbsensi.masuk && !dayAbsensi.pulang && !dayAbsensi.originalRecord)) {
      alfa++;
      return;
    }

    // Jika ada record, proses seperti biasa
    const masukAbsensi = dayAbsensi.masuk;
    const pulangAbsensi = dayAbsensi.pulang;
    const originalRecord = dayAbsensi.originalRecord;

    // Get status from new structure (statusMasuk/statusKeluar) or old structure (status)
    // For new structure, read directly from original record if available
    const statusMasuk = originalRecord?.statusMasuk || masukAbsensi?.statusMasuk || masukAbsensi?.status;
    const statusKeluar = originalRecord?.statusKeluar || pulangAbsensi?.statusKeluar || pulangAbsensi?.status;

    // Determine daily status based on masuk and pulang
    // Priority: izin > sakit > alfa > dispen > bolos > hadir
    
    // If no masuk and no pulang, it's alfa
    if (!masukAbsensi && !pulangAbsensi) {
      alfa++;
      return;
    }

    // If no masuk, it's bolos
    if (!masukAbsensi) {
      bolos++;
      return;
    }

    // Check masuk status first
    if (statusMasuk === 'izin') {
      izin++;
      return;
    }

    if (statusMasuk === 'sakit') {
      sakit++;
      return;
    }

    if (statusMasuk === 'alfa' || statusMasuk === 'tidak_masuk') {
      alfa++;
      return;
    }

    // If masuk is hadir/tepat_waktu/terlambat, check pulang
    if (statusMasuk === 'hadir' || statusMasuk === 'tepat_waktu' || statusMasuk === 'terlambat') {
      if (!pulangAbsensi) {
        // Masuk hadir but no pulang yet, count as hadir
        hadir++;
        return;
      }

      // Check pulang status
      if (statusKeluar === 'izin' || statusKeluar === 'sakit') {
        // If pulang is izin or sakit, it's dispen
        dispen++;
        return;
      }

      if (statusKeluar === 'alfa' || statusKeluar === 'tidak_keluar') {
        // If pulang is alfa, it's bolos
        bolos++;
        return;
      }

      // Both masuk and pulang are hadir/tepat_waktu, count as hadir
      if (statusKeluar === 'hadir' || statusKeluar === 'tepat_waktu' || statusKeluar === 'pulang_awal' || statusKeluar === 'pulang_cepat') {
        hadir++;
        return;
      }
    }

    // Default: count as hadir if masuk exists and is not explicitly alfa/izin/sakit
    hadir++;
  });

  const attendanceRate = totalHari > 0 ?
    ((hadir / totalHari) * 100).toFixed(1) : '0';

  return {
    hadir,
    izin,
    sakit,
    alfa,
    dispen,
    bolos,
    totalHari,
    total: totalHari, // Alias untuk kompatibilitas dengan interface yang mengharapkan 'total'
    attendanceRate: parseFloat(attendanceRate)
  };
};

export const getDetailedAttendance = (
  muridId: string,
  targetKelas: any,
  selectedTahunAjaran: string,
  selectedSemester: number,
  selectedMonth: number,
  selectedYear: number,
  absensi: Absensi[],
  tahunAjaran?: TahunAjaran[]
) => {
  const kelasId = targetKelas?.id || '';
  const datePrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Find tahun ajaran
  const taData = tahunAjaran?.find(ta => ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester);

  // Filter absensi berdasarkan murid, kelas, tahun ajaran, semester, dan bulan
  const muridAbsensi = absensi.filter(a =>
    a.muridId === muridId &&
    a.kelasId === kelasId &&
    a.tahunAjaranId === taData?.id &&
    a.semester === selectedSemester &&
    a.tanggal?.startsWith(datePrefix)
  );

  // Group by tanggal
  const absensiByDate: Record<string, { masuk?: Absensi; pulang?: Absensi }> = {};

  muridAbsensi.forEach(abs => {
    const dateKey = abs.tanggal;
    if (!absensiByDate[dateKey]) {
      absensiByDate[dateKey] = {};
    }
    if (abs.tipeAbsen === 'masuk') {
      absensiByDate[dateKey].masuk = abs;
    } else if (abs.tipeAbsen === 'pulang') {
      absensiByDate[dateKey].pulang = abs;
    }
  });

  // Map ke format detail absensi
  return Object.entries(absensiByDate)
    .map(([tanggal, dayAbsensi]) => {
      const masukAbsensi = dayAbsensi.masuk;
      const pulangAbsensi = dayAbsensi.pulang;

      // Tentukan status harian berdasarkan kombinasi masuk/pulang
      let statusHarian = 'alfa';
      if (masukAbsensi?.status === 'hadir' || pulangAbsensi?.status === 'hadir') {
        statusHarian = 'hadir';
      } else if (masukAbsensi?.status === 'izin' || pulangAbsensi?.status === 'izin') {
        statusHarian = 'izin';
      } else if (masukAbsensi?.status === 'sakit' || pulangAbsensi?.status === 'sakit') {
        statusHarian = 'sakit';
      }

      const masukWaktu = masukAbsensi?.waktu ? new Date(masukAbsensi.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
      const pulangWaktu = pulangAbsensi?.waktu ? new Date(pulangAbsensi.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
      
      // Gunakan waktu masuk sebagai waktu utama, atau waktu pulang jika tidak ada
      const waktu = masukWaktu !== '-' ? masukWaktu : pulangWaktu;

      return {
        tanggal,
        jenis: 'Kehadiran Harian',
        status: statusHarian,
        waktu, // Field waktu untuk kompatibilitas dengan interface
        keterangan: masukAbsensi?.keterangan || pulangAbsensi?.keterangan || '-',
        masukStatus: masukAbsensi?.status || '-',
        masukWaktu,
        masukKeterangan: masukAbsensi?.keterangan || '-',
        pulangStatus: pulangAbsensi?.status || '-',
        pulangWaktu,
        pulangKeterangan: pulangAbsensi?.keterangan || '-'
      };
    })
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
};

export const exportMuridData = (
  filteredMurid: User[],
  targetKelas: any,
  selectedTahunAjaran: string,
  selectedSemester: number,
  selectedMonth: number,
  selectedYear: number,
  getAttendanceStats: (muridId: string) => any
) => {
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthName = monthNames[selectedMonth - 1];

  const data = filteredMurid.map(murid => {
    const stats = getAttendanceStats(murid.id);
    return {
      nisn: murid.nisn,
      nama: murid.name,
      email: murid.email,
      kelas: targetKelas?.name || 'Unknown',
      tahunAjaran: selectedTahunAjaran,
      semester: selectedSemester,
      bulan: monthName,
      tahun: selectedYear,
      hadir: stats.hadir,
      izin: stats.izin,
      sakit: stats.sakit,
      alfa: stats.alfa,
      totalHari: stats.totalHari,
      tingkatKehadiran: `${stats.attendanceRate}%`,
      tanggalBergabung: murid.createdAt ? new Date(murid.createdAt).toLocaleDateString('id-ID') : '-',
      whatsappOrtu: murid.whatsappOrtu || '-'
    };
  });

  const columns = [
    { header: 'NISN', dataKey: 'nisn', width: 15 },
    { header: 'Nama Murid', dataKey: 'nama', width: 25 },
    { header: 'Email', dataKey: 'email', width: 25 },
    { header: 'Kelas', dataKey: 'kelas', width: 15 },
    { header: 'Bulan', dataKey: 'bulan', width: 12 },
    { header: 'Tahun', dataKey: 'tahun', width: 10 },
    { header: 'Hadir', dataKey: 'hadir', width: 8 },
    { header: 'Izin', dataKey: 'izin', width: 8 },
    { header: 'Sakit', dataKey: 'sakit', width: 8 },
    { header: 'Alfa', dataKey: 'alfa', width: 8 },
    { header: 'Total Hari', dataKey: 'totalHari', width: 12 },
    { header: 'Tingkat Kehadiran', dataKey: 'tingkatKehadiran', width: 18 },
    { header: 'WhatsApp Ortu', dataKey: 'whatsappOrtu', width: 15 },
    { header: 'Tanggal Bergabung', dataKey: 'tanggalBergabung', width: 15 }
  ];

  const title = `DATA KEHADIRAN MURID KELAS\nKelas: ${targetKelas?.name}\nPeriode: ${monthName} ${selectedYear}`;
  const filename = `data-murid-${targetKelas?.name}-${monthName}-${selectedYear}`;

  exportToExcel(data, columns, title, filename);
};