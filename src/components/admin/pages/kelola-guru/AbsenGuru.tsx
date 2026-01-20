import React, { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import { User, AbsensiGuru, JadwalPelajaran, Kelas, MataPelajaran, PengaturanAbsen, IzinGuru, TahunAjaran, SesiAbsensi, FotoMengajar } from '../../../../types';
import AttendanceStatsCards from './components/AttendanceStatsCards';
import DateInfoCard from './components/DateInfoCard';
import SearchAndFilterBar from './components/SearchAndFilterBar';
import AbsenGuruTable from './components/AbsenGuruTable';
import PhotoModal from './components/PhotoModal';
import JadwalDetailModal from './components/JadwalDetailModal';
import JurnalPreviewModal from './components/JurnalPreviewModal';
import DetailAbsensiModal from './components/DetailAbsensiModal';
import LihatAbsenGuruModal from './components/LihatAbsenGuruModal';
import RekapAbsenGuruModal from './components/RekapAbsenGuruModal';
import EditAbsenGuruModal from './components/EditAbsenGuruModal';
import { getGuruAbsensiForDate, getGuruIzinForDate, getJadwalGuruForDate, getKelasName as getKelasNameHelper, getMapelName as getMapelNameHelper, calculateAttendanceStats } from './utils/absenGuruDataHelpers';
import { exportAbsensiReport, exportAbsensiReportPDF } from './utils/absenGuruExport';
import Button from '../../../ui/Button';
import { sseAbsenService } from '../../../../services/sseAbsenService';
import { useGurus } from '../../../../hooks/useGurus';
import { useAbsensiGuru } from '../../../../hooks/useAbsensiGuru';
import { useIzinGuru } from '../../../../hooks/useIzinGuru';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useLanguage } from '../../../../context/LanguageContext';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { getTerminology } from '../../../../utils/terminologyUtils';

