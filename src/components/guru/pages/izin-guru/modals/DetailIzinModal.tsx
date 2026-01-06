import React from 'react';
import Modal from '../../../../ui/Modal';
import { IzinGuru } from '../../../../../types';
import { User } from '../../../../../types';
import IzinDetailContent from '../../../../shared/modals/IzinDetailContent';

interface DetailIzinModalProps {
  isOpen: boolean;
  onClose: () => void;
  izin: IzinGuru | null;
  user: User | null;
}

const DetailIzinModal: React.FC<DetailIzinModalProps> = ({ isOpen, onClose, izin, user }) => {
  if (!izin) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <IzinDetailContent izin={izin} user={user} showVerificationStatus={true} />
    </Modal>
  );
};

export default DetailIzinModal;
