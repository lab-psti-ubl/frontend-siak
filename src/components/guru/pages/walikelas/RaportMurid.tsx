import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import Card from '../../../ui/Card';
import { useAuth } from '../../../../context/AuthContext';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useNilai } from '../../../../hooks/useNilai';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useGurus } from '../../../../hooks/useGurus';
import { useStatusKenaikanKelas } from '../../../../hooks/useStatusKenaikanKelas';
import { useStatusBagiRaport } from '../../../../hooks/useStatusBagiRaport';
import { useRiwayatWaliKelasData } from '../../../../hooks/useRiwayatWaliKelasData';
import { useGrade } from '../../../../hooks/useGrade';
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';
import { useProfilSekolah } from '../../../../hooks/useProfilSekolah';
import { useDataKepsek } from '../../../../hooks/useDataKepsek';
import { setGradeCache, setKomponenNilaiCache } from '../../../../utils/nilaiUtils';
import {
  User,
  Guru
} from '../../../../types';
import { 
  generateRaportData, 
  printRaport,
  downloadRaportPDF,
  exportRaportData,
  setProfilSekolahCache,
  setDataKepsekCache
} from '../../../../utils/raport';
import { showSuccessNotification } from '../../../../utils/notificationUtils';
import { showSuccessConfirmation } from '../../../../utils/confirmationUtils';
import RaportHeader from './components/raport/RaportHeader';
import RaportDistributionCard from './components/raport/RaportDistributionCard';
import MuridTerbaikCard from './components/murid-kelas/MuridTerbaikCard';
import RaportTable from './components/raport/RaportTable';
import RaportDetailModal from './components/raport/RaportDetailModal';
import { 
  getKelasForTahunAjaran, 
  getMuridForSelectedPeriod, 
  generateMuridTerbaikData,
  checkRaportAccess 
} from './components/raport/RaportUtils';

