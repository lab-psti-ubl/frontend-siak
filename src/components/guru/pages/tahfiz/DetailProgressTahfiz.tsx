import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Trash2, Edit2, ClipboardCheck } from 'lucide-react';
import { useSantri } from '../../../../hooks/useSantri';
import { useProgressHafalan, ProgressHafalan } from '../../../../hooks/useProgressHafalan';
import { useLanguage } from '../../../../context/LanguageContext';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import Badge from '../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import SuratAutocomplete from './components/SuratAutocomplete';

interface Surah {
  nomor: number;
  nama: string;
  namaLatin?: string;
  nama_latin: string;
  jumlahAyat?: number;
  jumlah_ayat: number;
  tempatTurun?: string;
  tempat_turun: string;
  arti: string;
}

interface SurahProgressInfo {
  surah: Surah;
  nextAvailableDari: number;
  nextAvailableSampai: number;
  isFullyCompleted: boolean;
}

const DetailProgressTahfiz: React.FC = () => {
  const { santriId } = useParams<{ santriId: string }>();
  const navigate = useNavigate();
  const { santri } = useSantri();
  const { t, language } = useLanguage();
  const dateLocale = language === 'ms' ? 'ms-MY' : 'id-ID';
  const currentYear = new Date().getFullYear().toString();

  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const [editingProgress, setEditingProgress] = useState<ProgressHafalan | null>(null);
  const [suratInput, setSuratInput] = useState('');
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayatDari, setAyatDari] = useState<number | ''>('');
  const [ayatSampai, setAyatSampai] = useState<number | ''>('');
  const [ayatRangeError, setAyatRangeError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenAddModal = () => {
    setEditingProgress(null);
    setSuratInput('');
    setSelectedSurah(null);
    setAyatDari('');
    setAyatSampai('');
    setAyatRangeError('');
    setShowAddProgressModal(true);
  };

  const handleCloseModal = () => {
    setShowAddProgressModal(false);
    setEditingProgress(null);
    setSuratInput('');
    setSelectedSurah(null);
    setAyatDari('');
    setAyatSampai('');
    setAyatRangeError('');
  };

  const selectedSantri = santri.find((s) => s.id === santriId);

  const {
    progressList,
    loading: progressLoading,
    addProgress,
    updateProgress,
    deleteProgress,
  } = useProgressHafalan(santriId, currentYear);

  // Pagination calculations
  const totalPages = Math.ceil(progressList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProgressList = progressList.slice(startIndex, endIndex);

  // Reset to page 1 when progress list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [progressList.length]);

  // Fetch surah list
  useEffect(() => {
    const fetchSurahList = async () => {
      try {
        const response = await fetch('https://equran.id/api/v2/surat');
        const data = await response.json();
        if (data.data) {
          setSurahList(data.data);
        }
      } catch (error) {
        console.error('Error fetching surah list:', error);
      }
    };

    fetchSurahList();
  }, []);

  // Calculate surah progress info: which surahs are fully completed and which have available ranges
  const surahProgressInfo = useMemo(() => {
    if (!surahList.length) {
      return new Map<string, SurahProgressInfo>();
    }

    const infoMap = new Map<string, SurahProgressInfo>();

    // Group progress by surah name
    const progressBySurah = new Map<string, ProgressHafalan[]>();
    if (progressList.length > 0) {
      progressList.forEach((progress) => {
        const key = progress.surat.toLowerCase().trim();
        if (!progressBySurah.has(key)) {
          progressBySurah.set(key, []);
        }
        progressBySurah.get(key)!.push(progress);
      });
    }

    // Process each surah
    surahList.forEach((surah) => {
      const surahName = (surah.namaLatin || surah.nama_latin || '').toLowerCase().trim();
      const surahProgress = progressBySurah.get(surahName) || [];
      const totalAyat = surah.jumlahAyat || surah.jumlah_ayat || 0;

      if (surahProgress.length === 0) {
        // No progress yet, all ayat available
        infoMap.set(surahName, {
          surah,
          nextAvailableDari: 1,
          nextAvailableSampai: totalAyat,
          isFullyCompleted: false,
        });
        return;
      }

      // Find all accepted progress (Mumtaz or Jayid Jiddan) for this surah
      const acceptedProgress = surahProgress.filter(
        (p) => p.hasilTes === 'Mumtaz' || p.hasilTes === 'Jayid Jiddan'
      );

      if (acceptedProgress.length === 0) {
        // No accepted progress, check if there's any progress to find gaps
        const allRanges = surahProgress
          .map((p) => ({ dari: p.ayatDari, sampai: p.ayatSampai }))
          .sort((a, b) => a.dari - b.dari);

        // Find the first gap or next available range
        let nextDari = 1;
        for (const range of allRanges) {
          if (nextDari < range.dari) {
            // Found a gap
            break;
          }
          nextDari = Math.max(nextDari, range.sampai + 1);
        }

        infoMap.set(surahName, {
          surah,
          nextAvailableDari: nextDari > totalAyat ? totalAyat : nextDari,
          nextAvailableSampai: totalAyat,
          isFullyCompleted: false,
        });
        return;
      }

      // Combine all accepted ranges and check if entire surah is covered
      const acceptedRanges = acceptedProgress
        .map((p) => ({ dari: p.ayatDari, sampai: p.ayatSampai }))
        .sort((a, b) => a.dari - b.dari);

      // Merge overlapping ranges
      const mergedRanges: Array<{ dari: number; sampai: number }> = [];
      for (const range of acceptedRanges) {
        if (mergedRanges.length === 0) {
          mergedRanges.push({ ...range });
        } else {
          const lastRange = mergedRanges[mergedRanges.length - 1];
          if (range.dari <= lastRange.sampai + 1) {
            // Overlapping or adjacent, merge
            lastRange.sampai = Math.max(lastRange.sampai, range.sampai);
          } else {
            mergedRanges.push({ ...range });
          }
        }
      }

      // Check if entire surah is covered
      const isFullyCovered =
        mergedRanges.length > 0 &&
        mergedRanges[0].dari === 1 &&
        mergedRanges[mergedRanges.length - 1].sampai >= totalAyat &&
        mergedRanges.every((range, index) => {
          if (index === 0) return true;
          return mergedRanges[index - 1].sampai + 1 >= range.dari;
        });

      if (isFullyCovered) {
        // Fully completed, exclude from autocomplete
        infoMap.set(surahName, {
          surah,
          nextAvailableDari: 0,
          nextAvailableSampai: 0,
          isFullyCompleted: true,
        });
      } else {
        // Partially completed, find next available range
        let nextDari = 1;
        for (const range of mergedRanges) {
          if (nextDari < range.dari) {
            // Found a gap
            break;
          }
          nextDari = Math.max(nextDari, range.sampai + 1);
        }

        infoMap.set(surahName, {
          surah,
          nextAvailableDari: nextDari > totalAyat ? totalAyat : nextDari,
          nextAvailableSampai: totalAyat,
          isFullyCompleted: false,
        });
      }
    });

    return infoMap;
  }, [surahList, progressList]);

  // Filter out fully completed surahs (but include the surah being edited if it exists)
  const availableSurahList = useMemo(() => {
    return surahList.filter((surah) => {
      const surahName = (surah.namaLatin || surah.nama_latin || '').toLowerCase().trim();
      // Always include the surah being edited
      if (editingProgress && editingProgress.surat.toLowerCase().trim() === surahName) {
        return true;
      }
      const info = surahProgressInfo.get(surahName);
      return !info || !info.isFullyCompleted;
    });
  }, [surahList, surahProgressInfo, editingProgress]);

  // Handle surah selection
  const handleSurahSelect = (surah: Surah | null) => {
    setSelectedSurah(surah);
    setAyatRangeError('');

    if (surah) {
      const surahName = (surah.namaLatin || surah.nama_latin || '').toLowerCase().trim();
      const info = surahProgressInfo.get(surahName);

      if (info && !info.isFullyCompleted && !editingProgress) {
        // Auto-fill next available range (only when adding new, not editing)
        setAyatDari(info.nextAvailableDari);
        setAyatSampai(info.nextAvailableSampai);
      } else if (!editingProgress) {
        // New surah or no info, default to first ayat (only when adding new)
        const totalAyat = surah.jumlahAyat || surah.jumlah_ayat || 1;
        setAyatDari(1);
        setAyatSampai(totalAyat);
      }
      // When editing, keep existing ayat values (already set in handleEditProgress)
    } else {
      setAyatDari('');
      setAyatSampai('');
    }
  };

  // Validate ayat range
  const validateAyatRange = (dari: number, sampai: number, surah: Surah | null) => {
    if (!surah) {
      return 'Silakan pilih surah terlebih dahulu';
    }

    const totalAyat = surah.jumlahAyat || surah.jumlah_ayat || 0;

    if (dari < 1) {
      return 'Ayat dari harus minimal 1';
    }

    if (dari > totalAyat) {
      return `Ayat dari tidak boleh lebih dari ${totalAyat} (total ayat surah ini)`;
    }

    if (sampai < 1) {
      return 'Ayat sampai harus minimal 1';
    }

    if (sampai > totalAyat) {
      return `Ayat sampai tidak boleh lebih dari ${totalAyat} (total ayat surah ini)`;
    }

    if (dari > sampai) {
      return 'Ayat dari tidak boleh lebih besar dari ayat sampai';
    }

    // Check if range overlaps with existing accepted progress (exclude the progress being edited)
    const surahName = (surah.namaLatin || surah.nama_latin || '').toLowerCase().trim();
    const surahProgress = progressList.filter(
      (p) => p.surat.toLowerCase().trim() === surahName &&
        (p.hasilTes === 'Mumtaz' || p.hasilTes === 'Jayid Jiddan') &&
        (!editingProgress || p.id !== editingProgress.id) // Exclude the progress being edited
    );

    for (const progress of surahProgress) {
      // Check if new range overlaps with existing accepted range
      if (
        (dari >= progress.ayatDari && dari <= progress.ayatSampai) ||
        (sampai >= progress.ayatDari && sampai <= progress.ayatSampai) ||
        (dari <= progress.ayatDari && sampai >= progress.ayatSampai)
      ) {
        return `Range ayat ${dari}-${sampai} bertumpang tindih dengan hapalan yang sudah diterima (${progress.ayatDari}-${progress.ayatSampai})`;
      }
    }

    return '';
  };

  const handleAddProgress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const ayatDariValue = typeof ayatDari === 'number' ? ayatDari : parseInt(formData.get('ayatDari') as string);
    const ayatSampaiValue = typeof ayatSampai === 'number' ? ayatSampai : parseInt(formData.get('ayatSampai') as string);

    // Validate ayat range
    const validationError = validateAyatRange(ayatDariValue, ayatSampaiValue, selectedSurah);
    if (validationError) {
      setAyatRangeError(validationError);
      return;
    }

    const data = {
      santriId: santriId!,
      juz: parseInt(formData.get('juz') as string),
      surat: suratInput || (formData.get('surat') as string),
      ayatDari: ayatDariValue,
      ayatSampai: ayatSampaiValue,
      tanggal: formData.get('tanggal') as string,
    };

    try {
      if (editingProgress) {
        await updateProgress(editingProgress.id, data);
      } else {
        await addProgress(data);
      }
      setShowAddProgressModal(false);
      setEditingProgress(null);
      setSuratInput('');
      setSelectedSurah(null);
      setAyatDari('');
      setAyatSampai('');
      setAyatRangeError('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan progress hafalan';
      alert(errorMessage);
    }
  };

  const handleEditProgress = (progress: ProgressHafalan) => {
    setEditingProgress(progress);
    setSuratInput(progress.surat);
    
    // Find surah by name
    const surah = surahList.find(
      (s) => (s.namaLatin || s.nama_latin || '').toLowerCase().trim() === progress.surat.toLowerCase().trim()
    );
    setSelectedSurah(surah || null);
    setAyatDari(progress.ayatDari);
    setAyatSampai(progress.ayatSampai);
    setAyatRangeError('');
    setShowAddProgressModal(true);
  };

  const handleDeleteProgress = async (id: string) => {
    if (!confirm(t('tahfiz.guruTahfiz.detailProgressTahfiz.hapusProgressConfirm'))) {
      return;
    }

    try {
      await deleteProgress(id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('tahfiz.guruTahfiz.detailProgressTahfiz.gagalHapusProgress');
      alert(errorMessage);
    }
  };

  const handleTesHapalan = (progress: ProgressHafalan) => {
    navigate(`/dashboard/progress-tahfiz/${santriId}/tes-hapalan`, {
      state: { progress }
    });
  };

  const handleDetailHafalan = (progress: ProgressHafalan) => {
    navigate(`/dashboard/progress-tahfiz/${santriId}/detail-hafalan`, {
      state: { progress }
    });
  };

  // Check if progress is a retest/perbaikan
  const isPerbaikan = (progress: ProgressHafalan): boolean => {
    // Jika ada riwayatTes yang tidak kosong, berarti ini adalah tes ulang/perbaikan
    return !!(progress.riwayatTes && progress.riwayatTes.length > 0);
  };

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

  const getButtonTesHapalan = (progress: ProgressHafalan, isMobile: boolean = false) => {
    const baseClass = isMobile 
      ? "flex-1 text-xs flex items-center justify-center gap-1" 
      : "!p-1.5 flex items-center justify-center";
    const iconSize = isMobile ? 12 : 14;
    const textClass = isMobile ? "" : "mr-2";

    // Jika belum ada hasil tes, tampilkan tombol "Tes Hapalan"
    if (!progress.hasilTes) {
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleTesHapalan(progress)}
          className={`${baseClass} text-blue-600 hover:text-blue-700`}
                          title={t('tahfiz.guruTahfiz.detailProgressTahfiz.tesHapalan')}
                        >
                          <ClipboardCheck size={iconSize} className={textClass}/>
                          {isMobile ? <span>{t('tahfiz.guruTahfiz.detailProgressTahfiz.tesHapalan')}</span> : t('tahfiz.guruTahfiz.detailProgressTahfiz.tesHapalan')}
                        </Button>
      );
    }

    // Jika Mumtaz atau Jayid Jiddan, tampilkan "Hafalan Diterima" (tidak bisa tes ulang)
    if (progress.hasilTes === 'Mumtaz' || progress.hasilTes === 'Jayid Jiddan') {
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleDetailHafalan(progress)}
          className={`${baseClass} text-green-600 hover:text-green-700 bg-green-600 hover:bg-green-700`}
                          title={t('tahfiz.guruTahfiz.detailProgressTahfiz.hafalanDiterima')}
                        >
                          <ClipboardCheck size={iconSize} className={textClass}/>
                          {isMobile ? <span>{t('tahfiz.guruTahfiz.detailProgressTahfiz.diterima')}</span> : t('tahfiz.guruTahfiz.detailProgressTahfiz.hafalanDiterima')}
                        </Button>
      );
    }

    // Jika Jayid atau Maqbul, tampilkan tombol "Tes Ulang" untuk memperbaiki hafalan
    if (progress.hasilTes === 'Jayid' || progress.hasilTes === 'Maqbul') {
      if (isMobile) {
        // For mobile, only show "Tes Ulang" button
        return (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleTesHapalan(progress)}
            className={`${baseClass} text-blue-600 hover:text-blue-700`}
            title="Tes Ulang Hapalan"
          >
            <ClipboardCheck size={iconSize} className={textClass}/>
            <span>Tes Ulang</span>
          </Button>
        );
      }
      // For desktop, show both buttons
      return (
        <>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleTesHapalan(progress)}
            className={`${baseClass} text-blue-600 hover:text-blue-700`}
                          title={t('tahfiz.guruTahfiz.detailProgressTahfiz.tesUlang')}
                        >
                          <ClipboardCheck size={iconSize} className={textClass}/>
                          {t('tahfiz.guruTahfiz.detailProgressTahfiz.tesUlang')}
                        </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleDetailHafalan(progress)}
                            className={`${baseClass} text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100`}
                            title={t('tahfiz.guruTahfiz.detailProgressTahfiz.detailPerbaikan')}
                          >
                            <ClipboardCheck size={iconSize} className={textClass}/>
                            {t('tahfiz.guruTahfiz.detailProgressTahfiz.detailPerbaikan')}
                          </Button>
        </>
      );
    }

    return null;
  };

  if (!selectedSantri) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.guruTahfiz.detailProgressTahfiz.santriTidakDitemukan')}</h3>
          <p className="text-sm text-slate-600 mb-4">{t('tahfiz.guruTahfiz.detailProgressTahfiz.santriTidakDitemukanDesc')}</p>
          <Button onClick={() => navigate('/dashboard/progress-tahfiz')}>
            {t('tahfiz.guruTahfiz.detailProgressTahfiz.kembaliKeDaftarSantri')}
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
                onClick={() => navigate('/dashboard/progress-tahfiz')}
                variant="secondary"
                className="!p-2 bg-white/20 hover:bg-white/30 text-white border-0"
                title="Kembali"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  {t('tahfiz.guruTahfiz.detailProgressTahfiz.title')} - {selectedSantri.name}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100">
                  {t('tahfiz.guruTahfiz.detailProgressTahfiz.subtitle')}
                </p>
              </div>
            </div>
            <Button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-0 justify-center"
            >
              <Plus size={20} />
              {t('tahfiz.guruTahfiz.detailProgressTahfiz.tambahProgressHafalan')}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.guruTahfiz.detailProgressTahfiz.daftarProgressHafalan')}</h3>
            {progressList.length > 0 && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t('tahfiz.guruTahfiz.progressTahfiz.total')}: {progressList.length} {t('tahfiz.guruTahfiz.detailProgressTahfiz.progress')}
                {totalPages > 1 && (
                  <span className="ml-2">
                    ({t('tahfiz.guruTahfiz.progressTahfiz.halaman')} {currentPage} {t('tahfiz.guruTahfiz.progressTahfiz.dari')} {totalPages})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {progressLoading ? (
          <div className="text-center py-12 px-6">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">{t('tahfiz.guruTahfiz.detailProgressTahfiz.memuatDataProgress')}</p>
          </div>
        ) : progressList.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                  <TableCell header className="text-sm">{t('tahfiz.juz')}</TableCell>
                  <TableCell header className="text-sm">{t('tahfiz.surat')}</TableCell>
                  <TableCell header className="text-sm">{t('tahfiz.ayat')}</TableCell>
                  <TableCell header className="text-sm">{t('tahfiz.tanggalTes')}</TableCell>
                  <TableCell header className="text-sm">{t('tahfiz.hasilTes')}</TableCell>
                  <TableCell header className="text-sm">{t('tahfiz.aksi')}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProgressList.map((progress) => (
                    <TableRow key={progress.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm font-medium">Juz {progress.juz}</TableCell>
                      <TableCell className="text-sm font-medium">{progress.surat}</TableCell>
                      <TableCell className="text-sm">
                        {progress.ayatDari} - {progress.ayatSampai}
                      </TableCell>
                      <TableCell className="text-sm">
                        {progress.tanggalTes 
                          ? new Date(progress.tanggalTes).toLocaleDateString(dateLocale)
                          : new Date(progress.tanggal).toLocaleDateString(dateLocale)
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
                          <span className="text-slate-400">{t('tahfiz.belumDites')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {getButtonTesHapalan(progress)}
                          {/* Hide edit button for accepted results (Mumtaz or Jayid Jiddan) or perbaikan */}
                          {!(progress.hasilTes === 'Mumtaz' || progress.hasilTes === 'Jayid Jiddan' || isPerbaikan(progress)) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleEditProgress(progress)}
                              className="!p-1.5  flex items-center justify-center"
                              title={t('tahfiz.guruTahfiz.detailProgressTahfiz.edit')}
                            >
                              <Edit2 size={14} className="mr-2"/>{t('tahfiz.guruTahfiz.detailProgressTahfiz.edit')}
                            </Button>
                          )}
                          {/* Hide delete button only for accepted results (Mumtaz or Jayid Jiddan) */}
                          {!(progress.hasilTes === 'Mumtaz' || progress.hasilTes === 'Jayid Jiddan') && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteProgress(progress.id)}
                              className="!p-1.5 text-red-600 hover:text-red-700  flex items-center justify-center"
                              title={t('tahfiz.guruTahfiz.detailProgressTahfiz.hapus')}
                            >
                              <Trash2 size={14} className="mr-2"/>{t('tahfiz.guruTahfiz.detailProgressTahfiz.hapus')}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs sm:text-sm text-slate-600">
              {t('tahfiz.menampilkan')} {startIndex + 1} - {Math.min(endIndex, progressList.length)} {t('tahfiz.dari')} {progressList.length} {t('tahfiz.guruTahfiz.detailProgressTahfiz.progress')}
            </p>
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="sm"
                    className="text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    {t('tahfiz.guruTahfiz.detailProgressTahfiz.sebelumnya')}
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
                    {t('tahfiz.guruTahfiz.detailProgressTahfiz.selanjutnya')}
                  </Button>
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
                          <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-1 rounded">
                            Juz {progress.juz}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {progress.surat}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Ayat: {progress.ayatDari} - {progress.ayatSampai}
                        </p>
                      </div>
                    </div>
                    
                    {/* Info Details */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Tanggal:</span>
                        <span className="text-slate-900 font-medium">
                          {progress.tanggalTes 
                            ? new Date(progress.tanggalTes).toLocaleDateString(dateLocale)
                            : new Date(progress.tanggal).toLocaleDateString(dateLocale)
                          }
                        </span>
                      </div>
                      {progress.hasilTes ? (
                        <div className="text-xs">
                          <span className="text-slate-500">Hasil Tes: </span>
                          <Badge
                            variant={getResultBadgeVariant(progress.hasilTes)}
                            size="sm"
                          >
                            {progress.hasilTes}
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-xs">
                          <span className="text-slate-500">Hasil Tes: </span>
                          <span className="text-slate-400">Belum dites</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      {getButtonTesHapalan(progress, true)}
                      {/* Hide edit button for accepted results (Mumtaz or Jayid Jiddan) or perbaikan */}
                      {!(progress.hasilTes === 'Mumtaz' || progress.hasilTes === 'Jayid Jiddan' || isPerbaikan(progress)) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditProgress(progress)}
                          className="flex-1 text-xs flex items-center justify-center gap-1"
                        >
                          <Edit2 size={12} />
                          <span>{t('tahfiz.guruTahfiz.detailProgressTahfiz.edit')}</span>
                        </Button>
                      )}
                      {/* Hide delete button only for accepted results (Mumtaz or Jayid Jiddan) */}
                      {!(progress.hasilTes === 'Mumtaz' || progress.hasilTes === 'Jayid Jiddan') && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteProgress(progress.id)}
                          className="flex-1 text-xs flex items-center justify-center gap-1 "
                        >
                          <Trash2 size={12} />
                          <span>{t('tahfiz.guruTahfiz.detailProgressTahfiz.hapus')}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="pt-4 border-t border-slate-200 flex flex-col items-center justify-between gap-4">
                <p className="text-xs text-slate-600">
                  {t('tahfiz.menampilkan')} {startIndex + 1} - {Math.min(endIndex, progressList.length)} {t('tahfiz.dari')} {progressList.length} {t('tahfiz.guruTahfiz.detailProgressTahfiz.progress')}
                </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="secondary"
                      size="sm"
                      className="text-xs px-3 py-2"
                    >
                      {t('tahfiz.guruTahfiz.detailProgressTahfiz.sebelumnya')}
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
                      {t('tahfiz.guruTahfiz.detailProgressTahfiz.selanjutnya')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-6">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.guruTahfiz.detailProgressTahfiz.belumAdaProgressHafalan')}</h3>
            <p className="text-sm text-slate-600 mb-4">{t('tahfiz.guruTahfiz.detailProgressTahfiz.belumAdaProgressHafalanDesc')}</p>
            <Button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              {t('tahfiz.guruTahfiz.detailProgressTahfiz.tambahProgressPertama')}
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Progress Modal */}
      <Modal
        isOpen={showAddProgressModal}
        onClose={handleCloseModal}
        title={editingProgress ? t('tahfiz.guruTahfiz.detailProgressTahfiz.editProgressHafalan') : t('tahfiz.guruTahfiz.detailProgressTahfiz.tambahProgressHafalan')}
        size="sm"
      >
        <form onSubmit={handleAddProgress} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('tahfiz.juz')} <span className="text-red-500">*</span>
            </label>
            <select
              name="juz"
              required
              defaultValue={editingProgress?.juz || ''}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
            >
              <option value="">{t('tahfiz.guruTahfiz.detailProgressTahfiz.pilihJuz')}</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                <option key={juz} value={juz}>
                  Juz {juz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('tahfiz.guruTahfiz.detailProgressTahfiz.surat')} <span className="text-red-500">*</span>
            </label>
            <SuratAutocomplete
              value={suratInput}
              onChange={(value) => {
                setSuratInput(value);
                // Only update selectedSurah if we find an exact match
                // Otherwise, let onSelect handle it when user clicks a suggestion
                if (value.trim() === '') {
                  setSelectedSurah(null);
                  setAyatRangeError('');
                  if (!editingProgress) {
                    setAyatDari('');
                    setAyatSampai('');
                  }
                } else {
                  // Try to find surah by exact name match
                  const surah = availableSurahList.find(
                    (s) => {
                      const surahName = (s.namaLatin || s.nama_latin || '').toLowerCase().trim();
                      return surahName === value.toLowerCase().trim();
                    }
                  );
                  if (surah) {
                    handleSurahSelect(surah);
                  } else {
                    // If no exact match, clear selection (user is still typing)
                    setSelectedSurah(null);
                    setAyatRangeError('');
                  }
                }
              }}
              onSelect={(surah) => {
                handleSurahSelect(surah);
              }}
              placeholder={t('tahfiz.guruTahfiz.detailProgressTahfiz.suratPlaceholder')}
              required
              className=""
              availableSurahList={availableSurahList}
              surahProgressInfo={surahProgressInfo}
            />
            <input
              type="hidden"
              name="surat"
              value={suratInput}
            />
            {selectedSurah && (
              <div className="mt-2 text-xs text-slate-600">
                <span className="font-medium">{selectedSurah.namaLatin || selectedSurah.nama_latin}</span>
                {' '}({selectedSurah.jumlahAyat || selectedSurah.jumlah_ayat} ayat)
                {(() => {
                  const surahName = (selectedSurah.namaLatin || selectedSurah.nama_latin || '').toLowerCase().trim();
                  const info = surahProgressInfo.get(surahName);
                  if (info && !info.isFullyCompleted && info.nextAvailableDari > 1) {
                    return (
                      <span className="ml-2 text-violet-600">
                        • Range tersedia: {info.nextAvailableDari}-{info.nextAvailableSampai}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('tahfiz.guruTahfiz.detailProgressTahfiz.ayatDari')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="ayatDari"
                required
                min="1"
                max={selectedSurah ? (selectedSurah.jumlahAyat || selectedSurah.jumlah_ayat || 1) : undefined}
                value={ayatDari}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value);
                  setAyatDari(value);
                  setAyatRangeError('');
                  // Auto-update ayat sampai if dari is changed and sampai is less
                  if (typeof value === 'number' && typeof ayatSampai === 'number' && value > ayatSampai) {
                    setAyatSampai(value);
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm ${
                  ayatRangeError ? 'border-red-300' : 'border-slate-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('tahfiz.guruTahfiz.detailProgressTahfiz.ayatSampai')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="ayatSampai"
                required
                min="1"
                max={selectedSurah ? (selectedSurah.jumlahAyat || selectedSurah.jumlah_ayat || 1) : undefined}
                value={ayatSampai}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value);
                  setAyatSampai(value);
                  setAyatRangeError('');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm ${
                  ayatRangeError ? 'border-red-300' : 'border-slate-300'
                }`}
              />
            </div>
          </div>
          {ayatRangeError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {ayatRangeError}
            </div>
          )}
          {selectedSurah && !ayatRangeError && (
            <div className="text-xs text-slate-500">
              Maksimal ayat untuk surah ini: {selectedSurah.jumlahAyat || selectedSurah.jumlah_ayat} ayat
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('tahfiz.guruTahfiz.detailProgressTahfiz.tanggal')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal"
              required
              key={editingProgress?.id || 'new'}
              defaultValue={editingProgress?.tanggal || getTodayDate()}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              className="flex-1"
            >
              {t('tahfiz.guruTahfiz.detailProgressTahfiz.batal')}
            </Button>
            <Button type="submit" className="flex-1">
              {editingProgress ? t('tahfiz.guruTahfiz.detailProgressTahfiz.simpanPerubahan') : t('tahfiz.guruTahfiz.detailProgressTahfiz.tambahProgressHafalan')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DetailProgressTahfiz;
