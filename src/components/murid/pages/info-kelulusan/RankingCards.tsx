import React from 'react';
import { School, TrendingUp } from 'lucide-react';
import Card from '../../../ui/Card';
import { getGraduationKelasTextSync } from '../../../../utils/jenjangPendidikanUtils';

interface RankingCardsProps {
  myRanking: number;
  totalKelas: number;
  mySchoolRanking: number;
  totalSekolah: number;
}

const RankingCards: React.FC<RankingCardsProps> = ({
  myRanking,
  totalKelas,
  mySchoolRanking,
  totalSekolah
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-6 mb-4 sm:mb-6">
      <Card className="p-3 sm:p-6 text-center border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col items-center justify-center">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
            <School className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <p className="text-3xl sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1 leading-none">{myRanking}</p>
          <p className="text-[10px] sm:text-sm text-gray-600 font-semibold mb-0.5 sm:mb-1 leading-tight">Peringkat di Kelas</p>
          <p className="text-[9px] sm:text-xs text-gray-500 leading-tight">dari {totalKelas} murid</p>
        </div>
      </Card>

      <Card className="p-3 sm:p-6 text-center border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col items-center justify-center">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <p className="text-3xl sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1 leading-none">{mySchoolRanking}</p>
          <p className="text-[10px] sm:text-sm text-gray-600 font-semibold mb-0.5 sm:mb-1 leading-tight">Peringkat di Sekolah</p>
          <p className="text-[9px] sm:text-xs text-gray-500 leading-tight">dari {totalSekolah} murid {getGraduationKelasTextSync()}</p>
        </div>
      </Card>
    </div>
  );
};

export default RankingCards;
