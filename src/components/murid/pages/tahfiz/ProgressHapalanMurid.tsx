import React, { useMemo, useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useProgressHafalan, ProgressHafalan } from '../../../../hooks/useProgressHafalan';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import Button from '../../../ui/Button';
import PreviewHapalanModal from './components/PreviewHapalanModal';
import HasilTesModal from './components/HasilTesModal';
import DetailPerbaikanModal from './components/DetailPerbaikanModal';

interface Statistics {
  juz: number;
  surah: number;
  ayat: number;
}

const ProgressHapalanMurid: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear().toString();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [selectedProgress, setSelectedProgress] = useState<ProgressHafalan | null>(null);
  const [modalType, setModalType] = useState<'preview' | 'hasil' | 'perbaikan' | null>(null);

  const {
    progressList,
    loading: progressLoading,
  } = useProgressHafalan(user?.id, currentYear);

  // Calculate statistics
  const statistics = useMemo<Statistics>(() => {
    // Filter progress data to only include completed hafalan (Mumtaz or Jayid Jiddan)
    const completedProgress = progressList.filter(
      (p) => p.hasilTes === 'Mumtaz' || p.hasilTes === 'Jayid Jiddan'
    );

    const juzSet = new Set<number>();
    const surahSet = new Set<string>();
    let totalAyat = 0;

    completedProgress.forEach((progress) => {
      // Count unique juz
      juzSet.add(progress.juz);

      // Count unique surah
      surahSet.add(progress.surat.toLowerCase().trim());

      // Count total verses (ayatSampai - ayatDari + 1)
      const ayatCount = progress.ayatSampai - progress.ayatDari + 1;
      totalAyat += ayatCount;
    });

    return {
      juz: juzSet.size,
      surah: surahSet.size,
      ayat: totalAyat,
    };
  }, [progressList]);

  // Pagination calculations
  const totalPages = Math.ceil(progressList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProgressList = progressList.slice(startIndex, endIndex);

  // Reset to page 1 when progress list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [progressList.length]);

  const getResultBadgeVariant = (hasilTes?: string) => {
    if (!hasilTes) return 'secondary';
    switch (hasilTes) {
      case 'Mumtaz':
        return 'success';
      case 'Jayid Jiddan':
        return 'success';
      case 'Jayid':
        return 'warning';
      case 'Maqbul':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleOpenModal = (progress: ProgressHafalan, type: 'preview' | 'hasil' | 'perbaikan') => {
    setSelectedProgress(progress);
    setModalType(type);
  };

  const handleCloseModal = () => {
    setSelectedProgress(null);
    setModalType(null);
  };

  const getActionButton = (progress: ProgressHafalan, isMobile: boolean = false) => {
    const baseClass = isMobile 
      ? "flex-1 text-xs flex items-center justify-center gap-1" 
      : "!p-1.5 flex items-center justify-center";
    const iconSize = isMobile ? 12 : 14;
    const textClass = isMobile ? "" : "mr-2";

    // Jika belum ada hasil tes, tampilkan tombol "Pelajari Hapalan"
    if (!progress.hasilTes) {
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleOpenModal(progress, 'preview')}
          className={`${baseClass} text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100`}
          title={t('tahfiz.muridTahfiz.progressHapalan.pelajariHapalan')}
        >
          <BookOpen size={iconSize} className={textClass} />
          {isMobile ? <span>{t('tahfiz.muridTahfiz.progressHapalan.pelajari')}</span> : t('tahfiz.muridTahfiz.progressHapalan.pelajariHapalan')}
        </Button>
      );
    }

    // Jika Mumtaz atau Jayid Jiddan, tampilkan "Hafalan Diterima"
    if (progress.hasilTes === 'Mumtaz' || progress.hasilTes === 'Jayid Jiddan') {
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleOpenModal(progress, 'hasil')}
          className={`${baseClass} text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100`}
          title={t('tahfiz.muridTahfiz.progressHapalan.hafalanDiterima')}
        >
          <CheckCircle2 size={iconSize} className={textClass} />
          {isMobile ? <span>{t('tahfiz.muridTahfiz.progressHapalan.diterima')}</span> : t('tahfiz.muridTahfiz.progressHapalan.hafalanDiterima')}
        </Button>
      );
    }

    // Jika Jayid atau Maqbul, tampilkan "Detail Perbaikan"
    if (progress.hasilTes === 'Jayid' || progress.hasilTes === 'Maqbul') {
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleOpenModal(progress, 'perbaikan')}
          className={`${baseClass} text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100`}
          title={t('tahfiz.muridTahfiz.progressHapalan.detailPerbaikan')}
        >
          <Eye size={iconSize} className={textClass} />
          {isMobile ? <span>{t('tahfiz.muridTahfiz.progressHapalan.perbaikan')}</span> : t('tahfiz.muridTahfiz.progressHapalan.detailPerbaikan')}
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.muridTahfiz.progressHapalan.title')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {t('tahfiz.muridTahfiz.progressHapalan.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Juz Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">{t('tahfiz.muridTahfiz.progressHapalan.juz')}</p>
          <p className="text-3xl font-bold text-blue-900">
            {statistics.juz}
          </p>
          <p className="text-xs text-blue-600 mt-1">{t('tahfiz.muridTahfiz.progressHapalan.juzTelahDihapal')}</p>
        </div>

        {/* Surah Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">{t('tahfiz.muridTahfiz.progressHapalan.surah')}</p>
          <p className="text-3xl font-bold text-green-900">
            {statistics.surah}
          </p>
          <p className="text-xs text-green-600 mt-1">{t('tahfiz.muridTahfiz.progressHapalan.surahTelahDihapal')}</p>
        </div>

        {/* Ayat Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">{t('tahfiz.muridTahfiz.progressHapalan.ayat')}</p>
          <p className="text-3xl font-bold text-purple-900">
            {statistics.ayat}
          </p>
          <p className="text-xs text-purple-600 mt-1">{t('tahfiz.muridTahfiz.progressHapalan.totalAyatDihapal')}</p>
        </div>
      </div>

      {/* Progress Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.muridTahfiz.progressHapalan.daftarProgressHafalan')}</h3>
            {progressList.length > 0 && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t('tahfiz.muridTahfiz.progressHapalan.total')}: {progressList.length} {t('tahfiz.muridTahfiz.progressHapalan.progress')}
                {totalPages > 1 && (
                  <span className="ml-2">
                    ({t('tahfiz.muridTahfiz.progressHapalan.halaman')} {currentPage} {t('tahfiz.muridTahfiz.progressHapalan.dari')} {totalPages})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {progressLoading ? (
          <div className="text-center py-12 px-6">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">{t('tahfiz.muridTahfiz.progressHapalan.memuatDataProgress')}</p>
          </div>
        ) : progressList.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableCell header className="text-sm">{t('tahfiz.muridTahfiz.progressHapalan.juz')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.surat')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.muridTahfiz.progressHapalan.ayat')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.muridTahfiz.progressHapalan.tanggal')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.muridTahfiz.progressHapalan.tanggalTes')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.muridTahfiz.progressHapalan.hasilTes')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.muridTahfiz.progressHapalan.aksi')}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProgressList.map((progress) => (
                    <TableRow key={progress.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm font-medium">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs">
                          {t('tahfiz.muridTahfiz.commonLabels.juz')} {progress.juz}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-900">
                        {progress.surat}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {t('tahfiz.muridTahfiz.commonLabels.ayat')} {progress.ayatDari} - {progress.ayatSampai}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(progress.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {progress.tanggalTes
                          ? new Date(progress.tanggalTes).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {progress.hasilTes ? (
                          <Badge
                            variant={getResultBadgeVariant(progress.hasilTes)}
                            size="sm"
                          >
                            {progress.hasilTes}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">{t('tahfiz.muridTahfiz.progressHapalan.belumDites')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getActionButton(progress)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs sm:text-sm text-slate-600">
                  {t('tahfiz.muridTahfiz.progressHapalan.menampilkan')} {startIndex + 1} - {Math.min(endIndex, progressList.length)} {t('tahfiz.muridTahfiz.progressHapalan.dari')} {progressList.length} {t('tahfiz.muridTahfiz.progressHapalan.progress')}
                </p>
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('tahfiz.muridTahfiz.progressHapalan.sebelumnya')}
                  </button>
                  <span className="text-xs sm:text-sm text-slate-600 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('tahfiz.muridTahfiz.progressHapalan.selanjutnya')}
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {paginatedProgressList.map((progress) => (
                <div key={progress.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Header dengan Juz dan Surat */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {t('tahfiz.muridTahfiz.commonLabels.juz')} {progress.juz}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {progress.surat}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {t('tahfiz.muridTahfiz.commonLabels.ayat')}: {progress.ayatDari} - {progress.ayatSampai}
                        </p>
                      </div>
                      {progress.hasilTes && (
                        <Badge
                          variant={getResultBadgeVariant(progress.hasilTes)}
                          size="sm"
                        >
                          {progress.hasilTes}
                        </Badge>
                      )}
                    </div>

                    {/* Info Details */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-500">{t('tahfiz.muridTahfiz.progressHapalan.tanggal')}:</span>
                        <span className="text-slate-900 font-medium">
                          {new Date(progress.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {progress.tanggalTes && (
                        <div className="flex items-center gap-2 text-xs">
                          <ClipboardCheck className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-500">{t('tahfiz.muridTahfiz.progressHapalan.tanggalTes')}:</span>
                          <span className="text-slate-900 font-medium">
                            {new Date(progress.tanggalTes).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {!progress.hasilTes && (
                        <div className="text-xs text-slate-400 italic">
                          {t('tahfiz.muridTahfiz.progressHapalan.belumDites')}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-slate-100">
                      {getActionButton(progress, true)}
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="pt-4 border-t border-slate-200 flex flex-col items-center justify-between gap-4">
                  <p className="text-xs text-slate-600">
                    {t('tahfiz.muridTahfiz.progressHapalan.menampilkan')} {startIndex + 1} - {Math.min(endIndex, progressList.length)} {t('tahfiz.muridTahfiz.progressHapalan.dari')} {progressList.length} {t('tahfiz.muridTahfiz.progressHapalan.progress')}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('tahfiz.muridTahfiz.progressHapalan.sebelumnya')}
                    </button>
                    <span className="text-xs text-slate-600 px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('tahfiz.muridTahfiz.progressHapalan.selanjutnya')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-6">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.muridTahfiz.progressHapalan.belumAdaProgressHafalan')}</h3>
            <p className="text-sm text-slate-600">
              {t('tahfiz.muridTahfiz.progressHapalan.progressHafalanAkanDitampilkan')}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedProgress && modalType === 'preview' && (
        <PreviewHapalanModal
          isOpen={true}
          onClose={handleCloseModal}
          progress={selectedProgress}
        />
      )}
      {selectedProgress && modalType === 'hasil' && (
        <HasilTesModal
          isOpen={true}
          onClose={handleCloseModal}
          progress={selectedProgress}
        />
      )}
      {selectedProgress && modalType === 'perbaikan' && (
        <DetailPerbaikanModal
          isOpen={true}
          onClose={handleCloseModal}
          progress={selectedProgress}
        />
      )}
    </div>
  );
};

export default ProgressHapalanMurid;

