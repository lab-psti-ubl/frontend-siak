import React, { useState, useEffect } from 'react';
import { CheckCircle, Upload, FileText, X } from 'lucide-react';
import Button from '../../../ui/Button';
import CustomDatePicker from '../../../guru/pages/izin-guru/components/CustomDatePicker';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { showErrorNotification, showSuccessNotification } from '../../../../utils/notificationUtils';
import {
  validateImageFile,
  fileToBase64,
  saveFileToLocalStorage,
  getFileFromLocalStorage,
  generateStorageKey,
  removeFileFromLocalStorage,
  type FileUploadResult,
} from '../../../../utils/fileUploadUtils';

interface SuratIzinFormProps {
  isEditMode: boolean;
  formData: {
    jenis: 'izin' | 'sakit' | 'izin_dispen';
    alasan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    jamMulai: string;
    jamSelesai: string;
    bukti: string;
  };
  onFormChange: (formData: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  disabledDates: string[];
  activeIzinRanges: Array<{ start: string; end: string }>;
  isSubmitting?: boolean;
}

const SuratIzinForm: React.FC<SuratIzinFormProps> = ({
  isEditMode,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  disabledDates,
  activeIzinRanges,
  isSubmitting = false,
}) => {
  const { activePengaturanAbsen } = usePengaturanAbsen();
  const [timeError, setTimeError] = useState<string>('');
  const [jamPulangError, setJamPulangError] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEditMode && formData.bukti) {
      try {
        // Coba parse sebagai JSON (format baru dari database)
        const parsed = JSON.parse(formData.bukti);
        if (parsed.base64 && parsed.fileName) {
          setUploadedFile({
            fileName: parsed.fileName,
            base64: parsed.base64,
            mimeType: parsed.mimeType || 'image/jpeg'
          });
          return;
        }
      } catch {
        // Jika bukan JSON, coba cari di localStorage (backward compatibility)
        const storageKey = generateStorageKey('muridIzin', formData.bukti);
        const savedFile = getFileFromLocalStorage(storageKey);
        if (savedFile) {
          setUploadedFile(savedFile);
        }
      }
    }
  }, [isEditMode, formData.bukti]);

  const handleJamSelesaiChange = (value: string) => {
    onFormChange({ ...formData, jamSelesai: value });

    if (formData.jamMulai && value) {
      if (value <= formData.jamMulai) {
        setTimeError('Jam selesai harus lebih besar dari jam mulai');
      } else {
        setTimeError('');
      }
    }

    if (activePengaturanAbsen && value) {
      if (value > activePengaturanAbsen.jamPulang) {
        setJamPulangError('Jam selesai tidak boleh melebihi jam pulang');
      } else {
        setJamPulangError('');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showErrorNotification('File Tidak Valid', validation.error || 'File tidak sesuai kriteria');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const fileData = await fileToBase64(file);
      // Simpan base64 langsung ke formData.bukti (akan disimpan ke database)
      // Format: JSON string dengan fileName, base64, dan mimeType
      const buktiData = JSON.stringify({
        fileName: fileData.fileName,
        base64: fileData.base64,
        mimeType: fileData.mimeType,
        uploadedAt: new Date().toISOString()
      });
      
      setUploadedFile(fileData);
      onFormChange({ ...formData, bukti: buktiData });
      showSuccessNotification(
        'File Berhasil Diupload',
        `File "${fileData.fileName}" siap untuk diupload`
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      showErrorNotification('Error Upload', 'Gagal mengupload file. Coba lagi.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveFile = () => {
    if (formData.bukti) {
      // Hapus dari localStorage jika masih menggunakan format lama (backward compatibility)
      try {
        JSON.parse(formData.bukti);
        // Jika berhasil parse, berarti format baru (dari database), tidak perlu hapus localStorage
      } catch {
        // Format lama, hapus dari localStorage
        const storageKey = generateStorageKey('muridIzin', formData.bukti);
        removeFileFromLocalStorage(storageKey);
      }
      setUploadedFile(null);
      onFormChange({ ...formData, bukti: '' });
      showSuccessNotification('File Dihapus', 'File bukti pendukung telah dihapus');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Jenis Pengajuan <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.jenis}
          onChange={(e) => {
            const newJenis = e.target.value as 'izin' | 'sakit' | 'izin_dispen';
            onFormChange({
              ...formData,
              jenis: newJenis,
              tanggalMulai: '',
              tanggalSelesai: '',
              jamMulai: '',
              jamSelesai: ''
            });
          }}
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
          required
        >
          <option value="izin">Surat Izin</option>
          <option value="sakit">Surat Sakit</option>
          <option value="izin_dispen">Izin Dispen</option>
        </select>
        <p className="text-xs text-gray-500 mt-1.5">Pilih jenis surat sesuai keperluan Anda</p>
      </div>

      {formData.jenis === 'izin_dispen' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Tanggal Dispen <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                disabled
                readOnly
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed opacity-70"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Izin dispen hanya untuk hari ini (tidak dapat diubah)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.jamMulai}
                onChange={(e) => onFormChange({ ...formData, jamMulai: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.jamSelesai}
                onChange={(e) => handleJamSelesaiChange(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-blue-500 transition-all ${
                  timeError || jamPulangError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              {timeError && (
                <p className="text-sm text-red-600 mt-1">{timeError}</p>
              )}
              {jamPulangError && (
                <p className="text-sm text-red-600 mt-1">{jamPulangError}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <CustomDatePicker
              value={formData.tanggalMulai}
              onChange={(date) => onFormChange({ ...formData, tanggalMulai: date })}
              disabledDates={disabledDates}
              placeholder="Pilih tanggal mulai"
              rangeStart={formData.tanggalMulai}
              rangeEnd={formData.tanggalSelesai}
              activeIzinRanges={activeIzinRanges}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <CustomDatePicker
              value={formData.tanggalSelesai}
              onChange={(date) => onFormChange({ ...formData, tanggalSelesai: date })}
              disabledDates={disabledDates}
              minDate={formData.tanggalMulai}
              placeholder="Pilih tanggal selesai"
              rangeStart={formData.tanggalMulai}
              rangeEnd={formData.tanggalSelesai}
              activeIzinRanges={activeIzinRanges}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Alasan <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.alasan}
          onChange={(e) => onFormChange({ ...formData, alasan: e.target.value })}
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
          rows={4}
          placeholder="Jelaskan alasan izin/sakit Anda dengan detail..."
          required
        />
        <p className="text-xs text-gray-500 mt-1.5">Berikan penjelasan yang jelas dan lengkap</p>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Bukti Pendukung {formData.jenis !== 'izin_dispen' && <span className="text-red-500">*</span>} <span className={formData.jenis === 'izin_dispen' ? "text-gray-400 font-normal" : ""}>(Opsional untuk izin dispen)</span>
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="bukti-upload"
            accept="image/jpeg,image/png"
            disabled={isUploading}
          />
          <label
            htmlFor="bukti-upload"
            className={`flex items-center px-4 py-2.5 text-sm sm:text-base border-2 border-dashed rounded-lg cursor-pointer transition-all w-full sm:w-auto justify-center sm:justify-start ${
              isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <Upload size={18} className={`mr-2 ${isUploading ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`font-medium ${isUploading ? 'text-gray-400' : 'text-gray-700'}`}>
              {isUploading ? 'Mengupload...' : 'Pilih File'}
            </span>
          </label>
          {uploadedFile && (
            <div className="flex items-center px-3 py-2 bg-green-50 border border-green-200 rounded-lg w-full sm:w-auto gap-2">
              <FileText size={16} className="text-green-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-green-900 font-medium truncate flex-1">{uploadedFile.fileName}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-green-600 hover:text-green-700 flex-shrink-0"
                title="Hapus file"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1.5 flex items-start">
          <span className="mr-1">📎</span>
          <span>{formData.jenis !== 'izin_dispen' ? 'Wajib diupload - ' : ''}Format: JPG atau PNG • Ukuran maksimal: 5MB</span>
        </p>
      </div>

      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
        <h4 className="font-semibold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base flex items-center">
          <CheckCircle size={16} className="mr-2" />
          Informasi Penting
        </h4>
        <ul className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2">
          {formData.jenis === 'izin_dispen' ? (
            <>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>Izin dispen berlaku hanya untuk hari yang dipilih</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>Jam dispen akan langsung diterapkan pada jadwal yang sesuai</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>Absensi masuk dan pulang tetap normal sesuai jadwal</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>Pastikan alasan yang diberikan jelas dan valid</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>Bukti pendukung wajib diupload (JPG, PNG, atau PDF)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>Surat akan diverifikasi oleh wali kelas</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>Proses verifikasi membutuhkan waktu 1-2 hari kerja</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>Pastikan alasan yang diberikan jelas dan valid</span>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="pb-20 sm:pb-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onCancel}
          className="text-sm sm:text-base"
        >
          Batal
        </Button>
        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting || !formData.alasan || (formData.jenis === 'izin_dispen' ? !formData.jamMulai || !formData.jamSelesai || timeError || jamPulangError : !formData.tanggalMulai || !formData.tanggalSelesai || !formData.bukti)}
          className="text-sm sm:text-base flex items-center justify-center"
        >
          <CheckCircle size={16} className="mr-2" />
          {isSubmitting ? 'Memproses...' : (isEditMode ? 'Simpan Perubahan' : `Ajukan ${formData.jenis === 'izin_dispen' ? 'Dispen' : 'Surat'}`)}
        </Button>
      </div>
    </form>
  );
};

export default SuratIzinForm;
