import React from 'react';
import Modal from '../../../ui/Modal';
import Card from '../../../ui/Card';
import { RaportData } from '../../../../utils/raport';
import { getGradeColor, getNilaiMinimalSettings } from '../../../../utils/nilaiUtils';
import { User, Kelas, PengumumanKelulusan } from '../../../../types';
import { getSchoolName, getGraduationKelasTextSync } from '../../../../utils/jenjangPendidikanUtils';

interface KelulusanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  raportData: RaportData;
  user: User | null;
  myKelas: Kelas | undefined;
  activePengumuman: PengumumanKelulusan;
  isLulus: boolean;
  myRanking: number;
  totalKelas: number;
  mySchoolRanking: number;
  totalSekolah: number;
}

const KelulusanDetailModal: React.FC<KelulusanDetailModalProps> = ({
  isOpen,
  onClose,
  raportData,
  user,
  myKelas,
  activePengumuman,
  isLulus,
  myRanking,
  totalKelas,
  mySchoolRanking,
  totalSekolah
}) => {
  const minimalSettings = getNilaiMinimalSettings();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Kelulusan Saya"
      size="xl"
    >
      <div className="pb-20 sm:pb-3 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <Card className="p-3 sm:p-4  border  shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className="text-[10px] sm:text-xs text-blue-700 mb-1.5 sm:mb-2 font-semibold uppercase tracking-wide">Nama</div>
            <div className="text-xs sm:text-sm font-bold text-gray-900 break-words leading-tight">{user?.name}</div>
          </Card>
          <Card className="p-3 sm:p-4  border  shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className="text-[10px] sm:text-xs text-purple-700 mb-1.5 sm:mb-2 font-semibold uppercase tracking-wide">NISN</div>
            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{(user as any)?.nisn || '-'}</div>
          </Card>
          <Card className="p-3 sm:p-4  border  shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className="text-[10px] sm:text-xs text-emerald-700 mb-1.5 sm:mb-2 font-semibold uppercase tracking-wide">Kelas</div>
            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{myKelas?.name}</div>
          </Card>
          <Card className="p-3 sm:p-4  border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className="text-[10px] sm:text-xs text-orange-700 mb-1.5 sm:mb-2 font-semibold uppercase tracking-wide">Tahun Ajaran</div>
            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{activePengumuman.tahunAjaran}</div>
          </Card>
        </div>

        <div className={`p-4 sm:p-6 rounded-lg border-2 ${
          isLulus ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'
        }`}>
          <h4 className={`font-bold text-center mb-3 sm:mb-4 text-base sm:text-lg ${
            isLulus ? 'text-emerald-900' : 'text-red-900'
          }`}>
            STATUS KELULUSAN
          </h4>
          <div className={`text-center p-3 sm:p-4 rounded-lg ${
            isLulus ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <p className={`text-2xl sm:text-3xl font-bold mb-2 ${
              isLulus ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {isLulus ? 'LULUS' : 'TIDAK LULUS'}
            </p>
            <p className={`text-xs sm:text-sm ${
              isLulus ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {isLulus
                ? `Selamat! Anda telah lulus dari ${getSchoolName()}`
                : 'Anda belum memenuhi syarat kelulusan'
              }
            </p>
          </div>

          <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center">
              <p className="text-gray-600 mb-1">Rata-rata Nilai</p>
              <p className={`text-base sm:text-lg font-bold ${
                raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {raportData.overallGrade.toFixed(1)} {raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal ? '✓' : '✗'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Minimal {minimalSettings.nilaiAkhirMinimal}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-1">Tingkat Kehadiran</p>
              <p className={`text-base sm:text-lg font-bold ${
                raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {raportData.attendanceRate.toFixed(1)}% {raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal ? '✓' : '✗'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Minimal {minimalSettings.tingkatKehadiranMinimal}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <Card className="p-3 sm:p-4 text-center">
            <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">Peringkat di Kelas</h4>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{myRanking}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">dari {totalKelas} murid</p>
          </Card>

          <Card className="p-3 sm:p-4 text-center">
            <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">Peringkat di Sekolah</h4>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{mySchoolRanking}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">dari {totalSekolah} murid {getGraduationKelasTextSync()}</p>
          </Card>
        </div>

        <div className=" p-3 sm:p-4 bg-blue-50 rounded-lg">
          <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-2 sm:mb-3">Detail Nilai per Mata Pelajaran</h4>
          <div className="space-y-1.5 sm:space-y-2">
            {raportData.subjects.map((subject) => (
              <div key={subject.mapelId} className="flex items-center justify-between p-2 sm:p-2.5 bg-white rounded text-xs sm:text-sm">
                <span className="font-medium pr-2 break-words flex-1 min-w-0">{subject.mapelName}</span>
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                  <span className="font-bold whitespace-nowrap">
                    {subject.nilaiAkhir?.toFixed(1) || '-'}
                  </span>
                  {subject.grade && (
                    <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold ${getGradeColor(subject.grade)}`}>
                      {subject.grade}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default KelulusanDetailModal;
