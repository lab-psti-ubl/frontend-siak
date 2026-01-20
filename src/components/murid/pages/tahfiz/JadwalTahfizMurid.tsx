import React, { useMemo, useState } from 'react';
import {
  Clock,
  Search,
  Users,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useJadwalTahfiz } from '../../../../hooks/useJadwalTahfiz';
import { useSantri } from '../../../../hooks/useSantri';
import { TahfizSchedule } from '../../../../types';
import Badge from '../../../ui/Badge';

const JadwalTahfizMurid: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const dayOptions = [
    { value: 'senin', label: t('tahfiz.muridTahfiz.commonLabels.senin') },
    { value: 'selasa', label: t('tahfiz.muridTahfiz.commonLabels.selasa') },
    { value: 'rabu', label: t('tahfiz.muridTahfiz.commonLabels.rabu') },
    { value: 'kamis', label: t('tahfiz.muridTahfiz.commonLabels.kamis') },
    { value: 'jumat', label: t('tahfiz.muridTahfiz.commonLabels.jumat') },
    { value: 'sabtu', label: t('tahfiz.muridTahfiz.commonLabels.sabtu') },
    { value: 'minggu', label: t('tahfiz.muridTahfiz.commonLabels.minggu') },
  ];
  const { ustadz } = useUstadz();
  const { kelasTahfiz: classes, loading: classesLoading } = useKelasTahfiz();
  const { jadwalTahfiz, loading: jadwalLoading } = useJadwalTahfiz();
  const { santri } = useSantri();

  const [searchTerm, setSearchTerm] = useState('');

  // Check if logged-in user is a santri
  const isSantri = useMemo(() => {
    if (!user?.id) return false;
    return santri.some((s) => s.id === user.id);
  }, [santri, user?.id]);

  // Find classes where the logged-in user is a santri
  const myClasses = useMemo(() => {
    if (!user?.id || !isSantri) return [];
    return classes.filter((cls) => cls.santriIds.includes(user.id));
  }, [classes, user?.id, isSantri]);

  const ustadzMap = useMemo(() => {
    const map = new Map<string, any>();
    ustadz.forEach((item) => map.set(item.id, item));
    return map;
  }, [ustadz]);

  const kelasMap = useMemo(() => {
    const map = new Map<string, any>();
    classes.forEach((item) => map.set(item.id, item));
    return map;
  }, [classes]);

  // Filter jadwal to only show schedules for classes where the logged-in user is a santri
  const myJadwal = useMemo(() => {
    if (!user?.id || !isSantri) return [];
    const myClassIds = myClasses.map((cls) => cls.id);
    return jadwalTahfiz.filter((jadwal) => myClassIds.includes(jadwal.kelasId));
  }, [jadwalTahfiz, myClasses, user?.id, isSantri]);

  // Enrich jadwal with class and ustadz information
  const enrichedJadwal = useMemo(() => {
    return myJadwal.map((item) => {
      const kelas = kelasMap.get(item.kelasId);
      const ustadzName = kelas ? ustadzMap.get(kelas.ustadzId)?.name || t('tahfiz.muridTahfiz.commonLabels.belumDiatur') : t('tahfiz.muridTahfiz.commonLabels.belumDiatur');
      return {
        ...item,
        kelas,
        ustadzName,
      };
    });
  }, [myJadwal, kelasMap, ustadzMap, t]);

  // Sort by day and time
  const sortedJadwal = useMemo(() => {
    const dayOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
    return [...enrichedJadwal].sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.hari) - dayOrder.indexOf(b.hari);
      if (dayDiff !== 0) return dayDiff;
      return a.jamMulai.localeCompare(b.jamMulai);
    });
  }, [enrichedJadwal]);

  const filteredJadwal = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return sortedJadwal.filter((item) => {
      const kelasName = item.kelas?.namaKelas?.toLowerCase() || '';
      const ruangan = item.kelas?.ruangan?.toLowerCase() || '';
      const ustadzName = item.ustadzName.toLowerCase();
      const hariLabel = dayOptions.find((d) => d.value === item.hari)?.label.toLowerCase() || '';

      return (
        kelasName.includes(query) ||
        ruangan.includes(query) ||
        ustadzName.includes(query) ||
        hariLabel.includes(query)
      );
    });
  }, [sortedJadwal, searchTerm]);

  const getCurrentDay = () => {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const today = new Date().getDay();
    return days[today];
  };

  const todayDay = getCurrentDay();

  // Group jadwal by day
  const hariOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const schedulesByDay = hariOrder.reduce((acc, hari) => {
    acc[hari] = filteredJadwal
      .filter(j => j.hari === hari)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    return acc;
  }, {} as Record<string, typeof filteredJadwal>);

  const hariLabels = {
    senin: t('tahfiz.muridTahfiz.commonLabels.senin'),
    selasa: t('tahfiz.muridTahfiz.commonLabels.selasa'),
    rabu: t('tahfiz.muridTahfiz.commonLabels.rabu'),
    kamis: t('tahfiz.muridTahfiz.commonLabels.kamis'),
    jumat: t('tahfiz.muridTahfiz.commonLabels.jumat'),
    sabtu: t('tahfiz.muridTahfiz.commonLabels.sabtu'),
    minggu: t('tahfiz.muridTahfiz.commonLabels.minggu'),
  };

  const isLoading = jadwalLoading || classesLoading;

  // If user is not a santri, show message
  if (!isSantri) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  {t('tahfiz.muridTahfiz.jadwalTahfiz.title')}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100">
                  {t('tahfiz.muridTahfiz.jadwalTahfiz.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="text-center py-12 px-6">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {t('tahfiz.muridTahfiz.jadwalTahfiz.belumTerdaftarSebagaiSantri')}
            </h3>
            <p className="text-sm text-slate-600">
              {t('tahfiz.muridTahfiz.jadwalTahfiz.untukMelihatJadwal')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.muridTahfiz.jadwalTahfiz.title')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {t('tahfiz.muridTahfiz.jadwalTahfiz.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder={t('tahfiz.muridTahfiz.jadwalTahfiz.cariKelasRuanganUstadzHari')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            {t('tahfiz.muridTahfiz.jadwalTahfiz.menampilkan')} <span className="font-semibold text-slate-900">{filteredJadwal.length}</span> {t('tahfiz.muridTahfiz.jadwalTahfiz.dari')}{' '}
            <span className="font-semibold text-slate-900">{myJadwal.length}</span> {t('tahfiz.muridTahfiz.jadwalTahfiz.jadwal')}
          </div>
        </div>
      </div>

      {/* Card List View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="text-center py-12 px-6">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">{t('tahfiz.muridTahfiz.jadwalTahfiz.memuatDataJadwal')}</p>
          </div>
        </div>
      ) : filteredJadwal.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="text-center py-12 px-6">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.muridTahfiz.jadwalTahfiz.tidakAdaHasil') : t('tahfiz.muridTahfiz.jadwalTahfiz.belumAdaJadwal')}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchTerm ? t('tahfiz.muridTahfiz.jadwalTahfiz.ubahKataKunci') : t('tahfiz.muridTahfiz.jadwalTahfiz.belumMemilikiJadwal')}
            </p>
          </div>
        </div>
      ) : (
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
                    : 'bg-gradient-to-r from-emerald-700 to-emerald-600'
                } px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-b ${
                  isToday ? 'border-blue-300' : 'border-emerald-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-white rounded-lg p-2">
                        <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          isToday ? 'text-blue-600' : 'text-emerald-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white capitalize">
                          {hariLabels[hari as keyof typeof hariLabels]}
                        </h3>
                        {isToday && (
                          <p className="text-xs text-blue-100">{t('tahfiz.muridTahfiz.jadwalTahfiz.hariIni')}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="default" size="sm">
                      {schedules.length} {t('tahfiz.muridTahfiz.jadwalTahfiz.jadwalLabel')}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 sm:p-5 lg:p-6">
                  {schedules.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {schedules.map((item) => {
                        const hariLabel = dayOptions.find((d) => d.value === item.hari)?.label || item.hari;
                        return (
                          <div
                            key={item.id}
                            className="group relative bg-gradient-to-br from-slate-50 to-slate-50 hover:from-emerald-50 hover:to-emerald-50 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-emerald-300"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                                  {item.kelas?.namaKelas || '-'}
                                </p>
                                <div className="flex items-center gap-1.5 text-slate-600 text-xs sm:text-sm mt-2">
                                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <p className="truncate">{item.kelas?.ruangan || '-'}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                                  <span className="truncate">{item.ustadzName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 text-slate-600 text-xs sm:text-sm flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <p className="font-medium">{item.jamMulai}</p>
                                </div>
                                <span className="text-slate-400">-</span>
                                <p className="font-medium">{item.jamSelesai}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Calendar className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-500">{t('tahfiz.muridTahfiz.jadwalTahfiz.belumAdaJadwal')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JadwalTahfizMurid;

