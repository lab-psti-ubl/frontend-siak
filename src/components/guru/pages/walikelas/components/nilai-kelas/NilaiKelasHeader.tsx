import React from 'react';
import Badge from '../../../../../ui/Badge';
import { Kelas, TahunAjaran } from '../../../../../../types';
import { BookOpen, Calendar } from 'lucide-react';

interface NilaiKelasHeaderProps {
  myKelas: Kelas | undefined;
  activeTahunAjaran: TahunAjaran | undefined;
}

const NilaiKelasHeader: React.FC<NilaiKelasHeaderProps> = ({
  myKelas,
  activeTahunAjaran
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl sm:rounded-2xl px-5 sm:px-6 lg:px-8 py-6 sm:py-7 lg:py-8 border border-blue-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="bg-white bg-opacity-90 rounded-lg p-2.5 sm:p-3 flex-shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">
              Nilai Kelas - {myKelas?.name}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5 sm:mt-1">
              Lihat nilai dan analisis prestasi murid kelas Anda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white bg-opacity-90 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 flex-shrink-0">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span className="text-xs sm:text-sm font-semibold text-blue-900">
            {activeTahunAjaran?.tahun} - Semester {activeTahunAjaran?.semester}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NilaiKelasHeader;
