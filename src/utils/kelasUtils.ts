import { User, Kelas, Nilai, TahunAjaran, JadwalPelajaran, Absensi, SesiAbsensi, Jurusan, Alumni } from '../types';
import { RiwayatWaliKelas } from '../types';
import { generateRaportData } from './raport';
import { getNilaiMinimalSettings } from './nilaiUtils';
import { getWaliKelasSettingsSync } from './waliKelasSystemUtils';
import { shouldShowJurusanSync, formatTingkatKelasSync, getMaxTingkatSync } from './jenjangPendidikanUtils';

export interface KenaikanKelasResult {
  muridId: string;
  namaLengkap: string;
  kelasLama: string;
  kelasBaru: string;
  nilaiAkhir: number;
  kehadiran: number;
  isNaikKelas: boolean;
  alasan?: string;
}

export interface KelulusanResult {
  muridId: string;
  namaLengkap: string;
  kelas: string;
  nilaiAkhir: number;
  kehadiran: number;
  isLulus: boolean;
  alasan?: string;
}

const getOrCreateAlumniKelas = (
  kelas: Kelas[],
  tahunAjaran: string
): Kelas => {
  const existingAlumniKelas = kelas.find(k => k.name === 'Alumni' && k.tingkat === 99);
  if (existingAlumniKelas) {
    return existingAlumniKelas;
  }

  const newAlumniKelas: Kelas = {
    id: `kelas-alumni-${tahunAjaran.replace('/', '-')}`,
    name: 'Alumni',
    tingkat: 99,
    createdAt: new Date().toISOString(),
  };

  console.log(`Membuat kelas Alumni baru untuk tahun ajaran ${tahunAjaran}`);
  return newAlumniKelas;
};