const RaportMurid: React.FC = () => {
  const { user } = useAuth();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { nilai } = useNilai();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { jurusan } = useJurusan();
  const { statusKenaikanKelas, updateStatusKenaikanKelas } = useStatusKenaikanKelas();
  const { statusBagiRaport, updateStatusBagiRaport } = useStatusBagiRaport();
  const { riwayatWaliKelas: riwayatWaliKelasData } = useRiwayatWaliKelasData();
  const { grade: gradeSettings } = useGrade();
  const { komponenNilai } = useKomponenNilai();
  const { profilSekolah } = useProfilSekolah();
  const { dataKepsek } = useDataKepsek();

  // Set cache untuk nilaiUtils agar komponen nilai dan grade sesuai dengan database
  useEffect(() => {
    if (gradeSettings && gradeSettings.length > 0) {
      setGradeCache(gradeSettings);
    }
  }, [gradeSettings]);

  useEffect(() => {
    if (komponenNilai && komponenNilai.length > 0) {
      setKomponenNilaiCache(komponenNilai);
    }
  }, [komponenNilai]);

  // Set cache untuk profil sekolah dan data kepsek
  useEffect(() => {
    if (profilSekolah) {
      setProfilSekolahCache(profilSekolah);
    }
  }, [profilSekolah]);

  useEffect(() => {
    if (dataKepsek && dataKepsek.length > 0) {
      setDataKepsekCache(dataKepsek[0]);
    }
  }, [dataKepsek]);

  // Combine gurus and murid into users array for compatibility
  const users: User[] = useMemo(() => {
    return [...gurus, ...murid] as User[];
  }, [gurus, murid]);
  
  const [selectedSemester, setSelectedSemester] = useState<number>(() => {
    return activeTahunAjaran?.semester || 1;
  });
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(() => {
    return activeTahunAjaran?.tahun || '';
  });
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const guru = user as Guru;

  let targetKelas = null;
  let kelasError = null;

  try {
    targetKelas = user?.kelasWali ? getKelasForTahunAjaran(
      user.kelasWali,
      selectedTahunAjaran,
      activeTahunAjaran,
      kelas,
      nilai,
      guru,
      riwayatWaliKelasData
    ) : null;
  } catch (error) {
    if (error instanceof Error) {
      kelasError = error.message;
    }
  }

  // Get unique tahun ajaran from all tahun ajaran data
  const availableTahunAjaran = Array.from(
    new Map(tahunAjaran.map(ta => [ta.tahun, ta])).values()
  ).sort((a, b) => {
    const yearA = parseInt(a.tahun.split('/')[0]);
    const yearB = parseInt(b.tahun.split('/')[0]);
    return yearB - yearA; // Sort descending (newest first)
  });

  // Get available semesters for selected tahun ajaran
  const getAvailableSemesters = (tahunAjaranValue: string) => {
    const semestersFromTahunAjaran = tahunAjaran
      .filter(ta => ta.tahun === tahunAjaranValue)
      .map(ta => ta.semester);

    const semestersFromNilai = new Set<number>();
    if (targetKelas) {
      nilai
        .filter(n => n.tahunAjaran === tahunAjaranValue && n.kelasId === targetKelas.id)
        .forEach(n => semestersFromNilai.add(n.semester));
    }

    const semestersFromJadwal = new Set<number>();
    if (targetKelas) {
      jadwalPelajaran
        .filter(j => j.tahunAjaran === tahunAjaranValue && j.kelasId === targetKelas.id)
        .forEach(j => semestersFromJadwal.add(j.semester));
    }

    const allSemesters = new Set([
      ...semestersFromTahunAjaran,
      ...Array.from(semestersFromNilai),
      ...Array.from(semestersFromJadwal)
    ]);

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

  const availableSemesters = useMemo(() => getAvailableSemesters(selectedTahunAjaran),
    [selectedTahunAjaran, targetKelas, nilai, jadwalPelajaran]);

  useEffect(() => {
    if (availableSemesters.length > 0) {
      const semesterExists = availableSemesters.some(s => s.semester === selectedSemester);
      if (!semesterExists) {
        setSelectedSemester(availableSemesters[0].semester);
      }
    }
  }, [availableSemesters]);

  // Update selected tahun ajaran when activeTahunAjaran changes
  useEffect(() => {
    if (activeTahunAjaran && !selectedTahunAjaran) {
      setSelectedTahunAjaran(activeTahunAjaran.tahun);
      setSelectedSemester(activeTahunAjaran.semester);
    }
  }, [activeTahunAjaran]);

  if (!user?.isWaliKelas || !user.kelasWali) {
    return (
      <Card className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Anda tidak memiliki akses sebagai wali kelas.</p>
      </Card>
    );
  }

  const muridKelas = getMuridForSelectedPeriod(
    targetKelas,
    selectedTahunAjaran,
    activeTahunAjaran,
    users,
    kelas,
    user.kelasWali,
    nilai
  );

  const { statusKenaikan, statusBagiRaportData, canDistribute, isDistributed } = checkRaportAccess(
    targetKelas,
    selectedSemester,
    selectedTahunAjaran,
    statusKenaikanKelas,
    statusBagiRaport
  );

  const handleDistributeRaport = () => {
    const semesterText = selectedSemester === 1 ? 'ganjil' : 'genap';
    const actionText = selectedSemester === 2 ? 'kenaikan kelas' : 'semester ganjil';
    
    showSuccessConfirmation(
      `Sebarkan Laporan Hasil Belajar Semester ${semesterText.charAt(0).toUpperCase() + semesterText.slice(1)}`,
      `Apakah Anda yakin ingin menyebarkan laporan hasil belajar ${actionText} kepada murid?\n\nSetelah disebarkan:\n• Murid dapat melihat laporan hasil belajar di menu mereka\n• Murid akan mendapat notifikasi\n• Laporan Hasil Belajar tidak dapat ditarik kembali`,
      async () => {
        if (selectedSemester === 2 && statusKenaikan && targetKelas) {
          await updateStatusKenaikanKelas(statusKenaikan.id, {
            addPublishedKelasId: targetKelas.id,
            publishedBy: user.id,
            publishedAt: new Date().toISOString()
          });
        } else if (selectedSemester === 1 && statusBagiRaportData) {
          await updateStatusBagiRaport(statusBagiRaportData.id, {
            isPublished: true,
            publishedBy: user.id,
            publishedAt: new Date().toISOString()
          });
        }
    
        showSuccessNotification(
          'Laporan Hasil Belajar Berhasil Disebarkan',
          `Laporan Hasil Belajar semester ${selectedSemester} telah disebarkan kepada murid. Mereka akan mendapat notifikasi bahwa laporan hasil belajar sudah tersedia.`
        );
      },
      {
        confirmText: 'Ya, Sebarkan Laporan Hasil Belajar',
        cancelText: 'Batal'
      }
    );
  };

  const handleViewDetail = (muridData: User) => {
    setSelectedMurid(muridData);
    setIsDetailModalOpen(true);
  };

  const handlePrintRaport = (muridData: User) => {
    const raportData = generateRaportData(
      muridData.id,
      selectedSemester,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );
    
    if (raportData) {
      printRaport(raportData);
    }
  };

  const handleDownloadRaportPDF = (muridData: User) => {
    const raportData = generateRaportData(
      muridData.id,
      selectedSemester,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );
    
    if (raportData) {
      downloadRaportPDF(raportData);
    }
  };

  const handleExportRaport = (muridData: User) => {
    const raportData = generateRaportData(
      muridData.id,
      selectedSemester,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );
    
    if (raportData) {
      exportRaportData(raportData);
    }
  };

  const generateRaportDataForMurid = useCallback((muridId: string) => {
    return generateRaportData(
      muridId,
      selectedSemester,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );
  }, [selectedSemester, users, kelas, jurusan, nilai, mataPelajaran, selectedTahunAjaran, jadwalPelajaran, absensi, sesiAbsensi]);

  const muridTerbaikData = useMemo(() => generateMuridTerbaikData(
    muridKelas,
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
    sesiAbsensi
  ), [muridKelas, selectedSemester, selectedTahunAjaran, users, kelas, jurusan, nilai, mataPelajaran, tahunAjaran, jadwalPelajaran, absensi, sesiAbsensi]);

  const handleResetToActive = () => {
    if (activeTahunAjaran) {
      setSelectedTahunAjaran(activeTahunAjaran.tahun);
      setSelectedSemester(activeTahunAjaran.semester);
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <RaportHeader
        targetKelas={targetKelas}
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
        availableTahunAjaran={availableTahunAjaran}
        availableSemesters={availableSemesters}
        activeTahunAjaran={activeTahunAjaran}
        onTahunAjaranChange={setSelectedTahunAjaran}
        onSemesterChange={setSelectedSemester}
        onResetToActive={handleResetToActive}
      />

      {kelasError ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Konfigurasi Tidak Lengkap</h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-4">
              {kelasError}
            </p>
            <p className="text-sm text-slate-500">
              Silakan hubungi administrator untuk mengkonfigurasi jenjang pendidikan terlebih dahulu.
            </p>
          </div>
        </div>
      ) : !targetKelas ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Kelas Tidak Ditemukan</h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
              Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}. Kemungkinan Anda belum menjadi wali kelas atau sudah tidak menjadi wali kelas pada periode tersebut.
            </p>
          </div>
        </div>
      ) : (
        <>
          <RaportDistributionCard
            canDistribute={canDistribute}
            isDistributed={isDistributed}
            selectedSemester={selectedSemester}
            statusKenaikan={statusKenaikan}
            statusBagiRaportData={statusBagiRaportData}
            onDistributeRaport={handleDistributeRaport}
          />

          <MuridTerbaikCard
            statusKenaikan={statusKenaikan}
            statusBagiRaportData={statusBagiRaportData}
            selectedSemester={selectedSemester}
            targetKelas={targetKelas}
            muridKelasData={muridTerbaikData}
          />

          <RaportTable
            muridKelas={muridKelas}
            selectedSemester={selectedSemester}
            targetKelas={targetKelas}
            canDistribute={canDistribute}
            isDistributed={isDistributed}
            selectedTahunAjaran={selectedTahunAjaran}
            onDistributeRaport={handleDistributeRaport}
            onViewDetail={handleViewDetail}
            onPrintRaport={handlePrintRaport}
            onDownloadRaportPDF={handleDownloadRaportPDF}
            onExportRaport={handleExportRaport}
            generateRaportData={generateRaportDataForMurid}
          />
        </>
      )}

      <RaportDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMurid(null);
        }}
        selectedMurid={selectedMurid}
        targetKelas={targetKelas}
        selectedSemester={selectedSemester}
        selectedTahunAjaran={selectedTahunAjaran}
        generateRaportData={generateRaportDataForMurid}
        onPrintRaport={handlePrintRaport}
        onDownloadRaportPDF={handleDownloadRaportPDF}
        onExportRaport={handleExportRaport}
      />
    </div>
  );
};

export default RaportMurid;
