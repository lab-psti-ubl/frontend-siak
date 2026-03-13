import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const MuridProfilePhotoPage: React.FC = () => {
  const { nisn, fileName } = useParams<{ nisn: string; fileName: string }>();
  const [hasError, setHasError] = useState(false);

  const imageUrl = useMemo(() => {
    if (!nisn || !fileName) return '';

    const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    return `${backendBaseUrl}/profile/murid/${encodeURIComponent(
      nisn
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

