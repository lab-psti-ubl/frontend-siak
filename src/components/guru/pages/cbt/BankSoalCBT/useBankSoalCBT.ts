import { useMemo, useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../../../../hooks/useJadwalPelajaran';
import { useKelas } from '../../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useCBTKelas } from '../../../../../hooks/useCBTKelas';
import { useCBTBankSoal } from '../../../../../hooks/useCBTBankSoal';
import { useKomponenNilai } from '../../../../../hooks/useKomponenNilai';
import { apiService } from '../../../../../services/apiService';
import type {
  CBTConcreteQuestionType,
  CBTKelas,
  CBTBankSoal,
  CBTSoalItem,
  CBTQuestionType,
} from '../../../../../types';
import { showSuccessNotification, showErrorNotification } from '../../../../../utils/notificationUtils';
import { defaultSoalState, type SoalFormState } from './types';

export function useBankSoalCBT() {
  const { user } = useAuth();
  const { tahunAjaran } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { komponenNilai } = useKomponenNilai();

  const activeTahunAjaran = tahunAjaran.find((ta) => ta.isActive);
  const isGuru = user?.role === 'guru';

  const mySchedules = useMemo(() => {
    if (!user || !activeTahunAjaran) return [];
    return jadwalPelajaran.filter(
      (j) =>
        j.guruId === user.id &&
        j.tahunAjaran === activeTahunAjaran.tahun &&
        j.semester === activeTahunAjaran.semester
    );
  }, [user, jadwalPelajaran, activeTahunAjaran]);

  const tingkatYangDiajar = useMemo(() => {
    const kelasIds = new Set(mySchedules.map((j) => j.kelasId));
    const tingkatSet = new Set(
      kelas.filter((k) => kelasIds.has(k.id)).map((k) => k.tingkat)
    );
    return Array.from(tingkatSet).sort((a, b) => a - b);
  }, [mySchedules, kelas]);

  const mapelUntukTingkat = (tingkat: number) => {
    const kelasIds = kelas.filter((k) => k.tingkat === tingkat).map((k) => k.id);
    const mapelIds = new Set(
      mySchedules
        .filter((j) => kelasIds.includes(j.kelasId))
        .map((j) => j.mataPelajaranId)
    );
    return mataPelajaran.filter((m) => mapelIds.has(m.id));
  };

  const [selectedCBTKelas, setSelectedCBTKelas] = useState<CBTKelas | null>(null);
  const [selectedBank, setSelectedBank] = useState<CBTBankSoal | null>(null);
  const [isAddKelasModalOpen, setIsAddKelasModalOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isAddSoalModalOpen, setIsAddSoalModalOpen] = useState(false);
  const [editingSoal, setEditingSoal] = useState<CBTSoalItem | null>(null);
  const [selectedSoalDetail, setSelectedSoalDetail] = useState<CBTSoalItem | null>(null);
  const [showPreviewSoal, setShowPreviewSoal] = useState(false);
  const [selectedTingkat, setSelectedTingkat] = useState<number | ''>('');
  const [selectedMapelId, setSelectedMapelId] = useState('');
  const [bankJudul, setBankJudul] = useState('');
  const [selectedKategoriId, setSelectedKategoriId] = useState('');
  const [selectedJenisSoal, setSelectedJenisSoal] = useState<CBTQuestionType>('pilihan_ganda');
  const [totalSoal, setTotalSoal] = useState<number | ''>('');
  const [customKuota, setCustomKuota] = useState<
    Partial<Record<CBTConcreteQuestionType, number>>
  >({});
  const [soalForm, setSoalForm] = useState<SoalFormState>(defaultSoalState);

  const { cbtKelas, refreshCBTKelas } = useCBTKelas(
    isGuru && user && activeTahunAjaran
      ? {
          guruId: user.id,
          semester: activeTahunAjaran.semester,
          tahunAjaran: activeTahunAjaran.tahun,
        }
      : {}
  );

  const { bankSoal, refreshBankSoal } = useCBTBankSoal(
    selectedCBTKelas && user
      ? {
          cbtKelasId: selectedCBTKelas.id,
          guruId: user.id,
          includeGlobal: true,
        }
      : {}
  );

  const soal = selectedBank ? (selectedBank.soal ?? []) : [];
  const allowedCustomTypes = useMemo(() => {
    if (!selectedBank || selectedBank.tipe !== 'custom') return [];
    const kuota = (selectedBank.customKuota || {}) as Record<string, unknown>;
    const keys = Object.keys(kuota) as CBTConcreteQuestionType[];
    return keys.filter((k) => Number((kuota as any)[k]) > 0);
  }, [selectedBank]);

  const tingkatLabel = (tingkat: number) => `Kelas ${tingkat}`;
  const getMapelName = (id: string) =>
    mataPelajaran.find((m) => m.id === id)?.name || 'Mata Pelajaran';

  const resetSoalForm = () => {
    setSoalForm({
      ...defaultSoalState,
      tipe: selectedBank?.tipe ?? 'pilihan_ganda',
      poin: 1,
      gambar: null,
      menjodohkanScoring: 'semua_benar',
      menjodohkanMinimalBenar: 1,
    });
  };

  const handleOpenAddKelasModal = () => {
    setSelectedTingkat('');
    setSelectedMapelId('');
    setIsAddKelasModalOpen(true);
  };

  const handleOpenAddBankModal = () => {
    setBankJudul('');
    setSelectedKategoriId('');
    setSelectedJenisSoal('pilihan_ganda');
    setTotalSoal('');
    setCustomKuota({});
    setIsAddBankModalOpen(true);
  };

  const handleCreateCBTKelas = async () => {
    if (!user || !activeTahunAjaran) return;
    if (!selectedTingkat || !selectedMapelId) {
      showErrorNotification('Data belum lengkap', 'Pilih tingkat kelas dan mata pelajaran terlebih dahulu.');
      return;
    }
    try {
      const response = await apiService.createCBTKelas({
        guruId: user.id,
        tingkat: selectedTingkat,
        mataPelajaranId: selectedMapelId,
        semester: activeTahunAjaran.semester,
        tahunAjaran: activeTahunAjaran.tahun,
      });
      if (!response.success) throw new Error(response.message || 'Gagal membuat kelas CBT');
      showSuccessNotification('Berhasil', 'Kelas CBT berhasil ditambahkan untuk kombinasi tingkat dan mata pelajaran yang dipilih.');
      setIsAddKelasModalOpen(false);
      await refreshCBTKelas();
    } catch (error: unknown) {
      console.error(error);
      showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat membuat kelas CBT.');
    }
  };

  const handleOpenAddSoalModal = () => {
    if (!selectedBank) return;
    resetSoalForm();
    const initialTipe =
      selectedBank.tipe === 'custom'
        ? (allowedCustomTypes[0] ?? 'pilihan_ganda')
        : selectedBank.tipe;
    setSoalForm((prev) => ({ ...prev, tipe: initialTipe }));
    setEditingSoal(null);
    setIsAddSoalModalOpen(true);
  };

  const handleOpenEditSoalModal = (item: CBTSoalItem) => {
    setEditingSoal(item);
    setSoalForm({
      tipe: item.tipe,
      pertanyaan: item.pertanyaan,
      poin: item.poin,
      opsi:
        Array.isArray(item.opsi) && item.opsi.length > 0
          ? item.opsi.map((o) => ({ ...o }))
          : [
              { id: 'opt-1', text: '', isCorrect: true },
              { id: 'opt-2', text: '', isCorrect: false },
            ],
      jawabanBenarBoolean: item.tipe === 'benar_salah' ? item.jawabanBenar === true : undefined,
      pasangan:
        Array.isArray(item.pasanganMenjodohkan) && item.pasanganMenjodohkan.length > 0
          ? item.pasanganMenjodohkan.map((p) => ({ ...p }))
          : [
              { id: 'pair-1', left: '', right: '' },
              { id: 'pair-2', left: '', right: '' },
            ],
      jawabanEssay: item.tipe === 'essay' ? String(item.jawabanBenar || '') : undefined,
      gambar: item.gambar ?? null,
      menjodohkanScoring: item.menjodohkanScoring ?? 'semua_benar',
      menjodohkanMinimalBenar: item.menjodohkanMinimalBenar ?? 1,
    });
    setIsAddSoalModalOpen(true);
  };

  const handleCloseSoalModal = () => {
    setIsAddSoalModalOpen(false);
    setEditingSoal(null);
    resetSoalForm();
  };

  const handleAddOpsi = () => {
    setSoalForm((prev) => ({
      ...prev,
      opsi: [...prev.opsi, { id: `opt-${Date.now()}`, text: '', isCorrect: false }],
    }));
  };

  const handleUpdateOpsiText = (id: string, text: string) => {
    setSoalForm((prev) => ({
      ...prev,
      opsi: prev.opsi.map((o) => (o.id === id ? { ...o, text } : o)),
    }));
  };

  const handleToggleOpsiCorrect = (id: string) => {
    setSoalForm((prev) => {
      if (prev.tipe === 'pilihan_ganda') {
        return { ...prev, opsi: prev.opsi.map((o) => ({ ...o, isCorrect: o.id === id })) };
      }
      return {
        ...prev,
        opsi: prev.opsi.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)),
      };
    });
  };

  const handleRemoveOpsi = (id: string) => {
    setSoalForm((prev) => ({ ...prev, opsi: prev.opsi.filter((o) => o.id !== id) }));
  };

  const handleAddPair = () => {
    setSoalForm((prev) => ({
      ...prev,
      pasangan: [...prev.pasangan, { id: `pair-${Date.now()}`, left: '', right: '' }],
    }));
  };

  const handleUpdatePair = (id: string, side: 'left' | 'right', value: string) => {
    setSoalForm((prev) => ({
      ...prev,
      pasangan: prev.pasangan.map((p) => (p.id === id ? { ...p, [side]: value } : p)),
    }));
  };

  const handleRemovePair = (id: string) => {
    setSoalForm((prev) => ({ ...prev, pasangan: prev.pasangan.filter((p) => p.id !== id) }));
  };

  const handleCreateBankSoal = async () => {
    if (!selectedCBTKelas || !user) return;
    if (!bankJudul.trim() || !selectedKategoriId) {
      showErrorNotification('Data belum lengkap', 'Isi judul bank soal dan pilih kategori nilai terlebih dahulu.');
      return;
    }
    if (totalSoal === '' || totalSoal < 1) {
      showErrorNotification('Data belum lengkap', 'Isi Total Soal (minimal 1).');
      return;
    }
    const kategori = komponenNilai.find((k) => k.id === selectedKategoriId);
    if (!kategori) {
      showErrorNotification('Data tidak valid', 'Kategori nilai yang dipilih tidak ditemukan.');
      return;
    }
    const isKategoriGanda = !!kategori.hasNilai;
    const existingBanksForKelas = bankSoal.filter((b) => b.cbtKelasId === selectedCBTKelas.id);
    if (!isKategoriGanda) {
      if (existingBanksForKelas.some((b) => b.kategoriId === kategori.id)) {
        showErrorNotification(
          'Tidak diperbolehkan',
          `Bank soal untuk kategori "${kategori.nama}" sudah dibuat untuk tingkat dan mata pelajaran ini.`
        );
        return;
      }
    }
    if (isKategoriGanda) {
      const normalizedNewTitle = bankJudul.trim().toLowerCase();
      if (
        existingBanksForKelas.some(
          (b) =>
            b.kategoriId === kategori.id &&
            b.judul.trim().toLowerCase() === normalizedNewTitle
        )
      ) {
        showErrorNotification(
          'Tidak diperbolehkan',
          `Bank soal dengan kategori "${kategori.nama}" dan judul "${bankJudul.trim()}" sudah ada. Silakan gunakan judul lain.`
        );
        return;
      }
    }

    if (selectedJenisSoal === 'custom') {
      const entries = Object.entries(customKuota || {}).filter(([, v]) => v !== undefined);
      if (entries.length === 0) {
        showErrorNotification('Data belum lengkap', 'Untuk jenis soal Custom, pilih minimal 1 jenis soal.');
        return;
      }
      let sum = 0;
      for (const [, v] of entries) {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) {
          showErrorNotification('Data belum lengkap', 'Kuota tiap jenis soal Custom harus diisi (minimal 1).');
          return;
        }
        sum += n;
      }
      if (sum > totalSoal) {
        showErrorNotification(
          'Jumlah tidak valid',
          `Total kuota Custom (${sum}) tidak boleh melebihi Total Soal (${totalSoal}).`
        );
        return;
      }
    }
    try {
      const response = await apiService.createCBTBankSoal({
        cbtKelasId: selectedCBTKelas.id,
        guruId: user.id,
        judul: bankJudul.trim(),
        kategoriId: kategori.id,
        kategoriNama: kategori.nama,
        tipe: selectedJenisSoal,
        totalSoal,
        customKuota: selectedJenisSoal === 'custom' ? customKuota : {},
      });
      if (!response.success) throw new Error(response.message || 'Gagal membuat bank soal CBT');
      showSuccessNotification('Berhasil', 'Bank soal CBT berhasil ditambahkan.');
      setIsAddBankModalOpen(false);
      await refreshBankSoal();
    } catch (error: unknown) {
      console.error(error);
      showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat membuat bank soal CBT.');
    }
  };

  const buildJawabanBenar = (): unknown => {
    if (soalForm.tipe === 'pilihan_ganda' || soalForm.tipe === 'pilihan_ganda_kompleks')
      return soalForm.opsi.filter((o) => o.isCorrect).map((o) => o.id);
    if (soalForm.tipe === 'benar_salah') return soalForm.jawabanBenarBoolean;
    if (soalForm.tipe === 'essay') return soalForm.jawabanEssay || null;
    return null;
  };

  const validateSoalForm = (): boolean => {
    if (!soalForm.pertanyaan.trim()) {
      showErrorNotification('Data belum lengkap', 'Pertanyaan tidak boleh kosong.');
      return false;
    }
    if (soalForm.tipe === 'pilihan_ganda' || soalForm.tipe === 'pilihan_ganda_kompleks') {
      if (soalForm.opsi.some((o) => !o.text?.trim())) {
        showErrorNotification('Data belum lengkap', 'Semua teks opsi jawaban tidak boleh kosong.');
        return false;
      }
      if (soalForm.opsi.filter((o) => o.isCorrect).length === 0) {
        showErrorNotification('Data belum lengkap', 'Tentukan minimal satu jawaban benar.');
        return false;
      }
    }
    if (soalForm.tipe === 'benar_salah' && soalForm.jawabanBenarBoolean === undefined) {
      showErrorNotification('Data belum lengkap', 'Pilih jawaban benar/salah.');
      return false;
    }
    if (soalForm.tipe === 'menjodohkan' && soalForm.menjodohkanScoring === 'minimal_benar') {
      const totalPasangan =
        soalForm.pasangan.filter((p) => p.left.trim() || p.right.trim()).length || soalForm.pasangan.length;
      if (
        soalForm.menjodohkanMinimalBenar < 1 ||
        soalForm.menjodohkanMinimalBenar > totalPasangan
      ) {
        showErrorNotification('Data belum lengkap', `Minimal benar harus antara 1 dan ${totalPasangan}.`);
        return false;
      }
    }
    return true;
  };

  const handleCreateSoal = async () => {
    if (!selectedCBTKelas || !selectedBank || !user || !activeTahunAjaran) return;
    const bankTotal = selectedBank.totalSoal ?? null;
    if (bankTotal !== null && bankTotal !== undefined) {
      const current = (selectedBank.soal ?? []).length;
      if (current >= bankTotal) {
        showErrorNotification('Maksimal tercapai', `Jumlah soal di bank ini sudah ${current}/${bankTotal}.`);
        return;
      }
    }
    if (selectedBank.tipe === 'custom') {
      const kuota = selectedBank.customKuota || {};
      const allowed = allowedCustomTypes;
      if (allowed.length > 0 && !allowed.includes(soalForm.tipe as any)) {
        showErrorNotification('Tidak diperbolehkan', 'Tipe soal tidak termasuk konfigurasi custom bank soal.');
        return;
      }
      const currentByType = (selectedBank.soal ?? []).filter((s) => s.tipe === soalForm.tipe).length;
      const maxForType = Number((kuota as any)[soalForm.tipe] ?? 0);
      if (maxForType > 0 && currentByType >= maxForType) {
        showErrorNotification(
          'Kuota habis',
          `Kuota "${String(soalForm.tipe).replace(/_/g, ' ')}" sudah ${currentByType}/${maxForType}.`
        );
        return;
      }
    } else {
      // Pastikan tipe sesuai bank untuk non-custom (safety)
      if (soalForm.tipe !== selectedBank.tipe) {
        showErrorNotification('Tidak diperbolehkan', 'Tipe soal harus mengikuti tipe bank soal.');
        return;
      }
    }
    if (!validateSoalForm()) return;
    const jawabanBenar = buildJawabanBenar();
    try {
      const newItem: CBTSoalItem = {
        id: `cbt-soal-${Date.now()}`,
        tipe: soalForm.tipe,
        pertanyaan: soalForm.pertanyaan,
        poin: soalForm.poin,
        opsi:
          soalForm.tipe === 'pilihan_ganda' || soalForm.tipe === 'pilihan_ganda_kompleks'
            ? soalForm.opsi
            : [],
        jawabanBenar,
        pasanganMenjodohkan: soalForm.tipe === 'menjodohkan' ? soalForm.pasangan : [],
        gambar: soalForm.gambar || null,
        menjodohkanScoring:
          soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanScoring : 'semua_benar',
        menjodohkanMinimalBenar:
          soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanMinimalBenar : 1,
      };
      const updatedSoal = [...(selectedBank.soal ?? []), newItem];
      const response = await apiService.updateCBTBankSoal(selectedBank.id, { soal: updatedSoal });
      if (!response.success) throw new Error(response.message || 'Gagal membuat soal CBT');
      showSuccessNotification('Berhasil', 'Soal CBT berhasil ditambahkan.');
      handleCloseSoalModal();
      await refreshBankSoal();
      if (response.data) setSelectedBank(response.data as CBTBankSoal);
    } catch (error: unknown) {
      console.error(error);
      showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat menyimpan soal CBT.');
    }
  };

  const handleUpdateSoal = async () => {
    if (!editingSoal || !selectedCBTKelas || !selectedBank || !user) return;
    if (selectedBank.tipe === 'custom') {
      const kuota = selectedBank.customKuota || {};
      const allowed = allowedCustomTypes;
      if (allowed.length > 0 && !allowed.includes(soalForm.tipe as any)) {
        showErrorNotification('Tidak diperbolehkan', 'Tipe soal tidak termasuk konfigurasi custom bank soal.');
        return;
      }
      const withoutThis = (selectedBank.soal ?? []).filter((s) => s.id !== editingSoal.id);
      const currentByType = withoutThis.filter((s) => s.tipe === soalForm.tipe).length;
      const maxForType = Number((kuota as any)[soalForm.tipe] ?? 0);
      if (maxForType > 0 && currentByType >= maxForType) {
        showErrorNotification(
          'Kuota habis',
          `Kuota "${String(soalForm.tipe).replace(/_/g, ' ')}" sudah ${currentByType}/${maxForType}.`
        );
        return;
      }
    } else {
      if (soalForm.tipe !== selectedBank.tipe) {
        showErrorNotification('Tidak diperbolehkan', 'Tipe soal harus mengikuti tipe bank soal.');
        return;
      }
    }
    if (!validateSoalForm()) return;
    const jawabanBenar = buildJawabanBenar();
    try {
      const updatedItem: CBTSoalItem = {
        id: editingSoal.id,
        tipe: soalForm.tipe,
        pertanyaan: soalForm.pertanyaan,
        poin: soalForm.poin,
        opsi:
          soalForm.tipe === 'pilihan_ganda' || soalForm.tipe === 'pilihan_ganda_kompleks'
            ? soalForm.opsi
            : [],
        jawabanBenar,
        pasanganMenjodohkan: soalForm.tipe === 'menjodohkan' ? soalForm.pasangan : [],
        gambar: soalForm.gambar || null,
        menjodohkanScoring:
          soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanScoring : 'semua_benar',
        menjodohkanMinimalBenar:
          soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanMinimalBenar : 1,
      };
      const updatedSoal = (selectedBank.soal ?? []).map((s) =>
        s.id === editingSoal.id ? updatedItem : s
      );
      const response = await apiService.updateCBTBankSoal(selectedBank.id, { soal: updatedSoal });
      if (!response.success) throw new Error(response.message || 'Gagal memperbarui soal CBT');
      showSuccessNotification('Berhasil', 'Soal CBT berhasil diperbarui.');
      handleCloseSoalModal();
      await refreshBankSoal();
      if (response.data) setSelectedBank(response.data as CBTBankSoal);
    } catch (error: unknown) {
      console.error(error);
      showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat memperbarui soal CBT.');
    }
  };

  const handleDeleteSoal = async (item: CBTSoalItem) => {
    if (!selectedBank || !window.confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      const updatedSoal = (selectedBank.soal ?? []).filter((s) => s.id !== item.id);
      const response = await apiService.updateCBTBankSoal(selectedBank.id, { soal: updatedSoal });
      if (!response.success) throw new Error(response.message || 'Gagal menghapus soal CBT');
      showSuccessNotification('Berhasil', 'Soal CBT berhasil dihapus.');
      await refreshBankSoal();
      if (response.data) setSelectedBank(response.data as CBTBankSoal);
    } catch (error: unknown) {
      console.error(error);
      showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat menghapus soal CBT.');
    }
  };

  const komponenNilaiForBank = useMemo(
    () =>
      komponenNilai.filter((k) => {
        const nama = k.nama.toLowerCase();
        if (nama === 'kehadiran') return false;
        if (nama.includes('uts')) return false;
        if (nama.includes('uas')) return false;
        return true;
      }),
    [komponenNilai]
  );

  return {
    isGuru,
    activeTahunAjaran,
    user,
    cbtKelas,
    selectedCBTKelas,
    setSelectedCBTKelas,
    selectedBank,
    setSelectedBank,
    bankSoal,
    soal,
    allowedCustomTypes,
    tingkatYangDiajar,
    mapelUntukTingkat,
    tingkatLabel,
    getMapelName,
    isAddKelasModalOpen,
    setIsAddKelasModalOpen,
    isAddBankModalOpen,
    setIsAddBankModalOpen,
    isAddSoalModalOpen,
    editingSoal,
    selectedSoalDetail,
    setSelectedSoalDetail,
    showPreviewSoal,
    setShowPreviewSoal,
    selectedTingkat,
    setSelectedTingkat,
    selectedMapelId,
    setSelectedMapelId,
    bankJudul,
    setBankJudul,
    selectedKategoriId,
    setSelectedKategoriId,
    selectedJenisSoal,
    setSelectedJenisSoal,
    totalSoal,
    setTotalSoal,
    customKuota,
    setCustomKuota,
    soalForm,
    setSoalForm,
    komponenNilaiForBank,
    handleOpenAddKelasModal,
    handleCreateCBTKelas,
    handleOpenAddBankModal,
    handleOpenAddSoalModal,
    handleOpenEditSoalModal,
    handleCloseSoalModal,
    handleAddOpsi,
    handleUpdateOpsiText,
    handleToggleOpsiCorrect,
    handleRemoveOpsi,
    handleAddPair,
    handleUpdatePair,
    handleRemovePair,
    handleCreateBankSoal,
    handleCreateSoal,
    handleUpdateSoal,
    handleDeleteSoal,
  };
}
