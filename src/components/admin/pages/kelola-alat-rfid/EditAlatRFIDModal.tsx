import React, { useState, useEffect } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import { AlatRFID } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';
import type { JenisAbsenAlat } from './TambahAlatRFIDModal';

interface EditAlatRFIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  alat: AlatRFID | null;
  onSubmit: (id: string, namaAlat: string, lokasi: string, jenisAbsen: JenisAbsenAlat) => void;
}

const EditAlatRFIDModal: React.FC<EditAlatRFIDModalProps> = ({ isOpen, onClose, alat, onSubmit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    namaAlat: '',
    lokasi: '',
    jenisAbsen: 'rfid' as JenisAbsenAlat,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (alat) {
      setFormData({
        namaAlat: alat.namaAlat || '',
        lokasi: alat.lokasi || '',
        jenisAbsen: (alat.jenisAbsen as JenisAbsenAlat) || ('rfid' as JenisAbsenAlat),
      });
      setErrors({});
    }
  }, [alat]);

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
    if (validate() && alat) {
      onSubmit(alat.id, formData.namaAlat.trim(), formData.lokasi.trim(), formData.jenisAbsen);
    }
  };

  if (!isOpen || !alat) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('manajemenAlatRFID.editAlatTitle')} - ${alat.namaAlat}`}>
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
            {t('manajemenAlatRFID.tokenCannotChange')}
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
            {t('manajemenAlatRFID.simpanPerubahan')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAlatRFIDModal;

