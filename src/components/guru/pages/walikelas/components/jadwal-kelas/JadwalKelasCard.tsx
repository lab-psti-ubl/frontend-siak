import React from 'react';
import { Users, Clock, Eye, BookOpen, TrendingUp } from 'lucide-react';
import Badge from '../../../../../ui/Badge';
import Button from '../../../../../ui/Button';
import { JadwalPelajaran } from '../../../../../../types';

interface JadwalKelasCardProps {
  jadwal: JadwalPelajaran;
  getMapelName: (mapelId: string) => string;
  getGuruName: (guruId: string) => string;
  stats: {
    totalSesi: number;
    attendanceRate: number;
  };
  onDetailClick: (jadwal: JadwalPelajaran) => void;
}

const JadwalKelasCard: React.FC<JadwalKelasCardProps> = ({
  jadwal,
  getMapelName,
  getGuruName,
  stats,
  onDetailClick
}) => {
  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (rate >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="group relative bg-white border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2.5 mb-2">
            <div className="bg-blue-100 rounded-lg p-1.5 sm:p-2 mt-0.5 flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 line-clamp-2">
                {getMapelName(jadwal.mataPelajaranId)}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 flex items-center gap-1">
                <Users size={13} className="flex-shrink-0" />
                <span className="truncate">{getGuruName(jadwal.guruId)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 text-xs sm:text-sm mb-2.5">
            <Clock className="w-4 h-4 flex-shrink-0 text-blue-500" />
            <span className="font-medium">{jadwal.jamMulai} - {jadwal.jamSelesai}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-medium ${getAttendanceColor(stats.attendanceRate)}`}>
              <TrendingUp size={12} />
              Kehadiran {stats.attendanceRate}%
            </div>
            <Badge variant="default" className="text-xs">
              {stats.totalSesi} sesi
            </Badge>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default JadwalKelasCard;
