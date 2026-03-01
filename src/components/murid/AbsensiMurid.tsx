import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, FileText, TrendingUp, User as UserIcon } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import QRScanner from '../ui/QRScanner';
import { useAuth } from '../../context/AuthContext';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useSesiAbsensi } from '../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../hooks/useAbsensi';
import { useMataPelajaran } from '../../hooks/useMataPelajaran';
import { useGurus } from '../../hooks/useGurus';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { JadwalPelajaran, SesiAbsensi, Absensi, MataPelajaran, Kelas, TahunAjaran, User } from '../../types';
import TodaySessionCard from './pages/absensi/TodaySessionCard';
import MonthYearPicker from './pages/absensi/MonthYearPicker';
import AttendanceHistoryTable from './pages/absensi/AttendanceHistoryTable';
import { getTodayIndonesia } from '../../utils/absensiUtils';
import {
  getKelasForTahunAjaran,
  getJadwalInfo as getJadwalInfoUtil,
  getAttendanceStatus as getAttendanceStatusUtil,
  getFilteredSessions as getFilteredSessionsUtil,
  getAvailableMonthsYears
} from './pages/absensi/AbsensiMuridUtils';
import { handleQRScanResult as handleQRScanResultUtil, resetQRScanState } from './pages/absensi/QRScanHandler';

