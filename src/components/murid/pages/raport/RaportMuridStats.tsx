import React from 'react';
import { BookOpen, Calculator, TrendingUp, Award } from 'lucide-react';
import { RaportData } from '../../../../utils/raport';

interface RaportMuridStatsProps {
  raportData: RaportData;
}

const RaportMuridStats: React.FC<RaportMuridStatsProps> = ({ raportData }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
        <h3 className="text-sm sm:text-lg font-bold text-slate-900">Statistik Raport</h3>
        <p className="text-xs text-slate-600 mt-0.5">Ringkasan performa akademik</p>
      </div>
      <div className="p-3 sm:p-5 lg:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-2.5 sm:p-5 border border-blue-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2 leading-tight">Mata Pelajaran</p>
                <p className="text-lg sm:text-3xl font-bold text-blue-900">{raportData.subjects.length}</p>
                <p className="text-[10px] sm:text-xs text-blue-600 mt-0.5 sm:mt-1">Total mapel</p>
              </div>
              <div className="bg-blue-600 rounded-lg p-1.5 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ml-1">
                <BookOpen className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl p-2.5 sm:p-5 border border-emerald-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 sm:mb-2 leading-tight">Rata-rata Nilai</p>
                <p className="text-lg sm:text-3xl font-bold text-emerald-900">{raportData.overallGrade.toFixed(1)}</p>
                <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1">Nilai akhir</p>
              </div>
              <div className="bg-emerald-600 rounded-lg p-1.5 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ml-1">
                <Calculator className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg sm:rounded-xl p-2.5 sm:p-5 border border-violet-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1 sm:mb-2 leading-tight">Kehadiran</p>
                <p className="text-lg sm:text-3xl font-bold text-violet-900">{raportData.attendanceRate.toFixed(1)}%</p>
                <p className="text-[10px] sm:text-xs text-violet-600 mt-0.5 sm:mt-1">Tingkat hadir</p>
              </div>
              <div className="bg-violet-600 rounded-lg p-1.5 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ml-1">
                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-2.5 sm:p-5 border border-amber-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 sm:mb-2 leading-tight">Grade A</p>
                <p className="text-lg sm:text-3xl font-bold text-amber-900">
                  {raportData.subjects.filter(s => s.grade === 'A').length}
                </p>
                <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5 sm:mt-1">Total grade A</p>
              </div>
              <div className="bg-amber-600 rounded-lg p-1.5 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ml-1">
                <Award className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaportMuridStats;