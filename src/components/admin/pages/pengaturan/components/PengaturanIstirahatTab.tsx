import React from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { PengaturanIstirahat } from '../../../../../types';
import { calculateIstirahatDuration } from './pengaturanAbsenUtils';
import { handleIstirahatSubmit } from './pengaturanAbsenHandlers';

interface PengaturanIstirahatTabProps {
  istirahatFormData: {
    jamMulai: string;
    jamSelesai: string;
  };
  setIstirahatFormData: (data: any) => void;
  istirahatMessage: { type: string; text: string };
  setIstirahatMessage: (msg: { type: string; text: string }) => void;
  activePengaturanIstirahat: PengaturanIstirahat | undefined;
  pengaturanIstirahat: PengaturanIstirahat[];
  setPengaturanIstirahat: (data: PengaturanIstirahat[]) => void;
}

const PengaturanIstirahatTab: React.FC<PengaturanIstirahatTabProps> = ({
  istirahatFormData,
  setIstirahatFormData,
  istirahatMessage,
  setIstirahatMessage,
  activePengaturanIstirahat,
  pengaturanIstirahat,
  setPengaturanIstirahat,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleIstirahatSubmit(istirahatFormData, activePengaturanIstirahat, pengaturanIstirahat, setPengaturanIstirahat, setIstirahatMessage);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Pengaturan Jam Istirahat</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jam Mulai Istirahat *
              </label>
              <input
                type="time"
                value={istirahatFormData.jamMulai}
                onChange={(e) => setIstirahatFormData({ ...istirahatFormData, jamMulai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jam Selesai Istirahat *
              </label>
              <input
                type="time"
                value={istirahatFormData.jamSelesai}
                onChange={(e) => setIstirahatFormData({ ...istirahatFormData, jamSelesai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Preview Durasi Istirahat</h4>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {istirahatFormData.jamMulai && istirahatFormData.jamSelesai ?
                  calculateIstirahatDuration(istirahatFormData.jamMulai, istirahatFormData.jamSelesai) : '-'
                }
              </p>
              <p className="text-sm text-blue-700">
                {istirahatFormData.jamMulai} - {istirahatFormData.jamSelesai}
              </p>
            </div>
          </div>

          {istirahatMessage.text && (
            <div
              className={`p-4 rounded-lg ${
                istirahatMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center">
                {istirahatMessage.type === 'success' ? (
                  <CheckCircle size={16} className="mr-2" />
                ) : (
                  <AlertCircle size={16} className="mr-2" />
                )}
                {istirahatMessage.text}
              </div>
            </div>
          )}

          <Button type="submit" fullWidth className="justify-center flex items-center">
            <Save size={16} className="mr-2" />
            Simpan Pengaturan Istirahat
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Informasi Jam Istirahat</h3>

        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-3">Pengaturan Saat Ini</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Jam Mulai:</span>
                <span className="font-mono font-medium">{istirahatFormData.jamMulai}</span>
              </div>
              <div className="flex justify-between">
                <span>Jam Selesai:</span>
                <span className="font-mono font-medium">{istirahatFormData.jamSelesai}</span>
              </div>
              <div className="flex justify-between">
                <span>Durasi:</span>
                <span className="font-medium">
                  {istirahatFormData.jamMulai && istirahatFormData.jamSelesai ?
                    calculateIstirahatDuration(istirahatFormData.jamMulai, istirahatFormData.jamSelesai) : '-'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Cara Kerja Jam Istirahat:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Jika jadwal mata pelajaran melewati jam istirahat, sistem akan otomatis memotong jadwal</li>
              <li>• Bagian sebelum istirahat akan berakhir saat jam istirahat dimulai</li>
              <li>• Sisa durasi akan dilanjutkan setelah jam istirahat selesai</li>
              <li>• Jam selesai akan dihitung ulang dengan memperhitungkan waktu istirahat</li>
            </ul>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg">
            <h4 className="font-medium text-emerald-900 mb-3">Contoh Implementasi</h4>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded border">
                <div className="font-medium text-gray-900 mb-1">Contoh 1: Tidak Melewati Istirahat</div>
                <div className="text-gray-600">
                  Matematika 2 SKS: 09:00 - 10:30
                </div>
                <div className="text-xs text-gray-500">
                  Tidak terpengaruh jam istirahat
                </div>
              </div>

              <div className="p-3 bg-white rounded border">
                <div className="font-medium text-gray-900 mb-1">Contoh 2: Melewati Istirahat</div>
                <div className="text-gray-600">
                  Fisika 4 SKS: 11:00 - 12:00 (istirahat) 13:00 - 14:00
                </div>
                <div className="text-xs text-gray-500">
                  Terpotong istirahat, dilanjutkan setelah istirahat
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PengaturanIstirahatTab;
