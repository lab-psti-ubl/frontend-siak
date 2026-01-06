import React from 'react';
import Modal from '../../../../ui/Modal';

interface PreviewKTAProps {
  previewMode: 'depan' | 'belakang' | null;
  backgroundDepan: string;
  backgroundBelakang: string;
  ktaType: 'murid' | 'guru';
  onClose: () => void;
}

const PreviewKTA: React.FC<PreviewKTAProps> = ({
  previewMode,
  backgroundDepan,
  backgroundBelakang,
  ktaType,
  onClose,
}) => {
  if (!previewMode) return null;

  const title = `Preview Background ${previewMode === 'depan' ? 'Depan' : 'Belakang'} KTA ${ktaType === 'murid' ? 'Murid' : 'Guru'}`;

  return (
    <Modal
      isOpen={!!previewMode}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="flex justify-center items-center py-6">
        {previewMode === 'depan' ? (
          <div
            style={{
              width: '163px',
              height: '255px',
              backgroundImage: `url(${backgroundDepan})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            }}
          />
        ) : (
          <div
            style={{
              width: '255px',
              height: '163px',
              backgroundImage: `url(${backgroundBelakang})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            }}
          />
        )}
      </div>
    </Modal>
  );
};

export default PreviewKTA;
