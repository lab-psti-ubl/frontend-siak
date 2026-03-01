import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, BookOpen, ArrowLeft, User, Calendar, X } from 'lucide-react';
import { ProgressHafalan } from '../../../../../hooks/useProgressHafalan';
import { useAuth } from '../../../../../context/AuthContext';
import { useLanguage } from '../../../../../context/LanguageContext';
import Button from '../../../../ui/Button';
import AudioPlayer from './AudioPlayer';

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

interface DetailPerbaikanModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ProgressHafalan;
}

const DetailPerbaikanModal: React.FC<DetailPerbaikanModalProps> = ({
  isOpen,
  onClose,
  progress,
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedLafadz, setHighlightedLafadz] = useState<Set<string>>(new Set());

  const getHasilTesInfo = () => {
    if (!progress?.hasilTes) return null;

    const info = {
      'Jayid': {
        icon: AlertTriangle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        titleColor: 'text-amber-900',
        arabic: 'جيد',
        keputusan: t('tahfiz.muridTahfiz.detailPerbaikanModal.perbaikanTerlebihDahulu'),
        catatan: t('tahfiz.muridTahfiz.detailPerbaikanModal.catatanJayid').replace('{surat}', progress.surat).replace('{ayatDari}', progress.ayatDari.toString()).replace('{ayatSampai}', progress.ayatSampai.toString()),
      },
      'Maqbul': {
        icon: XCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        titleColor: 'text-red-900',
        arabic: 'مقبول',
        keputusan: t('tahfiz.muridTahfiz.detailPerbaikanModal.wajibPerbaikan'),
        catatan: t('tahfiz.muridTahfiz.detailPerbaikanModal.catatanMaqbul').replace('{surat}', progress.surat).replace('{ayatDari}', progress.ayatDari.toString()).replace('{ayatSampai}', progress.ayatSampai.toString()),
      },
    };

    return info[progress.hasilTes as 'Jayid' | 'Maqbul'];
  };

  useEffect(() => {
    const fetchSurahData = async () => {
      if (!isOpen || !progress?.surat) return;

      setLoading(true);
      setError(null);

      try {
        // Find surah number
        const surahListResponse = await fetch('https://equran.id/api/v2/surat');
        const surahListData = await surahListResponse.json();
        
        if (!surahListData.data) {
          setError(t('tahfiz.muridTahfiz.detailPerbaikanModal.gagalMengambilDataSurah'));
          return;
        }

        const surah = surahListData.data.find(
          (s: any) => {
            const namaLatin = s.namaLatin || s.nama_latin || '';
            return (
              namaLatin.toLowerCase() === progress.surat.toLowerCase() ||
              s.nama.toLowerCase() === progress.surat.toLowerCase() ||
              s.arti.toLowerCase().includes(progress.surat.toLowerCase())
            );
          }
        );

        if (!surah) {
          setError(t('tahfiz.muridTahfiz.detailPerbaikanModal.suratTidakDitemukan'));
          return;
        }

        // Fetch surah details with ayat
        const response = await fetch(`https://equran.id/api/v2/surat/${surah.nomor}`);
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
          setError(t('tahfiz.muridTahfiz.detailPerbaikanModal.dataAyatTidakDitemukan'));
        }
      } catch (err) {
        console.error('Error fetching surah data:', err);
        setError(t('tahfiz.muridTahfiz.detailPerbaikanModal.gagalMemuatDataAyat'));
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSurahData();
    } else {
      setSurahData(null);
      setError(null);
      setHighlightedLafadz(new Set());
    }
  }, [isOpen, progress, t]);

  const splitIntoLafadz = (text: string): string[] => {
    if (!text) return [];
    return text.trim().split(/\s+/).filter(word => word.trim().length > 0);
  };

  const getLafadzKey = (ayatNomor: number, lafadzIndex: number): string => {
    return `${ayatNomor}-${lafadzIndex}`;
  };

  const hasilTesInfo = getHasilTesInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-lg sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Quran-style Header with User Info - Amber/Orange for Perbaikan */}
        <div className="bg-gradient-to-br from-amber-700 via-amber-600 to-orange-700 shadow-2xl relative overflow-hidden flex-shrink-0">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                onClick={onClose}
                variant="secondary"
                className="!p-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                title={t('tahfiz.muridTahfiz.detailPerbaikanModal.tutup')}
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-2">
                  {hasilTesInfo?.icon && <hasilTesInfo.icon className="w-8 h-8 sm:w-10 sm:h-10" />}
                  {t('tahfiz.muridTahfiz.detailPerbaikanModal.title')}
                </h1>
                <p className="text-sm sm:text-base text-amber-100">
                  {t('tahfiz.muridTahfiz.commonLabels.juz')} {progress.juz} • {progress.surat} • {t('tahfiz.muridTahfiz.commonLabels.ayat')} {progress.ayatDari}-{progress.ayatSampai}
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="secondary"
                className="!p-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                title={t('tahfiz.muridTahfiz.detailPerbaikanModal.tutup')}
              >
                <X size={20} />
              </Button>
            </div>

            {/* User Info Card - Quran Style */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border-2 border-white/20 p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg border-2 border-white/30">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{user?.name || t('tahfiz.muridTahfiz.commonLabels.murid')}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-amber-100">
                      {(user as any)?.nisn && (
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">{t('tahfiz.muridTahfiz.commonLabels.nisn')}:</span> {(user as any).nisn}
                        </span>
                      )}
                      {user?.email && (
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">{t('tahfiz.muridTahfiz.commonLabels.email')}:</span> {user.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 border border-white/30">
                  <Calendar className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">
                    {new Date().toLocaleDateString((language === 'ms' ? 'ms-MY' : 'id-ID'), { 
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50">
          <div className="p-4 sm:p-6 lg:p-8 space-y-4">
            {/* Hasil Tes Info */}
            {hasilTesInfo && (
              <div className={`${hasilTesInfo.bgColor} border-2 ${hasilTesInfo.borderColor} rounded-xl p-5 shadow-lg`}>
                <div className="flex items-start gap-3">
                  {hasilTesInfo.icon && <hasilTesInfo.icon className={`w-7 h-7 ${hasilTesInfo.textColor} flex-shrink-0 mt-1`} />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-xl font-bold ${hasilTesInfo.titleColor}`}>
                        {progress.hasilTes} ({hasilTesInfo.arabic})
                      </h3>
                    </div>
                    <p className={`font-semibold ${hasilTesInfo.titleColor} mb-2 text-base`}>
                      {hasilTesInfo.keputusan}
                    </p>
                    <p className={`text-sm ${hasilTesInfo.textColor} leading-relaxed`}>
                      {hasilTesInfo.catatan}
                    </p>
                    {progress.tanggalTes && (
                      <p className={`text-xs ${hasilTesInfo.textColor} mt-3 opacity-75`}>
                        {t('tahfiz.muridTahfiz.detailPerbaikanModal.tanggalTes')}: {new Date(progress.tanggalTes).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Poin Perbaikan */}
            {progress.poinPerbaikan && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 shadow-lg">
                <h4 className="font-bold text-amber-900 mb-3 text-base">{t('tahfiz.muridTahfiz.detailPerbaikanModal.poinPerbaikan')}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {progress.poinPerbaikan.kelancaranHafalan && (
                    <div className="bg-white rounded-lg p-3 border-2 border-amber-200 shadow-sm">
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {t('tahfiz.muridTahfiz.detailPerbaikanModal.kelancaranHafalan')}
                      </label>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {progress.poinPerbaikan.kelancaranHafalan}
                      </p>
                    </div>
                  )}

                  {progress.poinPerbaikan.ketepatanAyat && (
                    <div className="bg-white rounded-lg p-3 border-2 border-amber-200 shadow-sm">
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {t('tahfiz.muridTahfiz.detailPerbaikanModal.ketepatanAyat')}
                      </label>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {progress.poinPerbaikan.ketepatanAyat}
                      </p>
                    </div>
                  )}

                  {progress.poinPerbaikan.tajwid && (
                    <div className="bg-white rounded-lg p-3 border-2 border-amber-200 shadow-sm">
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {t('tahfiz.muridTahfiz.detailPerbaikanModal.tajwid')}
                      </label>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {progress.poinPerbaikan.tajwid}
                      </p>
                    </div>
                  )}

                  {progress.poinPerbaikan.fashahah && (
                    <div className="bg-white rounded-lg p-3 border-2 border-amber-200 shadow-sm">
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {t('tahfiz.muridTahfiz.detailPerbaikanModal.fashahah')}
                      </label>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {progress.poinPerbaikan.fashahah}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Catatan Perbaikan */}
            {progress.catatanPerbaikan && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-lg">
                <h4 className="font-bold text-amber-900 mb-2 text-base">{t('tahfiz.muridTahfiz.detailPerbaikanModal.catatanPerbaikan')}</h4>
                <p className="text-sm text-amber-800 whitespace-pre-line leading-relaxed">
                  {progress.catatanPerbaikan}
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                  <BookOpen className="w-8 h-8 text-amber-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-base text-amber-800 font-medium mt-6">{t('tahfiz.muridTahfiz.detailPerbaikanModal.memuatDataAyat')}</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {surahData && !loading && !error && (
              <>
                {/* Quran-style Surah Header - Amber/Orange theme */}
                <div className="relative mb-8">
                  <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 rounded-2xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 relative overflow-hidden">
                    {/* Decorative corners */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-amber-400 rounded-br-2xl"></div>
                    
                    <div className="relative text-center">
                      <div className="inline-block bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-full px-6 py-3 mb-4 shadow-lg">
                        <h3 className="text-2xl sm:text-3xl font-bold mb-1">
                          {surahData.namaLatin || surahData.nama_latin || surahData.nama}
                        </h3>
                        <p className="text-lg text-amber-100">{surahData.arti}</p>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-amber-800">
                        <span className="text-sm font-semibold">
                          📍 {surahData.tempatTurun || surahData.tempat_turun || 'Makkiyah/Madaniyah'}
                        </span>
                        <span className="text-2xl text-amber-600">•</span>
                        <span className="text-sm font-semibold">
                          {surahData.jumlahAyat || surahData.jumlah_ayat || 0} {t('tahfiz.muridTahfiz.commonLabels.ayat')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ayat List - Quran Style Layout with Amber/Orange theme */}
                <div className="space-y-6">
                  {surahData.ayat.map((ayat) => {
                    const nomorAyat = ayat.nomorAyat || ayat.nomor || 0;
                    const teksArab = ayat.teksArab || ayat.teks_arab || '';
                    const lafadzList = splitIntoLafadz(teksArab);
                    
                    return (
                      <div
                        key={nomorAyat}
                        className="bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50 border-4 border-amber-300 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                        style={{
                          minHeight: '400px',
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fef3c7 100%)',
                        }}
                      >
                        {/* Decorative Quran-style borders - Orange/Amber */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600"></div>
                        
                        {/* Decorative corner ornaments - Orange/Amber */}
                        <div className="absolute top-4 left-4 w-12 h-12 border-2 border-amber-600 rounded-lg opacity-20"></div>
                        <div className="absolute top-4 right-4 w-12 h-12 border-2 border-amber-600 rounded-lg opacity-20"></div>
                        <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-amber-600 rounded-lg opacity-20"></div>
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-amber-600 rounded-lg opacity-20"></div>

                        <div className="relative z-10">
                          {/* Ayat Number Header - Quran Style with Amber/Orange */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div className="flex items-center justify-center">
                              <div className="relative">
                                <div className="absolute inset-0 bg-amber-600 rounded-full blur-md opacity-30"></div>
                                <div className="relative bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-4 border-amber-200">
                                  <span className="text-xl font-bold">{nomorAyat}</span>
                                </div>
                              </div>
                              <div className="ml-4 text-center">
                                <span className="text-sm font-semibold text-amber-800 block">{t('tahfiz.muridTahfiz.commonLabels.ayat')}</span>
                                <span className="text-lg font-bold text-amber-900">{nomorAyat}</span>
                              </div>
                            </div>
                            {/* Audio Player */}
                            <AudioPlayer
                              surahNumber={surahData.nomor}
                              ayatNumber={nomorAyat}
                              reciter="alafasy"
                              className="w-full sm:w-auto"
                            />
                          </div>

                          {/* Arabic Text - Quran Style with Highlighted Lafadz */}
                          <div className="mb-6 bg-white/40 rounded-xl p-6 border-2 border-amber-200 shadow-inner">
                            <div 
                              className="text-3xl sm:text-4xl leading-relaxed text-right"
                              dir="rtl"
                              style={{ 
                                fontFamily: 'Amiri, Scheherazade New, Lateef, serif', 
                                lineHeight: '2.8',
                                color: '#78350f'
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
      </div>
    </div>
  );
};

export default DetailPerbaikanModal;

