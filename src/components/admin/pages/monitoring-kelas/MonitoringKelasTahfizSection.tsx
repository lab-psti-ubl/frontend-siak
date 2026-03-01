import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, BookOpen, Users, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { useMonitoringKelasTahfiz } from '../../../../hooks/useMonitoringKelasTahfiz';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useJadwalTahfiz } from '../../../../hooks/useJadwalTahfiz';
import { useSesiAbsensiTahfiz } from '../../../../hooks/useSesiAbsensiTahfiz';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import type { TahfizClass } from '../../../../utils/monitoringKelasTahfizUtils';
import {
  KelasTahfizMonitoring,
  MonitoringStatusTahfiz,
} from '../../../../utils/monitoringKelasTahfizUtils';
import { useLanguage } from '../../../../context/LanguageContext';

type StatusFilterTahfiz = 'semua' | 'jadwal_kosong' | 'belum_ada_guru' | 'sudah_ada_guru' | 'sesi_ditutup';

const getStatusLabelKeyTahfiz = (status: MonitoringStatusTahfiz): string => {
  const keyMap: Record<MonitoringStatusTahfiz, string> = {
    jadwal_kosong: 'monitoring.jadwalKosong',
    belum_ada_guru: 'monitoring.belumAdaUstadz',
    sudah_ada_guru: 'monitoring.sudahAdaUstadz',
    sesi_ditutup: 'monitoring.sesiTahfizDitutup',
  };
  return keyMap[status] || 'monitoring.jadwalKosong';
};