export const processKenaikanKelasAndKelulusan = (
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: any[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[]
): {
  newTahunAjaran: TahunAjaran,
  kenaikanResults: KenaikanKelasResult[],
  kelulusanResults: KelulusanResult[],
  newAlumni: Alumni[],
  alumniKelas?: Kelas
} => {
  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);

  if (!activeTahunAjaran || activeTahunAjaran.semester !== 2) {
    console.log('Tidak ada tahun ajaran aktif atau bukan semester genap');
    return {
      newTahunAjaran: activeTahunAjaran!,
      kenaikanResults: [],
      kelulusanResults: [],
      newAlumni: []
    };
  }

  console.log('Memproses tahun ajaran:', activeTahunAjaran.tahun, 'semester:', activeTahunAjaran.semester);

  const kenaikanResults: KenaikanKelasResult[] = [];
  const kelulusanResults: KelulusanResult[] = [];
  const newAlumni: Alumni[] = [];

  const alumniKelas = getOrCreateAlumniKelas(kelas, activeTahunAjaran.tahun);

  // 1. Process murid kelas terakhir (tingkat maksimal) untuk kelulusan
  const maxTingkat = getMaxTingkatSync();
  const muridKelasTerakhir = users.filter(u => {
    if (u.role !== 'murid') return false;
    if (u.isActive === false) return false;
    const muridKelas = kelas.find(k => k.id === u.kelasId);
    return muridKelas && muridKelas.tingkat === maxTingkat;
  });

  console.log(`Murid kelas ${maxTingkat} (tingkat terakhir) yang akan diproses kelulusan:`, muridKelasTerakhir.length);

  muridKelasTerakhir.forEach(murid => {
    const currentKelas = kelas.find(k => k.id === murid.kelasId);
    if (!currentKelas) return;

    const currentJurusan = shouldShowJurusanSync() && currentKelas.jurusanId ? jurusan.find(j => j.id === currentKelas.jurusanId) : null;
    if (shouldShowJurusanSync() && currentKelas.jurusanId && !currentJurusan) return;

    // Generate raport data untuk semester genap
    const raportData = generateRaportData(
      murid.id,
      2, // Semester genap
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      [activeTahunAjaran], // Use only active tahun ajaran
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );

    if (!raportData) return;

    const minimalSettings = getNilaiMinimalSettings();
    const isLulus = raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal && raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal;
    
    let alasan = '';
    if (!isLulus) {
      alasan = raportData.overallGrade < minimalSettings.nilaiAkhirMinimal ? 
        `Nilai rata-rata ${raportData.overallGrade.toFixed(1)} < ${minimalSettings.nilaiAkhirMinimal}` :
        `Kehadiran ${raportData.attendanceRate.toFixed(1)}% < ${minimalSettings.tingkatKehadiranMinimal}%`;
    }

    console.log(`Murid ${murid.name}: isLulus=${isLulus}, nilai=${raportData.overallGrade.toFixed(1)}, kehadiran=${raportData.attendanceRate.toFixed(1)}%`);
    kelulusanResults.push({
      muridId: murid.id,
      namaLengkap: murid.name,
      kelas: currentKelas.name,
      nilaiAkhir: raportData.overallGrade,
      kehadiran: raportData.attendanceRate,
      isLulus,
      alasan
    });

    if (isLulus) {
      // Murid lulus - akan dihapus dari kelas dan ditambahkan ke alumni
      const waliKelas = users.find(u => u.id === currentKelas.waliKelasId);
      
      // Create alumni record
      const alumniData: Alumni = {
        id: `alumni-${murid.id}-${Date.now()}`,
        muridId: murid.id,
        nama: murid.name,
        nisn: murid.nisn || '',
        kelasId: currentKelas.id,
        namaKelas: currentKelas.name,
        jurusanId: shouldShowJurusanSync() && currentKelas.jurusanId ? currentKelas.jurusanId : undefined,
        namaJurusan: shouldShowJurusanSync() && currentJurusan ? currentJurusan.name : undefined,
        tahunLulus: activeTahunAjaran.tahun,
        nilaiAkhir: raportData.overallGrade,
        tingkatKehadiran: raportData.attendanceRate,
        peringkatKelas: 1, // Will be calculated later
        peringkatSekolah: 1, // Will be calculated later
        tanggalLulus: new Date().toISOString(),
        waliKelasSebelumnya: waliKelas?.id,
        namaWaliKelasSebelumnya: waliKelas?.name,
        nipWaliKelasSebelumnya: waliKelas?.nip,
        createdAt: new Date().toISOString(),
      };
      newAlumni.push(alumniData);
      console.log(`Membuat alumni: ${murid.name} untuk tahun lulus ${activeTahunAjaran.tahun}`);

    }
    // Jika tidak lulus, murid tetap di kelas tingkat maksimal (tidak ada perubahan)
  });

  // 2. Process murid kelas dibawah tingkat terakhir untuk kenaikan kelas
  const maxTingkatForKenaikan = getMaxTingkatSync();
  const muridKelasNaikKelas = users.filter(u => {
    if (u.role !== 'murid') return false;
    if (u.isActive === false) return false;
    const muridKelas = kelas.find(k => k.id === u.kelasId);
    return muridKelas && muridKelas.tingkat < maxTingkatForKenaikan;
  });

  console.log(`Murid kelas dibawah tingkat ${maxTingkat} yang akan diproses kenaikan:`, muridKelasNaikKelas.length);

  // Group murid by their current class for better processing
  const muridByKelas = muridKelasNaikKelas.reduce((acc, murid) => {
    const kelasId = murid.kelasId;
    if (!acc[kelasId]) acc[kelasId] = [];
    acc[kelasId].push(murid);
    return acc;
  }, {} as Record<string, User[]>);

  // Process each class group
  Object.entries(muridByKelas).forEach(([kelasId, muridList]) => {
    const currentKelas = kelas.find(k => k.id === kelasId);
    if (!currentKelas) return;

    const currentJurusan = shouldShowJurusanSync() && currentKelas.jurusanId ? jurusan.find(j => j.id === currentKelas.jurusanId) : null;
    if (shouldShowJurusanSync() && currentKelas.jurusanId && !currentJurusan) return;

    console.log(`Memproses kelas ${currentKelas.name} dengan ${muridList.length} murid`);
      // Process each murid in this class
      muridList.forEach(murid => {
        const currentKelas = kelas.find(k => k.id === murid.kelasId);
        if (!currentKelas) return;

        const currentJurusan = shouldShowJurusan() && currentKelas.jurusanId ? jurusan.find(j => j.id === currentKelas.jurusanId) : null;
        if (shouldShowJurusan() && currentKelas.jurusanId && !currentJurusan) return;

        // Generate raport data untuk semester genap
        const raportData = generateRaportData(
          murid.id,
          2, // Semester genap
          users,
          kelas,
          jurusan,
          nilai,
          mataPelajaran,
          [activeTahunAjaran], // Use only active tahun ajaran
          jadwalPelajaran,
          absensi,
          sesiAbsensi
        );

        if (!raportData) return;

        const minimalSettings = getNilaiMinimalSettings();
        const isNaikKelas = raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal && raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal;

        // Determine target class name based on current class level
        const targetTingkat = currentKelas.tingkat + 1;
        const currentTingkatLabel = formatTingkatKelasSync(currentKelas.tingkat);
        const targetTingkatLabel = formatTingkatKelasSync(targetTingkat);

        const targetKelasName = currentKelas.name.replace(
          new RegExp(`^${currentTingkatLabel}\\s`),
          `${targetTingkatLabel} `
        );

        let kelasBaru = targetKelasName;
        let alasan = '';

        if (isNaikKelas) {
          alasan = 'Kelas target akan dibuat otomatis';
        } else {
          // Tidak naik kelas - murid tetap di kelas yang sama
          kelasBaru = currentKelas.name;
          alasan = raportData.overallGrade < minimalSettings.nilaiAkhirMinimal ? 
            `Nilai rata-rata ${raportData.overallGrade.toFixed(1)} < ${minimalSettings.nilaiAkhirMinimal}` :
            `Kehadiran ${raportData.attendanceRate.toFixed(1)}% < ${minimalSettings.tingkatKehadiranMinimal}%`;
        }

        console.log(`Murid ${murid.name}: isNaikKelas=${isNaikKelas}, dari ${currentKelas.name} ke ${kelasBaru}`);
        kenaikanResults.push({
          muridId: murid.id,
          namaLengkap: murid.name,
          kelasLama: currentKelas.name,
          kelasBaru,
          nilaiAkhir: raportData.overallGrade,
          kehadiran: raportData.attendanceRate,
          isNaikKelas,
          alasan
        });
      });
  });

  // 3. Calculate rankings for alumni
  if (newAlumni.length > 0) {
    // Sort alumni by nilaiAkhir for school ranking
    const sortedAlumni = [...newAlumni].sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);
    
    // Calculate school ranking
    sortedAlumni.forEach((alumni, index) => {
      alumni.peringkatSekolah = index + 1;
    });

    // Calculate class ranking
    const alumniByKelas = newAlumni.reduce((acc, alumni) => {
      if (!acc[alumni.kelasId]) acc[alumni.kelasId] = [];
      acc[alumni.kelasId].push(alumni);
      return acc;
    }, {} as Record<string, Alumni[]>);

    Object.values(alumniByKelas).forEach(kelasAlumni => {
      const sortedKelasAlumni = kelasAlumni.sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);
      sortedKelasAlumni.forEach((alumni, index) => {
        alumni.peringkatKelas = index + 1;
      });
    });
    
    console.log('Ranking alumni berhasil dihitung');
  }

  // 4. Create new tahun ajaran (NOT ACTIVE by default)
  const [startYear, endYear] = activeTahunAjaran.tahun.split('/').map(y => parseInt(y));
  const newTahunAjaranValue = `${startYear + 1}/${endYear + 1}`;

  const newTahunAjaran: TahunAjaran = {
    id: `ta-${Date.now()}`,
    tahun: newTahunAjaranValue,
    semester: 1, // Mulai dari semester ganjil
    isActive: false, // Tidak langsung aktif, perlu aktivasi manual oleh admin
    tanggalMulai: '',
    tanggalSelesai: '',
    isAutoCreated: true // Tandai bahwa tahun ajaran ini dibuat otomatis
  };

  console.log(`Tahun ajaran baru dibuat: ${newTahunAjaranValue} semester 1 (Belum Aktif - Perlu Aktivasi Manual)`);
  return {
    newTahunAjaran,
    kenaikanResults,
    kelulusanResults,
    newAlumni,
    alumniKelas
  };
};

