import React, { useState, useMemo, useEffect } from 'react';
import { FileText } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { useAuth } from '../../../../context/AuthContext';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useNilai } from '../../../../hooks/useNilai';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useGrade } from '../../../../hooks/useGrade';
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';
import { useProfilSekolah } from '../../../../hooks/useProfilSekolah';
import { useDataKepsek } from '../../../../hooks/useDataKepsek';
import { usePengaturanNilaiMinimal } from '../../../../hooks/usePengaturanNilaiMinimal';
import { setGradeCache, setKomponenNilaiCache } from '../../../../utils/nilaiUtils';
import {
  User,
  Kelas,
  Jurusan,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi
} from '../../../../types';
import {
  generateRaportData,
  printRaport,
  downloadRaportPDF,
  exportRaportData,
  setProfilSekolahCache,
  setDataKepsekCache
} from '../../../../utils/raport';
import {
  getAvailableTahunAjaran,
  getAvailableSemesters,
  getKelasForJurusan,
  getAllKelas,
  getMuridForFilter,
  generateRekapRaportData,
  getRekapRaportStats
} from './utils/rekapRaportUtils';
import { isJurusanRequiredSync } from '../../../../utils/jenjangPendidikanUtils';
import RekapRaportFilters from './components/RekapRaportFilters';
import RekapRaportTable from './components/RekapRaportTable';
import RaportDetailModal from '../../../guru/pages/walikelas/components/raport/RaportDetailModal';
import ERaportDetailModal from '../../../guru/pages/walikelas/components/e-raport/ERaportDetailModal';
import { useERaportByMurid } from '../../../../hooks/useERaportByMurid';

