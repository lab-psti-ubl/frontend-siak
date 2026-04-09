import React from 'react';
import { Outlet } from 'react-router-dom';
import { useProfilSekolahPublic } from '../hooks/useProfilSekolahPublic';
import ProfileSekolahNavbar from './profile-sekolah/ProfileSekolahNavbar';

const containerClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const ProfileSekolahPage: React.FC = () => {
  const { profilSekolah } = useProfilSekolahPublic();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ProfileSekolahNavbar
        brandTitle={profilSekolah?.namaSekolah || 'Profil Sekolah'}
        logoUrl={profilSekolah?.logoSekolah}
      />
      <Outlet />
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className={`${containerClass} text-center text-slate-500 text-xs`}>
          © {new Date().getFullYear()} {profilSekolah?.namaSekolah || 'Sekolah'}. Halaman profil sekolah.
        </div>
      </footer>
    </div>
  );
};

export default ProfileSekolahPage;
