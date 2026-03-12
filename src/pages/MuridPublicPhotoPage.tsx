import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/apiService';

const MuridPublicPhotoPage: React.FC = () => {
  const { nisn, filename } = useParams<{ nisn: string; filename: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhoto = async () => {
      if (!nisn) {
        setError('NISN tidak valid');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getMuridProfilePhotoByNisn(nisn);

        if (response.success && response.profileImage) {
          setProfileImage(response.profileImage);
          setName(response.name || null);
        } else {
          setError(response.message || 'Foto profil tidak ditemukan');
        }
      } catch (err: any) {
        console.error('Gagal memuat foto profil murid:', err);
        setError(err?.message || 'Terjadi kesalahan saat memuat foto profil');
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [nisn]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {loading && (
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
      )}

      {!loading && error && (
        <div className="text-center text-red-500 text-sm px-4">
          {error}
        </div>
      )}

      {!loading && !error && profileImage && (
        <img
          src={profileImage}
          alt={name || filename || nisn || 'Foto profil murid'}
          className="max-w-full max-h-screen object-contain"
        />
      )}
    </div>
  );
};

export default MuridPublicPhotoPage;

