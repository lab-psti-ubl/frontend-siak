import React, { useEffect, useState } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { getBuktiFromLocalStorage } from '../../../utils/fileUploadUtils';

interface BuktiPendukungModalProps {
  isOpen: boolean;
  onClose: () => void;
  buktiName: string;
  buktiData?: string;
  buktiId?: string;
  mimeType?: string;
}

const BuktiPendukungModal: React.FC<BuktiPendukungModalProps> = ({
  isOpen,
  onClose,
  buktiName,
  buktiData,
  buktiId,
  mimeType
}) => {
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedMimeType, setDetectedMimeType] = useState<string | undefined>(mimeType);

  useEffect(() => {
    if (isOpen) {
      setImageData(undefined);
      setError(null);
      setIsLoading(true);
      setDetectedMimeType(mimeType);

      if (buktiData && buktiData.trim() !== '') {
        // Jika buktiData langsung diberikan (format baru dari database)
        setImageData(buktiData);
        setIsLoading(false);
      } else if (buktiId && buktiId.trim() !== '') {
        try {
          // Coba parse sebagai JSON (format baru dari database)
          const parsed = JSON.parse(buktiId);
          if (parsed.base64 && parsed.base64.trim() !== '') {
            setImageData(parsed.base64);
            setDetectedMimeType(parsed.mimeType || mimeType);
            setError(null);
            setIsLoading(false);
          } else {
            throw new Error('Invalid format');
          }
        } catch {
          // Jika bukan JSON, coba cari di localStorage (backward compatibility)
          try {
            const fileData = getBuktiFromLocalStorage(buktiId);
            if (fileData && fileData.base64 && fileData.base64.trim() !== '') {
              setImageData(fileData.base64);
              setDetectedMimeType(fileData.mimeType);
              setError(null);
            } else {
              setError('Bukti pendukung tidak ditemukan');
            }
          } catch (err) {
            setError('Gagal memuat bukti pendukung');
            console.error('Error loading bukti:', err);
          } finally {
            setIsLoading(false);
          }
        }
      } else {
        setError('Bukti pendukung tidak tersedia');
        setIsLoading(false);
      }
    }
  }, [isOpen, buktiData, buktiId, mimeType]);

  if (!isOpen) return null;

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const isImage = (fileName: string): boolean => {
    if (detectedMimeType) {
      return detectedMimeType.startsWith('image/');
    }
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return imageExtensions.includes(getFileExtension(fileName));
  };

  const isPDF = (fileName: string): boolean => {
    if (detectedMimeType) {
      return detectedMimeType === 'application/pdf';
    }
    return getFileExtension(fileName) === 'pdf';
  };

  const handleDownload = () => {
    if (imageData) {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = buktiName || 'bukti-pendukung';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Bukti Pendukung</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Nama File:</p>
            <p className="font-medium text-gray-900 break-all">{buktiName}</p>
          </div>

          <div className="mb-6">
            

            {isLoading && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-gray-600 mt-4">Memuat bukti pendukung...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-lg p-8 text-center border border-red-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-lg mb-4">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {isImage(buktiName) && imageData && !isLoading && (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
                <img
                  src={imageData}
                  alt="Bukti Pendukung"
                  className="max-w-full max-h-full object-contain"
                  onError={() => setError('Gagal memuat gambar')}
                />
              </div>
            )}

            {!imageData && !error && !isLoading && isImage(buktiName) && (
              <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-lg mb-4">
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-600">Bukti pendukung tidak tersedia</p>
                <p className="text-sm text-gray-500 mt-2">Kemungkinan data telah dihapus dari penyimpanan lokal</p>
              </div>
            )}

            {isPDF(buktiName) && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-lg mb-4">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-600">File PDF tidak dapat ditampilkan secara langsung di browser</p>
                {imageData && (
                  <p className="text-sm text-gray-500 mt-2">Silakan download untuk melihat file</p>
                )}
              </div>
            )}

            {!isImage(buktiName) && !isPDF(buktiName) && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-lg mb-4">
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-600">Tipe file ini tidak dapat ditampilkan dalam modal</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 flex gap-3">
            {imageData && (
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuktiPendukungModal;
