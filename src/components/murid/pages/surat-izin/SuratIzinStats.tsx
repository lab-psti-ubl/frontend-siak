import React from 'react';
import { Clock, CheckCircle, X } from 'lucide-react';
import Card from '../../../ui/Card';
import { SuratIzin } from '../../../../types';

interface SuratIzinStatsProps {
  mySuratIzin: SuratIzin[];
}

const SuratIzinStats: React.FC<SuratIzinStatsProps> = ({ mySuratIzin }) => {
  const pendingSurat = mySuratIzin.filter(s => s.status === 'menunggu');
  const approvedSurat = mySuratIzin.filter(s => s.status === 'diterima');
  const rejectedSurat = mySuratIzin.filter(s => s.status === 'ditolak');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      <Card className="p-4 sm:p-5 lg:p-6 border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Menunggu Verifikasi</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-0.5">{pendingSurat.length}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 lg:p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Disetujui</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-0.5">{approvedSurat.length}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 lg:p-6 border-l-4 border-l-red-500 hover:shadow-lg transition-shadow duration-200 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Ditolak</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-0.5">{rejectedSurat.length}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SuratIzinStats;
