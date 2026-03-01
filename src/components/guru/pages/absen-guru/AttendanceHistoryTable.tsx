import React, { useState } from 'react';
import { Calendar, History, AlertCircle } from 'lucide-react';
import Badge from '../../../ui/Badge';
import { AbsensiGuru } from '../../../../types';
import MonthYearPicker from './MonthYearPicker';
import AbsenGuruDetailModal from './AbsenGuruDetailModal';
import { AttendanceRecord } from './absenGuruUtils';
import { useLanguage } from '../../../../context/LanguageContext';
import { getDateLocale } from '../../../../utils/dateLocaleUtils';
import { getTodayIndonesia } from '../../../../utils/absensiUtils';

const getKeteranganText = (attendance?: AbsensiGuru): string => {
  if (!attendance) return '-';
  if (attendance.keterangan) return attendance.keterangan;
  if (attendance.keteranganAbsensi) {
    return attendance.keteranganAbsensi === 'Bolos' ? 'Bolos Kerja' : attendance.keteranganAbsensi;
  }
  return '-';
};

interface AttendanceHistoryTableProps {
  selectedMonth: number;
  selectedYear: number;
  isMonthPickerOpen: boolean;
  onToggleMonthPicker: () => void;
  onMonthSelect: (month: number) => void;
  onYearSelect: (year: number) => void;
  onSetThisMonth: () => void;
  onClear: () => void;
  attendanceRecords: AttendanceRecord[];
  getStatusBadge: (status: string) => React.ReactNode;
}

