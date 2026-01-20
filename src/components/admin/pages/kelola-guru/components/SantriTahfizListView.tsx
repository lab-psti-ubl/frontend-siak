import React from 'react';
import Card from '../../../../ui/Card';
import { User as UserIcon } from 'lucide-react';
import { User } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../../hooks/useSantri';

interface SantriTahfizListViewProps {
  kelasId: string;
  kelasTahfiz: TahfizClass[];
}

const SantriTahfizListView: React.FC<SantriTahfizListViewProps> = ({ 
  kelasId, 
  kelasTahfiz 
}) => {
  const { santri } = useSantri();
  const kelasData = kelasTahfiz.find(k => k.id === kelasId);

  const santriList = React.useMemo(() => {
    if (!kelasData) return [];
    return santri.filter(s => kelasData.santriIds.includes(s.id));
  }, [kelasData, santri]);

  if (santriList.length === 0) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 flex items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
              <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{kelasData?.namaKelas}</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Belum ada santri terdaftar</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tidak ada santri</h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center">
              Belum ada santri yang terdaftar di kelas tahfiz ini
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 flex items-center gap-4 sm:gap-6">
          <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
            <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{kelasData?.namaKelas}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{santriList.length} santri terdaftar</p>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
              <tr>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">NISN</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {santriList.map((santriItem, index) => (
                <tr key={santriItem.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-xs sm:text-sm">
                          {santriItem.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{santriItem.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className="text-xs sm:text-sm text-slate-900">
                      {(santriItem as any).nisn || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {santriList.map((santriItem, index) => (
          <div key={santriItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {santriItem.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{santriItem.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    NISN: {(santriItem as any).nisn || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">#{index + 1}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SantriTahfizListView;

