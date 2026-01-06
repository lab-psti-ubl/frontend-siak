import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { WaliKelasSettings } from '../../../../../types';
import { getWaliKelasSettings, setWaliKelasSettings, getWaliKelasSystemDescription, getSystemLabel } from '../../../../../utils/waliKelasSystemUtils';

interface WaliKelasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaliKelasSettingsModal: React.FC<WaliKelasSettingsModalProps> = ({ isOpen, onClose }) => {
  const [selectedSystem, setSelectedSystem] = useState<'otomatis' | 'tetap' | 'hapus'>('otomatis');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setIsFetching(true);
    try {
      const currentSettings = await getWaliKelasSettings();
      setSelectedSystem(currentSettings.system as 'otomatis' | 'tetap' | 'hapus');
      setSuccessMessage('');
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching settings:', error);
      setErrorMessage('Gagal memuat pengaturan');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const newSettings: WaliKelasSettings = {
        system: selectedSystem,
        lastUpdated: new Date().toISOString()
      };
      await setWaliKelasSettings(newSettings);
      setSuccessMessage(`Pengaturan wali kelas berhasil disimpan. Sistem yang dipilih: ${getSystemLabel(selectedSystem)}`);

      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setErrorMessage(error.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsLoading(false);
    }
  };

  const systems = [
    {
      id: 'otomatis',
      label: 'Sistem Otomatis',
      color: 'blue',
      description: getWaliKelasSystemDescription('otomatis'),
      defaultText: '(Default)'
    },
    {
      id: 'tetap',
      label: 'Sistem Tetap',
      color: 'amber',
      description: getWaliKelasSystemDescription('tetap'),
      defaultText: ''
    },
    {
      id: 'hapus',
      label: 'Sistem Hapus',
      color: 'red',
      description: getWaliKelasSystemDescription('hapus'),
      defaultText: ''
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan Sistem Wali Kelas"
      size="lg"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Pengaturan berlaku untuk semua guru wali kelas</p>
            <p>Sistem yang dipilih akan diterapkan saat proses kenaikan kelas dilakukan.</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="flex gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="flex gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Loading State */}
        {isFetching && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Memuat pengaturan...</p>
          </div>
        )}

        {/* System Options */}
        <div className="space-y-3">
          {systems.map((system) => (
            <button
              key={system.id}
              onClick={() => setSelectedSystem(system.id as 'otomatis' | 'tetap' | 'hapus')}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedSystem === system.id
                  ? system.color === 'blue'
                    ? 'border-blue-500 bg-blue-50'
                    : system.color === 'amber'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    selectedSystem === system.id
                      ? system.color === 'blue'
                        ? 'border-blue-500 bg-blue-500'
                        : system.color === 'amber'
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-red-500 bg-red-500'
                      : 'border-slate-300'
                  }`}
                >
                  {selectedSystem === system.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${
                    selectedSystem === system.id
                      ? system.color === 'blue'
                        ? 'text-blue-900'
                        : system.color === 'amber'
                        ? 'text-amber-900'
                        : 'text-red-900'
                      : 'text-slate-900'
                  }`}>
                    {system.label} {system.defaultText && <span className="text-xs font-normal text-slate-600">{system.defaultText}</span>}
                  </p>
                  <p className={`text-sm mt-1 ${
                    selectedSystem === system.id
                      ? system.color === 'blue'
                        ? 'text-blue-700'
                        : system.color === 'amber'
                        ? 'text-amber-700'
                        : 'text-red-700'
                      : 'text-slate-600'
                  }`}>
                    {system.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detailed Explanation */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <h4 className="font-semibold text-slate-900 text-sm">Penjelasan Sistem:</h4>
          <div className="space-y-2 text-xs text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">Sistem Otomatis (Default):</p>
              <p>Ketika murid naik kelas, wali kelas otomatis mengikuti muridnya ke kelas baru. Contoh: Bu Sari wali kelas X IPA 1 akan menjadi wali kelas XI IPA 1 saat muridnya naik kelas.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Sistem Tetap:</p>
              <p>Wali kelas tetap berada di kelas yang sama dan tidak pindah ke kelas baru. Contoh: Bu Indah tetap menjadi wali kelas XI IPA 1 meskipun muridnya naik ke kelas XII.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Sistem Hapus:</p>
              <p>Semua guru akan dilepas dari jabatan wali kelas saat kenaikan kelas. Contoh: Bu Yuli tidak menjadi wali kelas lagi setelah proses kenaikan kelas.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Batal
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WaliKelasSettingsModal;