const RekapRaportMurid: React.FC = () => {
  const { user } = useAuth();
  
  // Use hooks dengan cache untuk mengambil data dari database
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
  const { grade: gradeSettings } = useGrade();
  const { komponenNilai } = useKomponenNilai();
  const { profilSekolah } = useProfilSekolah();
  const { dataKepsek } = useDataKepsek();
  usePengaturanNilaiMinimal(); // Load nilai minimal settings from database to update cache

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

  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedJurusan, setSelectedJurusan] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMuridERaport, setSelectedMuridERaport] = useState<User | null>(null);
  const [isERaportModalOpen, setIsERaportModalOpen] = useState(false);

  const availableTahunAjaran = useMemo(
    () => getAvailableTahunAjaran(tahunAjaran),
    [tahunAjaran]
  );

  const availableSemesters = useMemo(
    () => selectedTahunAjaran ? getAvailableSemesters(selectedTahunAjaran, tahunAjaran, nilai, jadwalPelajaran) : [],
    [selectedTahunAjaran, tahunAjaran, nilai, jadwalPelajaran]
  );

  const showJurusan = isJurusanRequiredSync();

  const kelasList = useMemo(
    () => {
      if (!showJurusan) {
        // For SD/SMP, get all kelas without jurusan filter
        return selectedTahunAjaran ? getAllKelas(selectedTahunAjaran, kelas, nilai) : [];
      }
      // For SMA/SMK, filter by jurusan
      return selectedJurusan ? getKelasForJurusan(selectedJurusan, selectedTahunAjaran, kelas, nilai) : [];
    },
    [showJurusan, selectedJurusan, selectedTahunAjaran, kelas, nilai]
  );

  const muridList = useMemo(
    () => getMuridForFilter(selectedKelas, selectedTahunAjaran, selectedSemester, users, kelas, nilai, searchQuery),
    [selectedKelas, selectedTahunAjaran, selectedSemester, users, kelas, nilai, searchQuery]
  );

  const rekapData = useMemo(
    () => generateRekapRaportData(
      muridList,
      selectedSemester,
      selectedTahunAjaran,
      selectedKelas,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran,
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    ),
    [muridList, selectedSemester, selectedTahunAjaran, selectedKelas, users, kelas, jurusan, nilai, mataPelajaran, tahunAjaran, jadwalPelajaran, absensi, sesiAbsensi]
  );

  const stats = useMemo(() => getRekapRaportStats(rekapData), [rekapData]);

  useEffect(() => {
    if (selectedTahunAjaran && availableSemesters.length > 0) {
      const semesterExists = availableSemesters.some(s => s.semester === selectedSemester);
      if (!semesterExists) {
        setSelectedSemester(availableSemesters[0].semester);
      }
    }
  }, [selectedTahunAjaran, availableSemesters]);

  const handleViewDetail = (murid: User) => {
    setSelectedMurid(murid);
    setIsDetailModalOpen(true);
  };

  const handlePrintRaport = (murid: User) => {
    const raportData = generateRaportData(
      murid.id,
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

  const handleDownloadRaportPDF = (murid: User) => {
    const raportData = generateRaportData(
      murid.id,
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

  const handleExportRaport = (murid: User) => {
    const raportData = generateRaportData(
      murid.id,
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

  const handleViewERaport = (murid: User) => {
    setSelectedMuridERaport(murid);
    setIsERaportModalOpen(true);
  };

  // Get kelasId for selected murid E-Raport
  const kelasIdForERaport = useMemo(() => {
    if (!selectedMuridERaport || !selectedKelas) return null;
    return selectedKelas;
  }, [selectedMuridERaport, selectedKelas]);

  // Fetch E-Raport data
  const { eraport: eraportData, loading: eraportLoading } = useERaportByMurid(
    selectedMuridERaport && kelasIdForERaport && selectedTahunAjaran && selectedSemester
      ? {
          muridId: selectedMuridERaport.id,
          kelasId: kelasIdForERaport,
          tahunAjaran: selectedTahunAjaran,
          semester: selectedSemester,
        }
      : undefined
  );

  const handleReset = () => {
    setSelectedTahunAjaran('');
    setSelectedSemester(1);
    setSelectedJurusan('');
    setSelectedKelas('');
    setSearchQuery('');
  };

  if (user?.role !== 'admin') {
    return (
      <Card className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Rekap Laporan Hasil Belajar
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Lihat dan kelola laporan hasil belajar siswa per kelas
              </p>
            </div>
          </div>
        </div>
      </div>

      <RekapRaportFilters
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
        selectedJurusan={selectedJurusan}
        selectedKelas={selectedKelas}
        searchQuery={searchQuery}
        availableTahunAjaran={availableTahunAjaran}
        availableSemesters={availableSemesters}
        jurusanList={jurusan}
        kelasList={kelasList}
        onTahunAjaranChange={setSelectedTahunAjaran}
        onSemesterChange={setSelectedSemester}
        onJurusanChange={setSelectedJurusan}
        onKelasChange={setSelectedKelas}
        onSearchChange={setSearchQuery}
        onReset={handleReset}
      />

      {selectedTahunAjaran && selectedSemester && selectedKelas && (showJurusan ? selectedJurusan : true) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Total Murid</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalMurid}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-blue-50">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Rata-rata Nilai</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.rataRataNilai.toFixed(2)}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
                    {stats.isMaxTingkat ? 'Lulus' : 'Naik Kelas'} {stats.persentaseNaik.toFixed(1)}%
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {stats.muridNaik}/{stats.totalMurid}
                  </p>

                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-green-50">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
                    {stats.isMaxTingkat ? 'Tidak Lulus' : 'Tidak Naik'}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.muridTidakNaik}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-orange-50">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          </Card>
        </div>
      )}

      <RekapRaportTable
        rekapData={rekapData}
        isLoading={false}
        onViewDetail={handleViewDetail}
        onPrintRaport={handlePrintRaport}
        onDownloadRaportPDF={handleDownloadRaportPDF}
        onExportRaport={handleExportRaport}
        onViewERaport={handleViewERaport}
      />

      {selectedMurid && (
        <RaportDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedMurid(null);
          }}
          selectedMurid={selectedMurid}
          targetKelas={kelas.find(k => k.id === selectedKelas)}
          selectedSemester={selectedSemester}
          selectedTahunAjaran={selectedTahunAjaran}
          generateRaportData={(muridId) => generateRaportData(
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
          )}
          onPrintRaport={handlePrintRaport}
          onDownloadRaportPDF={handleDownloadRaportPDF}
          onExportRaport={handleExportRaport}
        />
      )}

      {selectedMuridERaport && (
        <ERaportDetailModal
          isOpen={isERaportModalOpen}
          onClose={() => {
            setIsERaportModalOpen(false);
            setSelectedMuridERaport(null);
          }}
          selectedMurid={selectedMuridERaport}
          eraport={eraportData}
          targetKelas={kelas.find(k => k.id === selectedKelas)}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
        />
      )}
    </div>
  );
};

export default RekapRaportMurid;
