import React, { useState, useEffect } from 'react';
import Badge from '../ui/Badge';
import QRScanner, { ScanResult } from '../ui/QRScanner';
import { useAuth } from '../../context/AuthContext';
import { useAbsensiGuru } from '../../hooks/useAbsensiGuru';
import { usePengaturanAbsen } from '../../hooks/usePengaturanAbsen';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { useIzinGuru } from '../../hooks/useIzinGuru';
import { AbsensiGuru, IzinGuru } from '../../types';
import { generateTeacherAttendanceQRCode, generateQRCodeURL } from '../../utils/qrCodeGenerator';
import { getMyAttendance, getRecentAttendance } from './pages/absen-guru/absenGuruUtils';
import { useAbsenGuruHandlers } from './pages/absen-guru/useAbsenGuruHandlers';
import { getStatusBadge } from './pages/absen-guru/statusBadgeUtils';
import { getActiveIzin } from './pages/izin-guru/utils/izinGuruUtils';
import WorkHoursInfo from './pages/absen-guru/WorkHoursInfo';
import TodayAttendanceCard from './pages/absen-guru/TodayAttendanceCard';
import AttendanceInfoCard from './pages/absen-guru/AttendanceInfoCard';
import AttendanceHistoryTable from './pages/absen-guru/AttendanceHistoryTable';
import MyQRModal from './pages/absen-guru/MyQRModal';
import { apiService } from '../../services/apiService';
import { useLanguage } from '../../context/LanguageContext';
import { getTodayIndonesia } from '../../utils/absensiUtils';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import FaceDetectionCamera from './pages/absen-guru/FaceDetectionCamera';
import { useFaceAbsenGuruHandlers } from './pages/absen-guru/useFaceAbsenGuruHandlers';
import { XCircle, CheckCircle } from 'lucide-react';

