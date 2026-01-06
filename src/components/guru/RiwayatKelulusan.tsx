import React, { useState, useMemo, useEffect } from 'react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import {
  RiwayatWaliKelas,
  User,
  Kelas,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi,
  Jurusan,
  Alumni
} from '../../types';
import { generateRaportData, printRaport, exportRaportData, downloadRaportPDF } from '../../utils/raport';
import RiwayatStatsCards from './pages/riwayat-kelulusan/components/RiwayatStatsCards';
import RiwayatTable from './pages/riwayat-kelulusan/components/RiwayatTable';
import DetailKelulusanModal from './pages/riwayat-kelulusan/modals/DetailKelulusanModal';
import RaportAlumniModal from './pages/riwayat-kelulusan/modals/RaportAlumniModal';
import { getTotalStats, getAlumniForRiwayat, findOriginalMurid } from './pages/riwayat-kelulusan/utils/riwayatKelulusanUtils';
import { exportRiwayatData } from './pages/riwayat-kelulusan/utils/exportUtils';
import { useRiwayatWaliKelasData } from '../../hooks/useRiwayatWaliKelasData';
import { useAlumni } from '../../hooks/useAlumni';
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
import { useKomponenNilai } from '../../hooks/useKomponenNilai';
import { setKomponenNilaiCache } from '../../utils/nilaiUtils';

