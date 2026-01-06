import React, { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import Button from '../../../ui/Button';

interface PasswordTabProps {
  onPasswordChange: (currentPassword: string, newPassword: string, confirmPassword: string) => void;
  message: { type: string; text: string };
}

const PasswordTab: React.FC<PasswordTabProps> = ({ onPasswordChange, message }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPasswordChange(
      passwordForm.currentPassword,
      passwordForm.newPassword,
      passwordForm.confirmPassword
    );
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 sm:pb-6 border-b border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Ubah Password</h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">Ganti password untuk meningkatkan keamanan akun Anda</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-200">
        <div className="flex gap-3">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div className="text-xs sm:text-sm text-blue-800">
            <p className="font-semibold mb-1">Syarat Password Kuat:</p>
            <ul className="space-y-1">
              <li>• Minimal 6 karakter</li>
              <li>• Gunakan kombinasi huruf dan angka</li>
              <li>• Jangan gunakan password yang mudah ditebak</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2.5">
            Password Saat Ini
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 sm:py-3 pr-12 border border-slate-200 rounded-lg text-sm sm:text-base bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Masukkan password saat ini"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 border border-slate-200">
          <div className="space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2.5">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 pr-12 border border-slate-200 rounded-lg text-sm sm:text-base bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Masukkan password baru"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2.5">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 pr-12 border border-slate-200 rounded-lg text-sm sm:text-base bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Konfirmasi password baru"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 sm:p-5 rounded-lg sm:rounded-xl border text-sm sm:text-base font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 flex items-start gap-3'
              : 'bg-red-50 text-red-800 border-red-200 flex items-start gap-3'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              message.type === 'success' ? 'bg-emerald-200' : 'bg-red-200'
            }`}>
              <span className={`text-xs font-bold ${message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                {message.type === 'success' ? '✓' : '!'}
              </span>
            </div>
            <span>{message.text}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
        >
          <Save size={18} className="mr-2" />
          Ubah Password
        </Button>
      </form>
    </div>
  );
};

export default PasswordTab;
