import React from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import Button from '../../../ui/Button';
import { useLanguage } from '../../../../context/LanguageContext';

interface PasswordTabProps {
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  message: { type: string; text: string };
  onPasswordFormChange: (field: string, value: string) => void;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const PasswordTab: React.FC<PasswordTabProps> = ({
  passwordForm,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  message,
  onPasswordFormChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onSubmit,
}) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">{t('dashboardGuru.passwordTab.title')}</h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">{t('dashboardGuru.passwordTab.subtitle')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-6">
          <div className="space-y-5 sm:space-y-6 max-w-2xl">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {t('dashboardGuru.passwordTab.passwordSaatIni')}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => onPasswordFormChange('currentPassword', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={onToggleCurrentPassword}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {t('dashboardGuru.passwordTab.passwordBaru')}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => onPasswordFormChange('newPassword', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={onToggleNewPassword}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">{t('dashboardGuru.passwordTab.minimal6Karakter')}</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {t('dashboardGuru.passwordTab.konfirmasiPasswordBaru')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => onPasswordFormChange('confirmPassword', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={onToggleConfirmPassword}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 sm:p-5 rounded-lg border text-sm sm:text-base ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3">
              <Save size={18} />
              {t('dashboardGuru.passwordTab.ubahPassword')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PasswordTab;
