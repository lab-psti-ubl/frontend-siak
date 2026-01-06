import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, Camera, UserCheck, Edit, AlertCircle } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { SesiAbsensi } from '../../../../../../types';
import { isSessionExpired, getSessionStats } from './AbsenKelasUtils';
import { usePengaturanAbsen } from '../../../../../../hooks/usePengaturanAbsen';
import { usePengaturanSistem } from '../../../../../../hooks/usePengaturanSistem';
import { useAbsensi } from '../../../../../../hooks/useAbsensi';
import { useMurid } from '../../../../../../hooks/useMurid';

interface AbsenKelasSessionCardProps {
  sessionType: 'masuk' | 'pulang';
  session: SesiAbsensi | undefined;
  kelasId: string;
  selectedDate: string;
  isToday: boolean;
  onOpenSession: (type: 'masuk' | 'pulang') => void;
  onCloseSession: (type: 'masuk' | 'pulang') => void;
  onScanQR: (type: 'masuk' | 'pulang') => void;
  onManualAbsen: (type: 'masuk' | 'pulang') => void;
  onEditAbsen: (type: 'masuk' | 'pulang') => void;
  canOpenPulang?: boolean;
}

const AbsenKelasSessionCard: React.FC<AbsenKelasSessionCardProps> = ({
  sessionType,
  session,
  kelasId,
  selectedDate,
  isToday,
  onOpenSession,
  onCloseSession,
  onScanQR,
  onManualAbsen,
  onEditAbsen,
  canOpenPulang
}) => {
  const { pengaturanAbsen, activePengaturanAbsen } = usePengaturanAbsen();
  const { enableEarlyDeparture } = usePengaturanSistem();
  const { absensi } = useAbsensi({ kelasId, tanggal: selectedDate });
  const { murid } = useMurid({ kelasId, status: 'active' });
  const [isExpired, setIsExpired] = useState(false);

  // Filter murid untuk kelas ini
  const muridKelas = useMemo(() => {
    return murid.filter(m => (m as any).kelasId === kelasId && (m as any).isActive !== false);
  }, [murid, kelasId]);

  // Hitung stats menggunakan hook - menggunakan selectedDate untuk menghitung statistik berdasarkan data absensi yang ada
  const stats = useMemo(() => {
    return getSessionStats(sessionType, session, muridKelas, absensi, selectedDate);
  }, [sessionType, session, muridKelas, absensi, selectedDate]);

  useEffect(() => {
    if (!isToday || session) return;

    const checkExpired = () => {
      const expired = isSessionExpired(sessionType, pengaturanAbsen);
      setIsExpired(expired);
    };

    checkExpired();
    const interval = setInterval(checkExpired, 30000);

    return () => clearInterval(interval);
  }, [isToday, session, sessionType, pengaturanAbsen]);

  const title = sessionType === 'masuk' ? 'Absen Masuk' : 'Absen Pulang';
  const gradientColor = sessionType === 'masuk'
    ? 'from-emerald-600 to-teal-500'
    : 'from-orange-600 to-amber-500';
  const jamAbsen = sessionType === 'masuk' ? activePengaturanAbsen?.jamMasuk : activePengaturanAbsen?.jamPulang;

  const batasMasuk = activePengaturanAbsen
    ? (() => {
        const [jam, menit] = activePengaturanAbsen.jamMasuk.split(':').map(Number);
        const batas = new Date();
        batas.setHours(jam, menit + activePengaturanAbsen.toleransiMasuk, 0);
        return batas.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      })()
    : null;

  const batasPulang = activePengaturanAbsen
    ? (() => {
        const [jam, menit] = activePengaturanAbsen.jamPulang.split(':').map(Number);
        const batas = new Date();
        batas.setHours(jam, menit - activePengaturanAbsen.toleransiPulang, 0);
        return batas.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      })()
    : null;

  const attendancePercent = stats.total > 0 ? (stats.attended / stats.total) * 100 : 0;

  // Calculate waktu aktif untuk absen pulang (jam pulang - 15 menit)
  const waktuAktifPulang = useMemo(() => {
    if (sessionType === 'pulang' && activePengaturanAbsen && !enableEarlyDeparture) {
      const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
      const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
      const batasPulang15Menit = jamPulangMinutes - 15;
      const batasWaktuJam = Math.floor(batasPulang15Menit / 60);
      const batasWaktuMenit = batasPulang15Menit % 60;
      return `${String(batasWaktuJam).padStart(2, '0')}.${String(batasWaktuMenit).padStart(2, '0')}`;
    }
    return null;
  }, [sessionType, activePengaturanAbsen, enableEarlyDeparture]);

  // Get button text for pulang session
  const getButtonText = () => {
    if (!isToday) return 'Tidak Ada Sesi';
    if (sessionType === 'pulang' && !canOpenPulang && !enableEarlyDeparture && waktuAktifPulang) {
      return `Absen Pulang Aktif pada ${waktuAktifPulang}`;
    }
    return `Buka Absen ${title.split(' ')[1]}`;
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className={`bg-gradient-to-r ${gradientColor} px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-b-white border-opacity-20`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-2.5">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">{title}</h3>
              <p className="text-xs sm:text-sm text-white text-opacity-90">
                {session ?
                  `Dibuka: ${session.jamBuka}${session.jamTutup ? ` - Ditutup: ${session.jamTutup}` : ''}` :
                  'Belum dibuka'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={session?.status === 'dibuka' ? 'success' : 'default'}>
              {session?.status === 'dibuka' ? 'Aktif' : session ? 'Ditutup' : 'Belum'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Kehadiran Kelas</span>
            <span className="text-sm sm:text-base font-bold text-slate-900">{stats.attended}/{stats.total} ({Math.round(attendancePercent)}%)</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 sm:h-4 overflow-hidden flex">
            {stats.total > 0 ? (
              <>
                {/* Hadir - Hijau */}
                {stats.hadir > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out"
                    style={{ width: `${(stats.hadir / stats.total) * 100}%` }}
                    title={`Hadir: ${stats.hadir}`}
                  />
                )}
                {/* Izin - Orange */}
                {stats.izin > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out"
                    style={{ width: `${(stats.izin / stats.total) * 100}%` }}
                    title={`Izin: ${stats.izin}`}
                  />
                )}
                {/* Sakit - Biru */}
                {stats.sakit > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${(stats.sakit / stats.total) * 100}%` }}
                    title={`Sakit: ${stats.sakit}`}
                  />
                )}
                {/* Alfa - Merah */}
                {stats.alfa > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 ease-out"
                    style={{ width: `${(stats.alfa / stats.total) * 100}%` }}
                    title={`Alfa: ${stats.alfa}`}
                  />
                )}
              </>
            ) : (
              <div className="h-full w-full bg-slate-300" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-lg p-3 sm:p-4 bg-emerald-50 border border-emerald-200 text-center hover:bg-emerald-100 transition-colors duration-200">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600">{stats.hadir}</div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-700 mt-1 uppercase tracking-wide">Hadir</div>
          </div>
          <div className="rounded-lg p-3 sm:p-4 bg-amber-50 border border-amber-200 text-center hover:bg-amber-100 transition-colors duration-200">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600">{stats.izin}</div>
            <div className="text-xs sm:text-sm font-semibold text-amber-700 mt-1 uppercase tracking-wide">Izin</div>
          </div>
          <div className="rounded-lg p-3 sm:p-4 bg-blue-50 border border-blue-200 text-center hover:bg-blue-100 transition-colors duration-200">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.sakit}</div>
            <div className="text-xs sm:text-sm font-semibold text-blue-700 mt-1 uppercase tracking-wide">Sakit</div>
          </div>
          <div className="rounded-lg p-3 sm:p-4 bg-red-50 border border-red-200 text-center hover:bg-red-100 transition-colors duration-200">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{stats.alfa}</div>
            <div className="text-xs sm:text-sm font-semibold text-red-700 mt-1 uppercase tracking-wide">Alfa</div>
          </div>
        </div>

        {jamAbsen && (
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">{jamAbsen}</p>
                <p className="text-xs text-blue-700">
                  {sessionType === 'masuk' ? (
                    `Terlambat setelah ${batasMasuk}`
                  ) : (
                    `Pulang cepat sebelum ${batasPulang}`
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 sm:pt-3 border-t border-slate-200 space-y-2 sm:space-y-3">
          {!session && isExpired ? (
            <>
              <div className="text-center py-4 sm:py-6">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-amber-500" />
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Waktu absen telah lewat 15 menit</p>
              </div>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => onEditAbsen(sessionType)}
                className="justify-center flex items-center text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <Edit size={16} className="mr-1.5 sm:mr-2" />
                Edit Absen
              </Button>
            </>
          ) : !session ? (
            <Button
              fullWidth
              onClick={() => onOpenSession(sessionType)}
              disabled={!isToday || (sessionType === 'pulang' && !canOpenPulang)}
              className="justify-center flex items-center text-xs sm:text-sm py-2.5 sm:py-3"
              title={sessionType === 'pulang' && !canOpenPulang && !enableEarlyDeparture && waktuAktifPulang 
                ? `Absen pulang hanya dapat dibuka mulai ${waktuAktifPulang}` 
                : sessionType === 'pulang' && !canOpenPulang 
                  ? 'Buka absen masuk terlebih dahulu atau tunggu 15 menit' 
                  : ''}
            >
              <Clock size={16} className="mr-1.5 sm:mr-2" />
              {getButtonText()}
            </Button>
          ) : session.status === 'dibuka' && isToday ? (
            <>
              <Button
                fullWidth
                onClick={() => onScanQR(sessionType)}
                className="justify-center flex items-center text-xs sm:text-sm py-2.5 sm:py-3"
              >
                <Camera size={16} className="mr-1.5 sm:mr-2" />
                Scan QR Murid
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => onManualAbsen(sessionType)}
                className="justify-center flex items-center text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <UserCheck size={16} className="mr-1.5 sm:mr-2" />
                Absen Manual
              </Button>
              <Button
                fullWidth
                variant="danger"
                onClick={() => onCloseSession(sessionType)}
                className="justify-center flex items-center text-xs sm:text-sm py-2 sm:py-2.5"
              >
                Tutup Absen {title.split(' ')[1]}
              </Button>
            </>
          ) : session.status === 'dibuka' && !isToday ? (
            <div className="text-center py-4 sm:py-6">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-blue-400" />
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Sesi masih aktif (hari lain)</p>
            </div>
          ) : (
            <>
              <div className="text-center py-4 sm:py-6">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-slate-400" />
                <p className="text-xs sm:text-sm font-semibold text-slate-600">Sesi sudah ditutup</p>
              </div>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => onEditAbsen(sessionType)}
                className="justify-center flex items-center text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <Edit size={16} className="mr-1.5 sm:mr-2" />
                Edit Absen
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbsenKelasSessionCard;