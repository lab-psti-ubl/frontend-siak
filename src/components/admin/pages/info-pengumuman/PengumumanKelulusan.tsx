import React, { useState, useMemo } from 'react';
import { GraduationCap, ArrowUp, Calendar, School, Check, ChevronRight } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import { useAuth } from '../../../../context/AuthContext';
import { 
  User,
  InfoSekolah
} from '../../../../types';
import PengumumanStatusCard from './components/PengumumanStatusCard';
import KelulusanStatsCards from './components/KelulusanStatsCards';
import MuridTerbaikSection from './components/MuridTerbaikSection';
import DataKelulusanTable from './components/DataKelulusanTable';
import ProcessResultModal from './components/ProcessResultModal';
import KelulusanDetailModal from './components/KelulusanDetailModal';
import {
  createPengumumanKelulusan,
  processKenaikanKelasAndKelulusanAction
} from './utils/pengumumanUtils';
import { getKelulusanData } from './utils/kelulusanDataUtils';
import { exportToExcel } from '../../../../utils/exportUtils';
import { showSuccessNotification } from '../../../../utils/notificationUtils';
import { getNilaiMinimalSettings } from '../../../../utils/nilaiUtils';
import { isMaxTingkatSync, getGraduationKelasTextSync } from '../../../../utils/jenjangPendidikanUtils';
import { apiService } from '../../../../services/apiService';
// Hooks dengan cache untuk mengambil data dari database
import { usePengumumanKelulusan } from '../../../../hooks/usePengumumanKelulusan';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useAlumni } from '../../../../hooks/useAlumni';
import { useNilai } from '../../../../hooks/useNilai';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useStatusKenaikanKelas } from '../../../../hooks/useStatusKenaikanKelas';
import { useHasGivenKenaikanKelasInfo } from '../../../../hooks/useHasGivenKenaikanKelasInfo';
import { usePengaturanNilaiMinimal } from '../../../../hooks/usePengaturanNilaiMinimal';
import { useInfoSekolah } from '../../../../hooks/useInfoSekolah';

const PengumumanKelulusanComponent: React.FC = () => {
  const { user } = useAuth();
  
  // Use hooks dengan cache untuk mengambil data dari database
  const { pengumumanKelulusan, refreshPengumumanKelulusan, updatePengumumanKelulusan } = usePengumumanKelulusan();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas, refreshKelas } = useKelas();
  const { alumni, refreshAlumni } = useAlumni();
  const { nilai } = useNilai();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran, activeTahunAjaran, refreshTahunAjaran } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { jurusan } = useJurusan();
  const { statusKenaikanKelas, createStatusKenaikanKelas, updateStatusKenaikanKelas, refreshStatusKenaikanKelas } = useStatusKenaikanKelas();
  const { createInfoSekolah } = useInfoSekolah();
  usePengaturanNilaiMinimal(); // Load nilai minimal settings from database to update cache
  
  // Combine gurus and murid into users array for compatibility
  const users: User[] = useMemo(() => [...gurus, ...murid] as User[], [gurus, murid]);
  
  // Hook untuk flag hasGivenKenaikanKelasInfo
  const { hasGiven: hasGivenKenaikanKelasInfo, setFlag: setHasGivenKenaikanKelasInfoFlag, refreshFlag: refreshHasGivenKenaikanKelasInfo } = useHasGivenKenaikanKelasInfo(
    activeTahunAjaran?.tahun,
    activeTahunAjaran?.semester
  );

  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<1 | 2 | 3 | null>(null);
  const [processResults, setProcessResults] = useState<{
    success: boolean,
    kenaikanResults: any[],
    kelulusanResults: any[],
    newAlumniCount: number,
    message: string
  }>({
    success: false,
    kenaikanResults: [],
    kelulusanResults: [],
    newAlumniCount: 0,
    message: ''
  });

  // Check if current semester is genap (2)
  if (activeTahunAjaran?.semester !== 2) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Pengumuman Kelulusan</h2>
            <p className="text-gray-600">Kelola pengumuman kelulusan Murid</p>
          </div>
          {activeTahunAjaran && (
            <Badge variant="info">
              {activeTahunAjaran.tahun} - Semester {activeTahunAjaran.semester}
            </Badge>
          )}
        </div>

        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Kelulusan di Semester Ganjil</h3>
          <p className="text-gray-600">
            Pengumuman kelulusan hanya tersedia pada semester genap (semester 2). 
            Saat ini adalah semester {activeTahunAjaran?.semester || 1} tahun ajaran {activeTahunAjaran?.tahun || ''}.
          </p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Informasi:</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Pengumuman kelulusan hanya dibuat pada semester genap</li>
              <li>• Kelulusan ditentukan berdasarkan nilai semester 1 dan 2</li>
              <li>• Menu ini akan aktif saat semester genap tahun ajaran ini</li>
            </ul>
          </div>
        </Card>
      </div>
    );
  }

  const activePengumuman = pengumumanKelulusan.find(p =>
    p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun
  );

  // Debug log untuk troubleshooting
  console.log('🔍 Debug State:', {
    hasGivenKenaikanKelasInfo,
    activePengumuman: activePengumuman?.id,
    isProcessed: activePengumuman?.isProcessed,
    tahunAjaran: activeTahunAjaran?.tahun,
    semester: activeTahunAjaran?.semester
  });

  // Determine which murid to display based on pengumuman status
  let muridKelas12: User[];

  if (activePengumuman?.snapshotMuridIds && activePengumuman.snapshotMuridIds.length > 0) {
    // Use snapshot if available - this shows the original murid from time of announcement
    muridKelas12 = users.filter(u => activePengumuman.snapshotMuridIds!.includes(u.id));
    console.log('Using snapshot data:', muridKelas12.length, 'murid from pengumuman snapshot');
  } else {
    // Fall back to current final grade murid (for backward compatibility)
    muridKelas12 = users.filter((u) => {
      if (u.role !== 'murid') return false;
      const murid = u as any; // Type assertion for Murid
      const muridKelas = kelas.find(k => k.id === murid.kelasId);
      return !!(muridKelas && isMaxTingkatSync(muridKelas.tingkat) && murid.isActive !== false);
    });
    console.log('Using current final grade data:', muridKelas12.length, 'murid');
  }
  const kelulusanData = getKelulusanData(
    muridKelas12,
    users,
    kelas,
    jurusan,
    nilai,
    mataPelajaran,
    tahunAjaran,
    jadwalPelajaran,
    absensi,
    sesiAbsensi,
    activePengumuman // Pass pengumuman to use correct tahun ajaran
  );

  const muridLulus = kelulusanData.filter(d => d.isLulus);
  const muridTidakLulus = kelulusanData.filter(d => !d.isLulus);
  const muridTerbaik = kelulusanData.slice(0, 3);

  const handleCreatePengumuman = async () => {
    await createPengumumanKelulusan(
      activePengumuman,
      activeTahunAjaran,
      user,
      pengumumanKelulusan,
      refreshPengumumanKelulusan,
      users,
      kelas,
      statusKenaikanKelas, // Passed but not used in createPengumumanKelulusan
      createStatusKenaikanKelas, // Passed but not used in createPengumumanKelulusan
      refreshStatusKenaikanKelas, // Passed but not used in createPengumumanKelulusan
      setHasGivenKenaikanKelasInfoFlag, // Passed but not used in createPengumumanKelulusan
      refreshHasGivenKenaikanKelasInfo, // Pass refresh function to ensure flag is refreshed
      createInfoSekolah // Pass createInfoSekolah to save data to InfoSekolah
    );
  };

  // Function available for future use if needed
  // const handleDeactivatePengumuman = async () => {
  //   await deactivatePengumumanKelulusan(
  //     activePengumuman,
  //     updatePengumumanKelulusan,
  //     refreshPengumumanKelulusan
  //   );
  // };

  const handleBeriInfoKenaikanKelas = async () => {
    if (!activeTahunAjaran) return;

    const kelasTarget = kelas; // All classes
    
    // Check if status already exists for this tahunAjaran + semester
    const existingStatus = statusKenaikanKelas.find(s =>
      s.tahunAjaran === activeTahunAjaran.tahun &&
      s.semester === activeTahunAjaran.semester
    );

    // Get all kelas IDs that should be included
    const allKelasIds = kelasTarget.map(k => k.id);
    
    // If status exists, merge with existing kelasIds (avoid duplicates)
    // Otherwise, create new status with all kelasIds
    const kelasIdsToSave = existingStatus 
      ? [...new Set([...existingStatus.kelasIds, ...allKelasIds])]
      : allKelasIds;

    try {
      if (existingStatus) {
        // Update existing status
        await updateStatusKenaikanKelas(existingStatus.id, {
          kelasIds: kelasIdsToSave,
          isPublished: false
        });
      } else {
        // Create new status with all kelasIds in one document
        await createStatusKenaikanKelas({
          kelasIds: kelasIdsToSave,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester || 2,
          isPublished: false,
          publishedBy: undefined,
          publishedAt: undefined,
          createdAt: new Date().toISOString(),
        });
      }
      await refreshStatusKenaikanKelas();
    } catch (error) {
      console.error('Error creating/updating status kenaikan kelas:', error);
      return;
    }

    // Set flag hasGivenKenaikanKelasInfo
    try {
      await setHasGivenKenaikanKelasInfoFlag(true);
      await refreshHasGivenKenaikanKelasInfo();
    } catch (error) {
      console.error('Error setting flag:', error);
    }

    // Create InfoSekolah with jenis 'kenaikan_kelas'
    try {
      const newInfo: Omit<InfoSekolah, 'id'> = {
        judul: `Pengumuman Kenaikan Kelas Tahun Ajaran ${activeTahunAjaran.tahun}`,
        konten: `Raport semester ${activeTahunAjaran.semester} tahun ajaran ${activeTahunAjaran.tahun} telah dibagikan ke semua wali kelas. Wali kelas dapat menyebarkan raport kepada murid.`,
        jenis: 'kenaikan_kelas',
        target: 'murid',
        kelasId: undefined,
        isActive: true,
        createdBy: user?.id || '',
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      };
      await createInfoSekolah(newInfo);
    } catch (error) {
      console.error('Error creating InfoSekolah for kenaikan kelas:', error);
      // Don't return, continue with success notification
    }

    showSuccessNotification(
      'Info Kenaikan Kelas Berhasil Diberikan',
      `Raport semester ${activeTahunAjaran.semester} tahun ajaran ${activeTahunAjaran.tahun} telah dibagikan ke semua wali kelas. Wali kelas dapat menyebarkan raport kepada murid.`
    );
  };

  const handleProcessKenaikanKelasAndKelulusan = async () => {
    await processKenaikanKelasAndKelulusanAction(
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
      async () => {
        if (activeTahunAjaran) {
          await apiService.deleteHasGivenKenaikanKelasInfo(activeTahunAjaran.tahun, activeTahunAjaran.semester);
        }
      },
      refreshHasGivenKenaikanKelasInfo,
      setProcessResults,
      setIsProcessModalOpen
    );
  };

  const handleViewDetail = (murid: User) => {
    setSelectedMurid(murid);
    setIsDetailModalOpen(true);
  };

  // Status alur untuk stepper: mengikuti data aktual (dari Beri Info atau dari tombol di halaman ini)
  // Step 1: selesai jika pengumuman kelulusan ada (dibuat di Beri Info jenis kelulusan ATAU tombol "Buat Pengumuman Kelulusan")
  const step1Done = !!activePengumuman;
  // Step 2: selesai jika info kenaikan kelas sudah diberi (dari Beri Info jenis kenaikan_kelas ATAU tombol "Beri Info Kenaikan Kelas")
  const step2Done = hasGivenKenaikanKelasInfo || !!statusKenaikanKelas.find(
    s => s.tahunAjaran === activeTahunAjaran?.tahun && s.semester === activeTahunAjaran?.semester
  );
  // Step 3: selesai jika proses kenaikan & kelulusan sudah dijalankan (hanya dari tombol di halaman ini)
  const step3Done = !!activePengumuman?.isProcessed;

  const handleExportKelulusanData = () => {
    const minimalSettings = getNilaiMinimalSettings();
    const data = kelulusanData.map((item, index) => {
      const murid = item.murid as any; // Type assertion for Murid
      return {
        peringkat: index + 1,
        nisn: murid.nisn || '',
        nama: item.murid.name,
        kelas: item.kelas?.name || 'Unknown',
        rataRataNilai: item.nilaiAkhir.toFixed(1),
        tingkatKehadiran: `${item.kehadiran.toFixed(1)}%`,
        statusKelulusan: item.isLulus ? 'LULUS' : 'TIDAK LULUS',
        keterangan: item.isLulus ?
          'Memenuhi syarat kelulusan' :
          `${item.nilaiAkhir < minimalSettings.nilaiAkhirMinimal ? 'Nilai kurang' : ''}${item.nilaiAkhir < minimalSettings.nilaiAkhirMinimal && item.kehadiran < minimalSettings.tingkatKehadiranMinimal ? ' & ' : ''}${item.kehadiran < minimalSettings.tingkatKehadiranMinimal ? 'Kehadiran kurang' : ''}`
      };
    });

    const columns = [
      { header: 'Peringkat', dataKey: 'peringkat', width: 10 },
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Nama', dataKey: 'nama', width: 25 },
      { header: 'Kelas', dataKey: 'kelas', width: 15 },
      { header: 'Rata-rata Nilai', dataKey: 'rataRataNilai', width: 15 },
      { header: 'Tingkat Kehadiran', dataKey: 'tingkatKehadiran', width: 18 },
      { header: 'Status Kelulusan', dataKey: 'statusKelulusan', width: 15 },
      { header: 'Keterangan', dataKey: 'keterangan', width: 25 }
    ];

    const title = `PENGUMUMAN KELULUSAN\nTahun Ajaran: ${activeTahunAjaran?.tahun}`;
    const filename = `pengumuman-kelulusan-${activeTahunAjaran?.tahun}-${new Date().toISOString().split('T')[0]}`;
    
    exportToExcel(data, columns, title, filename);
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Alur proses: stepper di atas header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-3 py-4 sm:px-6 sm:py-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Alur Proses</p>
          <p className="text-xs text-gray-500 mb-4">Langkah 1 dan 2 dapat diselesaikan dari menu <strong>Beri Info</strong> atau tombol di halaman ini. Status mengikuti data yang ada.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setSelectedStep(selectedStep === 1 ? null : 1)}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedStep === 1 ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : 'hover:bg-gray-50'
              } ${step1Done ? 'text-green-700' : 'text-gray-600'}`}
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step1Done ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {step1Done ? <Check size={18} /> : '1'}
              </span>
              <span className="font-medium text-sm sm:text-base">Pengumuman kelulusan</span>
              {selectedStep === 1 && (
                <span className="text-xs sm:text-sm ml-auto text-gray-500">
                  {step1Done ? 'Selesai' : 'Belum selesai'}
                </span>
              )}
            </button>
            <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-300 hidden sm:block mx-1" />
            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setSelectedStep(selectedStep === 2 ? null : 2)}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedStep === 2 ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : 'hover:bg-gray-50'
              } ${step2Done ? 'text-green-700' : 'text-gray-600'}`}
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step2Done ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {step2Done ? <Check size={18} /> : '2'}
              </span>
              <span className="font-medium text-sm sm:text-base">Pengumuman kenaikan kelas</span>
              {selectedStep === 2 && (
                <span className="text-xs sm:text-sm ml-auto text-gray-500">
                  {step2Done ? 'Selesai' : 'Belum selesai'}
                </span>
              )}
            </button>
            <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-300 hidden sm:block mx-1" />
            {/* Step 3 */}
            <button
              type="button"
              onClick={() => setSelectedStep(selectedStep === 3 ? null : 3)}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedStep === 3 ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : 'hover:bg-gray-50'
              } ${step3Done ? 'text-green-700' : 'text-gray-600'}`}
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step3Done ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {step3Done ? <Check size={18} /> : '3'}
              </span>
              <span className="font-medium text-sm sm:text-base">Proses kelulusan dan kenaikan kelas</span>
              {selectedStep === 3 && (
                <span className="text-xs sm:text-sm ml-auto text-gray-500">
                  {step3Done ? 'Selesai' : 'Belum selesai'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-cyan-100  rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
  <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

    {/* Desktop = row, Mobile = column */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

      {/* LEFT TITLE */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">
          Pengumuman Kelulusan {activeTahunAjaran?.tahun || ''}
        </h1>
        <p className="text-sm text-black">
          Kelola dan pantau status kelulusan murid {getGraduationKelasTextSync()}
        </p>
      </div>

      {/* RIGHT SIDE: BUTTON + TAHUN AJARAN */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">

        {/* BUTTONS */}
        <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-center sm:justify-end">

          {!activePengumuman && (
            <Button
              onClick={handleCreatePengumuman}
              className="flex items-center px-4 py-2.5 text-sm sm:text-base w-full sm:w-auto justify-center shadow-lg"
            >
              <GraduationCap size={16} className="mr-2" />
              Buat Pengumuman Kelulusan
            </Button>
          )}

          {activePengumuman && !activePengumuman.isProcessed && (
            <>
              {/* Hide "Beri Info Kenaikan Kelas" button if StatusKenaikanKelas already exists for this tahun ajaran and semester (created through BeriInfo) */}
              {!hasGivenKenaikanKelasInfo && !statusKenaikanKelas.find(s => 
                s.tahunAjaran === activeTahunAjaran?.tahun && 
                s.semester === activeTahunAjaran?.semester
              ) && (
                <Button
                  onClick={handleBeriInfoKenaikanKelas}
                  variant="success"
                  className="flex items-center px-4 py-2.5 text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <School size={16} className="mr-2" />
                  Beri Info Kenaikan Kelas
                </Button>
              )}
              {/* Show "Proses" button if hasGivenKenaikanKelasInfo is true OR StatusKenaikanKelas exists for this tahun ajaran and semester */}
              {(hasGivenKenaikanKelasInfo || statusKenaikanKelas.find(s => 
                s.tahunAjaran === activeTahunAjaran?.tahun && 
                s.semester === activeTahunAjaran?.semester
              )) && (
                <Button
                  onClick={handleProcessKenaikanKelasAndKelulusan}
                  variant="danger"
                  className="flex items-center px-4 py-2.5 text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <ArrowUp size={16} className="mr-2" />
                  Proses Kenaikan Kelas & Kelulusan
                </Button>
              )}
            </>
          )}
        </div>

      
      </div>
    </div>
  </div>
</div>

      

      <PengumumanStatusCard 
        activePengumuman={activePengumuman}
      />

      <KelulusanStatsCards 
        muridKelas12={muridKelas12}
        muridLulus={muridLulus}
        muridTidakLulus={muridTidakLulus}
      />

      <MuridTerbaikSection 
        muridTerbaik={muridTerbaik}
      />

      <DataKelulusanTable 
        kelulusanData={kelulusanData}
        onViewDetail={handleViewDetail}
        onExportData={handleExportKelulusanData}
      />

      <KelulusanDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMurid(null);
        }}
        selectedMurid={selectedMurid}
        kelulusanData={kelulusanData}
      />

      <ProcessResultModal
        isOpen={isProcessModalOpen}
        onClose={() => {
          setIsProcessModalOpen(false);
          setProcessResults({
            success: false,
            kenaikanResults: [],
            kelulusanResults: [],
            newAlumniCount: 0,
            message: ''
          });
        }}
        processResults={processResults}
      />
    </div>
  );
};

export default PengumumanKelulusanComponent;