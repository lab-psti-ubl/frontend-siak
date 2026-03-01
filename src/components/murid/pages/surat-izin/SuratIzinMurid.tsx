import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { useAuth } from '../../../../context/AuthContext';
import { useSuratIzin } from '../../../../hooks/useSuratIzin';
import { useMurid } from '../../../../hooks/useMurid';
import { useGurus } from '../../../../hooks/useGurus';
import { useKelas } from '../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { SuratIzin } from '../../../../types';
import { showSuccessNotification, showErrorNotification } from '../../../../utils/notificationUtils';
import { apiService } from '../../../../services/apiService';
import SuratIzinDisplay from '../../../shared/modals/SuratIzinDisplay';
import SuratIzinStats from './SuratIzinStats';
import SuratIzinTable from './SuratIzinTable';
import SuratIzinModal from './SuratIzinModal';
import { generateSuratPDF, getDisabledDates, getActiveIzinRanges } from './suratIzinMuridUtils';
import { useProfilSekolah } from '../../../../hooks/useProfilSekolah';
import { useLanguage } from '../../../../context/LanguageContext';

const SuratIzinMurid: React.FC = () => {
  const { user } = useAuth();
  const { suratIzin, loading: loadingSuratIzin, refreshSuratIzin } = useSuratIzin();
  const { murid, loading: loadingMurid } = useMurid();
  const { gurus, loading: loadingGurus } = useGurus();
  const { kelas, loading: loadingKelas } = useKelas();
  const { activeTahunAjaran } = useTahunAjaran();
  const { profilSekolah } = useProfilSekolah();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<SuratIzin | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    jenis: 'izin' as 'izin' | 'sakit' | 'izin_dispen',
    alasan: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    jamMulai: '',
    jamSelesai: '',
    bukti: '',
  });
  const [disabledDates, setDisabledDates] = useState<string[]>([]);
  const [activeIzinRanges, setActiveIzinRanges] = useState<Array<{ start: string; end: string }>>([]);
  const { t } = useLanguage();

  // Combine gurus and murid into users array for compatibility
  const users = [...gurus, ...murid];

  useEffect(() => {
    if (user?.id) {
      setDisabledDates(getDisabledDates(suratIzin, user.id));
      setActiveIzinRanges(getActiveIzinRanges(suratIzin, user.id));
    }
  }, [suratIzin, user?.id]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (formData.jenis === 'izin_dispen') {
      setFormData(prev => ({
        ...prev,
        tanggalMulai: today,
        tanggalSelesai: today
      }));
    }
  }, [formData.jenis]);

  // Show loading state
  if (loadingSuratIzin || loadingMurid || loadingGurus || loadingKelas) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-600">{t('muridSuratIzin.loading') || 'Memuat data...'}</p>
      </Card>
    );
  }

  const mySuratIzin = suratIzin.filter(s => s.muridId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.jenis === 'izin_dispen') {
      if (!formData.jamMulai || !formData.jamSelesai) {
        showErrorNotification(
          t('muridSuratIzin.validateJamTitle') || 'Validasi Jam',
          t('muridSuratIzin.validateJamRequired') || 'Jam mulai dan jam selesai harus diisi!'
        );
        return;
      }
      if (formData.jamMulai >= formData.jamSelesai) {
        showErrorNotification(
          t('muridSuratIzin.validateJamTitle') || 'Validasi Jam',
          t('muridSuratIzin.validateJamOrder') || 'Jam selesai harus lebih besar dari jam mulai'
        );
        return;
      }
    } else {
      if (!formData.bukti) {
        showErrorNotification(
          t('muridSuratIzin.validateBuktiTitle') || 'Bukti Pendukung Diperlukan',
          t('muridSuratIzin.validateBuktiRequired') ||
            'Bukti pendukung wajib diupload untuk surat izin dan surat sakit!'
        );
        return;
      }
      if (new Date(formData.tanggalMulai) > new Date(formData.tanggalSelesai)) {
        showErrorNotification(
          t('muridSuratIzin.validateTanggalTitle') || 'Tanggal Tidak Valid',
          t('muridSuratIzin.validateTanggalOrder') || 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai!'
        );
        return;
      }
    }

    if (!activeTahunAjaran) {
      showErrorNotification(
        t('muridSuratIzin.errorTitle') || 'Error',
        t('muridSuratIzin.errorNoTahunAjaran') ||
          'Tidak ada tahun ajaran aktif. Silakan hubungi administrator.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const tanggalMulai = formData.jenis === 'izin_dispen' ? new Date().toISOString().split('T')[0] : formData.tanggalMulai;
      const tanggalSelesai = formData.jenis === 'izin_dispen' ? new Date().toISOString().split('T')[0] : formData.tanggalSelesai;

      if (isEditMode && selectedSurat) {
        // Update surat izin
        const response = await apiService.updateSuratIzin(selectedSurat.id, {
          jenis: formData.jenis,
          alasan: formData.alasan,
          tanggalMulai,
          tanggalSelesai,
          jamMulai: formData.jamMulai || undefined,
          jamSelesai: formData.jamSelesai || undefined,
          bukti: formData.bukti || undefined,
        });

        if (response.success) {
          await refreshSuratIzin();
          showSuccessNotification(
            t('muridSuratIzin.successUpdateTitle') || 'Surat Berhasil Diubah',
            t('muridSuratIzin.successUpdateMessage') || 'Perubahan surat izin Anda telah disimpan.'
          );
          resetForm();
        } else {
          throw new Error(response.message || 'Gagal mengubah surat izin');
        }
      } else {
        // Create new surat izin
        const newSuratId = `surat${Date.now()}`;
        const response = await apiService.createSuratIzin({
          id: newSuratId,
          muridId: user?.id || '',
          jenis: formData.jenis,
          alasan: formData.alasan,
          tanggalMulai,
          tanggalSelesai,
          jamMulai: formData.jamMulai || undefined,
          jamSelesai: formData.jamSelesai || undefined,
          bukti: formData.bukti || undefined,
          status: 'menunggu',
          tahunAjaranId: activeTahunAjaran.id,
        });

        if (response.success) {
          await refreshSuratIzin();
          showSuccessNotification(
            t('muridSuratIzin.successCreateTitle') || 'Surat Berhasil Diajukan',
            (t('muridSuratIzin.successCreateMessage') ||
              `Surat ${formData.jenis === 'izin_dispen' ? 'izin dispen' : formData.jenis} Anda telah diajukan dan menunggu verifikasi wali kelas.`).replace(
              '{jenis}',
              formData.jenis === 'izin_dispen' ? 'izin dispen' : formData.jenis
            )
          );
          resetForm();
        } else {
          throw new Error(response.message || 'Gagal membuat surat izin');
        }
      }
    } catch (error: any) {
      console.error('Error submitting surat izin:', error);
      showErrorNotification(
        t('muridSuratIzin.errorTitle') || 'Error',
        error.message || t('muridSuratIzin.errorSave') || 'Terjadi kesalahan saat menyimpan surat izin'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      jenis: 'izin',
      alasan: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      jamMulai: '',
      jamSelesai: '',
      bukti: '',
    });
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedSurat(null);
  };

  const handleViewSurat = (surat: SuratIzin) => {
    setSelectedSurat(surat);
    setDetailModalOpen(true);
  };

  const handleDownloadSurat = async (surat: SuratIzin) => {
    await generateSuratPDF(surat, users, kelas, profilSekolah);
  };

  const handleEditSurat = (surat: SuratIzin) => {
    setSelectedSurat(surat);
    setIsEditMode(true);
    setFormData({
      jenis: surat.jenis,
      alasan: surat.alasan,
      tanggalMulai: surat.tanggalMulai,
      tanggalSelesai: surat.tanggalSelesai,
      jamMulai: surat.jamMulai || '',
      jamSelesai: surat.jamSelesai || '',
      bukti: surat.bukti || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteSurat = async (suratId: string) => {
    try {
      const response = await apiService.deleteSuratIzin(suratId);
      if (response.success) {
        await refreshSuratIzin();
        showSuccessNotification(
          t('muridSuratIzin.successDeleteTitle') || 'Surat Berhasil Dihapus',
          t('muridSuratIzin.successDeleteMessage') || 'Surat izin Anda telah dihapus.'
        );
      } else {
        throw new Error(response.message || 'Gagal menghapus surat izin');
      }
    } catch (error: any) {
      console.error('Error deleting surat izin:', error);
      showErrorNotification(
        t('muridSuratIzin.errorTitle') || 'Error',
        error.message || t('muridSuratIzin.errorDelete') || 'Terjadi kesalahan saat menghapus surat izin'
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="bg-blue-600 rounded-lg p-2 sm:p-3 shadow-md flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
                {t('muridSuratIzin.headerTitle') || 'Pengajuan Izin'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                {t('muridSuratIzin.headerSubtitle') || 'Ajukan surat izin atau sakit untuk keperluan Anda'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">
              {t('muridSuratIzin.addButton') || 'Ajukan Surat'}
            </span>
          </Button>
        </div>
      </div>

      <SuratIzinStats mySuratIzin={mySuratIzin} />

      <SuratIzinTable
        mySuratIzin={mySuratIzin}
        onViewSurat={handleViewSurat}
        onDownloadSurat={handleDownloadSurat}
        onEditSurat={handleEditSurat}
        onDeleteSurat={handleDeleteSurat}
      />

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title=""
        size="xl"
      >
        {selectedSurat && (
          <SuratIzinDisplay
            surat={selectedSurat}
            users={users}
            kelas={kelas}
            showVerificationSection={true}
          />
        )}
      </Modal>

      <SuratIzinModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
        onClose={resetForm}
        disabledDates={disabledDates}
        activeIzinRanges={activeIzinRanges}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SuratIzinMurid;
