import React from 'react';
import { Download, Calendar } from 'lucide-react';
import Badge from '../../../../../ui/Badge';
import Button from '../../../../../ui/Button';
import { Kelas, TahunAjaran } from '../../../../../../types';

interface JadwalKelasHeaderProps {
  myKelas?: Kelas;
  activeTahunAjaran: TahunAjaran;
  onExport: () => void;
}

const JadwalKelasHeader: React.FC<JadwalKelasHeaderProps> = ({
  myKelas,
  activeTahunAjaran,
  onExport
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-7 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1 ">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white rounded-lg p-2 sm:p-2.5 hidden sm:inline">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                Jadwal Pelajaran Kelas
              </h2>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-blue-100  sm:ml-0">
              Kelas {myKelas?.name} • {activeTahunAjaran.tahun} Semester {activeTahunAjaran.semester}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            
            <Button
              onClick={onExport}
              variant="secondary"
              size="sm"
              className="justify-center flex items-center text-xs sm:text-sm whitespace-nowrap"
            >
              <Download size={14} className="sm:mr-2" />
              <span >Export</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JadwalKelasHeader;
