import React from 'react';
import Modal from '../../../../../ui/Modal';
import { SesiAbsensi } from '../../../../../../types';

interface SubjectQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSesiForQR: SesiAbsensi | null;
  subjectQRCodeURL: string;
  getJadwalInfo: (jadwalId: string) => { kelas: string; mapel: string };
}

const SubjectQRModal: React.FC<SubjectQRModalProps> = ({
  isOpen,
  onClose,
  selectedSesiForQR,
  subjectQRCodeURL,
  getJadwalInfo,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code Mata Pelajaran"
      size="md"
    >
      {selectedSesiForQR && (
        <div className="text-center space-y-4 pb-12 sm:pb-5">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              {getJadwalInfo(selectedSesiForQR.jadwalId).mapel}
            </h4>
            <p className="text-sm text-blue-700">
              {getJadwalInfo(selectedSesiForQR.jadwalId).kelas} • {new Date(selectedSesiForQR.tanggal).toLocaleDateString('id-ID')}
            </p>
            <p className="text-sm text-blue-700">
              {selectedSesiForQR.jamBuka} - {selectedSesiForQR.jamTutup || 'Aktif'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
            {subjectQRCodeURL ? (
              <img
                src={subjectQRCodeURL}
                alt="QR Code Mata Pelajaran"
                className="w-80 h-80 object-contain"
              />
            ) : (
              <div className="w-80 h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg ">
            <h4 className="font-medium text-yellow-900 mb-2">Cara Penggunaan:</h4>
            <ul className="text-sm text-yellow-800 space-y-1 text-left">
              <li>• Tampilkan QR Code ini kepada murid</li>
              <li>• Murid scan QR Code ini melalui aplikasi mereka</li>
              <li>• Absensi akan tercatat otomatis</li>
              <li>• QR Code hanya berlaku selama sesi aktif</li>
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SubjectQRModal;
