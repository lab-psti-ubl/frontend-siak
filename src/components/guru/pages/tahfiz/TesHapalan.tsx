import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, XCircle, Loader2, CheckCircle2, AlertCircle, User, BookOpen, Calendar } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { ProgressHafalan, useProgressHafalan } from '../../../../hooks/useProgressHafalan';
import { useSantri } from '../../../../hooks/useSantri';

interface Ayat {
  nomorAyat?: number;
  nomor?: number;
  teksArab?: string;
  teks_arab: string;
  teksLatin?: string;
  teks_latin: string;
  teksIndonesia?: string;
  terjemahan?: string;
  terjemahan_id?: string;
}

interface SurahData {
  nomor: number;
  nama: string;
  namaLatin?: string;
  nama_latin?: string;
  jumlahAyat?: number;
  jumlah_ayat?: number;
  tempatTurun?: string;
  tempat_turun?: string;
  arti: string;
  deskripsi?: string;
  audio?: string;
  ayat: Ayat[];
}

interface LafadzPosition {
  ayatNomor: number;
  lafadzIndex: number;
}

const TesHapalan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const progress = location.state?.progress as ProgressHafalan | null;

  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLafadz, setSelectedLafadz] = useState<Set<string>>(new Set());
  const [surahNomor, setSurahNomor] = useState<number | null>(null);
  const [showHasilTesForm, setShowHasilTesForm] = useState(false);
  const [hasilTes, setHasilTes] = useState<'Mumtaz' | 'Jayid Jiddan' | 'Jayid' | 'Maqbul' | ''>('');
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Poin perbaikan state
  const [poinPerbaikan, setPoinPerbaikan] = useState({
    kelancaranHafalan: '',
    ketepatanAyat: '',
    tajwid: '',
    fashahah: '',
  });
  
  const { saveHasilTes } = useProgressHafalan(progress?.santriId);
  const { santri } = useSantri();
  const { t } = useLanguage();
  
  // Get santri data from santriId
  const santriData = progress?.santriId 
    ? santri.find(s => s.id === progress.santriId)
    : null;
  const santriName = santriData?.name || 'Santri';

  // Initialize catatan perbaikan if progress has previous catatan for retest
  useEffect(() => {
    if (progress?.catatanPerbaikan && progress.hasilTes && (progress.hasilTes === 'Jayid' || progress.hasilTes === 'Maqbul')) {
      setCatatanPerbaikan(progress.catatanPerbaikan);
    }
    // Initialize poin perbaikan if exists
    if (progress?.poinPerbaikan) {
      setPoinPerbaikan({
        kelancaranHafalan: progress.poinPerbaikan.kelancaranHafalan || '',
        ketepatanAyat: progress.poinPerbaikan.ketepatanAyat || '',
        tajwid: progress.poinPerbaikan.tajwid || '',
        fashahah: progress.poinPerbaikan.fashahah || '',
      });
    }
  }, [progress]);

  // Find surah number from surah name
  useEffect(() => {
    const findSurahNumber = async () => {
      if (!progress?.surat) {
        setError(t('tahfiz.guruTahfiz.tesHapalan.dataTidakDitemukan'));
        return;
      }

      try {
        const response = await fetch('https://equran.id/api/v2/surat');
        const data = await response.json();
        if (data.data) {
          const surah = data.data.find(
            (s: any) => {
              const namaLatin = s.namaLatin || s.nama_latin || '';
              return (
                namaLatin.toLowerCase() === progress.surat.toLowerCase() ||
                s.nama.toLowerCase() === progress.surat.toLowerCase() ||
                s.arti.toLowerCase().includes(progress.surat.toLowerCase())
              );
            }
          );
          if (surah) {
            setSurahNomor(surah.nomor);
          } else {
            setError(t('tahfiz.guruTahfiz.tesHapalan.suratTidakDitemukan'));
          }
        }
      } catch (err) {
        console.error('Error finding surah:', err);
        setError(t('tahfiz.guruTahfiz.tesHapalan.gagalMengambilDataSurah'));
      }
    };

    if (progress) {
      findSurahNumber();
    }
  }, [progress]);

  // Fetch surah data with ayat
  useEffect(() => {
    const fetchSurahData = async () => {
      if (!surahNomor || !progress) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://equran.id/api/v2/surat/${surahNomor}`);
        const data = await response.json();
        
        if (data.data && data.data.ayat) {
          // Filter ayat berdasarkan range yang dipilih
          const filteredAyat = data.data.ayat.filter(
            (ayat: Ayat) => {
              const nomor = ayat.nomorAyat || ayat.nomor || 0;
              return nomor >= progress.ayatDari && nomor <= progress.ayatSampai;
            }
          );

          setSurahData({
            ...data.data,
            ayat: filteredAyat,
          });
        } else {
          setError(t('tahfiz.guruTahfiz.tesHapalan.dataAyatTidakDitemukan'));
        }
      } catch (err) {
        console.error('Error fetching surah data:', err);
        setError(t('tahfiz.guruTahfiz.tesHapalan.gagalMemuatDataAyat'));
      } finally {
        setLoading(false);
      }
    };

    if (surahNomor) {
      fetchSurahData();
    }
  }, [surahNomor, progress]);

  // Split Arabic text into words (lafadz)
  const splitIntoLafadz = (text: string): string[] => {
    if (!text) return [];
    
    // Split by spaces and filter out empty strings
    // Arabic words are separated by spaces, but we need to handle punctuation carefully
    const words = text
      .trim()
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    // Handle cases where punctuation might be attached to words
    const processedWords: string[] = [];
    words.forEach(word => {
      // Check if word ends with Arabic punctuation marks (like verse markers)
      // For now, we keep words as is since API should already have proper formatting
      if (word.length > 0) {
        processedWords.push(word);
      }
    });
    
    return processedWords;
  };

  // Generate unique key for lafadz
  const getLafadzKey = (ayatNomor: number, lafadzIndex: number): string => {
    return `${ayatNomor}-${lafadzIndex}`;
  };

  // Handle toggle lafadz
  const handleToggleLafadz = (ayatNomor: number, lafadzIndex: number) => {
    const key = getLafadzKey(ayatNomor, lafadzIndex);
    setSelectedLafadz((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleClearAll = () => {
    setSelectedLafadz(new Set());
  };

  const handleSimpanTes = () => {
    // Show form hasil tes after marking errors
    setShowHasilTesForm(true);
  };

  const handleSaveHasilTes = async () => {
    if (!hasilTes || !progress) {
      alert(t('tahfiz.guruTahfiz.tesHapalan.silakanPilihHasilTes'));
      return;
    }

    // Validate perbaikan form for Jayid/Maqbul
    // Catatan perbaikan wajib jika hasil tes adalah Jayid atau Maqbul
    if ((hasilTes === 'Jayid' || hasilTes === 'Maqbul') && !catatanPerbaikan.trim()) {
      alert(t('tahfiz.guruTahfiz.tesHapalan.silakanIsiCatatanPerbaikan') + ' ' + hasilTes);
      return;
    }

    // Validate poin perbaikan for Jayid/Maqbul
    if ((hasilTes === 'Jayid' || hasilTes === 'Maqbul')) {
      if (!poinPerbaikan.kelancaranHafalan || !poinPerbaikan.ketepatanAyat || 
          !poinPerbaikan.tajwid || !poinPerbaikan.fashahah) {
        alert(t('tahfiz.guruTahfiz.tesHapalan.silakanLengkapiPoinPerbaikan'));
        return;
      }
    }

    setSaving(true);
    try {
      const lafadzErrors = Array.from(selectedLafadz);
      
      // Get local device date (YYYY-MM-DD format)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const tanggalTes = `${year}-${month}-${day}`;

      await saveHasilTes(progress.id, {
        hasilTes: hasilTes as 'Mumtaz' | 'Jayid Jiddan' | 'Jayid' | 'Maqbul',
        lafadzKesalahan: lafadzErrors,
        catatanPerbaikan: catatanPerbaikan.trim() || undefined,
        poinPerbaikan: (hasilTes === 'Jayid' || hasilTes === 'Maqbul') ? poinPerbaikan : undefined,
        tanggalTes,
      });

      // Navigate back to progress page
      navigate(`/dashboard/progress-tahfiz/${progress.santriId}`, {
        state: { message: t('tahfiz.guruTahfiz.tesHapalan.hasilTesBerhasilDisimpan') }
      });
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : t('tahfiz.guruTahfiz.tesHapalan.gagalMenyimpanHasilTes');
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Redirect if no progress data
  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.guruTahfiz.tesHapalan.dataTidakDitemukan')}</h3>
          <p className="text-sm text-slate-600 mb-4">{t('tahfiz.guruTahfiz.tesHapalan.dataTidakDitemukanDesc')}</p>
          <Button onClick={() => navigate('/dashboard/progress-tahfiz')}>
            {t('tahfiz.guruTahfiz.tesHapalan.kembaliKeProgress')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100">
      {/* Quran-style Header with Student Info */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 shadow-2xl relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate(`/dashboard/progress-tahfiz/${progress.santriId}`)}
              variant="secondary"
              className="!p-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              title="Kembali"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                📖 {t('tahfiz.guruTahfiz.tesHapalan.title')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                Juz {progress.juz} • {progress.surat} • Ayat {progress.ayatDari}-{progress.ayatSampai}
              </p>
            </div>
          </div>

          {/* Student Info Card - Quran Style */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border-2 border-white/20 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white/30">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{santriName}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-emerald-100">
                    {santriData?.nisn && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">NISN:</span> {santriData.nisn}
                      </span>
                    )}
                    {santriData?.email && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">Email:</span> {santriData.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 border border-white/30">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Quran Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <BookOpen className="w-8 h-8 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-base text-emerald-800 font-medium mt-6">{t('tahfiz.guruTahfiz.tesHapalan.memuatDataAyat')}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Surah Data */}
        {surahData && !loading && !error && (
          <>
            {/* Quran-style Surah Header */}
            <div className="relative mb-8">
              <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100 rounded-2xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 relative overflow-hidden">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-amber-400 rounded-br-2xl"></div>
                
                <div className="relative text-center">
                  <div className="inline-block bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-full px-6 py-3 mb-4 shadow-lg">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-1">
                      {surahData.namaLatin || surahData.nama_latin || surahData.nama}
                    </h3>
                    <p className="text-lg text-emerald-100">{surahData.arti}</p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-emerald-800">
                    <span className="text-sm font-semibold">
                      📍 {surahData.tempatTurun || surahData.tempat_turun || 'Makkiyah/Madaniyah'}
                    </span>
                    <span className="text-2xl text-emerald-600">•</span>
                    <span className="text-sm font-semibold">
                      {surahData.jumlahAyat || surahData.jumlah_ayat || 0} Ayat
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions - Quran Style */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 mb-6 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">{t('tahfiz.guruTahfiz.tesHapalan.petunjukTesHapalan')}:</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {t('tahfiz.guruTahfiz.tesHapalan.petunjukTesHapalanDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Lafadz Summary - Quran Style */}
            {selectedLafadz.size > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 mb-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-amber-900 block">
                        {t('tahfiz.guruTahfiz.tesHapalan.ditemukanLafadzKesalahan')} <span className="text-lg text-amber-700">{selectedLafadz.size}</span> {t('tahfiz.guruTahfiz.tesHapalan.lafadzDenganKesalahan')}
                      </span>
                      <span className="text-xs text-amber-700">{t('tahfiz.guruTahfiz.tesHapalan.klikReset')}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleClearAll}
                    className="bg-white hover:bg-amber-100 text-amber-700 border-2 border-amber-300"
                  >
                    {t('tahfiz.guruTahfiz.tesHapalan.resetSemua')}
                  </Button>
                </div>
              </div>
            )}

            {/* Ayat List - Quran Style Two-Page Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
              {surahData.ayat.map((ayat) => {
                const nomorAyat = ayat.nomorAyat || ayat.nomor || 0;
                const teksArab = ayat.teksArab || ayat.teks_arab || '';
                const lafadzList = splitIntoLafadz(teksArab);
                
                return (
                  <div
                    key={nomorAyat}
                    className="bg-gradient-to-br from-amber-50 via-amber-50/50 to-amber-100 border-4 border-amber-300 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                    style={{
                      minHeight: '400px',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%)',
                    }}
                  >
                    {/* Decorative Quran-style borders */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600"></div>
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600"></div>
                    
                    {/* Decorative corner ornaments */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-2 border-emerald-600 rounded-lg opacity-20"></div>
                    <div className="absolute top-4 right-4 w-12 h-12 border-2 border-emerald-600 rounded-lg opacity-20"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-emerald-600 rounded-lg opacity-20"></div>
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-emerald-600 rounded-lg opacity-20"></div>

                    <div className="relative z-10">
                      {/* Ayat Number Header - Quran Style */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-600 rounded-full blur-md opacity-30"></div>
                          <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-4 border-amber-200">
                            <span className="text-xl font-bold">{nomorAyat}</span>
                          </div>
                        </div>
                        <div className="ml-4 text-center">
                          <span className="text-sm font-semibold text-emerald-800 block">Ayat</span>
                          <span className="text-lg font-bold text-emerald-900">{nomorAyat}</span>
                        </div>
                      </div>

                      {/* Arabic Text with Clickable Lafadz - Quran Style */}
                      <div className="mb-6 bg-white/40 rounded-xl p-6 border-2 border-amber-200 shadow-inner">
                        <div 
                          className="text-3xl sm:text-4xl leading-relaxed text-right"
                          dir="rtl"
                          style={{ 
                            fontFamily: 'Amiri, Scheherazade New, Lateef, serif', 
                            lineHeight: '2.8',
                            color: '#1a472a'
                          }}
                        >
                          {lafadzList.map((lafadz, index) => {
                            const key = getLafadzKey(nomorAyat, index);
                            const hasError = selectedLafadz.has(key);
                            
                            return (
                              <span
                                key={index}
                                onClick={() => handleToggleLafadz(nomorAyat, index)}
                                className={`
                                  inline-block px-2 py-1 mx-0.5 rounded cursor-pointer transition-all select-none
                                  ${
                                    hasError
                                      ? 'bg-red-300 text-red-900 ring-2 ring-red-500 shadow-md'
                                      : 'hover:bg-emerald-100 hover:ring-1 hover:ring-emerald-400'
                                  }
                                `}
                                title={hasError ? t('tahfiz.guruTahfiz.tesHapalan.klikHapusTanda') : t('tahfiz.guruTahfiz.tesHapalan.klikTandaiKesalahan')}
                              >
                                {lafadz}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Latin Text - Quran Style */}
                      <div className="mb-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-300 shadow-sm">
                        <p className="text-sm italic text-slate-700 text-center font-medium">
                          {ayat.teksLatin || ayat.teks_latin}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons - Quran Style */}
            <div className="sticky bottom-0 z-50 mt-8">
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-6 shadow-2xl border-4 border-amber-300">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/dashboard/progress-tahfiz/${progress.santriId}`)}
                    className="flex-1 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 backdrop-blur-sm font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('tahfiz.guruTahfiz.tesHapalan.batal')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSimpanTes}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-2 border-amber-400 shadow-lg font-semibold text-lg py-3"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2 inline" />
                    {t('tahfiz.guruTahfiz.tesHapalan.lanjutkanKeHasilTes')}
                    {selectedLafadz.size > 0 && (
                      <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                        {selectedLafadz.size} {t('tahfiz.guruTahfiz.tesHapalan.kesalahan')}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Form Hasil Tes - Quran Style */}
      <Modal
        isOpen={showHasilTesForm}
        onClose={() => setShowHasilTesForm(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-900">{t('tahfiz.guruTahfiz.tesHapalan.hasilTesHafalan')}</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveHasilTes(); }} className="space-y-6">
          {/* Form Hasil Tes - Quran Style */}
          <div>
            <label className="block text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
              {t('tahfiz.guruTahfiz.tesHapalan.pilihHasilTes')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setHasilTes('Mumtaz');
                  setCatatanPerbaikan('');
                }}
                className={`p-5 border-2 rounded-xl text-left transition-all shadow-lg ${
                  hasilTes === 'Mumtaz'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 ring-4 ring-green-200'
                    : 'border-slate-300 bg-white hover:border-green-400 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    hasilTes === 'Mumtaz' ? 'bg-green-500' : 'bg-slate-300'
                  }`}>
                    {hasilTes === 'Mumtaz' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  <div className="font-bold text-lg text-slate-900">{t('tahfiz.guruTahfiz.tesHapalan.hasilTesMumtaz')} (ممتاز)</div>
                </div>
                <div className="text-sm text-slate-700 font-semibold">{t('tahfiz.guruTahfiz.tesHapalan.bolehLanjut')}</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasilTes('Jayid Jiddan');
                  setCatatanPerbaikan('');
                }}
                className={`p-5 border-2 rounded-xl text-left transition-all shadow-lg ${
                  hasilTes === 'Jayid Jiddan'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 ring-4 ring-blue-200'
                    : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    hasilTes === 'Jayid Jiddan' ? 'bg-blue-500' : 'bg-slate-300'
                  }`}>
                    {hasilTes === 'Jayid Jiddan' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  <div className="font-bold text-lg text-slate-900">{t('tahfiz.guruTahfiz.tesHapalan.hasilTesJayidJiddan')} (جيد جدًا)</div>
                </div>
                <div className="text-sm text-slate-700 font-semibold">{t('tahfiz.guruTahfiz.tesHapalan.bolehLanjutDenganMurajaah')}</div>
              </button>
              <button
                type="button"
                onClick={() => setHasilTes('Jayid')}
                className={`p-5 border-2 rounded-xl text-left transition-all shadow-lg ${
                  hasilTes === 'Jayid'
                    ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 ring-4 ring-amber-200'
                    : 'border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    hasilTes === 'Jayid' ? 'bg-amber-500' : 'bg-slate-300'
                  }`}>
                    {hasilTes === 'Jayid' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  <div className="font-bold text-lg text-slate-900">{t('tahfiz.guruTahfiz.tesHapalan.hasilTesJayid')} (جيد)</div>
                </div>
                <div className="text-sm text-slate-700 font-semibold">{t('tahfiz.guruTahfiz.tesHapalan.perbaikanTerlebihDahulu')}</div>
              </button>
              <button
                type="button"
                onClick={() => setHasilTes('Maqbul')}
                className={`p-5 border-2 rounded-xl text-left transition-all shadow-lg ${
                  hasilTes === 'Maqbul'
                    ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 ring-4 ring-red-200'
                    : 'border-slate-300 bg-white hover:border-red-400 hover:bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    hasilTes === 'Maqbul' ? 'bg-red-500' : 'bg-slate-300'
                  }`}>
                    {hasilTes === 'Maqbul' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  <div className="font-bold text-lg text-slate-900">{t('tahfiz.guruTahfiz.tesHapalan.hasilTesMaqbul')} (مقبول)</div>
                </div>
                <div className="text-sm text-slate-700 font-semibold">{t('tahfiz.guruTahfiz.tesHapalan.wajibPerbaikan')}</div>
              </button>
            </div>
          </div>

          {/* Catatan Hasil Tes (Auto-generated preview) - Quran Style */}
          {hasilTes && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <div className="text-sm font-bold text-emerald-900">{t('tahfiz.guruTahfiz.tesHapalan.catatanHasilTes')}:</div>
              </div>
              <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-white/60 rounded-lg p-4 border border-amber-200">
                {hasilTes === 'Mumtaz' && t('tahfiz.guruTahfiz.detailHafalan.catatanMumtaz', { 
                  santriName, 
                  surat: progress.surat, 
                  ayatDari: progress.ayatDari, 
                  ayatSampai: progress.ayatSampai 
                })}
                {hasilTes === 'Jayid Jiddan' && t('tahfiz.guruTahfiz.detailHafalan.catatanJayidJiddan', { 
                  santriName, 
                  surat: progress.surat, 
                  ayatDari: progress.ayatDari, 
                  ayatSampai: progress.ayatSampai 
                })}
                {hasilTes === 'Jayid' && t('tahfiz.guruTahfiz.detailHafalan.catatanJayid', { 
                  santriName, 
                  surat: progress.surat, 
                  ayatDari: progress.ayatDari, 
                  ayatSampai: progress.ayatSampai 
                })}
                {hasilTes === 'Maqbul' && t('tahfiz.guruTahfiz.detailHafalan.catatanMaqbul', { 
                  santriName, 
                  surat: progress.surat, 
                  ayatDari: progress.ayatDari, 
                  ayatSampai: progress.ayatSampai 
                })}
              </div>
            </div>
          )}

          {/* Poin Perbaikan untuk Jayid/Maqbul - Quran Style */}
          {(hasilTes === 'Jayid' || hasilTes === 'Maqbul') && (
            <div className="space-y-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-300">
              <div>
                <h3 className="text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                  {t('tahfiz.guruTahfiz.tesHapalan.poinPerbaikan')} <span className="text-red-500">*</span>
                </h3>
                
                {/* a. Kelancaran Hafalan */}
                <div className="mb-4 bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    {t('tahfiz.guruTahfiz.detailHafalan.kelancaranHafalan')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={poinPerbaikan.kelancaranHafalan}
                    onChange={(e) => setPoinPerbaikan({ ...poinPerbaikan, kelancaranHafalan: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white font-medium"
                  >
                    <option value="">{t('tahfiz.guruTahfiz.tesHapalan.pilihPoinKelancaran')}</option>
                    <option value="Sangat lancar, tanpa berhenti, tanpa bantuan">Sangat lancar, tanpa berhenti, tanpa bantuan</option>
                    <option value="Lancar, jeda sangat sedikit">Lancar, jeda sangat sedikit</option>
                    <option value="Cukup lancar, beberapa kali berhenti">Cukup lancar, beberapa kali berhenti</option>
                    <option value="Kurang lancar, sering ragu">Kurang lancar, sering ragu</option>
                    <option value="Tidak lancar, hafalan terputus-putus">Tidak lancar, hafalan terputus-putus</option>
                  </select>
                </div>

                {/* b. Ketepatan Ayat */}
                <div className="mb-4 bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    {t('tahfiz.guruTahfiz.detailHafalan.ketepatanAyat')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={poinPerbaikan.ketepatanAyat}
                    onChange={(e) => setPoinPerbaikan({ ...poinPerbaikan, ketepatanAyat: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white font-medium"
                  >
                    <option value="">{t('tahfiz.guruTahfiz.tesHapalan.pilihPoinKetepatan')}</option>
                    <option value="Ayat sangat tepat, tanpa kesalahan">Ayat sangat tepat, tanpa kesalahan</option>
                    <option value="Ada 1–2 kesalahan kecil">Ada 1–2 kesalahan kecil</option>
                    <option value="Beberapa kesalahan lafaz/urutan">Beberapa kesalahan lafaz/urutan</option>
                    <option value="Banyak kesalahan ayat">Banyak kesalahan ayat</option>
                    <option value="Ayat sering salah/tidak sesuai">Ayat sering salah/tidak sesuai</option>
                  </select>
                </div>

                {/* c. Tajwid */}
                <div className="mb-4 bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    {t('tahfiz.guruTahfiz.detailHafalan.tajwid')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={poinPerbaikan.tajwid}
                    onChange={(e) => setPoinPerbaikan({ ...poinPerbaikan, tajwid: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white font-medium"
                  >
                    <option value="">{t('tahfiz.guruTahfiz.tesHapalan.pilihPoinTajwid')}</option>
                    <option value="Tajwid sangat baik & konsisten">Tajwid sangat baik & konsisten</option>
                    <option value="Kesalahan ringan, jarang">Kesalahan ringan, jarang</option>
                    <option value="Kesalahan tajwid berulang">Kesalahan tajwid berulang</option>
                    <option value="Banyak kesalahan dasar">Banyak kesalahan dasar</option>
                    <option value="Tajwid tidak diterapkan">Tajwid tidak diterapkan</option>
                  </select>
                </div>

                {/* d. Fashahah (Kejelasan Bacaan) */}
                <div className="mb-4 bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    {t('tahfiz.guruTahfiz.detailHafalan.fashahah')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={poinPerbaikan.fashahah}
                    onChange={(e) => setPoinPerbaikan({ ...poinPerbaikan, fashahah: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white font-medium"
                  >
                    <option value="">{t('tahfiz.guruTahfiz.tesHapalan.pilihPoinFashahah')}</option>
                    <option value="Bacaan sangat jelas & fasih">Bacaan sangat jelas & fasih</option>
                    <option value="Jelas, sedikit pengaruh logat">Jelas, sedikit pengaruh logat</option>
                    <option value="Cukup jelas">Cukup jelas</option>
                    <option value="Kurang jelas">Kurang jelas</option>
                    <option value="Tidak jelas">Tidak jelas</option>
                  </select>
                </div>
              </div>

              {/* Form Catatan Perbaikan - Quran Style */}
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                  {t('tahfiz.guruTahfiz.tesHapalan.catatanPerbaikan')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={catatanPerbaikan}
                  onChange={(e) => setCatatanPerbaikan(e.target.value)}
                  rows={5}
                  required
                  placeholder={t('tahfiz.guruTahfiz.tesHapalan.catatanPerbaikanPlaceholder')}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none bg-white font-medium"
                />
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  💡 {t('tahfiz.guruTahfiz.tesHapalan.catatanPerbaikanInfo')}
                </p>
              </div>
            </div>
          )}

          {/* Info untuk tes ulang - Quran Style */}
          {progress?.hasilTes && (progress.hasilTes === 'Jayid' || progress.hasilTes === 'Maqbul') && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-blue-900">
                  {t('tahfiz.guruTahfiz.tesHapalan.tesUlangHapalan')}
                </span>
              </div>
              <div className="text-sm text-blue-800 leading-relaxed bg-white/60 rounded-lg p-3 border border-blue-200">
                {t('tahfiz.guruTahfiz.tesHapalan.tesUlangHapalanDesc')} <strong className="text-blue-900">{progress.hasilTes}</strong>. 
                {t('tahfiz.guruTahfiz.tesHapalan.jikaHasilTesUlang')} <strong>Mumtaz</strong> {t('tahfiz.guruTahfiz.tesHapalan.atau')} <strong>Jayid Jiddan</strong>, {t('tahfiz.guruTahfiz.tesHapalan.hafalanAkanDiterima')}.
                {t('tahfiz.guruTahfiz.tesHapalan.tanggalTesDiperbarui')}
              </div>
            </div>
          )}

          {/* Summary Kesalahan - Quran Style */}
          {selectedLafadz.size > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-amber-900">
                  {t('tahfiz.guruTahfiz.tesHapalan.ditemukanLafadzKesalahan')} <span className="text-lg text-amber-700">{selectedLafadz.size}</span> {t('tahfiz.guruTahfiz.tesHapalan.lafadzDenganKesalahan')}
                </span>
              </div>
              <div className="text-sm text-amber-800 bg-white/60 rounded-lg p-3 border border-amber-200">
                {t('tahfiz.guruTahfiz.tesHapalan.lafadzDitandai')}
              </div>
            </div>
          )}

          {/* Action Buttons - Quran Style */}
          <div className="flex flex-col sm:flex-row pb-14 sm:pb-0 gap-4 pt-4 border-t-2 border-amber-200 ">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowHasilTesForm(false)}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 border-2 border-slate-300 font-semibold"
              disabled={saving}
            >
              <XCircle className="w-4 h-4 mr-2 inline" />
              {t('tahfiz.guruTahfiz.tesHapalan.batal')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-2 border-emerald-500 shadow-lg font-bold text-lg py-3"
              disabled={saving || !hasilTes}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                  {t('tahfiz.guruTahfiz.tesHapalan.menyimpan')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2 inline" />
                  {t('tahfiz.guruTahfiz.tesHapalan.simpanHasilTes')}
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TesHapalan;
