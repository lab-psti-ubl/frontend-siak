import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, RefreshCw, BookOpen, Users, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { useMonitoringKelas } from '../../../../hooks/useMonitoringKelas';
import { SesiAbsensi, User } from '../../../../types';
import {
  KelasMonitoring,
  MonitoringStatus,
} from '../../../../utils/monitoringKelasUtils';
import { apiService } from '../../../../services/apiService';
import { useKelas } from '../../../../hooks/useKelas';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { getTingkatKelasOptionsSync } from '../../../../utils/jenjangPendidikanUtils';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { useLanguage } from '../../../../context/LanguageContext';
import MonitoringKelasTahfizSection from './MonitoringKelasTahfizSection';

type StatusFilter = 'semua' | 'jadwal_kosong' | 'belum_ada_guru' | 'sudah_ada_guru' | 'sesi_ditutup';

const MonitoringKelas: React.FC = () => {
  const { t, language } = useLanguage();
  const { systemType } = usePengaturanSistem();
  const { kelas } = useKelas();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { mataPelajaran } = useMataPelajaran();
  const { jadwalPelajaran: jadwal } = useJadwalPelajaran();

  // Tampilkan section sesuai tipe sistem; bila systemType belum loaded (null) default ke umum
  const showUmum = systemType !== 'tahfiz'; // umum + umum_tahfiz + null
  const showTahfiz = systemType === 'tahfiz' || systemType === 'sekolah_umum_tahfiz';
  
  const [sesiAbsensi, setSesiAbsensi] = useState<SesiAbsensi[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const getTimeFormatted = useCallback(() => {
    const locale = language === 'id' ? 'id-ID' : 'en-MY';
    const hour12 = language === 'ms';
    return new Date().toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12,
    });
  }, [language]);
  const [currentTime, setCurrentTime] = useState<string>(getTimeFormatted);

  useEffect(() => {
    const fetchSesiAbsensi = async () => {
      try {
        setIsLoading(true);
        const sesiAbsensiResponse = await apiService.getAllSesiAbsensi();
        if (sesiAbsensiResponse.success && sesiAbsensiResponse.sesiAbsensi) {
          setSesiAbsensi(sesiAbsensiResponse.sesiAbsensi);
        }
      } catch (error) {
        console.error('Error fetching sesi absensi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSesiAbsensi();
  }, []);

  // Combine gurus and murid into users array for compatibility
  useEffect(() => {
    setUsers([...gurus, ...murid]);
  }, [gurus, murid]);

  useEffect(() => {
    setCurrentTime(getTimeFormatted());
    const timer = setInterval(() => setCurrentTime(getTimeFormatted()), 1000);
    return () => clearInterval(timer);
  }, [getTimeFormatted]);

  const activeTahunAjaran = activeTahunAjaranFromHook || undefined;
  
  // Filter out alumni classes (tingkat 99 or name contains 'Alumni') and only include valid tingkat levels
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
  
  const monitoringData = useMonitoringKelas(
    activeKelas,
    jadwal,
    sesiAbsensi,
    users,
    activeTahunAjaran,
    mataPelajaran
  );

  const filteredData =
    statusFilter === 'semua'
      ? monitoringData
      : monitoringData.filter(m => m.currentStatus === statusFilter);

  const stats = {
    total: monitoringData.length,
    jadwalKosong: monitoringData.filter(m => m.currentStatus === 'jadwal_kosong').length,
    belumAdaGuru: monitoringData.filter(m => m.currentStatus === 'belum_ada_guru').length,
    sudahAdaGuru: monitoringData.filter(m => m.currentStatus === 'sudah_ada_guru').length,
    sesiDitutup: monitoringData.filter(m => m.currentStatus === 'sesi_ditutup').length,
  };

  const filters: Array<{
    label: string;
    value: StatusFilter;
    count: number;
    color: string;
  }> = [
    { label: t('monitoring.semua'), value: 'semua', count: stats.total, color: 'bg-gray-100' },
    { label: t('monitoring.jadwalKosong'), value: 'jadwal_kosong', count: stats.jadwalKosong, color: 'bg-gray-50' },
    { label: t('monitoring.belumAdaGuru'), value: 'belum_ada_guru', count: stats.belumAdaGuru, color: 'bg-yellow-50' },
    { label: t('monitoring.sudahAdaGuru'), value: 'sudah_ada_guru', count: stats.sudahAdaGuru, color: 'bg-emerald-50' },
    { label: t('monitoring.sesiDitutup'), value: 'sesi_ditutup', count: stats.sesiDitutup, color: 'bg-blue-50' },
  ];

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('monitoring.loading')}</p>
        </div>
      </div>
    );
  }

  const onlyTahfiz = systemType === 'tahfiz';
  const pageTitle = onlyTahfiz ? t('monitoring.titleTahfiz') : t('monitoring.title');
  const pageSubtitle = onlyTahfiz ? t('monitoring.subtitleTahfiz') : t('monitoring.subtitle');

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl border border-slate-700 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500 rounded-full opacity-10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">{pageTitle}</h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{pageSubtitle}</p>
          </div>
          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-600 pt-6 sm:pt-0 sm:pl-8">
            <div className="text-4xl sm:text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">{currentTime}</div>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">{t('monitoring.waktuSaatIni')}</p>
          </div>
        </div>
      </div>

      {showUmum && (
      <>
      <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        {filters.map((filter, index) => {
          const isLast = index === filters.length - 1;
          const isSecondRow = index >= 3; // Card ke-4 dan ke-5 (baris kedua)

          // Mobile (grid-cols-2): card terakhir full-width (col-span-2)
          // sm (grid-cols-6): 
          //   - Baris pertama (index 0-2): sm:col-span-2 (3 card sama lebar, total 6 kolom)
          //   - Baris kedua (index 3-4): sm:col-span-3 (2 card sama lebar, full width)
          // lg (grid-cols-5): semua card satu kolom
          let colSpanClasses = "lg:col-span-1";
          
          if (isSecondRow) {
            // Card di baris kedua: col-span-3 di sm (full width, sama lebar)
            colSpanClasses += " sm:col-span-3";
          } else {
            // Card di baris pertama: col-span-2 di sm (sama lebar)
            colSpanClasses += " sm:col-span-2";
          }
          
          if (isLast) {
            colSpanClasses += " col-span-2";
          }

          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`
                relative group p-4 sm:p-6 rounded-2xl text-center transition-all duration-300 transform
                ${statusFilter === filter.value
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl scale-105 ring-2 ring-blue-400'
                  : 'bg-white border border-gray-200 hover:shadow-lg hover:scale-102 hover:border-gray-300'
                }
                ${colSpanClasses}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                  statusFilter === filter.value ? 'text-white' : 'text-gray-900'
                }`}>
                  {filter.count}
                </div>
                <div className={`text-xs sm:text-sm font-semibold mt-2 line-clamp-2 leading-tight ${
                  statusFilter === filter.value ? 'text-slate-200' : 'text-gray-600'
                }`}>
                  {filter.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="border border-gray-200 shadow-xl bg-white">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center mb-2">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-teal-500 rounded-full mr-4"></div>
                <span>{t('monitoring.daftarKelas')}</span>
              </h2>
              <p className="text-sm text-gray-500 ml-7">{t('monitoring.totalKelas', { count: filteredData.length })}</p>
            </div>
          </div>

          {filteredData.length > 0 ? (
            <>
              {/* Mobile: Card list */}
              <div className="space-y-3 md:hidden">
                {filteredData.map(kelasMonitor => (
                  <KelasMonitoringCard key={kelasMonitor.kelasId} data={kelasMonitor} t={t} />
                ))}
              </div>
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                  <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                      <tr>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {t('monitoring.kelas')}
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {t('monitoring.status')}
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {t('monitoring.jamPelajaran')}
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {t('monitoring.mataPelajaran')}
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {t('monitoring.guru')}
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {t('monitoring.sesiInfo')}
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {t('monitoring.jadwalHariIni')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map(kelasMonitor => (
                        <KelasMonitoringRow key={kelasMonitor.kelasId} data={kelasMonitor} t={t} />
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 sm:py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full mb-6">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('monitoring.tidakAdaData')}</h3>
              <p className="text-gray-500 text-sm sm:text-base">{t('monitoring.tidakAdaKelasStatus')}</p>
            </div>
          )}
        </div>
      </Card>
      </>
      )}

      {showTahfiz && <MonitoringKelasTahfizSection />}

      {/* Satu section Keterangan Status di akhir: umum & umum+tahfiz pakai label Guru, tahfiz saja pakai label Ustadz */}
      {(showUmum || showTahfiz) && (
        <Card className="border border-gray-200 shadow-xl bg-white">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${onlyTahfiz ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-teal-500'}`}>
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('monitoring.keteranganStatus')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              <StatusDescriptionCard
                icon={<BookOpen className="w-6 h-6" />}
                iconBgColor="bg-gray-100"
                iconColor="text-gray-600"
                title={t('monitoring.jadwalKosong')}
                description={onlyTahfiz ? t('monitoring.descJadwalKosongTahfiz') : t('monitoring.descJadwalKosong')}
              />
              <StatusDescriptionCard
                icon={<Clock className="w-6 h-6" />}
                iconBgColor="bg-amber-100"
                iconColor="text-amber-600"
                title={onlyTahfiz ? t('monitoring.belumAdaUstadz') : t('monitoring.belumAdaGuru')}
                description={onlyTahfiz ? t('monitoring.descBelumAdaUstadz') : t('monitoring.descBelumAdaGuru')}
              />
              <StatusDescriptionCard
                icon={<CheckCircle2 className="w-6 h-6" />}
                iconBgColor="bg-emerald-100"
                iconColor="text-emerald-600"
                title={onlyTahfiz ? t('monitoring.sudahAdaUstadz') : t('monitoring.sudahAdaGuru')}
                description={onlyTahfiz ? t('monitoring.descSudahAdaUstadz') : t('monitoring.descSudahAdaGuru')}
              />
              <StatusDescriptionCard
                icon={<Users className="w-6 h-6" />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                title={onlyTahfiz ? t('monitoring.sesiTahfizDitutup') : t('monitoring.sesiDitutup')}
                description={onlyTahfiz ? t('monitoring.descSesiTahfizDitutup') : t('monitoring.descSesiDitutup')}
              />
            </div>
          </div>
        </Card>
      )}

    </div>
  );
};

const getStatusLabelKey = (status: MonitoringStatus): string => {
  const keyMap: Record<MonitoringStatus, string> = {
    jadwal_kosong: 'monitoring.jadwalKosong',
    belum_ada_guru: 'monitoring.belumAdaGuru',
    sudah_ada_guru: 'monitoring.sudahAdaGuru',
    sesi_ditutup: 'monitoring.statusSesiPelajaranDitutup',
  };
  return keyMap[status] || 'monitoring.jadwalKosong';
};

const KelasMonitoringCard: React.FC<KelasMonitoringRowProps> = ({ data, t }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const getStatusIcon = (status: MonitoringStatus) => {
    const iconMap: Record<MonitoringStatus, React.ReactNode> = {
      jadwal_kosong: <BookOpen className="w-5 h-5 text-gray-500" />,
      belum_ada_guru: <Clock className="w-5 h-5 text-amber-600" />,
      sudah_ada_guru: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      sesi_ditutup: <Users className="w-5 h-5 text-blue-600" />,
    };
    return iconMap[status];
  };
  const getStatusRowColor = (status: MonitoringStatus) => {
    const colorMap: Record<MonitoringStatus, string> = {
      jadwal_kosong: 'bg-white border-gray-200',
      belum_ada_guru: 'bg-amber-50/50 border-amber-200',
      sudah_ada_guru: 'bg-emerald-50/50 border-emerald-200',
      sesi_ditutup: 'bg-blue-50/50 border-blue-200',
    };
    return colorMap[status];
  };
  const getStatusBadgeVariant = (status: MonitoringStatus): 'success' | 'warning' | 'secondary' | 'info' => {
    switch (status) {
      case 'jadwal_kosong': return 'secondary';
      case 'belum_ada_guru': return 'warning';
      case 'sudah_ada_guru': return 'success';
      case 'sesi_ditutup': return 'info';
      default: return 'secondary';
    }
  };
  const hasJadwalHariIni = data.allJadwalHariIni && data.allJadwalHariIni.length > 0;

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${getStatusRowColor(data.currentStatus)}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {getStatusIcon(data.currentStatus)}
            <span className="font-bold text-gray-900 truncate">{data.kelasName}</span>
          </div>
          <span className="flex-shrink-0">
            <Badge variant={getStatusBadgeVariant(data.currentStatus)} size="sm">
              {t(getStatusLabelKey(data.currentStatus))}
            </Badge>
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('monitoring.jamPelajaran')}</span>
            <span className="font-medium text-gray-800">
              {data.jadwalInfo ? `${data.jadwalInfo.jamMulai} - ${data.jadwalInfo.jamSelesai}` : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('monitoring.mataPelajaran')}</span>
            <span className="font-medium text-gray-800 truncate ml-2">
              {data.jadwalInfo?.mataPelajaranName || '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('monitoring.guru')}</span>
            <span className="font-medium text-gray-800 truncate ml-2">
              {data.jadwalInfo?.guruName || '-'}
            </span>
          </div>
          {data.sesiInfo && (
            <div className="flex justify-between items-start">
              <span className="text-gray-500">{t('monitoring.sesiInfo')}</span>
              <span className="text-gray-800 text-right">
                {data.sesiInfo.jamBuka && <span className="text-emerald-700">{t('monitoring.buka')} {data.sesiInfo.jamBuka}</span>}
                {data.sesiInfo.jamBuka && data.sesiInfo.jamTutup && ' · '}
                {data.sesiInfo.jamTutup && <span className="text-blue-700">{t('monitoring.tutup')} {data.sesiInfo.jamTutup}</span>}
              </span>
            </div>
          )}
        </div>
        {hasJadwalHariIni && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 w-full justify-between py-2"
          >
            <span>{t('monitoring.countJadwal', { count: data.allJadwalHariIni!.length })}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
        {isExpanded && hasJadwalHariIni && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-bold text-gray-800">{t('monitoring.jadwalHariIni')}</span>
            </div>
            <div className="space-y-2">
              {data.allJadwalHariIni!.map((jadwal, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
                  <span className="bg-slate-700 text-white px-2 py-0.5 rounded text-xs font-bold">{jadwal.jamMulai}</span>
                  <span className="text-sm text-gray-700 truncate flex-1">{jadwal.mataPelajaranName || '-'}</span>
                  {jadwal.guruName && <span className="text-xs text-gray-500 truncate">({jadwal.guruName})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface KelasMonitoringRowProps {
  data: KelasMonitoring;
  t: (key: string, params?: Record<string, any>) => string;
}

const KelasMonitoringRow: React.FC<KelasMonitoringRowProps> = ({ data, t }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: MonitoringStatus) => {
    const iconMap: Record<MonitoringStatus, React.ReactNode> = {
      jadwal_kosong: <BookOpen className="w-5 h-5 text-gray-500" />,
      belum_ada_guru: <Clock className="w-5 h-5 text-amber-600" />,
      sudah_ada_guru: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      sesi_ditutup: <Users className="w-5 h-5 text-blue-600" />,
    };
    return iconMap[status];
  };

  const getStatusRowColor = (status: MonitoringStatus) => {
    const colorMap: Record<MonitoringStatus, string> = {
      jadwal_kosong: 'bg-white hover:bg-gray-50',
      belum_ada_guru: 'bg-amber-50/50 hover:bg-amber-50',
      sudah_ada_guru: 'bg-emerald-50/50 hover:bg-emerald-50',
      sesi_ditutup: 'bg-blue-50/50 hover:bg-blue-50',
    };
    return colorMap[status];
  };

  const getStatusBadgeVariant = (status: MonitoringStatus): 'success' | 'warning' | 'secondary' | 'info' => {
    switch (status) {
      case 'jadwal_kosong':
        return 'secondary';
      case 'belum_ada_guru':
        return 'warning';
      case 'sudah_ada_guru':
        return 'success';
      case 'sesi_ditutup':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const hasJadwalHariIni = data.allJadwalHariIni && data.allJadwalHariIni.length > 0;

  return (
    <>
      <tr className={`${getStatusRowColor(data.currentStatus)} transition-colors duration-150`}>
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {getStatusIcon(data.currentStatus)}
            </div>
            <div className="text-sm font-bold text-gray-900">{data.kelasName}</div>
          </div>
        </td>
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
          <Badge variant={getStatusBadgeVariant(data.currentStatus)} size="sm">
            {t(getStatusLabelKey(data.currentStatus))}
          </Badge>
        </td>
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
          {data.jadwalInfo ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <span className="font-semibold">
                {data.jadwalInfo.jamMulai} - {data.jadwalInfo.jamSelesai}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">-</span>
          )}
        </td>
        <td className="px-4 sm:px-6 py-4">
          <div className="text-sm text-gray-700">
            {data.jadwalInfo?.mataPelajaranName ? (
              <span className="font-medium">{data.jadwalInfo.mataPelajaranName}</span>
            ) : (
              <span className="text-gray-400 italic">-</span>
            )}
          </div>
        </td>
        <td className="px-4 sm:px-6 py-4">
          <div className="text-sm text-gray-700">
            {data.jadwalInfo?.guruName ? (
              <span className="font-medium">{data.jadwalInfo.guruName}</span>
            ) : (
              <span className="text-gray-400 italic">-</span>
            )}
          </div>
        </td>
        <td className="px-4 sm:px-6 py-4">
          {data.sesiInfo ? (
            <div className="text-sm space-y-1">
              {data.sesiInfo.jamBuka && (
                <div className="text-gray-700">
                  <span className="text-xs text-gray-500">{t('monitoring.buka')}: </span>
                  <span className="font-medium text-emerald-700">{data.sesiInfo.jamBuka}</span>
                </div>
              )}
              {data.sesiInfo.jamTutup && (
                <div className="text-gray-700">
                  <span className="text-xs text-gray-500">{t('monitoring.tutup')}: </span>
                  <span className="font-medium text-blue-700">{data.sesiInfo.jamTutup}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">-</span>
          )}
        </td>
        <td className="px-4 sm:px-6 py-4">
          {hasJadwalHariIni ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>{t('monitoring.countJadwal', { count: data.allJadwalHariIni!.length })}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="text-sm text-gray-400 italic">-</span>
          )}
        </td>
      </tr>
      {isExpanded && hasJadwalHariIni && (
        <tr className={`${getStatusRowColor(data.currentStatus)}`}>
          <td colSpan={7} className="px-4 sm:px-6 py-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <h4 className="text-sm font-bold text-gray-800">{t('monitoring.jadwalHariIni')}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.allJadwalHariIni!.map((jadwal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <span className="inline-block bg-gradient-to-r from-slate-700 to-slate-800 text-white px-2.5 py-1 rounded text-xs font-bold flex-shrink-0 whitespace-nowrap">
                      {jadwal.jamMulai}
                    </span>
                    <span className="text-xs text-gray-700 font-medium truncate flex-1">
                      {jadwal.mataPelajaranName || '-'}
                    </span>
                    {jadwal.guruName && (
                      <span className="text-xs text-gray-500 truncate hidden sm:inline">
                        ({jadwal.guruName})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

interface StatusDescriptionCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
}

const StatusDescriptionCard: React.FC<StatusDescriptionCardProps> = ({
  icon,
  iconBgColor,
  iconColor,
  title,
  description,
}) => {
  return (
    <div className="p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <div className={`${iconColor}`}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm sm:text-base mb-1.5">{title}</p>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default MonitoringKelas;
