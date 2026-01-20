import React, { useState, useEffect } from 'react';
import { Upload, Save, X, MapPin } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { ProfilSekolah } from '../../../../../types';
import { apiService } from '../../../../../services/apiService';

interface PengaturanProfilSekolahTabProps {
  profilSekolah: ProfilSekolah | null;
  setProfilSekolah: (data: ProfilSekolah) => void;
}

const PengaturanProfilSekolahTab: React.FC<PengaturanProfilSekolahTabProps> = ({
  profilSekolah,
  setProfilSekolah,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProfilSekolah>(
    profilSekolah || {
      id: `profil-sekolah-${Date.now()}`,
      namaSekolah: '',
      npsn: '',
      alamat: '',
      kota: '',
      provinsi: '',
      kodePos: '',
      email: '',
      nomorTelepon: '',
      website: '',
      logoSekolah: '',
      deskripsi: '',
      misiSekolah: '',
      visiSekolah: '',
      latitude: undefined,
      longitude: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
  const [logoPreview, setLogoPreview] = useState<string>(formData.logoSekolah || '');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Update form data when profilSekolah prop changes
  useEffect(() => {
    if (profilSekolah) {
      setFormData({
        ...profilSekolah,
        latitude: profilSekolah.latitude,
        longitude: profilSekolah.longitude,
      });
      setLogoPreview(profilSekolah.logoSekolah || '');
    }
  }, [profilSekolah]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);
        setFormData((prev) => ({
          ...prev,
          logoSekolah: base64,
        }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData((prev) => ({
      ...prev,
      logoSekolah: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChooseLogo = () => {
    fileInputRef.current?.click();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage({
        type: 'error',
        text: 'Geolocation tidak didukung oleh browser Anda',
      });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
        }));
        setMessage({
          type: 'success',
          text: 'Lokasi berhasil diambil!',
        });
        setIsGettingLocation(false);
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Gagal mengambil lokasi';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis.';
            break;
        }
        setMessage({
          type: 'error',
          text: errorMessage,
        });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSave = async () => {
    if (!formData.namaSekolah.trim()) {
      setMessage({
        type: 'error',
        text: 'Nama sekolah tidak boleh kosong!',
      });
      return;
    }

    if (!formData.alamat.trim()) {
      setMessage({
        type: 'error',
        text: 'Alamat tidak boleh kosong!',
      });
      return;
    }

    try {
      const updatedData: ProfilSekolah = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      const response = await apiService.saveProfilSekolah(updatedData);
      
      if (response.success && response.profilSekolah) {
        setProfilSekolah(response.profilSekolah);
        setMessage({
          type: 'success',
          text: 'Profil sekolah berhasil disimpan!',
        });
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Gagal menyimpan profil sekolah',
        });
      }
    } catch (error: any) {
      console.error('Error saving profil sekolah:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Terjadi kesalahan saat menyimpan profil sekolah',
      });
    }

    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      

      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Logo Sekolah
            </h3>
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-32 w-32 object-contain rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="h-32 w-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button onClick={handleChooseLogo} className="w-full sm:w-auto">
                  <Upload size={16} className="mr-2" />
                  Pilih Logo
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Format: JPG, PNG, GIF (Max 2MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Informasi Sekolah
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Sekolah
              </label>
              <input
                type="text"
                name="namaSekolah"
                value={formData.namaSekolah}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan nama sekolah"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NPSN
              </label>
              <input
                type="text"
                name="npsn"
                value={formData.npsn}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nomor Pokok Sekolah Nasional"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat
              </label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan alamat lengkap sekolah"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kota
              </label>
              <input
                type="text"
                name="kota"
                value={formData.kota}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan kota"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provinsi
              </label>
              <input
                type="text"
                name="provinsi"
                value={formData.provinsi}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan provinsi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Pos
              </label>
              <input
                type="text"
                name="kodePos"
                value={formData.kodePos}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan kode pos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan email sekolah"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <input
                type="tel"
                name="nomorTelepon"
                value={formData.nomorTelepon}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan nomor telepon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi Sekolah (Koordinat)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        latitude: value,
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Latitude (contoh: -6.200000)"
                    step="any"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        longitude: value,
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Longitude (contoh: 106.816666)"
                    step="any"
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="whitespace-nowrap w-full sm:w-auto flex items-center justify-center"
                  >
                    <MapPin size={16} className="mr-2" />
                    {isGettingLocation ? 'Mengambil...' : 'Ambil Lokasi Saat Ini'}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Gunakan tombol di atas untuk mengambil lokasi secara otomatis, atau masukkan koordinat secara manual
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Profil Sekolah
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visi Sekolah
            </label>
            <textarea
              name="visiSekolah"
              value={formData.visiSekolah}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan visi sekolah"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Misi Sekolah
            </label>
            <textarea
              name="misiSekolah"
              value={formData.misiSekolah}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan misi sekolah"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Sekolah
            </label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan deskripsi sekolah"
              rows={4}
            />
          </div>
        </div>
      </Card>
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center">
          <Save size={18} className="mr-2" />
          Simpan Profil Sekolah
        </Button>
      </div>
    </div>
  );
};

export default PengaturanProfilSekolahTab;
