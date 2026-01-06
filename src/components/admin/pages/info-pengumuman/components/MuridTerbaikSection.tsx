import React from 'react';
import { GraduationCap, Users, Award } from 'lucide-react';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { getGraduationKelasTextSync } from '../../../../../utils/jenjangPendidikanUtils';

interface MuridTerbaikSectionProps {
  muridTerbaik: any[];
}

const MuridTerbaikSection: React.FC<MuridTerbaikSectionProps> = ({ muridTerbaik }) => {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 sm:px-6 lg:px-8 py-4 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Murid Terbaik Sekolah</h3>
            <p className="text-xs sm:text-sm text-blue-100">Top 3 dengan rata-rata nilai tertinggi</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        {muridTerbaik.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {muridTerbaik.map((data, index) => (
              <div
                key={data.murid.id}
                className={`group relative rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 border transition-all duration-200 hover:shadow-md ${
                  index === 0
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
                    : index === 1
                      ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
                      : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0 shadow-md ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : index === 1
                            ? 'bg-gradient-to-br from-slate-400 to-slate-600'
                            : 'bg-gradient-to-br from-orange-400 to-orange-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                        {data.murid.name}
                      </h4>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                        <span className="text-xs sm:text-sm text-slate-600 font-mono bg-white bg-opacity-60 px-2 py-1 rounded">
                          {data.murid.nisn}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-600 px-2 py-1 rounded bg-white bg-opacity-60">
                          {data.kelas?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 w-full sm:w-auto">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                      {data.nilaiAkhir.toFixed(1)}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 mb-2">Rata-rata Nilai</p>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs sm:text-sm text-slate-600">
                        Kehadiran: <span className="font-semibold text-slate-900">{data.kehadiran.toFixed(1)}%</span>
                      </p>
                      <Badge variant={data.isLulus ? 'success' : 'danger'} className="text-xs sm:text-sm w-fit">
                        {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-10">
            <GraduationCap className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 text-slate-300" />
            <p className="text-sm sm:text-base text-slate-500 font-medium">Belum ada data murid {getGraduationKelasTextSync()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MuridTerbaikSection;