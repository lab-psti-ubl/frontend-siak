import React from 'react';
import Modal from '../../../ui/Modal';
import SuratIzinForm from './SuratIzinForm';

interface SuratIzinModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  formData: {
    jenis: 'izin' | 'sakit' | 'izin_dispen';
    alasan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    jamMulai: string;
    jamSelesai: string;
    bukti: string;
  };
  onFormChange: (formData: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  disabledDates: string[];
  activeIzinRanges: Array<{ start: string; end: string }>;
  isSubmitting?: boolean;
}

const SuratIzinModal: React.FC<SuratIzinModalProps> = ({
  isOpen,
  isEditMode,
  formData,
  onFormChange,
  onSubmit,
  onClose,
  disabledDates,
  activeIzinRanges,
  isSubmitting = false,
}) => {
  const getModalTitle = () => {
    if (isEditMode) {
      return 'Edit Surat Izin';
    }
    return formData.jenis === 'izin_dispen' ? 'Ajukan Izin Dispen' : 'Ajukan Surat Izin/Sakit';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="md"
    >
      <SuratIzinForm
        isEditMode={isEditMode}
        formData={formData}
        onFormChange={onFormChange}
        onSubmit={onSubmit}
        onCancel={onClose}
        disabledDates={disabledDates}
        activeIzinRanges={activeIzinRanges}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
};

export default SuratIzinModal;
