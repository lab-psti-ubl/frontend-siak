import React from 'react';
import { Users, Award } from 'lucide-react';
import Badge from '../../../ui/Badge';
import { Kelas } from '../../../../types';

interface RaportMuridBestStudentsProps {
  statusKenaikan: any;
  statusBagiRaportData: any;
  selectedSemester: number;
  targetKelas: Kelas | null;
  muridTerbaikData: any[];
  currentUserId: string;
}

const RaportMuridBestStudents: React.FC<RaportMuridBestStudentsProps> = ({
  statusKenaikan,
  statusBagiRaportData,
  selectedSemester,
  targetKelas,
  muridTerbaikData,
  currentUserId
}) => {
  // Tampilkan komponen jika ada data murid terbaik, meskipun tidak ada status
  // Untuk periode historis, status mungkin tidak ada, tapi data murid terbaik tetap bisa ditampilkan
  if (!targetKelas || muridTerbaikData.length === 0) {
    return null;
  }

  const isKelas12 = targetKelas?.name.includes('XII') || targetKelas?.name.includes('12');

  const title = selectedSemester === 2 ?
    `Murid Terbaik Kelas ${targetKelas?.name}` :
    `Murid Terbaik Kelas ${targetKelas?.name} - Semester Ganjil`;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 sm:px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Top 3 siswa dengan prestasi terbaik</p>
      </div>
      <div className="p-3 sm:p-5 lg:p-6">
        {muridTerbaikData.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {muridTerbaikData.map((data, index) => (
              <div key={data.murid.id} className={`p-3 sm:p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                index === 0 ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50' :
                index === 1 ? 'border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100' :
                'border-orange-300 bg-gradient-to-r from-orange-50 to-red-50'
              } ${data.murid.id === currentUserId ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Mobile Layout */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg flex-shrink-0 ${
                      index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                      'bg-gradient-to-br from-orange-400 to-red-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {data.murid.name}
                        {data.murid.id === currentUserId && (
                          <span className="ml-1.5 text-blue-600 text-xs">(Anda)</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-600">NISN: {data.murid.nisn}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500 mb-0.5">Rata-rata Nilai</p>
                      <p className="text-lg font-bold text-slate-900">
                        {data.nilaiAkhir.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Kehadiran</p>
                      <p className="text-base font-semibold text-slate-900">
                        {data.kehadiran.toFixed(1)}%
                      </p>
                    </div>
                    {selectedSemester === 2 && (
                      <div className="col-span-2 mt-1">
                        <Badge variant={data.isNaikKelas ? 'success' : 'danger'} className="text-xs">
                          {data.isNaikKelas ? (isKelas12 ? 'LULUS' : 'NAIK KELAS') : (isKelas12 ? 'TIDAK LULUS' : 'TIDAK NAIK KELAS')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop/Tablet Layout */}
                <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 ${
                      index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                      'bg-gradient-to-br from-orange-400 to-red-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg lg:text-xl font-bold text-slate-900 truncate">
                        {data.murid.name}
                        {data.murid.id === currentUserId && (
                          <span className="ml-2 text-blue-600 text-sm">(Anda)</span>
                        )}
                      </h4>
                      <p className="text-sm text-slate-600">NISN: {data.murid.nisn}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {data.nilaiAkhir.toFixed(1)}
                    </div>
                    <div className="text-sm text-slate-600">Rata-rata Nilai</div>
                    <div className="text-sm text-slate-600">
                      Kehadiran: {data.kehadiran.toFixed(1)}%
                    </div>
                    {selectedSemester === 2 && (
                      <Badge variant={data.isNaikKelas ? 'success' : 'danger'} className="mt-2">
                        {data.isNaikKelas ? (isKelas12 ? 'LULUS' : 'NAIK KELAS') : (isKelas12 ? 'TIDAK LULUS' : 'TIDAK NAIK KELAS')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-500">Belum ada data murid</p>
          </div>
        )
      }
      </div>
    </div>
  );
};

export default RaportMuridBestStudents;