const MonitoringKelasTahfizSection: React.FC = () => {
  const { t } = useLanguage();
  const { kelasTahfiz } = useKelasTahfiz();
  const { jadwalTahfiz } = useJadwalTahfiz();
  const { sesiAbsensiTahfiz } = useSesiAbsensiTahfiz();
  const { gurus } = useGurus();
  const { murid } = useMurid();

  const users = React.useMemo(() => [...gurus, ...murid], [gurus, murid]);
  const kelasTahfizTyped = kelasTahfiz as TahfizClass[];

  const monitoringData = useMonitoringKelasTahfiz(
    kelasTahfizTyped,
    jadwalTahfiz,
    sesiAbsensiTahfiz,
    users
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilterTahfiz>('semua');

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
    value: StatusFilterTahfiz;
    count: number;
    color: string;
  }> = [
    { label: t('monitoring.semua'), value: 'semua', count: stats.total, color: 'bg-gray-100' },
    { label: t('monitoring.jadwalKosong'), value: 'jadwal_kosong', count: stats.jadwalKosong, color: 'bg-gray-50' },
    { label: t('monitoring.belumAdaUstadz'), value: 'belum_ada_guru', count: stats.belumAdaGuru, color: 'bg-yellow-50' },
    { label: t('monitoring.sudahAdaUstadz'), value: 'sudah_ada_guru', count: stats.sudahAdaGuru, color: 'bg-emerald-50' },
    { label: t('monitoring.sesiDitutup'), value: 'sesi_ditutup', count: stats.sesiDitutup, color: 'bg-blue-50' },
  ];

  const getStatusIcon = (status: MonitoringStatusTahfiz) => {
    const iconMap: Record<MonitoringStatusTahfiz, React.ReactNode> = {
      jadwal_kosong: <BookOpen className="w-5 h-5 text-gray-500" />,
      belum_ada_guru: <Clock className="w-5 h-5 text-amber-600" />,
      sudah_ada_guru: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      sesi_ditutup: <Users className="w-5 h-5 text-blue-600" />,
    };
    return iconMap[status];
  };

  const getStatusRowColor = (status: MonitoringStatusTahfiz) => {
    const colorMap: Record<MonitoringStatusTahfiz, string> = {
      jadwal_kosong: 'bg-white hover:bg-gray-50',
      belum_ada_guru: 'bg-amber-50/50 hover:bg-amber-50',
      sudah_ada_guru: 'bg-emerald-50/50 hover:bg-emerald-50',
      sesi_ditutup: 'bg-blue-50/50 hover:bg-blue-50',
    };
    return colorMap[status];
  };

  const getStatusBadgeVariant = (status: MonitoringStatusTahfiz): 'success' | 'warning' | 'secondary' | 'info' => {
    switch (status) {
      case 'jadwal_kosong': return 'secondary';
      case 'belum_ada_guru': return 'warning';
      case 'sudah_ada_guru': return 'success';
      case 'sesi_ditutup': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-10 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('monitoring.titleTahfiz')}</h2>
          <p className="text-sm text-gray-500">{t('monitoring.subtitleTahfiz')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-5 gap-3 sm:gap-4">
        {filters.map((filter, index) => {
          const isSecondRow = index >= 3;
          let colSpanClasses = 'lg:col-span-1';
          colSpanClasses += isSecondRow ? ' sm:col-span-3' : ' sm:col-span-2';
          if (index === filters.length - 1) colSpanClasses += ' col-span-2';
          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`
                relative group p-4 sm:p-6 rounded-2xl text-center transition-all duration-300
                ${statusFilter === filter.value
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl scale-105 ring-2 ring-violet-400'
                  : 'bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300'
                }
                ${colSpanClasses}
              `}
            >
              <div className="relative z-10">
                <div className={`text-2xl sm:text-3xl font-bold ${statusFilter === filter.value ? 'text-white' : 'text-gray-900'}`}>
                  {filter.count}
                </div>
                <div className={`text-xs sm:text-sm font-semibold mt-2 line-clamp-2 ${statusFilter === filter.value ? 'text-slate-200' : 'text-gray-600'}`}>
                  {filter.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="border border-gray-200 shadow-xl bg-white">
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center mb-1">
              <span className="w-1.5 h-6 bg-violet-500 rounded-full mr-3" />
              {t('monitoring.daftarKelasTahfiz')}
            </h3>
            <p className="text-sm text-gray-500 ml-7">{t('monitoring.totalKelasTahfiz', { count: filteredData.length })}</p>
          </div>

          {filteredData.length > 0 ? (
            <>
              {/* Mobile: Card list */}
              <div className="space-y-3 md:hidden">
                {filteredData.map(row => (
                  <KelasTahfizMonitoringCard
                    key={row.kelasId}
                    data={row}
                    t={t}
                    getStatusIcon={getStatusIcon}
                    getStatusRowColor={getStatusRowColor}
                    getStatusBadgeVariant={getStatusBadgeVariant}
                  />
                ))}
              </div>
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                  <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                      <tr>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{t('monitoring.kelasTahfiz')}</th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{t('monitoring.status')}</th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{t('monitoring.jam')}</th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{t('monitoring.ustadz')}</th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{t('monitoring.sesiInfo')}</th>
                        <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{t('monitoring.jadwalHariIni')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map(row => (
                        <KelasTahfizMonitoringRow
                          key={row.kelasId}
                          data={row}
                          t={t}
                          getStatusIcon={getStatusIcon}
                          getStatusRowColor={getStatusRowColor}
                          getStatusBadgeVariant={getStatusBadgeVariant}
                        />
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('monitoring.tidakAdaData')}</h3>
              <p className="text-gray-500 text-sm">{t('monitoring.tidakAdaKelasTahfizStatus')}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const getStatusCardColor = (status: MonitoringStatusTahfiz): string => {
  const colorMap: Record<MonitoringStatusTahfiz, string> = {
    jadwal_kosong: 'bg-white border-gray-200',
    belum_ada_guru: 'bg-amber-50/50 border-amber-200',
    sudah_ada_guru: 'bg-emerald-50/50 border-emerald-200',
    sesi_ditutup: 'bg-blue-50/50 border-blue-200',
  };
  return colorMap[status];
};

interface KelasTahfizMonitoringCardProps {
  data: KelasTahfizMonitoring;
  t: (key: string, params?: Record<string, any>) => string;
  getStatusIcon: (s: MonitoringStatusTahfiz) => React.ReactNode;
  getStatusRowColor: (s: MonitoringStatusTahfiz) => string;
  getStatusBadgeVariant: (s: MonitoringStatusTahfiz) => 'success' | 'warning' | 'secondary' | 'info';
}

const KelasTahfizMonitoringCard: React.FC<KelasTahfizMonitoringCardProps> = ({
  data,
  t,
  getStatusIcon,
  getStatusBadgeVariant,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasJadwalHariIni = data.allJadwalHariIni && data.allJadwalHariIni.length > 0;

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${getStatusCardColor(data.currentStatus)}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {getStatusIcon(data.currentStatus)}
            <span className="font-bold text-gray-900 truncate">{data.kelasName}</span>
          </div>
          <span className="flex-shrink-0">
            <Badge variant={getStatusBadgeVariant(data.currentStatus)} size="sm">
              {t(getStatusLabelKeyTahfiz(data.currentStatus))}
            </Badge>
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('monitoring.jam')}</span>
            <span className="font-medium text-gray-800">
              {data.jadwalInfo ? `${data.jadwalInfo.jamMulai} - ${data.jadwalInfo.jamSelesai}` : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('monitoring.ustadz')}</span>
            <span className="font-medium text-gray-800 truncate ml-2">
              {data.jadwalInfo?.ustadzName || '-'}
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
            className="mt-3 flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-800 w-full justify-between py-2"
          >
            <span>{t('monitoring.countJadwal', { count: data.allJadwalHariIni!.length })}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
        {isExpanded && hasJadwalHariIni && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-bold text-gray-800">{t('monitoring.jadwalTahfizHariIni')}</span>
            </div>
            <div className="space-y-2">
              {data.allJadwalHariIni!.map((jadwal, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-violet-100">
                  <span className="bg-violet-700 text-white px-2 py-0.5 rounded text-xs font-bold">{jadwal.jamMulai}</span>
                  <span className="text-sm text-gray-700 truncate flex-1">{jadwal.ustadzName || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface KelasTahfizMonitoringRowProps {
  data: KelasTahfizMonitoring;
  t: (key: string, params?: Record<string, any>) => string;
  getStatusIcon: (s: MonitoringStatusTahfiz) => React.ReactNode;
  getStatusRowColor: (s: MonitoringStatusTahfiz) => string;
  getStatusBadgeVariant: (s: MonitoringStatusTahfiz) => 'success' | 'warning' | 'secondary' | 'info';
}

const KelasTahfizMonitoringRow: React.FC<KelasTahfizMonitoringRowProps> = ({
  data,
  t,
  getStatusIcon,
  getStatusRowColor,
  getStatusBadgeVariant,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasJadwalHariIni = data.allJadwalHariIni && data.allJadwalHariIni.length > 0;

  return (
    <>
      <tr className={`${getStatusRowColor(data.currentStatus)} transition-colors duration-150`}>
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">{getStatusIcon(data.currentStatus)}</div>
            <div className="text-sm font-bold text-gray-900">{data.kelasName}</div>
          </div>
        </td>
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
          <Badge variant={getStatusBadgeVariant(data.currentStatus)} size="sm">
            {t(getStatusLabelKeyTahfiz(data.currentStatus))}
          </Badge>
        </td>
        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
          {data.jadwalInfo ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <span className="font-semibold">{data.jadwalInfo.jamMulai} - {data.jadwalInfo.jamSelesai}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">-</span>
          )}
        </td>
        <td className="px-4 sm:px-6 py-4">
          <div className="text-sm text-gray-700">
            {data.jadwalInfo?.ustadzName ? (
              <span className="font-medium">{data.jadwalInfo.ustadzName}</span>
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
              className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-800"
            >
              <span>{t('monitoring.countJadwal', { count: data.allJadwalHariIni!.length })}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          ) : (
            <span className="text-sm text-gray-400 italic">-</span>
          )}
        </td>
      </tr>
      {isExpanded && hasJadwalHariIni && (
        <tr className={getStatusRowColor(data.currentStatus)}>
          <td colSpan={6} className="px-4 sm:px-6 py-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <h4 className="text-sm font-bold text-gray-800">{t('monitoring.jadwalTahfizHariIni')}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.allJadwalHariIni!.map((jadwal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-100"
                  >
                    <span className="inline-block bg-violet-700 text-white px-2.5 py-1 rounded text-xs font-bold flex-shrink-0 whitespace-nowrap">
                      {jadwal.jamMulai}
                    </span>
                    <span className="text-xs text-gray-700 font-medium truncate flex-1">
                      {jadwal.ustadzName || '-'}
                    </span>
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

export default MonitoringKelasTahfizSection;