const AbsenGuru: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const todayStr = getTodayIndonesia();
    const [, month] = todayStr.split('-').map(Number);
    return month;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const todayStr = getTodayIndonesia();
    const [year] = todayStr.split('-').map(Number);
    return year;
  });
  
  // Get active tahun ajaran for semester
  const { activeTahunAjaran } = useTahunAjaran();
  const activeTahunAjaranId = activeTahunAjaran?.id || '';
  const semester = activeTahunAjaran?.semester || 1;
  
  // Get absensi guru data by guruId (fetch all, filter on frontend)
  const { absensiGuru, refreshAbsensiGuru, isSyncingWithWorker, syncMessage } = useAbsensiGuru(user?.id);
  const { pengaturanAbsen, activePengaturanAbsen } = usePengaturanAbsen();
  const { izinGuru } = useIzinGuru({ guruId: user?.id });

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isMyQRModalOpen, setIsMyQRModalOpen] = useState(false);
  const [myQRCodeURL, setMyQRCodeURL] = useState<string>('');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [datesInDb, setDatesInDb] = useState<string[]>([]);
  
  // State untuk scan result modal
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [guruFaceDescriptors, setGuruFaceDescriptors] = useState<string[]>([]);
  const [isLoadingFaceDescriptors, setIsLoadingFaceDescriptors] = useState(false);
  const [faceScanResult, setFaceScanResult] = useState<ScanResult | null>(null);

  const activePengaturan = activePengaturanAbsen;
  const today = getTodayIndonesia();

  const { handleQRScan, downloadMyQR } = useAbsenGuruHandlers({
    user,
    refreshAbsensiGuru,
    activePengaturan: activePengaturan || undefined,
    today,
    activeTahunAjaranId,
    semester,
  });

  const { handleFaceAttendance } = useFaceAbsenGuruHandlers({
    user,
    refreshAbsensiGuru,
    activePengaturan: activePengaturan || undefined,
    today,
    activeTahunAjaranId,
    semester,
  });

  useEffect(() => {
    const generateMyQR = async () => {
      if (user && user.role === 'guru') {
        const guru = user as any; // Cast to Guru type
        const qrData = generateTeacherAttendanceQRCode(user.id, user.name, guru.kelasWali, guru.nip);
        const url = await generateQRCodeURL(qrData, 400);
        setMyQRCodeURL(url);
      }
    };
    generateMyQR();
  }, [user]);

  useEffect(() => {
    const fetchFaceDescriptors = async () => {
      if (!user?.id || user.role !== 'guru') return;
      try {
        setIsLoadingFaceDescriptors(true);
        const res = await apiService.getFaceRecognitionByGuruId(user.id);
        if (res.success && res.faceDescriptors) {
          setGuruFaceDescriptors(res.faceDescriptors);
        } else {
          setGuruFaceDescriptors([]);
        }
      } catch (error) {
        console.error('Error fetching guru face descriptors:', error);
        setGuruFaceDescriptors([]);
      } finally {
        setIsLoadingFaceDescriptors(false);
      }
    };
    fetchFaceDescriptors();
  }, [user?.id, user?.role]);

  useEffect(() => {
    const handleAutoAlfaGuru = () => {
      refreshAbsensiGuru();
    };

    window.addEventListener('absensi-guru-auto-alfa-processed', handleAutoAlfaGuru);

    return () => {
      window.removeEventListener('absensi-guru-auto-alfa-processed', handleAutoAlfaGuru);
    };
  }, [refreshAbsensiGuru]);

  // Fetch dates that exist in database for the selected month/year
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const response = await apiService.getAbsensiGuruDates(selectedMonth, selectedYear);
        if (response.success && response.dates) {
          setDatesInDb(response.dates);
        }
      } catch (error) {
        console.error('Error fetching dates:', error);
        setDatesInDb([]);
      }
    };

    fetchDates();
  }, [selectedMonth, selectedYear]);

  const onQRScan = async (qrData: string) => {
    const result = await handleQRScan(qrData);
    if (result) {
      setScanResult(result);
      setShowResultModal(true);
      if (!result.isError && result.status !== 'sudah_terpenuhi') {
        setTimeout(() => {
          setIsQRScannerOpen(false);
        }, 1500);
      }
    }
  };

  const showMyQR = () => {
    setIsMyQRModalOpen(true);
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setIsMonthPickerOpen(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };

  const handleSetThisMonth = () => {
    const currentDate = new Date();
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
    setIsMonthPickerOpen(false);
  };

  const handleClear = () => {
    const currentDate = new Date();
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
    setIsMonthPickerOpen(false);
  };

  const todayAttendance = getMyAttendance(absensiGuru, user?.id, today);
  const recentAttendance = getRecentAttendance(absensiGuru, user?.id, selectedMonth, selectedYear, datesInDb);
  const activeIzin = getActiveIzin(izinGuru.filter(i => i.guruId === user?.id));
  const isOnLeaveOrSick = activeIzin && (activeIzin.jenis === 'izin' || activeIzin.jenis === 'sakit');

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{t('absenGuruPage.title')}</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">{t('absenGuruPage.subtitle')}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <Badge variant="info" className="inline-block">
            {new Date().toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Badge>
          
        </div>
      </div>

      {isSyncingWithWorker && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label="Memuat data absensi" />
          <p className="text-sm font-medium">
            {syncMessage || 'Sinkronisasi absensi guru sedang berjalan...'}
          </p>
        </div>
      )}

      <WorkHoursInfo activePengaturan={activePengaturan} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-6">
        <TodayAttendanceCard
          todayAttendance={todayAttendance}
          onScanQR={() => setIsQRScannerOpen(true)}
          onShowMyQR={showMyQR}
          onDownloadQR={downloadMyQR}
          getStatusBadge={getStatusBadge}
          isOnLeaveOrSick={isOnLeaveOrSick}
          enableManualAbsen={activePengaturan?.enableManualAbsen !== false}
        />

        <AttendanceInfoCard
          todayAttendance={todayAttendance}
          activePengaturan={activePengaturan}
        />
      </div>

      <AttendanceHistoryTable
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        isMonthPickerOpen={isMonthPickerOpen}
        onToggleMonthPicker={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
        onMonthSelect={handleMonthSelect}
        onYearSelect={handleYearSelect}
        onSetThisMonth={handleSetThisMonth}
        onClear={handleClear}
        attendanceRecords={recentAttendance}
        getStatusBadge={getStatusBadge}
      />

      <MyQRModal
        isOpen={isMyQRModalOpen}
        onClose={() => setIsMyQRModalOpen(false)}
        user={user}
        qrCodeURL={myQRCodeURL}
      />

      <QRScanner
        isOpen={isQRScannerOpen}
        onScan={onQRScan}
        onClose={() => {
          setIsQRScannerOpen(false);
          setScanResult(null);
          setShowResultModal(false);
        }}
        scanResult={scanResult}
        showResultModal={showResultModal}
        onCloseResult={() => {
          setShowResultModal(false);
          setScanResult(null);
        }}
      />

      <Modal
        isOpen={isFaceModalOpen}
        onClose={() => {
          setIsFaceModalOpen(false);
          setFaceScanResult(null);
        }}
        title="Absen Guru dengan Wajah"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Posisikan wajah Anda di tengah kamera. Sistem akan otomatis mencocokkan dengan data
            wajah yang sudah terdaftar dan melakukan absen masuk/pulang sesuai status hari ini.
          </p>

          {faceScanResult && (
            <div
              className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
                faceScanResult.isError
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {faceScanResult.isError ? (
                <XCircle className="w-4 h-4 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 mt-0.5" />
              )}
              <span>{faceScanResult.statusMessage}</span>
            </div>
          )}

          <FaceDetectionCamera
            registeredFaces={guruFaceDescriptors}
            onFaceMatch={async () => {
              const result = await handleFaceAttendance();
              if (result) {
                setFaceScanResult(result);
                if (!result.isError && result.status !== 'sudah_terpenuhi') {
                  setTimeout(() => {
                    setIsFaceModalOpen(false);
                    setFaceScanResult(null);
                  }, 1500);
                }
              }
            }}
            onError={(msg) => {
              setFaceScanResult({
                isError: true,
                statusMessage: msg,
                errorType: 'absen_failed',
              } as ScanResult);
            }}
            isActive={isFaceModalOpen}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AbsenGuru;
