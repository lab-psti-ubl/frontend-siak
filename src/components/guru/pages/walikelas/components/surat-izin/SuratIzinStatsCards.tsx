import React from 'react';
import { Clock, Check, X } from 'lucide-react';
import { SuratIzin } from '../../../../../../types';

interface SuratIzinStatsCardsProps {
  pendingSurat: SuratIzin[];
  processedSurat: SuratIzin[];
}

const SuratIzinStatsCards: React.FC<SuratIzinStatsCardsProps> = ({ pendingSurat, processedSurat }) => {
  const acceptedCount = processedSurat.filter(s => s.status === 'diterima').length;
  const rejectedCount = processedSurat.filter(s => s.status === 'ditolak').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
      {/* Menunggu Verifikasi */}
      <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden relative">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Menunggu Verifikasi</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{pendingSurat.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-100 shadow-md group-hover:scale-110 transition-transform duration-200">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600"></div>
      </div>

      {/* Diterima */}
      <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden relative">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Diterima</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{acceptedCount}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-100 shadow-md group-hover:scale-110 transition-transform duration-200">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
      </div>

      {/* Ditolak */}
      <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden relative">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Ditolak</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{rejectedCount}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-red-100 shadow-md group-hover:scale-110 transition-transform duration-200">
                <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600"></div>
      </div>
    </div>
  );
};

export default SuratIzinStatsCards;
