import React from 'react';
import { Check, X } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import SuratIzinDisplay from '../../../../../shared/modals/SuratIzinDisplay';
import { SuratIzin, User, Kelas } from '../../../../../../types';

interface SuratIzinDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  surat: SuratIzin | null;
  getMuridName: (muridId: string) => string;
  users: User[];
  kelas: Kelas[];
  currentUserName: string;
  keterangan: string;
  setKeterangan: (value: string) => void;
  onVerify: (suratId: string, status: 'diterima' | 'ditolak') => void;
  isVerifying?: boolean;
}

const SuratIzinDetailModal: React.FC<SuratIzinDetailModalProps> = ({
  isOpen,
  onClose,
  surat,
  getMuridName,
  users,
  kelas,
  currentUserName,
  keterangan,
  setKeterangan,
  onVerify,
  isVerifying = false
}) => {
  if (!surat) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <SuratIzinDisplay
        surat={surat}
        users={users}
        kelas={kelas}
        getMuridName={getMuridName}
        currentUserName={currentUserName}
        showVerificationSection={surat.status !== 'menunggu'}
      />

      {surat.status === 'menunggu' && (
        <>
          <div >
            <label className="block text-sm font-medium text-gray-700 mb-1 mt-6">
              Keterangan (Opsional)
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Tambahkan keterangan jika diperlukan..."
            />
          </div>

          <div className="flex space-x-3 pt-2 mb-12 pb-4">
            <Button
              variant="success"
              fullWidth
              onClick={() => onVerify(surat.id, 'diterima')}
              disabled={isVerifying}
              className="flex items-center justify-center"
            >
              <Check size={16} className="mr-2" />
              {isVerifying ? 'Memproses...' : 'Terima'}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => onVerify(surat.id, 'ditolak')}
              disabled={isVerifying}
              className="flex items-center justify-center"
            >
              <X size={16} className="mr-2" />
              {isVerifying ? 'Memproses...' : 'Tolak'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default SuratIzinDetailModal;