const AbsensiMurid: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const jadwalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { sesiAbsensi, refreshSesiAbsensi, addAbsensiToSesi: addAbsensiToSesiAPI } = useSesiAbsensi();
  const { absensi, refreshAbsensi, createAbsensi: createAbsensiAPI } = useAbsensi({ muridId: user?.id });
  const { mataPelajaran } = useMataPelajaran();
  const { gurus } = useGurus();
  const { kelas } = useKelas();
  const { tahunAjaran } = useTahunAjaran();
  
  // For compatibility with utility functions that expect users array
  const users = gurus;
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsensi | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);

  // Only use active tahun ajaran - no filter selection
  const selectedTahunAjaran = activeTahunAjaran?.tahun || '';
  const selectedSemester = activeTahunAjaran?.semester || 1;

  // Get available months and years based on active tahun ajaran calendar
  const { months: availableMonths, years: availableYears, monthsYears } = getAvailableMonthsYears(activeTahunAjaran);

  // Filter states - only month and year
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    // Check if current month is in available months
    if (availableMonths.includes(currentMonth)) {
      return currentMonth;
    }
    // Otherwise return the first available month
    return availableMonths[0] || currentMonth;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    // Check if current year is in available years
    if (availableYears.includes(currentYear)) {
      return currentYear;
    }
    // Otherwise return the first available year
    return availableYears[0] || currentYear;
  });

  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const SCAN_DEBOUNCE_TIME = 2000;
  const [refreshKey, setRefreshKey] = useState(0);

  const today = getTodayIndonesia();

  const targetKelas = user?.kelasId ? getKelasForTahunAjaran(user.kelasId, selectedTahunAjaran, kelas, activeTahunAjaran) : null;

  // Get schedules for the active period
  const mySchedules = targetKelas ? jadwalPelajaran.filter(j =>
    j.kelasId === (targetKelas.id.startsWith('virtual-') ? user?.kelasId : targetKelas.id) &&
    j.tahunAjaran === selectedTahunAjaran &&
    j.semester === selectedSemester
  ) : [];

  // Get today's schedules for my class (regardless of sesi status)
  const todaySchedules = mySchedules.filter(j => {
    const jadwal = jadwalPelajaran.find(jp => jp.id === j.id);
    return jadwal && {
      ...j,
      hasActiveSession: sesiAbsensi.some(s => s.jadwalId === j.id && s.tanggal === today)
    };
  });

  // Get today's sessions for my class
  const todaySessions = sesiAbsensi.filter(s =>
    s.tanggal === today &&
    mySchedules.some(j => j.id === s.jadwalId)
  );

  const getJadwalInfoWrapper = (jadwalId: string) => {
    return getJadwalInfoUtil(jadwalId, jadwalPelajaran, mataPelajaran, users);
  };

  const getAttendanceStatusWrapper = (sesiId: string) => {
    return getAttendanceStatusUtil(sesiId, user?.id, absensi, sesiAbsensi, jadwalPelajaran);
  };

  const handleQRScanResult = async (qrData: string) => {
    const success = await handleQRScanResultUtil({
      qrData,
      user,
      selectedSesi,
      sesiAbsensi,
      jadwalPelajaran,
      mataPelajaran,
      tahunAjaran,
      refreshAbsensi,
      createAbsensiAPI,
      refreshSesiAbsensi,
      addAbsensiToSesiAPI,
      setRefreshKey,
      lastProcessedScan,
      setLastProcessedScan,
      SCAN_DEBOUNCE_TIME
    });

    if (success) {
      // Jangan reset processedScans - biarkan tetap untuk mencegah scan yang sama diproses ulang
      // Hanya reset state processing, tapi biarkan tracking scan yang sudah berhasil tetap ada
      // Reset state component
      setLastProcessedScan(null);
      // Tutup modal dengan delay kecil untuk memastikan scanner berhenti membaca
      setTimeout(() => {
        setIsQRScannerOpen(false);
        setSelectedSesi(null);
        // Reset processing state setelah modal ditutup
        resetQRScanState();
      }, 100);
    }
  };

  const filteredSessions = targetKelas ?
    getFilteredSessionsUtil(sesiAbsensi, mySchedules, selectedMonth, selectedYear) : [];

  const handleThisMonth = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Check if current month/year is valid within the academic calendar
    const isValid = monthsYears?.some(my => my.month === currentMonth && my.year === currentYear);

    if (isValid) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
    setIsMonthPickerOpen(false);
  };

  const handleClearMonth = () => {
    // Reset to first available month/year
    if (monthsYears && monthsYears.length > 0) {
      setSelectedMonth(monthsYears[0].month);
      setSelectedYear(monthsYears[0].year);
    }
    setIsMonthPickerOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    // Validate if the selected month is available for the current year
    const isValid = monthsYears?.some(my => my.month === month && my.year === selectedYear);
    if (isValid) {
      setSelectedMonth(month);
      setIsMonthPickerOpen(false);
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    // Adjust month if current selected month is not available in the new year
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
      // Wait for DOM to render and schedules to be loaded
      const scrollToElement = () => {
        const jadwalElement = jadwalRefs.current[scrollToJadwalId];
        if (jadwalElement) {
          // Scroll to element with smooth behavior
          jadwalElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // Highlight the card briefly with animation
          jadwalElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'transition-all', 'duration-300');
          setTimeout(() => {
            jadwalElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
          
          return true;
        }
        return false;
      };

      // Try immediately, then retry with delays if element not found
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

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden ">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Absensi Saya
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-3">
                <p className="text-xs sm:text-sm text-blue-100 mb-1">Tingkat Kehadiran</p>
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
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Hadir</p>
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
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Izin</p>
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
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Sakit</p>
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
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Alfa</p>
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
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Jadwal Pelajaran Hari Ini</h3>
                <p className="text-xs sm:text-sm text-slate-600">Scan QR ketika guru membuka sesi</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Lihat Riwayat Absensi</span>
              <span className="sm:hidden">Riwayat</span>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          {todaySchedules.length > 0 ? (
            <div className="space-y-3">
              {todaySchedules.map((schedule) => {
                const { mapel, guru, waktu } = getJadwalInfoWrapper(schedule.id);
                const activeSesi = sesiAbsensi.find(s => s.jadwalId === schedule.id && s.tanggal === today);
                const attendance = activeSesi ? getAttendanceStatusWrapper(activeSesi.id) : undefined;

                if (activeSesi) {
                  return (
                    <div
                      key={schedule.id}
                      ref={(el) => {
                        jadwalRefs.current[schedule.id] = el;
                      }}
                    >
                      <TodaySessionCard
                        sesi={activeSesi}
                        mapel={mapel}
                        guru={guru}
                        waktu={waktu}
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
                                <span className="truncate">{guru}</span>
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
                            Guru belum membuka sesi
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
              <p className="text-sm sm:text-base font-medium text-slate-500">Tidak ada jadwal pelajaran hari ini</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Nikmati hari istirahatmu!</p>
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
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Filter Riwayat Absensi</h3>
                <p className="text-xs sm:text-sm text-slate-600">Pilih periode untuk melihat riwayat</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke Jadwal Hari Ini</span>
              <span className="sm:hidden">Kembali</span>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="space-y-4">
            {/* Kelas Info */}
            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 rounded-lg p-2 mt-0.5">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Kelas Saat Ini</p>
                    <h4 className="text-base sm:text-lg font-bold text-blue-900">
                      {targetKelas?.name || 'Kelas tidak ditemukan'}
                    </h4>
                    <p className="text-xs sm:text-sm text-blue-700 mt-1">
                      {selectedTahunAjaran} - Semester {selectedSemester} ({selectedSemester === 1 ? 'Ganjil' : 'Genap'})
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                  Periode Aktif
                </span>
              </div>
            </div>

            {/* Month Year Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pilih Bulan & Tahun
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
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Riwayat Absensi</h3>
                <p className="text-xs sm:text-sm text-slate-600">Detail kehadiran per sesi</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
              {targetKelas && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {targetKelas.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <AttendanceHistoryTable
            filteredSessions={filteredSessions}
            targetKelas={targetKelas}
            selectedTahunAjaran={selectedTahunAjaran}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            activeTahunAjaran={activeTahunAjaran}
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
          // Reset state QR scan handler untuk mencegah pemrosesan berulang setelah modal ditutup
          resetQRScanState();
          // Reset state component
          setLastProcessedScan(null);
          setIsQRScannerOpen(false);
          setSelectedSesi(null);
        }}
      />
    </div>
  );
};

export default AbsensiMurid;
