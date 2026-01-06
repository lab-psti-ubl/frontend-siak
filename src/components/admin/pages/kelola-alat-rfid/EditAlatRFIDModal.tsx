import React, { useState, useEffect } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import { AlatRFID } from '../../../../types';

interface EditAlatRFIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  alat: AlatRFID | null;
  onSubmit: (id: string, namaAlat: string, lokasi: string) => void;
}

const EditAlatRFIDModal: React.FC<EditAlatRFIDModalProps> = ({ isOpen, onClose, alat, onSubmit }) => {
  const [formData, setFormData] = useState({
    namaAlat: '',
    lokasi: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (alat) {
      setFormData({
        namaAlat: alat.namaAlat || '',
        lokasi: alat.lokasi || '',
      });
      setErrors({});
    }
  }, [alat]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.namaAlat.trim()) {
      newErrors.namaAlat = 'Nama alat harus diisi';
    }
    if (!formData.lokasi.trim()) {
      newErrors.lokasi = 'Lokasi harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && alat) {
      onSubmit(alat.id, formData.namaAlat.trim(), formData.lokasi.trim());
    }
  };

  if (!isOpen || !alat) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Alat RFID - ${alat.namaAlat}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Alat
          </label>
          <input
            type="text"
            name="namaAlat"
            value={formData.namaAlat}
            onChange={handleChange}
            placeholder="Contoh: RFID Reader Pintu Masuk"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.namaAlat ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.namaAlat && (
            <p className="text-sm text-red-600 mt-1">{errors.namaAlat}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lokasi
          </label>
          <input
            type="text"
            name="lokasi"
            value={formData.lokasi}
            onChange={handleChange}
            placeholder="Contoh: Ruang Guru Lantai 1"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lokasi ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lokasi && (
            <p className="text-sm text-red-600 mt-1">{errors.lokasi}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Token tidak dapat diubah karena merupakan identifier unik untuk alat ini.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="submit"
            fullWidth
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAlatRFIDModal;

