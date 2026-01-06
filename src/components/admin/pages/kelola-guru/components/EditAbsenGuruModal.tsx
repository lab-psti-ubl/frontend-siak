import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { User, AbsensiGuru } from '../../../../../types';
import { getGuruAbsensiForDate } from '../utils/absenGuruDataHelpers';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';

interface EditAbsenGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGuru: User | null;
  selectedDate: string;
  absensiGuru: AbsensiGuru[];
  onSave: (updatedAbsensi: AbsensiGuru) => void;
}

const EditAbsenGuruModal: React.FC<EditAbsenGuruModalProps> = ({
  isOpen,
  onClose,
  selectedGuru,
  selectedDate,
  absensiGuru,
  onSave
}) => {
  const { activeTahunAjaran } = useTahunAjaran();
  const [jamMasuk, setJamMasuk] = useState('');
  const [jamKeluar, setJamKeluar] = useState('');
  const [statusMasuk, setStatusMasuk] = useState<'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa'>('tidak_masuk');
  const [statusKeluar, setStatusKeluar] = useState<'tepat_waktu' | 'pulang_awal' | 'tidak_keluar' | 'izin' | 'sakit' | 'alfa'>('tidak_keluar');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const statusMasukOptions: Array<'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa'> = [
    'tepat_waktu',
    'terlambat',
    'tidak_masuk',
    'izin',
    'sakit',
    'alfa'
  ];

  const statusKeluarOptions: Array<'tepat_waktu' | 'pulang_awal' | 'tidak_keluar' | 'izin' | 'sakit' | 'alfa'> = [
    'tepat_waktu',
    'pulang_awal',
    'tidak_keluar',
    'izin',
    'sakit',
    'alfa'
  ];

  const getStatusLabel = (status: string): string => {
    const labels: { [key: string]: string } = {
      'tepat_waktu': 'Tepat Waktu',
      'terlambat': 'Terlambat',
      'tidak_masuk': 'Tidak Masuk',
      'pulang_awal': 'Pulang Awal',
      'tidak_keluar': 'Tidak Keluar',
      'izin': 'Izin',
      'sakit': 'Sakit',
      'alfa': 'Alfa'
    };
    return labels[status] || status;
  };

  useEffect(() => {
    if (isOpen && selectedGuru) {
      const existingAbsensi = getGuruAbsensiForDate(absensiGuru, selectedGuru.id, selectedDate);

      if (existingAbsensi) {
        setJamMasuk(existingAbsensi.jamMasuk || '');
        setJamKeluar(existingAbsensi.jamKeluar || '');
        setStatusMasuk(existingAbsensi.statusMasuk);
        setStatusKeluar(existingAbsensi.statusKeluar);
      } else {
        // Reset form untuk absensi baru
        setJamMasuk('');
        setJamKeluar('');
        setStatusMasuk('tidak_masuk');
        setStatusKeluar('tidak_keluar');
      }
      setError('');
    }
  }, [isOpen, selectedGuru, selectedDate, absensiGuru]);

  const handleSave = () => {
    if (!selectedGuru) return;

    try {
      setIsSaving(true);

      const existingAbsensi = getGuruAbsensiForDate(absensiGuru, selectedGuru.id, selectedDate, activeTahunAjaran?.id);

      const updatedAbsensi: AbsensiGuru = {
        // Use existing id or generate temporary id in format: tanggal-guruId
        id: existingAbsensi?.id || `${selectedDate}-${selectedGuru.id}`,
        guruId: selectedGuru.id,
        tanggal: selectedDate,
        jamMasuk: jamMasuk || undefined,
        jamKeluar: jamKeluar || undefined,
        statusMasuk,
        statusKeluar,
        keterangan: 'Manual Oleh Admin',
        tahunAjaranId: existingAbsensi?.tahunAjaranId || activeTahunAjaran?.id || '',
        semester: existingAbsensi?.semester || activeTahunAjaran?.semester || 1,
        createdAt: existingAbsensi?.createdAt || new Date().toISOString(),
      };

      onSave(updatedAbsensi);
      setIsSaving(false);
      onClose();
    } catch (err) {
      setError('Gagal menyimpan data absensi');
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Absensi - ${selectedGuru?.name}`}
      size="md"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            Tanggal: {new Date(selectedDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jam Masuk
            </label>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              <input
                type="time"
                value={jamMasuk}
                onChange={(e) => setJamMasuk(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Masuk
            </label>
            <select
              value={statusMasuk}
              onChange={(e) => setStatusMasuk(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusMasukOptions.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jam Keluar
            </label>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              <input
                type="time"
                value={jamKeluar}
                onChange={(e) => setJamKeluar(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Keluar
            </label>
            <select
              value={statusKeluar}
              onChange={(e) => setStatusKeluar(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusKeluarOptions.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditAbsenGuruModal;
