import React, { useState } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import { useLanguage } from '../../../../context/LanguageContext';

export type JenisAbsenAlat = 'rfid' | 'facerecognition';

interface TambahAlatRFIDModalProps {
  onClose: () => void;
  onSubmit: (namaAlat: string, lokasi: string, jenisAbsen: JenisAbsenAlat) => void;
}

const TambahAlatRFIDModal: React.FC<TambahAlatRFIDModalProps> = ({ onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    namaAlat: '',
    lokasi: '',
    jenisAbsen: 'rfid' as JenisAbsenAlat,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jenisAbsen' ? (value as JenisAbsenAlat) : value,
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
      newErrors.namaAlat = t('manajemenAlatRFID.namaAlatRequired');
    }
    if (!formData.lokasi.trim()) {
      newErrors.lokasi = t('manajemenAlatRFID.lokasiRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData.namaAlat.trim(), formData.lokasi.trim(), formData.jenisAbsen);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={t('manajemenAlatRFID.tambahAlat')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('manajemenAlatRFID.namaAlat')}
          </label>
          <input
            type="text"
            name="namaAlat"
            value={formData.namaAlat}
            onChange={handleChange}
            placeholder={t('manajemenAlatRFID.namaAlatPlaceholderContoh')}
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
            {t('manajemenAlatRFID.jenisAbsen')}
          </label>
          <select
            name="jenisAbsen"
            value={formData.jenisAbsen}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rfid">{t('manajemenAlatRFID.rfidOption')}</option>
            <option value="facerecognition">{t('manajemenAlatRFID.faceRecognitionOption')}</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {t('manajemenAlatRFID.jenisAbsenHelp')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('manajemenAlatRFID.lokasi')}
          </label>
          <input
            type="text"
            name="lokasi"
            value={formData.lokasi}
            onChange={handleChange}
            placeholder={t('manajemenAlatRFID.lokasiPlaceholderContoh')}
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
            {t('manajemenAlatRFID.tokenInfo')}
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            fullWidth
          >
            {t('manajemenAlatRFID.tambahAlatButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TambahAlatRFIDModal;
