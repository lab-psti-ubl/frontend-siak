import React, { useState } from 'react';
import { AlertTriangle, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../../../ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

interface ResetDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

const ResetDatabaseModal: React.FC<ResetDatabaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password.trim()) {
      setError(t('system.passwordRequired') || 'Sandi aktivasi harus diisi');
      return;
    }

    setLoading(true);

    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || t('system.passwordIncorrect') || 'Sandi aktivasi salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPassword('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-2">
          {t('system.resetDatabaseTitle') || 'Reset Database'}
        </h2>
        <p className="text-center text-gray-600 mb-4 text-sm">
          {t('system.resetDatabaseWarning') || 'Tindakan ini akan menghapus SEMUA data dari database dan mengembalikan sistem ke kondisi awal.'}
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 mb-2">
                {t('system.resetDatabaseWarningTitle') || 'PERINGATAN!'}
              </p>
              <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                <li>{t('system.resetDatabaseWarning1') || 'Semua data murid, guru, kelas, absensi, dan nilai akan dihapus'}</li>
                <li>{t('system.resetDatabaseWarning2') || 'Data pengaturan akan direset ke default'}</li>
                <li>{t('system.resetDatabaseWarning3') || 'Hanya akun admin default yang akan tetap ada'}</li>
                <li>{t('system.resetDatabaseWarning4') || 'Tindakan ini TIDAK DAPAT DIBATALKAN'}</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 mb-4 text-sm">
          {t('system.enterActivationPassword') || 'Silakan masukkan sandi aktivasi untuk melanjutkan'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('system.activationPassword') || 'Sandi Aktivasi'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('system.enterActivationPasswordPlaceholder') || 'Masukkan sandi aktivasi'}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg flex items-start gap-3 bg-red-50 border border-red-200">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
            >
              {t('common.cancel') || 'Batal'}
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              {t('system.resetDatabaseConfirm') || 'Reset Database'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            {t('system.passwordRequiredInfo') || 'Sandi aktivasi diperlukan untuk keamanan sistem'}
          </p>
          <p className="text-xs text-red-600 text-center font-medium">
            {t('system.resetDatabaseInfo') || 'Pastikan Anda telah membuat backup data sebelum melakukan reset'}
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetDatabaseModal;

