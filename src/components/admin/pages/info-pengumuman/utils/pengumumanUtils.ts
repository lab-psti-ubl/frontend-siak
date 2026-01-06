import { 
  PengumumanKelulusan, 
  TahunAjaran, 
  User, 
  Kelas, 
  Jurusan, 
  Nilai, 
  MataPelajaran, 
  JadwalPelajaran, 
  Absensi, 
  SesiAbsensi, 
  Alumni,
  RiwayatWaliKelas,
  StatusKenaikanKelas,
  InfoSekolah
} from '../../../../../types';
import { executeKenaikanKelasAndKelulusan } from '../../../../../utils/kelasUtils';
import { generateRaportData } from '../../../../../utils/raport';
import { showSuccessNotification, showWarningNotification } from '../../../../../utils/notificationUtils';
import { showDangerConfirmation, showWarningConfirmation } from '../../../../../utils/confirmationUtils';
import { getNilaiMinimalSettings } from '../../../../../utils/nilaiUtils';
import { isMaxTingkatSync, getGraduationTingkatLabelSync, getActiveJenjangSync } from '../../../../../utils/jenjangPendidikanUtils';
import { apiService } from '../../../../../services/apiService';
import { clearAllCaches } from '../../../../../utils/clearAllCaches';

export const createPengumumanKelulusan = async (
  _activePengumuman: PengumumanKelulusan | undefined,
  activeTahunAjaran: TahunAjaran | undefined,
  user: User | null,
  pengumumanKelulusan: PengumumanKelulusan[],
  refreshPengumumanKelulusan: () => Promise<void>,
  users: User[],
  kelas: Kelas[],
  _statusKenaikanKelas: StatusKenaikanKelas[],
  _createStatusKenaikanKelas: (data: Omit<StatusKenaikanKelas, 'id'>) => Promise<any>,
  _refreshStatusKenaikanKelas: () => Promise<void>,
  _setHasGivenKenaikanKelasInfoFlag: (hasGiven: boolean) => Promise<any>,
  refreshHasGivenKenaikanKelasInfo?: () => Promise<void>,
  createInfoSekolah?: (data: Omit<InfoSekolah, 'id'>) => Promise<any>
) => {
  // Check if announcement already exists for this specific academic year
  const existingPengumumanThisYear = pengumumanKelulusan.find(p =>
    p.tahunAjaran === activeTahunAjaran?.tahun && p.isPublished
  );

  if (existingPengumumanThisYear) {
    showWarningNotification('Pengumuman Sudah Ada', `Pengumuman kelulusan sudah aktif untuk tahun ajaran ${activeTahunAjaran?.tahun}!`);
    return;
  }

  // Get snapshot of current final grade murid IDs
  const muridKelas12Ids = users
    .filter((u: User) => {
      if (u.role !== 'murid') return false;
      const murid = u as any; // Type assertion for Murid
      const muridKelas = kelas.find((k: any) => k.id === murid.kelasId);
      return !!(muridKelas && isMaxTingkatSync(muridKelas.tingkat) && murid.isActive !== false);
    })
    .map((u) => u.id);

  console.log('Creating pengumuman kelulusan with snapshot of', muridKelas12Ids.length, 'murid');

  // Create pengumuman kelulusan via API
  try {
    const newPengumuman: Omit<PengumumanKelulusan, 'id'> = {
      tahunAjaran: activeTahunAjaran?.tahun || '',
      tanggalPengumuman: new Date().toISOString().split('T')[0],
      isPublished: true,
      snapshotMuridIds: muridKelas12Ids, // Store snapshot
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };

    await apiService.createPengumumanKelulusan(newPengumuman);
    await refreshPengumumanKelulusan();

    // Create InfoSekolah with jenis 'kelulusan'
    if (createInfoSekolah && activeTahunAjaran) {
      try {
        const graduationLabel = getGraduationTingkatLabelSync();
        const newInfo: Omit<InfoSekolah, 'id'> = {
          judul: `Pengumuman Kelulusan Tahun Ajaran ${activeTahunAjaran.tahun}`,
          konten: `Pengumuman kelulusan telah dipublikasikan untuk tahun ajaran ${activeTahunAjaran.tahun}. Murid ${graduationLabel} dapat melihat informasi kelulusan mereka.`,
          jenis: 'kelulusan',
          target: 'kelas_12',
          kelasId: undefined,
          isActive: true,
          createdBy: user?.id || '',
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
        };
        await createInfoSekolah(newInfo);
        console.log('✅ InfoSekolah untuk kelulusan berhasil dibuat');
      } catch (error) {
        console.error('Error creating InfoSekolah for kelulusan:', error);
        // Don't throw, continue with success notification
      }
    }

    // CATATAN: Tidak membuat StatusKenaikanKelas di sini
    // StatusKenaikanKelas akan dibuat saat admin klik "Beri Info Kenaikan Kelas"
    // Ini memastikan alur: Buat Pengumuman → Beri Info → Proses
    // Flag hasGivenKenaikanKelasInfo juga TIDAK di-set di sini
    
    // PENTING: Pastikan flag hasGivenKenaikanKelasInfo tetap false
    // Hapus flag jika ada (untuk memastikan tidak ada data lama yang mempengaruhi)
    if (activeTahunAjaran?.tahun && activeTahunAjaran?.semester) {
      try {
        // Hapus flag jika ada, untuk memastikan state benar
        await apiService.deleteHasGivenKenaikanKelasInfo(activeTahunAjaran.tahun, activeTahunAjaran.semester);
        console.log('✅ Flag hasGivenKenaikanKelasInfo dihapus setelah membuat pengumuman (memastikan state benar)');
        
        // Refresh flag jika refresh function tersedia
        if (refreshHasGivenKenaikanKelasInfo) {
          await refreshHasGivenKenaikanKelasInfo();
        }
      } catch (error: any) {
        // Tidak masalah jika flag tidak ada (404), itu berarti sudah false
        if (error?.message?.includes('404') || error?.message?.includes('tidak ditemukan')) {
          console.log('ℹ️ Flag tidak ada (sudah false)');
        } else {
          console.error('Error deleting flag:', error);
        }
        
        // Refresh flag meskipun ada error
        if (refreshHasGivenKenaikanKelasInfo) {
          await refreshHasGivenKenaikanKelasInfo();
        }
      }
    }

    showSuccessNotification(
      'Pengumuman Kelulusan Berhasil Dibuat',
      `Pengumuman kelulusan telah dipublikasikan. Langkah selanjutnya: klik tombol "Beri Info Kenaikan Kelas" untuk membagikan raport ke wali kelas.`
    );
  } catch (error) {
    console.error('Error creating pengumuman kelulusan:', error);
    showWarningNotification('Error', 'Gagal membuat pengumuman kelulusan');
  }
};

