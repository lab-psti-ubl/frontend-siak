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

const AbsenGuru: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Get active tahun ajaran for semester
  const { activeTahunAjaran } = useTahunAjaran();
  const activeTahunAjaranId = activeTahunAjaran?.id || '';
  const semester = activeTahunAjaran?.semester || 1;
  
  // Get absensi guru data by guruId (fetch all, filter on frontend)
  const { absensiGuru, refreshAbsensiGuru } = useAbsensiGuru(user?.id);
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

  const activePengaturan = activePengaturanAbsen;
  const today = new Date().toISOString().split('T')[0];

  const { handleQRScan, downloadMyQR } = useAbsenGuruHandlers({
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
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Absen Guru</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Lakukan absensi masuk dan keluar sekolah dengan QR Code</p>
        </div>
        <div className="flex-shrink-0">
          <Badge variant="info" className="inline-block">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Badge>
        </div>
      </div>

      <WorkHoursInfo activePengaturan={activePengaturan} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-6">
        <TodayAttendanceCard
          todayAttendance={todayAttendance}
          onScanQR={() => setIsQRScannerOpen(true)}
          onShowMyQR={showMyQR}
          onDownloadQR={downloadMyQR}
          getStatusBadge={getStatusBadge}
          isOnLeaveOrSick={isOnLeaveOrSick}
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
    </div>
  );
};

export default AbsenGuru;
