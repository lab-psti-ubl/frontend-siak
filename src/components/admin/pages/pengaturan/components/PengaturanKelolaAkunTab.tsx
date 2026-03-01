import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Mail, Lock, User as UserIcon } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { useAuth } from '../../../../../context/AuthContext';
import { apiService } from '../../../../../services/apiService';
import { useLanguage } from '../../../../../context/LanguageContext';

type MessageState = { type: 'success' | 'error'; text: string } | null;

const PengaturanKelolaAkunTab: React.FC = () => {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();

  const [profileForm, setProfileForm] = useState({
    newEmail: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<MessageState>(null);
  const [passwordMessage, setPasswordMessage] = useState<MessageState>(null);

  const isHardcodedAdmin =
    user?.id === 'admin-hardcoded' || user?.email === 'garnusa@gmail.com';

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const currentEmail = user.email || '';
    const newEmail = profileForm.newEmail.trim();

    if (!newEmail) {
      setProfileMessage({
        type: 'error',
        text: 'Email baru wajib diisi',
      });
      return;
    }

    if (newEmail === currentEmail) {
      setProfileMessage({
        type: 'error',
        text: 'Email baru tidak boleh sama dengan email saat ini',
      });
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await apiService.updateAdminAccount({
        email: newEmail,
      });

      if (!res.success) {
        setProfileMessage({
          type: 'error',
          text: res.message || 'Gagal memperbarui akun admin',
        });
        return;
      }

      if (res.user) {
        const updatedUser = { ...user, ...res.user };
        setUser(updatedUser);
        try {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        } catch {
          // ignore storage errors
        }
      }

      setProfileMessage({
        type: 'success',
        text: res.message || 'Akun admin berhasil diperbarui',
      });
    } catch (error: any) {
      setProfileMessage({
        type: 'error',
        text:
          error?.message ||
          t('dashboardGuru.accountTab.terjadiKesalahanMenyimpanData') ||
          'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Password saat ini dan password baru wajib diisi',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Password baru minimal 6 karakter',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Konfirmasi password baru tidak sama',
      });
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await apiService.changeAdminPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (!res.success) {
        setPasswordMessage({
          type: 'error',
          text: res.message || 'Gagal mengubah password admin',
        });
        return;
      }

      setPasswordMessage({
        type: 'success',
        text: res.message || 'Password admin berhasil diubah',
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setPasswordMessage({
        type: 'error',
        text:
          error?.message ||
          'Terjadi kesalahan saat mengubah password admin',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
        <div className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                {t('settings.kelola_akun') || 'Kelola Akun Admin'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Ubah email login admin. Nama dan nomor telepon tidak diubah dari sini.
              </p>
            </div>
          </div>

          {isHardcodedAdmin && (
            <div className="p-3 sm:p-4 rounded-lg border border-amber-200 bg-amber-50 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-amber-800">
                Akun admin utama <strong>garnusa@gmail.com / garnusa123</strong>{' '}
                bersifat hardcode dan <strong>tidak dapat diubah</strong> melalui menu
                ini. Gunakan akun admin lain jika ingin mengganti email atau password.
              </p>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Email Saat Ini
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Email Baru
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={profileForm.newEmail}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, newEmail: e.target.value }))
                    }
                    disabled={isSavingProfile || isHardcodedAdmin}
                    placeholder="Masukkan email admin yang baru"
                  />
                </div>
              </div>
            </div>

            {profileMessage && (
              <div
                className={`p-3 sm:p-4 rounded-lg flex items-start gap-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">{profileMessage.text}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSavingProfile || isHardcodedAdmin}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('common.save') || 'Simpan'}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <Card>
        <div className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-lg">
              <Lock className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Ubah Password Admin
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Pastikan password baru minimal 6 karakter.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  disabled={isSavingPassword || isHardcodedAdmin}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  disabled={isSavingPassword || isHardcodedAdmin}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Minimal 6 karakter.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  disabled={isSavingPassword || isHardcodedAdmin}
                />
              </div>
            </div>

            {passwordMessage && (
              <div
                className={`p-3 sm:p-4 rounded-lg flex items-start gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">{passwordMessage.text}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSavingPassword || isHardcodedAdmin}
                className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
              >
                {isSavingPassword ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Ubah Password</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default PengaturanKelolaAkunTab;

