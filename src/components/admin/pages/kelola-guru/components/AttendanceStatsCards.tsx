import React from 'react';
import { Users, CheckCircle, Clock, UserCheck } from 'lucide-react';
import Card from '../../../../ui/Card';
import { useLanguage } from '../../../../../context/LanguageContext';

interface AttendanceStatsCardsProps {
  totalGuru: number;
  sudahAbsenMasuk: number;
  terlambat: number;
  izin: number;
  systemType: string;
}

const AttendanceStatsCards: React.FC<AttendanceStatsCardsProps> = ({
  totalGuru,
  sudahAbsenMasuk,
  terlambat,
  izin,
  systemType
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card className="p-4 lg:p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
              {systemType === 'tahfiz' ? t('absenGuru.totalUstadz') : t('absenGuru.totalGuru')}
            </p>
            <p className="text-xl lg:text-3xl font-bold text-gray-900">{totalGuru}</p>
          </div>
          <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 lg:p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">{t('absenGuru.sudahMasuk')}</p>
            <p className="text-xl lg:text-3xl font-bold text-gray-900">{sudahAbsenMasuk}</p>
          </div>
          <div className="p-2 lg:p-3 bg-emerald-100 rounded-lg">
            <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 lg:p-6 border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">{t('absenGuru.terlambat')}</p>
            <p className="text-xl lg:text-3xl font-bold text-gray-900">{terlambat}</p>
          </div>
          <div className="p-2 lg:p-3 bg-amber-100 rounded-lg">
            <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 lg:p-6 border-l-4 border-l-slate-500 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">{t('absenGuru.izinSakit')}</p>
            <p className="text-xl lg:text-3xl font-bold text-gray-900">{izin}</p>
          </div>
          <div className="p-2 lg:p-3 bg-slate-100 rounded-lg">
            <UserCheck className="w-5 h-5 lg:w-6 lg:h-6 text-slate-600" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AttendanceStatsCards;
