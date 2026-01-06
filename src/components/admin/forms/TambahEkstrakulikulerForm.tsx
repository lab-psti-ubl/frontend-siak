import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Ekstrakulikuler } from '../../../types';
import { apiService } from '../../../services/apiService';
import Button from '../../ui/Button';
import { useGurus } from '../../../hooks/useGurus';

interface TambahEkstrakulikulerFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingEkstrakulikuler?: Ekstrakulikuler | null;
  onSuccess: () => void;
}

const TambahEkstrakulikulerForm: React.FC<TambahEkstrakulikulerFormProps> = ({
  isOpen,
  onClose,
  editingEkstrakulikuler,
  onSuccess
}) => {
  const { gurus } = useGurus();
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    pembinaId: '',
  });

  React.useEffect(() => {
    if (editingEkstrakulikuler) {
      setFormData({
        nama: editingEkstrakulikuler.nama,
        deskripsi: editingEkstrakulikuler.deskripsi || '',
        pembinaId: editingEkstrakulikuler.pembinaId,
      });
    } else {
      resetForm();
    }
  }, [editingEkstrakulikuler, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama.trim()) {
      alert('Nama ekstrakulikuler wajib diisi!');
      return;
    }

    if (!formData.pembinaId) {
      alert('Pembina wajib dipilih!');
      return;
    }
    
    try {
      if (editingEkstrakulikuler) {
        const response = await apiService.updateEkstrakulikuler(editingEkstrakulikuler.id, formData);
        if (response.success) {
          onSuccess();
          resetForm();
          onClose();
        } else {
          alert(response.message || 'Gagal memperbarui ekstrakulikuler');
        }
      } else {
        const response = await apiService.createEkstrakulikuler(formData);
        if (response.success) {
          onSuccess();
          resetForm();
          onClose();
        } else {
          alert(response.message || 'Gagal menambahkan ekstrakulikuler');
        }
      }
    } catch (error) {
      console.error('Error saving ekstrakulikuler:', error);
      alert('Terjadi kesalahan saat menyimpan ekstrakulikuler');
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      deskripsi: '',
      pembinaId: '',
    });
  };

  // Filter only active gurus
  const activeGurus = gurus.filter(guru => guru.isActive !== false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editingEkstrakulikuler ? 'Edit Ekstrakulikuler' : 'Tambah Ekstrakulikuler Baru'}
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
              Nama Ekstrakulikuler *
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Pramuka, Paskibra, Futsal, dll"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Deskripsi ekstrakulikuler (opsional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pembina *
            </label>
            <select
              value={formData.pembinaId}
              onChange={(e) => setFormData({ ...formData, pembinaId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Pilih Pembina</option>
              {activeGurus.map((guru) => (
                <option key={guru.id} value={guru.id}>
                  {guru.name} {guru.nip ? `(${guru.nip})` : ''}
                </option>
              ))}
            </select>
            {activeGurus.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Tidak ada guru aktif yang tersedia</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" fullWidth className="justify-center flex items-center">
              <Save size={16} className="mr-2" />
              {editingEkstrakulikuler ? 'Update' : 'Tambah'} Ekstrakulikuler
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

export default TambahEkstrakulikulerForm;

