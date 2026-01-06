import React from 'react';
import Badge from '../../../../../ui/Badge';
import JadwalKelasCard from './JadwalKelasCard';
import { JadwalPelajaran } from '../../../../../../types';
import { hariLabels, isToday } from './JadwalKelasUtils';

interface JadwalKelasDayCardProps {
  hari: string;
  schedules: JadwalPelajaran[];
  getMapelName: (mapelId: string) => string;
  getGuruName: (guruId: string) => string;
  getJadwalStats: (jadwalId: string) => {
    totalSesi: number;
    attendanceRate: number;
  };
  onDetailClick: (jadwal: JadwalPelajaran) => void;
}

const JadwalKelasDayCard: React.FC<JadwalKelasDayCardProps> = ({
  hari,
  schedules,
  getMapelName,
  getGuruName,
  getJadwalStats,
  onDetailClick
}) => {
  const isTodayDay = isToday(hari);

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
      isTodayDay
        ? 'border-blue-300 ring-2 ring-blue-500 ring-opacity-30 shadow-lg hover:shadow-xl'
        : 'border-slate-200 hover:shadow-md'
    }`}>
      <div className={`px-4 sm:px-5 lg:px-6 py-3 sm:py-4 lg:py-5 flex items-center justify-between border-b ${
        isTodayDay ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 capitalize">
            {hariLabels[hari as keyof typeof hariLabels]}
          </h3>
          {isTodayDay && (
            <Badge variant="info" className="bg-blue-600 text-white text-xs font-semibold">
              HARI INI
            </Badge>
          )}
        </div>
        <Badge variant="default" className="text-xs sm:text-sm font-medium">
          {schedules.length} pelajaran
        </Badge>
      </div>

      <div className="p-3 sm:p-4 lg:p-5">
        {schedules.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {schedules.map((jadwal) => {
              const stats = getJadwalStats(jadwal.id);

              return (
                <JadwalKelasCard
                  key={jadwal.id}
                  jadwal={jadwal}
                  getMapelName={getMapelName}
                  getGuruName={getGuruName}
                  stats={stats}
                  onDetailClick={onDetailClick}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-600">Tidak ada jadwal</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Hari ini sedang libur</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JadwalKelasDayCard;
