import React from 'react';
import { Calendar } from 'lucide-react';
import Card from '../../../../ui/Card';
import { PengaturanAbsen } from '../../../../../types';
import { useLanguage } from '../../../../../context/LanguageContext';

interface DateInfoCardProps {
  selectedDate: string;
  attendanceRate: string;
  activePengaturan: PengaturanAbsen | undefined;
  dateLocale: string;
}

const DateInfoCard: React.FC<DateInfoCardProps> = ({
  selectedDate,
  attendanceRate,
  activePengaturan,
  dateLocale
}) => {
  const { t } = useLanguage();
  
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">
              {new Date(selectedDate).toLocaleDateString(dateLocale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {activePengaturan && (
              <p className="text-sm text-blue-700">
                {t('absenGuru.jamKerja')}: {activePengaturan.jamMasuk} - {activePengaturan.jamPulang}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-900">{attendanceRate}%</p>
          <p className="text-sm text-blue-700">{t('absenGuru.tingkatKehadiran')}</p>
        </div>
      </div>
    </Card>
  );
};

export default DateInfoCard;
