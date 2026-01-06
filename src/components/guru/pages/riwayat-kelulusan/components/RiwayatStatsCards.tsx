import React from 'react';
import { GraduationCap, CheckCircle, AlertCircle, Award } from 'lucide-react';
import Card from '../../../../ui/Card';

interface RiwayatStatsCardsProps {
  totalKelas: number;
  totalMuridLulus: number;
  totalMuridTidakLulus: number;
  tingkatKelulusan: string;
}

const RiwayatStatsCards: React.FC<RiwayatStatsCardsProps> = ({
  totalKelas,
  totalMuridLulus,
  totalMuridTidakLulus,
  tingkatKelulusan
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <Card className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:justify-start">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Kelas</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{totalKelas}</p>
              <p className="text-xs text-slate-500 mt-1">Dibimbing</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:justify-start">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm ml-2 text-slate-600">Murid Lulus</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{totalMuridLulus}</p>
              <p className="text-xs text-slate-500 mt-1">Kelulusan</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:justify-start">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-red-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm ml-2 text-slate-600">Tidak Lulus</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{totalMuridTidakLulus}</p>
              <p className="text-xs text-slate-500 mt-1">Murid</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:justify-start">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-600 shadow-md group-hover:scale-110 transition-transform duration-200">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm ml-2 text-slate-600">Tingkat</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{tingkatKelulusan}%</p>
              <p className="text-xs text-slate-500 mt-1">Kelulusan</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RiwayatStatsCards;
