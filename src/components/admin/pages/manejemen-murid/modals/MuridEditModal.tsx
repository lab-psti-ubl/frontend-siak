import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { User } from '../../../../../types';
import { apiService } from '../../../../../services/apiService';
import { clearMuridCache } from '../../../../../hooks/useMurid';
import { showSuccessToast, showErrorToast } from '../../../../ui/ToastContainer';

interface MuridEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  murid: User | null;
  onSuccess: () => void;
}

const MuridEditModal: React.FC<MuridEditModalProps> = ({
  isOpen,
  onClose,
  murid,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nisn: '',
    whatsappOrtu: '',
    rfidGuid: '',
  });

  useEffect(() => {
    if (murid) {
      setFormData({
        name: murid.name,
        email: murid.email,
        nisn: murid.nisn || '',
        whatsappOrtu: murid.whatsappOrtu || '',
        rfidGuid: (murid as any).rfidGuid || '',
      });
    }
  }, [murid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!murid) return;

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.nisn.trim()) {
      showErrorToast('Error', 'Nama, email, dan NISN wajib diisi!');
      return;
    }

    try {
      const muridData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        nisn: formData.nisn.trim(),
        whatsappOrtu: formData.whatsappOrtu.trim() || undefined,
        rfidGuid: formData.rfidGuid.trim() || undefined,
      };

      const response = await apiService.updateMurid(murid.id, muridData);

      if (response.success) {
        showSuccessToast('Berhasil', `Data murid ${formData.name} berhasil diperbarui!`);
        // Clear all murid cache to ensure all views get updated data
        clearMuridCache();
        onSuccess();
        onClose();
      } else {
        showErrorToast('Error', response.message || 'Gagal memperbarui data murid');
      }
    } catch (error: any) {
      if (error.message?.includes('NISN sudah terdaftar')) {
        showErrorToast('Error', 'NISN sudah digunakan oleh murid lain!');
      } else if (error.message?.includes('Email sudah terdaftar')) {
        showErrorToast('Error', 'Email sudah digunakan oleh pengguna lain!');
      } else if (error.message?.includes('GUID/RFID')) {
        showErrorToast('Error', 'GUID/RFID sudah digunakan oleh pengguna lain!');
      } else {
        showErrorToast('Error', error.message || 'Terjadi kesalahan saat memperbarui data murid');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Murid - ${murid?.name}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NISN *
          </label>
          <input
            type="text"
            value={formData.nisn}
            onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Orang Tua
          </label>
          <input
            type="tel"
            value={formData.whatsappOrtu}
            onChange={(e) => setFormData({ ...formData, whatsappOrtu: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nomor WhatsApp orang tua untuk notifikasi absensi
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RFID GUID (Opsional)
          </label>
          <input
            type="text"
            value={formData.rfidGuid}
            onChange={(e) => setFormData({ ...formData, rfidGuid: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Masukkan RFID GUID (contoh: 5a2a0a)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Masukkan RFID GUID secara manual
          </p>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button type="submit" fullWidth className="justify-center flex items-center">
            <Save size={16} className="mr-2" />
            Update Data
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            fullWidth 
            onClick={onClose}
            className="justify-center flex items-center"
          >
            <X size={16} className="mr-2" />
            Batal
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MuridEditModal;