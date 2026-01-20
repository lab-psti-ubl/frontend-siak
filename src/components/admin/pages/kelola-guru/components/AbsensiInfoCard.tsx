import React from 'react';
import { UserCheck } from 'lucide-react';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { AbsensiGuru, IzinGuru } from '../../../../../types';
import StatusBadgeMapper from './StatusBadgeMapper';
import { formatTimeDisplay } from '../../../../../utils/absensiUtils';

interface AbsensiInfoCardProps {
  detailDate: string;
  absensi: AbsensiGuru | undefined;
  izinAktif: IzinGuru | undefined;
}

const AbsensiInfoCard: React.FC<AbsensiInfoCardProps> = ({
  detailDate,
  absensi,
  izinAktif
}) => {
  return (
    <Card className="p-4">
      <h4 className="font-semibold text-gray-900 mb-4">
        Absensi {new Date(detailDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </h4>

      {izinAktif && !absensi ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
          <Badge variant="info" className="mb-2">
            {izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1)}
          </Badge>
          <p className="text-sm text-gray-600">{izinAktif.alasan}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-gray-900 ">Status Masuk:</h5>
            
          </div>
          <div className="flex justify-between items-center p-1 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Jam Masuk:</span>
            <div className="text-right">
              {absensi?.jamMasuk ? (
                <>
                  <p className="font-mono font-medium">{formatTimeDisplay(absensi.jamMasuk)}</p>
                  <StatusBadgeMapper status={absensi.statusMasuk} />
                </>
              ) : (
                <span className="text-gray-400 text-sm">-</span>
              )}
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 ">Status Keluar:</h5>
            
          </div>

          

          <div className="flex justify-between items-center p-1 bg-gray-50 rounded-lg">
            
            <span className="text-gray-600">Jam Keluar:</span>
            <div className="text-right">
              {absensi?.jamKeluar ? (
                <>
                  <p className="font-mono font-medium">{formatTimeDisplay(absensi.jamKeluar)}</p>
                  <StatusBadgeMapper status={absensi.statusKeluar} />
                </>
              ) : (
                <span className="text-gray-400 text-sm">-</span>
              )}
            </div>
          </div>

          
        </div>
      )}
    </Card>
  );
};

export default AbsensiInfoCard;