export const processKelulusan = (
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: any[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[]
): KelulusanResult[] => {
  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
  
  if (!activeTahunAjaran || activeTahunAjaran.semester !== 2) {
    return [];
  }

  const results: KelulusanResult[] = [];

  // Process murid kelas terakhir untuk kelulusan
  const maxTingkat = getMaxTingkatSync();
  const muridKelasTerakhir = users.filter(u => {
    if (u.role !== 'murid') return false;
    if (u.isActive === false) return false;
    const muridKelas = kelas.find(k => k.id === u.kelasId);
    return muridKelas && muridKelas.tingkat === maxTingkat;
  });

  muridKelasTerakhir.forEach(murid => {
    const currentKelas = kelas.find(k => k.id === murid.kelasId);
    if (!currentKelas) return;

    // Generate raport data untuk semester genap
    const raportData = generateRaportData(
      murid.id,
      2, // Semester genap
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran,
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );

    if (!raportData) return;

    const minimalSettings = getNilaiMinimalSettings();
    const isLulus = raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal && raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal;
    
    let alasan = '';
    if (!isLulus) {
      alasan = raportData.overallGrade < minimalSettings.nilaiAkhirMinimal ? 
        `Nilai rata-rata ${raportData.overallGrade.toFixed(1)} < ${minimalSettings.nilaiAkhirMinimal}` :
        `Kehadiran ${raportData.attendanceRate.toFixed(1)}% < ${minimalSettings.tingkatKehadiranMinimal}%`;
    }

    results.push({
      muridId: murid.id,
      namaLengkap: murid.name,
      kelas: currentKelas.name,
      nilaiAkhir: raportData.overallGrade,
      kehadiran: raportData.attendanceRate,
      isLulus,
      alasan
    });
  });

  return results;
};

export const createNewTahunAjaran = (
  currentTahunAjaran: TahunAjaran
): TahunAjaran => {
  const [startYear, endYear] = currentTahunAjaran.tahun.split('/').map(y => parseInt(y));
  const newTahunAjaran = `${startYear + 1}/${endYear + 1}`;

  return {
    id: `ta-${Date.now()}`,
    tahun: newTahunAjaran,
    semester: 1, // Mulai dari semester ganjil
    isActive: false, // Tidak langsung aktif, perlu aktivasi manual oleh admin
    tanggalMulai: '', // Kosong, perlu diisi manual oleh admin
    tanggalSelesai: '', // Kosong, perlu diisi manual oleh admin
    isAutoCreated: true // Tandai dibuat otomatis
  };
};

export const autoCreateKelasForNextYear = (
  kelas: Kelas[],
  jurusan: Jurusan[],
  kenaikanResults: KenaikanKelasResult[]
): Kelas[] => {
  const newKelas: Kelas[] = [];
  const kelasNeeded = new Map<string, { tingkat: number, jurusanId: string | undefined }>();

  console.log('=== AUTO CREATE KELAS FOR NEXT YEAR ===');
  console.log('Kenaikan results untuk analisis:', kenaikanResults.length);
  console.log('Kelas yang sudah ada:', kelas.map(k => k.name).join(', '));

  kenaikanResults.forEach(result => {
    if (result.isNaikKelas && result.kelasBaru && result.kelasBaru !== result.kelasLama) {
      console.log(`Menganalisis kebutuhan kelas untuk: ${result.namaLengkap} dari ${result.kelasLama} ke ${result.kelasBaru}`);

      // Find the old kelas to determine tingkat and jurusan
      const oldKelas = kelas.find(k => k.name === result.kelasLama);
      if (!oldKelas) {
        console.warn(`Kelas lama ${result.kelasLama} tidak ditemukan`);
        return;
      }

      const targetTingkat = oldKelas.tingkat + 1;
      
      // Check if class already exists
      const existingKelas = kelas.find(k => k.name === result.kelasBaru && k.tingkat === targetTingkat);
      if (existingKelas) {
        console.log(`✓ Kelas ${result.kelasBaru} sudah ada dengan ID ${existingKelas.id}, akan digunakan untuk murid naik kelas`);
        return;
      }

      // Add to kelasNeeded if not already added
      if (!kelasNeeded.has(result.kelasBaru)) {
        console.log(`Kelas ${result.kelasBaru} dibutuhkan untuk tingkat ${targetTingkat}`);
        kelasNeeded.set(result.kelasBaru, {
          tingkat: targetTingkat,
          jurusanId: oldKelas.jurusanId
        });
      }
    }
  });

  console.log('Total kelas yang dibutuhkan:', kelasNeeded.size);

  kelasNeeded.forEach((kelasInfo, namaKelas) => {
    const existingKelas = kelas.find(k => k.name === namaKelas && k.tingkat === kelasInfo.tingkat);
    if (!existingKelas) {
      console.log(`✓ Membuat kelas baru: ${namaKelas} (Tingkat ${kelasInfo.tingkat}${kelasInfo.jurusanId ? ', Jurusan ' + kelasInfo.jurusanId : ''})`);
      const newKelasData: Kelas = {
        id: `kelas-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: namaKelas,
        tingkat: kelasInfo.tingkat,
        createdAt: new Date().toISOString(),
      };

      if (shouldShowJurusanSync() && kelasInfo.jurusanId) {
        newKelasData.jurusanId = kelasInfo.jurusanId;
      }

      newKelas.push(newKelasData);
    } else {
      console.log(`✓ Kelas ${namaKelas} sudah ada dengan ID ${existingKelas.id}, akan digunakan untuk murid naik kelas`);
    }
  });

  console.log(`Berhasil membuat ${newKelas.length} kelas baru`);
  console.log('Kelas yang dibuat:', newKelas.map(k => `${k.name} (Tingkat ${k.tingkat})`).join(', '));
  return newKelas;
};

export const executeKenaikanKelasAndKelulusan = (
  users: User[],
  setUsers: (users: User[]) => void,
  kelas: Kelas[],
  setKelas: (kelas: Kelas[]) => void,
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: any[],
  tahunAjaran: TahunAjaran[],
  setTahunAjaran: (tahunAjaran: TahunAjaran[]) => void,
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  alumni: Alumni[],
  setAlumni: (alumni: Alumni[]) => void
): {
  success: boolean,
  kenaikanResults: KenaikanKelasResult[],
  kelulusanResults: KelulusanResult[],
  newAlumniCount: number,
  message: string
} => {
  try {
    console.log('=== MULAI PROSES KENAIKAN KELAS & KELULUSAN ===');
    console.log('Tahun ajaran saat ini:', tahunAjaran.find(ta => ta.isActive));
    console.log('Total users sebelum proses:', users.length);
    console.log('Total kelas sebelum proses:', kelas.length);
    console.log('Total alumni sebelum proses:', alumni.length);
    
    const result = processKenaikanKelasAndKelulusan(
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran,
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );

    console.log('Hasil proses:', result);
    console.log('Kenaikan results:', result.kenaikanResults.length);
    console.log('Kelulusan results:', result.kelulusanResults.length);
    console.log('New alumni:', result.newAlumni.length);
    console.log('Detail kenaikan results:', result.kenaikanResults.map(kr => ({
      nama: kr.namaLengkap,
      isNaikKelas: kr.isNaikKelas,
      kelasLama: kr.kelasLama,
      kelasBaru: kr.kelasBaru
    })));

    // Create new classes if needed (only creates classes that don't exist)
    console.log('=== MEMANGGIL autoCreateKelasForNextYear ===');
    const newKelas = autoCreateKelasForNextYear(kelas, jurusan, result.kenaikanResults);
    console.log('Kelas baru yang dibuat:', newKelas.length);
    console.log('Detail kelas baru:', newKelas.map(k => `${k.name} (Tingkat ${k.tingkat})`));

    // Process graduated students - mark them as inactive and move to alumni class
    const graduatedStudentIds = result.kelulusanResults
      .filter(kr => kr.isLulus)
      .map(kr => kr.muridId);

    console.log('Murid yang lulus (akan ditandai isActive=false dan dipindah ke kelas Alumni):', graduatedStudentIds);

    // Add alumni kelas to kelas list if it's a new one
    let kelasWithAlumni = [...kelas, ...newKelas];
    if (result.alumniKelas && !kelasWithAlumni.find(k => k.id === result.alumniKelas!.id)) {
      kelasWithAlumni.push(result.alumniKelas);
      console.log(`Kelas Alumni ditambahkan: ${result.alumniKelas.name} (ID: ${result.alumniKelas.id})`);
    }

    // Merge existing and new classes plus alumni class
    const allKelas = kelasWithAlumni;
    console.log('Total kelas setelah penambahan:', allKelas.length);
    console.log('Daftar semua kelas:', allKelas.map(k => `${k.name} (${k.id})`).join(', '));

    // Mark graduated students as inactive and change their kelasId to alumni kelas
    let usersAfterGraduation = users.map(user => {
      if (user.role === 'murid' && graduatedStudentIds.includes(user.id)) {
        console.log(`Menandai murid lulus sebagai inactive dan memindahkan ke kelas Alumni: ${user.name}`);
        return {
          ...user,
          isActive: false,
          kelasId: result.alumniKelas!.id
        };
      }
      return user;
    });

    console.log('Users setelah menandai yang lulus:', usersAfterGraduation.length);
    
    // Update users with correct kelasId for class promotion
    console.log('=== PROSES PEMINDAHAN MURID KE KELAS BARU ===');
    let finalUpdatedUsers = usersAfterGraduation.map(user => {
      if (user.role !== 'murid') return user;

      const kenaikanResult = result.kenaikanResults.find(kr => kr.muridId === user.id);
      if (!kenaikanResult) {
        console.log(`ℹ Tidak ada data kenaikan untuk murid: ${user.name}`);
        return user;
      }

      if (!kenaikanResult.isNaikKelas) {
        console.log(`⚠ Murid ${user.name} tidak naik kelas, tetap di kelas ${kenaikanResult.kelasLama}`);
        return user;
      }

      // Find the target class (either existing or newly created)
      const targetKelas = allKelas.find(k => k.name === kenaikanResult.kelasBaru);
      if (targetKelas) {
        const oldKelas = allKelas.find(k => k.id === user.kelasId);
        console.log(`✓ Murid ${user.name} dipindahkan dari ${oldKelas?.name || 'N/A'} (${user.kelasId}) ke ${targetKelas.name} (${targetKelas.id})`);
        return { ...user, kelasId: targetKelas.id };
      } else {
        console.error(`✗ Target kelas ${kenaikanResult.kelasBaru} tidak ditemukan untuk murid ${user.name}`);
        console.log('Kelas yang tersedia:', allKelas.map(k => k.name).join(', '));
        return user;
      }
    });
    console.log('=== SELESAI PEMINDAHAN MURID ===');
    
    console.log('Users setelah pemindahan kelas:', finalUpdatedUsers.length);
    
    // Update state
    setUsers(finalUpdatedUsers);
    setKelas(allKelas);

    // Add alumni records
    if (result.newAlumni.length > 0) {
      console.log(`Menambahkan ${result.newAlumni.length} alumni baru`);
      console.log('Alumni baru:', result.newAlumni.map(a => ({ nama: a.nama, tahunLulus: a.tahunLulus })));
      setAlumni([...alumni, ...result.newAlumni]);
    }

    // Deactivate all tahun ajaran (including the current active one)
    // Admin will manually activate the new tahun ajaran later
    const allTahunAjaranDeactivated = tahunAjaran.map(ta => ({
      ...ta,
      isActive: false
    }));

    console.log(`Menonaktifkan semua tahun ajaran yang sudah ada: ${tahunAjaran.length} tahun ajaran`);
    console.log(`Membuat tahun ajaran baru: ${result.newTahunAjaran.tahun} (Status: Belum Aktif - Perlu Aktivasi Manual)`);
    setTahunAjaran([...allTahunAjaranDeactivated, result.newTahunAjaran]);

    // Handle wali kelas transitions for new academic year
    const finalUpdatedUsersWithWali = handleWaliKelasTransitions(
      finalUpdatedUsers,
      kelas, // Old kelas
      newKelas,
      result.kenaikanResults
    );
    console.log('Memproses transisi wali kelas untuk tahun ajaran baru');
    setUsers(finalUpdatedUsersWithWali);

    // Update kelas with new wali kelas assignments
    const finalUpdatedKelas = updateKelasWithNewWaliKelas(
      allKelas,
      finalUpdatedUsersWithWali,
      result.kenaikanResults
    );
    console.log('Memperbarui assignment wali kelas di kelas-kelas');
    setKelas(finalUpdatedKelas);

    console.log('=== SELESAI PROSES KENAIKAN KELAS & KELULUSAN ===');
    console.log('Total users setelah proses:', finalUpdatedUsersWithWali.length);
    console.log('Total kelas setelah proses:', finalUpdatedKelas.length);
    console.log('Total alumni setelah proses:', alumni.length + result.newAlumni.length);
    
    const createdKelasCount = newKelas.length;
    const movedStudentsCount = result.kenaikanResults.filter(kr => kr.isNaikKelas).length;
    const waliKelasTransitioned = finalUpdatedUsersWithWali.filter(u => 
      u.role === 'guru' && u.isWaliKelas && 
      kelas.find(k => k.id === u.kelasWali)?.tingkat !== 
      finalUpdatedKelas.find(k => k.id === u.kelasWali)?.tingkat
    ).length;
    
    return {
      success: true,
      kenaikanResults: result.kenaikanResults,
      kelulusanResults: result.kelulusanResults,
      newAlumniCount: result.newAlumni.length,
      message: `Berhasil memproses ${result.kenaikanResults.length} murid kenaikan kelas dan ${result.kelulusanResults.length} murid kelulusan. ${result.newAlumni.length} alumni baru ditambahkan. ${createdKelasCount} kelas baru dibuat otomatis. ${movedStudentsCount} murid dipindahkan ke kelas baru. ${waliKelasTransitioned} wali kelas mengikuti muridnya ke tingkat berikutnya. Tahun ajaran baru ${result.newTahunAjaran.tahun} telah dibuat (belum aktif). Silakan aktifkan tahun ajaran baru secara manual di menu Kelola Akademik > Tahun Ajaran.`
    };

  } catch (error) {
    console.error('Error processing kenaikan kelas and kelulusan:', error);
    return {
      success: false,
      kenaikanResults: [],
      kelulusanResults: [],
      newAlumniCount: 0,
      message: 'Terjadi kesalahan saat memproses kenaikan kelas dan kelulusan.'
    };
  }
};
export const handleWaliKelasTransitions = (
  users: User[],
  oldKelas: Kelas[],
  newKelas: Kelas[],
  kenaikanResults: KenaikanKelasResult[]
): User[] => {
  const allKelas = [...oldKelas, ...newKelas];
  const settings = getWaliKelasSettingsSync();

  // Handle based on selected system
  if (settings.system === 'hapus') {
    // System Hapus: Lepas semua wali kelas
    console.log('Sistem Hapus: Melepas semua wali kelas');
    return users.map(user => {
      if (user.role !== 'guru' || !user.isWaliKelas || !user.kelasWali) {
        return user;
      }
      console.log(`Wali kelas ${user.name} dilepas dari jabatannya (Sistem Hapus)`);
      return {
        ...user,
        isWaliKelas: false,
        kelasWali: undefined
      };
    });
  }

  if (settings.system === 'tetap') {
    // System Tetap: Wali kelas tetap di kelas yang sama, tidak ada perubahan
    console.log('Sistem Tetap: Wali kelas tetap di kelas yang sama');
    return users;
  }

  // Default: System Otomatis - original behavior
  console.log('Sistem Otomatis: Wali kelas mengikuti muridnya ke kelas berikutnya');

  return users.map(user => {
    if (user.role !== 'guru' || !user.isWaliKelas || !user.kelasWali) {
      return user;
    }

    const currentKelas = oldKelas.find(k => k.id === user.kelasWali);
    if (!currentKelas) return user;

    // Handle different scenarios based on class level
    const maxTingkat = getMaxTingkatSync();
    if (currentKelas.tingkat === maxTingkat) {
      // Kelas terakhir: Remove wali kelas status (students graduated)
      console.log(`Wali kelas ${user.name} dilepas dari kelas ${maxTingkat} ${currentKelas.name} karena murid sudah lulus`);
      return {
        ...user,
        isWaliKelas: false,
        kelasWali: undefined
      };
    } else {
      // Untuk kelas dibawah tingkat terakhir: Cari kelas target berdasarkan tingkat berikutnya
      const targetTingkat = currentKelas.tingkat + 1;
      const currentTingkatLabel = formatTingkatKelasSync(currentKelas.tingkat);
      const targetTingkatLabel = formatTingkatKelasSync(targetTingkat);

      // Generate nama kelas target berdasarkan tingkat
      const targetKelasName = currentKelas.name.replace(
        new RegExp(`^${currentTingkatLabel}\\s`),
        `${targetTingkatLabel} `
      );

      console.log(`Mencari kelas target untuk wali kelas ${user.name}: dari ${currentKelas.name} (tingkat ${currentKelas.tingkat}) ke ${targetKelasName} (tingkat ${targetTingkat})`);

      // Cari kelas target di daftar kelas (termasuk kelas baru yang dibuat)
      // PENTING: Cari berdasarkan nama dan tingkat, BUKAN jurusanId karena bisa berbeda strukturnya
      const targetKelas = allKelas.find(k =>
        k.tingkat === targetTingkat &&
        k.name === targetKelasName
      );

      if (targetKelas) {
        console.log(`✓ Wali kelas ${user.name} dipindahkan dari ${currentKelas.name} (${currentKelas.id}) ke ${targetKelas.name} (${targetKelas.id})`);
        return {
          ...user,
          kelasWali: targetKelas.id
        };
      } else {
        // Jika kelas target tidak ditemukan dengan nama exact, coba cari berdasarkan pattern yang lebih fleksibel
        // Ambil bagian jurusan dan nomor kelas (misal "IPA 1" dari "XI IPA 1")
        const kelasPattern = currentKelas.name.split(' ').slice(1).join(' '); // "IPA 1" atau "IPS 2"

        const flexibleTargetKelas = allKelas.find(k =>
          k.tingkat === targetTingkat &&
          k.name.includes(kelasPattern)
        );

        if (flexibleTargetKelas) {
          console.log(`✓ Wali kelas ${user.name} dipindahkan dari ${currentKelas.name} ke ${flexibleTargetKelas.name} (flexible match)`);
          return {
            ...user,
            kelasWali: flexibleTargetKelas.id
          };
        } else {
          // Jika benar-benar tidak ada kelas target, tetap pertahankan status wali kelas
          // Kelas target akan dibuat otomatis atau manual oleh admin
          console.warn(`✗ Target kelas tingkat ${targetTingkat} tidak ditemukan untuk wali kelas ${user.name} dari ${currentKelas.name}.`);
          console.warn(`Daftar kelas tingkat ${targetTingkat}:`, allKelas.filter(k => k.tingkat === targetTingkat).map(k => k.name).join(', '));
          return {
            ...user,
            // Lepas status wali kelas karena tidak ada kelas target
            isWaliKelas: false,
            kelasWali: undefined
          };
        }
      }
    }

    return user;
  });
};

export const updateKelasWithNewWaliKelas = (
  allKelas: Kelas[],
  updatedUsers: User[],
  kenaikanResults: KenaikanKelasResult[]
): Kelas[] => {
  // Create a mapping of which guru should be wali kelas for which kelas
  const waliKelasMapping = new Map<string, string>(); // kelasId -> guruId

  updatedUsers.forEach(user => {
    if (user.role === 'guru' && user.isWaliKelas && user.kelasWali) {
      waliKelasMapping.set(user.kelasWali, user.id);
    }
  });

  return allKelas.map(kelasItem => {
    // Check if this kelas should have a wali kelas
    if (waliKelasMapping.has(kelasItem.id)) {
      const waliKelasId = waliKelasMapping.get(kelasItem.id)!;
      const waliKelas = updatedUsers.find(u => u.id === waliKelasId);

      if (waliKelas && waliKelas.isWaliKelas) {
        console.log(`Kelas ${kelasItem.name} mendapat wali kelas: ${waliKelas.name}`);
        return {
          ...kelasItem,
          waliKelasId: waliKelas.id
        };
      }
    }

    // Jika tidak ada wali kelas baru untuk kelas ini, hapus waliKelasId
    // Ini mengatasi masalah ketika guru pindah ke kelas baru atau dilepas dari jabatan
    if (kelasItem.waliKelasId) {
      console.log(`Kelas ${kelasItem.name} kehilangan wali kelas (${kelasItem.waliKelasId})`);
      return {
        ...kelasItem,
        waliKelasId: undefined
      };
    }

    return kelasItem;
  });
};