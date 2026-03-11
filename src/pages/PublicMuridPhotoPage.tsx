import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const PublicMuridPhotoPage: React.FC = () => {
  const { nisn } = useParams<{ nisn: string; filename?: string }>();
  const [hasError, setHasError] = useState(false);

  const apiPhotoUrl = useMemo(() => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    if (!nisn || !apiBaseUrl) return '';
    return `${apiBaseUrl}/murid/nisn/${nisn}/foto`;
  }, [nisn]);

  if (!nisn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        NISN murid tidak valid.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {!apiPhotoUrl ? (
          <div className="text-center text-slate-300">
            Konfigurasi API belum tersedia.
          </div>
        ) : hasError ? (
          <div className="text-center max-w-md">
            <p className="text-slate-100 font-semibold mb-2">Foto profil tidak dapat dimuat</p>
            <p className="text-slate-400 text-sm">
              Pastikan foto profil sudah di-set oleh sekolah dan server sedang aktif.
            </p>
          </div>
        ) : (
          <img
            src={apiPhotoUrl}
            alt="Foto Profil Murid"
            className="max-w-full max-h-[92vh] object-contain rounded-2xl shadow-2xl bg-slate-900"
            onError={() => setHasError(true)}
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
};

export default PublicMuridPhotoPage;

