import React from 'react';
import { Calculator, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import Card from '../../../../../ui/Card';
import { getGradeColor } from '../../../../../../utils/nilaiUtils';

interface NilaiKelasStatsProps {
  mapelName: string;
  stats: {
    rata: number;
    tertinggi: number;
    terendah: number;
    gradeDistribution: Record<string, number>;
  };
}

const NilaiKelasStats: React.FC<NilaiKelasStatsProps> = ({ mapelName, stats }) => {
  return (
    <Card>
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-5 sm:mb-6">
        Statistik Nilai - {mapelName}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl border border-blue-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Rata-rata</span>
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">
            {stats.rata.toFixed(1)}
          </div>
          <p className="text-xs sm:text-sm text-blue-700 mt-1">Prestasi Kelas</p>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl border border-emerald-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Tertinggi</span>
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600">
            {stats.tertinggi.toFixed(1)}
          </div>
          <p className="text-xs sm:text-sm text-emerald-700 mt-1">Nilai Puncak</p>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl border border-orange-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Terendah</span>
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600">
            {stats.terendah.toFixed(1)}
          </div>
          <p className="text-xs sm:text-sm text-orange-700 mt-1">Perlu Perhatian</p>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg sm:rounded-xl border border-slate-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Distribusi</span>
          </div>
          <div className="space-y-2">
            {['A', 'B', 'C', 'D', 'E'].map(grade => (
              <div key={grade} className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{grade}</span>
                <span className="font-bold text-slate-900">{stats.gradeDistribution[grade] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NilaiKelasStats;
