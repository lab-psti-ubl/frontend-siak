import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { showSuccessNotification, showErrorNotification } from '../../../../../utils/notificationUtils';
import { getDisabledDatesByGuru, getActiveIzinRanges } from '../utils/izinGuruUtils';
import { GuruPenggantiJadwal, Guru, IzinGuru } from '../../../../../types';
import { JadwalDetail } from '../utils/jadwalPenggantiUtils';
import JadwalPenggantiSelector from '../components/JadwalPenggantiSelector';
import CustomDatePicker from '../components/CustomDatePicker';
import {
  validateImageFile,
  fileToBase64,
  type FileUploadResult,
} from '../../../../../utils/fileUploadUtils';
import { getJadwalGuruInDateRangeNotFinished, getJadwalGuruInDateRangeWithTimeNotFinished, getJadwalTahfizUstadzInDateRangeNotFinished, getJadwalTahfizUstadzInDateRangeWithTimeNotFinished } from '../utils/jadwalPenggantiUtils';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';
import { usePengaturanAbsen } from '../../../../../hooks/usePengaturanAbsen';
import { useJadwalPelajaran } from '../../../../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useIzinGuru } from '../../../../../hooks/useIzinGuru';
import { useJadwalTahfiz } from '../../../../../hooks/useJadwalTahfiz';
import { useKelasTahfiz } from '../../../../../hooks/useKelasTahfiz';
import { useLanguage } from '../../../../../context/LanguageContext';

interface FormIzinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void | Promise<void>;
  guruId: string;
  editingIzin?: IzinGuru | null;
  isSubmitting?: boolean;
}

export interface FormData {
  jenis: 'izin' | 'sakit' | 'cuti' | 'izin_dispen';
  alasan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  jamMulai?: string;
  jamSelesai?: string;
  bukti: string;
  guruPenggantiList?: GuruPenggantiJadwal[];
}

