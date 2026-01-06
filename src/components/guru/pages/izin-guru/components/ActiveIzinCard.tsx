import React from 'react';
import { CheckCircle, Calendar, Clock } from 'lucide-react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { IzinGuru } from '../../../../../types';
import { getJenisBadge } from '../utils/izinGuruUtils';

interface ActiveIzinCardProps {
  activeIzin: IzinGuru;
  onViewDetail: (izin: IzinGuru) => void;
}

const ActiveIzinCard: React.FC<ActiveIzinCardProps> = ({ activeIzin, onViewDetail }) => {
  const daysRemaining = Math.ceil(
    (new Date(activeIzin.tanggalSelesai).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-white rounded-xl sm:rounded-2xl border border-emerald-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-emerald-900">Izin Aktif</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant={getJenisBadge(activeIzin.jenis) as any} className="text-xs sm:text-sm">
                  {activeIzin.jenis === 'izin_dispen' ? 'DISPEN' : activeIzin.jenis.toUpperCase()}
                </Badge>
                <span className="text-sm sm:text-base text-emerald-900 font-medium">{activeIzin.alasan}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>
                    {new Date(activeIzin.tanggalMulai).toLocaleDateString('id-ID')}
                    {activeIzin.tanggalMulai !== activeIzin.tanggalSelesai && (
                      <> - {new Date(activeIzin.tanggalSelesai).toLocaleDateString('id-ID')}</>
                    )}
                  </span>
                </div>
                {activeIzin.jamMulai && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{activeIzin.jamMulai} - {activeIzin.jamSelesai}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 text-xs sm:text-sm text-emerald-600 font-medium">
                Sisa waktu: <span className="font-bold">{daysRemaining} hari</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => onViewDetail(activeIzin)}
            className="w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm"
          >
            Lihat Detail
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveIzinCard;