export const deactivatePengumumanKelulusan = async (
  activePengumuman: PengumumanKelulusan | undefined,
  updatePengumumanKelulusan: (id: string, data: Partial<PengumumanKelulusan>) => Promise<any>,
  refreshPengumumanKelulusan: () => Promise<void>
) => {
  if (!activePengumuman) return;

  showWarningConfirmation(
    'Nonaktifkan Pengumuman Kelulusan',
    'Apakah Anda yakin ingin menonaktifkan pengumuman kelulusan?\n\nTindakan ini akan:\n• Menyembunyikan menu Info Kelulusan dari guru dan murid\n• Menghentikan notifikasi kelulusan',
    async () => {
      try {
        await updatePengumumanKelulusan(activePengumuman.id, { isPublished: false });
        await refreshPengumumanKelulusan();
        showSuccessNotification('Pengumuman Dinonaktifkan', 'Pengumuman kelulusan berhasil dinonaktifkan!');
      } catch (error) {
        console.error('Error deactivating pengumuman:', error);
        showWarningNotification('Error', 'Gagal menonaktifkan pengumuman kelulusan');
      }
    },
    {
      confirmText: 'Ya, Nonaktifkan',
      cancelText: 'Batal'
    }
  );
};

export const processKenaikanKelasAndKelulusanAction = async (
  users: User[],
  gurus: User[],
  murid: User[],
  kelas: Kelas[],
  refreshKelas: () => Promise<void>,
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaran: TahunAjaran[],
  refreshTahunAjaran: () => Promise<void>,
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  alumni: Alumni[],
  refreshAlumni: (clearAllCaches?: boolean) => Promise<void>,
  pengumumanKelulusan: PengumumanKelulusan[],
  updatePengumumanKelulusan: (id: string, data: Partial<PengumumanKelulusan>) => Promise<any>,
  refreshPengumumanKelulusan: () => Promise<void>,
  activeTahunAjaran: TahunAjaran | undefined,
  deleteHasGivenKenaikanKelasInfoFlag: () => Promise<any>,
  refreshHasGivenKenaikanKelasInfo: () => Promise<void>,
  setProcessResults: (results: any) => void,
  setIsProcessModalOpen: (open: boolean) => void
) => {
  showDangerConfirmation(
    'Proses Kenaikan Kelas & Kelulusan',
    'Apakah Anda yakin ingin memproses kenaikan kelas dan kelulusan?\n\nProses ini akan:\n• Memindahkan murid yang naik kelas ke tingkat berikutnya\n• Menghapus murid yang lulus dari sistem aktif\n• Menambahkan murid yang lulus ke database alumni\n• Membuat tahun ajaran baru (belum aktif)\n• MENONAKTIFKAN semua tahun ajaran yang ada\n\n⚠️ PENTING:\n• Semua tahun ajaran akan menjadi tidak aktif\n• Tahun ajaran baru perlu diaktifkan secara manual\n• Aktifkan di menu: Kelola Akademik > Tahun Ajaran\n• PROSES INI TIDAK DAPAT DIBATALKAN!',
    async () => {
      await executeProcessKenaikanKelasAndKelulusan(
        users,
        gurus,
        murid,
        kelas,
        refreshKelas,
        jurusan,
        nilai,
        mataPelajaran,
        tahunAjaran,
        refreshTahunAjaran,
        jadwalPelajaran,
        absensi,
        sesiAbsensi,
        alumni,
        refreshAlumni,
        pengumumanKelulusan,
        updatePengumumanKelulusan,
        refreshPengumumanKelulusan,
        activeTahunAjaran,
        deleteHasGivenKenaikanKelasInfoFlag,
        refreshHasGivenKenaikanKelasInfo,
        setProcessResults,
        setIsProcessModalOpen
      );
    },
    {
      confirmText: 'Ya, Proses Sekarang',
      cancelText: 'Batal'
    }
  );
};

