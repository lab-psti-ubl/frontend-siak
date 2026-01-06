import React from 'react';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { PengaturanAbsen } from '../../../../types';

interface WorkHoursInfoProps {
  activePengaturan: PengaturanAbsen | undefined;
}

const WorkHoursInfo: React.FC<WorkHoursInfoProps> = ({ activePengaturan }) => {
  if (!activePengaturan) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white">Jam Kerja Sekolah</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 rounded-lg p-2 flex-shrink-0">
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wide">Jam Masuk</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700 mt-1 sm:mt-2">
                  {activePengaturan.jamMasuk}
                </p>
                <p className="text-xs sm:text-sm text-blue-700 mt-1">
                  Toleransi: {activePengaturan.toleransiMasuk} menit
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="bg-cyan-500 rounded-lg p-2 flex-shrink-0">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-cyan-600 uppercase tracking-wide">Jam Pulang</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-600 mt-1 sm:mt-2">
                  {activePengaturan.jamPulang}
                </p>
                <p className="text-xs sm:text-sm text-cyan-600 mt-1">
                  Toleransi: {activePengaturan.toleransiPulang} menit
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkHoursInfo;
