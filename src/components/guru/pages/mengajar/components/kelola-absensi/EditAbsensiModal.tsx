import React from 'react';
import { CheckCircle } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import { AbsensiPelajaran, User } from '../../../../../../types';

interface EditAbsensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAbsensi: AbsensiPelajaran | null;
  editStatus: 'hadir' | 'izin' | 'sakit' | 'alfa';
  setEditStatus: (status: 'hadir' | 'izin' | 'sakit' | 'alfa') => void;
  editKeterangan: string;
  setEditKeterangan: (value: string) => void;
  onSave: () => void;
  users: User[];
  isSaving?: boolean;
}

const EditAbsensiModal: React.FC<EditAbsensiModalProps> = ({
  isOpen,
  onClose,
  editingAbsensi,
  editStatus,
  setEditStatus,
  editKeterangan,
  setEditKeterangan,
  onSave,
  users,
  isSaving = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Absensi"
      size="md"
    >
      {editingAbsensi && (
        <div className="space-y-4 pb-12 mb-4 sm:pb-2 sm:mb-2">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Nama Murid</p>
            <p className="font-medium">{users.find(u => u.id === editingAbsensi.muridId)?.name}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Kehadiran
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSaving}
            >
              <option value="hadir">Hadir</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="alfa">Alfa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan
            </label>
            <textarea
              value={editKeterangan}
              onChange={(e) => setEditKeterangan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Tambahkan keterangan (opsional)"
              disabled={isSaving}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
              className="flex items-center justify-center"
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={onSave}
              variant="primary"
              fullWidth
              className="flex items-center justify-center"
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
                  Simpan
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditAbsensiModal;
