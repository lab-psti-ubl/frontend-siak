import React, {useMemo, useState} from "react";
import {useParams} from "react-router-dom";

const MuridProfilePhotoPage: React.FC = () => {
  const {nisn, fileName} = useParams<{nisn: string; fileName: string}>();
  const [hasError, setHasError] = useState(false);

  const imageUrl = useMemo(() => {
    if (!nisn || !fileName) return "";

    // Gunakan base URL backend API secara eksplisit agar tidak tergantung pada routing frontend.
    // Jika VITE_API_URL tidak diset, fallback ke origin + '/api'.
    const rawApiBaseUrl =
      import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
    const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, "");

    // Endpoint backend disiapkan di server sebagai route public:
    // GET /api/profile/murid/:nisn/upload/:fileName/foto
    return `${apiBaseUrl}/profile/murid/${encodeURIComponent(
      nisn,
    )}/upload/${encodeURIComponent(fileName)}/foto`;
  }, [nisn, fileName]);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      {!hasError && imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="max-w-full max-h-screen object-contain"
          onError={() => setHasError(true)}
        />
      ) : null}
    </div>
  );
};

export default MuridProfilePhotoPage;
