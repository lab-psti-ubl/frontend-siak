import React from 'react';
import { Upload, CheckCircle, Eye, ImageIcon, Trash2 } from 'lucide-react';

interface UploadAreaKTAProps {
  backgroundDepan: string;
  backgroundBelakang: string;
  label: string;
  onUploadDepan: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadBelakang: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDepan: () => void;
  onDeleteBelakang: () => void;
  onPreviewDepan: () => void;
  onPreviewBelakang: () => void;
}

const UploadAreaKTA: React.FC<UploadAreaKTAProps> = ({
  backgroundDepan,
  backgroundBelakang,
  label,
  onUploadDepan,
  onUploadBelakang,
  onDeleteDepan,
  onDeleteBelakang,
  onPreviewDepan,
  onPreviewBelakang,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-gray-900">{label}</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <div className="flex flex-col items-center justify-center">
              {backgroundDepan ? (
                <div className="w-full space-y-3">
                  <div className="flex justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Background Potrait Terupload</p>
                  <button
                    type="button"
                    onClick={onPreviewDepan}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={16} />
                    Lihat Preview
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Upload Background Potrait</p>
                  <p className="text-xs text-gray-500 mb-4">Portrait: 5.4cm × 8.5cm</p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onUploadDepan}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                      <Upload size={16} />
                      Pilih File
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Ukuran Standar Potrait</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex justify-between">
                <span>Tinggi:</span>
                <span className="font-mono">8.5 cm</span>
              </div>
              <div className="flex justify-between">
                <span>Lebar:</span>
                <span className="font-mono">5.4 cm</span>
              </div>
              <div className="flex justify-between">
                <span>Orientasi:</span>
                <span className="font-mono">Portrait</span>
              </div>
            </div>
          </div>

          {backgroundDepan && (
            <button
              type="button"
              onClick={onDeleteDepan}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <Trash2 size={16} />
              Hapus Background Potrait
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <div className="flex flex-col items-center justify-center">
              {backgroundBelakang ? (
                <div className="w-full space-y-3">
                  <div className="flex justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Background Landscape Terupload</p>
                  <button
                    type="button"
                    onClick={onPreviewBelakang}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={16} />
                    Lihat Preview
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Upload Background Landscape</p>
                  <p className="text-xs text-gray-500 mb-4">Landscape: 8.5cm × 5.4cm</p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onUploadBelakang}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                      <Upload size={16} />
                      Pilih File
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Ukuran Standar Landscape</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex justify-between">
                <span>Tinggi:</span>
                <span className="font-mono">5.4 cm</span>
              </div>
              <div className="flex justify-between">
                <span>Lebar:</span>
                <span className="font-mono">8.5 cm</span>
              </div>
              <div className="flex justify-between">
                <span>Orientasi:</span>
                <span className="font-mono">Landscape</span>
              </div>
            </div>
          </div>

          {backgroundBelakang && (
            <button
              type="button"
              onClick={onDeleteBelakang}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <Trash2 size={16} />
              Hapus Background Landscape
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadAreaKTA;
