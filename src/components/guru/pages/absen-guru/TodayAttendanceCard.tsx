import React from 'react';
import { Camera, QrCode, Download, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../../../ui/Button';
import { AbsensiGuru } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';

interface TodayAttendanceCardProps {
  todayAttendance: AbsensiGuru | undefined;
  onScanQR: () => void;
  onShowMyQR: () => void;
  onDownloadQR: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  isOnLeaveOrSick?: boolean;
  enableManualAbsen?: boolean;
}

const TodayAttendanceCard: React.FC<TodayAttendanceCardProps> = ({
  todayAttendance,
  onScanQR,
  onShowMyQR,
  onDownloadQR,
  getStatusBadge,
  isOnLeaveOrSick = false,
  enableManualAbsen = true,
}) => {
  const { t } = useLanguage();
  const isBothCheckIn = !!(todayAttendance?.jamMasuk && todayAttendance?.jamKeluar);

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

  // Helper: dapatkan display text dan style untuk card berdasarkan status
  const getStatusDisplay = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    if (s === 'alfa') return { text: 'ALFA', isStatus: true };
    if (s === 'sakit') return { text: 'SAKIT', isStatus: true };
    if (s === 'izin') return { text: 'IZIN', isStatus: true };
    return { text: '', isStatus: false };
  };

  const getCardStyles = (status: string | undefined, hasTime: boolean) => {
    const s = (status || '').toLowerCase();
    if (s === 'alfa') return { card: 'bg-red-50 border-red-200', icon: 'bg-red-600', text: 'text-red-900' };
    if (s === 'sakit') return { card: 'bg-blue-50 border-blue-200', icon: 'bg-blue-600', text: 'text-blue-900' };
    if (s === 'izin') return { card: 'bg-amber-50 border-amber-200', icon: 'bg-amber-600', text: 'text-amber-900' };
    if (hasTime) return { card: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-600', text: 'text-slate-900' };
    return { card: 'bg-slate-50 border-slate-200 hover:border-slate-300', icon: 'bg-slate-300', text: 'text-slate-900' };
  };

  const statusMasukDisplay = getStatusDisplay(todayAttendance?.statusMasuk);
  const statusKeluarDisplay = getStatusDisplay(todayAttendance?.statusKeluar);
  const stylesMasuk = getCardStyles(todayAttendance?.statusMasuk, !!todayAttendance?.jamMasuk);
  const stylesKeluar = getCardStyles(todayAttendance?.statusKeluar, !!todayAttendance?.jamKeluar);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">{t('absenGuruPage.absensiHariIni')}</h3>
            <p className="text-xs sm:text-sm text-blue-100">{t('absenGuruPage.statusKehadiranAnda')}</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {isOnLeaveOrSick && (
          <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-amber-900">{t('absenGuruPage.sedangIzinSakit')}</p>
                <p className="text-xs text-amber-700 mt-0.5">{t('absenGuruPage.andaTidakPerluMelakukanAbsensi')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Card Absen Masuk */}
          <div className={`group rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 transition-all duration-200 ${stylesMasuk.card}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`rounded-lg p-2.5 flex-shrink-0 ${stylesMasuk.icon}`}>
                {statusMasukDisplay.isStatus ? (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : todayAttendance?.jamMasuk ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">{t('absenGuruPage.absenMasuk')}</p>
                {todayAttendance?.jamMasuk && !statusMasukDisplay.isStatus && (
                  <p className="text-xs sm:text-xs text-slate-500 mt-0.5">{t('absenGuruPage.selesai')}</p>
                )}
                {statusMasukDisplay.isStatus && (
                  <p className={`text-xs sm:text-xs mt-0.5 ${stylesMasuk.text}`}>{statusMasukDisplay.text}</p>
                )}
              </div>
            </div>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 ${stylesMasuk.text}`}>
              {statusMasukDisplay.isStatus
                ? statusMasukDisplay.text
                : formatTimeWithDot(todayAttendance?.jamMasuk)}
            </p>
            {todayAttendance?.jamMasuk && !statusMasukDisplay.isStatus && (
              <div className="mt-2">
                {getStatusBadge(todayAttendance.statusMasuk)}
              </div>
            )}
            {statusMasukDisplay.isStatus && (
              <div className="mt-2">
                {getStatusBadge(todayAttendance?.statusMasuk || '')}
              </div>
            )}
          </div>

          {/* Card Absen Keluar */}
          <div className={`group rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 transition-all duration-200 ${stylesKeluar.card}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`rounded-lg p-2.5 flex-shrink-0 ${stylesKeluar.icon}`}>
                {statusKeluarDisplay.isStatus ? (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : todayAttendance?.jamKeluar ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">{t('absenGuruPage.absenKeluar')}</p>
                {todayAttendance?.jamKeluar && !statusKeluarDisplay.isStatus && (
                  <p className="text-xs sm:text-xs text-slate-500 mt-0.5">{t('absenGuruPage.selesai')}</p>
                )}
                {statusKeluarDisplay.isStatus && (
                  <p className={`text-xs sm:text-xs mt-0.5 ${stylesKeluar.text}`}>
                    {statusKeluarDisplay.text === 'ALFA' ? t('absenGuruPage.tidakAbsen') : statusKeluarDisplay.text}
                  </p>
                )}
              </div>
            </div>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 ${stylesKeluar.text}`}>
              {statusKeluarDisplay.isStatus
                ? statusKeluarDisplay.text
                : formatTimeWithDot(todayAttendance?.jamKeluar)}
            </p>
            {statusKeluarDisplay.isStatus ? (
              <div className="mt-2">
                {getStatusBadge(todayAttendance?.statusKeluar || '')}
              </div>
            ) : todayAttendance?.jamKeluar && (
              <div className="mt-2">
                {getStatusBadge(todayAttendance.statusKeluar)}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 sm:pt-3 border-t border-slate-200">
          <div className="space-y-2 sm:space-y-3">
            {enableManualAbsen && (
              <Button
                fullWidth
                onClick={onScanQR}
                disabled={isOnLeaveOrSick || isBothCheckIn}
                className="justify-center flex items-center text-xs sm:text-sm py-2.5 sm:py-3"
              >
                <Camera size={16} className="mr-2" />
                {isOnLeaveOrSick
                  ? t('absenGuruPage.sedangIzinSakit')
                  : !todayAttendance?.jamMasuk
                  ? t('absenGuruPage.scanQRAbsenMasuk')
                  : !todayAttendance?.jamKeluar
                  ? t('absenGuruPage.scanQRAbsenKeluar')
                  : t('absenGuruPage.absensiLengkap')}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button
                variant="secondary"
                onClick={onShowMyQR}
                fullWidth
                className="justify-center flex items-center text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <QrCode size={16} className="mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{t('absenGuruPage.qRSaya')}</span>
                <span className="sm:hidden">QR</span>
              </Button>
              <Button
                variant="secondary"
                onClick={onDownloadQR}
                fullWidth
                className="justify-center flex items-center text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <Download size={16} className="mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{t('absenGuruPage.download')}</span>
                <span className="sm:hidden">DL</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayAttendanceCard;
