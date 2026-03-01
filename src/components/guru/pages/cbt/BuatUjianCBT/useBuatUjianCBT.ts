import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../../../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../../hooks/useKelas';
import { useKomponenNilai } from '../../../../../hooks/useKomponenNilai';
import { useMurid } from '../../../../../hooks/useMurid';
import { useCBTKelas } from '../../../../../hooks/useCBTKelas';
import type {
  CBTBankSoal,
  CBTKelas,
  CBTUjian,
  CBTUjianAttempt,
  PengaturanKomponenNilai,
} from '../../../../../types';
import { apiService } from '../../../../../services/apiService';
import { showErrorNotification, showSuccessNotification } from '../../../../../utils/notificationUtils';
import { defaultFormState, type UjianFormState } from './types';

export function useBuatUjianCBT() {
  const { user } = useAuth();
  const { tahunAjaran } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { mataPelajaran } = useMataPelajaran();
  const { kelas } = useKelas();
  const { komponenNilai } = useKomponenNilai();
  const { cbtKelas } = useCBTKelas(user ? { guruId: user.id } : {});
  const { murid } = useMurid();

  const activeTahunAjaran = tahunAjaran.find((ta) => ta.isActive);

  const [ujianList, setUjianList] = useState<CBTUjian[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<UjianFormState>(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [loadingBankSoal, setLoadingBankSoal] = useState(false);
  const [availableBankSoal, setAvailableBankSoal] = useState<CBTBankSoal[]>([]);
  const [detailUjian, setDetailUjian] = useState<CBTUjian | null>(null);
  const [detailAttempts, setDetailAttempts] = useState<CBTUjianAttempt[]>([]);
  const [loadingDetailAttempts, setLoadingDetailAttempts] = useState(false);
  const [selectedMuridAttempt, setSelectedMuridAttempt] = useState<{
    muridId: string;
    muridName: string;
    nisn?: string;
    attempt: CBTUjianAttempt | null;
    bankSoal: CBTBankSoal | null;
  } | null>(null);
  const [loadingMuridAttempt, setLoadingMuridAttempt] = useState(false);
  const [essayReview, setEssayReview] = useState<Record<string, 'benar' | 'salah'>>({});
  const [savingEssayReview, setSavingEssayReview] = useState(false);
  // Menyimpan jejak reset per attempt agar status tidak kembali ke "sedang"
  // ketika modal dibuka ulang sebelum murid benar-benar memulai ujian ulang.
  const resetMarkersRef = useRef<Record<string, number>>({});

  const getAttemptKey = (ujianId: string, muridId: string) => `${ujianId}::${muridId}`;

  const normalizeAttemptForDisplay = (attempt: CBTUjianAttempt): CBTUjianAttempt => {
    if (attempt.status !== 'sedang') return attempt;
    const key = getAttemptKey(attempt.ujianId, attempt.muridId);
    const resetAtMs = resetMarkersRef.current[key];
    if (!resetAtMs) return attempt;

    const startedAtMs = attempt.startedAt ? new Date(attempt.startedAt).getTime() : 0;
    // Jika startedAt belum melewati waktu reset, murid belum benar-benar mulai ulang.
    if (!startedAtMs || startedAtMs <= resetAtMs) {
      return { ...attempt, status: 'belum_mulai', finishedAt: null };
    }
    // Murid sudah mulai ulang, marker reset tidak diperlukan lagi.
    delete resetMarkersRef.current[key];
    return attempt;
  };

  const mySchedules = useMemo(() => {
    if (!user || !activeTahunAjaran) return [];
    return jadwalPelajaran.filter(
      (j) =>
        j.guruId === user.id &&
        j.tahunAjaran === activeTahunAjaran.tahun &&
        j.semester === activeTahunAjaran.semester
    );
  }, [user, jadwalPelajaran, activeTahunAjaran]);

  const uniqueMapelIds = useMemo(
    () => Array.from(new Set(mySchedules.map((j) => j.mataPelajaranId))),
    [mySchedules]
  );

  const uniqueKelasIds = useMemo(() => {
    if (!form.mapelId) return [];
    return Array.from(
      new Set(mySchedules.filter((j) => j.mataPelajaranId === form.mapelId).map((j) => j.kelasId))
    );
  }, [mySchedules, form.mapelId]);

  const getMapelName = (mapelId: string) =>
    mataPelajaran.find((m) => m.id === mapelId)?.name || 'Unknown';
  const getKelasName = (kelasId: string) =>
    kelas.find((k) => k.id === kelasId)?.name || 'Unknown';
  const getKategoriById = (id: string): PengaturanKomponenNilai | undefined =>
    komponenNilai.find((k) => k.id === id);

  const selectedKategori = getKategoriById(form.kategoriId);
  const kategoriIsGanda = !!selectedKategori?.hasNilai;

  const matchingCBTKelasId = useMemo(() => {
    if (!form.mapelId || !form.kelasId || !activeTahunAjaran) return null;
    const kelasObj = kelas.find((k) => k.id === form.kelasId);
    if (!kelasObj) return null;
    const match = cbtKelas.find(
      (ck: CBTKelas) =>
        ck.guruId === user?.id &&
        ck.mataPelajaranId === form.mapelId &&
        ck.tingkat === kelasObj.tingkat &&
        ck.tahunAjaran === activeTahunAjaran.tahun &&
        ck.semester === activeTahunAjaran.semester
    );
    return match ? match.id : null;
  }, [cbtKelas, kelas, form.kelasId, form.mapelId, activeTahunAjaran, user]);

  useEffect(() => {
    if (!detailUjian) {
      setDetailAttempts([]);
      return;
    }
    setLoadingDetailAttempts(true);
    apiService
      .getAllCBTUjianAttempt({ ujianId: detailUjian.id })
      .then((res) => {
        if (res.success && res.data) {
          const normalized = (res.data as CBTUjianAttempt[]).map(normalizeAttemptForDisplay);
          setDetailAttempts(normalized);
        }
        else setDetailAttempts([]);
      })
      .catch(() => setDetailAttempts([]))
      .finally(() => setLoadingDetailAttempts(false));
  }, [detailUjian]);

  useEffect(() => {
    if (!user || !activeTahunAjaran) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiService
      .getAllCBTUjian({
        guruId: user.id,
        tahunAjaran: activeTahunAjaran.tahun,
        semester: activeTahunAjaran.semester,
      })
      .then((response) => {
        if (response.success && response.data) {
          setUjianList(response.data as CBTUjian[]);
        } else {
          showErrorNotification('Gagal', response.message || 'Gagal mengambil data ujian CBT.');
        }
      })
      .catch((error: unknown) => {
        console.error(error);
        showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat mengambil data ujian CBT.');
      })
      .finally(() => setLoading(false));
  }, [user, activeTahunAjaran]);

  useEffect(() => {
    if (!user || !matchingCBTKelasId || !form.kategoriId) {
      setAvailableBankSoal([]);
      return;
    }
    setLoadingBankSoal(true);
    apiService
      .getAllCBTBankSoal({ cbtKelasId: matchingCBTKelasId, guruId: user.id })
      .then((response) => {
        if (response.success && response.data) {
          const list = (response.data as CBTBankSoal[]).filter((b) => b.kategoriId === form.kategoriId);
          setAvailableBankSoal(list);
        } else setAvailableBankSoal([]);
      })
      .catch(() => setAvailableBankSoal([]))
      .finally(() => setLoadingBankSoal(false));
  }, [user, matchingCBTKelasId, form.kategoriId]);

  const resetFormWithDefaults = () => {
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    setForm({
      ...defaultFormState,
      tanggalMulai: isoDate,
      tanggalSelesai: isoDate,
      jamMulai: '08:00',
      jamSelesai: '10:00',
    });
  };

  const handleOpenModal = () => {
    resetFormWithDefaults();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (field: keyof UjianFormState, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'mapelId' ? { kelasId: '', bankSoalId: '' } : {}),
      ...(field === 'kelasId' ? { bankSoalId: '' } : {}),
    }));
  };

  const validateForm = (): { valid: boolean; message?: string } => {
    if (!user || !activeTahunAjaran) {
      return { valid: false, message: 'User atau tahun ajaran aktif tidak tersedia.' };
    }
    if (!form.mapelId || !form.kelasId) {
      return { valid: false, message: 'Pilih mata pelajaran dan kelas yang diajar terlebih dahulu.' };
    }
    if (!matchingCBTKelasId) {
      return { valid: false, message: 'Kelas CBT untuk kombinasi tingkat dan mata pelajaran ini belum dibuat. Tambahkan dulu Kelas CBT dan Bank Soal di menu Bank Soal CBT.' };
    }
    if (!form.kategoriId) {
      return { valid: false, message: 'Pilih kategori nilai terlebih dahulu (Tugas, UTS, UAS, atau komponen dinamis).' };
    }
    if (kategoriIsGanda && !form.kategoriKe.trim()) {
      return { valid: false, message: 'Isi nomor ke- untuk kategori nilai yang dapat memiliki nilai ganda (misal Tugas ke-1).' };
    }
    if (!form.bankSoalId) {
      return { valid: false, message: 'Pilih judul bank soal yang akan digunakan sebagai sumber soal ujian.' };
    }
    if (!form.judulUjian.trim()) {
      return { valid: false, message: 'Isi judul ujian CBT terlebih dahulu.' };
    }
    if (!form.tanggalMulai || !form.jamMulai || !form.tanggalSelesai || !form.jamSelesai) {
      return { valid: false, message: 'Lengkapi tanggal mulai, jam mulai, tanggal selesai, dan jam selesai ujian.' };
    }
    const durasi = parseInt(form.durasiMenit, 10);
    if (!durasi || durasi <= 0) {
      return { valid: false, message: 'Durasi ujian harus diisi dengan nilai menit yang valid.' };
    }
    return { valid: true };
  };

  const handleCreateUjian = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      showErrorNotification('Data belum lengkap', validation.message || '');
      return;
    }
    if (!user || !activeTahunAjaran || !matchingCBTKelasId) return;
    const kategori = selectedKategori;
    if (!kategori) {
      showErrorNotification('Data tidak valid', 'Kategori nilai yang dipilih tidak ditemukan.');
      return;
    }
    const bank = availableBankSoal.find((b) => b.id === form.bankSoalId);
    if (!bank) {
      showErrorNotification('Data tidak valid', 'Bank soal yang dipilih tidak ditemukan.');
      return;
    }
    const durasi = parseInt(form.durasiMenit, 10);
    setSaving(true);
    try {
      const payload = {
        guruId: user.id,
        cbtKelasId: matchingCBTKelasId,
        kelasId: form.kelasId,
        mataPelajaranId: form.mapelId,
        bankSoalId: bank.id,
        bankSoalJudul: bank.judul,
        kategoriId: kategori.id,
        kategoriNama: kategori.nama,
        kategoriHasNilai: !!kategori.hasNilai,
        kategoriKe: kategoriIsGanda ? parseInt(form.kategoriKe || '1', 10) : null,
        judulUjian: form.judulUjian.trim(),
        tanggalMulai: form.tanggalMulai,
        jamMulai: form.jamMulai,
        tanggalSelesai: form.tanggalSelesai,
        jamSelesai: form.jamSelesai,
        durasiMenit: durasi,
        acakSoal: form.acakSoal,
        tunjukanHasilNilai: form.tunjukanHasilNilai,
      };
      const response = await apiService.createCBTUjian(payload);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Gagal membuat ujian CBT');
      }
      showSuccessNotification('Berhasil', 'Ujian CBT berhasil dibuat.');
      setUjianList((prev) => [response.data as CBTUjian, ...prev]);
      setIsModalOpen(false);
    } catch (error: unknown) {
      console.error(error);
      showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat membuat ujian CBT.');
    } finally {
      setSaving(false);
    }
  };

  const refreshUjianList = async () => {
    if (!user || !activeTahunAjaran) return;
    try {
      const response = await apiService.getAllCBTUjian({
        guruId: user.id,
        tahunAjaran: activeTahunAjaran.tahun,
        semester: activeTahunAjaran.semester,
      });
      if (response.success && response.data) setUjianList(response.data as CBTUjian[]);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePublishUjian = async (ujian: CBTUjian) => {
    if (ujian.isPublished) return;
    try {
      const response = await apiService.updateCBTUjian(ujian.id, { isPublished: true });
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Gagal mem-publish ujian CBT');
      }
      showSuccessNotification('Berhasil', 'Ujian CBT berhasil dipublish dan dapat segera dimulai.');
      await refreshUjianList();
    } catch (error: unknown) {
      console.error(error);
      showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat mem-publish ujian CBT.');
    }
  };

  const getUjianStatus = (ujian: CBTUjian): string => {
    const start = new Date(`${ujian.tanggalMulai}T${ujian.jamMulai || '00:00'}:00`);
    const end = new Date(`${ujian.tanggalSelesai}T${ujian.jamSelesai || '23:59'}:59`);
    const now = new Date();
    const autoPublishThreshold = new Date(start.getTime() - 5 * 60 * 1000);
    const isEffectivelyPublished = ujian.isPublished || now >= autoPublishThreshold;
    if (!isEffectivelyPublished) return 'Draft';
    if (now <= end) return 'Sedang berlangsung';
    return 'Selesai';
  };

  const openMuridAttempt = async (ujian: CBTUjian, m: { id: string; name: string; nisn?: string }) => {
    setSelectedMuridAttempt({
      muridId: m.id,
      muridName: m.name,
      nisn: m.nisn,
      attempt: null,
      bankSoal: null,
    });
    setEssayReview({});
    setLoadingMuridAttempt(true);
    try {
      const [bankRes, attemptRes] = await Promise.all([
        apiService.getCBTBankSoalById(ujian.bankSoalId),
        apiService.getAllCBTUjianAttempt({ ujianId: ujian.id, muridId: m.id }),
      ]);
      const bank = bankRes?.success && bankRes.data ? (bankRes.data as CBTBankSoal) : null;
      let attempt: CBTUjianAttempt | null = null;
      if (attemptRes?.success && attemptRes.data) {
        const list = attemptRes.data as CBTUjianAttempt[];
        attempt = list.length > 0 ? list[0] : null;
      }
      setSelectedMuridAttempt({
        muridId: m.id,
        muridName: m.name,
        nisn: m.nisn,
        attempt,
        bankSoal: bank,
      });
      // Isi essayReview dari attempt yang sudah dikoreksi (supaya tombol aktif sesuai pilihan guru)
      // Backend mengembalikan nilai terbalik: true=salah, false=benar. Jadi kita invert.
      const initial: Record<string, 'benar' | 'salah'> = {};
      attempt?.responses?.forEach((r) => {
        if (r.tipe === 'essay') {
          const raw = typeof r.isCorrect === 'boolean' ? r.isCorrect : r.isCorrectAuto;
          if (typeof raw === 'boolean') {
            initial[r.soalId] = raw ? 'salah' : 'benar';
          }
        }
      });
      setEssayReview(initial);
    } catch (err) {
      console.error(err);
      setSelectedMuridAttempt((prev) => (prev ? { ...prev, attempt: null, bankSoal: prev.bankSoal || null } : prev));
    } finally {
      setLoadingMuridAttempt(false);
    }
  };

  const handleSaveEssayReview = async () => {
    if (!selectedMuridAttempt?.attempt) return;
    try {
      setSavingEssayReview(true);
      const payload = {
        attemptId: selectedMuridAttempt.attempt.id,
        hasilEssay: Object.entries(essayReview).map(([soalId, status]) => ({
          soalId,
          isCorrect: status === 'benar',
        })),
      };
      const res = await apiService.gradeEssayCBTUjianAttempt(payload);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Gagal menyimpan penilaian essay ujian murid.');
      }
      let updatedAttempt = res.data as CBTUjianAttempt;
      // Patch responses dengan data yang kita kirim agar isCorrectAuto sesuai (benar=true, salah=false)
      // Backend kadang mengembalikan format berbeda, jadi gunakan payload sebagai source of truth
      const payloadEssayMap = new Map(payload.hasilEssay.map((e) => [e.soalId, e.isCorrect]));
      const patchedResponses = updatedAttempt?.responses?.map((r) => {
        if (r.tipe === 'essay' && payloadEssayMap.has(r.soalId)) {
          const isCorrectVal = payloadEssayMap.get(r.soalId)!;
          return { ...r, isCorrect: isCorrectVal, isCorrectAuto: isCorrectVal };
        }
        return r;
      }) ?? [];
      updatedAttempt = { ...updatedAttempt, responses: patchedResponses };
      setSelectedMuridAttempt((prev) => (prev ? { ...prev, attempt: updatedAttempt } : prev));
      setDetailAttempts((prev) => prev.map((a) => (a.id === updatedAttempt.id ? updatedAttempt : a)));
      showSuccessNotification('Berhasil', 'Penilaian essay berhasil disimpan.');
      const nextReview: Record<string, 'benar' | 'salah'> = {};
      payload.hasilEssay.forEach((e) => {
        nextReview[e.soalId] = e.isCorrect ? 'benar' : 'salah';
      });
      setEssayReview(nextReview);
    } catch (err: unknown) {
      console.error(err);
      showErrorNotification('Gagal', (err as Error).message || 'Terjadi kesalahan saat menyimpan penilaian essay ujian murid.');
    } finally {
      setSavingEssayReview(false);
    }
  };

  const handleResetAttempt = async (ujian: CBTUjian, muridId: string) => {
    try {
      const res = await apiService.resetCBTUjianAttempt({ ujianId: ujian.id, muridId });
      if (!res.success) throw new Error(res.message || 'Gagal mereset ujian murid.');
      showSuccessNotification('Berhasil', 'Attempt ujian murid berhasil di-reset.');
      resetMarkersRef.current[getAttemptKey(ujian.id, muridId)] = Date.now();
      if (res.data) {
        const raw = res.data as CBTUjianAttempt;
        // Setelah reset, status harus 'belum_mulai' (belum mengerjakan ulang). Jika backend mengembalikan 'sedang', normalisasi.
        const updated: CBTUjianAttempt = {
          ...raw,
          status: 'belum_mulai',
          responses: raw.responses ?? [],
          finishedAt: null,
        };
        setDetailAttempts((prev) => {
          const others = prev.filter((a) => !(a.muridId === updated.muridId && a.ujianId === updated.ujianId));
          return [...others, updated];
        });
      }
    } catch (err: unknown) {
      console.error(err);
      showErrorNotification('Gagal', (err as Error).message || 'Gagal mereset ujian murid.');
    }
  };

  const handleAllowEditAttempt = async (ujian: CBTUjian, muridId: string) => {
    try {
      const res = await apiService.allowEditCBTUjianAttempt({ ujianId: ujian.id, muridId });
      if (!res.success) throw new Error(res.message || 'Gagal mengizinkan edit jawaban.');
      showSuccessNotification('Berhasil', 'Murid diizinkan mengedit jawaban selama durasi ujian masih berlangsung.');
      if (res.data) {
        const updated = res.data as CBTUjianAttempt;
        delete resetMarkersRef.current[getAttemptKey(ujian.id, muridId)];
        setDetailAttempts((prev) => {
          const others = prev.filter((a) => !(a.muridId === updated.muridId && a.ujianId === updated.ujianId));
          return [...others, updated];
        });
      }
    } catch (err: unknown) {
      console.error(err);
      showErrorNotification('Gagal', (err as Error).message || 'Gagal mengizinkan edit jawaban murid.');
    }
  };

  return {
    user,
    activeTahunAjaran,
    ujianList,
    loading,
    isModalOpen,
    form,
    saving,
    loadingBankSoal,
    availableBankSoal,
    detailUjian,
    setDetailUjian,
    detailAttempts,
    loadingDetailAttempts,
    selectedMuridAttempt,
    setSelectedMuridAttempt,
    loadingMuridAttempt,
    essayReview,
    setEssayReview,
    savingEssayReview,
    uniqueMapelIds,
    uniqueKelasIds,
    matchingCBTKelasId,
    kategoriIsGanda,
    komponenNilai,
    murid,
    getMapelName,
    getKelasName,
    getUjianStatus,
    handleOpenModal,
    handleCloseModal,
    handleChange,
    handleCreateUjian,
    handlePublishUjian,
    openMuridAttempt,
    handleSaveEssayReview,
    handleResetAttempt,
    handleAllowEditAttempt,
  };
}
