import React from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { PengaturanAbsen } from '../../../../../types';
import { calculateJamBatas } from './pengaturanAbsenUtils';
import { handleAbsenSubmit } from './pengaturanAbsenHandlers';

interface PengaturanAbsenTabProps {
  formData: {
    jamMasuk: string;
    toleransiMasuk: number;
    jamPulang: string;
    toleransiPulang: number;
    hariSekolah: number[];
    hariKerja: number[];
  };
  setFormData: (data: any) => void;
  message: { type: string; text: string };
  setMessage: (msg: { type: string; text: string }) => void;
  activePengaturan: PengaturanAbsen | undefined;
  pengaturanAbsen: PengaturanAbsen[];
  setPengaturanAbsen: (data: PengaturanAbsen[]) => void;
}

const PengaturanAbsenTab: React.FC<PengaturanAbsenTabProps> = ({
  formData,
  setFormData,
  message,
  setMessage,
  activePengaturan,
  pengaturanAbsen,
  setPengaturanAbsen,
}) => {
  const { batasTerlambat, batasPulangAwal } = calculateJamBatas(
    formData.jamMasuk,
    formData.jamPulang,
    formData.toleransiMasuk,
    formData.toleransiPulang
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAbsenSubmit(formData, activePengaturan, pengaturanAbsen, setPengaturanAbsen, setMessage);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Pengaturan Jam Kerja</h3>
            <p className="text-xs sm:text-sm text-slate-600">Atur jam masuk, jam pulang, dan toleransi waktu untuk absensi guru</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                  Jam Masuk
                </label>
                <input
                  type="time"
                  value={formData.jamMasuk}
                  onChange={(e) => setFormData({ ...formData, jamMasuk: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                  Toleransi Masuk (menit)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.toleransiMasuk}
                  onChange={(e) => setFormData({ ...formData, toleransiMasuk: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                  Jam Pulang
                </label>
                <input
                  type="time"
                  value={formData.jamPulang}
                  onChange={(e) => setFormData({ ...formData, jamPulang: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                  Toleransi Pulang (menit)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.toleransiPulang}
                  onChange={(e) => setFormData({ ...formData, toleransiPulang: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-3">
                  Hari Sekolah (untuk Murid)
                </label>
                <p className="text-xs text-slate-600 mb-3">Pilih hari dimana murid dapat melakukan absensi kehadiran</p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
  
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
]
.map((day) => (
                    <label
                      key={day.value}
                      className={`flex items-center px-3 sm:px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                        formData.hariSekolah.includes(day.value)
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.hariSekolah.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              hariSekolah: [...formData.hariSekolah, day.value].sort(),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              hariSekolah: formData.hariSekolah.filter((d) => d !== day.value),
                            });
                          }
                        }}
                        className="mr-2 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs sm:text-sm font-medium">{day.label}</span>
                    </label>
                  ))}
                </div>
                {formData.hariSekolah.length === 0 && (
                  <p className="text-xs text-red-600 mt-2">⚠️ Pilih minimal 1 hari sekolah</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-3">
                  Hari Kerja (untuk Guru)
                </label>
                <p className="text-xs text-slate-600 mb-3">Pilih hari dimana guru dapat melakukan absensi kehadiran</p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
  
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
]
.map((day) => (
                    <label
                      key={day.value}
                      className={`flex items-center px-3 sm:px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                        formData.hariKerja.includes(day.value)
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.hariKerja.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              hariKerja: [...formData.hariKerja, day.value].sort(),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              hariKerja: formData.hariKerja.filter((d) => d !== day.value),
                            });
                          }
                        }}
                        className="mr-2 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-xs sm:text-sm font-medium">{day.label}</span>
                    </label>
                  ))}
                </div>
                {formData.hariKerja.length === 0 && (
                  <p className="text-xs text-red-600 mt-2">⚠️ Pilih minimal 1 hari kerja</p>
                )}
              </div>
            </div>

            {message.text && (
              <div
                className={`p-3 sm:p-4 rounded-lg flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={18} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">{message.text}</span>
              </div>
            )}

            <Button type="submit" fullWidth className="justify-center flex items-center bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2 sm:py-3">
              <Save size={16} className="mr-2" />
              Simpan Pengaturan
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Preview Pengaturan</h3>
            <p className="text-xs sm:text-sm text-slate-600">Pratinjau pengaturan yang akan diterapkan</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-100">
              <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">Jam Kerja</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Jam Masuk:</span>
                  <span className="font-mono font-semibold text-blue-900">{formData.jamMasuk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Jam Pulang:</span>
                  <span className="font-mono font-semibold text-blue-900">{formData.jamPulang}</span>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-lg border border-emerald-100">
              <h4 className="text-xs sm:text-sm font-semibold text-emerald-900 mb-2">Toleransi</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Masuk:</span>
                  <span className="font-semibold text-emerald-900">{formData.toleransiMasuk} mnt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Pulang:</span>
                  <span className="font-semibold text-emerald-900">{formData.toleransiPulang} mnt</span>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-lg border border-amber-100">
              <h4 className="text-xs sm:text-sm font-semibold text-amber-900 mb-2">Batas Waktu</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-700">Terlambat:</span>
                  <span className="font-mono font-semibold text-amber-900">{batasTerlambat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Pulang Awal:</span>
                  <span className="font-mono font-semibold text-amber-900">{batasPulangAwal}</span>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2">Status</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Pengaturan siap diterapkan</span>
                </div>
              </div>
            </div>
          </div>

            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-3">Ketentuan Absensi</h4>
              <ul className="text-xs text-slate-700 space-y-1.5">
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Absen masuk sebelum <strong>{formData.jamMasuk}</strong> atau hingga <strong>{batasTerlambat}</strong>: Tepat Waktu</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Absen masuk setelah <strong>{batasTerlambat}</strong>: Terlambat</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Absen pulang sebelum <strong>{batasPulangAwal}</strong>: Pulang Awal</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Absen pulang dari <strong>{batasPulangAwal}</strong> atau sesudah: Tepat Waktu</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Absensi murid hanya dapat dilakukan pada hari sekolah yang telah ditentukan</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Absensi guru hanya dapat dilakukan pada hari kerja yang telah ditentukan</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">Hari Sekolah (Murid)</h4>
                <div className="text-xs sm:text-sm text-blue-700">
                  {formData.hariSekolah.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.hariSekolah.map((day) => {
                        const days = ['Minggu','Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        return (
                          <span key={day} className="px-2 py-1 bg-blue-100 rounded text-blue-800 font-medium">
                            {days[day]}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-blue-600 italic">Belum ada hari yang dipilih</span>
                  )}
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <h4 className="text-xs sm:text-sm font-semibold text-emerald-900 mb-2">Hari Kerja (Guru)</h4>
                <div className="text-xs sm:text-sm text-emerald-700">
                  {formData.hariKerja.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.hariKerja.map((day) => {
                        const days = ['Minggu','Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        return (
                          <span key={day} className="px-2 py-1 bg-emerald-100 rounded text-emerald-800 font-medium">
                            {days[day]}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-emerald-600 italic">Belum ada hari yang dipilih</span>
                  )}
                </div>
              </div>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default PengaturanAbsenTab;
