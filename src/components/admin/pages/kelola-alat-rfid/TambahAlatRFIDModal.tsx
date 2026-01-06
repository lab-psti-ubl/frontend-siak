import React, { useState } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';

interface TambahAlatRFIDModalProps {
  onClose: () => void;
  onSubmit: (namaAlat: string, lokasi: string) => void;
}

const TambahAlatRFIDModal: React.FC<TambahAlatRFIDModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    namaAlat: '',
    lokasi: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (validate()) {
      onSubmit(formData.namaAlat.trim(), formData.lokasi.trim());
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Tambah Alat RFID">
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
            Token unik akan otomatis dibuat ketika Anda menambahkan alat. Token ini diperlukan untuk mengakses dashboard monitoring.
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
            Tambah Alat
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TambahAlatRFIDModal;