const FormIzinModal: React.FC<FormIzinModalProps> = ({ isOpen, onClose, onSubmit, guruId, editingIzin, isSubmitting = false }) => {
  const { t } = useLanguage();
  const { activeTahunAjaran } = useTahunAjaran();
  const { pengaturanAbsen } = usePengaturanAbsen();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { mataPelajaran } = useMataPelajaran();
  const { jadwalTahfiz } = useJadwalTahfiz();
  const { kelasTahfiz } = useKelasTahfiz();
  
  const [formData, setFormData] = useState<FormData>({
    jenis: 'izin',
    alasan: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    jamMulai: '',
    jamSelesai: '',
    bukti: '',
    guruPenggantiList: [],
  });

  const [jadwalDetails, setJadwalDetails] = useState<JadwalDetail[]>([]);
  const [disabledDates, setDisabledDates] = useState<string[]>([]);
  const [activeIzinRanges, setActiveIzinRanges] = useState<Array<{ start: string; end: string }>>([]);
  const [timeError, setTimeError] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingIzin) {
      setFormData({
        jenis: editingIzin.jenis,
        alasan: editingIzin.alasan,
        tanggalMulai: editingIzin.tanggalMulai,
        tanggalSelesai: editingIzin.tanggalSelesai,
        jamMulai: editingIzin.jamMulai || '',
        jamSelesai: editingIzin.jamSelesai || '',
        bukti: editingIzin.bukti || '',
        guruPenggantiList: editingIzin.guruPenggantiList || [],
      });

      if (editingIzin.bukti) {
        // Try to parse as JSON (new format from database)
        try {
          const buktiData = JSON.parse(editingIzin.bukti);
          if (buktiData.base64 && buktiData.fileName) {
            setUploadedFile({
              base64: buktiData.base64,
              fileName: buktiData.fileName,
              mimeType: buktiData.mimeType || 'image/jpeg'
            });
          }
        } catch {
          // Old format: bukti is just a uniqueId, skip for now
          // In the future, we might want to fetch from localStorage as fallback
        }
      }
    }
  }, [editingIzin]);

  const { izinGuru } = useIzinGuru({ guruId });
  
  useEffect(() => {
    const disabled = getDisabledDatesByGuru(guruId, izinGuru);
    const ranges = getActiveIzinRanges(guruId, izinGuru);
    setDisabledDates(disabled);
    setActiveIzinRanges(ranges);
  }, [guruId, izinGuru]);

  useEffect(() => {
    if (formData.bukti) {
      // Try to parse as JSON (new format from database)
      try {
        const buktiData = JSON.parse(formData.bukti);
        if (buktiData.base64 && buktiData.fileName) {
          setUploadedFile({
            base64: buktiData.base64,
            fileName: buktiData.fileName,
            mimeType: buktiData.mimeType || 'image/jpeg'
          });
        }
      } catch {
        // Old format: bukti is just a uniqueId, skip
      }
    }
  }, [formData.bukti]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    if (formData.jenis === 'izin_dispen' && !formData.tanggalMulai) {
      setFormData(prev => ({
        ...prev,
        tanggalMulai: today,
        tanggalSelesai: today
      }));
    }
  }, [formData.jenis]);

  useEffect(() => {
    if (formData.tanggalMulai && activeTahunAjaran) {
      let jadwalList: JadwalDetail[] = [];

      // Check if guru is ustadz (has kelas tahfiz assigned)
      const isUstadz = kelasTahfiz.some(kelas => kelas.ustadzId === guruId);

      if (formData.jenis === 'izin_dispen') {
        if (formData.jamMulai && formData.jamSelesai) {
          // Get regular jadwal pelajaran
          const regularJadwal = getJadwalGuruInDateRangeWithTimeNotFinished(
            guruId, 
            formData.tanggalMulai, 
            formData.jamMulai, 
            formData.jamSelesai, 
            activeTahunAjaran.tahun, 
            activeTahunAjaran.semester, 
            jadwalPelajaran
          );
          jadwalList.push(...regularJadwal);

          // Get tahfiz jadwal if guru is ustadz
          if (isUstadz) {
            const tahfizJadwal = getJadwalTahfizUstadzInDateRangeWithTimeNotFinished(
              guruId,
              formData.tanggalMulai,
              formData.jamMulai,
              formData.jamSelesai,
              jadwalTahfiz,
              kelasTahfiz
            );
            jadwalList.push(...tahfizJadwal);
          }
        }
      } else {
        let endDate = formData.tanggalSelesai;
        if (!endDate) {
          endDate = formData.tanggalMulai;
        }
        // Get regular jadwal pelajaran
        const regularJadwal = getJadwalGuruInDateRangeNotFinished(
          guruId, 
          formData.tanggalMulai, 
          endDate, 
          activeTahunAjaran.tahun, 
          activeTahunAjaran.semester, 
          jadwalPelajaran
        );
        jadwalList.push(...regularJadwal);

        // Get tahfiz jadwal if guru is ustadz
        if (isUstadz) {
          const tahfizJadwal = getJadwalTahfizUstadzInDateRangeNotFinished(
            guruId,
            formData.tanggalMulai,
            endDate,
            jadwalTahfiz,
            kelasTahfiz
          );
          jadwalList.push(...tahfizJadwal);
        }
      }

      setJadwalDetails(jadwalList);

      if (jadwalList.length === 0) {
        setFormData(prev => ({ ...prev, guruPenggantiList: [] }));
      } else {
        // Clean up guruPenggantiList to only include jadwal that still exist
        const currentJadwalKeys = new Set(jadwalList.map(j => j.jadwalKey));
        setFormData(prev => {
          const filteredList = (prev.guruPenggantiList || []).filter(
            item => currentJadwalKeys.has(item.jadwalId)
          );
          return { ...prev, guruPenggantiList: filteredList };
        });
      }
    }
  }, [formData.tanggalMulai, formData.tanggalSelesai, formData.jamMulai, formData.jamSelesai, formData.jenis, guruId, activeTahunAjaran, jadwalPelajaran, jadwalTahfiz, kelasTahfiz]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showErrorNotification(t('izinGuru.fileTidakValid'), validation.error || t('izinGuru.fileTidakSesuaiKriteria'));
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const fileData = await fileToBase64(file);
      
      // Store as JSON string with file metadata (like SuratIzin)
      const buktiData = JSON.stringify({
        fileName: fileData.fileName,
        base64: fileData.base64,
        mimeType: fileData.mimeType
      });
      
      setUploadedFile(fileData);
      setFormData({ ...formData, bukti: buktiData });
      showSuccessNotification(
        t('izinGuru.fileBerhasilDiupload'),
        t('izinGuru.fileBerhasilDiuploadDesc', { fileName: fileData.fileName })
      );
    } catch (error) {
      showErrorNotification(t('izinGuru.errorUpload'), t('izinGuru.gagalMenguploadFile'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFormData({ ...formData, bukti: '' });
    showSuccessNotification(t('izinGuru.fileDihapus'), t('izinGuru.fileBuktiPendukungDihapus'));
  };

  const isDateRangeValid = () => {
    if (formData.jenis === 'izin_dispen') {
      return true;
    }

    if (!formData.tanggalMulai || !formData.tanggalSelesai) {
      return false;
    }

    return formData.tanggalMulai <= formData.tanggalSelesai;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDateRangeValid()) {
      showErrorNotification(t('izinGuru.validasiTanggal'), t('izinGuru.tanggalMulaiHarusSebelum'));
      return;
    }

    if (jadwalDetails.length > 0 && (!formData.guruPenggantiList || formData.guruPenggantiList.length === 0)) {
      showErrorNotification(t('izinGuru.validasiGuruPengganti'), t('izinGuru.harusMemilihGuruPengganti'));
      return;
    }

    if (jadwalDetails.length > 0) {
      // Check that all jadwal have guru pengganti
      const jadwalKeys = new Set(jadwalDetails.map(j => j.jadwalKey));
      const selectedJadwalKeys = new Set((formData.guruPenggantiList || []).map(g => g.jadwalId));
      
      // Check if all jadwal have selections
      const missingJadwal = Array.from(jadwalKeys).filter(key => !selectedJadwalKeys.has(key));
      if (missingJadwal.length > 0) {
        showErrorNotification(t('izinGuru.validasiGuruPengganti'), t('izinGuru.harusMemilihGuruPenggantiUntukJadwal', { count: missingJadwal.length }));
        return;
      }
      
      // Check if all selections have valid jadwal
      const invalidSelections = (formData.guruPenggantiList || []).filter(
        g => !jadwalKeys.has(g.jadwalId)
      );
      if (invalidSelections.length > 0) {
        showErrorNotification(t('izinGuru.validasiGuruPengganti'), t('izinGuru.guruPenggantiTidakSesuai'));
        return;
      }
    }

    if (formData.jenis === 'izin_dispen') {
      if (formData.jamMulai && formData.jamSelesai) {
        if (formData.jamSelesai <= formData.jamMulai) {
          showErrorNotification(t('izinGuru.validasiJam'), t('izinGuru.jamSelesaiHarusSetelah'));
          return;
        }
      }

      const activePengaturan = pengaturanAbsen.find((p: any) => p.isActive);

      if (activePengaturan && formData.jamSelesai) {
        if (formData.jamSelesai > activePengaturan.jamPulang) {
          showErrorNotification(t('izinGuru.validasiJam'), t('izinGuru.jamSelesaiTidakBolehMelebihi'));
          return;
        }
      }
    }

    onSubmit(formData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      jenis: 'izin',
      alasan: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      jamMulai: '',
      jamSelesai: '',
      bukti: '',
      guruPenggantiList: [],
    });
    setJadwalDetails([]);
    setTimeError('');
    setUploadedFile(null);
    setIsUploading(false);
    onClose();
  };

  const handleJamSelesaiChange = (value: string) => {
    setFormData({ ...formData, jamSelesai: value });

    let error = '';

    if (formData.jamMulai && value) {
      if (value <= formData.jamMulai) {
        error = t('izinGuru.jamSelesaiHarusLebihBesar');
      } else {
        const activePengaturan = pengaturanAbsen.find((p: any) => p.isActive);

        if (activePengaturan && value > activePengaturan.jamPulang) {
          error = t('izinGuru.jamSelesaiTidakBolehMelebihiPulang');
        }
      }
    }

    setTimeError(error);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetForm}
      title={editingIzin ? t('izinGuru.editPengajuanIzin') : t('izinGuru.ajukanIzinSakitCutiDispen')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mb-12 pb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('izinGuru.jenisPengajuan')}
          </label>
          <select
            value={formData.jenis}
            onChange={(e) => {
              const newJenis = e.target.value as 'izin' | 'sakit' | 'cuti' | 'izin_dispen';
              setFormData({
                ...formData,
                jenis: newJenis,
                tanggalMulai: '',
                tanggalSelesai: '',
                jamMulai: '',
                jamSelesai: ''
              });
              setJadwalDetails([]);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="izin">{t('izinGuru.jenis.izin')}</option>
            <option value="sakit">{t('izinGuru.jenis.sakit')}</option>
            <option value="cuti">{t('izinGuru.jenis.cuti')}</option>
            <option value="izin_dispen">{t('izinGuru.izinDispen')}</option>
          </select>
        </div>

        {formData.jenis === 'izin_dispen' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('izinGuru.tanggalDispen')}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.tanggalMulai}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed opacity-70"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('izinGuru.izinDispenHanyaHariIni')}</p>
            </div>

            

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('izinGuru.jamMulai')}
                </label>
                <input
                  type="time"
                  value={formData.jamMulai || ''}
                  onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('izinGuru.jamSelesai')}
                </label>
                <input
                  type="time"
                  value={formData.jamSelesai || ''}
                  onChange={(e) => handleJamSelesaiChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                    timeError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {timeError && (
                  <p className="text-sm text-red-600 mt-1">{timeError}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('izinGuru.tanggalMulai')}
              </label>
              <CustomDatePicker
                value={formData.tanggalMulai}
                onChange={(date) => setFormData({ ...formData, tanggalMulai: date })}
                disabledDates={disabledDates}
                placeholder={t('izinGuru.pilihTanggalMulai')}
                rangeStart={formData.tanggalMulai}
                rangeEnd={formData.tanggalSelesai}
                activeIzinRanges={activeIzinRanges}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('izinGuru.tanggalSelesai')}
              </label>
              <CustomDatePicker
                value={formData.tanggalSelesai}
                onChange={(date) => setFormData({ ...formData, tanggalSelesai: date })}
                disabledDates={disabledDates}
                minDate={formData.tanggalMulai}
                placeholder={t('izinGuru.pilihTanggalSelesai')}
                rangeStart={formData.tanggalMulai}
                rangeEnd={formData.tanggalSelesai}
                activeIzinRanges={activeIzinRanges}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('izinGuru.alasan')}
          </label>
          <textarea
            value={formData.alasan}
            onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder={t('izinGuru.jelaskanAlasanPengajuan')}
            required
          />
        </div>

        {jadwalDetails.length > 0 && activeTahunAjaran && (
          <JadwalPenggantiSelector
            jadwalDetails={jadwalDetails}
            onSelectionChange={(selections) =>
              setFormData(prev => ({ ...prev, guruPenggantiList: selections }))
            }
            guruIdToExclude={guruId}
            tahunAjaran={activeTahunAjaran.tahun}
            semester={activeTahunAjaran.semester}
            jadwalPelajaran={jadwalPelajaran}
            mataPelajaran={mataPelajaran}
            jadwalTahfiz={jadwalTahfiz}
            kelasTahfiz={kelasTahfiz}
            initialSelections={editingIzin?.guruPenggantiList || formData.guruPenggantiList || []}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('izinGuru.buktiPendukungOpsional')}
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
              className={`flex items-center px-4 py-2 border rounded-lg cursor-pointer transition-all ${
                isUploading
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Upload size={16} className={`mr-2 ${isUploading ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={isUploading ? 'text-gray-400' : 'text-gray-700'}>
                {isUploading ? t('izinGuru.mengupload') : t('izinGuru.pilihFile')}
              </span>
            </label>
            {uploadedFile && (
              <div className="flex items-center px-3 py-2 bg-green-50 border border-green-200 rounded-lg gap-2 w-full sm:w-auto">
                <span className="text-sm text-green-900 font-medium truncate flex-1">{uploadedFile.fileName}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-green-600 hover:text-green-700 flex-shrink-0"
                  title={t('izinGuru.hapusFile')}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('izinGuru.formatYangDidukung')}
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">{t('izinGuru.informasiPenting')}</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t('izinGuru.pengajuanAkanDiverifikasi')}</li>
            <li>• {t('izinGuru.prosesVerifikasiMembutuhkanWaktu')}</li>
            <li>• {t('izinGuru.pastikanAlasanJelas')}</li>
            <li>• {t('izinGuru.lampirkanBuktiPendukung')}</li>
            <li>• {t('izinGuru.untukSakitDisarankan')}</li>
          </ul>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting || !isDateRangeValid() || !formData.alasan || (formData.jenis === 'izin_dispen' && timeError) || (jadwalDetails.length > 0 && (!formData.guruPenggantiList || formData.guruPenggantiList.length !== jadwalDetails.length))}
            className={((isSubmitting || !isDateRangeValid() || !formData.alasan || (formData.jenis === 'izin_dispen' && timeError) || (jadwalDetails.length > 0 && (!formData.guruPenggantiList || formData.guruPenggantiList.length !== jadwalDetails.length)))) ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isSubmitting ? t('izinGuru.memproses') : (editingIzin ? t('common.save') : t('izinGuru.ajukan', { jenis: formData.jenis === 'izin_dispen' ? t('izinGuru.izinDispen') : t(`izinGuru.jenis.${formData.jenis}`) }))}
          </Button>
          <Button type="button" variant="secondary" fullWidth onClick={resetForm} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FormIzinModal;
