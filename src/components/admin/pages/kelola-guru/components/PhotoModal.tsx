import React from 'react';
import Modal from '../../../../ui/Modal';
import { FotoMengajar, User } from '../../../../../types';
import { getMapelName, getKelasName } from '../utils/absenGuruDataHelpers';
import { MataPelajaran, Kelas } from '../../../../../types';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhoto: FotoMengajar | null;
  selectedGuru: User | null;
  mataPelajaran: MataPelajaran[];
  kelas: Kelas[];
}

const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  selectedPhoto,
  selectedGuru,
  mataPelajaran,
  kelas
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Foto Bukti Mengajar"
      size="lg"
    >
      {selectedPhoto && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mata Pelajaran:</span>
                <span className="ml-2 font-medium">
                  {getMapelName(mataPelajaran, selectedPhoto.mataPelajaranId)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Kelas:</span>
                <span className="ml-2 font-medium">
                  {getKelasName(kelas, selectedPhoto.kelasId)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Waktu Foto:</span>
                <span className="ml-2 font-medium">
                  {new Date(selectedPhoto.waktuFoto).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Guru:</span>
                <span className="ml-2 font-medium">{selectedGuru?.name}</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <img
              src={selectedPhoto.fotoBase64}
              alt="Foto Bukti Mengajar"
              className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200 mx-auto"
            />
          </div>

          {selectedPhoto.keterangan && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Keterangan:</strong> {selectedPhoto.keterangan}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PhotoModal;
