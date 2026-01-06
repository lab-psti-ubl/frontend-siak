import React from 'react';
import { Users, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import Card from '../../../../../ui/Card';

interface MuridKelasStatsCardsProps {
  muridCount: number;
  classAttendanceRate: string;
  sesiCount: number;
  totalAlfa: number;
}

const MuridKelasStatsCards: React.FC<MuridKelasStatsCardsProps> = ({
  muridCount,
  classAttendanceRate,
  sesiCount,
  totalAlfa
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-500">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Murid</p>
            <p className="text-2xl font-bold text-gray-900">{muridCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-emerald-500">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Tingkat Kehadiran</p>
            <p className="text-2xl font-bold text-gray-900">{classAttendanceRate}%</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-orange-500">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Sesi</p>
            <p className="text-2xl font-bold text-gray-900">{sesiCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-red-500">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Alfa</p>
            <p className="text-2xl font-bold text-gray-900">{totalAlfa}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MuridKelasStatsCards;
