import React, { useState, useEffect } from 'react';
import { User as UserType, Kelas } from '../../../../types';
import { Upload, X, Save } from 'lucide-react';
import Button from '../../../ui/Button';
import { apiService } from '../../../../services/apiService';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import PhotoPreviewModal from '../../../ui/PhotoPreviewModal';
import { useGurus } from '../../../../hooks/useGurus';
import { DEFAULT_PROFILE_ICON } from '../../../../utils/profilePlaceholder';

interface AccountTabProps {
  user: UserType | null;
  kelasWali?: Kelas;
}

const AccountTab: React.FC<AccountTabProps> = ({ user, kelasWali }) => {
  const { user: authUser, setUser } = useAuth();
  const { t } = useLanguage();
  const { refreshGurus } = useGurus(); // Hook untuk refresh cache guru dari MongoDB
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast(t('dashboardGuru.accountTab.ukuranFileTerlaluBesar'), t('dashboardGuru.accountTab.ukuranFileMax5MB'));
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      
      try {
        const response = await apiService.updateProfilGuru({
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: base64String,
        });

        if (response.success && response.guru) {
          setProfileImage(base64String);
          // Refresh cache dari MongoDB melalui hook
          await refreshGurus();
          // Update AuthContext dengan data baru
          setUser(response.guru);
          showSuccessToast(t('dashboardGuru.accountTab.berhasil'), t('dashboardGuru.accountTab.fotoProfilBerhasilDiubah'));
        } else {
          showErrorToast(t('dashboardGuru.accountTab.gagal'), response.message || t('dashboardGuru.accountTab.gagalMengubahFotoProfil'));
        }
      } catch (error: any) {
        showErrorToast(t('dashboardGuru.accountTab.error'), error.message || t('dashboardGuru.accountTab.terjadiKesalahanMengubahFotoProfil'));
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.updateProfilGuru({
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: undefined,
      });

      if (response.success && response.guru) {
        setProfileImage(null);
        // Refresh cache dari MongoDB melalui hook
        await refreshGurus();
        // Update AuthContext dengan data baru
        setUser(response.guru);
        showSuccessToast(t('dashboardGuru.accountTab.berhasil'), t('dashboardGuru.accountTab.fotoProfilBerhasilDihapus'));
      } else {
        showErrorToast(t('dashboardGuru.accountTab.gagal'), response.message || t('dashboardGuru.accountTab.gagalMenghapusFotoProfil'));
      }
    } catch (error: any) {
      showErrorToast(t('dashboardGuru.accountTab.error'), error.message || t('dashboardGuru.accountTab.terjadiKesalahanMenghapusFotoProfil'));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.name.trim() || !formData.email.trim()) {
      showErrorToast(t('dashboardGuru.accountTab.validasiGagal'), t('dashboardGuru.accountTab.namaDanEmailWajibDiisi'));
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiService.updateProfilGuru({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        profileImage: profileImage || undefined,
      });

      if (response.success && response.guru) {
        // Refresh cache dari MongoDB melalui hook
        await refreshGurus();
        // Update AuthContext dengan data baru
        setUser(response.guru);
        setIsEditing(false);
        showSuccessToast(t('dashboardGuru.accountTab.berhasil'), t('dashboardGuru.accountTab.dataBerhasilDiperbarui'));
      } else {
        showErrorToast(t('dashboardGuru.accountTab.gagal'), response.message || t('dashboardGuru.accountTab.gagalMemperbaruiData'));
      }
    } catch (error: any) {
      console.error('Error saving data:', error);
      showErrorToast(t('dashboardGuru.accountTab.gagal'), error.message || t('dashboardGuru.accountTab.terjadiKesalahanMenyimpanData'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setProfileImage(user.profileImage || null);
    }
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">{t('dashboardGuru.accountTab.title')}</h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">{t('dashboardGuru.accountTab.subtitle')}</p>
          </div>
          {!isEditing ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center text-xs sm:text-sm"
            >
              {t('dashboardGuru.accountTab.editData')}
            </Button>
          ) : (
            <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
              <Button
                type="button"
                
                onClick={handleCancel}
                disabled={isSaving}
                className="text-xs sm:text-sm bg-red-600"
              >
                {t('dashboardGuru.accountTab.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <Save size={16} />
                {isSaving ? t('dashboardGuru.accountTab.saving') : t('dashboardGuru.accountTab.save')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-slate-50">
          <h4 className="text-sm sm:text-base font-semibold text-slate-900 uppercase tracking-wide">{t('dashboardGuru.accountTab.photoProfil')}</h4>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8">
            <div className="flex flex-col items-center sm:items-start gap-4">
              <button
                type="button"
                onClick={() => profileImage && setIsPhotoPreviewOpen(true)}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center transition-all duration-200 ${
                  profileImage ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-blue-400' : 'cursor-default'
                }`}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Foto Profil" className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={DEFAULT_PROFILE_ICON}
                    alt="Ikon profil default"
                    className="w-12 h-12 sm:w-14 sm:h-14"
                  />
                )}
              </button>
              {!isEditing && profileImage && (
                <p className="text-xs text-slate-500">{t('dashboardGuru.accountTab.klikUntukPreview')}</p>
              )}
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {isEditing && (
                <>
                  <label className="flex items-center justify-center sm:justify-start px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors duration-200 cursor-pointer">
                    <Upload size={18} className="mr-2" />
                    <span>{isUploading ? t('dashboardGuru.accountTab.mengunggah') : t('dashboardGuru.accountTab.ubahFoto')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="flex items-center justify-center sm:justify-start px-4 sm:px-5 py-2.5 sm:py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm sm:text-base font-medium rounded-lg transition-colors duration-200 border border-red-200 hover:border-red-300"
                    >
                      <X size={18} className="mr-2" />
                      {t('dashboardGuru.accountTab.hapusFoto')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-slate-50">
          <h4 className="text-sm sm:text-base font-semibold text-slate-900 uppercase tracking-wide">{t('dashboardGuru.accountTab.dataPribadi')}</h4>
        </div>
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {t('dashboardGuru.accountTab.namaLengkap')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg transition-all duration-200 ${
                  isEditing
                    ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
                disabled={!isEditing}
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {t('dashboardGuru.accountTab.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg transition-all duration-200 ${
                  isEditing
                    ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
                disabled={!isEditing}
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {t('dashboardGuru.accountTab.nip')}
              </label>
              <input
                type="text"
                value={user?.nip || ''}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {t('dashboardGuru.accountTab.posisiJabatan')}
              </label>
              <input
                type="text"
                value={user?.subject || '-'}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {t('dashboardGuru.accountTab.nomorTelepon')}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg transition-all duration-200 ${
                  isEditing
                    ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
                disabled={!isEditing}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            {(user as any)?.isWaliKelas && kelasWali && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  {t('dashboardGuru.accountTab.waliKelas')}
                </label>
                <input
                  type="text"
                  value={kelasWali?.name || '-'}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  disabled
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <PhotoPreviewModal
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        photoUrl={profileImage}
        name={formData.name}
      />
    </form>
  );
};

export default AccountTab;
