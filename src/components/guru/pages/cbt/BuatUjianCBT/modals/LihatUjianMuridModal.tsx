import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import type { CBTBankSoal, CBTOption, CBTSoalItem, CBTUjianAttempt, CBTUjianResponse } from '../../../../../types';

type SelectedMurid = {
  muridId: string;
  muridName: string;
  nisn?: string;
  attempt: CBTUjianAttempt | null;
  bankSoal: CBTBankSoal | null;
};

type Props = {
  selected: SelectedMurid | null;
  onClose: () => void;
  loading: boolean;
  essayReview: Record<string, 'benar' | 'salah'>;
  setEssayReview: React.Dispatch<React.SetStateAction<Record<string, 'benar' | 'salah'>>>;
  savingEssayReview: boolean;
  onSaveEssayReview: () => void;
};

function getResponseForSoal(attempt: CBTUjianAttempt | null, soalId: string): CBTUjianResponse | null {
  return attempt?.responses?.find((r: CBTUjianResponse) => r.soalId === soalId) ?? null;
}

function isSoalAnswered(response: CBTUjianResponse | null): boolean {
  if (!response) return false;
  if (response.selectedOptionIds?.length) return true;
  if (typeof response.jawabanBoolean === 'boolean') return true;
  if (response.jawabanEssay != null && String(response.jawabanEssay).trim() !== '') return true;
  return false;
}

function getJawabanStatus(
  soal: CBTSoalItem,
  response: CBTUjianResponse | null,
  essayReview: Record<string, 'benar' | 'salah'>
): 'benar' | 'salah' | null {
  if (!response || !isSoalAnswered(response)) return null;
  if (soal.tipe === 'essay') {
    const v = essayReview[soal.id];
    return v === 'benar' || v === 'salah' ? v : null;
  }
  if (response.isCorrectAuto === true) return 'benar';
  if (response.isCorrectAuto === false) return 'salah';
  return null;
}

const LihatUjianMuridModal: React.FC<Props> = ({
  selected,
  onClose,
  loading,
  essayReview,
  setEssayReview,
  savingEssayReview,
  onSaveEssayReview,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const soalList = selected?.bankSoal?.soal ?? [];
  const attempt = selected?.attempt;
  const currentSoal = soalList[currentIndex] ?? null;
  const currentResponse = useMemo(
    () => (currentSoal && attempt ? getResponseForSoal(attempt, currentSoal.id) : null),
    [attempt, currentSoal]
  );

  const essaySoalIds = useMemo(
    () => soalList.filter((s: CBTSoalItem) => s.tipe === 'essay').map((s: CBTSoalItem) => s.id),
    [soalList]
  );
  const allEssayReviewed =
    essaySoalIds.length === 0 ||
    essaySoalIds.every((id: string) => essayReview[id] === 'benar' || essayReview[id] === 'salah');

  const savedEssayReview = useMemo(() => {
    const out: Record<string, 'benar' | 'salah'> = {};
    attempt?.responses?.forEach((r: CBTUjianResponse) => {
      if (r.tipe === 'essay') {
        const raw = typeof r.isCorrect === 'boolean' ? r.isCorrect : r.isCorrectAuto;
        if (typeof raw === 'boolean') {
          out[r.soalId] = raw ? 'benar' : 'salah';
        }
      }
    });
    return out;
  }, [attempt?.responses]);

  const hasUnsavedChanges = useMemo(() => {
    for (const id of essaySoalIds) {
      const current = essayReview[id];
      const saved = savedEssayReview[id];
      if ((current === 'benar' || current === 'salah') !== (saved === 'benar' || saved === 'salah')) return true;
      if (current !== saved) return true;
    }
    return false;
  }, [essayReview, savedEssayReview, essaySoalIds]);

  const showSimpanFooter = attempt?.status === 'selesai' && (hasUnsavedChanges || !allEssayReviewed);

  const statusLabel = loading
    ? 'Memuat...'
    : !attempt
      ? 'Belum memulai ujian'
      : attempt.status === 'sedang'
        ? 'Sedang mengerjakan'
        : 'Selesai';
  const statusVariant =
    !attempt || attempt.status === 'belum_mulai'
      ? 'gray'
      : attempt.status === 'sedang'
        ? 'blue'
        : 'green';

  if (!selected) return null;

  return (
    <Modal isOpen={!!selected} onClose={onClose} title="Lihat Ujian Murid" size="full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
        {/* HEADER – Bar biru gelap seperti referensi CBT */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 bg-blue-800 text-white rounded-lg">
          <div>
            <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Nama Murid</div>
            <div className="text-base font-semibold mt-0.5">{selected.muridName}</div>
          </div>
          {selected.nisn && (
            <div>
              <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">NISN</div>
              <div className="text-sm font-semibold mt-0.5">{selected.nisn}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Status</div>
            <div className="mt-0.5">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                  statusVariant === 'green'
                    ? 'bg-emerald-500/30 text-white'
                    : statusVariant === 'blue'
                      ? 'bg-blue-400/50 text-white'
                      : 'bg-white/20 text-white'
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          {attempt && (
            <div>
              <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Nilai</div>
              <div className="text-sm font-semibold mt-0.5">
                {attempt.skorTotal ?? attempt.skorAuto ?? 0}
              </div>
            </div>
          )}
        </div>

        {/* MAIN: 2 KOLOM (70% kiri, 30% kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 min-h-0 flex-1">
          {/* KIRI – PANEL SOAL */}
          <div className="min-w-0 flex flex-col">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center text-slate-500">
                Memuat soal dan jawaban murid...
              </div>
            ) : soalList.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center text-slate-500">
                Belum ada soal pada bank soal ini.
              </div>
            ) : currentSoal ? (
              <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Soal No.</span>
                    <span className="inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded border-2 border-blue-500 bg-blue-50 text-blue-800 font-bold text-sm">
                      {currentIndex + 1}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                    Poin: {currentSoal.poin}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="text-slate-900 text-base leading-relaxed whitespace-pre-wrap">
                    {currentSoal.pertanyaan}
                  </div>
                  {currentSoal.gambar && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={currentSoal.gambar}
                        alt="Gambar soal"
                        className="max-w-full h-auto object-contain max-h-72"
                      />
                    </div>
                  )}

                  {/* Pilihan (pilihan_ganda / pilihan_ganda_kompleks) */}
                  {(currentSoal.tipe === 'pilihan_ganda' || currentSoal.tipe === 'pilihan_ganda_kompleks') &&
                    currentSoal.opsi &&
                    currentSoal.opsi.length > 0 && (
                      <div className="space-y-3 pt-3">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                          Opsi jawaban
                        </div>
                        {currentSoal.opsi.map((opt: CBTOption) => {
                          const isSelected = currentResponse?.selectedOptionIds?.includes(opt.id);
                          const isCorrect = Array.isArray(currentSoal.jawabanBenar) && currentSoal.jawabanBenar.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm ${
                                  isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-400 bg-white'
                                }`}
                              >
                                {isSelected ? '✓' : ''}
                              </span>
                              <span className="text-sm text-slate-900 flex-1 leading-relaxed">{opt.text}</span>
                              {isCorrect && (
                                <span className="text-xs text-emerald-600 font-medium">(Kunci)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* Benar/Salah */}
                  {currentSoal.tipe === 'benar_salah' && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-600 mb-1">Jawaban murid</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {currentResponse?.jawabanBoolean === true
                          ? 'Benar'
                          : currentResponse?.jawabanBoolean === false
                            ? 'Salah'
                            : '–'}
                      </div>
                    </div>
                  )}

                  {/* Essay */}
                  {currentSoal.tipe === 'essay' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-600 mb-1">Jawaban murid</div>
                        <div className="text-sm text-slate-800 whitespace-pre-wrap p-3 rounded-lg border border-slate-200 bg-slate-50">
                          {currentResponse?.jawabanEssay || '–'}
                        </div>
                      </div>
                      {currentSoal.jawabanBenar != null && String(currentSoal.jawabanBenar).trim() !== '' && (
                        <div>
                          <div className="text-xs font-semibold text-slate-600 mb-1">Jawaban referensi (bank soal)</div>
                          <div className="text-sm text-slate-700 whitespace-pre-wrap p-3 rounded-lg border border-emerald-200 bg-emerald-50/80">
                            {String(currentSoal.jawabanBenar).trim()}
                          </div>
                        </div>
                      )}
                      {attempt?.status === 'selesai' && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <span className="text-xs font-semibold text-slate-700">Penilaian guru:</span>
                          <Button
                            size="sm"
                            variant={essayReview[currentSoal.id] === 'benar' ? 'primary' : 'secondary'}
                            onClick={() => setEssayReview((prev) => ({ ...prev, [currentSoal.id]: 'benar' }))}
                          >
                            Benar
                          </Button>
                          <Button
                            size="sm"
                            variant={essayReview[currentSoal.id] === 'salah' ? 'danger' : 'secondary'}
                            onClick={() => setEssayReview((prev) => ({ ...prev, [currentSoal.id]: 'salah' }))}
                          >
                            Salah
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Menjodohkan: tampilkan sederhana jika ada */}
                  {currentSoal.tipe === 'menjodohkan' && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-600 mb-1">Jawaban murid</div>
                      <div className="text-xs text-slate-700">
                        {currentResponse?.selectedOptionIds?.length
                          ? 'Pilihan tersimpan (menjodohkan)'
                          : 'Belum dijawab'}
                      </div>
                    </div>
                  )}

                  {/* Status jawaban */}
                  <div className="pt-2 border-t border-slate-100">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        currentResponse && isSoalAnswered(currentResponse)
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {currentResponse && isSoalAnswered(currentResponse) ? 'Sudah dijawab' : 'Belum dijawab'}
                    </span>
                  </div>
                </div>
                {/* Navigasi Soal Sebelumnya / Selanjutnya */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Soal Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={currentIndex >= soalList.length - 1}
                    onClick={() => setCurrentIndex((i) => Math.min(soalList.length - 1, i + 1))}
                    className="flex items-center justify-center gap-1.5"
                  >
                    Soal Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-500 ml-2">
                    {currentIndex + 1} / {soalList.length}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* KANAN – PANEL NOMOR SOAL (seperti referensi CBT) */}
          <div className="lg:min-w-[320px] flex flex-col mb-10">
            <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-5 flex-shrink-0 sticky top-0">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
                Nomor Soal
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {soalList.map((soal: CBTSoalItem, idx: number) => {
                  const response = getResponseForSoal(attempt, soal.id);
                  const jawabanStatus = getJawabanStatus(soal, response, essayReview);
                  const isCurrent = idx === currentIndex;
                  const num = idx + 1;
                  return (
                    <button
                      key={soal.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`
                        w-full aspect-square min-h-[40px] rounded-lg border-2 text-sm font-semibold transition-all
                        flex items-center justify-center
                        ${isCurrent ? 'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-400 ring-offset-1' : ''}
                        ${!isCurrent && jawabanStatus === 'benar' ? 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}
                        ${!isCurrent && jawabanStatus === 'salah' ? 'border-red-300 bg-red-100 text-red-800 hover:bg-red-200' : ''}
                        ${!isCurrent && jawabanStatus === null ? 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200' : ''}
                      `}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded border-2 border-blue-500 bg-blue-100 flex-shrink-0" />
                  <span>Biru = Soal sedang dilihat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded border-2 border-emerald-300 bg-emerald-100 flex-shrink-0" />
                  <span>Hijau = Sudah dijawab benar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded border-2 border-red-300 bg-red-100 flex-shrink-0" />
                  <span>Merah = Sudah dijawab salah</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded border-2 border-slate-200 bg-slate-100 flex-shrink-0" />
                  <span>Abu-abu = Belum dijawab</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER – Simpan penilaian essay (tampil jika ada essay belum dinilai ATAU guru mengubah pilihan) */}
        {showSimpanFooter && (
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {hasUnsavedChanges
                ? 'Perubahan penilaian belum disimpan. Klik simpan untuk menyimpan.'
                : 'Tandai setiap soal essay sebagai benar atau salah, lalu klik simpan untuk menghitung nilai akhir murid.'}
            </p>
            <Button
              size="sm"
              variant="primary"
              disabled={savingEssayReview || Object.keys(essayReview).length === 0 || !attempt}
              onClick={onSaveEssayReview}
            >
              {savingEssayReview ? 'Menyimpan...' : 'Simpan Penilaian Essay'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LihatUjianMuridModal;
