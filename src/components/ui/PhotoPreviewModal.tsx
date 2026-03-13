import React from 'react';
import { Download, X, ExternalLink } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  name: string;
  /** URL publik opsional untuk dibuka di tab baru (misal halaman khusus) */
  openUrl?: string;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  name,
  openUrl,
}) => {
  const handleDownload = () => {
    if (!photoUrl) return;

    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `${name}-photo.jpg`;
    link.click();
  };

  const handleOpenInNewTab = () => {
    const targetUrl = openUrl || photoUrl;
    if (!targetUrl) return;
    window.open(targetUrl, '_blank');
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
