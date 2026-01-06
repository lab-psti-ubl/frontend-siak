import React from 'react';
import { Users, UserCheck, BookOpen, AlertCircle } from 'lucide-react';

interface DataMuridKelasStatsCardsProps {
  muridKelas: any[];
  overallStats: {
    totalHadir: number;
    totalIzin: number;
    totalSakit: number;
    totalAlfa: number;
    totalSesi: number;
  };
  classAttendanceRate: string;
}

const DataMuridKelasStatsCards: React.FC<DataMuridKelasStatsCardsProps> = ({
  muridKelas,
  overallStats,
  classAttendanceRate
}) => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 lg:p-8 hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 rounded-lg p-3 sm:p-4 flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Murid</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{muridKelas.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 lg:p-8 hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-100 rounded-lg p-3 sm:p-4 flex-shrink-0">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Data Hadir</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{classAttendanceRate}%</p>
          </div>
        </div>
      </div>

      

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 lg:p-8 hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 rounded-lg p-3 sm:p-4 flex-shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Alfa</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{overallStats.totalAlfa}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMuridKelasStatsCards;