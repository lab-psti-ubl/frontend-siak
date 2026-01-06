import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Badge from '../../../../ui/Badge';
import { PengumumanKelulusan } from '../../../../../types';
import { getMaxTingkatSync } from '../../../../../utils/jenjangPendidikanUtils';

interface PengumumanStatusCardProps {
  activePengumuman: PengumumanKelulusan | undefined;
}

const PengumumanStatusCard: React.FC<PengumumanStatusCardProps> = ({ activePengumuman }) => {
  const maxTingkat = getMaxTingkatSync();

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-4 sm:px-6 lg:px-8 py-4 border-b ${
        activePengumuman
          ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
          : 'bg-gradient-to-r from-slate-500 to-slate-600'
      }`}>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            {activePengumuman ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            )}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Status Pengumuman Kelulusan</h3>
            <p className="text-xs sm:text-sm text-white text-opacity-90">
              {activePengumuman
                ? `Aktif sejak ${new Date(activePengumuman.publishedAt || '').toLocaleDateString('id-ID')}`
                : 'Belum ada pengumuman kelulusan yang aktif'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 sm:space-y-3 flex-1">
            {activePengumuman ? (
              <>
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-lg border border-emerald-100">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs sm:text-sm text-emerald-800">
                    Guru wali kelas {maxTingkat} akan otomatis dilepas dari jabatan wali kelas
                  </p>
                </div>

                {activePengumuman.isProcessed && (
                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-100">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm font-semibold text-blue-800">
                      Kenaikan kelas dan kelulusan telah diproses
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-lg border border-slate-200">
                <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-xs sm:text-sm text-slate-700">
                  Buat pengumuman kelulusan terlebih dahulu untuk mengaktifkan sistem
                </p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <Badge
              variant={activePengumuman ? 'success' : 'default'}
              className="text-xs sm:text-sm py-2 px-3"
            >
              {activePengumuman ? 'AKTIF' : 'TIDAK AKTIF'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengumumanStatusCard;