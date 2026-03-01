import { useState } from 'react';
import { User, Kelas, Jurusan, TahunAjaran } from '../../../../../types';
import { generateQRCodeData, generateQRCodeURL, downloadQRCode } from '../../../../../utils/qrCodeGenerator';
import { generateMuridKartuPelajar } from '../../../../../utils/kartuPelajarUtils';
import { exportToExcel } from '../../../../../utils/exportUtils';
import { showDangerConfirmation } from '../../../../../utils/confirmationUtils';
import { apiService } from '../../../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../../../ui/ToastContainer';
import { shouldShowJurusanSync } from '../../../../../utils/jenjangPendidikanUtils';
import { useLanguage } from '../../../../../context/LanguageContext';

interface UseMuridActionsProps {
  currentKelas: Kelas | undefined;
  currentJurusan: Jurusan | undefined;
  filteredMurid: User[];
  tahunAjaran: TahunAjaran[];
  refreshMurid: () => void;
}

export const useMuridActions = ({
  currentKelas,
  currentJurusan,
  filteredMurid,
  tahunAjaran,
  refreshMurid
}: UseMuridActionsProps) => {
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const [detailTahunAjaran, setDetailTahunAjaran] = useState<string>(() => {
    const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
    return activeTahunAjaran?.tahun || '';
  });
  const [detailSemester, setDetailSemester] = useState<number>(() => {
    const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
    return activeTahunAjaran?.semester || 1;
  });
  const { language } = useLanguage();

  const handleViewDetail = (murid: User) => {
    setSelectedMurid(murid);
    setIsDetailModalOpen(true);
  };

  const handleEditMurid = (murid: User) => {
    setSelectedMurid(murid);
    setIsEditModalOpen(true);
  };

  const handleDeleteMurid = async (murid: User) => {
    showDangerConfirmation(
      'Hapus Data Murid',
      `Apakah Anda yakin ingin menghapus murid "${murid.name}"?\n\nTindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait murid.`,
      async () => {
        try {
          const response = await apiService.deleteMurid(murid.id);
          if (response.success) {
            showSuccessToast('Berhasil', 'Murid berhasil dihapus');
            // Clear all caches and refresh to ensure all views get updated data
            refreshMurid(true);
          } else {
            showErrorToast('Error', response.message || 'Gagal menghapus murid');
          }
        } catch (error: any) {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat menghapus murid');
        }
      },
      {
        confirmText: 'Ya, Hapus Murid',
        cancelText: 'Batal'
      }
    );
  };

  const handleViewQR = async (murid: User) => {
    setSelectedMurid(murid);
    const qrData = generateQRCodeData(murid.id, murid.nisn || '', murid.name, murid.kelasId || '');
    const url = await generateQRCodeURL(qrData, 300);
    setQrCodeURL(url);
    setIsQRModalOpen(true);
  };

  const handleDownloadQR = async (murid: User) => {
    const qrData = generateQRCodeData(murid.id, murid.nisn || '', murid.name, murid.kelasId || '');
    await downloadQRCode(qrData, `qr-${murid.name.replace(/\s+/g, '-')}`);
  };

  const handleDownloadKartuPelajar = async (murid: User) => {
    if (!currentKelas) {
      alert('Data kelas tidak lengkap');
      return;
    }

    const showJurusan = shouldShowJurusanSync();
    if (showJurusan && !currentJurusan) {
      alert('Data jurusan tidak lengkap');
      return;
    }

    try {
      await generateMuridKartuPelajar(
        murid,
        currentKelas,
        showJurusan ? currentJurusan : undefined,
        undefined,
        undefined,
        'potrait',
        language
      );
      alert('Kartu pelajar berhasil diunduh!');
    } catch (error) {
      console.error('Error generating kartu pelajar:', error);
      alert('Terjadi kesalahan saat membuat kartu pelajar');
    }
  };

  const handleWhatsAppCall = (phone: string) => {
    if (!phone) {
      alert('Nomor WhatsApp tidak tersedia');
      return;
    }
    
    let formattedPhone = phone.replace(/\D/g, '');
    
    if (!formattedPhone.startsWith('62') && formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62') && !formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone;
    }
    
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportMuridData = () => {
    const showJurusan = shouldShowJurusanSync();
    
    const data = filteredMurid.map(murid => {
      const baseData: any = {
        nisn: murid.nisn,
        nama: murid.name,
        email: murid.email,
        kelas: currentKelas?.name,
        whatsappOrtu: murid.whatsappOrtu || '-',
        tanggalBergabung: murid.createdAt ? new Date(murid.createdAt).toLocaleDateString('id-ID') : '-',
        status: murid.isActive !== false ? 'Aktif' : 'Tidak Aktif'
      };
      
      if (showJurusan) {
        baseData.jurusan = currentJurusan?.name || '-';
      }
      
      return baseData;
    });

    const baseColumns = [
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Nama Murid', dataKey: 'nama', width: 25 },
      { header: 'Email', dataKey: 'email', width: 25 },
      { header: 'Kelas', dataKey: 'kelas', width: 15 },
    ];

    const jurusanColumn = showJurusan 
      ? [{ header: 'Jurusan', dataKey: 'jurusan', width: 20 }]
      : [];

    const endColumns = [
      { header: 'WhatsApp Ortu', dataKey: 'whatsappOrtu', width: 15 },
      { header: 'Tanggal Bergabung', dataKey: 'tanggalBergabung', width: 15 },
      { header: 'Status', dataKey: 'status', width: 10 }
    ];

    const columns = [...baseColumns, ...jurusanColumn, ...endColumns];

    let title = `DATA MURID\nKelas: ${currentKelas?.name}`;
    if (showJurusan) {
      title += `\nJurusan: ${currentJurusan?.name || '-'}`;
    }
    const filename = `data-murid-${currentKelas?.name}-${new Date().toISOString().split('T')[0]}`;
    
    exportToExcel(data, columns, title, filename);
  };

  const toggleMuridStatus = async (id: string) => {
    try {
      const response = await apiService.toggleMuridStatus(id);
      if (response.success) {
        showSuccessToast('Berhasil', `Murid berhasil ${response.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        // Clear all caches and refresh to ensure all views get updated data
        refreshMurid(true);
      } else {
        showErrorToast('Error', response.message || 'Gagal mengubah status murid');
      }
    } catch (error: any) {
      showErrorToast('Error', error.message || 'Terjadi kesalahan saat mengubah status murid');
    }
  };

  return {
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
  };
};