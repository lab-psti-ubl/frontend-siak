import React from 'react';
import { Clock, Camera, User, CheckCircle, QrCode } from 'lucide-react';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import { SesiAbsensi, Absensi } from '../../../../types';

interface TodaySessionCardProps {
  sesi: SesiAbsensi;
  mapel: string;
  guru: string;
  waktu: string;
  attendance?: Absensi;
  onScanQR: () => void;
}

const TodaySessionCard: React.FC<TodaySessionCardProps> = ({
  sesi,
  mapel,
  guru,
  waktu,
  attendance,
  onScanQR
}) => {
  return (
    <div className="group relative bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-0.5 p-1.5 rounded-lg bg-blue-100">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                {mapel}
              </h4>
              <div className="flex items-center mt-1.5 text-xs sm:text-sm text-slate-600">
                <User className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="truncate">{guru}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 ml-8">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
              <Clock className="w-3.5 h-3.5" />
              <span>{waktu}</span>
            </div>
            <div className="text-xs text-slate-600">
              Dibuka: {sesi.jamBuka}
              {sesi.jamTutup && ` - Ditutup: ${sesi.jamTutup}`}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end sm:justify-start">
          {attendance ? (
            <div className="flex flex-col items-end sm:items-center gap-1.5">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                attendance.status === 'hadir' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                attendance.status === 'izin' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                attendance.status === 'sakit' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                'bg-red-100 text-red-700 border border-red-200'
              }`}>
                <CheckCircle className="w-3 h-3 mr-1" />
                {attendance.status.toUpperCase()}
              </span>
              <p className="text-xs text-slate-500">
                {new Date(attendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ) : sesi.status === 'dibuka' ? (
            <Button
              onClick={onScanQR}
              className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <QrCode size={16} className="mr-2" />
              <span className="hidden sm:inline">Scan QR</span>
              <span className="sm:hidden">Scan</span>
            </Button>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 opacity-60">
              Sesi Ditutup
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaySessionCard;
