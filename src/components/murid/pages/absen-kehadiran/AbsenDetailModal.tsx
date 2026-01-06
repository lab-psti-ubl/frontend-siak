import React from 'react';
import { X, Clock, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { Absensi, PengaturanAbsen } from '../../../../types';
import { getAbsenMasukStatus, getAbsenPulangStatus } from './absenKehadiranIntegratedUtils';

interface AbsenDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  masuk?: Absensi;
  pulang?: Absensi;
  selectedDate: string;
  pengaturanAbsen?: PengaturanAbsen;
}

const AbsenDetailModal: React.FC<AbsenDetailModalProps> = ({
  isOpen,
  onClose,
  masuk,
  pulang,
  selectedDate,
  pengaturanAbsen,
}) => {
  if (!isOpen) return null;

  const date = new Date(selectedDate);
  const formattedDate = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getMasukStatus = () => {
    if (!masuk) return null;
    if (masuk.status === 'izin' || masuk.status === 'sakit' || masuk.status === 'alfa') {
      return masuk.status;
    }
    const status = getAbsenMasukStatus(
      new Date(masuk.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      pengaturanAbsen
    );
    return status === 'hadir' ? 'Tepat Waktu' : 'Terlambat';
  };

  const getPulangStatus = () => {
    if (!pulang) return null;
    if (pulang.status === 'izin' || pulang.status === 'sakit' || pulang.status === 'alfa') {
      return pulang.status;
    }
    const status = getAbsenPulangStatus(
      new Date(pulang.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      pengaturanAbsen
    );
    return status === 'hadir' ? 'Tepat Waktu' : 'Pulang Cepat';
  };

  const masukTime = masuk
    ? new Date(masuk.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '-';

  const pulangTime = pulang
    ? new Date(pulang.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '-';

  const masukStatus = getMasukStatus();
  const pulangStatus = getPulangStatus();

  const getMasukStatusColor = () => {
    if (!masuk) return 'text-slate-500';
    if (masuk.status === 'izin') return 'text-blue-600';
    if (masuk.status === 'sakit') return 'text-orange-600';
    if (masuk.status === 'alfa') return 'text-red-600';
    return masukStatus === 'Tepat Waktu' ? 'text-emerald-600' : 'text-yellow-600';
  };

  const getPulangStatusColor = () => {
    if (!pulang) return 'text-slate-500';
    if (pulang.status === 'izin') return 'text-blue-600';
    if (pulang.status === 'sakit') return 'text-orange-600';
    if (pulang.status === 'alfa') return 'text-red-600';
    return pulangStatus === 'Tepat Waktu' ? 'text-emerald-600' : 'text-yellow-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Detail Absen</h2>
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
              {masuk ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold mb-1">Waktu</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">{masukTime}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold mb-1">Status</p>
                      <p className={`text-xs sm:text-sm font-bold uppercase ${getMasukStatusColor()} break-words`}>
                        {masukStatus}
                      </p>
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
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Absen Pulang</h3>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
              {pulang ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold mb-1">Waktu</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">{pulangTime}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold mb-1">Status</p>
                      <p className={`text-xs sm:text-sm font-bold uppercase ${getPulangStatusColor()} break-words`}>
                        {pulangStatus}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Belum melakukan absen pulang</p>
                </div>
              )}
            </div>
          </div>
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

export default AbsenDetailModal;
