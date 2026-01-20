import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Search,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../hooks/useSantri';
import { User } from '../../../../types';
import { apiService } from '../../../../services/apiService';
import { ProgressHafalan } from '../../../../hooks/useProgressHafalan';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';

interface SantriStatistics {
  juz: number;
  surah: number;
  ayat: number;
}

const ProgressTahfiz: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { kelasTahfiz, loading: classesLoading } = useKelasTahfiz();
  const { santri } = useSantri();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [progressData, setProgressData] = useState<ProgressHafalan[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);

  // Fetch progress hafalan data
  useEffect(() => {
    const fetchProgressData = async () => {
      setProgressLoading(true);
      try {
        const currentYear = new Date().getFullYear().toString();
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
  }, []);

  // Get all santri from classes where the logged-in guru is the ustadz
  const myClasses = useMemo(() => {
    if (!user?.id) return [];
    return kelasTahfiz.filter((cls) => cls.ustadzId === user.id);
  }, [kelasTahfiz, user?.id]);

  const allMySantri = useMemo(() => {
    const santriIds = new Set<string>();
    myClasses.forEach((cls) => {
      cls.santriIds.forEach((id) => santriIds.add(id));
    });
    return santri
      .filter((s) => santriIds.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [myClasses, santri]);

  // Calculate statistics for each santri
  const santriStatistics = useMemo(() => {
    const statsMap = new Map<string, SantriStatistics>();
    
    // Initialize all santri with zero stats
    allMySantri.forEach((s) => {
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
        // Count unique juz
        juzSet.add(progress.juz);

        // Count unique surah
        surahSet.add(progress.surat.toLowerCase().trim());

        // Count total verses (ayatSampai - ayatDari + 1)
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
  }, [progressData, allMySantri]);

  const filteredSantri = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return allMySantri.filter((s) => {
      const name = s.name.toLowerCase();
      const email = (s.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [allMySantri, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSantri.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSantri = filteredSantri.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleViewProgress = (santriItem: User) => {
    navigate(`/dashboard/progress-tahfiz/${santriItem.id}`);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.guruTahfiz.progressTahfiz.title')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {t('tahfiz.guruTahfiz.progressTahfiz.subtitle')}
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
                placeholder={t('tahfiz.guruTahfiz.progressTahfiz.cariNamaSantriEmail')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            {t('tahfiz.guruTahfiz.progressTahfiz.menampilkan')} <span className="font-semibold text-slate-900">{filteredSantri.length}</span> {t('tahfiz.guruTahfiz.progressTahfiz.dari')}{' '}
            <span className="font-semibold text-slate-900">{allMySantri.length}</span> {t('tahfiz.guruTahfiz.progressTahfiz.santri')}
            {filteredSantri.length > 0 && (
              <span className="ml-2">
                ({t('tahfiz.guruTahfiz.progressTahfiz.halaman')} {currentPage} {t('tahfiz.guruTahfiz.progressTahfiz.dari')} {totalPages})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.guruTahfiz.progressTahfiz.daftarSantri')}</h3>
        </div>
        {classesLoading || progressLoading ? (
          <div className="text-center py-12 px-6">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">Memuat data santri...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableCell header className="text-sm">
                    {t('tahfiz.guruTahfiz.progressTahfiz.namaSantri')}
                  </TableCell>
                  <TableCell header className="text-sm">
                    {t('tahfiz.guruTahfiz.progressTahfiz.email')}
                  </TableCell>
                  <TableCell header className="text-sm text-center">
                    {t('tahfiz.guruTahfiz.progressTahfiz.juz')}
                  </TableCell>
                  <TableCell header className="text-sm text-center">
                    {t('tahfiz.guruTahfiz.progressTahfiz.surah')}
                  </TableCell>
                  <TableCell header className="text-sm text-center">
                    {t('tahfiz.guruTahfiz.progressTahfiz.ayat')}
                  </TableCell>
                  <TableCell header className="text-sm">
                    {t('tahfiz.guruTahfiz.progressTahfiz.aksi')}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSantri.map((santriItem) => {
                  const stats = santriStatistics.get(santriItem.id) || { juz: 0, surah: 0, ayat: 0 };
                  return (
                    <TableRow key={santriItem.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-sm font-medium text-slate-900">{santriItem.name}</TableCell>
                      <TableCell className="text-sm">{santriItem.email || '-'}</TableCell>
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
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleViewProgress(santriItem)}
                            className="!p-2 flex items-center justify-center"
                            title={t('tahfiz.guruTahfiz.progressTahfiz.lihatProgress')}
                          >
                            <Eye size={14} className="mr-2" />
                            {t('tahfiz.guruTahfiz.progressTahfiz.lihatProgress')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {!classesLoading && !progressLoading && filteredSantri.length > 0 && totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs sm:text-sm text-slate-600">
              {t('tahfiz.guruTahfiz.progressTahfiz.menampilkan')} {startIndex + 1} - {Math.min(endIndex, filteredSantri.length)} {t('tahfiz.guruTahfiz.progressTahfiz.dari')} {filteredSantri.length} {t('tahfiz.guruTahfiz.progressTahfiz.santri')}
            </p>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
                className="text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                    {t('tahfiz.guruTahfiz.progressTahfiz.sebelumnya')}
                  </Button>
                  <span className="text-xs sm:text-sm text-slate-600 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="sm"
                    className="text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    {t('tahfiz.guruTahfiz.progressTahfiz.selanjutnya')}
                  </Button>
            </div>
          </div>
        )}
        {!classesLoading && !progressLoading && filteredSantri.length === 0 && (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.guruTahfiz.progressTahfiz.tidakAdaHasil') : t('tahfiz.guruTahfiz.progressTahfiz.belumAdaDataSantri')}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchTerm ? t('tahfiz.guruTahfiz.progressTahfiz.ubahKataKunci') : t('tahfiz.guruTahfiz.progressTahfiz.belumMemilikiSantri')}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {classesLoading || progressLoading ? (
          <div className="text-center py-12 px-4">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">Memuat data santri...</p>
          </div>
        ) : filteredSantri.length > 0 ? (
          <>
            {paginatedSantri.map((santriItem) => {
              const stats = santriStatistics.get(santriItem.id) || { juz: 0, surah: 0, ayat: 0 };
              return (
                <div key={santriItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-base truncate">{santriItem.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{santriItem.email || '-'}</p>
                      </div>
                    </div>

                    {/* Statistics Row */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">{t('tahfiz.guruTahfiz.progressTahfiz.juz')}</p>
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs w-full">
                          {stats.juz}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">{t('tahfiz.guruTahfiz.progressTahfiz.surah')}</p>
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-green-100 text-green-800 font-semibold text-xs w-full">
                          {stats.surah}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">{t('tahfiz.guruTahfiz.progressTahfiz.ayat')}</p>
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold text-xs w-full">
                          {stats.ayat}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewProgress(santriItem)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Eye size={12} className="mr-1" />
                        {t('tahfiz.guruTahfiz.progressTahfiz.lihatProgress')}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {totalPages > 1 && (
              <div className="pt-4 border-t border-slate-200 flex flex-col items-center justify-between gap-4">
                <p className="text-xs text-slate-600">
                  {t('tahfiz.guruTahfiz.progressTahfiz.menampilkan')} {startIndex + 1} - {Math.min(endIndex, filteredSantri.length)} {t('tahfiz.guruTahfiz.progressTahfiz.dari')} {filteredSantri.length} {t('tahfiz.guruTahfiz.progressTahfiz.santri')}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="sm"
                    className="text-xs px-3 py-2"
                  >
                    {t('tahfiz.guruTahfiz.progressTahfiz.sebelumnya')}
                  </Button>
                  <span className="text-xs text-slate-600 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="sm"
                    className="text-xs px-3 py-2"
                  >
                    {t('tahfiz.guruTahfiz.progressTahfiz.selanjutnya')}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.guruTahfiz.progressTahfiz.tidakAdaHasil') : t('tahfiz.guruTahfiz.progressTahfiz.belumAdaDataSantri')}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm
                ? t('tahfiz.tidakDitemukanSantri') + ` "${searchTerm}"`
                : t('tahfiz.guruTahfiz.progressTahfiz.belumMemilikiSantri')
              }
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProgressTahfiz;
