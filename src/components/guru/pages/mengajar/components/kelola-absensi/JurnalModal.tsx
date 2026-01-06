import React, { useState, useRef } from 'react';
import { FileText, Upload, X, Eye, FileIcon, Download } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import { SesiAbsensi } from '../../../../../../types';

interface JurnalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSesi: SesiAbsensi | null;
  jurnalJudul: string;
  setJurnalJudul: (value: string) => void;
  jurnalDeskripsi: string;
  setJurnalDeskripsi: (value: string) => void;
  jurnalFile: File | null;
  setJurnalFile: (file: File | null) => void;
  onSave: () => void;
  getJadwalInfo: (jadwalId: string) => { kelas: string; mapel: string };
  existingFile?: { name: string; type: string; data: string; size: number };
  onRemoveExistingFile?: () => void;
}

const JurnalModal: React.FC<JurnalModalProps> = ({
  isOpen,
  onClose,
  selectedSesi,
  jurnalJudul,
  setJurnalJudul,
  jurnalDeskripsi,
  setJurnalDeskripsi,
  jurnalFile,
  setJurnalFile,
  onSave,
  getJadwalInfo,
  existingFile,
  onRemoveExistingFile,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showExistingFilePreview, setShowExistingFilePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan PDF, Word, atau PowerPoint.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Ukuran file maksimal 10MB.');
      return;
    }

    setJurnalFile(file);
  };

  const handleRemoveFile = () => {
    setJurnalFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('presentation')) return '📊';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Input Jurnal Mengajar"
      size="lg"
    >
      {selectedSesi && (
        <div className="space-y-4 sm:space-y-5 pb-12 mb-4 sm:pb-12 sm:mb-4">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg sm:rounded-xl text-white shadow-sm">
            <h4 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">
              {getJadwalInfo(selectedSesi.jadwalId).mapel}
            </h4>
            <p className="text-sm sm:text-base text-white/90 mb-1">
              {getJadwalInfo(selectedSesi.jadwalId).kelas}
            </p>
            <p className="text-xs sm:text-sm text-white/80">
              {new Date(selectedSesi.tanggal).toLocaleDateString('id-ID')} • {selectedSesi.jamBuka} - {selectedSesi.jamTutup || '-'}
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2.5">
              Judul Materi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={jurnalJudul}
              onChange={(e) => setJurnalJudul(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              placeholder="Contoh: Pengenalan Aljabar Linear"
              maxLength={100}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-slate-500">Tuliskan judul materi yang disampaikan</p>
              <p className="text-xs text-slate-400">{jurnalJudul.length}/100</p>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2.5">
              Deskripsi Materi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={jurnalDeskripsi}
              onChange={(e) => setJurnalDeskripsi(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base resize-none"
              rows={5}
              placeholder="Jelaskan materi yang telah disampaikan kepada murid..."
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-slate-500">Deskripsikan detail pembelajaran</p>
              <p className="text-xs text-slate-400">{jurnalDeskripsi.length}/500</p>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2.5">
              File Pendukung <span className="text-slate-500 font-normal">(Opsional)</span>
            </label>
            <div className="space-y-3">
              {existingFile && !jurnalFile && (
                <div className="border-2 border-blue-300 rounded-lg p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <span className="text-lg sm:text-2xl">{getFileIcon(existingFile.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-blue-900 truncate">
                          {existingFile.name}
                        </p>
                        <p className="text-xs text-blue-700">
                          {formatFileSize(existingFile.size)} • File tersimpan
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowExistingFilePreview(true)}
                        className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors flex items-center justify-center"
                        title="Lihat file"
                      >
                        <Eye size={16}  className="mr-2"/> Lihat
                      </button>
                      <a
                        href={existingFile.data}
                        download={existingFile.name}
                        className="p-1.5 sm:p-2 text-green-600 hover:bg-green-200 rounded-lg transition-colors flex items-center justify-center"
                        title="Download file"
                      >
                        <Download size={16}  className="mr-2" />Download
                      </a>
                      <button
                        type="button"
                        onClick={onRemoveExistingFile}
                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-200 rounded-lg transition-colors flex items-center justify-center"
                        title="Hapus file"
                      >
                        <X size={16}  className="mr-2"/>Batal
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!jurnalFile && !existingFile && (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full px-4 py-4 sm:py-6 border-2 border-dashed border-slate-300 rounded-lg sm:rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                  >
                    <div className="text-center">
                      <Upload size={20} className="mx-auto mb-2 text-slate-400" />
                      <span className="text-sm sm:text-base text-slate-600 font-medium">
                        Klik atau seret file di sini
                      </span>
                      <p className="text-xs text-slate-500 mt-1">PDF, Word, PowerPoint • Maks 10MB</p>
                    </div>
                  </label>
                </div>
              )}

              {jurnalFile && (
                <div className="border border-slate-300 rounded-lg p-3 sm:p-4 bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <span className="text-lg sm:text-2xl">{getFileIcon(jurnalFile.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {jurnalFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(jurnalFile.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                        title="Preview"
                      >
                        <Eye size={16} className="mr-2"/> Lihat
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
                        title="Hapus file"
                      >
                        <X size={16}  className="mr-2"/> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {existingFile && !jurnalFile && (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    id="file-upload-replace"
                  />
                  <label
                    htmlFor="file-upload-replace"
                    className="flex items-center justify-center w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg sm:rounded-xl cursor-pointer hover:bg-blue-50 transition-colors text-xs sm:text-sm text-blue-700 font-semibold uppercase tracking-wide"
                  >
                    <Upload size={16} className="mr-2" />
                    Ganti File
                  </label>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Format: PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx) • Maksimal 10MB
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg sm:rounded-xl border border-amber-200">
            <p className="text-xs sm:text-sm text-amber-900">
              <span className="font-semibold">📌 Catatan:</span> Jurnal akan dapat dilihat oleh admin untuk monitoring kegiatan pembelajaran Anda.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
              className="text-xs sm:text-sm py-2.5 sm:py-3 "
            >
              Batal
            </Button>
            <Button
              onClick={onSave}
              variant="primary"
              fullWidth
              disabled={!jurnalJudul.trim() || !jurnalDeskripsi.trim()}
              className="text-xs sm:text-sm py-2.5 sm:py-3 flex items-center justify-center"
            >
              <FileText size={16} className="mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Simpan Jurnal</span>
              <span className="sm:hidden">Simpan</span>
            </Button>
          </div>
        </div>
      )}

      {showPreview && jurnalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3 ">
                <FileIcon className="text-blue-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">Preview File</h3>
                  <p className="text-sm text-gray-600">{jurnalFile.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {jurnalFile.type === 'application/pdf' ? (
                <iframe
                  src={URL.createObjectURL(jurnalFile)}
                  className="w-full h-full min-h-[600px] border rounded"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                  <span className="text-6xl">{getFileIcon(jurnalFile.type)}</span>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{jurnalFile.name}</p>
                    <p className="text-sm text-gray-600 mt-1">Ukuran: {formatFileSize(jurnalFile.size)}</p>
                    <p className="text-sm text-gray-500 mt-3">
                      Preview tidak tersedia untuk file Word/PowerPoint.
                      File akan disimpan dan dapat diunduh nanti.
                    </p>
                  </div>
                  <a
                    href={URL.createObjectURL(jurnalFile)}
                    download={jurnalFile.name}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} className="mr-2" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showExistingFilePreview && existingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <FileIcon className="text-blue-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">Preview File</h3>
                  <p className="text-sm text-gray-600">{existingFile.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowExistingFilePreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {existingFile.type === 'application/pdf' ? (
                <iframe
                  src={existingFile.data}
                  className="w-full h-full min-h-[600px] border rounded"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                  <span className="text-6xl">{getFileIcon(existingFile.type)}</span>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{existingFile.name}</p>
                    <p className="text-sm text-gray-600 mt-1">Ukuran: {formatFileSize(existingFile.size)}</p>
                    <p className="text-sm text-gray-500 mt-3">
                      Preview tidak tersedia untuk file Word/PowerPoint.
                      File akan disimpan dan dapat diunduh nanti.
                    </p>
                  </div>
                  <a
                    href={existingFile.data}
                    download={existingFile.name}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} className="mr-2" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default JurnalModal;
