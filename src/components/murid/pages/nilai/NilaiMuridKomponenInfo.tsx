import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../../ui/Card';
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';

const colorConfig: Record<string, { bg: string; text: string; border: string }> = {
  'UTS': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  'UAS': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  'Tugas': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  'Kehadiran': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  'Praktek': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  'Ulangan Harian': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
};

const DEFAULT_COLORS = [
  { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-200' },
  { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  { bg: 'bg-lime-50', text: 'text-lime-600', border: 'border-lime-200' },
];

const NilaiMuridKomponenInfo: React.FC = () => {
  const { komponenNilai: displayKomponen, loading } = useKomponenNilai();
  const [showMoreMobile, setShowMoreMobile] = useState(false);

  const getColorClass = (nama: string, index: number) => {
    if (colorConfig[nama]) {
      return colorConfig[nama];
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  const renderCard = (komponen: { id: string; nama: string; persentase: number }, index: number) => {
    const colors = getColorClass(komponen.nama, index);
    return (
      <div
        key={komponen.id}
        className={`group p-4 sm:p-5 ${colors.bg} border ${colors.border} rounded-lg sm:rounded-xl text-center transition-all duration-200 hover:shadow-md hover:scale-105`}
      >
        <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${colors.text} mb-2`}>
          {komponen.persentase}%
        </div>
        <div className={`text-xs sm:text-sm font-semibold ${colors.text}`}>
          {komponen.nama}
        </div>
      </div>
    );
  };

  // Layout calculation
  const layout = useMemo(() => {
    const total = displayKomponen.length;
    
    // Desktop XL (>=1280px): max 6 kolom
    let xlMain = total, xlRemainder = 0, xlCols = Math.min(total, 6);
    if (total === 7) { xlMain = 6; xlRemainder = 1; xlCols = 6; }
    else if (total > 7) { xlMain = 6; xlRemainder = total - 6; xlCols = 6; }
    
    // Desktop LG (>=1024px): max 5 kolom  
    let lgMain = total, lgRemainder = 0, lgCols = Math.min(total, 5);
    if (total === 6) { lgMain = 4; lgRemainder = 2; lgCols = 4; }
    else if (total === 7) { lgMain = 5; lgRemainder = 2; lgCols = 5; }
    else if (total > 7) { lgMain = 5; lgRemainder = total - 5; lgCols = 5; }
    
    // Tablet MD (>=768px): max 4 kolom
    let mdMain = total, mdRemainder = 0, mdCols = Math.min(total, 4);
    if (total === 5) { mdMain = 5; mdRemainder = 0; mdCols = 5; }
    else if (total === 6) { mdMain = 4; mdRemainder = 2; mdCols = 4; }
    else if (total === 7) { mdMain = 4; mdRemainder = 3; mdCols = 4; }
    else if (total > 7) { mdMain = 4; mdRemainder = total - 4; mdCols = 4; }
    
    // Mobile SM (<768px): max 3 kolom, max 6 visible
    let smMain = Math.min(total, 3), smRemainder = 0, smHidden = 0;
    if (total === 4) { smMain = 3; smRemainder = 1; }
    else if (total === 5) { smMain = 3; smRemainder = 2; }
    else if (total === 6) { smMain = 3; smRemainder = 3; }
    else if (total >= 7) { smMain = 3; smRemainder = 3; smHidden = total - 6; }
    
    return { 
      total,
      xl: { main: xlMain, remainder: xlRemainder, cols: xlCols },
      lg: { main: lgMain, remainder: lgRemainder, cols: lgCols },
      md: { main: mdMain, remainder: mdRemainder, cols: mdCols },
      sm: { main: smMain, remainder: smRemainder, hidden: smHidden },
    };
  }, [displayKomponen.length]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></span>
          Komponen Penilaian
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">Memuat komponen penilaian...</p>
        </div>
      </Card>
    );
  }

  if (displayKomponen.length === 0) {
    return (
      <Card className="shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></span>
          Komponen Penilaian
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl text-slate-400">⚙️</span>
          </div>
          <p className="text-sm font-medium text-slate-600">Belum ada komponen penilaian</p>
        </div>
      </Card>
    );
  }

  const { xl, lg, md, sm } = layout;

  return (
    <Card className="shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
        <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></span>
        Komponen Penilaian
      </h3>

      {/* Desktop XL (>=1280px) */}
      <div className="hidden xl:block space-y-4">
        <div 
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${xl.cols}, 1fr)` }}
        >
          {displayKomponen.slice(0, xl.main).map((k, i) => renderCard(k, i))}
        </div>
        {xl.remainder > 0 && (
          <div 
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${xl.remainder}, 1fr)` }}
          >
            {displayKomponen.slice(xl.main).map((k, i) => renderCard(k, xl.main + i))}
          </div>
        )}
      </div>

      {/* Desktop LG (1024px - 1279px) */}
      <div className="hidden lg:block xl:hidden space-y-4">
        <div 
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${lg.cols}, 1fr)` }}
        >
          {displayKomponen.slice(0, lg.main).map((k, i) => renderCard(k, i))}
        </div>
        {lg.remainder > 0 && (
          <div 
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${lg.remainder}, 1fr)` }}
          >
            {displayKomponen.slice(lg.main).map((k, i) => renderCard(k, lg.main + i))}
          </div>
        )}
      </div>

      {/* Tablet MD (768px - 1023px) */}
      <div className="hidden md:block lg:hidden space-y-4">
        <div 
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${md.cols}, 1fr)` }}
        >
          {displayKomponen.slice(0, md.main).map((k, i) => renderCard(k, i))}
        </div>
        {md.remainder > 0 && (
          <div 
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${md.remainder}, 1fr)` }}
          >
            {displayKomponen.slice(md.main).map((k, i) => renderCard(k, md.main + i))}
          </div>
        )}
      </div>

      {/* Mobile (<768px) */}
      <div className="block md:hidden space-y-3">
        {/* Baris utama: 3 kolom */}
        <div className="grid grid-cols-3 gap-3">
          {displayKomponen.slice(0, sm.main).map((k, i) => renderCard(k, i))}
        </div>
        
        {/* Baris kedua: sisa card (max 3) */}
        {sm.remainder > 0 && (
          <div 
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${sm.remainder}, 1fr)` }}
          >
            {displayKomponen.slice(sm.main, sm.main + sm.remainder).map((k, i) => renderCard(k, sm.main + i))}
          </div>
        )}
        
        {/* Dropdown untuk card tersembunyi (jika total >= 7) */}
        {sm.hidden > 0 && (
          <>
            <button
              onClick={() => setShowMoreMobile(!showMoreMobile)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition-colors"
            >
              {showMoreMobile ? (
                <>
                  <ChevronUp size={16} />
                  Sembunyikan {sm.hidden} komponen lainnya
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Lihat {sm.hidden} komponen lainnya
                </>
              )}
            </button>
            
            {showMoreMobile && (
              <div className="grid grid-cols-1 gap-3">
                {displayKomponen.slice(6).map((k, i) => renderCard(k, 6 + i))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default NilaiMuridKomponenInfo;
