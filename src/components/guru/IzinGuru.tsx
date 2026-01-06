import React, { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useIzinGuru } from '../../hooks/useIzinGuru';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { IzinGuru } from '../../types';
import { showSuccessNotification, showErrorNotification } from '../../utils/notificationUtils';
import { getActiveIzin, validateDates } from './pages/izin-guru/utils/izinGuruUtils';
import { apiService } from '../../services/apiService';
import IzinGuruStatsCards from './pages/izin-guru/components/IzinGuruStatsCards';
import ActiveIzinCard from './pages/izin-guru/components/ActiveIzinCard';
import IzinGuruTable from './pages/izin-guru/components/IzinGuruTable';
import FormIzinModal, { FormData } from './pages/izin-guru/modals/FormIzinModal';
import DetailIzinModal from './pages/izin-guru/modals/DetailIzinModal';

const IzinGuruComponent: React.FC = () => {
  const { user } = useAuth();
  const { izinGuru, loading: loadingIzinGuru, refreshIzinGuru } = useIzinGuru({ guruId: user?.id });
  const { activeTahunAjaran } = useTahunAjaran();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState<IzinGuru | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myIzin = izinGuru
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = async (formData: FormData) => {
    let tanggalSelesai = formData.tanggalSelesai;
    if (formData.jenis === 'izin_dispen') {
      tanggalSelesai = formData.tanggalMulai;
    }

    const validation = validateDates(formData.tanggalMulai, tanggalSelesai);

    if (!validation.valid) {
      showErrorNotification('Tanggal Tidak Valid', validation.error || 'Tanggal tidak valid');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedIzin) {
        // Update existing izin
        const updateData = {
          jenis: formData.jenis,
          alasan: formData.alasan,
          tanggalMulai: formData.tanggalMulai,
          tanggalSelesai: tanggalSelesai,
          jamMulai: formData.jamMulai || undefined,
          jamSelesai: formData.jamSelesai || undefined,
          bukti: formData.bukti || undefined,
          guruPenggantiList: formData.guruPenggantiList || [],
        };

        const response = await apiService.updateIzinGuru(selectedIzin.id, updateData);
        
        if (response.success) {
          await refreshIzinGuru();
          const jenisDisplay = formData.jenis === 'izin_dispen' ? 'Izin Dispen' : (formData.jenis.charAt(0).toUpperCase() + formData.jenis.slice(1));
          showSuccessNotification(
            'Pengajuan Berhasil Diperbarui',
            `Pengajuan ${jenisDisplay} Anda telah diperbarui.`
          );
          setSelectedIzin(null);
          setIsModalOpen(false);
        } else {
          showErrorNotification('Gagal', response.message || 'Gagal memperbarui pengajuan izin');
        }
      } else {
        // Create new izin
        const newIzinData = {
          id: `izin-guru-${Date.now()}`,
          guruId: user?.id || '',
          jenis: formData.jenis,
          alasan: formData.alasan,
          tanggalMulai: formData.tanggalMulai,
          tanggalSelesai: tanggalSelesai,
          jamMulai: formData.jamMulai || undefined,
          jamSelesai: formData.jamSelesai || undefined,
          bukti: formData.bukti || undefined,
          guruPenggantiList: formData.guruPenggantiList || [],
          status: 'menunggu',
          tahunAjaranId: activeTahunAjaran?.id || '',
        };

        const response = await apiService.createIzinGuru(newIzinData);
        
        if (response.success) {
          await refreshIzinGuru();
          const jenisDisplay = formData.jenis === 'izin_dispen' ? 'Izin Dispen' : (formData.jenis.charAt(0).toUpperCase() + formData.jenis.slice(1));
          showSuccessNotification(
            'Pengajuan Berhasil Dikirim',
            `Pengajuan ${jenisDisplay} Anda telah dikirim dan menunggu persetujuan admin.`
          );
          setIsModalOpen(false);
        } else {
          showErrorNotification('Gagal', response.message || 'Gagal membuat pengajuan izin');
        }
      }
    } catch (error: any) {
      console.error('Error submitting izin:', error);
      showErrorNotification('Gagal', error.message || 'Terjadi kesalahan saat mengirim pengajuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = (izin: IzinGuru) => {
    setSelectedIzin(izin);
    setIsDetailModalOpen(true);
  };

  const handleEditIzin = (izin: IzinGuru) => {
    setSelectedIzin(izin);
    setIsModalOpen(true);
  };

  const handleDeleteIzin = async (izin: IzinGuru) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengajuan izin ini?')) {
      try {
        const response = await apiService.deleteIzinGuru(izin.id);
        if (response.success) {
          await refreshIzinGuru();
          showSuccessNotification('Berhasil', 'Pengajuan izin telah dihapus');
        } else {
          showErrorNotification('Gagal', response.message || 'Gagal menghapus pengajuan izin');
        }
      } catch (error: any) {
        console.error('Error deleting izin:', error);
        showErrorNotification('Gagal', error.message || 'Terjadi kesalahan saat menghapus pengajuan');
      }
    }
  };

  const pendingIzin = myIzin.filter(i => i.status === 'menunggu');
  const approvedIzin = myIzin.filter(i => i.status === 'diterima');
  const rejectedIzin = myIzin.filter(i => i.status === 'ditolak');

  const activeIzin = getActiveIzin(myIzin);

  if (loadingIzinGuru) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Pengajuan Izin</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Ajukan izin, sakit, cuti, atau dispen kepada admin</p>
        </div>
        <Button
        onClick={() => setIsModalOpen(true)}
        className="w-full sm:w-auto justify-center flex items-center gap-2 text-sm sm:text-base"
      >
        <Plus size={18} />
        Ajukan Izin
      </Button>
        {/* <div className="flex-shrink-0">
          <Badge variant="info" className="inline-block text-xs sm:text-sm">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Badge>
        </div> */}
      </div>

      

      {activeIzin && (
        <ActiveIzinCard
          activeIzin={activeIzin}
          onViewDetail={handleViewDetail}
        />
      )}

      <IzinGuruStatsCards
        pendingCount={pendingIzin.length}
        approvedCount={approvedIzin.length}
        rejectedCount={rejectedIzin.length}
      />

      <IzinGuruTable
        izinList={myIzin}
        onViewDetail={handleViewDetail}
        onEdit={handleEditIzin}
        onDelete={handleDeleteIzin}
      />

      <FormIzinModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIzin(null);
        }}
        onSubmit={handleSubmit}
        guruId={user?.id || ''}
        editingIzin={selectedIzin}
        isSubmitting={isSubmitting}
      />

      <DetailIzinModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedIzin(null);
        }}
        izin={selectedIzin}
        user={user}
      />
    </div>
  );
};

export default IzinGuruComponent;
