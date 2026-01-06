import React from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import Card from '../../../ui/Card';
import { getGradeColor } from '../../../../utils/nilaiUtils';

interface NilaiMuridStatsProps {
  rata: number;
  totalMapel: number;
  gradeDistribution: Record<string, number>;
}

const NilaiMuridStats: React.FC<NilaiMuridStatsProps> = ({ rata, totalMapel, gradeDistribution }) => {
  return (
    <Card className="shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
        <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></span>
        Ringkasan Prestasi
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-3">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{rata.toFixed(1)}</div>
            <div className="text-sm font-medium text-blue-50">Rata-rata Nilai</div>
          </div>
        </div>

        <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-3">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{totalMapel}</div>
            <div className="text-sm font-medium text-emerald-50">Mata Pelajaran</div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-4 text-center text-base">Distribusi Grade</h4>
          <div className="space-y-2.5">
            {['A', 'B', 'C', 'D', 'E'].map(grade => (
              <div key={grade} className="flex justify-between items-center group hover:bg-white/60 p-2 rounded-lg transition-colors">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${getGradeColor(grade)}`}>
                  Grade {grade}
                </span>
                <span className="text-lg font-bold text-slate-700">{gradeDistribution[grade] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NilaiMuridStats;
