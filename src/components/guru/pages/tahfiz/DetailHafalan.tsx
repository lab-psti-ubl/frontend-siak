import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, RefreshCw, BookOpen, Calendar, User } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import { getDateLocale } from '../../../../utils/dateLocaleUtils';
import Button from '../../../ui/Button';
import { ProgressHafalan } from '../../../../hooks/useProgressHafalan';
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
  ayat: Ayat[];
}

const DetailHafalan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { santriId } = useParams<{ santriId: string }>();
  const progress = location.state?.progress as ProgressHafalan | null;
  const { t, language } = useLanguage();

  const { santri } = useSantri();
  const selectedSantri = santri.find((s) => s.id === santriId || s.id === progress?.santriId);

  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surahNomor, setSurahNomor] = useState<number | null>(null);
  const [highlightedLafadz, setHighlightedLafadz] = useState<Set<string>>(new Set());

  // Find surah number from surah name
  useEffect(() => {
    const findSurahNumber = async () => {
      if (!progress?.surat) {
        setError(t('tahfiz.guruTahfiz.detailHafalan.dataTidakDitemukan'));
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
            setError(t('tahfiz.guruTahfiz.detailHafalan.suratTidakDitemukan'));
          }
        }
      } catch (err) {
        console.error('Error finding surah:', err);
        setError(t('tahfiz.guruTahfiz.detailHafalan.gagalMengambilDataSurah'));
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

          // Highlight lafadz kesalahan if exists
          if (progress.lafadzKesalahan && progress.lafadzKesalahan.length > 0) {
            setHighlightedLafadz(new Set(progress.lafadzKesalahan));
          }
        } else {
          setError(t('tahfiz.guruTahfiz.detailHafalan.dataAyatTidakDitemukan'));
        }
      } catch (err) {
        console.error('Error fetching surah data:', err);
        setError(t('tahfiz.guruTahfiz.detailHafalan.gagalMemuatDataAyat'));
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
    return text.trim().split(/\s+/).filter(word => word.trim().length > 0);
  };

  const getLafadzKey = (ayatNomor: number, lafadzIndex: number): string => {
    return `${ayatNomor}-${lafadzIndex}`;
  };

  const getHasilTesInfo = () => {
    if (!progress?.hasilTes) return null;

    const info = {
      'Mumtaz': {
        icon: CheckCircle2,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        titleColor: 'text-green-900',
        arabic: 'ممتاز',
        keputusan: t('tahfiz.guruTahfiz.tesHapalan.bolehLanjut'),
        catatan: t('tahfiz.guruTahfiz.detailHafalan.catatanMumtaz', { 
          santriName: selectedSantri?.name || '', 
          surat: progress.surat, 
          ayatDari: progress.ayatDari, 
          ayatSampai: progress.ayatSampai 
        }),
      },
      'Jayid Jiddan': {
        icon: CheckCircle2,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        titleColor: 'text-blue-900',
        arabic: 'جيد جدًا',
        keputusan: t('tahfiz.guruTahfiz.tesHapalan.bolehLanjutDenganMurajaah'),
        catatan: t('tahfiz.guruTahfiz.detailHafalan.catatanJayidJiddan', { 
          santriName: selectedSantri?.name || '', 
          surat: progress.surat, 
          ayatDari: progress.ayatDari, 
          ayatSampai: progress.ayatSampai 
        }),
      },
      'Jayid': {
        icon: AlertTriangle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        titleColor: 'text-amber-900',
        arabic: 'جيد',
        keputusan: t('tahfiz.guruTahfiz.tesHapalan.perbaikanTerlebihDahulu'),
        catatan: t('tahfiz.guruTahfiz.detailHafalan.catatanJayid', { 
          santriName: selectedSantri?.name || '', 
          surat: progress.surat, 
          ayatDari: progress.ayatDari, 
          ayatSampai: progress.ayatSampai 
        }),
      },
      'Maqbul': {
        icon: XCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        titleColor: 'text-red-900',
        arabic: 'مقبول',
        keputusan: t('tahfiz.guruTahfiz.tesHapalan.wajibPerbaikan'),
        catatan: t('tahfiz.guruTahfiz.detailHafalan.catatanMaqbul', { 
          santriName: selectedSantri?.name || '', 
          surat: progress.surat, 
          ayatDari: progress.ayatDari, 
          ayatSampai: progress.ayatSampai 
        }),
      },
    };

    return info[progress.hasilTes as keyof typeof info];
  };

  const hasilTesInfo = getHasilTesInfo();

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.guruTahfiz.detailHafalan.dataTidakDitemukan')}</h3>
          <Button onClick={() => navigate('/dashboard/progress-tahfiz')}>
            {t('tahfiz.guruTahfiz.detailHafalan.kembaliKeProgress')}
          </Button>
        </div>
      </div>
    );
  }

  // Determine color theme based on hasil tes
  const isPerbaikan = progress?.hasilTes === 'Jayid' || progress?.hasilTes === 'Maqbul';
  const headerBgColor = isPerbaikan 
    ? 'bg-gradient-to-br from-amber-700 via-amber-600 to-orange-700'
    : 'bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900';
  const contentBgColor = isPerbaikan
    ? 'bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50'
    : 'bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100';
  const surahHeaderBg = isPerbaikan
    ? 'bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 border-4 border-amber-300'
    : 'bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100 border-4 border-amber-300';
  const surahTitleBg = isPerbaikan
    ? 'bg-gradient-to-br from-amber-600 to-orange-700'
    : 'bg-gradient-to-br from-emerald-600 to-emerald-800';
  const borderColor = isPerbaikan
    ? 'from-amber-600 via-orange-500 to-amber-600'
    : 'from-emerald-600 via-emerald-500 to-emerald-600';
  const ayatNumberBg = isPerbaikan
    ? 'bg-gradient-to-br from-amber-600 to-orange-700 border-4 border-amber-200'
    : 'bg-gradient-to-br from-emerald-600 to-emerald-800 border-4 border-amber-200';
  const ayatNumberShadow = isPerbaikan
    ? 'bg-amber-600'
    : 'bg-emerald-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100">
      {/* Quran-style Header with Student Info */}
      <div className={`${headerBgColor} shadow-2xl relative overflow-hidden`}>
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
              title={t('tahfiz.guruTahfiz.riwayatAbsensiTahfiz.kembali')}
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-2">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />
                {isPerbaikan ? t('tahfiz.guruTahfiz.detailHafalan.detailPerbaikan') : t('tahfiz.guruTahfiz.detailHafalan.title')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {selectedSantri?.name || 'Santri'} • Juz {progress.juz} • {progress.surat} • Ayat {progress.ayatDari}-{progress.ayatSampai}
              </p>
            </div>
          </div>

          {/* Student Info Card - Quran Style */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border-2 border-white/20 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-14 h-14 rounded-full ${isPerbaikan ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-amber-400 to-amber-600'} flex items-center justify-center shadow-lg border-2 border-white/30`}>
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{selectedSantri?.name || 'Santri'}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-emerald-100">
                    {(selectedSantri as any)?.nisn && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">NISN:</span> {(selectedSantri as any).nisn}
                      </span>
                    )}
                    {selectedSantri?.email && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">Email:</span> {selectedSantri.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 border border-white/30">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">
                  {new Date().toLocaleDateString(getDateLocale(language), { 
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

      {/* Content */}
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${contentBgColor}`}>
        {/* Hasil Tes Info */}
        {hasilTesInfo && (
          <div className={`${hasilTesInfo.bgColor} border-2 ${hasilTesInfo.borderColor} rounded-lg p-6 mb-6`}>
            <div className="flex items-start gap-4">
              <hasilTesInfo.icon className={`w-8 h-8 ${hasilTesInfo.textColor} flex-shrink-0 mt-1`} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-xl font-bold ${hasilTesInfo.titleColor}`}>
                    {progress.hasilTes === 'Mumtaz' ? t('tahfiz.guruTahfiz.tesHapalan.hasilTesMumtaz') :
                     progress.hasilTes === 'Jayid Jiddan' ? t('tahfiz.guruTahfiz.tesHapalan.hasilTesJayidJiddan') :
                     progress.hasilTes === 'Jayid' ? t('tahfiz.guruTahfiz.tesHapalan.hasilTesJayid') :
                     t('tahfiz.guruTahfiz.tesHapalan.hasilTesMaqbul')} ({hasilTesInfo.arabic})
                  </h3>
                </div>
                <p className={`font-semibold ${hasilTesInfo.titleColor} mb-3`}>
                  {hasilTesInfo.keputusan}
                </p>
                <p className={`text-sm ${hasilTesInfo.textColor} leading-relaxed`}>
                  {hasilTesInfo.catatan}
                </p>
                {progress.tanggalTes && (
                  <p className={`text-xs ${hasilTesInfo.textColor} mt-3 opacity-75`}>
                    {t('tahfiz.guruTahfiz.detailHafalan.tanggalTes')}: {new Date(progress.tanggalTes).toLocaleDateString(getDateLocale(language))}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Poin Perbaikan untuk Jayid/Maqbul */}
        {(progress.hasilTes === 'Jayid' || progress.hasilTes === 'Maqbul') && progress.poinPerbaikan && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              
              {t('tahfiz.guruTahfiz.detailHafalan.poinPerbaikan')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* a. Kelancaran Hafalan */}
              {progress.poinPerbaikan.kelancaranHafalan && (
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    {t('tahfiz.guruTahfiz.detailHafalan.kelancaranHafalan')}
                  </label>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {progress.poinPerbaikan.kelancaranHafalan}
                  </p>
                </div>
              )}

              {/* b. Ketepatan Ayat */}
              {progress.poinPerbaikan.ketepatanAyat && (
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    {t('tahfiz.guruTahfiz.detailHafalan.ketepatanAyat')}
                  </label>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {progress.poinPerbaikan.ketepatanAyat}
                  </p>
                </div>
              )}

              {/* c. Tajwid */}
              {progress.poinPerbaikan.tajwid && (
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    {t('tahfiz.guruTahfiz.detailHafalan.tajwid')}
                  </label>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {progress.poinPerbaikan.tajwid}
                  </p>
                </div>
              )}

              {/* d. Fashahah */}
              {progress.poinPerbaikan.fashahah && (
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    {t('tahfiz.guruTahfiz.detailHafalan.fashahah')}
                  </label>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {progress.poinPerbaikan.fashahah}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Catatan Perbaikan untuk Jayid/Maqbul */}
        {(progress.hasilTes === 'Jayid' || progress.hasilTes === 'Maqbul') && progress.catatanPerbaikan && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              
              {t('tahfiz.guruTahfiz.detailHafalan.catatanPerbaikan')}
            </h4>
            <p className="text-sm text-amber-800 whitespace-pre-line leading-relaxed">
              {progress.catatanPerbaikan}
            </p>
            {(progress.hasilTes === 'Jayid' || progress.hasilTes === 'Maqbul') && (
              <Button
                onClick={() => navigate(`/dashboard/progress-tahfiz/${progress.santriId}/tes-hapalan`, {
                  state: { progress }
                })}
                className="mt-4 flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('tahfiz.guruTahfiz.detailHafalan.tesUlangHapalan')}
              </Button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className={`w-20 h-20 border-4 ${isPerbaikan ? 'border-amber-200 border-t-amber-600' : 'border-emerald-200 border-t-emerald-600'} rounded-full animate-spin`}></div>
              <BookOpen className={`w-8 h-8 ${isPerbaikan ? 'text-amber-600' : 'text-emerald-600'} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`} />
            </div>
            <p className={`text-base ${isPerbaikan ? 'text-amber-800' : 'text-emerald-800'} font-medium mt-6`}>{t('tahfiz.guruTahfiz.detailHafalan.memuatDataAyat')}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Surah Data */}
        {surahData && !loading && !error && (
          <>
            {/* Quran-style Surah Header */}
            <div className="relative mb-8">
              <div className={`${surahHeaderBg} rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden`}>
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-amber-400 rounded-br-2xl"></div>
                
                <div className="relative text-center">
                  <div className={`inline-block ${surahTitleBg} text-white rounded-full px-6 py-3 mb-4 shadow-lg`}>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-1">
                      {surahData.namaLatin || surahData.nama_latin || surahData.nama}
                    </h3>
                    <p className="text-lg text-emerald-100">{surahData.arti}</p>
                  </div>
                  <div className={`flex items-center justify-center gap-4 ${isPerbaikan ? 'text-amber-800' : 'text-emerald-800'}`}>
                    <span className="text-sm font-semibold">
                      📍 {surahData.tempatTurun || surahData.tempat_turun || 'Makkiyah/Madaniyah'}
                    </span>
                    <span className={`text-2xl ${isPerbaikan ? 'text-amber-600' : 'text-emerald-600'}`}>•</span>
                    <span className="text-sm font-semibold">
                      {surahData.jumlahAyat || surahData.jumlah_ayat || 0} Ayat
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ayat List - Quran Style Layout */}
            <div className="space-y-6">
              {surahData.ayat.map((ayat) => {
                const nomorAyat = ayat.nomorAyat || ayat.nomor || 0;
                const teksArab = ayat.teksArab || ayat.teks_arab || '';
                const lafadzList = splitIntoLafadz(teksArab);
                
                return (
                  <div
                    key={nomorAyat}
                    className={`${isPerbaikan ? 'bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50' : 'bg-gradient-to-br from-amber-50 via-amber-50/50 to-amber-100'} border-4 border-amber-300 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden`}
                    style={{
                      minHeight: '400px',
                      background: isPerbaikan 
                        ? 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fef3c7 100%)'
                        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%)',
                    }}
                  >
                    {/* Decorative Quran-style borders */}
                    <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${borderColor}`}></div>
                    <div className={`absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r ${borderColor}`}></div>
                    
                    {/* Decorative corner ornaments */}
                    <div className={`absolute top-4 left-4 w-12 h-12 border-2 ${isPerbaikan ? 'border-amber-600' : 'border-emerald-600'} rounded-lg opacity-20`}></div>
                    <div className={`absolute top-4 right-4 w-12 h-12 border-2 ${isPerbaikan ? 'border-amber-600' : 'border-emerald-600'} rounded-lg opacity-20`}></div>
                    <div className={`absolute bottom-4 left-4 w-12 h-12 border-2 ${isPerbaikan ? 'border-amber-600' : 'border-emerald-600'} rounded-lg opacity-20`}></div>
                    <div className={`absolute bottom-4 right-4 w-12 h-12 border-2 ${isPerbaikan ? 'border-amber-600' : 'border-emerald-600'} rounded-lg opacity-20`}></div>

                    <div className="relative z-10">
                      {/* Ayat Number Header - Quran Style */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          <div className={`absolute inset-0 ${ayatNumberShadow} rounded-full blur-md opacity-30`}></div>
                          <div className={`relative ${ayatNumberBg} text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg`}>
                            <span className="text-xl font-bold">{nomorAyat}</span>
                          </div>
                        </div>
                        <div className="ml-4 text-center">
                          <span className={`text-sm font-semibold ${isPerbaikan ? 'text-amber-800' : 'text-emerald-800'} block`}>Ayat</span>
                          <span className={`text-lg font-bold ${isPerbaikan ? 'text-amber-900' : 'text-emerald-900'}`}>{nomorAyat}</span>
                        </div>
                      </div>

                      {/* Arabic Text - Quran Style with Highlighted Lafadz */}
                      <div className="mb-6 bg-white/40 rounded-xl p-6 border-2 border-amber-200 shadow-inner">
                        <div 
                          className="text-3xl sm:text-4xl leading-relaxed text-right"
                          dir="rtl"
                          style={{ 
                            fontFamily: 'Amiri, Scheherazade New, Lateef, serif', 
                            lineHeight: '2.8',
                            color: isPerbaikan ? '#78350f' : '#1a472a'
                          }}
                        >
                          {lafadzList.map((lafadz, index) => {
                            const key = getLafadzKey(nomorAyat, index);
                            const hasError = highlightedLafadz.has(key);
                            
                            return (
                              <span
                                key={index}
                                className={`
                                  inline-block px-2 py-1 mx-0.5 rounded
                                  ${
                                    hasError
                                      ? 'bg-red-300 text-red-900 ring-2 ring-red-500 shadow-md'
                                      : ''
                                  }
                                `}
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
          </>
        )}
      </div>
    </div>
  );
};

export default DetailHafalan;
