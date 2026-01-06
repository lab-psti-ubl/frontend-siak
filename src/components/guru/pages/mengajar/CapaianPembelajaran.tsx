import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, AlertCircle } from 'lucide-react';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { useAuth } from '../../../../context/AuthContext';
import { CapaianPembelajaran as CapaianPembelajaranType, CapaianPembelajaranKelas } from '../../../../types';
import { useCapaianPembelajaranKelas } from '../../../../hooks/useCapaianPembelajaranKelas';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { apiService } from '../../../../services/apiService';
import { showSuccessNotification, showErrorNotification } from '../../../../utils/notificationUtils';
import CapaianPembelajaranTingkatView from './components/capaian-pembelajaran/CapaianPembelajaranTingkatView';
import CapaianPembelajaranFormModal from './components/capaian-pembelajaran/CapaianPembelajaranFormModal';
import CapaianPembelajaranDetailModal from './components/capaian-pembelajaran/CapaianPembelajaranDetailModal';
import { getAvailableTingkat, getAvailableMataPelajaran } from './components/capaian-pembelajaran/capaianPembelajaranUtils';

const CapaianPembelajaran: React.FC = () => {
  const { user } = useAuth();
  const { activeTahunAjaran } = useTahunAjaran();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { jadwalPelajaran } = useJadwalPelajaran(
    activeTahunAjaran && user?.id
      ? {
          guruId: user.id,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  const { capaianPembelajaran, loading, refreshCapaianPembelajaran } = useCapaianPembelajaranKelas(
    activeTahunAjaran && user?.id
      ? {
          guruId: user.id,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTingkat, setEditingTingkat] = useState<number | ''>('');
  const [editingMataPelajaranId, setEditingMataPelajaranId] = useState<string>('');
  const [selectedTingkat, setSelectedTingkat] = useState<number | ''>('');
  const [selectedMataPelajaranId, setSelectedMataPelajaranId] = useState<string>('');
  const [capaianText, setCapaianText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{ tingkat: number; mataPelajaranId: string; capaianPembelajaran: string } | null>(null);

  // Get unique grade levels taught by this teacher
  const availableTingkat = useMemo(
    () => getAvailableTingkat(jadwalPelajaran, kelas),
    [jadwalPelajaran, kelas]
  );

  // Get available subjects for selected grade level
  const allAvailableMataPelajaran = useMemo(
    () => getAvailableMataPelajaran(selectedTingkat, jadwalPelajaran, kelas, mataPelajaran),
    [selectedTingkat, jadwalPelajaran, kelas, mataPelajaran]
  );

  // Filter out mata pelajaran that already have capaian pembelajaran for the selected tingkat
  const availableMataPelajaran = useMemo(() => {
    // If no tingkat selected, return all available
    if (!selectedTingkat) {
      return allAvailableMataPelajaran;
    }

    // If in edit mode, ensure the mata pelajaran being edited is included
    let result = [...allAvailableMataPelajaran];
    if (isEditMode && editingMataPelajaranId && editingTingkat === selectedTingkat) {
      const editingMapel = mataPelajaran.find(m => m.id === editingMataPelajaranId);
      if (editingMapel && !result.find(m => m.id === editingMapel.id)) {
        result.push(editingMapel);
      }
    }

    // If no capaian pembelajaran data yet, return all available
    if (!capaianPembelajaran || !capaianPembelajaran.tingkatData) {
      return result;
    }

    // Find tingkat data for selected tingkat
    const tingkatData = capaianPembelajaran.tingkatData.find(td => td.tingkat === selectedTingkat);
    
    // If no data for this tingkat, return all available
    if (!tingkatData || !tingkatData.mataPelajaranData || tingkatData.mataPelajaranData.length === 0) {
      return result;
    }

    // Get list of mata pelajaran IDs that already have capaian pembelajaran
    const existingMataPelajaranIds = new Set(
      tingkatData.mataPelajaranData.map(mpd => String(mpd.mataPelajaranId))
    );

    // Filter out mata pelajaran that already have capaian pembelajaran
    // But keep the one being edited (if in edit mode and same tingkat)
    return result.filter(mapel => {
      // If editing the same tingkat and this is the mata pelajaran being edited, keep it
      if (isEditMode && editingTingkat === selectedTingkat && editingMataPelajaranId === mapel.id) {
        return true;
      }
      // Also keep if it's the currently selected mata pelajaran in edit mode
      if (isEditMode && selectedMataPelajaranId === mapel.id) {
        return true;
      }
      // Otherwise, exclude if it already has capaian pembelajaran
      return !existingMataPelajaranIds.has(String(mapel.id));
    });
  }, [selectedTingkat, allAvailableMataPelajaran, capaianPembelajaran, isEditMode, editingTingkat, editingMataPelajaranId, selectedMataPelajaranId, mataPelajaran]);

  // Reset mata pelajaran when tingkat changes (but not when editing)
  useEffect(() => {
    if (selectedTingkat && !isEditMode) {
      setSelectedMataPelajaranId('');
    }
  }, [selectedTingkat, isEditMode]);

  const handleOpenModal = (tingkat?: number, mataPelajaranId?: string) => {
    setIsEditMode(false);
    setEditingTingkat('');
    setEditingMataPelajaranId('');
    setSelectedTingkat(tingkat || '');
    setSelectedMataPelajaranId(mataPelajaranId || '');
    setCapaianText('');
    setIsModalOpen(true);
  };

  const handleEdit = (tingkat: number, mataPelajaranId: string, capaianPembelajaran: string) => {
    setIsEditMode(true);
    setEditingTingkat(tingkat);
    setEditingMataPelajaranId(mataPelajaranId);
    setSelectedTingkat(tingkat);
    setSelectedMataPelajaranId(mataPelajaranId);
    setCapaianText(capaianPembelajaran);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingTingkat('');
    setEditingMataPelajaranId('');
    setSelectedTingkat('');
    setSelectedMataPelajaranId('');
    setCapaianText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeTahunAjaran || !user?.id) {
      showErrorNotification('Error', 'Tahun ajaran atau data guru tidak ditemukan');
      return;
    }

    if (!selectedTingkat || !selectedMataPelajaranId || !capaianText.trim()) {
      showErrorNotification('Validasi Gagal', 'Semua field wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use new structure endpoint
      const response = await apiService.addOrUpdateCapaianPembelajaranItem({
        guruId: user.id,
        tahunAjaran: activeTahunAjaran.tahun,
        semester: activeTahunAjaran.semester,
        tingkat: selectedTingkat as number,
        mataPelajaranId: selectedMataPelajaranId,
        capaianPembelajaran: capaianText.trim(),
      });

      if (response.success) {
        showSuccessNotification('Berhasil', isEditMode ? 'Capaian pembelajaran berhasil diperbarui' : 'Capaian pembelajaran berhasil ditambahkan');
        refreshCapaianPembelajaran();
        handleCloseModal();
      } else {
        showErrorNotification('Gagal', response.message || (isEditMode ? 'Gagal memperbarui capaian pembelajaran' : 'Gagal menambahkan capaian pembelajaran'));
      }
    } catch (error: any) {
      console.error('Error submitting capaian pembelajaran:', error);
      showErrorNotification('Error', error.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tingkat: number, mataPelajaranId: string) => {
    if (!activeTahunAjaran || !user?.id) {
      showErrorNotification('Error', 'Tahun ajaran atau data guru tidak ditemukan');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus capaian pembelajaran ini?')) {
      return;
    }

    try {
      const response = await apiService.deleteCapaianPembelajaranItem({
        guruId: user.id,
        tahunAjaran: activeTahunAjaran.tahun,
        semester: activeTahunAjaran.semester,
        tingkat,
        mataPelajaranId,
      });
      if (response.success) {
        showSuccessNotification('Berhasil', 'Capaian pembelajaran berhasil dihapus');
        refreshCapaianPembelajaran();
      } else {
        showErrorNotification('Gagal', response.message || 'Gagal menghapus capaian pembelajaran');
      }
    } catch (error: any) {
      console.error('Error deleting capaian pembelajaran:', error);
      showErrorNotification('Error', error.message || 'Terjadi kesalahan saat menghapus data');
    }
  };

  const handleViewDetail = (tingkat: number, mataPelajaranId: string, capaianPembelajaran: string) => {
    setSelectedDetail({ tingkat, mataPelajaranId, capaianPembelajaran });
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDetail(null);
  };

  const getMataPelajaranName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  if (!activeTahunAjaran) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Capaian Pembelajaran</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Kelola capaian pembelajaran untuk mata pelajaran yang Anda ajarkan</p>
        </div>
        <Card className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tahun Ajaran Tidak Aktif</h3>
          <p className="text-gray-600">Tidak ada tahun ajaran yang sedang aktif. Hubungi admin untuk mengaktifkan tahun ajaran.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Capaian Pembelajaran</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Kelola capaian pembelajaran untuk {activeTahunAjaran.tahun} Semester {activeTahunAjaran.semester}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant="info">
            {activeTahunAjaran.tahun} - Semester {activeTahunAjaran.semester}
          </Badge>
          <Button
            onClick={handleOpenModal}
            variant="primary"
            size="md"
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tambah Capaian</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </Card>
      ) : !capaianPembelajaran || !capaianPembelajaran.tingkatData || capaianPembelajaran.tingkatData.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Capaian Pembelajaran</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan capaian pembelajaran untuk mata pelajaran yang Anda ajarkan.</p>
          <Button onClick={() => handleOpenModal()} variant="primary">
            
            Tambah Capaian Pembelajaran
          </Button>
        </Card>
      ) : (
        <CapaianPembelajaranTingkatView
          capaianPembelajaran={capaianPembelajaran}
          getMataPelajaranName={getMataPelajaranName}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleOpenModal}
        />
      )}

      {/* Form Modal */}
      <CapaianPembelajaranFormModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        isSubmitting={isSubmitting}
        selectedTingkat={selectedTingkat}
        selectedMataPelajaranId={selectedMataPelajaranId}
        capaianText={capaianText}
        availableTingkat={availableTingkat}
        availableMataPelajaran={availableMataPelajaran}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onTingkatChange={setSelectedTingkat}
        onMataPelajaranChange={setSelectedMataPelajaranId}
        onCapaianTextChange={setCapaianText}
      />

      {/* Detail Modal */}
      {selectedDetail && (
        <CapaianPembelajaranDetailModal
          isOpen={isDetailModalOpen}
          selectedDetail={{
            id: `${capaianPembelajaran?.id || ''}-${selectedDetail.tingkat}-${selectedDetail.mataPelajaranId}`,
            guruId: user?.id || '',
            tingkat: selectedDetail.tingkat,
            mataPelajaranId: selectedDetail.mataPelajaranId,
            capaianPembelajaran: selectedDetail.capaianPembelajaran,
            tahunAjaran: activeTahunAjaran?.tahun || '',
            semester: activeTahunAjaran?.semester || 1,
            createdAt: capaianPembelajaran?.createdAt || new Date().toISOString(),
          }}
          getMataPelajaranName={getMataPelajaranName}
          onClose={handleCloseDetailModal}
          onEdit={() => handleEdit(selectedDetail.tingkat, selectedDetail.mataPelajaranId, selectedDetail.capaianPembelajaran)}
        />
      )}
    </div>
  );
};

export default CapaianPembelajaran;
