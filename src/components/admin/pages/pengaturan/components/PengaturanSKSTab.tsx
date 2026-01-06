import React from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { PengaturanSKS, PengaturanIstirahat } from '../../../../../types';
import { formatDurasi, calculateTotalDurasi } from '../../../../../utils/sksUtils';
import { calculateEndTimeWithBreak } from './pengaturanAbsenUtils';
import { handleSKSSubmit } from './pengaturanAbsenHandlers';

interface PengaturanSKSTabProps {
  sksFormData: {
    durasiPerSKS: number;
    istirahatAntarSKS: number;
  };
  setSksFormData: (data: any) => void;
  sksMessage: { type: string; text: string };
  setSksMessage: (msg: { type: string; text: string }) => void;
  activePengaturanSKS: PengaturanSKS | undefined;
  pengaturanSKS: PengaturanSKS[];
  setPengaturanSKS: (data: PengaturanSKS[]) => void;
  istirahatFormData: {
    jamMulai: string;
    jamSelesai: string;
  };
}

const PengaturanSKSTab: React.FC<PengaturanSKSTabProps> = ({
  sksFormData,
  setSksFormData,
  sksMessage,
  setSksMessage,
  activePengaturanSKS,
  pengaturanSKS,
  setPengaturanSKS,
  istirahatFormData,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSKSSubmit(sksFormData, activePengaturanSKS, pengaturanSKS, setPengaturanSKS, setSksMessage);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Pengaturan Jam Pelajaran</h3>
            <p className="text-xs sm:text-sm text-slate-600">Atur durasi setiap JP dan istirahat antar JP</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Durasi per JP (menit) *
              </label>
              <input
                type="number"
                min="15"
                max="120"
                step="5"
                value={sksFormData.durasiPerSKS}
                onChange={(e) => setSksFormData({ ...sksFormData, durasiPerSKS: parseInt(e.target.value) || 45 })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Standar: 45 menit per JP (rentang: 15-120 menit)
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Istirahat antar JP (menit)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                step="5"
                value={sksFormData.istirahatAntarSKS}
                onChange={(e) => setSksFormData({ ...sksFormData, istirahatAntarSKS: parseInt(e.target.value) || 0 })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                Istirahat antar JP dalam satu mata pelajaran (0-30 menit)
              </p>
            </div>

            {sksMessage.text && (
              <div
                className={`p-3 sm:p-4 rounded-lg flex items-center gap-2 ${
                  sksMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {sksMessage.type === 'success' ? (
                  <CheckCircle size={18} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">{sksMessage.text}</span>
              </div>
            )}

            <Button type="submit" fullWidth className="justify-center flex items-center bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2 sm:py-3">
              <Save size={16} className="mr-2" />
              Simpan Pengaturan Jam Pelajaran
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Preview Durasi Mata Pelajaran</h3>
            <p className="text-xs sm:text-sm text-slate-600">Lihat contoh durasi berdasarkan jumlah JP</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-100">
              <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-3">Pengaturan Saat Ini</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Durasi per JP:</span>
                  <span className="font-semibold text-blue-900">{sksFormData.durasiPerSKS} menit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Istirahat antar JP:</span>
                  <span className="font-semibold text-blue-900">{sksFormData.istirahatAntarSKS} menit</span>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-lg border border-emerald-100">
              <h4 className="text-xs sm:text-sm font-semibold text-emerald-900 mb-3">Contoh Durasi</h4>
              <div className="space-y-1.5 text-xs sm:text-sm">
                {[1, 2, 3, 4].map(sks => {
                  const totalDurasi = calculateTotalDurasi(sks, {
                    id: '',
                    durasiPerSKS: sksFormData.durasiPerSKS,
                    istirahatAntarSKS: sksFormData.istirahatAntarSKS,
                    isActive: true,
                    createdAt: ''
                  });
                  return (
                    <div key={sks} className="flex justify-between">
                      <span className="text-emerald-700">{sks} JP:</span>
                      <span className="font-semibold text-emerald-900">{formatDurasi(totalDurasi)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-3">Contoh Jadwal</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="bg-white rounded p-2 sm:p-3 border border-slate-100">
                <div className="font-semibold text-slate-900 mb-1">Matematika (2 JP)</div>
                <div className="text-slate-600">
                  09:00 → {(() => {
                    const [hours, minutes] = '09:00'.split(':').map(Number);
                    const startTime = new Date();
                    startTime.setHours(hours, minutes, 0, 0);
                    const totalDurasi = calculateTotalDurasi(2, {
                      id: '',
                      durasiPerSKS: sksFormData.durasiPerSKS,
                      istirahatAntarSKS: sksFormData.istirahatAntarSKS,
                      isActive: true,
                      createdAt: ''
                    });
                    const endTime = new Date(startTime.getTime() + totalDurasi * 60000);
                    return endTime.toTimeString().slice(0, 5);
                  })()}
                </div>
              </div>

              <div className="bg-white rounded p-2 sm:p-3 border border-slate-100">
                <div className="font-semibold text-slate-900 mb-1">Matematika (4 JP)</div>
                <div className="text-slate-600">
                  11:00 → {(() => {
                    const pengaturanSKSTemp = {
                      id: '',
                      durasiPerSKS: sksFormData.durasiPerSKS,
                      istirahatAntarSKS: sksFormData.istirahatAntarSKS,
                      isActive: true,
                      createdAt: ''
                    };
                    const pengaturanIstirahatTemp = {
                      id: '',
                      jamMulai: istirahatFormData.jamMulai,
                      jamSelesai: istirahatFormData.jamSelesai,
                      isActive: true,
                      createdAt: ''
                    };

                    const [hours, minutes] = '11:00'.split(':').map(Number);
                    const startTime = new Date();
                    startTime.setHours(hours, minutes, 0, 0);

                    const totalDurasi = calculateTotalDurasi(4, pengaturanSKSTemp);
                    return calculateEndTimeWithBreak(startTime, totalDurasi, pengaturanIstirahatTemp);
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PengaturanSKSTab;
