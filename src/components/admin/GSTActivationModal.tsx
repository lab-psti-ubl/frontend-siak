import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import { activateSystem } from '../../utils/systemActivationUtils';
import { useAuth } from '../../context/AuthContext';

interface GSTActivationModalProps {
  onActivationSuccess: () => void;
  onLogout?: () => void;
}

const GSTActivationModal: React.FC<GSTActivationModalProps> = ({ onActivationSuccess, onLogout }) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await activateSystem(password, user?.id);

      if (result.success) {
        setSuccess(true);
        setPassword('');
        setTimeout(() => {
          onActivationSuccess();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengaktifkan sistem');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Aktivasi Berhasil!</h2>
          <p className="text-center text-gray-600">Sistem aplikasi telah diaktifkan dan siap digunakan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Aktivasi Sistem Aplikasi
        </h2>
        <p className="text-center text-gray-600 mb-6 text-sm">
          Silakan masukkan sandi Aktivasi untuk mengaktifkan sistem aplikasi
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sandi Aktivasi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan sandi Aktivasi"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg flex items-start gap-3 bg-red-50 border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {error}
                </p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
            className="h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Aktivasi Sistem
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Sistem akan diaktifkan setelah sandi yang benar dimasukkan
          </p>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900 leading-relaxed">
            <span className="font-semibold">Informasi:</span> Sistem aplikasi belum aktif. Hanya administrator yang dapat mengaktifkan sistem dengan memasukkan sandi Aktivasi yang benar. Setelah sistem diaktifkan, semua pengguna (guru dan murid) dapat melakukan login.
          </p>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-4 w-full py-2 text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Keluar
          </button>
        )}
      </div>
    </div>
  );
};

export default GSTActivationModal;
