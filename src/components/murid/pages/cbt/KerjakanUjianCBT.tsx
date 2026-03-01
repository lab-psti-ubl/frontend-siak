import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { useAuth } from '../../../../context/AuthContext';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { apiService } from '../../../../services/apiService';
import {
  CBTBankSoal,
  CBTSoalItem,
  CBTUjian,
  CBTUjianAttempt,
  CBTUjianResponse,
  CBTQuestionType,
} from '../../../../types';
import { showErrorNotification, showSuccessNotification } from '../../../../utils/notificationUtils';

type AnswerState = {
  [soalId: string]: CBTUjianResponse;
};

function isSoalAnswered(response: CBTUjianResponse | null | undefined): boolean {
  if (!response) return false;
  if (response.selectedOptionIds?.length) return true;
  if (typeof response.jawabanBoolean === 'boolean') return true;
  if (response.jawabanEssay != null && String(response.jawabanEssay).trim() !== '') return true;
  return false;
}

const KerjakanUjianCBT: React.FC = () => {
  const { ujianId, nisnMurid } = useParams<{ ujianId: string; nisnMurid?: string }>();
  const { user } = useAuth();
  const { tahunAjaran } = useTahunAjaran();
  const navigate = useNavigate();
  const location = useLocation();
  const isStandaloneAccess = location.pathname.startsWith('/ujian-cbt/');
  const backToListPath =
    isStandaloneAccess && nisnMurid
      ? `/ujian-cbt/${encodeURIComponent(nisnMurid)}`
      : '/dashboard/cbt-ujian';

  const activeTahunAjaran = tahunAjaran.find((ta) => ta.isActive);

  const [loading, setLoading] = useState(true);
  const [ujian, setUjian] = useState<CBTUjian | null>(null);
  const [bankSoal, setBankSoal] = useState<CBTBankSoal | null>(null);
  const [attempt, setAttempt] = useState<CBTUjianAttempt | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedSoal: CBTSoalItem[] = useMemo(
    () => bankSoal?.soal || [],
    [bankSoal]
  );

  // Pastikan currentIndex valid saat soal berubah
  useEffect(() => {
    if (sortedSoal.length > 0 && currentIndex >= sortedSoal.length) {
      setCurrentIndex(Math.max(0, sortedSoal.length - 1));
    }
  }, [sortedSoal.length, currentIndex]);

  useEffect(() => {
    const loadData = async () => {
      if (!ujianId || !user || user.role !== 'murid' || !activeTahunAjaran) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Ambil ujian
        const ujianRes = await apiService.getCBTUjianById(ujianId);
        if (!ujianRes.success || !ujianRes.data) {
          throw new Error(ujianRes.message || 'Ujian CBT tidak ditemukan.');
        }
        const ujianData = ujianRes.data as CBTUjian;

        // Pastikan murid di kelas yang sesuai
        if ((user as any).kelasId && ujianData.kelasId !== (user as any).kelasId) {
          throw new Error('Anda tidak terdaftar di kelas untuk ujian ini.');
        }

        setUjian(ujianData);

        // Ambil bank soal
        const bankRes = await apiService.getCBTBankSoalById(ujianData.bankSoalId);
        if (!bankRes.success || !bankRes.data) {
          throw new Error(bankRes.message || 'Bank soal untuk ujian ini tidak ditemukan.');
        }
        setBankSoal(bankRes.data as CBTBankSoal);

        // Mulai / ambil attempt
        const attemptRes = await apiService.startCBTUjianAttempt({
          ujianId: ujianData.id,
          muridId: user.id,
        });
        if (!attemptRes.success || !attemptRes.data) {
          throw new Error(attemptRes.message || 'Gagal memulai attempt ujian.');
        }
        const attemptData = attemptRes.data as CBTUjianAttempt;

        // Jika sudah selesai, kembali ke daftar ujian
        if (attemptData.status === 'selesai') {
          showSuccessNotification(
            'Info',
            'Anda sudah menyelesaikan ujian ini.'
          );
          navigate(backToListPath);
          return;
        }

        setAttempt(attemptData);

        // Inisialisasi jawaban dari attempt jika ada
        const initialAnswers: AnswerState = {};
        (attemptData.responses || []).forEach((r) => {
          initialAnswers[r.soalId] = {
            soalId: r.soalId,
            tipe: r.tipe,
            selectedOptionIds: r.selectedOptionIds || [],
            jawabanBoolean: r.jawabanBoolean,
            jawabanEssay: r.jawabanEssay || '',
          };
        });
        setAnswers(initialAnswers);
      } catch (error: any) {
        console.error(error);
        showErrorNotification(
          'Gagal',
          error.message || 'Terjadi kesalahan saat memuat ujian CBT.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTahunAjaran, backToListPath, navigate, ujianId, user]);

  // Setup countdown timer berdasarkan attempt + batas jadwal ujian
  useEffect(() => {
    if (!attempt || !ujian) {
      setRemainingSeconds(null);
      return;
    }

    const start = new Date(attempt.startedAt).getTime();
    const durationEnd = start + attempt.durasiMenit * 60 * 1000;

    // Batas maksimal sesuai jadwal ujian (tanggal + jam selesai)
    let scheduleEnd = Infinity;
    try {
      const scheduleEndDate = new Date(
        `${ujian.tanggalSelesai}T${ujian.jamSelesai || '23:59'}:59`
      );
      const ts = scheduleEndDate.getTime();
      if (!Number.isNaN(ts)) {
        scheduleEnd = ts;
      }
    } catch {
      // abaikan error parsing, fallback hanya ke durationEnd
    }

    const end = Math.min(durationEnd, scheduleEnd);

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setRemainingSeconds(diff);
    };

    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [attempt, ujian]);

  const isTimeOver = remainingSeconds !== null && remainingSeconds <= 0;

  const handleSelectOption = (soal: CBTSoalItem, optionId: string, multiple = false) => {
    if (isTimeOver || submitting) return;

    setAnswers((prev) => {
      const existing = prev[soal.id] || {
        soalId: soal.id,
        tipe: soal.tipe,
        selectedOptionIds: [],
      };

      let selectedOptionIds: string[] = [];

      if (multiple) {
        const set = new Set(existing.selectedOptionIds || []);
        if (set.has(optionId)) {
          set.delete(optionId);
        } else {
          set.add(optionId);
        }
        selectedOptionIds = Array.from(set);
      } else {
        selectedOptionIds = [optionId];
      }

      return {
        ...prev,
        [soal.id]: {
          ...existing,
          selectedOptionIds,
          jawabanBoolean: undefined,
        },
      };
    });
  };

  const handleSelectBenarSalah = (soal: CBTSoalItem, value: boolean) => {
    if (isTimeOver || submitting) return;

    setAnswers((prev) => {
      const existing = prev[soal.id] || {
        soalId: soal.id,
        tipe: soal.tipe,
      };

      return {
        ...prev,
        [soal.id]: {
          ...existing,
          jawabanBoolean: value,
          selectedOptionIds: [],
        },
      };
    });
  };

  const handleEssayChange = (soal: CBTSoalItem, text: string) => {
    if (isTimeOver || submitting) return;

    setAnswers((prev) => {
      const existing = prev[soal.id] || {
        soalId: soal.id,
        tipe: soal.tipe,
      };

      return {
        ...prev,
        [soal.id]: {
          ...existing,
          jawabanEssay: text,
        },
      };
    });
  };

  const submitUjian = async (options?: { auto?: boolean }) => {
    if (!attempt || !ujian) return;

    const responses: CBTUjianResponse[] = sortedSoal.map((soal) => {
      const ans = answers[soal.id];
      return {
        soalId: soal.id,
        tipe: soal.tipe as CBTQuestionType,
        selectedOptionIds: ans?.selectedOptionIds,
        jawabanBoolean: ans?.jawabanBoolean,
        jawabanEssay: ans?.jawabanEssay,
      };
    });

    setSubmitting(true);
    try {
      const res = await apiService.updateCBTUjianAttempt(attempt.id, {
        responses,
        submit: true,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Gagal mengirim jawaban ujian.');
      }

      if (options?.auto) {
        showSuccessNotification(
          'Ujian Berakhir',
          'Waktu ujian telah berakhir. Jawaban Anda telah dikumpulkan otomatis. Terima kasih.'
        );
      } else {
        showSuccessNotification(
          'Berhasil',
          'Ujian telah berakhir. Jawaban Anda berhasil dikirim. Terima kasih.'
        );
      }
      navigate(backToListPath);
    } catch (error: any) {
      console.error(error);
      showErrorNotification(
        'Gagal',
        error.message || 'Terjadi kesalahan saat mengirim jawaban ujian.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (submitting) return;
    submitUjian();
  };

  // Auto submit ketika waktu habis (baik karena durasi ataupun batas jadwal)
  useEffect(() => {
    if (!attempt || !ujian) return;
    if (remainingSeconds === null) return;
    if (remainingSeconds > 0) return;
    if (submitting || hasAutoSubmitted) return;

    setHasAutoSubmitted(true);
    submitUjian({ auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ujian, remainingSeconds, submitting, hasAutoSubmitted]);

  if (!ujianId) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Ujian CBT tidak ditemukan
        </h3>
        <p className="text-gray-600">
          ID ujian tidak valid atau tidak tersedia.
        </p>
      </Card>
    );
  }

  if (!activeTahunAjaran) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tidak Ada Tahun Ajaran Aktif
        </h3>
        <p className="text-gray-600">
          Tidak ada tahun ajaran aktif. Hubungi wali kelas atau admin.
        </p>
      </Card>
    );
  }

  if (!user || user.role !== 'murid') {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Hanya murid yang dapat mengerjakan ujian CBT
        </h3>
        <p className="text-gray-600">
          Silakan login sebagai murid untuk mengakses halaman ini.
        </p>
      </Card>
    );
  }

  if (loading || !ujian || !bankSoal) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-600">Memuat soal ujian CBT...</p>
      </Card>
    );
  }

  // Hitung tampilan waktu mundur
  let countdownText = '';
  if (remainingSeconds !== null) {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    countdownText = `${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  }

  const currentSoal = sortedSoal[currentIndex] ?? null;
  const currentAnswer = currentSoal ? answers[currentSoal.id] : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
      {/* HEADER – Bar biru gelap seperti LihatUjianMuridModal */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 bg-blue-800 text-white rounded-lg">
        <div>
          <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Judul Ujian</div>
          <div className="text-base font-semibold mt-0.5">{ujian.judulUjian}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Durasi</div>
          <div className="text-sm font-semibold mt-0.5">{ujian.durasiMenit} menit</div>
        </div>
        {remainingSeconds !== null && (
          <div>
            <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Sisa Waktu</div>
            <div className="text-sm font-semibold mt-0.5 text-emerald-300">{countdownText}</div>
          </div>
        )}
      </div>

      {/* MAIN: 2 KOLOM (70% kiri, 30% kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 min-h-0 flex-1">
        {/* KIRI – PANEL SOAL */}
        <div className="min-w-0 flex flex-col">
          {sortedSoal.length === 0 ? (
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
                      {currentSoal.opsi.map((opt) => {
                        const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              handleSelectOption(
                                currentSoal,
                                opt.id,
                                currentSoal.tipe === 'pilihan_ganda_kompleks'
                              )
                            }
                            className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
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
                          </div>
                        );
                      })}
                      {currentSoal.tipe === 'pilihan_ganda_kompleks' && (
                        <p className="text-xs text-slate-500">
                          Pilih satu atau lebih jawaban yang menurut Anda benar.
                        </p>
                      )}
                    </div>
                  )}

                {/* Benar/Salah */}
                {currentSoal.tipe === 'benar_salah' && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Pilih jawaban</div>
                    <div className="flex flex-wrap gap-3">
                      <div
                        onClick={() => handleSelectBenarSalah(currentSoal, true)}
                        className={`flex items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          currentAnswer?.jawabanBoolean === true
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm ${
                            currentAnswer?.jawabanBoolean === true
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-400 bg-white'
                          }`}
                        >
                          {currentAnswer?.jawabanBoolean === true ? '✓' : ''}
                        </span>
                        <span className="text-sm font-medium text-slate-900">Benar</span>
                      </div>
                      <div
                        onClick={() => handleSelectBenarSalah(currentSoal, false)}
                        className={`flex items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          currentAnswer?.jawabanBoolean === false
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm ${
                            currentAnswer?.jawabanBoolean === false
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-400 bg-white'
                          }`}
                        >
                          {currentAnswer?.jawabanBoolean === false ? '✓' : ''}
                        </span>
                        <span className="text-sm font-medium text-slate-900">Salah</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Essay */}
                {currentSoal.tipe === 'essay' && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Tulis jawaban Anda</div>
                    <textarea
                      value={currentAnswer?.jawabanEssay || ''}
                      onChange={(e) => handleEssayChange(currentSoal, e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                      placeholder="Tulis jawaban Anda di sini..."
                    />
                  </div>
                )}

                {/* Menjodohkan */}
                {currentSoal.tipe === 'menjodohkan' && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      Tipe soal menjodohkan belum didukung untuk pengerjaan langsung oleh murid dalam modul CBT ini.
                    </p>
                  </div>
                )}

                {/* Status jawaban */}
                <div className="pt-2 border-t border-slate-100">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      isSoalAnswered(currentAnswer)
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isSoalAnswered(currentAnswer) ? 'Sudah dijawab' : 'Belum dijawab'}
                  </span>
                </div>
              </div>
              {/* Navigasi Soal Sebelumnya / Selanjutnya */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={currentIndex === 0 || isTimeOver || submitting}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className="flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Soal Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={currentIndex >= sortedSoal.length - 1 || isTimeOver || submitting}
                  onClick={() => setCurrentIndex((i) => Math.min(sortedSoal.length - 1, i + 1))}
                  className="flex items-center justify-center gap-1.5"
                >
                  Soal Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-500 ml-2">
                  {currentIndex + 1} / {sortedSoal.length}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* KANAN – PANEL NOMOR SOAL */}
        <div className="lg:min-w-[320px] flex flex-col">
          <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-5 flex-shrink-0 sticky top-0">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
              Nomor Soal
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {sortedSoal.map((soal, idx) => {
                const ans = answers[soal.id];
                const answered = isSoalAnswered(ans);
                const isCurrent = idx === currentIndex;
                const num = idx + 1;
                return (
                  <button
                    key={soal.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    disabled={isTimeOver || submitting}
                    className={`
                      w-full aspect-square min-h-[40px] rounded-lg border-2 text-sm font-semibold transition-all
                      flex items-center justify-center
                      ${isCurrent ? 'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-400 ring-offset-1' : ''}
                      ${!isCurrent && answered ? 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}
                      ${!isCurrent && !answered ? 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200' : ''}
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
                <span>Hijau = Sudah dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded border-2 border-slate-200 bg-slate-100 flex-shrink-0" />
                <span>Abu-abu = Belum dijawab</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER – Tombol Kumpulkan Ujian */}
      {sortedSoal.length > 0 && (
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Mohon kerjakan soal dengan jujur tanpa melihat catatan atau berdiskusi dengan teman.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={submitting}
            disabled={isTimeOver || submitting}
          >
            Kumpulkan Ujian
          </Button>
        </div>
      )}
    </div>
  );
};

export default KerjakanUjianCBT;