const executeProcessKenaikanKelasAndKelulusan = async (
  users: User[],
  _gurus: User[],
  _murid: User[],
  kelas: Kelas[],
  refreshKelas: () => Promise<void>,
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaran: TahunAjaran[],
  refreshTahunAjaran: () => Promise<void>,
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  alumni: Alumni[],
  refreshAlumni: (clearAllCaches?: boolean) => Promise<void>,
  pengumumanKelulusan: PengumumanKelulusan[],
  updatePengumumanKelulusan: (id: string, data: Partial<PengumumanKelulusan>) => Promise<any>,
  refreshPengumumanKelulusan: () => Promise<void>,
  activeTahunAjaran: TahunAjaran | undefined,
  deleteHasGivenKenaikanKelasInfoFlag: () => Promise<any>,
  refreshHasGivenKenaikanKelasInfo: () => Promise<void>,
  setProcessResults: (results: any) => void,
  setIsProcessModalOpen: (open: boolean) => void
) => {
  console.log('=== EXECUTE PROCESS KENAIKAN KELAS & KELULUSAN ===');

  // Create riwayat wali kelas for final grade teachers BEFORE processing
  const newRiwayatWaliKelas: Array<Omit<RiwayatWaliKelas, 'id'>> = [];

  // Get all final grade classes with wali kelas
  const kelas12WithWali = kelas.filter(k => isMaxTingkatSync(k.tingkat) && k.waliKelasId);
  console.log('Final grade classes with wali kelas:', kelas12WithWali.length);
  
  kelas12WithWali.forEach(kelasItem => {
    const waliKelas = users.find(u => u.id === kelasItem.waliKelasId);
    if (!waliKelas) return;
    
    // Count graduation results for this class
    const muridKelas = users.filter(u => {
      if (u.role !== 'murid') return false;
      const murid = u as any; // Type assertion for Murid
      return murid.kelasId === kelasItem.id && murid.isActive !== false;
    });
    const kelulusanKelas = muridKelas.map(murid => {
      const raportData = generateRaportData(
        murid.id,
        2,
        users,
        kelas,
        jurusan,
        nilai,
        mataPelajaran,
        [tahunAjaran.find(ta => ta.isActive)!], // Use only active tahun ajaran
        jadwalPelajaran,
        absensi,
        sesiAbsensi
      );
      const minimalSettings = getNilaiMinimalSettings();
      return {
        murid,
        isLulus: raportData ? (raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal && raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal) : false
      };
    });
    
    const jumlahMuridLulus = kelulusanKelas.filter(k => k.isLulus).length;
    const jumlahMuridTidakLulus = kelulusanKelas.filter(k => !k.isLulus).length;
    
    const riwayat: Omit<RiwayatWaliKelas, 'id'> = {
      guruId: waliKelas.id,
      kelasId: kelasItem.id,
      namaKelas: kelasItem.name,
      tahunAjaran: tahunAjaran.find(ta => ta.isActive)?.tahun || '',
      jumlahMuridLulus,
      jumlahMuridTidakLulus,
      tanggalKelulusan: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    newRiwayatWaliKelas.push(riwayat);
    console.log(`Membuat riwayat wali kelas: ${waliKelas.name} untuk kelas ${kelasItem.name}`);
  });
  
  // Save riwayat wali kelas BEFORE processing via API
  if (newRiwayatWaliKelas.length > 0) {
    try {
      await Promise.all(newRiwayatWaliKelas.map(riwayat => apiService.createRiwayatWaliKelas(riwayat)));
      console.log('Riwayat wali kelas berhasil disimpan');
    } catch (error) {
      console.error('Error saving riwayat wali kelas:', error);
    }
  }

  // Create temporary setters for executeKenaikanKelasAndKelulusan
  // These will be used to collect changes, then we'll apply them via API
  let updatedUsers: User[] = users;
  let updatedKelas: Kelas[] = kelas;
  let updatedTahunAjaran: TahunAjaran[] = tahunAjaran;
  let newAlumniRecords: Alumni[] = [];

  const tempSetUsers = (newUsers: User[]) => {
    updatedUsers = newUsers;
  };
  const tempSetKelas = (newKelas: Kelas[]) => {
    updatedKelas = newKelas;
  };
  const tempSetTahunAjaran = (newTahunAjaran: TahunAjaran[]) => {
    updatedTahunAjaran = newTahunAjaran;
  };
  const tempSetAlumni = (newAlumni: Alumni[]) => {
    newAlumniRecords = newAlumni.filter(a => !alumni.find(existing => existing.muridId === a.muridId));
  };

  const result = executeKenaikanKelasAndKelulusan(
    users,
    tempSetUsers,
    kelas,
    tempSetKelas,
    jurusan,
    nilai,
    mataPelajaran,
    tahunAjaran,
    tempSetTahunAjaran,
    jadwalPelajaran,
    absensi,
    sesiAbsensi,
    alumni,
    tempSetAlumni
  );

  console.log('=== PROSES SELESAI ===');
  console.log('Final result:', result);

  // Apply changes via API
  try {
    // STEP 1: Create new kelas FIRST (before updating students)
    // This ensures that classes like Alumni exist in the database before we try to assign students to them
    const newKelas = updatedKelas.filter(k => !kelas.find(existing => existing.id === k.id));
    const kelasNameToIdMap = new Map<string, string>(); // Map to track created classes
    
    // First, create a map of existing classes by name
    kelas.forEach(k => {
      kelasNameToIdMap.set(k.name, k.id);
    });
    
    console.log('=== MEMBUAT KELAS BARU TERLEBIH DAHULU ===');
    for (const newKelasItem of newKelas) {
      // Check if class with same name already exists (to avoid duplicate creation)
      const existingKelasByName = kelas.find(k => k.name === newKelasItem.name);
      if (existingKelasByName) {
        console.log(`Kelas ${newKelasItem.name} sudah ada dengan ID ${existingKelasByName.id}, menggunakan ID yang ada`);
        kelasNameToIdMap.set(newKelasItem.name, existingKelasByName.id);
        continue;
      }
      
      try {
        const createResponse = await apiService.createKelas({
          name: newKelasItem.name,
          tingkat: newKelasItem.tingkat,
          jurusanId: newKelasItem.jurusanId,
          waliKelasId: newKelasItem.waliKelasId
        });
        
        if (createResponse.success && createResponse.kelas) {
          // Map the in-memory ID to the actual database ID
          kelasNameToIdMap.set(newKelasItem.name, createResponse.kelas.id);
          console.log(`✓ Kelas ${newKelasItem.name} dibuat dengan ID ${createResponse.kelas.id} (in-memory ID: ${newKelasItem.id})`);
        }
      } catch (error: any) {
        // If class already exists (duplicate name), try to find it from database
        if (error.message?.includes('sudah terdaftar') || error.message?.includes('already exists') || error.message?.includes('Nama kelas sudah terdaftar')) {
          console.log(`Kelas ${newKelasItem.name} sudah ada di database, mencari ID yang ada...`);
          // Try to find it by fetching all classes
          try {
            const allKelasResponse = await apiService.getAllKelas();
            const existingKelas = allKelasResponse.kelas?.find((k: Kelas) => k.name === newKelasItem.name);
            if (existingKelas) {
              kelasNameToIdMap.set(newKelasItem.name, existingKelas.id);
              console.log(`✓ Kelas ${newKelasItem.name} ditemukan dengan ID ${existingKelas.id}`);
            } else {
              // If still not found, it might be a race condition, use the in-memory ID as fallback
              console.warn(`⚠ Kelas ${newKelasItem.name} tidak ditemukan setelah error, menggunakan in-memory ID`);
              kelasNameToIdMap.set(newKelasItem.name, newKelasItem.id);
            }
          } catch (fetchError) {
            console.error(`Error fetching kelas after creation error:`, fetchError);
            // Fallback: use in-memory ID
            kelasNameToIdMap.set(newKelasItem.name, newKelasItem.id);
          }
        } else {
          console.error(`Error creating kelas ${newKelasItem.name}:`, error);
          throw error;
        }
      }
    }
    
    // Refresh kelas list to get all classes (including newly created ones) with their actual database IDs
    await refreshKelas();
    
    // Fetch updated kelas list from API to get actual database IDs
    const allKelasFromDb = await apiService.getAllKelas();
    const dbKelasList = allKelasFromDb.kelas || [];
    
    // STEP 2: Build a mapping from in-memory kelas IDs to database kelas IDs
    // This is needed because API-generated IDs might differ from in-memory IDs
    const kelasIdMapping = new Map<string, string>();
    
    // Map by name since that's what we can reliably match
    updatedKelas.forEach(inMemoryKelas => {
      // First try to get from the map we built during creation
      let dbKelasId = kelasNameToIdMap.get(inMemoryKelas.name);
      
      // If not found, search in the database kelas list
      if (!dbKelasId) {
        const dbKelas = dbKelasList.find((k: Kelas) => k.name === inMemoryKelas.name);
        if (dbKelas) {
          dbKelasId = dbKelas.id;
        }
      }
      
      // If still not found, try to find in existing kelas by name
      if (!dbKelasId) {
        const existingKelas = kelas.find(k => k.name === inMemoryKelas.name);
        if (existingKelas) {
          dbKelasId = existingKelas.id;
        }
      }
      
      // If we found a database ID, use it; otherwise use the in-memory ID (for existing classes)
      if (dbKelasId) {
        kelasIdMapping.set(inMemoryKelas.id, dbKelasId);
        console.log(`Mapping kelas: ${inMemoryKelas.name} - in-memory ID ${inMemoryKelas.id} -> DB ID ${dbKelasId}`);
      } else {
        // Fallback: use the same ID (for existing classes that weren't created)
        kelasIdMapping.set(inMemoryKelas.id, inMemoryKelas.id);
        console.log(`Kelas ${inMemoryKelas.name} menggunakan ID yang sama: ${inMemoryKelas.id}`);
      }
    });
    
    // Helper function to get database ID from in-memory ID
    const getDbKelasId = (inMemoryId: string): string => {
      return kelasIdMapping.get(inMemoryId) || inMemoryId;
    };

    // STEP 3: Update murid (kelasId changes and isActive changes)
    // Now we use the mapped database IDs
    const muridToUpdate = updatedUsers.filter(u => u.role === 'murid');
    for (const murid of muridToUpdate) {
      const originalMurid = users.find(u => u.id === murid.id);
      if (originalMurid) {
        const muridAny = murid as any;
        const originalMuridAny = originalMurid as any;
        if (originalMuridAny.kelasId !== muridAny.kelasId || originalMuridAny.isActive !== muridAny.isActive) {
          // Use the mapped database ID
          const dbKelasId = getDbKelasId(muridAny.kelasId);
          console.log(`Memperbarui murid ${murid.name}: kelasId ${muridAny.kelasId} -> ${dbKelasId}, isActive: ${muridAny.isActive}`);
          await apiService.updateMurid(murid.id, {
            kelasId: dbKelasId,
            isActive: muridAny.isActive
          });
        }
      }
    }

    // STEP 4: Update guru (kelasWali and isWaliKelas changes)
    // Also use mapped database IDs for kelasWali
    const gurusToUpdate = updatedUsers.filter(u => u.role === 'guru');
    for (const guru of gurusToUpdate) {
      const originalGuru = users.find(u => u.id === guru.id);
      if (originalGuru) {
        const guruAny = guru as any;
        const originalGuruAny = originalGuru as any;
        if (originalGuruAny.kelasWali !== guruAny.kelasWali || originalGuruAny.isWaliKelas !== guruAny.isWaliKelas) {
          // Use the mapped database ID for kelasWali if it exists
          const dbKelasWaliId = guruAny.kelasWali ? getDbKelasId(guruAny.kelasWali) : undefined;
          await apiService.updateGuru(guru.id, {
            kelasWali: dbKelasWaliId,
            isWaliKelas: guruAny.isWaliKelas
          });
        }
      }
    }

    // Update kelas (waliKelasId changes)
    // Use the mapped database IDs
    for (const kelasItem of updatedKelas) {
      const originalKelas = kelas.find(k => k.id === kelasItem.id);
      if (originalKelas && originalKelas.waliKelasId !== kelasItem.waliKelasId) {
        const dbKelasId = getDbKelasId(kelasItem.id);
        await apiService.updateKelas(dbKelasId, {
          waliKelasId: kelasItem.waliKelasId
        });
      }
    }

    // Deactivate all tahun ajaran and create new one
    for (const ta of tahunAjaran) {
      if (ta.isActive) {
        await apiService.updateTahunAjaran(ta.id, { isActive: false });
      }
    }

    // Create new tahun ajaran
    const newTahunAjaran = updatedTahunAjaran.find(ta => !tahunAjaran.find(existing => existing.id === ta.id));
    if (newTahunAjaran) {
      // Pastikan tanggalMulai dan tanggalSelesai adalah string kosong jika tidak ada
      await apiService.createTahunAjaran({
        tahun: newTahunAjaran.tahun,
        semester: newTahunAjaran.semester,
        isActive: newTahunAjaran.isActive || false,
        tanggalMulai: newTahunAjaran.tanggalMulai || '',
        tanggalSelesai: newTahunAjaran.tanggalSelesai || '',
        isAutoCreated: newTahunAjaran.isAutoCreated !== undefined ? newTahunAjaran.isAutoCreated : true
      });
    }

    // Create alumni records
    const jenjang = getActiveJenjangSync();
    if (!jenjang) {
      throw new Error('Jenjang pendidikan belum dikonfigurasi');
    }

    for (const alumniRecord of newAlumniRecords) {
      await apiService.createAlumni({
        muridId: alumniRecord.muridId,
        nama: alumniRecord.nama,
        nisn: alumniRecord.nisn,
        kelasId: alumniRecord.kelasId,
        namaKelas: alumniRecord.namaKelas,
        jurusanId: alumniRecord.jurusanId,
        namaJurusan: alumniRecord.namaJurusan,
        tahunLulus: alumniRecord.tahunLulus,
        jenjang: jenjang,
        nilaiAkhir: alumniRecord.nilaiAkhir,
        tingkatKehadiran: alumniRecord.tingkatKehadiran,
        peringkatKelas: alumniRecord.peringkatKelas,
        peringkatSekolah: alumniRecord.peringkatSekolah,
        tanggalLulus: alumniRecord.tanggalLulus,
        waliKelasSebelumnya: alumniRecord.waliKelasSebelumnya,
        namaWaliKelasSebelumnya: alumniRecord.namaWaliKelasSebelumnya,
        nipWaliKelasSebelumnya: alumniRecord.nipWaliKelasSebelumnya
      });
    }

    // STEP 2: Clear all caches after process is complete
    console.log('=== MENGHAPUS SEMUA CACHE ===');
    clearAllCaches();
    console.log('Semua cache berhasil dihapus');

    // STEP 3: Refresh all data to reload from database
    console.log('=== REFRESH SEMUA DATA ===');
    await refreshKelas();
    await refreshTahunAjaran();
    await refreshAlumni(true);

    // Mark pengumuman as processed and update snapshot
    const activePengumuman = pengumumanKelulusan.find((p: PengumumanKelulusan) => p.isPublished);

    if (activePengumuman) {
      // If snapshot doesn't exist, create it now (for backward compatibility)
      let snapshotMuridIds = activePengumuman.snapshotMuridIds;
      if (!snapshotMuridIds) {
        snapshotMuridIds = users
          .filter((u: User) => {
            if (u.role !== 'murid') return false;
            const murid = u as any; // Type assertion for Murid
            const muridKelas = kelas.find((k: any) => k.id === murid.kelasId);
            return !!(muridKelas && isMaxTingkatSync(muridKelas.tingkat) && murid.isActive !== false);
          })
          .map((u: User) => u.id);

        console.log('Creating snapshot for existing pengumuman:', snapshotMuridIds.length, 'murid');
      }

      await updatePengumumanKelulusan(activePengumuman.id, {
        isProcessed: true,
        snapshotMuridIds
      });
      await refreshPengumumanKelulusan();
      console.log('Pengumuman kelulusan ditandai sebagai sudah diproses');

      // Clear the flag for this academic year so next year can do the same process
      if (activeTahunAjaran) {
        await deleteHasGivenKenaikanKelasInfoFlag();
        await refreshHasGivenKenaikanKelasInfo();
      }
    }

    console.log('=== PROSES SELESAI - SEMUA DATA TELAH DIREFRESH ===');
    setProcessResults(result);
    setIsProcessModalOpen(true);
  } catch (error) {
    console.error('Error applying changes via API:', error);
    setProcessResults({
      success: false,
      kenaikanResults: [],
      kelulusanResults: [],
      newAlumniCount: 0,
      message: 'Terjadi kesalahan saat menyimpan perubahan ke database. Silakan coba lagi.'
    });
    setIsProcessModalOpen(true);
  }
};