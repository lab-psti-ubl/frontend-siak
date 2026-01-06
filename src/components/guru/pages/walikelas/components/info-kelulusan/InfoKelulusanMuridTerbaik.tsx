import React from 'react';
import { GraduationCap, Award } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Badge from '../../../../../ui/Badge';
import { KelulusanDataItem } from './InfoKelulusanUtils';

interface InfoKelulusanMuridTerbaikProps {
  muridTerbaik: KelulusanDataItem[];
  kelasName?: string;
}

const InfoKelulusanMuridTerbaik: React.FC<InfoKelulusanMuridTerbaikProps> = ({ muridTerbaik, kelasName }) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 sm:px-6 py-4 border-b border-teal-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Murid Terbaik</h3>
            <p className="text-xs sm:text-sm text-teal-100 mt-0.5">Kelas {kelasName}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        {muridTerbaik.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {muridTerbaik.map((data, index) => (
              <div
                key={data.murid.id}
                className={`p-4 sm:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                  index === 0
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 hover:shadow-md'
                    : index === 1
                    ? 'border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50 hover:shadow-md'
                    : 'border-orange-300 bg-gradient-to-br from-orange-50 to-rose-50 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg text-white ${
                        index === 0
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-600 shadow-md'
                          : index === 1
                          ? 'bg-gradient-to-br from-slate-400 to-gray-600 shadow-md'
                          : 'bg-gradient-to-br from-orange-400 to-rose-600 shadow-md'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">{data.murid.name}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">NISN: {data.murid.nisn}</p>
                    </div>
                  </div>
                  <div className="text-right sm:text-left sm:ml-auto">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{data.nilaiAkhir.toFixed(1)}</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Rata-rata Nilai</p>
                    <p className="text-xs sm:text-sm text-slate-600">Kehadiran: {data.kehadiran.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-10">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm sm:text-base text-slate-600">Belum ada data murid</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoKelulusanMuridTerbaik;
