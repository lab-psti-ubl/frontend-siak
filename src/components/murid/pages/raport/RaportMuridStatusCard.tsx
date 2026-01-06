import React from 'react';
import { Calendar, FileText } from 'lucide-react';
import { StatusKenaikanKelas, StatusBagiRaport, Kelas } from '../../../../types';

interface RaportMuridStatusCardProps {
  statusKenaikan: StatusKenaikanKelas | null;
  statusBagiRaportData: StatusBagiRaport | null;
  selectedSemester: number;
  targetKelas?: Kelas | null;
}

const RaportMuridStatusCard: React.FC<RaportMuridStatusCardProps> = ({
  statusKenaikan,
  statusBagiRaportData,
  selectedSemester,
  targetKelas
}) => {
  const isKelas12 = targetKelas?.name.includes('XII') || targetKelas?.name.includes('12');
  if (statusKenaikan && selectedSemester === 2) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 sm:px-6 py-4 border-b border-blue-100">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 rounded-lg p-2 mt-0.5">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                {isKelas12 ? 'Pengumuman Kelulusan' : 'Pengumuman Kenaikan Kelas'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Disebarkan oleh wali kelas pada: {new Date(statusKenaikan.publishedAt || '').toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (statusBagiRaportData && selectedSemester === 1) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-5 sm:px-6 py-4 border-b border-violet-100">
          <div className="flex items-start gap-3">
            <div className="bg-violet-600 rounded-lg p-2 mt-0.5">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Laporan Hasil Belajar Semester Ganjil</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Disebarkan oleh wali kelas pada: {new Date(statusBagiRaportData.publishedAt || '').toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RaportMuridStatusCard;