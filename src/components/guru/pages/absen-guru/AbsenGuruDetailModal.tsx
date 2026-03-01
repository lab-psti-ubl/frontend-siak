import React from 'react';
import { X, Clock, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { AbsensiGuru, PengaturanAbsen } from '../../../../types';

interface AbsenGuruDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: AbsensiGuru | undefined;
  selectedDate: string;
  pengaturanAbsen?: PengaturanAbsen;
  getStatusBadge: (status: string) => React.ReactNode;
  formatTimeWithDot: (timeString: string | undefined) => string;
  /** Locale for date display (e.g. 'id-ID' or 'ms-MY') */
  dateLocale?: string;
}

const AbsenGuruDetailModal: React.FC<AbsenGuruDetailModalProps> = ({
  isOpen,
  onClose,
  attendance,
  selectedDate,
  pengaturanAbsen,
  getStatusBadge,
  formatTimeWithDot,
  dateLocale = 'id-ID',
}) => {
  if (!isOpen) return null;

  const date = new Date(selectedDate);
  const formattedDate = date.toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const masukTime = attendance?.jamMasuk ? formatTimeWithDot(attendance.jamMasuk) : '-';
  const pulangTime = attendance?.jamKeluar ? formatTimeWithDot(attendance.jamKeluar) : '-';

  const getMasukStatus = () => {
    if (!attendance?.statusMasuk) return null;
    if (attendance.statusMasuk === 'izin' || attendance.statusMasuk === 'sakit' || attendance.statusMasuk === 'alfa') {
      return attendance.statusMasuk.charAt(0).toUpperCase() + attendance.statusMasuk.slice(1);
    }
    if (attendance.statusMasuk === 'terlambat') return 'Terlambat';
    return 'Tepat Waktu';
  };

  const getPulangStatus = () => {
    if (!attendance?.statusKeluar) return null;
    if (attendance.statusKeluar === 'izin' || attendance.statusKeluar === 'sakit' || attendance.statusKeluar === 'alfa') {
      return attendance.statusKeluar.charAt(0).toUpperCase() + attendance.statusKeluar.slice(1);
    }
    if (attendance.statusKeluar === 'pulang_awal') return 'Pulang Cepat';
    return 'Tepat Waktu';
  };

  const masukStatus = getMasukStatus();
  const pulangStatus = getPulangStatus();

  const getMasukStatusColor = () => {
    if (!attendance?.statusMasuk) return 'text-slate-500';
    if (attendance.statusMasuk === 'izin') return 'text-yellow-600';
    if (attendance.statusMasuk === 'sakit') return 'text-blue-600';
    if (attendance.statusMasuk === 'alfa') return 'text-red-600';
    return masukStatus === 'Tepat Waktu' ? 'text-emerald-600' : 'text-yellow-600';
  };

  const getPulangStatusColor = () => {
    if (!attendance?.statusKeluar) return 'text-slate-500';
    if (attendance.statusKeluar === 'izin') return 'text-yellow-600';
    if (attendance.statusKeluar === 'sakit') return 'text-blue-600';
    if (attendance.statusKeluar === 'alfa') return 'text-red-600';
    return pulangStatus === 'Tepat Waktu' ? 'text-emerald-600' : 'text-yellow-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Detail Absensi</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-blue-100 leading-tight">{formattedDate}</p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Masuk Section */}
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="bg-emerald-100 rounded-lg p-1.5 sm:p-2">
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Absen Masuk</h3>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
              {attendance?.jamMasuk || attendance?.statusMasuk ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold mb-1">Waktu</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">{masukTime}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold mb-1">Status</p>
                      
                      {masukStatus && (
                        <p className={`text-xs sm:text-sm font-bold uppercase ${getMasukStatusColor()} break-words`}>
                          {masukStatus}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Belum melakukan absen masuk</p>
                </div>
              )}
            </div>
          </div>

          {/* Pulang Section */}
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="bg-amber-100 rounded-lg p-1.5 sm:p-2">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Absen Keluar</h3>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
              {attendance?.jamKeluar || attendance?.statusKeluar ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold mb-1">Waktu</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">{pulangTime}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold mb-1">Status</p>
                      
                      {pulangStatus && (
                        <p className={`text-xs sm:text-sm font-bold uppercase ${getPulangStatusColor()} break-words`}>
                          {pulangStatus}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Belum melakukan absen keluar</p>
                </div>
              )}
            </div>
          </div>

          {/* Keterangan Section */}
          {attendance?.keterangan && (
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="bg-blue-100 rounded-lg p-1.5 sm:p-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Keterangan</h3>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
                <p className="text-xs sm:text-sm text-slate-700">{attendance.keterangan}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-2.5 text-sm sm:text-base rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbsenGuruDetailModal;

