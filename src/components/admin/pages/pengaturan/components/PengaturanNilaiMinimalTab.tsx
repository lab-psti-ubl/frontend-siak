import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { apiService } from '../../../../../services/apiService';

interface NilaiMinimalSettings {
  nilaiAkhirMinimal: number;
  tingkatKehadiranMinimal: number;
}

const PengaturanNilaiMinimalTab: React.FC = () => {
  const [settings, setSettings] = useState<NilaiMinimalSettings>({
    nilaiAkhirMinimal: 70,
    tingkatKehadiranMinimal: 75,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch pengaturan nilai minimal from API
  useEffect(() => {
    const fetchPengaturanNilaiMinimal = async () => {
      try {
        setIsLoading(true);
        const result = await apiService.getPengaturanNilaiMinimal();
        if (result.success && result.pengaturanNilaiMinimal) {
          setSettings({
            nilaiAkhirMinimal: result.pengaturanNilaiMinimal.nilaiAkhirMinimal || 70,
            tingkatKehadiranMinimal: result.pengaturanNilaiMinimal.tingkatKehadiranMinimal || 75,
          });
        }
      } catch (error) {
        console.error('Error fetching pengaturan nilai minimal:', error);
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };

    fetchPengaturanNilaiMinimal();
  }, []);

  const handleInputChange = (field: keyof NilaiMinimalSettings, value: number) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (settings.nilaiAkhirMinimal < 0 || settings.nilaiAkhirMinimal > 100) {
      setMessage({
        type: 'error',
        text: 'Nilai akhir minimal harus antara 0-100',
      });
      return;
    }

    if (settings.tingkatKehadiranMinimal < 0 || settings.tingkatKehadiranMinimal > 100) {
      setMessage({
        type: 'error',
        text: 'Tingkat kehadiran minimal harus antara 0-100',
      });
      return;
    }

    try {
      // Save to API
      const result = await apiService.savePengaturanNilaiMinimal({
        nilaiAkhirMinimal: settings.nilaiAkhirMinimal,
        tingkatKehadiranMinimal: settings.tingkatKehadiranMinimal,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Pengaturan nilai minimal berhasil disimpan',
        });
        // Refresh data from API
        const refreshResult = await apiService.getPengaturanNilaiMinimal();
        if (refreshResult.success && refreshResult.pengaturanNilaiMinimal) {
          setSettings({
            nilaiAkhirMinimal: refreshResult.pengaturanNilaiMinimal.nilaiAkhirMinimal || 70,
            tingkatKehadiranMinimal: refreshResult.pengaturanNilaiMinimal.tingkatKehadiranMinimal || 75,
          });
        }
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Terjadi kesalahan saat menyimpan pengaturan nilai minimal',
        });
      }
    } catch (error) {
      console.error('Error saving pengaturan nilai minimal:', error);
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan pengaturan nilai minimal',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Memuat data pengaturan nilai minimal...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
      <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
            <h3 className="text-base sm:text-lg font-bold text-white">Nilai Akhir Minimal</h3>
          </div>
          <div className="p-5 sm:p-6 lg:p-7">
            <form className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                  Nilai Akhir Minimal Untuk Lulus
                </label>
                <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-5">
                  Nilai akhir minimal yang harus dicapai oleh murid untuk dapat dinyatakan lulus/naik kelas
                </p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.nilaiAkhirMinimal}
                    onChange={(e) =>
                      handleInputChange('nilaiAkhirMinimal', parseInt(e.target.value) || 0)
                    }
                    className="w-24 sm:w-32 px-4 sm:px-5 py-2.5 sm:py-3 text-xl sm:text-2xl font-bold text-center border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                  />
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">%</span>
                </div>
              </div>

              <div className="mt-4 p-4 sm:p-5 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                <p className="text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold text-blue-900">Info:</span> Murid dengan nilai akhir di bawah{' '}
                  <span className="font-bold text-blue-600\">{settings.nilaiAkhirMinimal}%</span> akan dinyatakan tidak lulus
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-5 sm:px-6 py-4 border-b border-emerald-200">
            <h3 className="text-base sm:text-lg font-bold text-white">Kehadiran Minimal</h3>
          </div>
          <div className="p-5 sm:p-6 lg:p-7">
            <form className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                  Tingkat Kehadiran Minimal Untuk Lulus
                </label>
                <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-5">
                  Tingkat kehadiran minimal yang harus dicapai oleh murid untuk dapat dinyatakan lulus/naik kelas
                </p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.tingkatKehadiranMinimal}
                    onChange={(e) =>
                      handleInputChange('tingkatKehadiranMinimal', parseInt(e.target.value) || 0)
                    }
                    className="w-24 sm:w-32 px-4 sm:px-5 py-2.5 sm:py-3 text-xl sm:text-2xl font-bold text-center border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all"
                  />
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">%</span>
                </div>
              </div>

              <div className="mt-4 p-4 sm:p-5 bg-emerald-50 rounded-lg sm:rounded-xl border border-emerald-200">
                <p className="text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold text-emerald-900">Info:</span> Murid dengan kehadiran di bawah{' '}
                  <span className="font-bold text-emerald-600">{settings.tingkatKehadiranMinimal}%</span> akan dinyatakan tidak lulus
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
              <h3 className="text-base sm:text-lg font-bold text-white">Ringkasan</h3>
            </div>
            <div className="p-5 sm:p-6 lg:p-7 space-y-4">
              <div className="p-4 sm:p-5 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">Nilai Akhir</p>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">{settings.nilaiAkhirMinimal}</div>
                  <span className="text-sm sm:text-base text-blue-700">% minimum</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-emerald-50 rounded-lg sm:rounded-xl border border-emerald-200">
                <p className="text-xs sm:text-sm font-semibold text-emerald-900 mb-2">Kehadiran</p>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600">{settings.tingkatKehadiranMinimal}</div>
                  <span className="text-sm sm:text-base text-emerald-700">% minimum</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3 text-xs sm:text-sm">Syarat Kelulusan</h4>
                <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 sm:space-y-2">
                  <li className="flex gap-2">
                    <span className="text-blue-600 flex-shrink-0">✓</span>
                    <span>Nilai ≥ {settings.nilaiAkhirMinimal}%</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 flex-shrink-0">✓</span>
                    <span>Hadir ≥ {settings.tingkatKehadiranMinimal}%</span>
                  </li>
                  <li className="flex gap-2 pt-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-600 flex-shrink-0">•</span>
                    <span>Kedua syarat harus terpenuhi</span>
                  </li>
                </ul>
              </div>

              {message.text && (
                <div
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'success' ? (
                      <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs sm:text-sm">{message.text}</span>
                  </div>
                </div>
              )}

              <Button type="submit" fullWidth className="justify-center flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium">
                <Save size={16} className="mr-2" />
                Simpan
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PengaturanNilaiMinimalTab;
