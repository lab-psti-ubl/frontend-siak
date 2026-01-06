import React from 'react';
import { Users, CheckCircle, AlertCircle, Award } from 'lucide-react';
import Card from '../../../../ui/Card';
import { User } from '../../../../../types';

interface KelulusanStatsCardsProps {
  muridKelas12: User[];
  muridLulus: any[];
  muridTidakLulus: any[];
}

const KelulusanStatsCards: React.FC<KelulusanStatsCardsProps> = ({
  muridKelas12,
  muridLulus,
  muridTidakLulus
}) => {
  const tingkatKelulusan = muridKelas12.length > 0 ?
    ((muridLulus.length / muridKelas12.length) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Murid</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{muridKelas12.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm ml-2 text-slate-600">Lulus</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{muridLulus.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-red-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm ml-2 text-slate-600">Tidak Lulus</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{muridTidakLulus.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm ml-2 text-slate-600">Tingkat</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{tingkatKelulusan}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KelulusanStatsCards;