const RiwayatKelulusan: React.FC = () => {
  const { user } = useAuth();
  const { riwayatWaliKelas: riwayatWaliKelasData } = useRiwayatWaliKelasData();
  const { alumni } = useAlumni();
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

  // Update komponen nilai cache untuk digunakan di generateRaportData
  useEffect(() => {
    if (komponenNilai && komponenNilai.length > 0) {
      setKomponenNilaiCache(komponenNilai);
    }
  }, [komponenNilai]);

  // Combine gurus and murid to get all users
  const users = useMemo(() => [...gurus, ...murid], [gurus, murid]);

  const [selectedRiwayat, setSelectedRiwayat] = useState<RiwayatWaliKelas | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isRaportModalOpen, setIsRaportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const myRiwayat = useMemo(() => 
    riwayatWaliKelasData.filter(r => r.guruId === user?.id)
      .sort((a, b) => new Date(b.tanggalKelulusan).getTime() - new Date(a.tanggalKelulusan).getTime()),
    [riwayatWaliKelasData, user?.id]
  );

  const filteredRiwayat = useMemo(() => 
    myRiwayat.filter(item => {
      const matchesSearch = item.namaKelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.tahunAjaran.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }),
    [myRiwayat, searchTerm]
  );

  const handleViewDetail = (riwayat: RiwayatWaliKelas) => {
    setSelectedRiwayat(riwayat);
    setIsDetailModalOpen(true);
  };

  const handleViewRaport = (alumniItem: Alumni) => {
    const originalMurid = findOriginalMurid(alumniItem, users);
    setSelectedMurid(originalMurid as User);
    setIsRaportModalOpen(true);
  };

  const handlePrintRaport = (alumniItem: Alumni) => {
    if (!selectedRiwayat) return;
    const originalMurid = findOriginalMurid(alumniItem, users);

    const usersWithAlumni = users.some(u => u.id === originalMurid.id)
      ? users
      : [...users, originalMurid as User];

    const raportData = generateRaportData(
      originalMurid.id,
      2,
      usersWithAlumni,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedRiwayat.tahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );

    if (raportData) {
      printRaport(raportData);
    }
  };

  const handleDownloadRaportPDF = (alumniItem: Alumni) => {
    if (!selectedRiwayat) return;
    const originalMurid = findOriginalMurid(alumniItem, users);

    const usersWithAlumni = users.some(u => u.id === originalMurid.id)
      ? users
      : [...users, originalMurid as User];

    const raportData = generateRaportData(
      originalMurid.id,
      2,
      usersWithAlumni,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedRiwayat.tahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );

    if (raportData) {
      downloadRaportPDF(raportData);
    }
  };

  const handleExportRiwayat = (riwayat: RiwayatWaliKelas) => {
    const alumniData = getAlumniForRiwayat(riwayat, alumni, user?.id || '');
    exportRiwayatData(riwayat, alumniData, user?.name || '');
  };

  const stats = useMemo(() => getTotalStats(myRiwayat), [myRiwayat]);
  const tingkatKelulusan = useMemo(() => 
    (stats.totalMuridLulus + stats.totalMuridTidakLulus) > 0 ?
      ((stats.totalMuridLulus / (stats.totalMuridLulus + stats.totalMuridTidakLulus)) * 100).toFixed(1) : '0',
    [stats]
  );

  const alumniForSelectedRiwayat = useMemo(() => 
    selectedRiwayat ? getAlumniForRiwayat(selectedRiwayat, alumni, user?.id || '') : [],
    [selectedRiwayat, alumni, user?.id]
  );

  const usersWithSelectedMurid = useMemo(() => {
    if (!selectedMurid) return users;
    return users.some(u => u.id === selectedMurid.id) ? users : [...users, selectedMurid];
  }, [users, selectedMurid]);

  const raportData = useMemo(() => {
    if (!selectedMurid || !selectedRiwayat) return null;
    return generateRaportData(
      selectedMurid.id,
      2,
      usersWithSelectedMurid,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedRiwayat.tahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );
  }, [selectedMurid, selectedRiwayat, usersWithSelectedMurid, kelas, jurusan, nilai, mataPelajaran, tahunAjaran, jadwalPelajaran, absensi, sesiAbsensi]);

  const alumniData = useMemo(() => {
    if (!selectedMurid || !selectedRiwayat) return null;
    return alumni.find(a => a.muridId === selectedMurid.id && a.tahunLulus === selectedRiwayat.tahunAjaran) || null;
  }, [selectedMurid, selectedRiwayat, alumni]);

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Riwayat Kelulusan
              </h1>
              <p className="text-xs sm:text-sm text-blue-100">
                Riwayat kelas yang pernah Anda bimbing sebagai wali kelas hingga kelulusan
              </p>
            </div>
            <Badge variant="info" className="whitespace-nowrap">
              {myRiwayat.length} riwayat
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <RiwayatStatsCards
        totalKelas={stats.totalKelas}
        totalMuridLulus={stats.totalMuridLulus}
        totalMuridTidakLulus={stats.totalMuridTidakLulus}
        tingkatKelulusan={tingkatKelulusan}
      />

      {/* Search & Filter Section */}
      <Card className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari kelas atau tahun ajaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            Menampilkan <span className="font-semibold text-slate-900">{filteredRiwayat.length}</span> dari <span className="font-semibold text-slate-900">{myRiwayat.length}</span> riwayat
          </div>
        </div>
      </Card>

      {/* Data Table/List */}
      <Card className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden lg:block p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Daftar Riwayat Kelulusan</h3>
        </div>

        <div>
          <RiwayatTable
            riwayat={filteredRiwayat}
            onViewDetail={handleViewDetail}
            onExport={handleExportRiwayat}
          />
        </div>
      </Card>

      <DetailKelulusanModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRiwayat(null);
        }}
        riwayat={selectedRiwayat}
        alumni={alumniForSelectedRiwayat}
        onExport={() => selectedRiwayat && handleExportRiwayat(selectedRiwayat)}
        onViewRaport={handleViewRaport}
        onPrintRaport={handlePrintRaport}
        onDownloadRaport={handleDownloadRaportPDF}
      />

      <RaportAlumniModal
        isOpen={isRaportModalOpen}
        onClose={() => {
          setIsRaportModalOpen(false);
          setSelectedMurid(null);
        }}
        murid={selectedMurid}
        raportData={raportData}
        alumniData={alumniData}
        onPrint={() => {
          if (raportData) printRaport(raportData);
        }}
        onDownload={() => {
          if (raportData) downloadRaportPDF(raportData);
        }}
        onExport={() => {
          if (raportData) exportRaportData(raportData);
        }}
      />
    </div>
  );
};

export default RiwayatKelulusan;
