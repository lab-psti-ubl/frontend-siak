import React, { useState, useEffect, useRef } from 'react';

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
  deskripsi?: string;
  audio?: string;
}

interface SurahProgressInfo {
  surah: Surah;
  nextAvailableDari: number;
  nextAvailableSampai: number;
  isFullyCompleted: boolean;
}

interface SuratAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (surah: Surah | null) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  availableSurahList?: Surah[];
  surahProgressInfo?: Map<string, SurahProgressInfo>;
}

const SuratAutocomplete: React.FC<SuratAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Ketik nama surat...',
  required = false,
  className = '',
  availableSurahList,
  surahProgressInfo,
}) => {
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [filteredSurah, setFilteredSurah] = useState<Surah[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use availableSurahList if provided, otherwise fetch from API
  useEffect(() => {
    if (availableSurahList && availableSurahList.length > 0) {
      setSurahList(availableSurahList);
    } else {
      const fetchSurahList = async () => {
        setLoading(true);
        try {
          const response = await fetch('https://equran.id/api/v2/surat');
          const data = await response.json();
          if (data.data) {
            // Filter out fully completed surahs if surahProgressInfo is provided
            if (surahProgressInfo) {
              const filtered = data.data.filter((surah: Surah) => {
                const surahName = (surah.namaLatin || surah.nama_latin || '').toLowerCase().trim();
                const info = surahProgressInfo.get(surahName);
                return !info || !info.isFullyCompleted;
              });
              setSurahList(filtered);
            } else {
              setSurahList(data.data);
            }
          }
        } catch (error) {
          console.error('Error fetching surah list:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchSurahList();
    }
  }, [availableSurahList, surahProgressInfo]);

  // Filter surah based on input value
  useEffect(() => {
    if (value && value.length > 0) {
      const filtered = surahList.filter((surah) => {
        const namaLatin = surah.namaLatin || surah.nama_latin || '';
        return (
          namaLatin.toLowerCase().includes(value.toLowerCase()) ||
          surah.nama.toLowerCase().includes(value.toLowerCase()) ||
          surah.arti.toLowerCase().includes(value.toLowerCase())
        );
      });
      setFilteredSurah(filtered.slice(0, 10)); // Limit to 10 results
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSurah([]);
      setShowSuggestions(false);
    }
  }, [value, surahList]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelectSurah = (surah: Surah) => {
    const namaLatin = surah.namaLatin || surah.nama_latin || '';
    onChange(namaLatin);
    if (onSelect) {
      onSelect(surah);
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (value && filteredSurah.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm ${className}`}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSurah.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSurah.map((surah) => {
            const surahName = (surah.namaLatin || surah.nama_latin || '').toLowerCase().trim();
            const info = surahProgressInfo?.get(surahName);
            const hasProgressInfo = info && !info.isFullyCompleted && info.nextAvailableDari > 1;

            return (
              <button
                key={surah.nomor}
                type="button"
                onClick={() => handleSelectSurah(surah)}
                className="w-full px-4 py-3 text-left hover:bg-violet-50 transition-colors border-b border-slate-100 last:border-b-0"
              >
                <div className="font-medium text-slate-900">{surah.namaLatin || surah.nama_latin}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {surah.arti} • {surah.jumlahAyat || surah.jumlah_ayat} ayat
                  {hasProgressInfo && (
                    <span className="ml-2 text-violet-600 font-medium">
                      • Tersedia: {info.nextAvailableDari}-{info.nextAvailableSampai}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuratAutocomplete;
