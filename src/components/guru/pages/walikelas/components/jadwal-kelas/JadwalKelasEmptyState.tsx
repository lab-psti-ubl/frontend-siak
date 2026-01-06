import React from 'react';
import { Calendar, AlertCircle, Lock } from 'lucide-react';
import { Kelas, TahunAjaran } from '../../../../../../types';

interface EmptyStateProps {
  type: 'no-access' | 'no-tahun-ajaran' | 'no-schedule';
  myKelas?: Kelas;
  activeTahunAjaran?: TahunAjaran;
}

const JadwalKelasEmptyState: React.FC<EmptyStateProps> = ({ type, myKelas, activeTahunAjaran }) => {
  const emptyStates = {
    'no-access': {
      icon: Lock,
      title: 'Akses Ditolak',
      description: 'Anda tidak memiliki akses sebagai wali kelas.',
      color: 'text-amber-600 bg-amber-100'
    },
    'no-tahun-ajaran': {
      icon: AlertCircle,
      title: 'Tahun Ajaran Tidak Aktif',
      description: 'Tidak ada tahun ajaran yang sedang aktif. Hubungi admin untuk mengaktifkan tahun ajaran.',
      color: 'text-red-600 bg-red-100'
    },
    'no-schedule': {
      icon: Calendar,
      title: 'Belum Ada Jadwal',
      description: `Kelas ${myKelas?.name} belum memiliki jadwal pelajaran untuk ${activeTahunAjaran?.tahun} semester ${activeTahunAjaran?.semester}.`,
      color: 'text-blue-600 bg-blue-100'
    }
  };

  const state = emptyStates[type];
  const Icon = state.icon;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 ${state.color} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5`}>
          <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">
          {state.title}
        </h3>
        <p className="text-sm sm:text-base text-slate-600 max-w-sm mx-auto">
          {state.description}
        </p>
      </div>
    </div>
  );
};

export default JadwalKelasEmptyState;
