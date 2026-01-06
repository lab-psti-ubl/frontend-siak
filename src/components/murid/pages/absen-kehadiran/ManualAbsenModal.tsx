import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import { Absensi, SesiAbsensi, User } from '../../../../types';
import { apiService } from '../../../../services/apiService';

interface ManualAbsenModalProps {
  isOpen: boolean;
  onClose: () => void;
  muridId: string;
  onSubmit: (tipeAbsen: 'masuk' | 'pulang', keterangan?: string) => void;
}

const ManualAbsenModal: React.FC<ManualAbsenModalProps> = ({
  isOpen,
  onClose,
  muridId,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState<'masuk' | 'pulang' | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayAbsensi, setTodayAbsensi] = useState<{ masuk?: Absensi; pulang?: Absensi }>({});

  useEffect(() => {
    const fetchTodayAbsensi = async () => {
      if (isOpen) {
        const today = new Date().toISOString().split('T')[0];
        try {
          const response = await apiService.getAbsensiByMuridIdAndTanggal(muridId, today);
          if (response.success && response.absensi) {
            const todayData = response.absensi;
            
            // Find today's absensi (one record per day in new structure)
            const todayAbsensiRecord = todayData.find((a: Absensi) => a.tanggal === today);
            
            if (todayAbsensiRecord) {
              // New structure: one record contains both masuk and pulang
              const masuk: Absensi | undefined = todayAbsensiRecord.jamMasuk || todayAbsensiRecord.statusMasuk ? {
                ...todayAbsensiRecord,
                tipeAbsen: 'masuk',
                waktu: todayAbsensiRecord.jamMasuk || todayAbsensiRecord.waktu || '',
              } : undefined;

              const pulang: Absensi | undefined = todayAbsensiRecord.jamKeluar || todayAbsensiRecord.statusKeluar ? {
                ...todayAbsensiRecord,
                tipeAbsen: 'pulang',
                waktu: todayAbsensiRecord.jamKeluar || todayAbsensiRecord.waktu || '',
              } : undefined;

              setTodayAbsensi({ masuk, pulang });
            } else {
              // Backward compatibility: check old structure (separate records)
              setTodayAbsensi({
                masuk: todayData.find((a: Absensi) => a.tipeAbsen === 'masuk'),
                pulang: todayData.find((a: Absensi) => a.tipeAbsen === 'pulang'),
              });
            }
          } else {
            setTodayAbsensi({});
          }
        } catch (error) {
          console.error('Error fetching today absensi:', error);
          setTodayAbsensi({});
        }
        setSelectedType(null);
        setKeterangan('');
      }
    };
    
    fetchTodayAbsensi();
  }, [isOpen, muridId]);

  const handleSubmit = () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(selectedType, keterangan);
      setSelectedType(null);
      setKeterangan('');
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  const isValid = selectedType !== null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-lg font-bold text-slate-900">Absen Manual</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Pilih jenis absen</p>
              <p className="text-xs text-blue-700">Ketika Anda absen manual, data akan tercatat di sistem absensi kelas.</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <input
                type="radio"
                name="tipeAbsen"
                value="masuk"
                checked={selectedType === 'masuk'}
                onChange={(e) => setSelectedType(e.target.value as 'masuk')}
                disabled={todayAbsensi.masuk !== undefined}
                className="hidden"
              />
              <div className={`p-4 rounded-lg border-2 transition-all ${
                todayAbsensi.masuk !== undefined
                  ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60'
                  : selectedType === 'masuk'
                  ? 'border-emerald-500 bg-emerald-50 cursor-pointer'
                  : 'border-slate-200 bg-white hover:border-emerald-300 cursor-pointer'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedType === 'masuk' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                  }`}>
                    {selectedType === 'masuk' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Absen Masuk</p>
                    <p className="text-xs text-slate-600">
                      {todayAbsensi.masuk !== undefined ? 'Sudah absen masuk' : 'Masuk ke sekolah'}
                    </p>
                  </div>
                </div>
              </div>
            </label>

            <label className="block">
              <input
                type="radio"
                name="tipeAbsen"
                value="pulang"
                checked={selectedType === 'pulang'}
                onChange={(e) => setSelectedType(e.target.value as 'pulang')}
                disabled={todayAbsensi.pulang !== undefined || todayAbsensi.masuk === undefined}
                className="hidden"
              />
              <div className={`p-4 rounded-lg border-2 transition-all ${
                todayAbsensi.pulang !== undefined || todayAbsensi.masuk === undefined
                  ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60'
                  : selectedType === 'pulang'
                  ? 'border-amber-500 bg-amber-50 cursor-pointer'
                  : 'border-slate-200 bg-white hover:border-amber-300 cursor-pointer'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedType === 'pulang' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                  }`}>
                    {selectedType === 'pulang' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Absen Pulang</p>
                    <p className="text-xs text-slate-600">
                      {todayAbsensi.pulang !== undefined
                        ? 'Sudah absen pulang'
                        : todayAbsensi.masuk === undefined
                        ? 'Absen masuk terlebih dahulu'
                        : 'Pulang dari sekolah'}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div>
            <label htmlFor="keterangan" className="block text-sm font-medium text-slate-700 mb-2">
              Keterangan (Opsional)
            </label>
            <textarea
              id="keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Tulis keterangan jika ada..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Absen'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ManualAbsenModal;
