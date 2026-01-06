import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Jurusan } from '../../../types';
import { apiService } from '../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../ui/ToastContainer';
import Button from '../../ui/Button';

interface TambahJurusanFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingJurusan?: Jurusan | null;
  onSuccess: () => void;
}

const TambahJurusanForm: React.FC<TambahJurusanFormProps> = ({
  isOpen,
  onClose,
  editingJurusan,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });

  React.useEffect(() => {
    if (editingJurusan) {
      setFormData({
        name: editingJurusan.name,
        code: editingJurusan.code,
        description: editingJurusan.description || '',
        isActive: editingJurusan.isActive,
      });
    } else {
      resetForm();
    }
  }, [editingJurusan, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      showErrorToast('Error', 'Nama dan kode jurusan wajib diisi!');
      return;
    }

    try {
      const jurusanData = {
        name: formData.name,
        code: formData.code,
        description: formData.description || '',
        isActive: formData.isActive,
      };

      let response;
      if (editingJurusan) {
        response = await apiService.updateJurusan(editingJurusan.id, jurusanData);
      } else {
        response = await apiService.createJurusan(jurusanData);
      }

      if (response.success) {
        showSuccessToast('Berhasil', editingJurusan ? 'Jurusan berhasil diperbarui' : 'Jurusan berhasil ditambahkan');
        onSuccess();
        resetForm();
        onClose();
      } else {
        showErrorToast('Error', response.message || 'Gagal menyimpan data jurusan');
      }
    } catch (error: any) {
      if (error.message?.includes('Kode jurusan sudah terdaftar')) {
        showErrorToast('Error', 'Kode jurusan sudah terdaftar');
      } else {
        showErrorToast('Error', error.message || 'Terjadi kesalahan saat menyimpan data jurusan');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editingJurusan ? 'Edit Jurusan' : 'Tambah Jurusan Baru'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Jurusan *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Ilmu Pengetahuan Alam"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Jurusan *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: IPA"
              maxLength={5}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Deskripsi singkat tentang jurusan..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Status Aktif
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" fullWidth className="justify-center flex items-center">
              <Save size={16} className="mr-2" />
              {editingJurusan ? 'Update' : 'Tambah'} Jurusan
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={onClose} className="justify-center flex items-center">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TambahJurusanForm;