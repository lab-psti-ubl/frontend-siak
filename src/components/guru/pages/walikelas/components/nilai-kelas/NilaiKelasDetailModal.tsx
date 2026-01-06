import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Badge from '../../../../../ui/Badge';
import {
  User,
  Nilai,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi
} from '../../../../../../types';
import {
  calculateKehadiran,
  calculateRataTugas,
  getGradeColor,
  calculateRataKomponen,
  getMaxTugasInfo,
  getMaxKomponenDinamisInfo
} from '../../../../../../utils/nilaiUtils';
import { useKomponenNilai } from '../../../../../../hooks/useKomponenNilai';

const colorSchemes = [
  { bg: 'from-teal-50 to-teal-100', border: 'border-teal-200', text: 'text-teal-600', label: 'text-teal-900', subtext: 'text-teal-700' },
  { bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-200', text: 'text-cyan-600', label: 'text-cyan-900', subtext: 'text-cyan-700' },
  { bg: 'from-sky-50 to-sky-100', border: 'border-sky-200', text: 'text-sky-600', label: 'text-sky-900', subtext: 'text-sky-700' },
  { bg: 'from-lime-50 to-lime-100', border: 'border-lime-200', text: 'text-lime-600', label: 'text-lime-900', subtext: 'text-lime-700' },
];

interface KomponenPenilaianGridProps {
  kehadiran: number;
  rataTugas: number;
  nilaiMurid: Nilai | undefined;
  KOMPONEN_NILAI: { kehadiran: number; tugas: number; uts: number; uas: number };
  getKomponenDinamis: () => { id: string; nama: string; persentase: number }[];
  getDinamicKomponenGrouped: () => Record<string, any[]>;
  showMoreMobile: boolean;
  setShowMoreMobile: (v: boolean) => void;
  maxKomponenDinamisInfo?: Record<string, number>; // Max count per komponen dinamis
}

const KomponenPenilaianGrid: React.FC<KomponenPenilaianGridProps> = ({
  kehadiran,
  rataTugas,
  nilaiMurid,
  KOMPONEN_NILAI,
  getKomponenDinamis,
  getDinamicKomponenGrouped,
  showMoreMobile,
  setShowMoreMobile,
  maxKomponenDinamisInfo = {}
}) => {
  const komponenDinamis = getKomponenDinamis();
  const grouped = getDinamicKomponenGrouped();

  // Build all cards
  const allCards: { key: string; content: React.ReactNode }[] = [
    {
      key: 'kehadiran',
      content: (
        <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow h-full">
          <div className="text-center">
            <div className="text-xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-1">{kehadiran.toFixed(1)}%</div>
            <div className="text-xs sm:text-sm font-semibold text-blue-900">Kehadiran</div>
            <div className="text-xs text-blue-700 mt-2">
              {((kehadiran / 100) * KOMPONEN_NILAI.kehadiran).toFixed(1)} poin
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'tugas',
      content: (
        <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow h-full">
          <div className="text-center">
            <div className="text-xl sm:text-3xl md:text-4xl font-bold text-emerald-600 mb-1">{rataTugas.toFixed(1)}</div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-900">Rata Tugas</div>
            <div className="text-xs text-emerald-700 mt-2">
              {((rataTugas / 100) * KOMPONEN_NILAI.tugas).toFixed(1)} poin
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'uts',
      content: (
        <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow h-full">
          <div className="text-center">
            <div className="text-xl sm:text-3xl md:text-4xl font-bold text-amber-600 mb-1">
              {nilaiMurid?.uts != null ? nilaiMurid.uts : '-'}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-amber-900">UTS</div>
            <div className="text-xs text-amber-700 mt-2">
              {nilaiMurid?.uts != null ? ((nilaiMurid.uts / 100) * KOMPONEN_NILAI.uts).toFixed(1) : '0'} poin
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'uas',
      content: (
        <div className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow h-full">
          <div className="text-center">
            <div className="text-xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-1">
              {nilaiMurid?.uas != null ? nilaiMurid.uas : '-'}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-red-900">UAS</div>
            <div className="text-xs text-red-700 mt-2">
              {nilaiMurid?.uas != null ? ((nilaiMurid.uas / 100) * KOMPONEN_NILAI.uas).toFixed(1) : '0'} poin
            </div>
          </div>
        </div>
      ),
    },
    ...komponenDinamis.map((komponen, idx) => {
      const komponenValues = grouped[komponen.nama] || [];
      const maxCount = maxKomponenDinamisInfo[komponen.nama] || null;
      const rataKomponen = calculateRataKomponen(komponenValues, maxCount);
      const scheme = colorSchemes[idx % colorSchemes.length];
      return {
        key: komponen.id,
        content: (
          <div className={`p-3 sm:p-4 bg-gradient-to-br ${scheme.bg} rounded-xl border ${scheme.border} shadow-sm hover:shadow-md transition-shadow h-full`}>
            <div className="text-center">
              <div className={`text-xl sm:text-3xl md:text-4xl font-bold ${scheme.text} mb-1`}>{rataKomponen.toFixed(1)}</div>
              <div className={`text-xs sm:text-sm font-semibold ${scheme.label}`}>{komponen.nama}</div>
              <div className={`text-xs ${scheme.subtext} mt-2`}>
                {((rataKomponen / 100) * komponen.persentase).toFixed(1)} poin
              </div>
            </div>
          </div>
        ),
      };
    }),
  ];

  const total = allCards.length;

  // Layout calculation
  const layout = useMemo(() => {
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
  }, [total]);

  const { xl, lg, md, sm } = layout;

  return (
    <div className=" space-y-5 md:space-y-6">
      {/* Desktop XL (>=1280px) */}
      <div className="hidden xl:block space-y-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${xl.cols}, 1fr)` }}>
          {allCards.slice(0, xl.main).map(c => <div key={c.key}>{c.content}</div>)}
        </div>
        {xl.remainder > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${xl.remainder}, 1fr)` }}>
            {allCards.slice(xl.main).map(c => <div key={c.key}>{c.content}</div>)}
          </div>
        )}
      </div>

      {/* Desktop LG (1024px - 1279px) */}
      <div className="hidden lg:block xl:hidden space-y-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${lg.cols}, 1fr)` }}>
          {allCards.slice(0, lg.main).map(c => <div key={c.key}>{c.content}</div>)}
        </div>
        {lg.remainder > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${lg.remainder}, 1fr)` }}>
            {allCards.slice(lg.main).map(c => <div key={c.key}>{c.content}</div>)}
          </div>
        )}
      </div>

      {/* Tablet MD (768px - 1023px) */}
      <div className="hidden md:block lg:hidden space-y-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${md.cols}, 1fr)` }}>
          {allCards.slice(0, md.main).map(c => <div key={c.key}>{c.content}</div>)}
        </div>
        {md.remainder > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${md.remainder}, 1fr)` }}>
            {allCards.slice(md.main).map(c => <div key={c.key}>{c.content}</div>)}
          </div>
        )}
      </div>

      {/* Mobile (<768px) */}
      <div className="block md:hidden space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {allCards.slice(0, sm.main).map(c => <div key={c.key}>{c.content}</div>)}
        </div>
        {sm.remainder > 0 && (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${sm.remainder}, 1fr)` }}>
            {allCards.slice(sm.main, sm.main + sm.remainder).map(c => <div key={c.key}>{c.content}</div>)}
          </div>
        )}
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
                {allCards.slice(6).map(c => <div key={c.key}>{c.content}</div>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface NilaiKelasDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  selectedMapel: string;
  kelasWali: string;
  activeTahunAjaran: { tahun: string; semester: number };
  getMapelName: (mapelId: string) => string;
  getGuruName: (mapelId: string) => string;
  getNilaiMurid: (muridId: string, mapelId: string) => Nilai | undefined;
  jadwalKelas: JadwalPelajaran[];
  absensi: Absensi[];
  sesiAbsensi: SesiAbsensi[];
  jadwalPelajaran: JadwalPelajaran[];
  nilai?: Nilai[]; // All nilai for max count calculation
}

const NilaiKelasDetailModal: React.FC<NilaiKelasDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  selectedMapel,
  kelasWali,
  activeTahunAjaran,
  getMapelName,
  getGuruName,
  getNilaiMurid,
  jadwalKelas,
  absensi,
  sesiAbsensi,
  jadwalPelajaran,
  nilai = []
}) => {
  const { komponenNilai: semuaKomponen } = useKomponenNilai();
  const [showMoreMobile, setShowMoreMobile] = useState(false);

  // Get all nilai for the same class and subject to calculate max counts
  // Must be before early return to maintain hook order
  const nilaiKelas = useMemo(() => {
    if (!selectedMapel || !kelasWali || !activeTahunAjaran || !nilai || nilai.length === 0) return [];
    return nilai.filter(n => 
      n.mataPelajaranId === selectedMapel && 
      n.kelasId === kelasWali &&
      n.semester === activeTahunAjaran.semester &&
      n.tahunAjaran === activeTahunAjaran.tahun
    );
  }, [nilai, selectedMapel, kelasWali, activeTahunAjaran]);

  // Get max tugas info
  const { maxCount: maxTugasCount, uniqueTugasNames } = useMemo(() => 
    getMaxTugasInfo(nilaiKelas), 
    [nilaiKelas]
  );

  // Get max komponen dinamis info
  const maxKomponenDinamisInfo = useMemo(() => 
    getMaxKomponenDinamisInfo(nilaiKelas), 
    [nilaiKelas]
  );

  // Default values
  const defaultKomponen = {
    kehadiran: 20,
    tugas: 30,
    uts: 25,
    uas: 25
  };

  // Get komponen values dari data API
  const KOMPONEN_NILAI = {
    kehadiran: semuaKomponen.find(k => k.nama === 'Kehadiran')?.persentase ?? defaultKomponen.kehadiran,
    tugas: semuaKomponen.find(k => k.nama === 'Tugas')?.persentase ?? defaultKomponen.tugas,
    uts: semuaKomponen.find(k => k.nama === 'UTS')?.persentase ?? defaultKomponen.uts,
    uas: semuaKomponen.find(k => k.nama === 'UAS')?.persentase ?? defaultKomponen.uas,
  };

  if (!selectedMurid || !selectedMapel) return null;

  const nilaiMurid = getNilaiMurid(selectedMurid.id, selectedMapel);
  const jadwalMapel = jadwalKelas.find(j => j.mataPelajaranId === selectedMapel);
  const kehadiran = calculateKehadiran(
    selectedMurid.id,
    selectedMapel,
    kelasWali,
    jadwalMapel?.guruId || '',
    activeTahunAjaran.semester,
    activeTahunAjaran.tahun,
    absensi,
    sesiAbsensi,
    jadwalPelajaran
  );
  const rataTugas = nilaiMurid ? calculateRataTugas(nilaiMurid.tugas, maxTugasCount, uniqueTugasNames) : 0;

  const getKomponenDinamis = () => {
    return semuaKomponen.filter(k => !['Kehadiran', 'Tugas', 'UTS', 'UAS'].includes(k.nama));
  };

  const getDinamicKomponenGrouped = () => {
    if (!nilaiMurid?.komponenDinamis) return {};
    const grouped: Record<string, any[]> = {};
    nilaiMurid.komponenDinamis.forEach(kd => {
      if (!grouped[kd.komponenNama]) {
        grouped[kd.komponenNama] = [];
      }
      grouped[kd.komponenNama].push(kd);
    });
    return grouped;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Nilai - ${selectedMurid.name}`}
      size="xl"
    >
      <div className="space-y-5 md:space-y-6">
        <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm md:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium text-slate-600">Nama:</span>
              <span className="font-semibold text-slate-900">{selectedMurid.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium text-slate-600">NISN:</span>
              <span className="font-semibold text-slate-900">{selectedMurid.nisn}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium text-slate-600">Mata Pelajaran:</span>
              <span className="font-semibold text-slate-900">{getMapelName(selectedMapel)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium text-slate-600">Guru:</span>
              <span className="font-semibold text-slate-900">{getGuruName(selectedMapel)}</span>
            </div>
            <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium text-slate-600">Periode:</span>
              <span className="font-semibold text-slate-900">{activeTahunAjaran.tahun} - Semester {activeTahunAjaran.semester}</span>
            </div>
          </div>
        </div>

        <KomponenPenilaianGrid
          kehadiran={kehadiran}
          rataTugas={rataTugas}
          nilaiMurid={nilaiMurid}
          KOMPONEN_NILAI={KOMPONEN_NILAI}
          getKomponenDinamis={getKomponenDinamis}
          getDinamicKomponenGrouped={getDinamicKomponenGrouped}
          showMoreMobile={showMoreMobile}
          setShowMoreMobile={setShowMoreMobile}
          maxKomponenDinamisInfo={maxKomponenDinamisInfo}
        />

        <div className="space-y-5 md:space-y-6">
          <div className=" p-4 sm:p-5 md:p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg text-center">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Nilai Akhir</h4>
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3">
              {nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir.toFixed(1) : '-'}
            </div>
            {nilaiMurid?.grade && (
              <div className={`inline-flex px-4 sm:px-5 py-2 rounded-lg text-sm sm:text-base font-bold ${getGradeColor(nilaiMurid.grade)}`}>
                Grade {nilaiMurid.grade}
              </div>
            )}
          </div>

          {nilaiMurid && nilaiMurid.tugas.length > 0 && (
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-3 md:mb-4">Detail Tugas</h4>
              <div className="space-y-2 sm:space-y-3">
                {nilaiMurid.tugas.map((tugas) => (
                  <div key={tugas.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900 text-sm sm:text-base block">{tugas.nama}</span>
                      {tugas.keterangan && (
                        <span className="text-xs sm:text-sm text-slate-600">({tugas.keterangan})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                        {new Date(tugas.tanggal).toLocaleDateString('id-ID')}
                      </span>
                      <Badge variant="success" size="sm">{tugas.nilai}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nilaiMurid && nilaiMurid.komponenDinamis && nilaiMurid.komponenDinamis.length > 0 && (
            <div className="pb-14 sm:pb-0">
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-3 md:mb-4">Detail Komponen Penilaian</h4>
              <div className="space-y-2 sm:space-y-3">
                {nilaiMurid.komponenDinamis.map((komponen) => (
                  <div key={komponen.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900 text-sm sm:text-base block">{komponen.komponenNama}</span>
                      {komponen.keterangan && (
                        <span className="text-xs sm:text-sm text-slate-600">({komponen.keterangan})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                        {new Date(komponen.tanggal).toLocaleDateString('id-ID')}
                      </span>
                      <Badge variant="info" size="sm">{komponen.nilai}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NilaiKelasDetailModal;
