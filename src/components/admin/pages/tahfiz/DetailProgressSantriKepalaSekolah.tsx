import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Search, Users, BookOpen, Calendar, ClipboardCheck } from 'lucide-react';
import { useSantri } from '../../../../hooks/useSantri';
import { ProgressHafalan } from '../../../../hooks/useProgressHafalan';
import { apiService } from '../../../../services/apiService';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import HasilTesModal from '../../../murid/pages/tahfiz/components/HasilTesModal';
import DetailPerbaikanModal from '../../../murid/pages/tahfiz/components/DetailPerbaikanModal';
import { useLanguage } from '../../../../context/LanguageContext';

const DetailProgressSantriKepalaSekolah: React.FC = () => {
  const { t } = useLanguage();
  const { santriId } = useParams<{ santriId: string }>();
  const navigate = useNavigate();
  const { santri } = useSantri();
  const [progressData, setProgressData] = useState<ProgressHafalan[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [selectedProgress, setSelectedProgress] = useState<ProgressHafalan | null>(null);
  const [modalType, setModalType] = useState<'hasil' | 'perbaikan' | null>(null);
  const currentYear = new Date().getFullYear().toString();

  const selectedSantri = useMemo(() => {
    return santri.find(s => s.id === santriId);
  }, [santri, santriId]);

  // Fetch progress hafalan data
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!santriId) return;
      
      setProgressLoading(true);
      try {
        const response = await apiService.getProgressHafalanBySantri(santriId, currentYear);
        if (response.success && response.data) {
          setProgressData(response.data.sort((a, b) => {
            if (a.juz !== b.juz) return a.juz - b.juz;
            if (a.surat !== b.surat) return a.surat.localeCompare(b.surat);
            return a.ayatDari - b.ayatDari;
          }));
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgressData();
  }, [santriId, currentYear]);

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

  const handleOpenModal = (progress: ProgressHafalan, type: 'hasil' | 'perbaikan') => {
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

    if (!progress.hasilTes) {
      return (
        <span className="text-xs text-slate-400 italic">
          {t('tahfiz.belumMelakukanTes')}
        </span>
      );
    }

    if (progress.hasilTes === 'Mumtaz' || progress.hasilTes === 'Jayid Jiddan') {
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleOpenModal(progress, 'hasil')}
          className={`${baseClass} text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100`}
          title={t('tahfiz.hasilHapalan')}
        >
          <Eye size={iconSize} className={textClass} />
          {isMobile ? <span>{t('tahfiz.hasil')}</span> : t('tahfiz.hasilHapalan')}
        </Button>
      );
    }

    if (progress.hasilTes === 'Jayid' || progress.hasilTes === 'Maqbul') {
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleOpenModal(progress, 'perbaikan')}
          className={`${baseClass} text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100`}
          title={t('tahfiz.detailPerbaikan')}
        >
          <Eye size={iconSize} className={textClass} />
          {isMobile ? <span>{t('tahfiz.perbaikan')}</span> : t('tahfiz.detailPerbaikan')}
        </Button>
      );
    }

    return null;
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
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/dashboard/data-santri-kepala-sekolah')}
                className="!p-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                title={t('common.back')}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  {t('tahfiz.progressHafalan')}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100">
                  {selectedSantri?.name || t('tahfiz.santri')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Santri Info Card */}
      {selectedSantri && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-medium text-xl flex-shrink-0">
                {selectedSantri.profileImage ? (
                  <img src={selectedSantri.profileImage} alt={selectedSantri.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(selectedSantri.name)
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedSantri.name}</h3>
                <p className="text-sm text-slate-600">{selectedSantri.email}</p>
                {(selectedSantri as any).nisn && (
                  <p className="text-xs text-slate-500 mt-1">{t('tahfiz.nisn')}: {(selectedSantri as any).nisn}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.daftarProgressHafalan')}</h3>
        </div>

        {progressLoading ? (
          <div className="text-center py-12 px-6">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">{t('common.loading')}</p>
          </div>
        ) : progressData.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableCell header className="text-sm">{t('tahfiz.juz')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.surah')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.ayat')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.tanggal')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.tanggalTes')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.hasilTes')}</TableCell>
                    <TableCell header className="text-sm">{t('tahfiz.aksi')}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressData.map((progress) => (
                    <TableRow key={progress.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm font-medium">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs">
                          {t('tahfiz.juz')} {progress.juz}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-900">
                        {progress.surat}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {t('tahfiz.ayat')} {progress.ayatDari} - {progress.ayatSampai}
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
                          <span className="text-slate-400 text-xs">{t('tahfiz.belumDites')}</span>
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

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {progressData.map((progress) => (
                <div key={progress.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {t('tahfiz.juz')} {progress.juz}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {progress.surat}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {t('tahfiz.ayat')}: {progress.ayatDari} - {progress.ayatSampai}
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

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-500">{t('tahfiz.tanggal')}:</span>
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
                          <span className="text-slate-500">{t('tahfiz.tanggalTes')}:</span>
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
                          {t('tahfiz.belumMelakukanTes')}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      {getActionButton(progress, true)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-6">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.belumAdaProgressHafalan')}</h3>
            <p className="text-sm text-slate-600">
              {t('tahfiz.progressHafalanAkanDitampilkan')}
            </p>
          </div>
        )}
      </div>

      {/* Modals for Hasil Tes and Detail Perbaikan */}
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

export default DetailProgressSantriKepalaSekolah;

