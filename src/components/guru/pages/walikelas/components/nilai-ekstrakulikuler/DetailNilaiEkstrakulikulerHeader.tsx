import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CreditCard, GraduationCap } from 'lucide-react';
import Card from '../../../../../ui/Card';
import { User as UserType } from '../../../../../../types';

interface DetailNilaiEkstrakulikulerHeaderProps {
  muridData: UserType;
  muridKelas?: { name: string } | null;
}

const DetailNilaiEkstrakulikulerHeader: React.FC<DetailNilaiEkstrakulikulerHeaderProps> = ({
  muridData,
  muridKelas,
}) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      {/* Header dengan gradient */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/nilai-ekstrakulikuler-kelas')}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-25 backdrop-blur-sm rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {getInitials(muridData.name)}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 border-2 border-blue-500 shadow-md">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </div>
          </div>

          {/* Title and Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
              Detail Nilai Ekstrakulikuler
            </h3>
            <p className="text-sm sm:text-base text-blue-100 truncate font-medium">
              {muridData.name}
            </p>
          </div>
        </div>
      </div>

      {/* Data Murid Cards */}
      <div className="p-5 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* NISN Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">NISN</p>
              </div>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 ml-12">
              {(muridData as any).nisn || '-'}
            </p>
          </div>

          {/* Nama Murid Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-100 rounded-lg p-2">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nama Murid</p>
              </div>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 ml-12 truncate">
              {muridData.name}
            </p>
          </div>

          {/* Kelas Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 rounded-lg p-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kelas</p>
              </div>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 ml-12">
              {muridKelas?.name || '-'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DetailNilaiEkstrakulikulerHeader;

