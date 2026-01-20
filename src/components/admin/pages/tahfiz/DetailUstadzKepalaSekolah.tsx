import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, School, Users } from 'lucide-react';
import { User } from '../../../../types';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useKelasTahfiz, TahfizClass } from '../../../../hooks/useKelasTahfiz';
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

const DetailUstadzKepalaSekolah: React.FC = () => {
  const { t } = useLanguage();
  const { ustadzId } = useParams<{ ustadzId: string }>();
  const navigate = useNavigate();
  const { ustadz } = useUstadz();
  const { kelasTahfiz } = useKelasTahfiz();
  const { santri } = useSantri();
  const [progressData, setProgressData] = useState<ProgressHafalan[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const currentYear = new Date().getFullYear().toString();

  const selectedUstadz = useMemo(() => {
    return ustadz.find(u => u.id === ustadzId);
  }, [ustadz, ustadzId]);

  // Get classes for selected ustadz
  const selectedUstadzClasses = useMemo(() => {
    if (!ustadzId) return [];
    return kelasTahfiz.filter(cls => cls.ustadzId === ustadzId);
  }, [kelasTahfiz, ustadzId]);

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
    
    const santriIds = new Set<string>();
    selectedUstadzClasses.forEach(cls => {
      cls.santriIds.forEach(id => santriIds.add(id));
    });
    const selectedUstadzSantri = santri.filter(s => santriIds.has(s.id));

    // Initialize all santri with zero stats
    selectedUstadzSantri.forEach((s) => {
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
  }, [progressData, selectedUstadzClasses, santri]);

  // Group santri by class
  const santriByClass = useMemo(() => {
    const grouped = new Map<string, { kelas: TahfizClass; santri: User[] }>();
    
    selectedUstadzClasses.forEach(cls => {
      const santriInClass = cls.santriIds
        .map(id => santri.find(s => s.id === id))
        .filter(Boolean) as User[];
      
      if (santriInClass.length > 0) {
        grouped.set(cls.id, { kelas: cls, santri: santriInClass.sort((a, b) => a.name.localeCompare(b.name)) });
      }
    });

    return Array.from(grouped.values());
  }, [selectedUstadzClasses, santri]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleViewProgress = (santriItem: User) => {
    navigate(`/dashboard/data-santri-kepala-sekolah/${santriItem.id}`);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-green-700 via-green-700 to-green-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/dashboard/data-ustadz-kepala-sekolah')}
                className="!p-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                title="Kembali"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  Detail Ustadz
                </h1>
                <p className="text-sm sm:text-base text-green-100">
                  {selectedUstadz?.name || 'Ustadz'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ustadz Info Card */}
      {selectedUstadz && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-xl flex-shrink-0">
                {selectedUstadz.profileImage ? (
                  <img src={selectedUstadz.profileImage} alt={selectedUstadz.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(selectedUstadz.name)
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedUstadz.name}</h3>
                <p className="text-sm text-slate-600">{selectedUstadz.email}</p>
                {(selectedUstadz as any).nip && (
                  <p className="text-xs text-slate-500 mt-1">{t('tahfiz.nip')}: {(selectedUstadz as any).nip}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classes and Santri Section */}
      {selectedUstadzClasses.length > 0 ? (
        <>
          {santriByClass.map(({ kelas, santri: santriList }) => (
            <div key={kelas.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Class Header */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <School className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{kelas.namaKelas}</h3>
                    <p className="text-sm text-slate-600">{t('tahfiz.ruangan')}: {kelas.ruangan}</p>
                  </div>
                </div>
              </div>

              {/* Santri List */}
              <div className="p-6">
                {santriList.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableCell header className="text-sm">{t('tahfiz.santriLabel')}</TableCell>
                            <TableCell header className="text-sm text-center">{t('tahfiz.juz')}</TableCell>
                            <TableCell header className="text-sm text-center">{t('tahfiz.surah')}</TableCell>
                            <TableCell header className="text-sm text-center">{t('tahfiz.ayat')}</TableCell>
                            <TableCell header className="text-sm">{t('tahfiz.aksi')}</TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {santriList.map((santriItem) => {
                            const stats = santriStatistics.get(santriItem.id) || { juz: 0, surah: 0, ayat: 0 };
                            return (
                              <TableRow key={santriItem.id} className="hover:bg-slate-50">
                                <TableCell className="text-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                                      {santriItem.profileImage ? (
                                        <img src={santriItem.profileImage} alt={santriItem.name} className="w-full h-full object-cover" />
                                      ) : (
                                        getInitials(santriItem.name)
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-900 text-sm truncate">{santriItem.name}</p>
                                      <p className="text-xs text-slate-500 truncate">{santriItem.email}</p>
                                    </div>
                                  </div>
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
                                    title={t('tahfiz.lihatProgress')}
                                  >
                                    <Eye size={14} className="mr-2" />
                                    {t('tahfiz.progressHafalan')}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                      {santriList.map((santriItem) => {
                        const stats = santriStatistics.get(santriItem.id) || { juz: 0, surah: 0, ayat: 0 };
                        return (
                          <div key={santriItem.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                                  {santriItem.profileImage ? (
                                    <img src={santriItem.profileImage} alt={santriItem.name} className="w-full h-full object-cover" />
                                  ) : (
                                    getInitials(santriItem.name)
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">{santriItem.name}</p>
                                  <p className="text-xs text-slate-500 truncate">{santriItem.email}</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">{t('tahfiz.juz')}</p>
                                <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-blue-100 text-blue-800 font-semibold text-xs w-full">
                                  {stats.juz}
                                </span>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">{t('tahfiz.surah')}</p>
                                <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-green-100 text-green-800 font-semibold text-xs w-full">
                                  {stats.surah}
                                </span>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">{t('tahfiz.ayat')}</p>
                                <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-purple-100 text-purple-800 font-semibold text-xs w-full">
                                  {stats.ayat}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleViewProgress(santriItem)}
                              className="w-full text-xs flex items-center justify-center"
                              title={t('tahfiz.lihatProgress')}
                            >
                              <Eye size={12} className="mr-1" />
                              {t('tahfiz.lihatProgress')}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-600">{t('tahfiz.belumAdaSantriDiKelas')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="text-center py-12 px-6">
            <School className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.belumAdaKelas')}</h3>
            <p className="text-sm text-slate-600">
              {t('tahfiz.ustadzBelumDitugaskan')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailUstadzKepalaSekolah;

