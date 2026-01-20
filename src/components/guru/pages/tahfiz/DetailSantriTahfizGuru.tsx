import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Mail, Phone, Users, BookOpen, Award, FileText } from 'lucide-react';
import { User } from '../../../../types';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useSantri } from '../../../../hooks/useSantri';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { apiService } from '../../../../services/apiService';
import { ProgressHafalan } from '../../../../hooks/useProgressHafalan';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';

interface SantriStatistics {
  juz: number;
  surah: number;
  ayat: number;
}

const DetailSantriTahfizGuru: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { ustadz } = useUstadz();
  const { santri } = useSantri();
  const { kelasTahfiz, loading: classesLoading } = useKelasTahfiz();

  const [santriDetail, setSantriDetail] = useState<User | null>(null);
  const [progressData, setProgressData] = useState<ProgressHafalan[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);

  const selectedClass = useMemo(
    () => kelasTahfiz.find((cls) => cls.id === id) || null,
    [kelasTahfiz, id]
  );

  const ustadzMap = useMemo(() => {
    const map = new Map<string, User>();
    ustadz.forEach((item) => map.set(item.id, item));
    return map;
  }, [ustadz]);

  // Verify that this class belongs to the logged-in guru
  const isMyClass = useMemo(() => {
    return selectedClass && selectedClass.ustadzId === user?.id;
  }, [selectedClass, user?.id]);

  const assignedSantri = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.santriIds
      .map((santriId) => santri.find((s) => s.id === santriId))
      .filter(Boolean) as User[];
  }, [selectedClass, santri]);

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

  // Calculate statistics for each santri
  const santriStatistics = useMemo(() => {
    const statsMap = new Map<string, SantriStatistics>();
    
    // Initialize all santri with zero stats
    assignedSantri.forEach((s) => {
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
  }, [progressData, assignedSantri]);

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">{t('tahfiz.memuatDataKelas')}</p>
        </div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.kelasTidakDitemukan')}</h3>
          <p className="text-sm text-slate-600 mb-4">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.kelasTidakDitemukanDesc')}</p>
          <Button onClick={() => navigate('/dashboard/data-santri-tahfiz-guru')}>
            {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.kembaliKeDaftarKelas')}
          </Button>
        </div>
      </div>
    );
  }

  if (!isMyClass) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.aksesDitolak')}</h3>
          <p className="text-sm text-slate-600 mb-4">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.aksesDitolakDesc')}</p>
          <Button onClick={() => navigate('/dashboard/data-santri-tahfiz-guru')}>
            {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.kembaliKeDaftarKelas')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/dashboard/data-santri-tahfiz-guru')}
                variant="secondary"
                className="!p-2 bg-white/20 hover:bg-white/30 text-white border-0"
                title="Kembali"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.title')} {selectedClass.namaKelas}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100">
                  {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 mb-2">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.namaKelas')}</p>
          <p className="text-lg font-semibold text-slate-900">{selectedClass.namaKelas}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 mb-2">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.ruangan')}</p>
          <p className="text-lg font-semibold text-slate-900">{selectedClass.ruangan}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 mb-2">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.ustadz')}</p>
          <p className="text-lg font-semibold text-slate-900">
            {ustadzMap.get(selectedClass.ustadzId)?.name || t('tahfiz.guruTahfiz.detailSantriTahfizGuru.belumDiatur')}
          </p>
        </div>
      </div>

      {/* Santri Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.santriDiKelas')} ({assignedSantri.length} {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.santri')})
          </h3>
        </div>

        {/* Desktop Table View */}
        {assignedSantri.length > 0 ? (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableCell header className="text-sm">
                      {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.namaSantri')}
                    </TableCell>
                    <TableCell header className="text-sm">
                      {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.kontak')}
                    </TableCell>
                    <TableCell header className="text-sm">
                      {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.aksi')}
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedSantri.map((santriItem) => (
                    <TableRow key={santriItem.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-sm font-medium text-slate-900">{santriItem.name}</TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-slate-600">
                            <Mail size={12} className="mr-2" />
                            <span className="truncate">{santriItem.email || '-'}</span>
                          </div>
                          {(santriItem as any).whatsappOrtu && (
                            <div className="flex items-center text-xs text-slate-600">
                              <Phone size={12} className="mr-2" />
                              <span>{(santriItem as any).whatsappOrtu}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSantriDetail(santriItem)}
                            className="!p-2 flex items-center justify-center"
                            title={t('tahfiz.guruTahfiz.detailSantriTahfizGuru.detail')}
                          >
                            <Eye size={14} className="mr-2"/>{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.detail')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {assignedSantri.map((santriItem) => (
                <div key={santriItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-slate-900 text-sm truncate">{santriItem.name}</h5>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <Mail size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 truncate">{santriItem.email || '-'}</span>
                      </div>
                      {(santriItem as any).whatsappOrtu && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600">{(santriItem as any).whatsappOrtu}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSantriDetail(santriItem)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Eye size={12} className="mr-1" />
                        {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.detail')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.belumAdaSantri')}</h3>
            <p className="text-sm text-slate-600 mb-4">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.belumAdaSantriDesc')}</p>
          </div>
        )}
      </div>

      {/* Santri Detail Modal */}
      <Modal
        isOpen={!!santriDetail}
        onClose={() => setSantriDetail(null)}
        title={t('tahfiz.guruTahfiz.detailSantriTahfizGuru.detailSantri')}
        size="lg"
      >
        {santriDetail && (
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {santriDetail.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{santriDetail.name || '-'}</h3>
                  <p className="text-sm text-slate-600">{santriDetail.email || '-'}</p>
                </div>
              </div>
            </div>

            {/* Progress Statistics Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Award className="w-5 h-5 text-emerald-600" />
                <h4 className="text-lg font-semibold text-slate-900">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.statistikProgressHafalan')}</h4>
              </div>
              
              {progressLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Juz Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">{t('tahfiz.juz')}</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {santriStatistics.get(santriDetail.id)?.juz || 0}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.juzTelahDihapal')}</p>
                  </div>

                  {/* Surah Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">{t('tahfiz.surah')}</p>
                    <p className="text-3xl font-bold text-green-900">
                      {santriStatistics.get(santriDetail.id)?.surah || 0}
                    </p>
                    <p className="text-xs text-green-600 mt-1">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.surahTelahDihapal')}</p>
                  </div>

                  {/* Ayat Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">{t('tahfiz.ayat')}</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {santriStatistics.get(santriDetail.id)?.ayat || 0}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.ayatTelahDihapal')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Users className="w-5 h-5 text-slate-600" />
                <h4 className="text-lg font-semibold text-slate-900">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.informasiPribadi')}</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">{t('tahfiz.nisn')}</p>
                  <p className="text-sm font-semibold text-slate-900">{(santriDetail as any).nisn || '-'}</p>
                </div>
                {(santriDetail as any).whatsappOrtu && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">{t('tahfiz.guruTahfiz.detailSantriTahfizGuru.kontakOrangTua')}</p>
                    <p className="text-sm font-semibold text-slate-900">{(santriDetail as any).whatsappOrtu}</p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">{t('tahfiz.email')}</p>
                  <p className="text-sm font-semibold text-slate-900">{santriDetail.email || '-'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="secondary"
                onClick={() => setSantriDetail(null)}
                className="flex-1"
              >
                {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.tutup')}
              </Button>
              <Button
                onClick={() => {
                  setSantriDetail(null);
                  navigate(`/dashboard/progress-tahfiz/${santriDetail.id}`);
                }}
                className="flex-1 flex items-center justify-center"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {t('tahfiz.guruTahfiz.detailSantriTahfizGuru.lihatProgress')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DetailSantriTahfizGuru;

