import React from 'react';
import { CheckCircle } from 'lucide-react';
import { RaportData } from '../../../../utils/raport';
import { getNilaiMinimalSettings } from '../../../../utils/nilaiUtils';
import { getSchoolName } from '../../../../utils/jenjangPendidikanUtils';

interface KelulusanStatusCardProps {
  isLulus: boolean;
  raportData: RaportData;
}

const KelulusanStatusCard: React.FC<KelulusanStatusCardProps> = ({ isLulus, raportData }) => {
  const minimalSettings = getNilaiMinimalSettings();

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm sm:text-base font-medium text-blue-900 mb-1">Raport Semester 2 Tersedia</h4>
            <p className="text-xs sm:text-sm text-blue-800">
              Raport lengkap Anda untuk semester 2 sudah tersedia dan dapat diakses melalui menu Raport atau tombol di bawah.
            </p>
          </div>
        </div>
      </div>

      <div className={`p-4 sm:p-6 rounded-lg border-2 mb-4 sm:mb-6 ${
        isLulus ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'
      }`}>
        <h3 className={`font-bold text-center mb-4 sm:mb-4 text-base sm:text-xl px-2 ${
          isLulus ? 'text-emerald-900' : 'text-red-900'
        }`}>
          STATUS KELULUSAN ANDA
        </h3>
        <div className={`text-center p-5 sm:p-6 rounded-lg ${
          isLulus ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          <p className={`text-xl sm:text-3xl  font-bold mb-4 sm:mb-4 leading-tight px-2 ${
            isLulus ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {isLulus ? 'SELAMAT! ANDA LULUS' : 'ANDA BELUM LULUS'}
          </p>
          <p className={`text-xs sm:text-lg leading-relaxed px-2 ${
            isLulus ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {isLulus
              ? `Anda telah memenuhi syarat kelulusan dari ${getSchoolName()}`
              : 'Anda belum memenuhi syarat kelulusan'
            }
          </p>
        </div>

        <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-4 sm:gap-6">
          <div className="text-center px-1 sm:px-0">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-2 font-medium">Rata-rata Nilai Anda</p>
            <p className={`text-xl sm:text-3xl font-bold mb-1 ${
              raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {raportData.overallGrade.toFixed(1)}
            </p>
            <p className="text-xs sm:text-xs text-gray-500 mt-1">Minimal {minimalSettings.nilaiAkhirMinimal} untuk lulus</p>
          </div>
          <div className="text-center px-1 sm:px-0">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-2 font-medium">Tingkat Kehadiran Anda</p>
            <p className={`text-xl sm:text-3xl font-bold mb-1 ${
              raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {raportData.attendanceRate.toFixed(1)}%
            </p>
            <p className="text-xs sm:text-xs text-gray-500 mt-1">Minimal {minimalSettings.tingkatKehadiranMinimal}% untuk lulus</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KelulusanStatusCard;
