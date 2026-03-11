import React from 'react';
import { Download, X, ExternalLink } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  name: string;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  name
}) => {
  const handleDownload = () => {
    if (!photoUrl) return;

    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `${name}-photo.jpg`;
    link.click();
  };

  const handleOpenInNewTab = () => {
    if (!photoUrl) return;

    // Buka tab baru dengan halaman sederhana yang hanya menampilkan gambar.
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      // Jika popup diblokir, biarkan user tetap bisa klik kanan pada gambar di modal.
      alert('Gagal membuka tab baru. Mohon izinkan pop-up untuk situs ini.');
      return;
    }

    const safeTitle = name || 'Foto Profil';
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <title>${safeTitle}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #0f172a;
              height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              box-shadow: 0 10px 25px rgba(15,23,42,0.6);
              border-radius: 16px;
              background-color: #020617;
            }
          </style>
        </head>
        <body>
          <img src="${photoUrl}" alt="${safeTitle}" />
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Foto Profil - ${name}`}
      size="md"
    >
      <div className="space-y-4">
        {photoUrl && (
          <div className="flex justify-center">
            <div className="max-w-sm w-full">
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={handleOpenInNewTab}
            className="flex items-center"
          >
            <ExternalLink size={16} className="mr-2" />
            Buka di Tab Baru
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            className="flex items-center"
          >
            <Download size={16} className="mr-2" />
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PhotoPreviewModal;
