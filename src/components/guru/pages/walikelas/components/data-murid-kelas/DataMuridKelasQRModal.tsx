import React from 'react';
import { Download, QrCode } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import { User, Kelas } from '../../../../../../types';

interface DataMuridKelasQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  qrCodeURL: string;
  targetKelas: any;
  kelas: Kelas[];
  onDownloadQR: (murid: User) => void;
}

const DataMuridKelasQRModal: React.FC<DataMuridKelasQRModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  qrCodeURL,
  targetKelas,
  kelas,
  onDownloadQR
}) => {
  if (!selectedMurid) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`QR Code - ${selectedMurid.name}`}
      size="md"
    >
      <div className="pb-12 sm:pb-0 space-y-5 sm:space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border-2 border-blue-200 p-4 sm:p-6 flex items-center justify-center min-h-80">
          {qrCodeURL ? (
            <img
              src={qrCodeURL}
              alt="QR Code"
              className="w-56 h-56 sm:w-72 sm:h-72 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-sm text-slate-600 font-medium">Membuat QR Code...</p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Nama Murid</p>
            <p className="text-sm sm:text-base font-bold text-slate-900">{selectedMurid.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">NISN</p>
              <p className="text-xs sm:text-sm font-mono bg-white px-2 py-1 rounded text-slate-700 break-all">{selectedMurid.nisn}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Kelas Saat Ini</p>
              <p className="text-xs sm:text-sm font-bold text-slate-700">{kelas.find(k => k.id === selectedMurid.kelasId)?.name || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Periode Dipilih</p>
            <p className="text-sm sm:text-base font-bold text-slate-900">{targetKelas?.name || '-'}</p>
          </div>
        </div>

        <Button
          onClick={() => selectedMurid && onDownloadQR(selectedMurid)}
          fullWidth
          className="text-xs sm:text-sm py-2.5 sm:py-3 justify-center flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download QR Code
        </Button>
      </div>
    </Modal>
  );
};

export default DataMuridKelasQRModal;