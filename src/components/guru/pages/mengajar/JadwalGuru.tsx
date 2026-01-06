import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import Badge from '../../../ui/Badge';
import { useAuth } from '../../../../context/AuthContext';
import { JadwalPelajaran } from '../../../../types';
import { useKelas } from '../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';

const JadwalGuru: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { activeTahunAjaran } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran(
    activeTahunAjaran
      ? {
          guruId: user?.id,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : { guruId: user?.id }
  );

  // Data sudah difilter di hook berdasarkan params, jadi tidak perlu filter lagi
  const mySchedules = jadwalPelajaran;

  const getCurrentDay = () => {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const today = new Date().getDay();
    return days[today];
  };

  const todayDay = getCurrentDay();

  if (!activeTahunAjaran) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Jadwal Mengajar</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Lihat jadwal mengajar Anda</p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tahun Ajaran Tidak Aktif</h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center">Tidak ada tahun ajaran yang sedang aktif. Hubungi admin untuk mengaktifkan tahun ajaran.</p>
          </div>
        </div>
      </div>
    );
  }

  const getKelasName = (kelasId: string) => {
    return kelas.find(k => k.id === kelasId)?.name || 'Unknown';
  };

  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  const hariOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const schedulesByDay = hariOrder.reduce((acc, hari) => {
    acc[hari] = mySchedules
      .filter(j => j.hari === hari)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    return acc;
  }, {} as Record<string, JadwalPelajaran[]>);

  const hariLabels = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Jadwal Mengajar</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Jadwal pelajaran untuk {activeTahunAjaran?.tahun} Semester {activeTahunAjaran?.semester}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Badge variant="info">
            {activeTahunAjaran?.tahun} - Semester {activeTahunAjaran?.semester}
          </Badge>
        </div>
      </div>

      {mySchedules.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Belum Ada Jadwal</h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center">Anda belum memiliki jadwal mengajar untuk semester ini.</p>
          </div>
        </div>
      ) : (
        <>
          
            

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {hariOrder.map((hari) => {
              const isToday = hari === todayDay;
              const schedules = schedulesByDay[hari];

              return (
                <div
                  key={hari}
                  className={`bg-white rounded-xl sm:rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
                    isToday
                      ? 'border-blue-300 ring-2 ring-blue-200 shadow-md'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className={`${
                    isToday
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500'
                      : 'bg-gradient-to-r from-slate-700 to-slate-600'
                  } px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-b ${
                    isToday ? 'border-blue-300' : 'border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-white rounded-lg p-2">
                          <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            isToday ? 'text-blue-600' : 'text-slate-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-white capitalize">
                            {hariLabels[hari as keyof typeof hariLabels]}
                          </h3>
                          {isToday && (
                            <p className="text-xs text-blue-100">Hari ini</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="default" size="sm">
                        {schedules.length} pelajaran
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 lg:p-6">
                    {schedules.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {schedules.map((jadwal) => (
                          <div
                            key={jadwal.id}
                            onClick={() => {
                              if (isToday) {
                                navigate('/dashboard/absensi', { state: { scrollToJadwalId: jadwal.id } });
                              }
                            }}
                            className={`group relative bg-gradient-to-br from-slate-50 to-slate-50 hover:from-blue-50 hover:to-cyan-50 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 ${
                              isToday ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                                  {getMapelName(jadwal.mataPelajaranId)}
                                </p>
                                <div className="flex items-center gap-1.5 text-slate-600 text-xs sm:text-sm mt-2">
                                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <p className="truncate">{getKelasName(jadwal.kelasId)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 text-slate-600 text-xs sm:text-sm flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <p className="font-medium">{jadwal.jamMulai}</p>
                                </div>
                                <span className="text-slate-400">-</span>
                                <p className="font-medium">{jadwal.jamSelesai}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Calendar className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-500">Tidak ada jadwal</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default JadwalGuru;