const AttendanceHistoryTable: React.FC<AttendanceHistoryTableProps> = ({
  selectedMonth,
  selectedYear,
  isMonthPickerOpen,
  onToggleMonthPicker,
  onMonthSelect,
  onYearSelect,
  onSetThisMonth,
  onClear,
  attendanceRecords,
  getStatusBadge,
}) => {
  const { t, language } = useLanguage();
  const [selectedDateDetail, setSelectedDateDetail] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Helper untuk mengecek apakah tanggal adalah hari ini (waktu Indonesia)
  const isToday = (dateStr: string): boolean => {
    const today = getTodayIndonesia();
    return dateStr === today;
  };

  // Format time to use dot instead of colon (12.20 instead of 12:20)
  const formatTimeWithDot = (timeString: string | undefined): string => {
    if (!timeString) return '-';
    try {
      // If it's an ISO timestamp, parse it first
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
      }
      // If it's already in HH:mm format, just replace colon with dot
      if (timeString.includes(':')) {
        return timeString.replace(':', '.');
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  // Helper untuk mendapatkan absensi per hari dan info tanggal
  const getDayAbsensiInfo = (day: number): { attendance?: AbsensiGuru; dateExistsInDb: boolean } => {
    const dateStr = String(selectedYear).padStart(4, '0') + '-' +
                    String(selectedMonth).padStart(2, '0') + '-' +
                    String(day).padStart(2, '0');
    const record = attendanceRecords.find(r => r.tanggal === dateStr);
    return {
      attendance: record?.attendance,
      dateExistsInDb: record?.dateExistsInDb ?? false
    };
  };

  // Helper untuk mendapatkan absensi per hari (backward compatibility)
  const getDayAbsensi = (day: number): AbsensiGuru | undefined => {
    return getDayAbsensiInfo(day).attendance;
  };

  // Helper untuk mendapatkan keterangan absensi
  const getKeteranganAbsensi = (attendance: AbsensiGuru | undefined, dateExistsInDb: boolean): string | null => {
    // Jika tanggal tidak ada di database, return null untuk menunjukkan "-"
    if (!dateExistsInDb) return null;
    
    // Jika tanggal ada di database tapi tidak ada data absensi untuk guru ini, maka Alfa
    if (!attendance) return 'Alfa';
    
    const statusMasuk = attendance.statusMasuk;
    const statusKeluar = attendance.statusKeluar;
    const hasMasuk = !!(attendance.jamMasuk || statusMasuk);
    const hasKeluar = !!(attendance.jamKeluar || statusKeluar);

    // Jika tidak ada masuk dan tidak ada keluar, maka Alfa
    if (!hasMasuk && !hasKeluar) return 'Alfa';

    // Jika ada status izin, sakit, atau alfa
    if (statusMasuk === 'izin') return 'Izin';
    if (statusMasuk === 'sakit') return 'Sakit';
    if (statusMasuk === 'alfa' || statusMasuk === 'tidak_masuk') return 'Alfa';

    // Jika masuk hadir/tepat_waktu/terlambat, cek pulang
    if (!hasKeluar) {
      // Masuk hadir tapi belum pulang, anggap hadir
      if (statusMasuk === 'tepat_waktu' || statusMasuk === 'terlambat') {
        return 'Hadir';
      }
      // Jika tidak ada status masuk yang jelas, cek apakah ada jam masuk
      if (attendance.jamMasuk) return 'Hadir';
      return 'Alfa';
    }

    // Check statusKeluar
    if (statusKeluar === 'izin' || statusKeluar === 'sakit') {
      return 'Dispen';
    }
    if (statusKeluar === 'alfa' || statusKeluar === 'tidak_keluar') {
      return 'Bolos';
    }
    if (statusKeluar === 'tepat_waktu' || statusKeluar === 'pulang_awal') {
      return 'Hadir';
    }

    // Default: hadir jika ada jam masuk
    if (attendance.jamMasuk) return 'Hadir';
    
    // Jika tidak ada data yang jelas, maka Alfa
    return 'Alfa';
  };

  // Generate calendar days
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const periodText = new Date(selectedYear, selectedMonth - 1).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <History className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">{t('absenGuruPage.riwayatAbsensi')}</h3>
              <p className="text-xs sm:text-sm text-blue-100">{t('absenGuruPage.dataKehadiranAnda')}</p>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row xs:items-end gap-2 xs:gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-white/90 mb-1.5 uppercase tracking-wide">
                {t('absenGuruPage.filterPeriode')}
              </label>
              <MonthYearPicker
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                isOpen={isMonthPickerOpen}
                onToggle={onToggleMonthPicker}
                onMonthSelect={onMonthSelect}
                onYearSelect={onYearSelect}
                onSetThisMonth={onSetThisMonth}
                onClear={onClear}
                language={language}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        <div className="mb-5 sm:mb-6">
          <Badge variant="info">
            {t('absenGuruPage.periode')}: {periodText}
          </Badge>
        </div>

        {attendanceRecords.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            <div className="hidden sm:grid grid-cols-7 gap-3 sm:gap-4 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
              <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">{t('absenGuruPage.tanggal')}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">{t('absenGuruPage.jamMasuk')}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">{t('absenGuruPage.statusMasuk')}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">{t('absenGuruPage.jamKeluar')}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">{t('absenGuruPage.statusKeluar')}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">{t('absenGuruPage.statusAkhir')}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">{t('absenGuruPage.keterangan')}</div>
            </div>

            {attendanceRecords.map((record, index) => {
              const keterangan = getKeteranganText(record.attendance);
              const tanggalFormatted = new Date(record.tanggal).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              const isTodayRecord = isToday(record.tanggal);
              const statusAkhir = getKeteranganAbsensi(record.attendance, record.dateExistsInDb);
              
              const getStatusAkhirBadge = (status: string | null, isTodayDate: boolean) => {
                // Jika tanggal tidak ada di database, tampilkan "-"
                if (status === null) {
                  return <span className="text-xs sm:text-sm text-slate-400">-</span>;
                }
                
                if (status === 'Hadir') {
                  return <Badge variant="success">{t('absenGuruPage.hadir')}</Badge>;
                }
                if (status === 'Izin') {
                  return <Badge variant="warning">{t('absenGuruPage.izin')}</Badge>;
                }
                if (status === 'Sakit') {
                  return <Badge variant="info">{t('absenGuruPage.sakit')}</Badge>;
                }
                if (status === 'Alfa') {
                  return <Badge variant="danger">{t('absenGuruPage.alfa')}</Badge>;
                }
                if (status === 'Dispen') {
                  return <Badge variant="warning">{t('absenGuruPage.dispen')}</Badge>;
                }
                if (status === 'Bolos') {
                  return <Badge variant="danger">{t('absenGuruPage.bolos')}</Badge>;
                }
                return <Badge variant="danger">{t('absenGuruPage.alfa')}</Badge>;
              };

              return (
                <div
                  key={index}
                  className="hidden sm:grid grid-cols-7 gap-3 sm:gap-4 px-4 py-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-center text-xs sm:text-sm font-medium text-slate-900">
                    {tanggalFormatted}
                  </div>
                  <div className="flex items-center">
                    {record.attendance?.jamMasuk ? (
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">{formatTimeWithDot(record.attendance.jamMasuk)}</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-slate-400">-</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {record.attendance?.statusMasuk ? (
                      getStatusBadge(record.attendance.statusMasuk)
                    ) : !record.dateExistsInDb ? (
                      <span className="text-xs sm:text-sm text-slate-400">-</span>
                    ) : (
                      <Badge variant="danger">{t('absenGuruPage.tidakAbsen')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    {record.attendance?.jamKeluar ? (
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">{formatTimeWithDot(record.attendance.jamKeluar)}</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-slate-400">-</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {record.attendance?.statusKeluar ? (
                      getStatusBadge(record.attendance.statusKeluar)
                    ) : !record.dateExistsInDb ? (
                      <span className="text-xs sm:text-sm text-slate-400">-</span>
                    ) : (
                      <Badge variant="danger">{t('absenGuruPage.tidakAbsen')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    {getStatusAkhirBadge(statusAkhir, isTodayRecord)}
                  </div>
                  <div className="flex items-center">
                    <div className="max-w-32 truncate text-xs" title={keterangan}>
                      {keterangan}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Calendar Display - Mobile Only */}
            <div className="sm:hidden">
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-0 border-b border-slate-200">
                  {weekDays.map((day, dayIdx) => {
                    const isWeekend = dayIdx === 0 || dayIdx === 6;
                    return (
                      <div
                        key={day}
                        className={`text-center py-2 font-semibold text-xs border-r border-slate-200 last:border-r-0 ${
                          isWeekend
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-slate-700'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0 p-0">
                  {days.map((day, idx) => {
                    const absensiInfo = day ? getDayAbsensiInfo(day) : { attendance: undefined, dateExistsInDb: false };
                    const attendance = absensiInfo.attendance;
                    const dateExistsInDb = absensiInfo.dateExistsInDb;
                    const isToday = day === new Date().getDate() &&
                                   new Date().getMonth() + 1 === selectedMonth &&
                                   new Date().getFullYear() === selectedYear;
                    const dayOfWeek = idx % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    const keterangan = getKeteranganAbsensi(attendance, dateExistsInDb);

                    const getBackgroundColor = () => {
                      if (!day) return 'bg-slate-50';
                      if (isToday) return 'bg-blue-100';

                      // If date doesn't exist in DB, use white background
                      if (keterangan === null) return 'bg-white';

                      if (keterangan === 'Sakit') return 'bg-blue-50';
                      if (keterangan === 'Izin') return 'bg-yellow-50';
                      if (keterangan === 'Alfa' || keterangan === 'Bolos') return 'bg-red-50';
                      if (keterangan === 'Dispen') return 'bg-purple-50';
                      if (keterangan === 'Hadir') return 'bg-emerald-50';

                      if (isWeekend) return 'bg-red-50';
                      return 'bg-white';
                    };

                    const getKeteranganColor = () => {
                      if (keterangan === null) return 'bg-slate-100 text-slate-400';
                      if (keterangan === 'Hadir') return 'bg-emerald-100 text-emerald-700';
                      if (keterangan === 'Izin') return 'bg-yellow-100 text-yellow-700';
                      if (keterangan === 'Sakit') return 'bg-blue-200 text-blue-700';
                      if (keterangan === 'Alfa') return 'bg-red-100 text-red-700';
                      if (keterangan === 'Dispen') return 'bg-purple-100 text-purple-700';
                      if (keterangan === 'Bolos') return 'bg-red-100 text-red-700';
                      return 'bg-slate-100 text-slate-500';
                    };

                    const handleDateClick = () => {
                      if (day) {
                        const dateStr = String(selectedYear).padStart(4, '0') + '-' +
                                        String(selectedMonth).padStart(2, '0') + '-' +
                                        String(day).padStart(2, '0');
                        setSelectedDateDetail(dateStr);
                        setIsDetailModalOpen(true);
                      }
                    };

                    return (
                      <div
                        key={idx}
                        onClick={handleDateClick}
                        className={`aspect-square border border-slate-200 p-1 flex flex-col text-xs ${getBackgroundColor()} ${
                          day ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''
                        }`}
                      >
                        {day && (
                          <>
                            <div className={`font-semibold mb-1 ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                              {day}
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              {keterangan !== null ? (
                                <div className={`px-1.5 py-1 rounded text-[9px] font-semibold uppercase text-center ${getKeteranganColor()}`}>
                                  {keterangan === 'Hadir' ? t('absenGuruPage.hadir') :
                                   keterangan === 'Izin' ? t('absenGuruPage.izin') :
                                   keterangan === 'Sakit' ? t('absenGuruPage.sakit') :
                                   keterangan === 'Alfa' ? t('absenGuruPage.alfa') :
                                   keterangan === 'Dispen' ? t('absenGuruPage.dispen') :
                                   keterangan === 'Bolos' ? t('absenGuruPage.bolos') : keterangan}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-400 text-[9px]">
                                  <span>-</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-600 mb-1">{t('absenGuruPage.tidakAdaDataAbsensi')}</p>
            <p className="text-xs sm:text-sm text-slate-500">{t('absenGuruPage.ubahFilterTanggal')}</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDateDetail && (
        <AbsenGuruDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDateDetail(null);
          }}
          attendance={attendanceRecords.find(r => r.tanggal === selectedDateDetail)?.attendance || undefined}
          selectedDate={selectedDateDetail}
          pengaturanAbsen={undefined}
          getStatusBadge={getStatusBadge}
          formatTimeWithDot={formatTimeWithDot}
          dateLocale={getDateLocale(language)}
        />
      )}
    </div>
  );
};

export default AttendanceHistoryTable;
