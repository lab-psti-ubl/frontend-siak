import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, Users } from 'lucide-react';
import { User } from '../../../../types';
import { useSantri } from '../../../../hooks/useSantri';
import { ProgressHafalan } from '../../../../hooks/useProgressHafalan';
import { apiService } from '../../../../services/apiService';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import { useLanguage } from '../../../../context/LanguageContext';

interface SantriStatistics {
  juz: number;
  surah: number;
  ayat: number;
}

const DataSantriKepalaSekolah: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { santri } = useSantri();
  const [searchTerm, setSearchTerm] = useState('');
  const [progressData, setProgressData] = useState<ProgressHafalan[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const currentYear = new Date().getFullYear().toString();

  const filteredSantri = santri.filter(santriItem => {
    if (!santriItem) return false;
    const matchesSearch = (santriItem.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (santriItem.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ((santriItem as any).nisn && String((santriItem as any).nisn || '').toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Fetch all progress hafalan data
  useEffect(() => {
    const fetchProgressData = async () => {
      setProgressLoading(true);
      try {
        const response = await apiService.getAllProgressHafalan(currentYear);
        if (response.success && response.data) {
          setProgressData(response.data);
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgressData();
  }, [currentYear]);

  // Calculate statistics for each santri
  const santriStatistics = useMemo(() => {
    const statsMap = new Map<string, SantriStatistics>();
    
    // Initialize all santri with zero stats
    santri.forEach((s) => {
      statsMap.set(s.id, { juz: 0, surah: 0, ayat: 0 });
    });

    // Filter progress data to only include completed hafalan (Mumtaz or Jayid Jiddan)
    const completedProgress = progressData.filter(
      (p) => p.hasilTes === 'Mumtaz' || p.hasilTes === 'Jayid Jiddan'
    );

    // Group progress by santriId
    const progressBySantri = new Map<string, ProgressHafalan[]>();
    completedProgress.forEach((progress) => {
      if (!progressBySantri.has(progress.santriId)) {
        progressBySantri.set(progress.santriId, []);
      }
      progressBySantri.get(progress.santriId)!.push(progress);
    });

    // Calculate statistics for each santri
    progressBySantri.forEach((progressList, santriId) => {
      const juzSet = new Set<number>();
      const surahSet = new Set<string>();
      let totalAyat = 0;

      progressList.forEach((progress) => {
        juzSet.add(progress.juz);
        surahSet.add(progress.surat.toLowerCase().trim());
        const ayatCount = progress.ayatSampai - progress.ayatDari + 1;
        totalAyat += ayatCount;
      });

      statsMap.set(santriId, {
        juz: juzSet.size,
        surah: surahSet.size,
        ayat: totalAyat,
      });
    });

    return statsMap;
  }, [progressData, santri]);

  const handleViewProgress = (santriItem: User) => {
    navigate(`/dashboard/data-santri-kepala-sekolah/${santriItem.id}`);
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.dataSantriKepalaSekolah')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {t('tahfiz.dataSantriKepalaSekolahDesc')} {santri.length > 0 && `(${santri.length} ${t('tahfiz.santri')})`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder={t('tahfiz.cariSantri')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            {t('tahfiz.menampilkan')} <span className="font-semibold text-slate-900">{filteredSantri.length}</span> {t('tahfiz.dari')} <span className="font-semibold text-slate-900">{santri.length}</span> {t('tahfiz.santri')}
          </div>
        </div>
      </div>

      {/* Santri List - Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.daftarSantri')}</h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableCell header className="text-sm">{t('tahfiz.santriLabel')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.nisn')}</TableCell>
                <TableCell header className="text-sm text-center">{t('tahfiz.juz')}</TableCell>
                <TableCell header className="text-sm text-center">{t('tahfiz.surah')}</TableCell>
                <TableCell header className="text-sm text-center">{t('tahfiz.ayat')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.aksi')}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSantri.map((santriItem) => {
                const stats = santriStatistics.get(santriItem.id) || { juz: 0, surah: 0, ayat: 0 };
                return (
                  <TableRow key={santriItem.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-medium flex-shrink-0 text-sm">
                          {santriItem.profileImage ? (
                            <img src={santriItem.profileImage} alt={santriItem.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(santriItem.name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm truncate">{santriItem.name || t('tahfiz.tidakAdaNama')}</p>
                          <p className="text-xs text-slate-500 truncate">{santriItem.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono truncate">
                        {(santriItem as any).nisn || '-'}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs">
                        {stats.juz}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-green-100 text-green-800 font-semibold text-xs">
                        {stats.surah}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold text-xs">
                        {stats.ayat}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewProgress(santriItem)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.lihatDetail')}
                      >
                        <Eye size={14} className="mr-2" />
                        {t('tahfiz.lihatProgress')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredSantri.length === 0 && (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasilPencarian') : t('tahfiz.belumAdaDataSantri')}
            </h3>
            <p className="text-sm text-slate-600">
              {searchTerm ? t('tahfiz.tidakDitemukanSantriDenganKataKunci', { searchTerm }) : t('tahfiz.tambahSantriUntukMemulai')}
            </p>
          </div>
        )}
      </div>

      {/* Santri List - Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredSantri.length > 0 ? (
          filteredSantri.map((santriItem) => {
            const stats = santriStatistics.get(santriItem.id) || { juz: 0, surah: 0, ayat: 0 };
            return (
              <div key={santriItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 space-y-3">
                  {/* Santri Info Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {santriItem.profileImage ? (
                        <img src={santriItem.profileImage} alt={santriItem.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(santriItem.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{santriItem.name}</p>
                      <p className="text-xs text-slate-500 truncate">{santriItem.email}</p>
                      <p className="text-xs text-slate-600 mt-1">{t('tahfiz.nisn')}: {(santriItem as any).nisn || '-'}</p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">{t('tahfiz.juz')}</p>
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs w-full">
                        {stats.juz}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">{t('tahfiz.surah')}</p>
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-green-100 text-green-800 font-semibold text-xs w-full">
                        {stats.surah}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">{t('tahfiz.ayat')}</p>
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold text-xs w-full">
                        {stats.ayat}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewProgress(santriItem)}
                      className="w-full text-xs flex items-center justify-center"
                    >
                      <Eye size={12} className="mr-1" />
                      {t('tahfiz.lihatProgress')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasilPencarian') : t('tahfiz.belumAdaDataSantri')}
            </h3>
            <p className="text-xs text-slate-600">
              {searchTerm ? t('tahfiz.tidakDitemukanSantriDenganKataKunci', { searchTerm }) : t('tahfiz.tambahSantriUntukMemulai')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSantriKepalaSekolah;
