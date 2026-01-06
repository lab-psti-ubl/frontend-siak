import React from 'react';
import { Award, Users, TrendingUp } from 'lucide-react';
import Badge from '../../../../../ui/Badge';
import { User, StatusKenaikanKelas, StatusBagiRaport } from '../../../../../../types';
import { isMaxTingkatSync } from '../../../../../../utils/jenjangPendidikanUtils';

interface MuridTerbaikCardProps {
  statusKenaikan: StatusKenaikanKelas | undefined;
  statusBagiRaportData: StatusBagiRaport | undefined;
  selectedSemester: number;
  targetKelas: any;
  muridKelasData: any[];
}

const getMedalIcon = (index: number) => {
  switch (index) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return '⭐';
  }
};

const getGradientClasses = (index: number) => {
  switch (index) {
    case 0:
      return {
        border: 'border-amber-300',
        bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
        icon: 'bg-amber-100 text-amber-600',
        badge: 'border-amber-200'
      };
    case 1:
      return {
        border: 'border-slate-400',
        bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
        icon: 'bg-slate-100 text-slate-600',
        badge: 'border-slate-200'
      };
    case 2:
      return {
        border: 'border-orange-400',
        bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
        icon: 'bg-orange-100 text-orange-600',
        badge: 'border-orange-200'
      };
    default:
      return {
        border: 'border-blue-200',
        bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        icon: 'bg-blue-100 text-blue-600',
        badge: 'border-blue-200'
      };
  }
};

const MuridTerbaikCard: React.FC<MuridTerbaikCardProps> = ({
  statusKenaikan,
  statusBagiRaportData,
  selectedSemester,
  targetKelas,
  muridKelasData
}) => {
  if (!statusKenaikan && !statusBagiRaportData) {
    return null;
  }

  const title = selectedSemester === 2 ?
    `Murid Terbaik ${targetKelas?.name}` :
    `Murid Terbaik ${targetKelas?.name}`;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-amber-100 rounded-lg p-2 sm:p-2.5">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Prestasi akademik terbaik kelas</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {muridKelasData.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {muridKelasData.map((data, index) => {
              const styles = getGradientClasses(index);
              return (
                <div
                  key={data.murid.id}
                  className={`group relative rounded-lg sm:rounded-xl border-2 ${styles.border} ${styles.bg} p-3 sm:p-4 hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${styles.icon} flex items-center justify-center flex-shrink-0 text-lg sm:text-xl font-bold`}>
                      {getMedalIcon(index)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {index + 1}. {data.murid.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                            NISN: {data.murid.nisn}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-right">
                            <div className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">
                              {data.nilaiAkhir.toFixed(1)}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">Nilai Akhir</p>
                          </div>

                          {selectedSemester === 2 && (
                            <Badge
                              variant={data.isNaikKelas ? 'success' : 'danger'}
                              className="text-xs sm:text-sm flex-shrink-0"
                            >
                              {targetKelas?.tingkat != null && isMaxTingkatSync(targetKelas.tingkat)
                                ? data.isNaikKelas
                                  ? 'LULUS'
                                  : 'TIDAK LULUS'
                                : data.isNaikKelas
                                  ? 'NAIK'
                                  : 'TIDAK NAIK'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3">
                        <div className="bg-white/60 rounded-lg p-2 sm:p-2.5 border border-current/10">
                          <p className="text-xs text-slate-600">Kehadiran</p>
                          <p className="text-sm sm:text-base font-semibold text-slate-900">
                            {data.kehadiran.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-600">Belum ada data murid</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {selectedSemester === 1
                ? 'Data historis menampilkan murid yang berada di kelas ini pada tahun ajaran yang dipilih'
                : 'Tunggu hingga penilaian semester berakhir'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MuridTerbaikCard;