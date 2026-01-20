import React, { useMemo } from 'react';
import Card from '../../../../../ui/Card';
import { User as UserIcon, Phone, Users } from 'lucide-react';
import { User } from '../../../../../../types';
import { TahfizClass } from '../../../../../../hooks/useKelasTahfiz';

interface SantriTahfizListViewProps {
  kelasId: string;
  santri: User[];
  kelasTahfiz: TahfizClass[];
}

const SantriTahfizListView: React.FC<SantriTahfizListViewProps> = ({ kelasId, santri, kelasTahfiz }) => {
  const kelasData = kelasTahfiz.find(k => k.id === kelasId);

  // Get santri list for this class
  const santriList = useMemo(() => {
    if (!kelasData) return [];
    return kelasData.santriIds
      .map(id => santri.find(s => s.id === id))
      .filter(Boolean) as User[];
  }, [kelasData, santri]);

  if (santriList.length === 0) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 flex items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
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
              Belum ada santri terdaftar di kelas ini
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
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{kelasData?.namaKelas}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Total {santriList.length} santri terdaftar
            </p>
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
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Santri</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">NISN</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nomor Orang Tua</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {santriList.map((santriItem, index) => (
                <tr key={santriItem.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{santriItem.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{santriItem.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium border border-blue-200">
                      {(santriItem as any).nisn || '-'}
                    </span>
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {(santriItem as any).whatsappOrtu ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-slate-900">{(santriItem as any).whatsappOrtu}</span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm text-slate-400 italic">-</span>
                    )}
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
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{santriItem.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{santriItem.email}</p>
                  <p className="text-xs text-slate-400 mt-1">#{index + 1}</p>
                </div>
              </div>

              <div className="space-y-2.5 pb-3 border-b border-slate-200">
                <div>
                  <p className="text-xs text-slate-600 mb-1">NISN</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200">
                    {(santriItem as any).nisn || '-'}
                  </span>
                </div>
                {(santriItem as any).whatsappOrtu && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Nomor Orang Tua</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-900">{(santriItem as any).whatsappOrtu}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SantriTahfizListView;

