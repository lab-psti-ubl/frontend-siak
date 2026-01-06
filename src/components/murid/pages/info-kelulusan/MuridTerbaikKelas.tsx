import React from 'react';
import { GraduationCap } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { KelulusanData } from './InfoKelulusanUtils';
import { Kelas } from '../../../../types';

interface MuridTerbaikKelasProps {
  muridTerbaik: KelulusanData[];
  myKelas: Kelas | undefined;
  currentUserId: string | undefined;
}

const MuridTerbaikKelas: React.FC<MuridTerbaikKelasProps> = ({
  muridTerbaik,
  myKelas,
  currentUserId
}) => {
  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Murid Terbaik Kelas {myKelas?.name}</h3>

      {muridTerbaik.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {muridTerbaik.map((data, index) => (
            <div key={data.murid.id} className={`p-3.5 sm:p-6 rounded-lg border-2 ${
              index === 0 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' :
              index === 1 ? 'border-gray-400 bg-gradient-to-r from-gray-50 to-gray-100' :
              'border-orange-400 bg-gradient-to-r from-orange-50 to-red-50'
            } ${data.murid.id === currentUserId ? 'ring-2 ring-blue-500' : ''}`}>
              {/* Mobile Layout */}
              <div className="block sm:hidden relative">
                {/* Top Row: Ranking Badge + Name + Status Badge */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                    'bg-gradient-to-br from-orange-400 to-orange-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 break-words leading-tight mb-1">
                      {data.murid.name}
                      {data.murid.id === currentUserId && (
                        <span className="ml-1.5 text-blue-600 text-xs font-normal">(Anda)</span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-500">NISN: {(data.murid as any).nisn || '-'}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge variant={data.isLulus ? 'success' : 'danger'} size="sm">
                      {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                    </Badge>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white/70 rounded-md p-2.5 border border-white/90">
                    <div className="text-[10px] text-gray-600 mb-1 font-medium">Rata-rata Nilai</div>
                    <div className="text-lg font-bold text-gray-900">{data.nilaiAkhir.toFixed(1)}</div>
                  </div>
                  <div className="bg-white/70 rounded-md p-2.5 border border-white/90">
                    <div className="text-[10px] text-gray-600 mb-1 font-medium">Kehadiran</div>
                    <div className="text-lg font-bold text-gray-900">{data.kehadiran.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                    'bg-gradient-to-br from-orange-400 to-orange-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-bold text-gray-900 break-words">
                      {data.murid.name}
                      {data.murid.id === currentUserId && (
                        <span className="ml-2 text-blue-600 text-sm font-normal">(Anda)</span>
                      )}
                    </h4>
                    <p className="text-base text-gray-600 mt-0.5">NISN: {(data.murid as any).nisn || '-'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {data.nilaiAkhir.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Rata-rata Nilai</div>
                  <div className="text-sm text-gray-600">
                    Kehadiran: {data.kehadiran.toFixed(1)}%
                  </div>
                  <div className="mt-2">
                    <Badge variant={data.isLulus ? 'success' : 'danger'}>
                      {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 text-gray-500">
          <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
          <p className="text-sm sm:text-base">Belum ada data murid</p>
        </div>
      )}
    </Card>
  );
};

export default MuridTerbaikKelas;
