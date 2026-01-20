import React, { useState, useEffect } from 'react';
import { User as UserType, Kelas } from '../../../../types';
import { Upload, X, Save } from 'lucide-react';
import Button from '../../../ui/Button';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import PhotoPreviewModal from '../../../ui/PhotoPreviewModal';
import { apiService } from '../../../../services/apiService';
import { useAuth } from '../../../../context/AuthContext';
import { useMurid } from '../../../../hooks/useMurid';
import { DEFAULT_PROFILE_ICON } from '../../../../utils/profilePlaceholder';

interface AccountTabProps {
  user: UserType | null;
  myKelas: Kelas | undefined;
  isSantriNotFromMurid?: boolean;
  myTahfizClasses?: Array<{ namaKelas: string; ruangan: string }>;
}

const AccountTab: React.FC<AccountTabProps> = ({ user, myKelas, isSantriNotFromMurid = false, myTahfizClasses = [] }) => {
  const { setUser } = useAuth();
  const { refreshMurid } = useMurid(); // Hook untuk refresh cache murid dari MongoDB
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsappOrtu: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        whatsappOrtu: user.whatsappOrtu || '',
      });
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file tidak boleh lebih dari 5MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      setProfileImage(base64String);

      // Update profile image immediately via API
      try {
        const response = await apiService.updateMurid(user.id, {
          profileImage: base64String,
        });
        if (response.success && response.murid) {
          // Refresh cache dari MongoDB melalui hook
          await refreshMurid(true); // clearAllCaches = true untuk refresh semua cache
          // Update AuthContext dengan data baru
          setUser(response.murid);
          showSuccessToast('Berhasil', 'Foto profil berhasil diubah!');
        } else {
          showErrorToast('Gagal', response.message || 'Gagal mengubah foto profil');
        }
      } catch (error: any) {
        console.error('Error updating profile image:', error);
        showErrorToast('Error', error.message || 'Terjadi kesalahan saat mengubah foto profil');
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    if (!user) return;
    setProfileImage(null);
    
    // Update via API
    try {
      const response = await apiService.updateMurid(user.id, {
        profileImage: undefined,
      });
      if (response.success && response.murid) {
        // Refresh cache dari MongoDB melalui hook
        await refreshMurid(true); // clearAllCaches = true untuk refresh semua cache
        // Update AuthContext dengan data baru
        setUser(response.murid);
        showSuccessToast('Berhasil', 'Foto profil berhasil dihapus!');
      } else {
        showErrorToast('Gagal', response.message || 'Gagal menghapus foto profil');
      }
    } catch (error: any) {
      console.error('Error removing profile image:', error);
      showErrorToast('Error', error.message || 'Terjadi kesalahan saat menghapus foto profil');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      showErrorToast('Validasi Gagal', 'Nama dan email wajib diisi!');
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiService.updateMurid(user.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        whatsappOrtu: formData.whatsappOrtu.trim() || undefined,
        profileImage: profileImage || undefined,
      });

      if (response.success && response.murid) {
        // Refresh cache dari MongoDB melalui hook
        await refreshMurid(true); // clearAllCaches = true untuk refresh semua cache
        // Update AuthContext dengan data baru
        setUser(response.murid);
        setIsEditing(false);
        showSuccessToast('Berhasil', 'Data berhasil diperbarui!');
      } else {
        showErrorToast('Gagal', response.message || 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
      }
    } catch (error: any) {
      console.error('Error saving data:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.';
      showErrorToast('Gagal', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        whatsappOrtu: user.whatsappOrtu || '',
      });
      setProfileImage(user.profileImage || null);
    }
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">Informasi Akun</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Kelola data pribadi dan profil Anda</p>
        </div>
        {!isEditing ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center w-full sm:w-auto"
          >
            Edit Data
          </Button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center"
            >
              <Save size={16} className="mr-2" />
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-blue-100">
        <h4 className="text-sm sm:text-base font-bold text-blue-900 mb-4 sm:mb-6">Foto Profil</h4>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => profileImage && setIsPhotoPreviewOpen(true)}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center transition-all ${
              profileImage ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'cursor-default'
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
          {isEditing && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <label className="flex items-center justify-center px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 cursor-pointer text-sm sm:text-base font-medium shadow-md hover:shadow-lg">
                <Upload size={16} className="mr-2" />
                <span>{isUploading ? 'Mengunggah...' : 'Ubah Foto'}</span>
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
                  className="flex items-center justify-center px-4 py-2.5 sm:py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium"
                >
                  <X size={16} className="mr-2" />
                  Hapus Foto
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base transition-all duration-200 ${
              isEditing
                ? 'border-blue-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
            disabled={!isEditing}
            required
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base transition-all duration-200 ${
              isEditing
                ? 'border-blue-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
            disabled={!isEditing}
            required
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            NISN
          </label>
          <input
            type="text"
            value={user?.nisn || ''}
            className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-sm sm:text-base"
            disabled
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            {isSantriNotFromMurid ? 'Kelas Tahfiz' : 'Kelas'}
          </label>
          <input
            type="text"
            value={
              isSantriNotFromMurid && myTahfizClasses.length > 0
                ? myTahfizClasses.map(c => c.namaKelas).join(', ')
                : myKelas?.name || 'Tidak ada'
            }
            className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-sm sm:text-base"
            disabled
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            Nomor Telepon
          </label>
          <input
            type="text"
            value={formData.whatsappOrtu}
            onChange={(e) => setFormData({ ...formData, whatsappOrtu: e.target.value })}
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base transition-all duration-200 ${
              isEditing
                ? 'border-blue-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
            disabled={!isEditing}
            placeholder="08xxxxxxxxxx"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            Tanggal Bergabung
          </label>
          <input
            type="text"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
            className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-sm sm:text-base"
            disabled
          />
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