const AbsenGuru: React.FC = () => {
  const { t, language } = useLanguage();
  const { systemType } = usePengaturanSistem();
  const terminology = getTerminology(systemType);
  
  // Use hooks with cache
  const { gurus: allGurus } = useGurus();
  const { absensiGuru, refreshAbsensiGuru, updateAbsensiGuru: updateAbsensiGuruAPI, createAbsensiGuru: createAbsensiGuruAPI } = useAbsensiGuru();
  const { izinGuru } = useIzinGuru();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { pengaturanAbsen } = usePengaturanAbsen();
  const { sesiAbsensi } = useSesiAbsensi();
  const { absensi } = useAbsensi();
  
  // Set locale for date formatting based on language
  const dateLocale = language === 'ms' ? 'ms-MY' : 'id-ID';

  // Filter gurus
  const gurus = useMemo(() => {
    return allGurus.filter(u => u.role === 'guru' && u.isActive !== false);
  }, [allGurus]);

  // Create users array for compatibility (for admin view, we mainly need gurus)
  const users = useMemo(() => {
    return allGurus; // For admin view, we mainly need gurus
  }, [allGurus]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGuru, setSelectedGuru] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailDate, setDetailDate] = useState(new Date().toISOString().split('T')[0]);
  const [detailView, setDetailView] = useState<'default' | 'kehadiran' | 'pertemuan'>('default');
  const [isRekapMengajarOpen, setIsRekapMengajarOpen] = useState(false);
  const [isLihatAbsenGuruOpen, setIsLihatAbsenGuruOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FotoMengajar | null>(null);
  const [isJadwalDetailModalOpen, setIsJadwalDetailModalOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<JadwalPelajaran | null>(null);
  const [selectedJadwalDate, setSelectedJadwalDate] = useState('');
  const [isJurnalPreviewOpen, setIsJurnalPreviewOpen] = useState(false);
  const [selectedJurnalFile, setSelectedJurnalFile] = useState<{ name: string; type: string; data: string; size: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'hadir' | 'tidak_hadir' | 'izin'>('all');
  const [isRekapAbsenGuruModalOpen, setIsRekapAbsenGuruModalOpen] = useState(false);
  const [isEditAbsenGuruOpen, setIsEditAbsenGuruOpen] = useState(false);
  const [, setSSEUpdates] = useState(0);

  useEffect(() => {
    sseAbsenService.connect();

    const unsubscribe = sseAbsenService.subscribe(async (event) => {
      if (event.type === 'absen-update' || event.type === 'absen-auto-save' || event.type === 'absen-guru-auto-alfa') {
        // Refresh absensi guru from API
        await refreshAbsensiGuru();
        setSSEUpdates(prev => prev + 1);
      }
    });

    const handleAutoAlfaGuru = async () => {
      // Refresh absensi guru from API
      await refreshAbsensiGuru();
      setSSEUpdates(prev => prev + 1);
    };

    window.addEventListener('absensi-guru-auto-alfa-processed', handleAutoAlfaGuru);

    return () => {
      unsubscribe();
      sseAbsenService.disconnect();
      window.removeEventListener('absensi-guru-auto-alfa-processed', handleAutoAlfaGuru);
    };
  }, [refreshAbsensiGuru]);

  const activePengaturan = pengaturanAbsen.find(p => p.isActive);

  const getKelasName = (kelasId: string) => getKelasNameHelper(kelas, kelasId);
  const getMapelName = (mapelId: string) => getMapelNameHelper(mataPelajaran, mapelId);

  const stats = calculateAttendanceStats(absensiGuru, izinGuru, gurus, selectedDate);
  const attendanceRate = stats.totalGuru > 0 ? ((stats.sudahAbsenMasuk / stats.totalGuru) * 100).toFixed(1) : '0';

  const filteredGurus = gurus.filter(guru => {
    const absensi = getGuruAbsensiForDate(absensiGuru, guru.id, selectedDate);
    const izinAktif = getGuruIzinForDate(izinGuru, guru.id, selectedDate);

    const matchesSearch = guru.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guru.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guru.nip && guru.nip.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'hadir') {
      matchesStatus = !!absensi?.jamMasuk;
    } else if (statusFilter === 'tidak_hadir') {
      matchesStatus = !absensi?.jamMasuk && !izinAktif;
    } else if (statusFilter === 'izin') {
      matchesStatus = !!izinAktif;
    }

    return matchesSearch && matchesStatus;
  });

  const handleViewDetail = (guru: User) => {
    setSelectedGuru(guru);
    setDetailDate(selectedDate);
    setDetailView('default');
    setIsDetailModalOpen(true);
  };

  const handleViewAbsen = (guru: User) => {
    setSelectedGuru(guru);
    setIsLihatAbsenGuruOpen(true);
  };

  const handleViewPhoto = (foto: FotoMengajar) => {
    setSelectedPhoto(foto);
    setIsPhotoModalOpen(true);
  };

  const handleViewJadwalDetail = (jadwal: JadwalPelajaran, tanggal: string) => {
    setSelectedJadwal(jadwal);
    setSelectedJadwalDate(tanggal);
    setIsJadwalDetailModalOpen(true);
  };

  const handleViewJurnalFile = (file: { name: string; type: string; data: string; size: number }) => {
    setSelectedJurnalFile(file);
    setIsJurnalPreviewOpen(true);
  };

  const handleEditAbsen = (guru: User) => {
    setSelectedGuru(guru);
    setIsEditAbsenGuruOpen(true);
  };

  const handleSaveEditAbsen = async (updatedAbsensi: AbsensiGuru) => {
    try {
      // Check if absensi exists in current data (by guruId, tanggal, and tahunAjaranId)
      const existingAbsensi = absensiGuru.find(a => 
        a.guruId === updatedAbsensi.guruId && 
        a.tanggal === updatedAbsensi.tanggal &&
        a.tahunAjaranId === updatedAbsensi.tahunAjaranId
      );

      if (existingAbsensi && existingAbsensi.id) {
        // Update existing absensi - only send fields that can be updated
        const updateData = {
          jamMasuk: updatedAbsensi.jamMasuk,
          jamKeluar: updatedAbsensi.jamKeluar,
          statusMasuk: updatedAbsensi.statusMasuk,
          statusKeluar: updatedAbsensi.statusKeluar,
          keterangan: updatedAbsensi.keterangan,
        };
        await updateAbsensiGuruAPI(existingAbsensi.id, updateData);
      } else {
        // Create new absensi - exclude id field
        const { id, createdAt, updatedAt, ...absensiData } = updatedAbsensi;
        await createAbsensiGuruAPI(absensiData);
      }
      
      // Refresh to get updated data
      await refreshAbsensiGuru();
    } catch (error) {
      console.error('Error updating absensi guru:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-6">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            {systemType === 'tahfiz' ? t('absenGuru.absensiUstadz') : t('absenGuru.title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">{t('absenGuru.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full lg:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <Button onClick={async () => await exportAbsensiReport(gurus, absensiGuru, izinGuru, jadwalPelajaran, selectedDate, activeTahunAjaran)} variant="success" className="flex items-center justify-center text-sm lg:text-base">
            <Download size={16} className="mr-2" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button onClick={async () => await exportAbsensiReportPDF(gurus, absensiGuru, izinGuru, jadwalPelajaran, selectedDate, activeTahunAjaran)} variant="danger" className="flex items-center justify-center text-sm lg:text-base">
            <Download size={16} className="mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      <DateInfoCard
        selectedDate={selectedDate}
        attendanceRate={attendanceRate}
        activePengaturan={activePengaturan}
        dateLocale={dateLocale}
      />

      <AttendanceStatsCards
        totalGuru={stats.totalGuru}
        sudahAbsenMasuk={stats.sudahAbsenMasuk}
        terlambat={stats.terlambat}
        izin={stats.izin}
        systemType={systemType}
      />

      <SearchAndFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filteredCount={filteredGurus.length}
        totalCount={gurus.length}
        systemType={systemType}
      />

      <AbsenGuruTable
        filteredGurus={filteredGurus}
        selectedDate={selectedDate}
        absensiGuru={absensiGuru}
        izinGuru={izinGuru}
        jadwalPelajaran={jadwalPelajaran}
        activeTahunAjaran={activeTahunAjaran}
        onViewDetail={handleViewDetail}
        onViewAbsen={handleViewAbsen}
        onEditAbsen={handleEditAbsen}
        onViewRekapAbsen={() => setIsRekapAbsenGuruModalOpen(true)}
        getMapelName={getMapelName}
        getKelasName={getKelasName}
        searchTerm={searchTerm}
        systemType={systemType}
        dateLocale={dateLocale}
      />

      <DetailAbsensiModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedGuru(null);
          setDetailDate(new Date().toISOString().split('T')[0]);
          setDetailView('default');
        }}
        selectedGuru={selectedGuru}
        detailDate={detailDate}
        onDetailDateChange={setDetailDate}
        detailView={detailView}
        onDetailViewChange={setDetailView}
        isRekapMengajarOpen={isRekapMengajarOpen}
        onRekapMengajarOpen={setIsRekapMengajarOpen}
        absensiGuru={absensiGuru}
        izinGuru={izinGuru}
        jadwalPelajaran={jadwalPelajaran}
        sesiAbsensi={sesiAbsensi}
        pengaturanAbsen={pengaturanAbsen}
        tahunAjaran={tahunAjaran}
        mataPelajaran={mataPelajaran}
        kelas={kelas}
        onViewPhoto={handleViewPhoto}
        onViewJadwalDetail={handleViewJadwalDetail}
        onViewJurnalFile={handleViewJurnalFile}
        getMapelName={getMapelName}
        getKelasName={getKelasName}
        tahunAjaranAktif={activeTahunAjaran?.tahun}
        semesterAktif={activeTahunAjaran?.semester}
      />

      <PhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setSelectedPhoto(null);
        }}
        selectedPhoto={selectedPhoto}
        selectedGuru={selectedGuru}
        mataPelajaran={mataPelajaran}
        kelas={kelas}
      />

      <JadwalDetailModal
        isOpen={isJadwalDetailModalOpen}
        onClose={() => {
          setIsJadwalDetailModalOpen(false);
          setSelectedJadwal(null);
          setSelectedJadwalDate('');
        }}
        selectedJadwal={selectedJadwal}
        selectedGuru={selectedGuru}
        selectedJadwalDate={selectedJadwalDate}
        onViewFile={handleViewJurnalFile}
      />

      <JurnalPreviewModal
        isOpen={isJurnalPreviewOpen}
        onClose={() => {
          setIsJurnalPreviewOpen(false);
          setSelectedJurnalFile(null);
        }}
        selectedFile={selectedJurnalFile}
      />

      <LihatAbsenGuruModal
        isOpen={isLihatAbsenGuruOpen}
        onClose={() => {
          setIsLihatAbsenGuruOpen(false);
          setSelectedGuru(null);
        }}
        selectedGuru={selectedGuru}
        selectedDate={selectedDate}
        absensiGuru={absensiGuru}
        izinGuru={izinGuru}
        pengaturanAbsen={pengaturanAbsen}
      />

      <RekapAbsenGuruModal
        isOpen={isRekapAbsenGuruModalOpen}
        onClose={() => setIsRekapAbsenGuruModalOpen(false)}
        gurus={gurus}
        absensiGuru={absensiGuru}
        izinGuru={izinGuru}
        sesiAbsensi={sesiAbsensi}
        tahunAjaranData={tahunAjaran}
        pengaturanAbsen={pengaturanAbsen}
      />

      <EditAbsenGuruModal
        isOpen={isEditAbsenGuruOpen}
        onClose={() => {
          setIsEditAbsenGuruOpen(false);
          setSelectedGuru(null);
        }}
        selectedGuru={selectedGuru}
        selectedDate={selectedDate}
        absensiGuru={absensiGuru}
        onSave={handleSaveEditAbsen}
      />
    </div>
  );
};

export default AbsenGuru;
