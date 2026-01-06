import React, { useState, useMemo, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { useAuth } from '../../../../context/AuthContext';
import {
  User,
  Kelas,
  Jurusan,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi,
  Guru,
  RiwayatWaliKelas as RiwayatWaliKelasType
} from '../../../../types';
import {
  generateRaportData,
  printRaport,
  downloadRaportPDF,
  exportRaportData
} from '../../../../utils/raport';
import {
  getAvailableTahunAjaran,
  getAvailableSemesters,
  getKelasForWaliKelas,
  getMuridForFilter,
  generateRekapRaportData,
  getRekapRaportStats
} from './components/riwayat-walikelas/riwayatWaliKelasUtils';
import RiwayatWaliKelasFilters from './components/riwayat-walikelas/RiwayatWaliKelasFilters';
import RiwayatWaliKelasTable from './components/riwayat-walikelas/RiwayatWaliKelasTable';
import RaportDetailModal from './components/raport/RaportDetailModal';
import { useRiwayatWaliKelasData } from '../../../../hooks/useRiwayatWaliKelasData';
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
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';
import { setKomponenNilaiCache } from '../../../../utils/nilaiUtils';
import { usePengaturanNilaiMinimal } from '../../../../hooks/usePengaturanNilaiMinimal';

interface RiwayatWaliKelasItem {
  kelasId: string;
  tahunAjaran: string;
  semester: number;
}

const RiwayatWaliKelas: React.FC = () => {
  const { user } = useAuth();
  const { riwayatWaliKelas: riwayatWaliKelasData } = useRiwayatWaliKelasData();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { nilai } = useNilai();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { jurusan } = useJurusan();
  const { komponenNilai } = useKomponenNilai();
  const { pengaturanNilaiMinimal } = usePengaturanNilaiMinimal(); // Load nilai minimal settings from database

  // Update komponen nilai cache untuk digunakan di generateRaportData
  useEffect(() => {
    if (komponenNilai && komponenNilai.length > 0) {
      setKomponenNilaiCache(komponenNilai);
    }
  }, [komponenNilai]);

  // Combine gurus and murid to get all users
  const users = useMemo(() => [...gurus, ...murid], [gurus, murid]);

  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Get current guru data from gurus hook
  const guru = useMemo(() => gurus.find(g => g.id === user?.id) as Guru | undefined, [gurus, user?.id]);

  // Use data from riwayatWaliKelas table (persistent even after guru is removed from wali kelas position)
  // OR from guru.riwayatKelasWali field (current/active wali kelas data)
  const myRiwayatFromTable = useMemo(() => 
    riwayatWaliKelasData.filter(r => r.guruId === guru?.id),
    [riwayatWaliKelasData, guru?.id]
  );
  const riwayatKelasWaliFromField = useMemo(() => guru?.riwayatKelasWali || [], [guru?.riwayatKelasWali]);

  // Convert RiwayatWaliKelasType to RiwayatWaliKelasItem format
  const riwayatFromTableConverted: RiwayatWaliKelasItem[] = useMemo(() => 
    myRiwayatFromTable.map(r => ({
      kelasId: r.kelasId,
      tahunAjaran: r.tahunAjaran,
      semester: 2 // Riwayat from table is always semester 2 (kelulusan)
    })),
    [myRiwayatFromTable]
  );

  // Merge both sources: table data (historical) + field data (current)
  const allRiwayat = useMemo(() => 
    [...riwayatFromTableConverted, ...riwayatKelasWaliFromField],
    [riwayatFromTableConverted, riwayatKelasWaliFromField]
  );

  // Remove duplicates based on kelasId + tahunAjaran + semester
  const riwayatWaliKelas: RiwayatWaliKelasItem[] = useMemo(() => 
    allRiwayat.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.kelasId === item.kelasId &&
        t.tahunAjaran === item.tahunAjaran &&
        t.semester === item.semester
      ))
    ),
    [allRiwayat]
  );

  const hasRiwayat = riwayatWaliKelas && riwayatWaliKelas.length > 0;

  const availableTahunAjaran = useMemo(
    () => getAvailableTahunAjaran(riwayatWaliKelas, tahunAjaran, nilai, jadwalPelajaran, guru?.id || ''),
    [riwayatWaliKelas, tahunAjaran, nilai, jadwalPelajaran, guru?.id]
  );

  const availableSemesters = useMemo(
    () => selectedTahunAjaran ? getAvailableSemesters(selectedTahunAjaran, riwayatWaliKelas, tahunAjaran, nilai, jadwalPelajaran, guru?.id || '') : [],
    [selectedTahunAjaran, riwayatWaliKelas, tahunAjaran, nilai, jadwalPelajaran, guru?.id]
  );

  const kelasList = useMemo(
    () => selectedTahunAjaran && selectedSemester ? getKelasForWaliKelas(selectedTahunAjaran, selectedSemester, riwayatWaliKelas, kelas, nilai, jadwalPelajaran, guru?.id || '') : [],
    [selectedTahunAjaran, selectedSemester, riwayatWaliKelas, kelas, nilai, jadwalPelajaran, guru?.id]
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

  const handleReset = () => {
    setSelectedTahunAjaran('');
    setSelectedSemester(1);
    setSelectedKelas('');
    setSearchQuery('');
  };

  if (!hasRiwayat) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-white rounded-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Riwayat Walikelas</h1>
            </div>
          </div>
        </div>

        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 sm:p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Belum Pernah Menjadi Walikelas</h3>
            <p className="text-sm sm:text-base text-slate-600">Anda belum memiliki riwayat menjadi walikelas.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-white rounded-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Riwayat Walikelas</h1>
                <p className="text-xs sm:text-sm text-blue-100 mt-1">Lihat data laporan hasil belajar dan prestasi siswa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RiwayatWaliKelasFilters
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
        selectedKelas={selectedKelas}
        searchQuery={searchQuery}
        availableTahunAjaran={availableTahunAjaran}
        availableSemesters={availableSemesters}
        kelasList={kelasList}
        onTahunAjaranChange={setSelectedTahunAjaran}
        onSemesterChange={setSelectedSemester}
        onKelasChange={setSelectedKelas}
        onSearchChange={setSearchQuery}
        onReset={handleReset}
      />

      {selectedTahunAjaran && selectedSemester && selectedKelas && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Total Murid</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.totalMurid}</p>
                </div>
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-blue-50">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-blue-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Rata-rata Nilai</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.rataRataNilai.toFixed(2)}</p>
                </div>
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-emerald-50">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-emerald-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">
                    {stats.isMaxTingkat ? 'Lulus' : 'Naik Kelas'} {stats.persentaseNaik.toFixed(1)}%
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                    {stats.muridNaik}/{stats.totalMurid}
                  </p>
                </div>
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-green-50">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-green-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">
                    {stats.isMaxTingkat ? 'Tidak Lulus' : 'Tidak Naik'}
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.muridTidakNaik}</p>
                </div>
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-orange-50">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-orange-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          </Card>
        </div>
      )}

      <RiwayatWaliKelasTable
        rekapData={rekapData}
        isLoading={false}
        onViewDetail={handleViewDetail}
        onPrintRaport={handlePrintRaport}
        onDownloadRaportPDF={handleDownloadRaportPDF}
        onExportRaport={handleExportRaport}
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
    </div>
  );
};

export default RiwayatWaliKelas;
