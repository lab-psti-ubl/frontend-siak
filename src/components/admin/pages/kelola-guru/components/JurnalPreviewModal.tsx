import React from 'react';
import { Download } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { getFileIcon, formatFileSize } from '../utils/absenGuruHelpers';

interface JurnalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: { name: string; type: string; data: string; size: number } | null;
}

const JurnalPreviewModal: React.FC<JurnalPreviewModalProps> = ({
  isOpen,
  onClose,
  selectedFile
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preview File Jurnal"
      size="xl"
    >
      {selectedFile && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getFileIcon(selectedFile.type)}</span>
              <div>
                <h4 className="font-medium text-blue-900">{selectedFile.name}</h4>
                <p className="text-sm text-blue-700">
                  Ukuran: {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-gray-50">
            {selectedFile.type === 'application/pdf' ? (
              <iframe
                src={selectedFile.data}
                className="w-full h-[600px] border-0"
                title="PDF Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <span className="text-6xl">{getFileIcon(selectedFile.type)}</span>
                <div>
                  <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Ukuran: {formatFileSize(selectedFile.size)}
                  </p>
                  <p className="text-sm text-gray-500 mt-3">
                    Preview tidak tersedia untuk file Word/PowerPoint.
                    <br />
                    Silakan download file untuk melihat isinya.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={onClose}
              variant="secondary"
            >
              Tutup
            </Button>
            <a
              href={selectedFile.data}
              download={selectedFile.name}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} className="mr-2" />
              Download File
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default JurnalPreviewModal;
