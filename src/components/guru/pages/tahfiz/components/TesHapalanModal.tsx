import React, { useState, useEffect } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { ProgressHafalan } from '../../../../../hooks/useProgressHafalan';

interface TesHapalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ProgressHafalan | null;
}

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

const TesHapalanModal: React.FC<TesHapalanModalProps> = ({
  isOpen,
  onClose,
  progress,
}) => {
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAyat, setSelectedAyat] = useState<Set<number>>(new Set());
  const [surahNomor, setSurahNomor] = useState<number | null>(null);

  // Find surah number from surah name
  useEffect(() => {
    const findSurahNumber = async () => {
      if (!progress?.surat) return;

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
            setError('Surat tidak ditemukan');
          }
        }
      } catch (err) {
        console.error('Error finding surah:', err);
        setError('Gagal mencari surat');
      }
    };

    if (isOpen && progress) {
      findSurahNumber();
    }
  }, [isOpen, progress]);

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
          setError('Data ayat tidak ditemukan');
        }
      } catch (err) {
        console.error('Error fetching surah data:', err);
        setError('Gagal memuat data ayat');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && surahNomor) {
      fetchSurahData();
    }
  }, [isOpen, surahNomor, progress]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSurahData(null);
      setSelectedAyat(new Set());
      setError(null);
      setSurahNomor(null);
    }
  }, [isOpen]);

  const handleToggleAyat = (nomorAyat: number) => {
    setSelectedAyat((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nomorAyat)) {
        newSet.delete(nomorAyat);
      } else {
        newSet.add(nomorAyat);
      }
      return newSet;
    });
  };

  const handleClearAll = () => {
    setSelectedAyat(new Set());
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    const ayatErrors = Array.from(selectedAyat).sort((a, b) => a - b);
    console.log('Ayat dengan kesalahan:', ayatErrors);
    alert(`Terjadi kesalahan pada ayat: ${ayatErrors.join(', ')}`);
    // You can add API call here to save the test results
  };

  if (!progress) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tes Hapalan"
      size="xl"
    >
      <div className="space-y-4">
        {/* Progress Info */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Juz:</span>
              <span className="ml-2 font-semibold text-slate-900">Juz {progress.juz}</span>
            </div>
            <div>
              <span className="text-slate-500">Surat:</span>
              <span className="ml-2 font-semibold text-slate-900">{progress.surat}</span>
            </div>
            <div>
              <span className="text-slate-500">Ayat:</span>
              <span className="ml-2 font-semibold text-slate-900">
                {progress.ayatDari} - {progress.ayatSampai}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-4" />
            <p className="text-sm text-slate-600">Memuat data ayat...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Surah Data */}
        {surahData && !loading && !error && (
          <>
            {/* Surah Header */}
            <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg p-4">
              <h3 className="text-lg font-bold mb-1">{surahData.namaLatin || surahData.nama_latin || surahData.nama}</h3>
              <p className="text-sm text-violet-100">{surahData.arti}</p>
              <p className="text-xs text-violet-200 mt-1">
                {surahData.tempatTurun || surahData.tempat_turun || ''} • {surahData.jumlahAyat || surahData.jumlah_ayat || 0} ayat
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Petunjuk:</strong> Klik pada ayat yang terjadi kesalahan hafalan. 
                Ayat yang diklik akan ditandai dengan background merah.
              </p>
            </div>

            {/* Selected Ayat Summary */}
            {selectedAyat.size > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    <strong>{selectedAyat.size}</strong> ayat dengan kesalahan: {' '}
                    {Array.from(selectedAyat)
                      .sort((a, b) => a - b)
                      .join(', ')}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleClearAll}
                  className="text-xs"
                >
                  Reset
                </Button>
              </div>
            )}

            {/* Ayat List */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {surahData.ayat.map((ayat) => {
                const nomorAyat = ayat.nomorAyat || ayat.nomor || 0;
                const hasError = selectedAyat.has(nomorAyat);
                return (
                  <div
                    key={nomorAyat}
                    onClick={() => handleToggleAyat(nomorAyat)}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${
                        hasError
                          ? 'bg-red-50 border-red-300 ring-2 ring-red-200'
                          : 'bg-white border-slate-200 hover:border-violet-300 hover:bg-violet-50'
                      }
                    `}
                  >
                    {/* Ayat Number */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                            ${
                              hasError
                                ? 'bg-red-500 text-white'
                                : 'bg-violet-100 text-violet-700'
                            }
                          `}
                        >
                          {nomorAyat}
                        </span>
                        {hasError && (
                          <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Ada kesalahan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arabic Text */}
                    <div className="text-right mb-3">
                      <p
                        className={`
                          text-2xl leading-relaxed font-arabic
                          ${hasError ? 'text-red-700' : 'text-slate-900'}
                        `}
                        dir="rtl"
                        style={{ fontFamily: 'Amiri, Scheherazade New, Lateef, serif' }}
                      >
                        {ayat.teksArab || ayat.teks_arab}
                      </p>
                    </div>

                    {/* Latin Text */}
                    <div className="mb-2">
                      <p
                        className={`
                          text-sm italic
                          ${hasError ? 'text-red-600' : 'text-slate-600'}
                        `}
                      >
                        {ayat.teksLatin || ayat.teks_latin}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Tutup
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="flex-1"
                disabled={selectedAyat.size === 0}
              >
                Simpan Hasil Tes
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default TesHapalanModal;
