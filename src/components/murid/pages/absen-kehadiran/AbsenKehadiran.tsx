import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, QrCode, TrendingUp } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import QRScanner, { ScanResult } from '../../../ui/QRScanner';
import { useAuth } from '../../../../context/AuthContext';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../hooks/useSantri';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useGurus } from '../../../../hooks/useGurus';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { Absensi, MataPelajaran, User, Kelas, TahunAjaran, SesiAbsensi, PengaturanAbsen } from '../../../../types';
import { sseAbsenService } from '../../../../services/sseAbsenService';
import { showErrorNotification } from '../../../../utils/notificationUtils';
import AbsenKehadiranTable from './AbsenKehadiranTable';
import MonthYearPickerKehadiran from './MonthYearPickerKehadiran';
import ManualAbsenModal from './ManualAbsenModal';
import {
  handleAdminQRScanIntegrated,
  getKehadiranAbsensiIntegrated,
  getAvailableMonthsYearsKehadiranIntegrated,
  getTodayKehadiranStatsIntegrated,
  getAbsenMasukStatus,
  getAbsenPulangStatus,
} from './absenKehadiranIntegratedUtils';
import { getLocalTimeISOString } from '../../../../utils/absensiUtils';

const AbsenKehadiran: React.FC = () => {
  const { user } = useAuth();
  const { absensi, refreshAbsensi, createAbsensi: createAbsensiAPI } = useAbsensi({ muridId: user?.id });
  const { sesiAbsensi, refreshSesiAbsensi } = useSesiAbsensi();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { mataPelajaran } = useMataPelajaran();
  const { kelas } = useKelas();
  const { kelasTahfiz } = useKelasTahfiz();
  const { santri } = useSantri();
  const { tahunAjaran } = useTahunAjaran();
  const { gurus } = useGurus();
  const { pengaturanAbsen, activePengaturanAbsen } = usePengaturanAbsen();
  const { enableEarlyDeparture } = usePengaturanSistem();
  
  // For compatibility with utility functions that expect users array
  const users = gurus;

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isManualAbsenOpen, setIsManualAbsenOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const SCAN_DEBOUNCE_TIME = 2000;
  
  // State untuk scan result modal
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    sseAbsenService.connect();

    const handleSSEEvent = (event: any) => {
      if (event.type === 'absen-murid-update' || event.type === 'absen-auto-save') {
        refreshAbsensi();
        setRefreshKey(prev => prev + 1);
      }
    };

    const handleGlobalAutoAlfa = () => {
      refreshAbsensi();
      setRefreshKey(prev => prev + 1);
    };

    const unsubscribe = sseAbsenService.subscribe(handleSSEEvent);
    window.addEventListener('absensi-auto-alfa-processed', handleGlobalAutoAlfa);

    return () => {
      unsubscribe();
      sseAbsenService.disconnect();
      window.removeEventListener('absensi-auto-alfa-processed', handleGlobalAutoAlfa);
    };
  }, [refreshAbsensi]);

  // Month and Year Filter
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const currentDate = new Date();
    return currentDate.getMonth() + 1;
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentDate = new Date();
    return currentDate.getFullYear();
  });

  const santriRecord = user?.id
    ? santri.find(s => s.id === user.id || (s as any).muridId === user.id)
    : null;
  const isSantriNotFromMurid = santriRecord && (santriRecord as any).isFromMurid === false;
  const myTahfizClasses = santriRecord
    ? kelasTahfiz.filter(cls => {
        const possibleIds = [
          santriRecord.id,
          (santriRecord as any)?.muridId as string | undefined
        ].filter(Boolean) as string[];
        return possibleIds.some(id => cls.santriIds.includes(id));
      })
    : [];
  const tahfizKelasId = myTahfizClasses[0]?.id;
  const effectiveKelasIdForAttendance = (isSantriNotFromMurid && tahfizKelasId) || user?.kelasId || tahfizKelasId || '';
  const muridKelas = kelas.find(k => k.id === effectiveKelasIdForAttendance);
  const displayKelasName = isSantriNotFromMurid && myTahfizClasses.length > 0
    ? myTahfizClasses.map(c => c.namaKelas).join(', ')
    : muridKelas?.name || 'Kelas tidak ditemukan';

  const getTodayStatusDetail = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's absensi (one record per day in new structure)
    const todayAbsensi = absensi.find(a =>
      a.muridId === user?.id && a.tanggal === today
    );

    // Use new structure first
    let masuk: Absensi | undefined;
    let pulang: Absensi | undefined;

    if (todayAbsensi) {
      if (todayAbsensi.jamMasuk || todayAbsensi.statusMasuk) {
        masuk = {
          ...todayAbsensi,
          tipeAbsen: 'masuk',
          waktu: todayAbsensi.jamMasuk || todayAbsensi.waktu || '',
          status: todayAbsensi.statusMasuk === 'izin' ? 'izin' :
                  todayAbsensi.statusMasuk === 'sakit' ? 'sakit' :
                  todayAbsensi.statusMasuk === 'alfa' ? 'alfa' :
                  todayAbsensi.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
        };
      }

      if (todayAbsensi.jamKeluar || todayAbsensi.statusKeluar) {
        pulang = {
          ...todayAbsensi,
          tipeAbsen: 'pulang',
          waktu: todayAbsensi.jamKeluar || todayAbsensi.waktu || '',
          status: todayAbsensi.statusKeluar === 'izin' ? 'izin' :
                  todayAbsensi.statusKeluar === 'sakit' ? 'sakit' :
                  todayAbsensi.statusKeluar === 'alfa' ? 'alfa' :
                  todayAbsensi.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
        };
      }
    }

    // Backward compatibility: check old structure (separate records)
    if (!masuk && !pulang) {
      const todayAbsensiOld = absensi.filter(a =>
        a.muridId === user?.id &&
        a.tipeAbsen !== undefined &&
        (a.waktu?.startsWith(today) || a.tanggal === today)
      );

      masuk = todayAbsensiOld.find(a => a.tipeAbsen === 'masuk');
      pulang = todayAbsensiOld.find(a => a.tipeAbsen === 'pulang');
    }

    let statusMasuk = null;
    let statusPulang = null;
    let displayStatusMasuk: string | null = null;
    let displayStatusPulang: string | null = null;
    let finalStatus = '';

    if (masuk) {
      if (masuk.status === 'izin' || masuk.status === 'sakit' || masuk.status === 'alfa') {
        displayStatusMasuk = masuk.status.charAt(0).toUpperCase() + masuk.status.slice(1);
      } else {
        statusMasuk = {
          status: getAbsenMasukStatus(
            new Date(masuk.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
            activePengaturanAbsen
          ),
          waktu: masuk.waktu
        };
        displayStatusMasuk = statusMasuk.status === 'hadir' ? 'Tepat Waktu' : 'Terlambat';
      }
    }

    if (pulang) {
      if (pulang.status === 'izin' || pulang.status === 'sakit' || pulang.status === 'alfa') {
        displayStatusPulang = pulang.status.charAt(0).toUpperCase() + pulang.status.slice(1);
      } else {
        statusPulang = {
          status: getAbsenPulangStatus(
            new Date(pulang.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
            activePengaturanAbsen
          ),
          waktu: pulang.waktu
        };
        displayStatusPulang = statusPulang.status === 'hadir' ? 'Tepat Waktu' : 'Pulang Cepat';
      }
    }

    if (masuk && (masuk.status === 'izin' || masuk.status === 'sakit' || masuk.status === 'alfa')) {
      finalStatus = masuk.status === 'izin' ? 'Izin' : masuk.status === 'sakit' ? 'Sakit' : 'Alfa';
    } else if (masuk && masuk.status === 'hadir' && pulang) {
      if (pulang.status === 'alfa') {
        finalStatus = 'Bolos';
      }
      else if (pulang.status === 'izin' || pulang.status === 'sakit') {
        finalStatus = 'Dispen';
      }
      else {
        finalStatus = 'Hadir';
      }
    } else if (masuk && masuk.status === 'hadir' && !pulang) {
      finalStatus = 'Hadir';
    }

    return {
      statusMasuk,
      statusPulang,
      displayStatusMasuk,
      displayStatusPulang,
      finalStatus,
      masukRawStatus: masuk?.status,
      pulangRawStatus: pulang?.status,
      hasMasuk: !!masuk,
      hasPulang: !!pulang
    };
  };

  const todayDetail = getTodayStatusDetail();

  // Get all kehadiran absensi for this student
  const allKehadiranAbsensi = getKehadiranAbsensiIntegrated(absensi, user?.id || '', 0, 0);

  // Get available months and years
  const { months: availableMonths, years: availableYears, monthsYears } = getAvailableMonthsYearsKehadiranIntegrated(absensi, user?.id || '', tahunAjaran);

  // Get filtered kehadiran absensi for selected month
  const kehadiranAbsensi = getKehadiranAbsensiIntegrated(absensi, user?.id || '', selectedMonth, selectedYear);

  // Get today's stats
  const todayStats = getTodayKehadiranStatsIntegrated(absensi, user?.id || '');

  const calculateStats = () => {
    // Count using new structure
    const masukCount = kehadiranAbsensi.filter(a =>
      (a.jamMasuk || a.statusMasuk) && 
      (a.statusMasuk === 'tepat_waktu' || a.statusMasuk === 'terlambat' || a.statusMasuk === 'hadir' || a.status === 'hadir')
    ).length;
    
    const pulangCount = kehadiranAbsensi.filter(a =>
      (a.jamKeluar || a.statusKeluar) && 
      (a.statusKeluar === 'tepat_waktu' || a.statusKeluar === 'pulang_awal' || a.status === 'hadir')
    ).length;

    // Backward compatibility: count old structure
    const oldMasukCount = kehadiranAbsensi.filter(a =>
      a.tipeAbsen === 'masuk' && a.status === 'hadir'
    ).length;
    
    const oldPulangCount = kehadiranAbsensi.filter(a =>
      a.tipeAbsen === 'pulang' && a.status === 'hadir'
    ).length;

    const totalDates = new Set(
      kehadiranAbsensi
        .map(a => a.tanggal || (a.waktu ? a.waktu.split('T')[0] : ''))
        .filter(d => d)
    ).size;

    return {
      masuk: masukCount || oldMasukCount,
      pulang: pulangCount || oldPulangCount,
      total: totalDates,
    };
  };

  const stats = calculateStats();

  const handleQRScanResult = async (qrData: string) => {
    const result = await handleAdminQRScanIntegrated({
      qrData,
      user,
      sesiAbsensi,
      refreshSesiAbsensi,
      jadwalPelajaran,
      mataPelajaran,
      tahunAjaran,
      kelas,
      users,
      pengaturanAbsen,
      refreshAbsensi,
      createAbsensiAPI,
      setRefreshKey,
      lastProcessedScan,
      setLastProcessedScan,
      SCAN_DEBOUNCE_TIME,
      kelasIdOverride: effectiveKelasIdForAttendance,
    });

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

  const handleThisMonth = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const isValid = monthsYears?.some(my => my.month === currentMonth && my.year === currentYear);

    if (isValid) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
    setIsMonthPickerOpen(false);
  };

  const handleClearMonth = () => {
    if (monthsYears && monthsYears.length > 0) {
      setSelectedMonth(monthsYears[0].month);
      setSelectedYear(monthsYears[0].year);
    }
    setIsMonthPickerOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    const isValid = monthsYears?.some(my => my.month === month && my.year === selectedYear);
    if (isValid) {
      setSelectedMonth(month);
      setIsMonthPickerOpen(false);
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    const availableMonthsForYear = monthsYears?.filter(my => my.year === year).map(my => my.month) || [];
    if (!availableMonthsForYear.includes(selectedMonth)) {
      if (availableMonthsForYear.length > 0) {
        setSelectedMonth(availableMonthsForYear[0]);
      }
    }
  };

  const handleManualAbsen = async (tipeAbsen: 'masuk' | 'pulang', keterangan?: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (!effectiveKelasIdForAttendance) {
      showErrorNotification('Kelas Tidak Ditemukan', 'Kelas Anda belum ditetapkan. Hubungi admin.');
      return;
    }
    const idKey = `${today}-${effectiveKelasIdForAttendance}-${user?.id}`; // No tipeAbsen in ID
    const nowIso = getLocalTimeISOString();

    // Check if trying to absen masuk but current time has passed jam pulang
    if (tipeAbsen === 'masuk' && activePengaturanAbsen) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
      
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
      
      if (currentTimeMinutes > jamPulangMinutes) {
        showErrorNotification(
          'Tidak Dapat Absen Masuk', 
          `Waktu absen masuk sudah melewati jam pulang (${activePengaturanAbsen.jamPulang}). Anda tidak dapat melakukan absen masuk.`
        );
        return;
      }
    }

    // Check enableEarlyDeparture restriction for pulang
    if (tipeAbsen === 'pulang' && !enableEarlyDeparture && activePengaturanAbsen) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
      
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
      const batasPulang15Menit = jamPulangMinutes - 15;

      // If trying to absen pulang before 15 minutes before jam pulang, reject
      if (currentTimeMinutes < batasPulang15Menit) {
        const batasWaktuJam = Math.floor(batasPulang15Menit / 60);
        const batasWaktuMenit = batasPulang15Menit % 60;
        const batasWaktuString = `${String(batasWaktuJam).padStart(2, '0')}:${String(batasWaktuMenit).padStart(2, '0')}`;
        
        showErrorNotification(
          'Absen Pulang Tidak Diizinkan',
          `Absen pulang hanya dapat dilakukan mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturanAbsen.jamPulang}`
        );
        return;
      }
    }

    // Get active tahun ajaran
    const activeTA = tahunAjaran.find(ta => ta.isActive);
    if (!activeTA) {
      console.error('Tidak ada tahun ajaran aktif');
      return;
    }

    // Use new structure: one document per day
    const newAbsensi: Partial<Absensi> = {
      id: idKey,
      muridId: user?.id || '',
      tanggal: today,
      kelasId: effectiveKelasIdForAttendance || '',
      method: 'manual',
      statusAbsen: 'tepat_waktu',
      keterangan: keterangan,
      tahunAjaranId: activeTA.id,
      semester: activeTA.semester,
    };

    if (tipeAbsen === 'masuk') {
      newAbsensi.jamMasuk = nowIso;
      newAbsensi.statusMasuk = 'tepat_waktu';
      // Legacy fields for backward compatibility
      newAbsensi.tipeAbsen = 'masuk';
      newAbsensi.status = 'hadir';
      newAbsensi.waktu = nowIso;
    } else {
      newAbsensi.jamKeluar = nowIso;
      newAbsensi.statusKeluar = 'tepat_waktu';
      // Legacy fields for backward compatibility
      newAbsensi.tipeAbsen = 'pulang';
      newAbsensi.status = 'hadir';
      newAbsensi.waktu = nowIso;
    }

    try {
      await createAbsensiAPI(newAbsensi);
      await refreshAbsensi();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating manual absensi:', error);
    }
  };

  return (
    <div key={refreshKey} className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Absen Kehadiran
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Scan QR Admin atau Wali Kelas untuk mencatat absen masuk dan pulang
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-3">
                <p className="text-xs sm:text-sm text-blue-100 mb-1">Status Hari Ini</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {todayStats.isMasuk ? '✓' : '-'} {todayStats.isPulang ? '✓' : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Status Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 sm:px-6 py-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Status Absen Hari Ini</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Masuk Status */}
            <div className={`rounded-lg sm:rounded-xl p-4 sm:p-5 border ${
              todayDetail.masukRawStatus === 'izin' ? 'bg-gradient-to-br from-yellow-50 to-yellow-50 border-yellow-100' :
              todayDetail.masukRawStatus === 'sakit' ? 'bg-gradient-to-br from-blue-50 to-blue-50 border-blue-100' :
              todayDetail.masukRawStatus === 'alfa' ? 'bg-gradient-to-br from-red-50 to-red-50 border-red-100' :
              'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${
                    todayDetail.masukRawStatus === 'izin' ? 'bg-yellow-600' :
                    todayDetail.masukRawStatus === 'sakit' ? 'bg-blue-600' :
                    todayDetail.masukRawStatus === 'alfa' ? 'bg-red-600' :
                    'bg-emerald-600'
                  }`}>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold uppercase ${
                    todayDetail.masukRawStatus === 'izin' ? 'text-yellow-600' :
                    todayDetail.masukRawStatus === 'sakit' ? 'text-blue-600' :
                    todayDetail.masukRawStatus === 'alfa' ? 'text-red-600' :
                    'text-emerald-600'
                  }`}>Masuk</p>
                </div>
              </div>
              {todayDetail.masukRawStatus === 'izin' || todayDetail.masukRawStatus === 'sakit' || todayDetail.masukRawStatus === 'alfa' ? (
                <div>
                  <p className={`text-2xl sm:text-3xl font-bold mb-1 uppercase ${
                    todayDetail.masukRawStatus === 'izin' ? 'text-yellow-700' :
                    todayDetail.masukRawStatus === 'sakit' ? 'text-blue-700' :
                    'text-red-700'
                  }`}>
                    {todayDetail.masukRawStatus}
                  </p>
                  <p className={`text-xs sm:text-sm ${
                    todayDetail.masukRawStatus === 'izin' ? 'text-yellow-600' :
                    todayDetail.masukRawStatus === 'sakit' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    Tidak Perlu Absen
                  </p>
                </div>
              ) : todayStats.waktuMasuk ? (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold mb-1 text-emerald-700">
                    {todayStats.waktuMasuk}
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-600">
                    {todayDetail.displayStatusMasuk || 'Tepat Waktu'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-400 mb-1">-</p>
                  <p className="text-xs sm:text-sm text-slate-600">Belum Absen</p>
                </div>
              )}
            </div>

            {/* Pulang Status */}
            <div className={`rounded-lg sm:rounded-xl p-4 sm:p-5 border ${
              todayDetail.pulangRawStatus === 'izin' ? 'bg-gradient-to-br from-yellow-50 to-yellow-50 border-yellow-100' :
              todayDetail.pulangRawStatus === 'sakit' ? 'bg-gradient-to-br from-blue-50 to-blue-50 border-blue-100' :
              todayDetail.pulangRawStatus === 'alfa' ? 'bg-gradient-to-br from-red-50 to-red-50 border-red-100' :
              'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${
                    todayDetail.pulangRawStatus === 'izin' ? 'bg-yellow-600' :
                    todayDetail.pulangRawStatus === 'sakit' ? 'bg-blue-600' :
                    todayDetail.pulangRawStatus === 'alfa' ? 'bg-red-600' :
                    'bg-amber-600'
                  }`}>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold uppercase ${
                    todayDetail.pulangRawStatus === 'izin' ? 'text-yellow-600' :
                    todayDetail.pulangRawStatus === 'sakit' ? 'text-blue-600' :
                    todayDetail.pulangRawStatus === 'alfa' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>Pulang</p>
                </div>
              </div>
              {todayDetail.pulangRawStatus === 'izin' || todayDetail.pulangRawStatus === 'sakit' || todayDetail.pulangRawStatus === 'alfa' ? (
                <div>
                  <p className={`text-2xl sm:text-3xl font-bold mb-1 uppercase ${
                    todayDetail.pulangRawStatus === 'izin' ? 'text-yellow-700' :
                    todayDetail.pulangRawStatus === 'sakit' ? 'text-blue-700' :
                    'text-red-700'
                  }`}>
                    {todayDetail.pulangRawStatus}
                  </p>
                  <p className={`text-xs sm:text-sm ${
                    todayDetail.pulangRawStatus === 'izin' ? 'text-yellow-600' :
                    todayDetail.pulangRawStatus === 'sakit' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    Tidak Perlu Absen
                  </p>
                </div>
              ) : todayStats.waktuPulang ? (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold mb-1 text-amber-700">
                    {todayStats.waktuPulang}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-600">
                    {todayDetail.displayStatusPulang || 'Tepat Waktu'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-400 mb-1">-</p>
                  <p className="text-xs sm:text-sm text-slate-600">Belum Absen</p>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4 sm:mt-5">
            <button
              onClick={() => setIsQRScannerOpen(true)}
              disabled={todayDetail.masukRawStatus === 'izin' || todayDetail.masukRawStatus === 'sakit' || todayDetail.masukRawStatus === 'alfa' || (todayDetail.hasMasuk && todayDetail.hasPulang)}
              className={`font-semibold py-3 sm:py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                todayDetail.masukRawStatus === 'izin' || todayDetail.masukRawStatus === 'sakit' || todayDetail.masukRawStatus === 'alfa' || (todayDetail.hasMasuk && todayDetail.hasPulang)
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white hover:shadow-lg'
              }`}
            >
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base">Scan QR</span>
            </button>
            {activePengaturanAbsen?.enableManualAbsen !== false && (
              <button
                onClick={() => setIsManualAbsenOpen(true)}
                disabled={todayDetail.masukRawStatus === 'izin' || todayDetail.masukRawStatus === 'sakit' || todayDetail.masukRawStatus === 'alfa' || (todayDetail.hasMasuk && todayDetail.hasPulang)}
                className={`font-semibold py-3 sm:py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  todayDetail.masukRawStatus === 'izin' || todayDetail.masukRawStatus === 'sakit' || todayDetail.masukRawStatus === 'alfa' || (todayDetail.hasMasuk && todayDetail.hasPulang)
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white hover:shadow-lg'
                }`}
              >
                <span className="text-lg">✓</span>
                <span className="text-sm sm:text-base">Manual</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Masuk</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.masuk}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Pulang</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.pulang}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Hari</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 sm:px-6 py-4 border-b border-slate-200">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Filter Riwayat</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Pilih periode untuk melihat riwayat absen kehadiran</p>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="space-y-4">
            {/* Kelas Info */}
            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-lg p-2 mt-0.5">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Kelas Saat Ini</p>
                  <h4 className="text-base sm:text-lg font-bold text-blue-900">
                    {displayKelasName}
                  </h4>
                </div>
              </div>
            </div>

            {/* Month Year Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pilih Bulan & Tahun
              </label>
              <MonthYearPickerKehadiran
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                isOpen={isMonthPickerOpen}
                onToggle={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                onMonthSelect={handleMonthSelect}
                onYearSelect={handleYearSelect}
                onThisMonth={handleThisMonth}
                onClear={handleClearMonth}
                availableMonths={availableMonths}
                availableYears={availableYears}
                monthsYears={monthsYears}
              />
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Menampilkan data untuk {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 sm:px-6 py-4 border-b border-emerald-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 rounded-lg p-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Riwayat Kehadiran</h3>
                <p className="text-xs sm:text-sm text-slate-600">Detail absen masuk dan pulang</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <AbsenKehadiranTable
            kehadiranAbsensi={kehadiranAbsensi}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            sesiAbsensi={sesiAbsensi}
          />
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onScan={handleQRScanResult}
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

      {/* Manual Absen Modal */}
      <ManualAbsenModal
        isOpen={isManualAbsenOpen}
        onClose={() => setIsManualAbsenOpen(false)}
        muridId={user?.id || ''}
        onSubmit={handleManualAbsen}
      />
    </div>
  );
};

export default AbsenKehadiran;
