import React, { useMemo } from 'react';
import { Calendar, Users, ClipboardList, TrendingUp, BookOpen, School, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useGurus } from '../../hooks/useGurus';
import { useMurid } from '../../hooks/useMurid';
import { useKelas } from '../../hooks/useKelas';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { useAbsensiGuru } from '../../hooks/useAbsensiGuru';
import { usePengaturanAbsen } from '../../hooks/usePengaturanAbsen';
import { getTingkatKelasOptionsSync } from '../../utils/jenjangPendidikanUtils';

const KepalaSekolahDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Use API hooks with cache instead of localStorage
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const { absensiGuru } = useAbsensiGuru();
  const { activePengaturanAbsen: activePengaturan } = usePengaturanAbsen();

  // Get jadwal pelajaran for active tahun ajaran
  const { jadwalPelajaran: jadwal } = useJadwalPelajaran(
    activeTahunAjaran
      ? {
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  const today = new Date().toISOString().split('T')[0];

  // Filter kelas: exclude alumni classes (tingkat 99 or name contains 'Alumni') and only include valid tingkat levels
  const activeKelas = useMemo(() => {
    const validTingkatLevels = getTingkatKelasOptionsSync();
    return kelas.filter(k => {
      // Exclude alumni classes
      const isAlumniClass = k.tingkat === 99 || k.name.toLowerCase().includes('alumni');
      // Only include valid tingkat levels (1-6 for SD, 7-9 for SMP, 10-12 for SMA/SMK)
      const isValidTingkat = validTingkatLevels.includes(k.tingkat);
      return !isAlumniClass && isValidTingkat;
    });
  }, [kelas]);

  // Calculate statistics
  const totalGuru = gurus.length;
  const totalMurid = murid.length;
  const totalKelas = activeKelas.length;
  const todayAbsensiGuru = useMemo(() => 
    absensiGuru.filter(a => a.tanggal === today),
    [absensiGuru, today]
  );

  const gurusWithScheduleToday = useMemo(() => {
    const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
    return gurus.filter(u => {
      return jadwal.some(j =>
        j.guruId === u.id &&
        j.hari === currentDay &&
        j.tahunAjaran === activeTahunAjaran?.tahun &&
        j.semester === activeTahunAjaran?.semester
      );
    });
  }, [gurus, jadwal, activeTahunAjaran]);

  const attendanceRate = useMemo(() => {
    return gurusWithScheduleToday.length > 0
      ? ((todayAbsensiGuru.filter(a => a.jamMasuk).length / gurusWithScheduleToday.length) * 100).toFixed(1)
      : '0';
  }, [gurusWithScheduleToday, todayAbsensiGuru]);

  const mainStats = [
    {
      title: 'Total Guru',
      value: totalGuru,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Murid',
      value: totalMurid,
      icon: ClipboardList,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Total Kelas',
      value: totalKelas,
      icon: School,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Kehadiran Guru Hari Ini',
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Selamat Datang, Kepala Sekolah!</h1>
            <p className="text-blue-100 text-lg">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {activeTahunAjaran && (
              <p className="text-blue-200 mt-2">
                Tahun Ajaran {activeTahunAjaran.tahun} - Semester {activeTahunAjaran.semester}
              </p>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <School className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                    <Icon className={`w-8 h-8 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}></div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-6 bg-purple-500 rounded-full mr-3"></div>
              Status Sistem
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mr-3" />
                  <div>
                    <p className="font-medium text-emerald-900">
                      {activeTahunAjaran ? 'Semester Aktif' : 'Tidak Ada Semester Aktif'}
                    </p>
                    <p className="text-sm text-emerald-700">
                      {activeTahunAjaran ?
                        `${activeTahunAjaran.semester === 1 ? 'Ganjil' : 'Genap'} ${activeTahunAjaran.tahun}` :
                        'Silakan hubungi admin untuk aktivasi'
                      }
                    </p>
                  </div>
                </div>
                <Badge variant={activeTahunAjaran ? 'success' : 'warning'}>
                  {activeTahunAjaran ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <div className="flex items-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-900">Tingkat Kehadiran Guru</p>
                    <p className="text-sm text-blue-700">
                      {gurusWithScheduleToday.length > 0 ?
                        `${todayAbsensiGuru.filter(a => a.jamMasuk).length} dari ${gurusWithScheduleToday.length} guru` :
                        'Tidak ada jadwal hari ini'
                      }
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{attendanceRate}%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                <div className="flex items-center">
                  <BookOpen className="w-6 h-6 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-purple-900">Jadwal Aktif</p>
                    <p className="text-sm text-purple-700">
                      {activeTahunAjaran ?
                        `Semester ${activeTahunAjaran.semester} - ${activeTahunAjaran.tahun}` :
                        'Belum ada tahun ajaran aktif'
                      }
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {activeTahunAjaran ?
                    jadwal.filter(j =>
                      j.tahunAjaran === activeTahunAjaran.tahun &&
                      j.semester === activeTahunAjaran.semester
                    ).length : 0
                  }
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-orange-600 mr-3" />
                  <div>
                    <p className="font-medium text-orange-900">Pengaturan Absen</p>
                    <p className="text-sm text-orange-700">
                      {activePengaturan ?
                        `${activePengaturan.jamMasuk} - ${activePengaturan.jamPulang}` :
                        'Belum dikonfigurasi'
                      }
                    </p>
                  </div>
                </div>
                <Badge variant={activePengaturan ? 'success' : 'warning'}>
                  {activePengaturan ? 'Aktif' : 'Perlu Setup'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-lg">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
              Ringkasan Akademik
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  {activeTahunAjaran ?
                    jadwal.filter(j =>
                      j.tahunAjaran === activeTahunAjaran.tahun &&
                      j.semester === activeTahunAjaran.semester
                    ).length : 0
                  }
                </p>
                <p className="text-xs sm:text-sm text-blue-700">Jadwal Aktif</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 mx-auto mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl font-bold text-emerald-900">
                  {gurus.filter(u => u.isWaliKelas).length}
                </p>
                <p className="text-xs sm:text-sm text-emerald-700">Wali Kelas</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <School className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl font-bold text-purple-900">{activeKelas.length}</p>
                <p className="text-xs sm:text-sm text-purple-700">Kelas Aktif</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mx-auto mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl font-bold text-orange-900">{attendanceRate}%</p>
                <p className="text-xs sm:text-sm text-orange-700">Kehadiran Guru</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
              Ringkasan Hari Ini
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Guru Mengajar</p>
                  <p className="text-2xl font-bold text-blue-900">{gurusWithScheduleToday.length}</p>
                  <p className="text-xs text-blue-700">
                    {todayAbsensiGuru.filter(a => a.jamMasuk).length} sudah absen masuk
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">Total Murid</p>
                  <p className="text-2xl font-bold text-emerald-900">{totalMurid}</p>
                  <p className="text-xs text-emerald-700">
                    Dari {totalKelas} kelas aktif
                  </p>
                </div>
                <ClipboardList className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Tahun Ajaran</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {activeTahunAjaran ? activeTahunAjaran.tahun : '-'}
                  </p>
                  <p className="text-xs text-purple-700">
                    {activeTahunAjaran ? `Semester ${activeTahunAjaran.semester}` : 'Tidak aktif'}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default KepalaSekolahDashboard;
