import React from 'react';
import { User, Mail, Phone, Calendar, Download, CreditCard } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { User as UserType, Kelas, Jurusan } from '../../../../../types';
import { shouldShowJurusanSync } from '../../../../../utils/jenjangPendidikanUtils';

interface MuridDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  murid: UserType | null;
  kelas: Kelas | undefined;
  jurusan: Jurusan | undefined;
  onDownloadKartu: (murid: UserType) => void;
  onWhatsAppCall: (phone: string) => void;
}

const MuridDetailModal: React.FC<MuridDetailModalProps> = ({
  isOpen,
  onClose,
  murid,
  kelas,
  jurusan,
  onDownloadKartu,
  onWhatsAppCall
}) => {
  if (!murid) return null;

  const showJurusan = shouldShowJurusanSync();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Murid"
      size="lg"
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {getInitials(murid.name)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{murid.name}</h3>
            <p className="text-blue-600 font-medium">NISN: {murid.nisn}</p>
            <div className="flex items-center mt-2 space-x-2">
              <Badge variant="info">{kelas?.name}</Badge>
              {showJurusan && jurusan && <Badge variant="warning">{jurusan.name}</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Informasi Kontak</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail size={16} className="mr-3 text-gray-400" />
                <span className="text-gray-700 break-all">{murid.email}</span>
              </div>
              {murid.whatsappOrtu ? (
                <button
                  onClick={() => onWhatsAppCall(murid.whatsappOrtu || '')}
                  className="flex items-center text-green-600 hover:text-green-700 transition-colors group"
                  title="Hubungi Orang Tua via WhatsApp"
                >
                  <Phone size={16} className="mr-3" />
                  <span className="text-gray-700 group-hover:text-green-700">{murid.whatsappOrtu}</span>
                  <span className="ml-2 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    (Klik untuk WhatsApp)
                  </span>
                </button>
              ) : (
                <div className="flex items-center">
                  <Phone size={16} className="mr-3 text-gray-400" />
                  <span className="text-gray-400">Tidak ada nomor orang tua</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Informasi Akademik</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Kelas:</span>
                <Badge variant="info">{kelas?.name}</Badge>
              </div>
              {showJurusan && jurusan && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Jurusan:</span>
                  <Badge variant="warning">{jurusan.name}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                {murid.isActive !== false ? (
                  <Badge variant="success">Aktif</Badge>
                ) : (
                  <Badge variant="default">Tidak Aktif</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Bergabung:</span>
                <span className="text-gray-700">
                  {murid.createdAt ? new Date(murid.createdAt).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <Button 
            onClick={() => onDownloadKartu(murid)}
            fullWidth
            className="justify-center flex items-center"
          >
            <CreditCard size={16} className="mr-2" />
            Download Kartu Pelajar
          </Button>
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={onClose}
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MuridDetailModal;