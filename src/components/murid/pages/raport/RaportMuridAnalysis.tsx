import React, { useMemo } from 'react';
import { CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { RaportData } from '../../../../utils/raport';
import { getGradeColor, getNilaiMinimalSettings } from '../../../../utils/nilaiUtils';

interface RaportMuridAnalysisProps {
  raportData: RaportData;
}

const RaportMuridAnalysis: React.FC<RaportMuridAnalysisProps> = ({ raportData }) => {
  const nilaiMinimalSettings = useMemo(() => getNilaiMinimalSettings(), []);
  const nilaiAkhirMinimal = nilaiMinimalSettings.nilaiAkhirMinimal;

  const topSubjects = raportData.subjects
    .filter(s => s.nilaiAkhir !== null && s.nilaiAkhir >= nilaiAkhirMinimal)
    .sort((a, b) => (b.nilaiAkhir || 0) - (a.nilaiAkhir || 0))
    .slice(0, 3);

  const lowSubjects = raportData.subjects
    .filter(s => s.nilaiAkhir !== null && s.nilaiAkhir < nilaiAkhirMinimal)
    .sort((a, b) => (a.nilaiAkhir || 0) - (b.nilaiAkhir || 0))
    .slice(0, 3);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
        <h3 className="text-sm sm:text-lg font-bold text-slate-900">Analisis Prestasi</h3>
        <p className="text-xs text-slate-600 mt-0.5">Evaluasi performa mata pelajaran</p>
      </div>
      <div className="p-3 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h4 className="font-semibold text-slate-900 text-xs sm:text-base">Mata Pelajaran Terbaik</h4>
            </div>
            {topSubjects.length > 0 ? (
              <div className="space-y-2">
                {topSubjects.map((subject, index) => (
                  <div key={subject.mapelId} className="flex items-center justify-between p-2.5 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl border border-emerald-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-5 h-5 sm:w-7 sm:h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] sm:text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="font-medium text-emerald-900 text-xs sm:text-sm truncate">{subject.mapelName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="font-bold text-emerald-700 text-xs sm:text-base">{subject.nilaiAkhir?.toFixed(1)}</span>
                      {subject.grade && (
                        <div className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs p-2.5 sm:p-3 bg-slate-50 rounded-lg">Belum ada nilai yang tersedia</p>
            )}
          </div>

          <div className="space-y-2.5 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h4 className="font-semibold text-slate-900 text-xs sm:text-base">Perlu Perbaikan</h4>
            </div>
            {lowSubjects.length > 0 ? (
              <div className="space-y-2">
                {lowSubjects.map((subject, index) => (
                  <div key={subject.mapelId} className="flex items-center justify-between p-2.5 sm:p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg sm:rounded-xl border border-red-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-5 h-5 sm:w-7 sm:h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] sm:text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="font-medium text-red-900 text-xs sm:text-sm truncate">{subject.mapelName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="font-bold text-red-700 text-xs sm:text-base">{subject.nilaiAkhir?.toFixed(1)}</span>
                      {subject.grade && (
                        <div className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 sm:p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl border border-emerald-100 text-center">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <p className="text-emerald-900 font-semibold text-xs sm:text-base mb-1">Semua nilai sudah baik!</p>
                <p className="text-emerald-700 text-[10px] sm:text-sm">Tidak ada mata pelajaran yang perlu perbaikan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaportMuridAnalysis;