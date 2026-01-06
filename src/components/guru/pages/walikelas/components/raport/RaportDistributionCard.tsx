import React from 'react';
import { Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Button from '../../../../../ui/Button';
import { StatusKenaikanKelas, StatusBagiRaport } from '../../../../../../types';

interface RaportDistributionCardProps {
  canDistribute: boolean;
  isDistributed: boolean;
  selectedSemester: number;
  statusKenaikan: StatusKenaikanKelas | undefined;
  statusBagiRaportData: StatusBagiRaport | undefined;
  onDistributeRaport: () => void;
}

const RaportDistributionCard: React.FC<RaportDistributionCardProps> = ({
  canDistribute,
  isDistributed,
  selectedSemester,
  statusKenaikan,
  statusBagiRaportData,
  onDistributeRaport
}) => {
  if (!canDistribute) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="bg-gradient-to-r from-slate-50 to-slate-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div className="bg-slate-100 rounded-lg p-2.5 sm:p-3 flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Menunggu Aktivasi Admin</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Admin belum mengaktifkan distribusi laporan hasil belajar untuk semester {selectedSemester}. Silakan tunggu pengumuman dari admin sekolah.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl sm:rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 ${
      isDistributed
        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
        : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
    }`}>
      <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${
        isDistributed ? 'border-emerald-200' : 'border-orange-200'
      }`}>
        <div className="flex items-start gap-3 justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`rounded-lg p-2.5 sm:p-3 flex-shrink-0 ${
              isDistributed
                ? 'bg-emerald-100'
                : 'bg-orange-100'
            }`}>
              {isDistributed ? (
                <CheckCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  isDistributed ? 'text-emerald-600' : 'text-orange-600'
                }`} />
              ) : (
                <Send className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  isDistributed ? 'text-emerald-600' : 'text-orange-600'
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm sm:text-base font-semibold ${
                isDistributed ? 'text-emerald-900' : 'text-orange-900'
              }`}>
                {isDistributed ? 'Laporan Hasil Belajar Sudah Disebarkan' : 'Siap untuk Disebarkan'}
              </h3>
              <p className={`text-xs sm:text-sm mt-1 ${
                isDistributed ? 'text-emerald-700' : 'text-orange-700'
              }`}>
                {isDistributed ?
                  `Disebarkan pada ${
                    selectedSemester === 2 ?
                      new Date(statusKenaikan?.publishedAt || '').toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) :
                      new Date(statusBagiRaportData?.publishedAt || '').toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                  }` :
                  `Admin telah mengaktifkan distribusi. Klik tombol untuk menyebarkan kepada ${
                    selectedSemester === 2 ? 'semua murid kelas' : 'murid kelas'
                  }.`
                }
              </p>
            </div>
          </div>
          {!isDistributed && (
            <Button
              onClick={onDistributeRaport}
              variant="success"
              className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Sebarkan</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RaportDistributionCard;