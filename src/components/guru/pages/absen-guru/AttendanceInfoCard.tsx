import React from 'react';
import { CheckCircle2, AlertCircle, Info, Clock } from 'lucide-react';
import { AbsensiGuru, PengaturanAbsen } from '../../../../types';

interface AttendanceInfoCardProps {
  todayAttendance: AbsensiGuru | undefined;
  activePengaturan: PengaturanAbsen | undefined;
}

const AttendanceInfoCard: React.FC<AttendanceInfoCardProps> = ({
  todayAttendance,
  activePengaturan,
}) => {
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

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Informasi Absensi</h3>
            <p className="text-xs sm:text-sm text-blue-100">Panduan dan status kehadiran</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-blue-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-blue-600 rounded-lg p-2 flex-shrink-0 mt-0.5">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-blue-900 uppercase tracking-wide">Cara Absensi</h4>
              <p className="text-xs sm:text-sm text-blue-700 mt-1">Ikuti langkah-langkah berikut</p>
            </div>
          </div>

          <ul className="space-y-2.5 sm:space-y-3">
            <li className="flex items-start gap-3 text-xs sm:text-sm text-blue-800">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2.5 flex-shrink-0"></div>
              <span>Scan QR Code admin untuk absen masuk/keluar</span>
            </li>
            <li className="flex items-start gap-3 text-xs sm:text-sm text-blue-800">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2.5 flex-shrink-0"></div>
              <span>Absen masuk: datang ke sekolah pukul <span className="font-semibold">{activePengaturan?.jamMasuk || '08:00'}</span></span>
            </li>
            <li className="flex items-start gap-3 text-xs sm:text-sm text-blue-800">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2.5 flex-shrink-0"></div>
              <span>Absen keluar: pulang dari sekolah pukul <span className="font-semibold">{activePengaturan?.jamPulang || '16:00'}</span></span>
            </li>
            <li className="flex items-start gap-3 text-xs sm:text-sm text-blue-800">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2.5 flex-shrink-0"></div>
              <span>Sistem otomatis menentukan jenis absensi</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-emerald-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-emerald-600 rounded-lg p-2 flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-900 uppercase tracking-wide">Status Hari Ini</h4>
              <p className="text-xs sm:text-sm text-emerald-700 mt-1">Ringkasan kehadiran Anda</p>
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white/50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-emerald-900">Absen Masuk</span>
              </div>
              {todayAttendance?.jamMasuk ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-emerald-700">{formatTimeWithDot(todayAttendance.jamMasuk)}</span>
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                </div>
              ) : (
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white/50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-emerald-900">Absen Keluar</span>
              </div>
              {todayAttendance?.jamKeluar ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-emerald-700">{formatTimeWithDot(todayAttendance.jamKeluar)}</span>
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                </div>
              ) : (
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceInfoCard;
