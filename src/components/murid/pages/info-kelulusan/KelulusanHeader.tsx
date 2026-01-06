import React from 'react';
import { GraduationCap } from 'lucide-react';
import { PengumumanKelulusan } from '../../../../types';
import { getSchoolName } from '../../../../utils/jenjangPendidikanUtils';

interface KelulusanHeaderProps {
  activePengumuman: PengumumanKelulusan;
}

const KelulusanHeader: React.FC<KelulusanHeaderProps> = ({ activePengumuman }) => {
  const schoolName = getSchoolName();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 sm:p-8 rounded-t-lg">
      <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 gap-4 sm:gap-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center sm:mr-6 flex-shrink-0">
          <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 px-2 sm:px-0">PENGUMUMAN KELULUSAN</h1>
          <p className="text-sm sm:text-base text-blue-100">{schoolName}</p>
          <p className="text-sm sm:text-base text-blue-100">Tahun Ajaran {activePengumuman.tahunAjaran}</p>
        </div>
      </div>
    </div>
  );
};

export default KelulusanHeader;
