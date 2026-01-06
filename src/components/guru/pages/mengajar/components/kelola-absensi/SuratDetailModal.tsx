import React from 'react';
import Modal from '../../../../../ui/Modal';
import SuratIzinDisplay from '../../../../../shared/modals/SuratIzinDisplay';
import { SuratIzin, User, Kelas } from '../../../../../../types';

interface SuratDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSurat: SuratIzin | null;
  users: User[];
  kelas: Kelas[];
}

const SuratDetailModal: React.FC<SuratDetailModalProps> = ({
  isOpen,
  onClose,
  selectedSurat,
  users,
  kelas,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
  );
};

export default SuratDetailModal;
