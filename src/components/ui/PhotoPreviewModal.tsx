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
    window.open(photoUrl, '_blank');
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
