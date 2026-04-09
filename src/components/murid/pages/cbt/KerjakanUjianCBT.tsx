import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
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
  if (response.jawabanMenjodohkan?.length) return true;
  if (typeof response.jawabanBoolean === 'boolean') return true;
  if (response.jawabanEssay != null && String(response.jawabanEssay).trim() !== '') return true;
  return false;
}

function hashStringToSeed(input: string): number {
  // simple deterministic hash -> 32-bit int
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let x = seed || 123456789;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    // xorshift32
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    const j = Math.abs(x) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const KerjakanUjianCBT: React.FC = () => {
  const MAX_TAB_LEAVE = 2;
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
  const [antiCheatLeaveCount, setAntiCheatLeaveCount] = useState(0);
  const [antiCheatWarning, setAntiCheatWarning] = useState<string | null>(null);
  const [antiCheatWarningTitle, setAntiCheatWarningTitle] = useState('Peringatan Ujian CBT');
  const [showAntiCheatModal, setShowAntiCheatModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchingSelectedLeftId, setMatchingSelectedLeftId] = useState<string | null>(null);
  const matchingBoardRef = useRef<HTMLDivElement | null>(null);
  const submittingRef = useRef(false);
  const antiCheatLeaveCountRef = useRef(0);
  const hasProcessedAwayRef = useRef(false);
  const matchingLeftDotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const matchingRightDotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [matchingDotPositions, setMatchingDotPositions] = useState<{
    left: Record<string, { x: number; y: number }>;
    right: Record<string, { x: number; y: number }>;
    width: number;
    height: number;
  }>({ left: {}, right: {}, width: 0, height: 0 });

  const sortedSoal: CBTSoalItem[] = useMemo(
    () => bankSoal?.soal || [],
    [bankSoal]
  );

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    antiCheatLeaveCountRef.current = antiCheatLeaveCount;
  }, [antiCheatLeaveCount]);

  useEffect(() => {
    setMatchingSelectedLeftId(null);
  }, [currentIndex, ujianId]);

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
        setAntiCheatLeaveCount(attemptData.antiCheatLeaveCount || 0);

        // Inisialisasi jawaban dari attempt jika ada
        const initialAnswers: AnswerState = {};
        (attemptData.responses || []).forEach((r) => {
          initialAnswers[r.soalId] = {
            soalId: r.soalId,
            tipe: r.tipe,
            selectedOptionIds: r.selectedOptionIds || [],
            jawabanBoolean: r.jawabanBoolean,
            jawabanEssay: r.jawabanEssay || '',
            jawabanMenjodohkan: r.jawabanMenjodohkan || [],
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

  const handleMatchingChange = (soal: CBTSoalItem, leftId: string, rightId: string) => {
    if (isTimeOver || submitting) return;

    setAnswers((prev) => {
      const existing = prev[soal.id] || {
        soalId: soal.id,
        tipe: soal.tipe,
      };

      const current = Array.isArray(existing.jawabanMenjodohkan)
        ? existing.jawabanMenjodohkan
        : [];

      const map = new Map<string, string>();
      current.forEach((x) => {
        if (!x?.leftId || !x?.rightId) return;
        map.set(String(x.leftId), String(x.rightId));
      });

      const normalizedLeftId = String(leftId);
      const normalizedRightId = String(rightId);

      if (!normalizedRightId) {
        // clear mapping for this left
        map.delete(normalizedLeftId);
      } else {
        // enforce uniqueness: one rightId can only be used once
        Array.from(map.entries()).forEach(([l, r]) => {
          if (r === normalizedRightId && l !== normalizedLeftId) {
            map.delete(l);
          }
        });
        map.set(normalizedLeftId, normalizedRightId);
      }

      const jawabanMenjodohkan = Array.from(map.entries()).map(([l, r]) => ({
        leftId: l,
        rightId: r,
      }));

      return {
        ...prev,
        [soal.id]: {
          ...existing,
          jawabanMenjodohkan,
        },
      };
    });
  };

  const clearMatchingAnswers = (soal: CBTSoalItem) => {
    if (isTimeOver || submitting) return;
    setAnswers((prev) => {
      const existing = prev[soal.id] || { soalId: soal.id, tipe: soal.tipe };
      return {
        ...prev,
        [soal.id]: {
          ...existing,
          jawabanMenjodohkan: [],
        },
      };
    });
    setMatchingSelectedLeftId(null);
  };

  const submitUjian = useCallback(async (options?: { auto?: boolean; reason?: 'time_over' | 'anti_cheat' }) => {
    if (!attempt || !ujian) return;

    const responses: CBTUjianResponse[] = sortedSoal.map((soal) => {
      const ans = answers[soal.id];
      return {
        soalId: soal.id,
        tipe: soal.tipe as CBTQuestionType,
        selectedOptionIds: ans?.selectedOptionIds,
        jawabanBoolean: ans?.jawabanBoolean,
        jawabanEssay: ans?.jawabanEssay,
        jawabanMenjodohkan: ans?.jawabanMenjodohkan,
      };
    });

    setSubmitting(true);
    try {
      const res = await apiService.updateCBTUjianAttempt(attempt.id, {
        responses,
        submit: true,
        antiCheatLeaveCount,
        antiCheatLastLeaveAt: attempt.antiCheatLastLeaveAt || null,
        autoSubmittedByAntiCheat: options?.reason === 'anti_cheat',
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Gagal mengirim jawaban ujian.');
      }

      if (options?.auto) {
        if (options?.reason === 'anti_cheat') {
          // Warning anti-cheat sudah ditampilkan via modal sebelum auto-submit.
        } else {
          showSuccessNotification(
            'Ujian Berakhir',
            'Waktu ujian telah berakhir. Jawaban Anda telah dikumpulkan otomatis. Terima kasih.'
          );
        }
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
  }, [answers, antiCheatLeaveCount, attempt, backToListPath, navigate, sortedSoal, ujian]);

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
    submitUjian({ auto: true, reason: 'time_over' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ujian, remainingSeconds, submitting, hasAutoSubmitted]);

  useEffect(() => {
    if (!attempt || !ujian) return;

    const registerTabLeave = async () => {
      if (hasProcessedAwayRef.current) return;
      if (submittingRef.current || hasAutoSubmitted || isTimeOver) return;

      hasProcessedAwayRef.current = true;
      const nextCount = antiCheatLeaveCountRef.current + 1;
      const leaveAt = new Date().toISOString();

      antiCheatLeaveCountRef.current = nextCount;
      setAntiCheatLeaveCount(nextCount);
      setAttempt((prev) => (prev ? { ...prev, antiCheatLastLeaveAt: leaveAt } : prev));

      try {
        await apiService.updateCBTUjianAttempt(attempt.id, {
          submit: false,
          antiCheatLeaveCount: nextCount,
          antiCheatLastLeaveAt: leaveAt,
        });
      } catch (error) {
        console.error('Gagal menyimpan log anti-cheat:', error);
      }

      if (nextCount > MAX_TAB_LEAVE) {
        setAntiCheatWarningTitle('Ujian Dikumpulkan Otomatis');
        setAntiCheatWarning(
          'Anda meninggalkan halaman ujian lebih dari 2 kali. Jawaban Anda akan dikumpulkan otomatis.'
        );
        setShowAntiCheatModal(true);
        if (!hasAutoSubmitted) {
          setHasAutoSubmitted(true);
          submitUjian({ auto: true, reason: 'anti_cheat' });
        }
        return;
      }

      const sisaKesempatan = MAX_TAB_LEAVE - nextCount;
      const warningText = `Peringatan: Anda telah meninggalkan halaman ujian ${nextCount}x. Sisa kesempatan ${sisaKesempatan}x sebelum jawaban dikumpulkan otomatis.`;
      setAntiCheatWarningTitle('Peringatan Ujian CBT');
      setAntiCheatWarning(warningText);
      setShowAntiCheatModal(true);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        registerTabLeave();
      } else if (document.visibilityState === 'visible') {
        hasProcessedAwayRef.current = false;
      }
    };

    const onWindowBlur = () => {
      registerTabLeave();
    };
    const onWindowFocus = () => {
      hasProcessedAwayRef.current = false;
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [attempt, ujian, hasAutoSubmitted, isTimeOver, submitUjian]);

  // Derived current question + matching UI helpers (must be declared BEFORE any conditional returns)
  const currentSoal = sortedSoal[currentIndex] ?? null;
  const currentAnswer = currentSoal ? answers[currentSoal.id] : null;

  const currentMatchingMap = useMemo(() => {
    const map = new Map<string, string>();
    (currentAnswer?.jawabanMenjodohkan || []).forEach((x) => {
      if (!x?.leftId || !x?.rightId) return;
      map.set(String(x.leftId), String(x.rightId));
    });
    return map;
  }, [currentAnswer?.jawabanMenjodohkan]);

  const currentMatchingRightOrder = useMemo(() => {
    if (!currentSoal || currentSoal.tipe !== 'menjodohkan') return [];
    const pairs = currentSoal.pasanganMenjodohkan || [];
    return seededShuffle(
      pairs.map((p) => ({ id: String(p.id), text: p.right })),
      hashStringToSeed(currentSoal.id)
    );
  }, [currentSoal]);

  useLayoutEffect(() => {
    if (!currentSoal || currentSoal.tipe !== 'menjodohkan') return;
    if (!matchingBoardRef.current) return;

    const boardEl = matchingBoardRef.current;

    const compute = () => {
      const rect = boardEl.getBoundingClientRect();
      const left: Record<string, { x: number; y: number }> = {};
      const right: Record<string, { x: number; y: number }> = {};

      Object.entries(matchingLeftDotRefs.current).forEach(([id, el]) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        left[id] = {
          x: r.left - rect.left + r.width / 2,
          y: r.top - rect.top + r.height / 2,
        };
      });

      Object.entries(matchingRightDotRefs.current).forEach(([id, el]) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        right[id] = {
          x: r.left - rect.left + r.width / 2,
          y: r.top - rect.top + r.height / 2,
        };
      });

      setMatchingDotPositions({
        left,
        right,
        width: rect.width,
        height: rect.height,
      });
    };

    compute();

    let raf = 0;
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(boardEl);
    window.addEventListener('resize', schedule);

    // Ensure we measure after refs are attached (first paint + next frame).
    requestAnimationFrame(compute);
    requestAnimationFrame(() => requestAnimationFrame(compute));

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [
    currentSoal?.id,
    currentSoal?.tipe,
    currentSoal?.pasanganMenjodohkan?.length,
    currentMatchingRightOrder.length,
    currentAnswer?.jawabanMenjodohkan?.length,
  ]);

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
      <Modal
        isOpen={showAntiCheatModal && !!antiCheatWarning}
        onClose={() => setShowAntiCheatModal(false)}
        title={antiCheatWarningTitle}
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-red-300 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-800">
                  PERINGATAN KERAS
                </p>
                <p className="text-sm text-red-700">{antiCheatWarning}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              className="!bg-red-600 !border-red-600 !text-white hover:!bg-red-700 hover:!border-red-700"
              onClick={() => setShowAntiCheatModal(false)}
            >
              Saya Mengerti
            </Button>
          </div>
        </div>
      </Modal>

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
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-600">
                        Klik titik di kiri, lalu klik titik di kanan untuk membuat pasangan.
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => clearMatchingAnswers(currentSoal)}
                        disabled={isTimeOver || submitting}
                      >
                        Reset Pasangan
                      </Button>
                    </div>

                    {(!currentSoal.pasanganMenjodohkan ||
                      currentSoal.pasanganMenjodohkan.length === 0) && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-sm text-amber-800">
                          Soal menjodohkan ini belum memiliki pasangan.
                        </p>
                      </div>
                    )}

                    {currentSoal.pasanganMenjodohkan &&
                      currentSoal.pasanganMenjodohkan.length > 0 && (() => {
                        const pairs = currentSoal.pasanganMenjodohkan || [];
                        const rightOptions = currentMatchingRightOrder;
                        const usedRightIds = new Set(Array.from(currentMatchingMap.values()));
                        const palette = [
                          '#2563eb', // blue
                          '#16a34a', // green
                          '#f97316', // orange
                          '#a855f7', // purple
                          '#ef4444', // red
                          '#14b8a6', // teal
                          '#f59e0b', // amber
                          '#0ea5e9', // sky
                        ];

                        const leftIdToColor = new Map<string, string>();
                        pairs.forEach((p, idx) => {
                          leftIdToColor.set(String(p.id), palette[idx % palette.length]);
                        });

                        const rightIdToLeftId = new Map<string, string>();
                        currentMatchingMap.forEach((rightId, leftId) => {
                          rightIdToLeftId.set(String(rightId), String(leftId));
                        });

                        const boardW = Math.max(1, matchingDotPositions.width);
                        const boardH = Math.max(1, matchingDotPositions.height);

                        return (
                          <div
                            ref={matchingBoardRef}
                            className="relative rounded-xl border border-slate-200 bg-slate-50/40 p-4 overflow-hidden"
                          >
                            {/* Lines overlay */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none z-10"
                              viewBox={`0 0 ${boardW} ${boardH}`}
                              preserveAspectRatio="none"
                            >
                              {pairs.map((p) => {
                                const leftId = String(p.id);
                                const rightId = currentMatchingMap.get(leftId);
                                if (!rightId) return null;
                                const a = matchingDotPositions.left[leftId];
                                const b = matchingDotPositions.right[rightId];
                                if (!a || !b) return null;
                                const color = leftIdToColor.get(leftId) || '#2563eb';
                                return (
                                  <path
                                    key={`${leftId}-${rightId}`}
                                    d={`M ${a.x} ${a.y} C ${a.x + 80} ${a.y}, ${b.x - 80} ${b.y}, ${b.x} ${b.y}`}
                                    stroke={color}
                                    strokeWidth="3"
                                    fill="none"
                                    opacity="0.9"
                                  />
                                );
                              })}

                              {/* Preview line removed (no dashed indicator) */}
                            </svg>

                            <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_1fr] gap-6 relative z-20">
                              {/* Left column */}
                              <div className="space-y-2">
                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                  Kolom kiri
                                </div>
                                {pairs.map((p, idx) => {
                                  const leftId = String(p.id);
                                  const mappedRight = currentMatchingMap.get(leftId) || '';
                                  const isActive = matchingSelectedLeftId === leftId;
                                  const isMapped = !!mappedRight;
                                  const color = leftIdToColor.get(leftId) || '#2563eb';

                                  return (
                                    <div
                                      key={leftId}
                                      className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${
                                        isActive
                                          ? 'border-blue-300 bg-blue-50'
                                          : 'border-slate-200 bg-white'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <span className="text-xs font-semibold text-slate-500 w-6 text-right pt-0.5">
                                          {idx + 1}.
                                        </span>
                                        <div className="text-sm text-slate-900 leading-relaxed break-words">
                                          {p.left}
                                        </div>
                                      </div>
                                      {/* Dot on inner edge (right side) */}
                                      <button
                                        type="button"
                                        ref={(el) => {
                                          matchingLeftDotRefs.current[leftId] = el;
                                        }}
                                        onClick={() => {
                                          if (isTimeOver || submitting) return;
                                          if (matchingSelectedLeftId === leftId) {
                                            setMatchingSelectedLeftId(null);
                                            return;
                                          }
                                          // If already mapped and not currently selecting anything, clicking dot clears mapping
                                          if (!matchingSelectedLeftId && isMapped) {
                                            handleMatchingChange(currentSoal, leftId, '');
                                            return;
                                          }
                                          setMatchingSelectedLeftId(leftId);
                                        }}
                                        className={`w-5 h-5 rounded-full border-2 transition-colors flex-shrink-0 mt-0.5 ${
                                          isActive || isMapped ? '' : 'border-slate-400 bg-white hover:bg-slate-50'
                                        }`}
                                        style={
                                          isActive || isMapped
                                            ? {
                                                borderColor: color,
                                                backgroundColor: isActive ? color : `${color}1A`,
                                              }
                                            : undefined
                                        }
                                        aria-label="Pilih item kiri"
                                      />
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Middle gutter (visual space for lines like the example image) */}
                              <div className="hidden md:block" />

                              {/* Right column */}
                              <div className="space-y-2">
                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                  Kolom kanan
                                </div>
                                {rightOptions.map((opt, idx) => {
                                  const rightId = String(opt.id);
                                  const isUsed = usedRightIds.has(rightId);
                                  const isClickable = !!matchingSelectedLeftId;
                                  const mappedLeftId = rightIdToLeftId.get(rightId) || '';
                                  const color = mappedLeftId ? leftIdToColor.get(mappedLeftId) : undefined;

                                  return (
                                    <div
                                      key={rightId}
                                      className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${
                                        isUsed
                                          ? 'border-blue-200 bg-blue-50/60'
                                          : 'border-slate-200 bg-white'
                                      }`}
                                    >
                                      {/* Dot on inner edge (left side) */}
                                      <button
                                        type="button"
                                        ref={(el) => {
                                          matchingRightDotRefs.current[rightId] = el;
                                        }}
                                        onClick={() => {
                                          if (!matchingSelectedLeftId) return;
                                          handleMatchingChange(currentSoal, matchingSelectedLeftId, rightId);
                                          setMatchingSelectedLeftId(null);
                                        }}
                                        disabled={!isClickable || isTimeOver || submitting}
                                        className={`w-5 h-5 rounded-full border-2 transition-colors flex-shrink-0 mt-0.5 ${
                                          !isClickable
                                            ? 'border-slate-200 bg-slate-100'
                                            : isUsed
                                              ? ''
                                              : 'border-slate-400 bg-white hover:bg-slate-50'
                                        }`}
                                        style={
                                          isUsed && color
                                            ? {
                                                borderColor: color,
                                                backgroundColor: color,
                                              }
                                            : isClickable
                                              ? {
                                                  borderColor: matchingSelectedLeftId
                                                    ? leftIdToColor.get(matchingSelectedLeftId) || '#94a3b8'
                                                    : undefined,
                                                }
                                              : undefined
                                        }
                                        aria-label="Pilih item kanan"
                                      />
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <span className="text-xs font-semibold text-slate-500 w-6 text-right pt-0.5">
                                          {idx + 1}.
                                        </span>
                                        <div className="text-sm text-slate-900 leading-relaxed break-words">
                                          {opt.text}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="mt-4 text-xs text-slate-600">
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <span>
                                  <span className="font-semibold">Cara hapus pasangan:</span> klik titik kiri yang sudah
                                  terhubung.
                                </span>
                                <span>
                                  <span className="font-semibold">Satu jawaban kanan</span> hanya bisa dipakai sekali.
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
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

