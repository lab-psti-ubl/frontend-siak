import React from 'react';
import { User, Kelas, Jurusan, TahunAjaran } from '../../../../../types';
import MuridDetailModal from './MuridDetailModal';
import MuridEditModal from '../modals/MuridEditModal';
import MuridQRModal from '../modals/MuridQRModal';

interface MuridModalsContainerProps {
  selectedMurid: User | null;
  currentKelas: Kelas | undefined;
  currentJurusan: Jurusan | undefined;
  qrCodeURL: string;
  detailTahunAjaran: string;
  detailSemester: number;
  isDetailModalOpen: boolean;
  isEditModalOpen: boolean;
  isQRModalOpen: boolean;
  tahunAjaran: TahunAjaran[];
  onCloseDetailModal: () => void;
  onCloseEditModal: () => void;
  onCloseQRModal: () => void;
  onDownloadQR: (murid: User) => void;
  onDownloadKartu: (murid: User) => void;
  onWhatsAppCall: (phone: string) => void;
  onDetailTahunAjaranChange: (tahun: string) => void;
  onDetailSemesterChange: (semester: number) => void;
  onEditSuccess: () => void;
}

const MuridModalsContainer: React.FC<MuridModalsContainerProps> = ({
  selectedMurid,
  currentKelas,
  currentJurusan,
  qrCodeURL,
  detailTahunAjaran,
  detailSemester,
  isDetailModalOpen,
  isEditModalOpen,
  isQRModalOpen,
  tahunAjaran,
  onCloseDetailModal,
  onCloseEditModal,
  onCloseQRModal,
  onDownloadQR,
  onDownloadKartu,
  onWhatsAppCall,
  onDetailTahunAjaranChange,
  onDetailSemesterChange,
  onEditSuccess
}) => {
  return (
    <>
      <MuridDetailModal
        isOpen={isDetailModalOpen}
        onClose={onCloseDetailModal}
        murid={selectedMurid}
        currentKelas={currentKelas}
        currentJurusan={currentJurusan}
        onDownloadKartu={onDownloadKartu}
        onWhatsAppCall={onWhatsAppCall}
        detailTahunAjaran={detailTahunAjaran}
        detailSemester={detailSemester}
      />

      <MuridEditModal
        isOpen={isEditModalOpen}
        onClose={onCloseEditModal}
        murid={selectedMurid}
        onSuccess={onEditSuccess}
      />

      <MuridQRModal
        isOpen={isQRModalOpen}
        onClose={onCloseQRModal}
        murid={selectedMurid}
        kelas={currentKelas}
        qrCodeURL={qrCodeURL}
        onDownloadQR={onDownloadQR}
      />
    </>
  );
};

export default MuridModalsContainer;