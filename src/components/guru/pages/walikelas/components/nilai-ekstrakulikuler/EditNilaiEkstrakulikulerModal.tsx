import React from 'react';
import { X } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import { NilaiEkstrakulikuler } from '../../../../../../types';

interface EditNilaiEkstrakulikulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedNilai: NilaiEkstrakulikuler | null;
  formData: {
    nilai: string;
  };
  setFormData: (data: { nilai: string }) => void;
}

const EditNilaiEkstrakulikulerModal: React.FC<EditNilaiEkstrakulikulerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedNilai,
  formData,
  setFormData,
}) => {
  if (!isOpen || !selectedNilai) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">Edit Nilai</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Kegiatan (Ekstrakulikuler)
            </label>
            <input
              type="text"
              value={selectedNilai.ekstrakulikuler?.nama || ''}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nilai <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.nilai}
              onChange={(e) => setFormData({ nilai: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0-100"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditNilaiEkstrakulikulerModal;

