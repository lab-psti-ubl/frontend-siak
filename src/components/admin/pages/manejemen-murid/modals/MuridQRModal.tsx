import React from 'react';
import { QrCode, Download, User as UserIcon } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { User, Kelas } from '../../../../../types';

interface MuridQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  murid: User | null;
  kelas: Kelas | undefined;
  qrCodeURL: string;
  onDownloadQR: (murid: User) => void;
}

const MuridQRModal: React.FC<MuridQRModalProps> = ({
  isOpen,
  onClose,
  murid,
  kelas,
  qrCodeURL,
  onDownloadQR
}) => {
  if (!murid) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`QR Code - ${murid.name}`}
      size="md"
    >
      <div className="text-center space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
          {qrCodeURL ? (
            <img 
              src={qrCodeURL} 
              alt="QR Code" 
              className="w-64 h-64 object-contain"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">{murid.name}</p>
          <p className="text-sm text-gray-600">NISN: {murid.nisn}</p>
          <p className="text-sm text-gray-600">Kelas: {kelas?.name}</p>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Cara Penggunaan:</h4>
          <ul className="text-sm text-yellow-800 space-y-1 text-left">
            <li>• QR Code ini digunakan untuk absensi murid</li>
            <li>• Tunjukkan kepada guru saat sesi absensi dibuka</li>
            <li>• Download untuk backup atau print kartu pelajar</li>
          </ul>
        </div>
        
        <Button 
          onClick={() => onDownloadQR(murid)}
          fullWidth
          className="justify-center flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download QR Code
        </Button>
      </div>
    </Modal>
  );
};

export default MuridQRModal;