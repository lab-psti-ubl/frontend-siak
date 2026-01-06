import React from 'react';
import { Users, School } from 'lucide-react';
import Card from '../../../../ui/Card';
import { User, Kelas } from '../../../../../types';

interface MuridStatsCardsProps {
  muridKelas: User[];
  activeMuridCount: number;
  currentKelas: Kelas | undefined;
}

const MuridStatsCards: React.FC<MuridStatsCardsProps> = ({
  muridKelas,
  activeMuridCount,
  currentKelas
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Murid</p>
            <p className="text-3xl font-bold text-gray-900">{muridKelas.length}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Murid Aktif</p>
            <p className="text-3xl font-bold text-gray-900">{activeMuridCount}</p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-full">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-l-4 border-l-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Tingkat Kelas</p>
            <p className="text-3xl font-bold text-gray-900">{currentKelas?.tingkat}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <School className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MuridStatsCards;