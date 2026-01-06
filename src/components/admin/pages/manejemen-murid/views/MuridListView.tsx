import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Plus, Upload, Search, Download, School } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import Modal from '../../../../ui/Modal';
import { User, Kelas, Jurusan, TahunAjaran, RiwayatKelasMurid, Alumni } from '../../../../../types';
import { useMurid } from '../../../../../hooks/useMurid';
import { useAuth } from '../../../../../context/AuthContext';
import { apiService } from '../../../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../../../ui/ToastContainer';
import MuridStatsCards from '../components/MuridStatsCards';
import MuridSearchFilters from '../components/MuridSearchFilters';
import MuridDataTable from '../components/MuridDataTable';
import MuridModalsContainer from '../components/MuridModalsContainer';
import ExcelImportModal from '../components/ExcelImportModal';
import { useMuridActions } from '../hooks/useMuridActions';
import { useMuridFilters } from '../hooks/useMuridFilters';
import { MuridImportData, createMuridFromImport } from '../../../../../utils/excelMuridImport';
import { generateAllMuridKartuPelajar } from '../../../../../utils/kartuPelajarUtils';
import { useBackgroundKTA } from '../../../../../hooks/useBackgroundKTA';
import { useOnboardingTourContext } from '../../../../../context/OnboardingTourContext';

interface MuridListViewProps {
  selectedKelas: string;
  selectedJurusan: string;
  kelas: Kelas[];
  jurusan: Jurusan[];
  users: User[];
  onBack: () => void;
  onAddMurid: (kelasId?: string) => void;
}

