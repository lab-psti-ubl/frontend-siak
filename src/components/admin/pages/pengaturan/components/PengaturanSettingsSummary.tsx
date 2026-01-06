import React from 'react';
import { Clock, CheckCircle, AlertCircle, BookOpen, Calendar } from 'lucide-react';
import Card from '../../../../ui/Card';
import { PengaturanAbsen, PengaturanSKS, PengaturanIstirahat } from '../../../../../types';
import { formatDurasi } from '../../../../../utils/sksUtils';

interface PengaturanSettingsSummaryProps {
  activePengaturan: PengaturanAbsen | undefined;
  activePengaturanSKS: PengaturanSKS | undefined;
  activePengaturanIstirahat: PengaturanIstirahat | undefined;
}

const PengaturanSettingsSummary: React.FC<PengaturanSettingsSummaryProps> = ({
  activePengaturan,
  activePengaturanSKS,
  activePengaturanIstirahat,
}) => {
  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">Ringkasan Pengaturan Aktif</h3>
          <p className="text-xs sm:text-sm text-slate-600">Lihat pengaturan yang sedang berlaku di sistem</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {activePengaturan && (
            <>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Jam Masuk</p>
                    <p className="text-base sm:text-lg font-bold text-blue-900">{activePengaturan.jamMasuk}</p>
                  </div>
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-lg border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-emerald-600 font-medium mb-1">Tol. Masuk</p>
                    <p className="text-base sm:text-lg font-bold text-emerald-900">{activePengaturan.toleransiMasuk} mnt</p>
                  </div>
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-sky-50 to-sky-50/50 rounded-lg border border-sky-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-sky-600 font-medium mb-1">Jam Pulang</p>
                    <p className="text-base sm:text-lg font-bold text-sky-900">{activePengaturan.jamPulang}</p>
                  </div>
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 flex-shrink-0" />
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-lg border border-amber-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-amber-600 font-medium mb-1">Tol. Pulang</p>
                    <p className="text-base sm:text-lg font-bold text-amber-900">{activePengaturan.toleransiPulang} mnt</p>
                  </div>
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0" />
                </div>
              </div>
            </>
          )}
        </div>

        {(activePengaturanSKS || activePengaturanIstirahat) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {activePengaturanSKS && (
              <div className="p-3 sm:p-4 bg-gradient-to-br from-violet-50 to-violet-50/50 rounded-lg border border-violet-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-violet-600 font-medium mb-1">Durasi per SKS</p>
                    <p className="text-base sm:text-lg font-bold text-violet-900">{activePengaturanSKS.durasiPerSKS} mnt</p>
                    <p className="text-xs text-violet-600 mt-1">Istirahat: {activePengaturanSKS.istirahatAntarSKS} mnt</p>
                  </div>
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 flex-shrink-0" />
                </div>
              </div>
            )}

            {activePengaturanIstirahat && (
              <div className="p-3 sm:p-4 bg-gradient-to-br from-cyan-50 to-cyan-50/50 rounded-lg border border-cyan-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-cyan-600 font-medium mb-1">Jam Istirahat</p>
                    <p className="text-base sm:text-lg font-bold text-cyan-900">
                      {activePengaturanIstirahat.jamMulai} - {activePengaturanIstirahat.jamSelesai}
                    </p>
                    <p className="text-xs text-cyan-600 mt-1">
                      {(() => {
                        const jamMulaiTime = new Date(`2000-01-01T${activePengaturanIstirahat.jamMulai}:00`);
                        const jamSelesaiTime = new Date(`2000-01-01T${activePengaturanIstirahat.jamSelesai}:00`);
                        const durasiMenit = (jamSelesaiTime.getTime() - jamMulaiTime.getTime()) / (1000 * 60);
                        return `Durasi: ${formatDurasi(durasiMenit)}`;
                      })()}
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 flex-shrink-0" />
                </div>
              </div>
            )}
          </div>
        )}

        {(activePengaturan || activePengaturanSKS || activePengaturanIstirahat) && (
          <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-600">
            <strong className="text-slate-900">Terakhir diperbarui:</strong>
            <div className="mt-1">
              {(() => {
                const latestUpdate = [
                  activePengaturan?.createdAt,
                  activePengaturanSKS?.createdAt,
                  activePengaturanIstirahat?.createdAt
                ].filter(Boolean).sort().reverse()[0];

                return latestUpdate ? new Date(latestUpdate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '-';
              })()}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PengaturanSettingsSummary;
