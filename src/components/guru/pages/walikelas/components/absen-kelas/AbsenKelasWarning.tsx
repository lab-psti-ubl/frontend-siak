import React from 'react';
import { AlertCircle } from 'lucide-react';
import Card from '../../../../../ui/Card';

interface AbsenKelasWarningProps {
  isToday: boolean;
  selectedDate: string;
}

const AbsenKelasWarning: React.FC<AbsenKelasWarningProps> = ({
  isToday,
  selectedDate
}) => {
  if (isToday) return null;

  return (
    <Card className="p-4 bg-yellow-50 border-l-4 border-l-yellow-500">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
        <div>
          <p className="font-medium text-yellow-900">Mode Lihat Riwayat</p>
          <p className="text-sm text-yellow-700">
            Anda sedang melihat data absensi untuk tanggal {new Date(selectedDate).toLocaleDateString('id-ID')}. 
            Sesi absensi hanya dapat dibuka untuk hari ini.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AbsenKelasWarning;