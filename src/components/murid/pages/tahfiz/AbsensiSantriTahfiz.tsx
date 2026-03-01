import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, FileText, TrendingUp, User as UserIcon } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import QRScanner from '../../../ui/QRScanner';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useJadwalTahfiz } from '../../../../hooks/useJadwalTahfiz';
import { useSesiAbsensiTahfiz } from '../../../../hooks/useSesiAbsensiTahfiz';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../hooks/useSantri';
import { TahfizSchedule, SesiAbsensiTahfiz, AbsensiPelajaran, User } from '../../../../types';
import TodaySessionCardTahfiz from './TodaySessionCardTahfiz';
import MonthYearPicker from '../absensi/MonthYearPicker';
import AttendanceHistoryTableTahfiz from './AttendanceHistoryTableTahfiz';
import {
  getJadwalTahfizInfo,
  getAttendanceStatusTahfiz,
  getFilteredSessionsTahfiz,
  getAvailableMonthsYearsTahfiz
} from './AbsensiSantriTahfizUtils';
import { handleQRScanResultTahfiz as handleQRScanResultTahfizUtil, resetQRScanStateTahfiz } from './QRScanHandlerTahfiz';
import { getTodayIndonesia } from '../../../../utils/absensiUtils';
import { getDateLocale } from '../../../../utils/dateLocaleUtils';

const AbsensiSantriTahfiz: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const jadwalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { jadwalTahfiz } = useJadwalTahfiz();
  const { sesiAbsensiTahfiz, refreshSesiAbsensiTahfiz, addAbsensiToSesiTahfiz: addAbsensiToSesiTahfizAPI } = useSesiAbsensiTahfiz();
  const { ustadz } = useUstadz();
  const { kelasTahfiz } = useKelasTahfiz();
  const { santri } = useSantri();

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsensiTahfiz | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const currentYear = new Date().getFullYear().toString();
  const { months: availableMonths, years: availableYears, monthsYears } = getAvailableMonthsYearsTahfiz(currentYear);

  // Filter states - only month and year
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    if (availableMonths.includes(currentMonth)) {
      return currentMonth;
    }
    return availableMonths[0] || currentMonth;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    if (availableYears.includes(currentYear)) {
      return currentYear;
    }
    return availableYears[0] || currentYear;
  });

  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const SCAN_DEBOUNCE_TIME = 2000;
  const [refreshKey, setRefreshKey] = useState(0);

  const today = getTodayIndonesia();
  const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).toLowerCase();

  // Map user to santri record (supports santri created from murid or standalone santri)
  const santriRecord = user?.id
    ? santri.find(s => s.id === user.id || (s as any).muridId === user.id)
    : undefined;
  const isSantriUser = !!santriRecord;
  const attendanceUserId = santriRecord?.id || user?.id;

  // Find classes where the logged-in user is a santri
  const myClasses = isSantriUser && attendanceUserId
    ? kelasTahfiz.filter(cls => {
        const possibleIds = [
          attendanceUserId,
          (santriRecord as any)?.muridId as string | undefined
        ].filter(Boolean) as string[];
        return possibleIds.some(id => cls.santriIds.includes(id));
      })
    : [];

  // Get schedules for classes where the user is a santri
  const mySchedules = myClasses.length > 0
    ? jadwalTahfiz.filter(j => myClasses.some(cls => cls.id === j.kelasId))
    : [];

  // Get today's schedules for my classes
  const todaySchedules = mySchedules.filter(j => j.hari === currentDay);

  // Get today's sessions for my classes
  const todaySessions = sesiAbsensiTahfiz.filter(s =>
    s.tanggal === today &&
    mySchedules.some(j => j.id === s.jadwalId)
  );

  const getJadwalInfoWrapper = (jadwalId: string) => {
    return getJadwalTahfizInfo(jadwalId, jadwalTahfiz, kelasTahfiz, ustadz);
  };

  const getAttendanceStatusWrapper = (sesiId: string) => {
    return getAttendanceStatusTahfiz(sesiId, attendanceUserId, sesiAbsensiTahfiz);
  };

  const handleQRScanResult = async (qrData: string) => {
    const success = await handleQRScanResultTahfizUtil({
      qrData,
      user,
      selectedSesi,
      sesiAbsensiTahfiz,
      jadwalTahfiz,
      kelasTahfiz,
      santriList: santri,
      attendanceUserId,
      refreshSesiAbsensiTahfiz,
      setRefreshKey,
      lastProcessedScan,
      setLastProcessedScan,
      SCAN_DEBOUNCE_TIME,
      addAbsensiToSesiTahfizAPI
    });

    if (success) {
      setLastProcessedScan(null);
      setTimeout(() => {
        setIsQRScannerOpen(false);
        setSelectedSesi(null);
        resetQRScanStateTahfiz();
      }, 100);
    }
  };

  const filteredSessions = getFilteredSessionsTahfiz(sesiAbsensiTahfiz, mySchedules, selectedMonth, selectedYear);

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

  // Calculate stats for the selected period
  const calculateStats = () => {
    const myAttendance = filteredSessions.map(sesi => {
      const attendance = getAttendanceStatusWrapper(sesi.id);
      return attendance?.status || 'alfa';
    });

    return {
      hadir: myAttendance.filter(s => s === 'hadir').length,
      izin: myAttendance.filter(s => s === 'izin').length,
      sakit: myAttendance.filter(s => s === 'sakit').length,
      alfa: myAttendance.filter(s => s === 'alfa').length,
      total: filteredSessions.length
    };
  };

  const stats = calculateStats();
  const attendanceRate = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : '0';

  // Scroll to specific jadwal when navigating from dashboard
  useEffect(() => {
    const scrollToJadwalId = (location.state as any)?.scrollToJadwalId;
    if (scrollToJadwalId) {
      const scrollToElement = () => {
        const jadwalElement = jadwalRefs.current[scrollToJadwalId];
        if (jadwalElement) {
          jadwalElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          jadwalElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'transition-all', 'duration-300');
          setTimeout(() => {
            jadwalElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
          
          return true;
        }
        return false;
      };

      let timeout1: NodeJS.Timeout;
      let timeout2: NodeJS.Timeout;
      
      if (!scrollToElement()) {
        timeout1 = setTimeout(() => {
          if (!scrollToElement()) {
            timeout2 = setTimeout(() => {
              scrollToElement();
            }, 500);
          }
        }, 100);
      }
      
      return () => {
        if (timeout1) clearTimeout(timeout1);
        if (timeout2) clearTimeout(timeout2);
      };
    }
  }, [location.state, todaySchedules]);

  // If user is not a santri, show message
  if (!isSantriUser) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
              {t('tahfiz.muridTahfiz.absensiSantri.title')}
            </h1>
            <p className="text-sm sm:text-base text-blue-100">
              {t('tahfiz.muridTahfiz.absensiSantri.subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="text-center py-12 px-6">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {t('tahfiz.muridTahfiz.absensiSantri.belumTerdaftarSebagaiSantri')}
            </h3>
            <p className="text-sm text-slate-600">
              {t('tahfiz.muridTahfiz.absensiSantri.untukMelakukanAbsensi')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.muridTahfiz.absensiSantri.title')}
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                {new Date().toLocaleDateString(getDateLocale(language), {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-3">
                <p className="text-xs sm:text-sm text-blue-100 mb-1">{t('tahfiz.muridTahfiz.absensiSantri.tingkatKehadiran')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{attendanceRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">{t('tahfiz.muridTahfiz.absensiSantri.hadir')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.hadir}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">{t('tahfiz.muridTahfiz.absensiSantri.izin')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.izin}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">{t('tahfiz.muridTahfiz.absensiSantri.sakit')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.sakit}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-red-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">{t('tahfiz.muridTahfiz.absensiSantri.alfa')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.alfa}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sessions */}
      {!showHistory && (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 sm:px-6 py-4 border-b border-blue-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{t('tahfiz.muridTahfiz.absensiSantri.jadwalTahfizHariIni')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('tahfiz.muridTahfiz.absensiSantri.scanQRKetikaUstadzMembukaSesi')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">{t('tahfiz.muridTahfiz.absensiSantri.lihatRiwayatAbsensi')}</span>
              <span className="sm:hidden">{t('tahfiz.muridTahfiz.absensiSantri.riwayat')}</span>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          {todaySchedules.length > 0 ? (
            <div className="space-y-3">
              {todaySchedules.map((schedule) => {
                const { mapel, ustadz: ustadzName, waktu, kelas } = getJadwalInfoWrapper(schedule.id);
                const activeSesi = sesiAbsensiTahfiz.find(s => s.jadwalId === schedule.id && s.tanggal === today);
                const attendance = activeSesi ? getAttendanceStatusWrapper(activeSesi.id) : undefined;

                if (activeSesi) {
                  return (
                    <div
                      key={schedule.id}
                      ref={(el) => {
                        jadwalRefs.current[schedule.id] = el;
                      }}
                    >
                      <TodaySessionCardTahfiz
                        sesi={activeSesi}
                        mapel={mapel}
                        ustadz={ustadzName}
                        waktu={waktu}
                        kelas={kelas}
                        attendance={attendance}
                        onScanQR={() => {
                          setSelectedSesi(activeSesi);
                          setIsQRScannerOpen(true);
                        }}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div 
                      key={schedule.id} 
                      ref={(el) => {
                        jadwalRefs.current[schedule.id] = el;
                      }}
                      className="group relative bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100">
                              <Clock className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                                {mapel}
                              </h4>
                              <div className="flex items-center mt-1.5 text-xs sm:text-sm text-slate-600">
                                <UserIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                <span className="truncate">{ustadzName}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {t('tahfiz.muridTahfiz.absensiSantri.kelasLabel')}: {kelas}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 ml-8">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{waktu}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end sm:justify-start">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            {t('tahfiz.muridTahfiz.absensiSantri.ustadzBelumMembukaSesi')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-500">{t('tahfiz.muridTahfiz.absensiSantri.tidakAdaJadwalTahfizHariIni')}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{t('tahfiz.muridTahfiz.absensiSantri.nikmatiHariIstirahatmu')}</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Period Info & Filter */}
      {showHistory && (
      <>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 sm:px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-slate-600 rounded-lg p-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{t('tahfiz.muridTahfiz.absensiSantri.filterRiwayatAbsensi')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('tahfiz.muridTahfiz.absensiSantri.pilihPeriodeUntukMelihatRiwayat')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{t('tahfiz.muridTahfiz.absensiSantri.kembaliKeJadwalHariIni')}</span>
              <span className="sm:hidden">{t('tahfiz.muridTahfiz.absensiSantri.kembali')}</span>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="space-y-4">
            {/* Month Year Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('tahfiz.muridTahfiz.absensiSantri.pilihBulanTahun')}
              </label>
              <MonthYearPicker
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
                language={language}
              />
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                {t('tahfiz.muridTahfiz.absensiSantri.menampilkanDataUntuk')} {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(getDateLocale(language), { month: 'long', year: 'numeric' })}
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
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{t('tahfiz.muridTahfiz.absensiSantri.riwayatAbsensi')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('tahfiz.muridTahfiz.absensiSantri.detailKehadiranPerSesi')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(getDateLocale(language), { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <AttendanceHistoryTableTahfiz
            filteredSessions={filteredSessions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            getJadwalInfo={getJadwalInfoWrapper}
            getAttendanceStatus={getAttendanceStatusWrapper}
          />
        </div>
      </div>
      </>
      )}

      <QRScanner
        isOpen={isQRScannerOpen}
        onScan={handleQRScanResult}
        onClose={() => {
          resetQRScanStateTahfiz();
          setLastProcessedScan(null);
          setIsQRScannerOpen(false);
          setSelectedSesi(null);
        }}
      />
    </div>
  );
};

export default AbsensiSantriTahfiz;

