import React from 'react';
import { X } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import { Ekstrakulikuler } from '../../../../../../types';

interface TambahNilaiEkstrakulikulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    ekstrakulikulerId: string;
    nilai: string;
  };
  setFormData: (data: { ekstrakulikulerId: string; nilai: string }) => void;
  availableEkstrakulikuler: Ekstrakulikuler[];
}

const TambahNilaiEkstrakulikulerModal: React.FC<TambahNilaiEkstrakulikulerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  availableEkstrakulikuler,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">Tambah Kegiatan</h3>
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
              Kegiatan (Ekstrakulikuler) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.ekstrakulikulerId}
              onChange={(e) => setFormData({ ...formData, ekstrakulikulerId: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Pilih Kegiatan</option>
              {availableEkstrakulikuler.map(ekstra => (
                <option key={ekstra.id} value={ekstra.id}>{ekstra.nama}</option>
              ))}
            </select>
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
              onChange={(e) => setFormData({ ...formData, nilai: e.target.value })}
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
              Tambah
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TambahNilaiEkstrakulikulerModal;

