import React from 'react';
import { CheckCircle } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import { User } from '../../../../../../types';

interface KeteranganModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  keteranganInput: string;
  setKeteranganInput: (value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

const KeteranganModal: React.FC<KeteranganModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  keteranganInput,
  setKeteranganInput,
  onSave,
  isSaving = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Keterangan"
      size="md"
    >
      {selectedMurid && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Nama Murid</p>
            <p className="font-medium">{selectedMurid.name}</p>
            <p className="text-sm text-gray-600 mt-1">NISN: {selectedMurid.nisn}</p>
          </div>

          {isSaving && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label="Menyimpan data absensi" />
              <p className="text-sm font-medium">
                Menyimpan absensi melalui worker...
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan (Opsional)
            </label>
            <textarea
              value={keteranganInput}
              onChange={(e) => setKeteranganInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Masukkan keterangan tambahan (opsional)..."
              disabled={isSaving}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              fullWidth
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              fullWidth
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Simpan Keterangan
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default KeteranganModal;
