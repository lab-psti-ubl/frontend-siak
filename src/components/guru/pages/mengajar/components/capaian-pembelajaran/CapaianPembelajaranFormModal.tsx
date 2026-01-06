import React from 'react';
import { X } from 'lucide-react';
import Button from '../../../../../ui/Button';
import { MataPelajaran } from '../../../../../../types';

interface CapaianPembelajaranFormModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  isSubmitting: boolean;
  selectedTingkat: number | '';
  selectedMataPelajaranId: string;
  capaianText: string;
  availableTingkat: number[];
  availableMataPelajaran: MataPelajaran[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTingkatChange: (tingkat: number | '') => void;
  onMataPelajaranChange: (mapelId: string) => void;
  onCapaianTextChange: (text: string) => void;
}

const CapaianPembelajaranFormModal: React.FC<CapaianPembelajaranFormModalProps> = ({
  isOpen,
  isEditMode,
  isSubmitting,
  selectedTingkat,
  selectedMataPelajaranId,
  capaianText,
  availableTingkat,
  availableMataPelajaran,
  onClose,
  onSubmit,
  onTingkatChange,
  onMataPelajaranChange,
  onCapaianTextChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {isEditMode ? 'Edit Capaian Pembelajaran' : 'Tambah Capaian Pembelajaran'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Tingkat Kelas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTingkat}
                  onChange={(e) => onTingkatChange(e.target.value ? parseInt(e.target.value) : '')}
                  disabled={isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Pilih Tingkat Kelas</option>
                  {availableTingkat.map((tingkat) => (
                    <option key={tingkat} value={tingkat}>
                      Tingkat {tingkat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMataPelajaranId}
                  onChange={(e) => onMataPelajaranChange(e.target.value)}
                  disabled={isEditMode || !selectedTingkat}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {availableMataPelajaran.map((mapel) => (
                    <option key={mapel.id} value={mapel.id}>
                      {mapel.name}
                    </option>
                  ))}
                </select>
                {!selectedTingkat && (
                  <p className="mt-1 text-xs text-gray-500">Pilih tingkat kelas terlebih dahulu</p>
                )}
              </div>

              {/* Capaian Pembelajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capaian Pembelajaran <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={capaianText}
                  onChange={(e) => onCapaianTextChange(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Masukkan capaian pembelajaran..."
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isEditMode ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapaianPembelajaranFormModal;

