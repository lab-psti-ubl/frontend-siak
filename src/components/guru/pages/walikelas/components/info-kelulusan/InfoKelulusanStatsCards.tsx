import React from 'react';
import { Users, CheckCircle, AlertCircle, Award } from 'lucide-react';
import Card from '../../../../../ui/Card';

interface InfoKelulusanStatsCardsProps {
  totalMurid: number;
  muridLulus: number;
  muridTidakLulus: number;
  tingkatKelulusan: number;
}

const InfoKelulusanStatsCards: React.FC<InfoKelulusanStatsCardsProps> = ({
  totalMurid,
  muridLulus,
  muridTidakLulus,
  tingkatKelulusan
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">{totalMurid}</p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Total Murid</p>
            </div>
          </div>
        </div>
      </div>

      <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">{muridLulus}</p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Lulus</p>
            </div>
          </div>
        </div>
      </div>

      <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">{muridTidakLulus}</p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Tidak Lulus</p>
            </div>
          </div>
        </div>
      </div>

      <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">{tingkatKelulusan}%</p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Kelulusan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoKelulusanStatsCards;
