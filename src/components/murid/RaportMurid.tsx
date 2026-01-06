import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TahunAjaran } from '../../types';
import { useGurus } from '../../hooks/useGurus';
import { useMurid } from '../../hooks/useMurid';
import { useKelas } from '../../hooks/useKelas';
import { useNilai } from '../../hooks/useNilai';
import { useMataPelajaran } from '../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useAbsensi } from '../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../hooks/useSesiAbsensi';
import { useJurusan } from '../../hooks/useJurusan';
import { useStatusKenaikanKelas } from '../../hooks/useStatusKenaikanKelas';
import { useStatusBagiRaport } from '../../hooks/useStatusBagiRaport';
import { useRiwayatKelasMurid } from '../../hooks/useRiwayatKelasMurid';
import { useKomponenNilai } from '../../hooks/useKomponenNilai';
import { usePengaturanNilaiMinimal } from '../../hooks/usePengaturanNilaiMinimal';
import { setKomponenNilaiCache, setNilaiMinimalCache } from '../../utils/nilaiUtils';
import { 
  generateRaportData, 
  printRaport,
  downloadRaportPDF,
  exportRaportData,
  RaportData 
} from '../../utils/raport';
import RaportMuridHeader from './pages/raport/RaportMuridHeader';
import RaportMuridInfoCard from './pages/raport/RaportMuridInfoCard';
import RaportMuridStatusCard from './pages/raport/RaportMuridStatusCard';
import RaportMuridBestStudents from './pages/raport/RaportMuridBestStudents';
import RaportMuridContent from './pages/raport/RaportMuridContent';
import RaportMuridStats from './pages/raport/RaportMuridStats';
import RaportMuridAnalysis from './pages/raport/RaportMuridAnalysis';
import { getKelasForTahunAjaran, generateMuridTerbaikData } from './pages/raport/RaportMuridUtils';

const RaportMurid: React.FC = () => {
  const { user } = useAuth();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { nilai } = useNilai();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran, activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { jurusan } = useJurusan();
  const { statusKenaikanKelas } = useStatusKenaikanKelas();
  const { statusBagiRaport } = useStatusBagiRaport();
  const { riwayatKelasMurid } = useRiwayatKelasMurid();
  const { komponenNilai } = useKomponenNilai();
  const { pengaturanNilaiMinimal } = usePengaturanNilaiMinimal();
  
  // Set cache for komponen nilai and nilai minimal before generating raport data
  useEffect(() => {
    if (komponenNilai && komponenNilai.length > 0) {
      setKomponenNilaiCache(komponenNilai);
    }
  }, [komponenNilai]);

  useEffect(() => {
    if (pengaturanNilaiMinimal) {
      setNilaiMinimalCache({
        nilaiAkhirMinimal: pengaturanNilaiMinimal.nilaiAkhirMinimal,
        tingkatKehadiranMinimal: pengaturanNilaiMinimal.tingkatKehadiranMinimal,
      });
    }
  }, [pengaturanNilaiMinimal]);
  
  // Combine gurus and murid into users array for compatibility
  const users = useMemo(() => {
    return [...gurus, ...murid];
  }, [gurus, murid]);
  
  const [selectedSemester, setSelectedSemester] = useState<number>(() => {
    return activeTahunAjaranFromHook?.semester || 1;
  });
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(() => {
    return activeTahunAjaranFromHook?.tahun || '';
  });
  
  // Update selected semester and tahun ajaran when activeTahunAjaran changes
  useEffect(() => {
    if (activeTahunAjaranFromHook) {
      setSelectedTahunAjaran(activeTahunAjaranFromHook.tahun);
      setSelectedSemester(activeTahunAjaranFromHook.semester);
    }
  }, [activeTahunAjaranFromHook]);

  // Get available semesters for selected tahun ajaran
  // Menggunakan data dari nilai, jadwal, dan tahunAjaran untuk mendapatkan semester yang benar-benar ada data
  const getAvailableSemesters = (tahunAjaranValue: string) => {
    const semestersFromTahunAjaran = tahunAjaran
      .filter(ta => ta.tahun === tahunAjaranValue)
      .map(ta => ta.semester);

    // Ambil semester dari data nilai untuk murid
    const semestersFromNilai = new Set<number>();
    if (user?.id) {
      nilai
        .filter(n => n.tahunAjaran === tahunAjaranValue && n.muridId === user.id)
        .forEach(n => semestersFromNilai.add(n.semester));
    }

    // Ambil semester dari jadwal pelajaran untuk kelas murid
    const semestersFromJadwal = new Set<number>();
    if (targetKelas && user?.id) {
      jadwalPelajaran
        .filter(j => j.tahunAjaran === tahunAjaranValue && j.kelasId === targetKelas.id)
        .forEach(j => semestersFromJadwal.add(j.semester));
    }

    // Gabungkan semua semester yang ditemukan
    const allSemesters = new Set([
      ...semestersFromTahunAjaran,
      ...Array.from(semestersFromNilai),
      ...Array.from(semestersFromJadwal)
    ]);

    // Konversi ke array TahunAjaran untuk kompatibilitas dengan komponen
    return Array.from(allSemesters)
      .sort((a, b) => a - b)
      .map(sem => ({
        id: `sem-${sem}`,
        tahun: tahunAjaranValue,
        semester: sem,
        isActive: false,
        tanggalMulai: '',
        tanggalSelesai: ''
      }));
  };

  const activeTahunAjaran = activeTahunAjaranFromHook;
  const selectedTahunAjaranData = tahunAjaran.find(ta => ta.tahun === selectedTahunAjaran);

  const targetKelas = user && (user as any)?.kelasId ? getKelasForTahunAjaran(
    (user as any).kelasId,
    selectedTahunAjaran,
    activeTahunAjaran || undefined,
    kelas,
    user.id,
    riwayatKelasMurid,
    nilai
  ) : null;

  // Get available tahun ajaran from riwayat kelas murid and tahun ajaran data
  const availableTahunAjaran = useMemo(() => {
    // Get all tahun ajaran IDs from riwayat kelas murid
    const tahunAjaranIdsFromRiwayat = riwayatKelasMurid
      .filter(r => r.muridId === user?.id)
      .map(r => r.tahunAjaran);

    // Get tahun ajaran strings from tahun ajaran data
    const tahunAjaranFromRiwayat = tahunAjaran
      .filter(ta => tahunAjaranIdsFromRiwayat.includes(ta.id))
      .map(ta => ta.tahun);

    // Combine with active tahun ajaran
    const allTahunAjaran = [...new Set(tahunAjaranFromRiwayat)];
    
    // Always include active tahun ajaran if it exists
    if (activeTahunAjaran && !allTahunAjaran.includes(activeTahunAjaran.tahun)) {
      allTahunAjaran.push(activeTahunAjaran.tahun);
    }

    // If no tahun ajaran found from riwayat, use all available tahun ajaran from database
    if (allTahunAjaran.length === 0 && tahunAjaran.length > 0) {
      return Array.from(
        new Map(tahunAjaran.map(ta => [ta.tahun, ta])).values()
      ).sort((a, b) => {
        const yearA = parseInt(a.tahun.split('/')[0]);
        const yearB = parseInt(b.tahun.split('/')[0]);
        return yearB - yearA;
      });
    }

    // Return tahun ajaran objects sorted by year
    return allTahunAjaran
      .map(tahun => tahunAjaran.find(ta => ta.tahun === tahun))
      .filter((ta): ta is TahunAjaran => ta !== undefined)
      .sort((a, b) => {
        const yearA = parseInt(a.tahun.split('/')[0]);
        const yearB = parseInt(b.tahun.split('/')[0]);
        return yearB - yearA;
      });
  }, [riwayatKelasMurid, user?.id, tahunAjaran, activeTahunAjaran]);

  const availableSemesters = useMemo(() => getAvailableSemesters(selectedTahunAjaran), 
    [selectedTahunAjaran, targetKelas, nilai, jadwalPelajaran, user?.id]);

  // Update selectedTahunAjaran if it's not in available list
  useEffect(() => {
    if (availableTahunAjaran.length > 0 && !availableTahunAjaran.some(ta => ta.tahun === selectedTahunAjaran)) {
      setSelectedTahunAjaran(availableTahunAjaran[0].tahun);
    }
  }, [availableTahunAjaran, selectedTahunAjaran]);

  // Update semester yang dipilih jika tidak ada di available semesters atau tahun ajaran berubah
  useEffect(() => {
    if (availableSemesters.length > 0) {
      const semesterExists = availableSemesters.some(s => s.semester === selectedSemester);
      if (!semesterExists) {
        // Set ke semester pertama yang tersedia
        setSelectedSemester(availableSemesters[0].semester);
      }
    }
  }, [availableSemesters, selectedTahunAjaran]);

  // Check if raport can be accessed for the selected period
  const statusKenaikan = targetKelas ? statusKenaikanKelas.find(s =>
    s.kelasIds.includes(targetKelas.id) &&
    s.tahunAjaran === selectedTahunAjaran &&
    s.semester === selectedSemester &&
    s.isPublished
  ) : null;

  const statusBagiRaportData = targetKelas ? statusBagiRaport.find(s =>
    s.kelasId === targetKelas.id &&
    s.tahunAjaran === selectedTahunAjaran &&
    s.semester === selectedSemester &&
    s.isPublished
  ) : null;

  // Always allow access to raport menu, but show different content based on publication status
  const isRaportPublished = selectedSemester === 2 ? !!statusKenaikan : !!statusBagiRaportData;

  // Generate murid terbaik data
  const muridTerbaikData = useMemo(() => generateMuridTerbaikData(
    users,
    targetKelas,
    selectedSemester,
    selectedTahunAjaran,
    users,
    kelas,
    jurusan,
    nilai,
    mataPelajaran,
    tahunAjaran,
    jadwalPelajaran,
    absensi,
    sesiAbsensi,
    activeTahunAjaran || undefined
  ), [
    users,
    targetKelas,
    selectedSemester,
    selectedTahunAjaran,
    kelas,
    jurusan,
    nilai,
    mataPelajaran,
    tahunAjaran,
    jadwalPelajaran,
    absensi,
    sesiAbsensi,
    activeTahunAjaran
  ]);

  // Generate raport data using the utility function
  // Only generate if cache is set (komponen nilai and nilai minimal are loaded)
  const raportData: RaportData | null = useMemo(() => {
    if (!user || !isRaportPublished || !targetKelas) return null;
    // Ensure cache is set before generating
    if (komponenNilai && komponenNilai.length > 0 && pengaturanNilaiMinimal) {
      return generateRaportData(
        user.id,
        selectedSemester,
        users,
        kelas,
        jurusan,
        nilai,
        mataPelajaran,
        tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran),
        jadwalPelajaran,
        absensi,
        sesiAbsensi,
        statusBagiRaport
      );
    }
    return null;
  }, [
    user,
    isRaportPublished,
    targetKelas,
    selectedSemester,
    users,
    kelas,
    jurusan,
    nilai,
    mataPelajaran,
    selectedTahunAjaran,
    tahunAjaran,
    jadwalPelajaran,
    absensi,
    sesiAbsensi,
    statusBagiRaport,
    komponenNilai,
    pengaturanNilaiMinimal
  ]);

  const handlePrintRaport = async () => {
    if (raportData) {
      await printRaport(raportData);
    }
  };

  const handleDownloadRaportPDF = async () => {
    if (raportData) {
      await downloadRaportPDF(raportData);
    }
  };

  const handleExportRaportData = () => {
    if (raportData) {
      exportRaportData(raportData);
    }
  };

  const handleResetToActive = () => {
    setSelectedTahunAjaran(activeTahunAjaranFromHook?.tahun || '');
    setSelectedSemester(activeTahunAjaranFromHook?.semester || 1);
  };

  if (!targetKelas) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <RaportMuridHeader
          targetKelas={targetKelas}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          availableTahunAjaran={availableTahunAjaran}
          availableSemesters={availableSemesters}
          activeTahunAjaran={activeTahunAjaran || undefined}
          selectedTahunAjaranData={selectedTahunAjaranData}
          onTahunAjaranChange={setSelectedTahunAjaran}
          onSemesterChange={setSelectedSemester}
          onResetToActive={handleResetToActive}
        />

        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Kelas Tidak Ditemukan</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}.
              Kemungkinan Anda belum masuk sekolah atau sudah lulus pada periode tersebut.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isRaportPublished) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <RaportMuridHeader
          targetKelas={targetKelas}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          availableTahunAjaran={availableTahunAjaran}
          availableSemesters={availableSemesters}
          activeTahunAjaran={activeTahunAjaran || undefined}
          selectedTahunAjaranData={selectedTahunAjaranData}
          onTahunAjaranChange={setSelectedTahunAjaran}
          onSemesterChange={setSelectedSemester}
          onResetToActive={handleResetToActive}
        />

        <RaportMuridInfoCard
          targetKelas={targetKelas}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          activeTahunAjaran={activeTahunAjaran || undefined}
          onResetToActive={handleResetToActive}
        />

        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              Laporan Hasil Belajar Belum Dipublikasikan
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
              Laporan Hasil Belajar semester {selectedSemester} tahun ajaran {selectedTahunAjaran} untuk kelas {targetKelas?.name} belum dipublikasikan oleh wali kelas.
              {selectedSemester === 2 ?
                (targetKelas?.name.includes('XII') || targetKelas?.name.includes('12') ?
                  ' Silakan tunggu pengumuman kelulusan dari wali kelas.' :
                  ' Silakan tunggu pengumuman kenaikan kelas dari wali kelas.') :
                ' Silakan tunggu pembagian laporan hasil belajar dari wali kelas.'}
            </p>
            {selectedTahunAjaran !== (activeTahunAjaran?.tahun || '') && (
              <p className="text-xs text-slate-500 mt-3 max-w-xl mx-auto">
                Data historis mungkin tidak lengkap karena sistem tracking dimulai dari tahun ajaran aktif
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!raportData) {
    // This should rarely happen if isRaportPublished is true
    return <div>Error: Tidak dapat memuat data raport</div>;
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <RaportMuridHeader
        targetKelas={targetKelas}
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
        availableTahunAjaran={availableTahunAjaran}
        availableSemesters={availableSemesters}
        activeTahunAjaran={activeTahunAjaran || undefined}
        selectedTahunAjaranData={selectedTahunAjaranData}
        onTahunAjaranChange={setSelectedTahunAjaran}
        onSemesterChange={setSelectedSemester}
        onResetToActive={handleResetToActive}
      />

      <RaportMuridStatusCard
        statusKenaikan={statusKenaikan || null}
        statusBagiRaportData={statusBagiRaportData || null}
        selectedSemester={selectedSemester}
        targetKelas={targetKelas}
      />

      <RaportMuridBestStudents
        statusKenaikan={statusKenaikan}
        statusBagiRaportData={statusBagiRaportData}
        selectedSemester={selectedSemester}
        targetKelas={targetKelas}
        muridTerbaikData={muridTerbaikData}
        currentUserId={user?.id || ''}
      />

      <RaportMuridContent
        raportData={raportData}
        onPrintRaport={handlePrintRaport}
        onDownloadRaportPDF={handleDownloadRaportPDF}
        onExportRaportData={handleExportRaportData}
      />

      <RaportMuridStats raportData={raportData} />

      <RaportMuridAnalysis raportData={raportData} />
    </div>
  );
};

export default RaportMurid;