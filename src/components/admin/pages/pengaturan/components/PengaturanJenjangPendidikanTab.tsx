import React, { useState } from 'react';
import { Save, CheckCircle, AlertCircle, Lock, GraduationCap, RotateCcw, AlertTriangle } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { PengaturanJenjangPendidikan } from '../../../../../types';
import { getJenjangDescription } from '../../../../../utils/jenjangPendidikanUtils';
import { apiService } from '../../../../../services/apiService';

interface PengaturanJenjangPendidikanTabProps {
  pengaturanJenjang: PengaturanJenjangPendidikan[];
  setPengaturanJenjang: (data: PengaturanJenjangPendidikan[]) => void;
}

const PengaturanJenjangPendidikanTab: React.FC<PengaturanJenjangPendidikanTabProps> = ({
  pengaturanJenjang,
  setPengaturanJenjang,
}) => {
  const activeJenjang = pengaturanJenjang.find(p => p.isActive);
  const [selectedJenjang, setSelectedJenjang] = useState<'SD' | 'SMP' | 'SMA/SMK' | ''>('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const jenjangOptions = [
    {
      value: 'SD' as const,
      label: 'Sekolah Dasar (SD)',
      deskripsi: 'Jenjang pendidikan dasar untuk kelas 1-6',
    },
    {
      value: 'SMP' as const,
      label: 'Sekolah Menengah Pertama (SMP)',
      deskripsi: 'Jenjang pendidikan menengah pertama untuk kelas 7-9',
    },
    {
      value: 'SMA/SMK' as const,
      label: 'Sekolah Menengah Atas / Kejuruan (SMA/SMK)',
      deskripsi: 'Jenjang pendidikan menengah atas untuk kelas X-XII',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJenjang) {
      setMessage({ type: 'error', text: 'Pilih jenjang pendidikan terlebih dahulu' });
      return;
    }

    if (activeJenjang) {
      setMessage({ type: 'error', text: 'Jenjang pendidikan tidak dapat diubah setelah dipilih' });
      return;
    }

    const newJenjang: PengaturanJenjangPendidikan = {
      id: 'jenjang_' + Date.now().toString(),
      jenjang: selectedJenjang,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setPengaturanJenjang([...pengaturanJenjang, newJenjang]);
    setMessage({ type: 'success', text: `Jenjang pendidikan ${selectedJenjang} berhasil disimpan` });
    setSelectedJenjang('');

    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleResetDatabase = async () => {
    try {
      setIsResetting(true);
      const response = await apiService.resetDatabase();
      
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: 'Database berhasil direset. Semua data telah dihapus dan data default telah dibuat ulang. Silakan refresh halaman.' 
        });
        setShowResetConfirm(false);
        
        // Reload page after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: response.message || 'Gagal mereset database' 
        });
      }
    } catch (error: any) {
      console.error('Error resetting database:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Terjadi kesalahan saat mereset database' 
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
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

      {activeJenjang && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-amber-900 mb-1">Jenjang Sudah Dipilih</h4>
            <p className="text-xs sm:text-sm text-amber-800">
              Jenjang pendidikan tidak dapat diubah setelah dipilih. Hubungi administrator jika perlu mengubah jenjang.
            </p>
          </div>
        </div>
      )}

      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Pilih Jenjang Pendidikan</h3>
            <p className="text-xs sm:text-sm text-slate-600">Pilih jenjang pendidikan yang akan digunakan di sekolah ini. Pilihan ini tidak dapat diubah setelah disimpan.</p>
          </div>

          {!activeJenjang ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                {jenjangOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <input
                      type="radio"
                      name="jenjang"
                      value={option.value}
                      checked={selectedJenjang === option.value}
                      onChange={(e) => setSelectedJenjang(e.target.value as 'SD' | 'SMP' | 'SMA/SMK')}
                      className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0 cursor-pointer"
                      disabled={!!activeJenjang}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-slate-900">{option.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">{option.deskripsi}</p>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                type="submit"
                disabled={!!activeJenjang}
                fullWidth
                className={`justify-center flex items-center text-white text-xs sm:text-sm py-2 sm:py-3 ${
                  activeJenjang
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Save size={16} className="mr-2" />
                Simpan Jenjang Pendidikan
              </Button>
            </form>
          ) : (
            <div className="p-4 sm:p-5 bg-emerald-50 rounded-lg border border-emerald-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900">Jenjang Pendidikan Aktif</p>
                  <p className="text-xs text-emerald-800 mt-0.5">Pengaturan sudah disimpan dan tidak dapat diubah</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Informasi Jenjang Pendidikan</h3>
            <p className="text-xs sm:text-sm text-slate-600">Status dan detail jenjang pendidikan yang aktif</p>
          </div>

          {activeJenjang ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs sm:text-sm font-semibold text-emerald-900">Jenjang Aktif</h4>
                </div>
                <p className="text-lg sm:text-xl font-bold text-emerald-900">{activeJenjang.jenjang}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-100">
                <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  <span className="text-xs sm:text-sm font-semibold text-blue-900">Aktif</span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-lg border border-slate-100">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2">Dibuat</h4>
                <p className="text-xs sm:text-sm font-mono text-slate-700">
                  {new Date(activeJenjang.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-slate-500">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm sm:text-base font-medium">Belum ada jenjang pendidikan yang dipilih</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Pilih jenjang pendidikan di atas untuk memulai</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Panduan Pengaturan Jenjang Pendidikan</h3>
          <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
            <li className="flex gap-2">
              <span className="text-blue-600 font-semibold flex-shrink-0">1.</span>
              <span>Pilih jenjang pendidikan sesuai dengan tingkat pendidikan sekolah Anda</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-semibold flex-shrink-0">2.</span>
              <span>Klik tombol "Simpan Jenjang Pendidikan" untuk menyimpan pilihan</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-semibold flex-shrink-0">3.</span>
              <span>Setelah disimpan, jenjang pendidikan tidak dapat diubah untuk menjaga integritas data</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-semibold flex-shrink-0">4.</span>
              <span>Jika perlu mengubah, hubungi administrator sistem</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Reset Database Card */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Reset Database</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Reset database akan menghapus semua data yang ada di collection database dan mengembalikannya ke kondisi awal dengan data default yang ditambahkan secara otomatis.
            </p>
          </div>

          {showResetConfirm ? (
            <div className="p-4 sm:p-5 bg-red-50 border border-red-200 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-semibold text-red-900 mb-2">
                    Konfirmasi Reset Database
                  </h4>
                  <p className="text-xs sm:text-sm text-red-800 mb-4">
                    Anda yakin ingin mereset database? Tindakan ini akan:
                  </p>
                  <ul className="text-xs sm:text-sm text-red-800 space-y-1 mb-4 list-disc list-inside">
                    <li>Menghapus semua data dari semua collection</li>
                    <li>Mengembalikan password admin ke default (admin123)</li>
                    <li>Membuat ulang data default pengaturan sistem</li>
                    <li>Tindakan ini tidak dapat dibatalkan!</li>
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleResetDatabase}
                      disabled={isResetting}
                      className={`flex-1 flex justify-center items-center text-white text-xs sm:text-sm py-2 sm:py-3 ${
                        isResetting
                          ? 'bg-red-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isResetting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Mereset...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} className="mr-2" />
                          Ya, Reset Database
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowResetConfirm(false)}
                      disabled={isResetting}
                      className="flex-1 justify-center bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs sm:text-sm py-2 sm:py-3"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowResetConfirm(true)}
              fullWidth
              className="justify-center flex items-center bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm py-2 sm:py-3"
            >
              <RotateCcw size={16} className="mr-2" />
              Reset Database
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PengaturanJenjangPendidikanTab;