const MuridListView: React.FC<MuridListViewProps> = ({
  selectedKelas,
  selectedJurusan,
  kelas,
  jurusan,
  users,
  onBack,
  onAddMurid
}) => {
  const { user } = useAuth();
  const { refreshTour } = useOnboardingTourContext();
  const isKepalaSekolah = user?.role === 'kepala_sekolah';
  const { murid, refreshMurid } = useMurid({ kelasId: selectedKelas });
  const { backgroundKTA } = useBackgroundKTA();
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [isDownloadingAllKTA, setIsDownloadingAllKTA] = useState(false);
  const [ktaDownloadProgress, setKtaDownloadProgress] = useState({ current: 0, total: 0 });
  const [isOrientationModalOpen, setIsOrientationModalOpen] = useState(false);
  const [selectedOrientation, setSelectedOrientation] = useState<'potrait' | 'landscape'>('potrait');
  
  // Fetch tahunAjaran from API
  useEffect(() => {
    const fetchTahunAjaran = async () => {
      try {
        const response = await apiService.getAllTahunAjaran();
        if (response.success && response.tahunAjaran) {
          setTahunAjaran(response.tahunAjaran);
        }
      } catch (error) {
        console.error('Error fetching tahun ajaran:', error);
      }
    };
    fetchTahunAjaran();
  }, []);

  // Refresh murid data when navigating back from TambahMurid
  useEffect(() => {
    const shouldRefresh = sessionStorage.getItem('shouldRefreshMurid');
    if (shouldRefresh === 'true') {
      refreshMurid(true); // Clear all caches to ensure consistency
      sessionStorage.removeItem('shouldRefreshMurid');
    }
  }, [refreshMurid]);
  
  // Note: riwayatKelasMurid and alumni masih menggunakan localStorage untuk sementara
  // karena backend-nya belum dibuat. Ini bisa ditambahkan nanti jika diperlukan.
  const [riwayatKelasMuridLocal] = useState<RiwayatKelasMurid[]>(() => {
    try {
      const stored = localStorage.getItem('riwayatKelasMurid');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [alumniLocal] = useState<Alumni[]>(() => {
    try {
      const stored = localStorage.getItem('alumni');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMessage, setImportMessage] = useState({ type: '', text: '' });

  const currentKelas = kelas.find(k => k.id === selectedKelas);
  const currentJurusan = jurusan.find(j => j.id === selectedJurusan);

  // Buat Set dari ID murid yang sudah menjadi alumni
  const alumniMuridIds = new Set(alumniLocal.map(a => a.muridId));

  const muridKelas = murid.filter(u => {
    if (u.kelasId !== selectedKelas) return false;

    // Cek apakah murid sudah menjadi alumni
    if (alumniMuridIds.has(u.id)) return false;

    // Cek riwayat kelas murid sebagai backup
    const muridRiwayat = riwayatKelasMuridLocal.filter(r => r.muridId === u.id);
    const hasGraduated = muridRiwayat.some(r => r.status === 'lulus' || r.status === 'tidak_lulus');

    return !hasGraduated;
  });

  const {
    searchTerm,
    statusFilter,
    filteredMurid,
    setSearchTerm,
    setStatusFilter
  } = useMuridFilters(muridKelas);

  const {
    selectedMurid,
    isDetailModalOpen,
    isEditModalOpen,
    isQRModalOpen,
    qrCodeURL,
    detailTahunAjaran,
    detailSemester,
    setSelectedMurid,
    setIsDetailModalOpen,
    setIsEditModalOpen,
    setIsQRModalOpen,
    setQrCodeURL,
    setDetailTahunAjaran,
    setDetailSemester,
    handleViewDetail,
    handleEditMurid,
    handleDeleteMurid,
    handleViewQR,
    handleDownloadQR,
    handleDownloadKartuPelajar,
    handleWhatsAppCall,
    exportMuridData,
    toggleMuridStatus
  } = useMuridActions({
    currentKelas,
    currentJurusan,
    filteredMurid,
    tahunAjaran,
    refreshMurid
  });

  const activeMuridCount = muridKelas.filter(m => m.isActive !== false).length;

  // Create jurusan map for quick lookup
  const jurusanMap = useMemo(() => {
    const map = new Map<string, Jurusan>();
    jurusan.forEach(j => {
      map.set(j.id, j);
    });
    return map;
  }, [jurusan]);

  const handleOpenOrientationModal = () => {
    setIsOrientationModalOpen(true);
  };

  const handleDownloadAllKTA = async (orientation: 'potrait' | 'landscape') => {
    if (!currentKelas) {
      showErrorToast('Error', 'Data kelas tidak ditemukan');
      return;
    }

    if (muridKelas.length === 0) {
      showErrorToast('Error', 'Tidak ada murid yang dapat didownload');
      return;
    }

    setIsOrientationModalOpen(false);
    setIsDownloadingAllKTA(true);
    setKtaDownloadProgress({ current: 0, total: muridKelas.length });

    try {
      const backgroundDepan = backgroundKTA?.backgroundDepanMuridBase64;
      const backgroundBelakang = backgroundKTA?.backgroundBelakangMuridBase64;

      await generateAllMuridKartuPelajar(
        muridKelas,
        currentKelas,
        currentJurusan,
        jurusanMap,
        backgroundDepan,
        backgroundBelakang,
        orientation,
        (current, total) => {
          setKtaDownloadProgress({ current, total });
        }
      );

      showSuccessToast('Berhasil', `Berhasil download ${muridKelas.length} KTA murid`);
    } catch (error) {
      console.error('Error downloading all KTA:', error);
      showErrorToast('Error', 'Gagal mendownload semua KTA murid. Silakan coba lagi.');
    } finally {
      setIsDownloadingAllKTA(false);
      setKtaDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleImportExcel = async (importData: MuridImportData[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const data of importData) {
        try {
          const muridData = createMuridFromImport(data, selectedKelas);
          const response = await apiService.createMurid(muridData);
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setImportMessage({
          type: 'success',
          text: `Berhasil mengimport ${successCount} murid ke kelas ${currentKelas?.name}!${errorCount > 0 ? ` ${errorCount} gagal.` : ''}`
        });
        showSuccessToast('Import Berhasil', `Berhasil mengimport ${successCount} murid${errorCount > 0 ? `, ${errorCount} gagal` : ''}`);
        // Clear all caches and refresh to ensure all views get updated data
        refreshMurid(true);
        // Refresh tour untuk menampilkan modal berikutnya
        // Note: refreshTour() akan otomatis di-skip jika user klik "Nanti Saja" di menu ini
        setTimeout(() => {
          refreshTour();
        }, 100);
      } else {
        setImportMessage({
          type: 'error',
          text: 'Tidak ada murid yang berhasil diimport'
        });
        showErrorToast('Import Gagal', 'Tidak ada murid yang berhasil diimport');
      }

      setTimeout(() => {
        setImportMessage({ type: '', text: '' });
      }, 5000);
    } catch (error: any) {
      showErrorToast('Error', error.message || 'Terjadi kesalahan saat import murid');
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="secondary"
                onClick={onBack}
                className="!p-2 sm:!p-2.5 flex items-center justify-center flex-shrink-0"
              >
                <ArrowLeft size={16} className="sm:mr-1" />
                <span className="hidden sm:inline text-xs sm:text-sm">Kembali</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                  {currentKelas?.name}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100">
                  Kelola data murid kelas {currentKelas?.name}
                </p>
              </div>
            </div>
            {!isKepalaSekolah && (
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="secondary"
                  className="flex items-center justify-center text-xs sm:text-sm"
                >
                  <Upload size={14} className="sm:mr-2" />
                  <span className="hidden sm:inline">Import Excel</span>
                  <span className="sm:hidden">Import</span>
                </Button>
                <Button
                  onClick={() => onAddMurid(selectedKelas)}
                  className="flex items-center justify-center text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={14} className="sm:mr-2" />
                  <span className="hidden sm:inline">Tambah Murid</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {importMessage.text && (
        <Card className={`p-4 sm:p-5 lg:p-6 ${
          importMessage.type === 'success'
            ? 'bg-emerald-50 border-l-4 border-l-emerald-500'
            : 'bg-red-50 border-l-4 border-l-red-500'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              importMessage.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}></div>
            <p className={`text-xs sm:text-sm font-medium ${
              importMessage.type === 'success' ? 'text-emerald-900' : 'text-red-900'
            }`}>
              {importMessage.text}
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Murid</p>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{muridKelas.length}</p>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Murid Aktif</p>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{activeMuridCount}</p>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <School className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Tingkat</p>
              </div>

              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{currentKelas?.tingkat || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Cari nama, NISN, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
            <Button
              onClick={exportMuridData}
              variant="secondary"
              className="text-xs sm:text-sm flex items-center justify-center bg-green-600"
            >
              <Download size={14} className="sm:mr-2 text-white" />
              <span className="text-white">Export</span>
            </Button>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            Menampilkan <span className="font-semibold text-slate-900">{filteredMurid.length}</span> dari <span className="font-semibold text-slate-900">{muridKelas.length}</span> murid
          </div>
        </div>
      </div>

      {/* Download KTA Section - Above Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Download Kartu Pelajar</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Download semua KTA murid dalam format ZIP</p>
            </div>
            <Button
              onClick={handleOpenOrientationModal}
              disabled={isDownloadingAllKTA || muridKelas.length === 0}
              variant="secondary"
              className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap"
            >
              {isDownloadingAllKTA ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                  <span className="hidden sm:inline">
                    Downloading... ({ktaDownloadProgress.current}/{ktaDownloadProgress.total})
                  </span>
                  <span className="sm:hidden">
                    {ktaDownloadProgress.current}/{ktaDownloadProgress.total}
                  </span>
                </>
              ) : (
                <>
                  <Download size={14} className="sm:w-4 sm:h-4" />
                  <span>Download Semua KTA</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <MuridDataTable
        filteredMurid={filteredMurid}
        currentKelas={currentKelas}
        selectedKelas={selectedKelas}
        muridKelas={muridKelas}
        onViewDetail={handleViewDetail}
        onEditMurid={handleEditMurid}
        onDeleteMurid={handleDeleteMurid}
        onViewQR={handleViewQR}
        onDownloadQR={handleDownloadQR}
        onToggleStatus={toggleMuridStatus}
        onAddMurid={onAddMurid}
        isKepalaSekolah={isKepalaSekolah}
      />

      <MuridModalsContainer
        selectedMurid={selectedMurid}
        currentKelas={currentKelas}
        currentJurusan={currentJurusan}
        qrCodeURL={qrCodeURL}
        detailTahunAjaran={detailTahunAjaran}
        detailSemester={detailSemester}
        isDetailModalOpen={isDetailModalOpen}
        isEditModalOpen={isEditModalOpen}
        isQRModalOpen={isQRModalOpen}
        tahunAjaran={tahunAjaran}
        onEditSuccess={() => refreshMurid(true)}
        onCloseDetailModal={() => {
          setIsDetailModalOpen(false);
          setSelectedMurid(null);
          const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
          setDetailTahunAjaran(activeTahunAjaran?.tahun || '');
          setDetailSemester(activeTahunAjaran?.semester || 1);
        }}
        onCloseEditModal={() => {
          setIsEditModalOpen(false);
          setSelectedMurid(null);
        }}
        onCloseQRModal={() => {
          setIsQRModalOpen(false);
          setSelectedMurid(null);
          setQrCodeURL('');
        }}
        onDownloadQR={handleDownloadQR}
        onDownloadKartu={handleDownloadKartuPelajar}
        onWhatsAppCall={handleWhatsAppCall}
        onDetailTahunAjaranChange={setDetailTahunAjaran}
        onDetailSemesterChange={setDetailSemester}
      />

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportExcel}
        existingUsers={murid}
        defaultKelasId={selectedKelas}
      />

      {/* Orientation Selection Modal */}
      <Modal
        isOpen={isOrientationModalOpen}
        onClose={() => setIsOrientationModalOpen(false)}
        title="Pilih Orientasi KTA"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Pilih orientasi untuk semua kartu pelajar yang akan didownload:
          </p>

          <div className="space-y-3">
            <label className="block cursor-pointer">
              <input
                type="radio"
                name="orientation"
                value="potrait"
                checked={selectedOrientation === 'potrait'}
                onChange={(e) => setSelectedOrientation(e.target.value as 'potrait' | 'landscape')}
                className="hidden"
              />
              <div className={`p-4 rounded-lg border-2 transition-all ${
                selectedOrientation === 'potrait'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOrientation === 'potrait' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                  }`}>
                    {selectedOrientation === 'potrait' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Potrait</p>
                    <p className="text-xs text-slate-600">Kartu tegak (tinggi lebih besar dari lebar)</p>
                  </div>
                </div>
              </div>
            </label>

            <label className="block cursor-pointer">
              <input
                type="radio"
                name="orientation"
                value="landscape"
                checked={selectedOrientation === 'landscape'}
                onChange={(e) => setSelectedOrientation(e.target.value as 'potrait' | 'landscape')}
                className="hidden"
              />
              <div className={`p-4 rounded-lg border-2 transition-all ${
                selectedOrientation === 'landscape'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOrientation === 'landscape' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                  }`}>
                    {selectedOrientation === 'landscape' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Landscape</p>
                    <p className="text-xs text-slate-600">Kartu mendatar (lebar lebih besar dari tinggi)</p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={() => setIsOrientationModalOpen(false)}
              variant="secondary"
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={() => handleDownloadAllKTA(selectedOrientation)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MuridListView;