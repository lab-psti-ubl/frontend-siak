import { useMemo, useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useKomponenNilai } from '../../../../../hooks/useKomponenNilai';
import { useCBTBankSoal } from '../../../../../hooks/useCBTBankSoal';
import { useCBTSoalInputAssignments } from '../../../../../hooks/useCBTSoalInputAssignments';
import { useJurusan } from '../../../../../hooks/useJurusan';
import { apiService } from '../../../../../services/apiService';
import type {
  CBTBankSoal,
  CBTConcreteQuestionType,
  CBTQuestionType,
  CBTSoalItem,
  CBTSoalInputAssignment,
} from '../../../../../types';
import { showErrorNotification, showSuccessNotification } from '../../../../../utils/notificationUtils';
import { defaultSoalState, type SoalFormState } from '../BankSoalCBT/types';
import { shouldShowJurusanSync } from '../../../../../utils/jenjangPendidikanUtils';

const getGlobalCBTBankSoalId = (tingkat: number, mataPelajaranId: string, jurusanId?: string) => {
  const j = String(jurusanId || '').trim();
  return j ? `global-${tingkat}-${mataPelajaranId}--jur--${j}` : `global-${tingkat}-${mataPelajaranId}`;
};

export function useBankSoalUTSUAS() {
  const { user } = useAuth();
  const { tahunAjaran } = useTahunAjaran();
  const { mataPelajaran } = useMataPelajaran();
  const { komponenNilai } = useKomponenNilai();
  const { jurusan } = useJurusan();
  const jurusanRequired = shouldShowJurusanSync();

  const isGuru = user?.role === 'guru';
  const activeTahunAjaran = tahunAjaran.find((ta) => ta.isActive);

  const { assignments, loading: loadingAssignments } = useCBTSoalInputAssignments({
    enabled: isGuru && !!activeTahunAjaran,
    tahunAjaran: activeTahunAjaran?.tahun,
    semester: activeTahunAjaran?.semester,
  });

  const [selectedAssignment, setSelectedAssignment] = useState<CBTSoalInputAssignment | null>(null);
  const [selectedBank, setSelectedBank] = useState<CBTBankSoal | null>(null);

  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isAddSoalModalOpen, setIsAddSoalModalOpen] = useState(false);
  const [editingSoal, setEditingSoal] = useState<CBTSoalItem | null>(null);
  const [selectedSoalDetail, setSelectedSoalDetail] = useState<CBTSoalItem | null>(null);
  const [showPreviewSoal, setShowPreviewSoal] = useState(false);

  const [bankJudul, setBankJudul] = useState('');
  const [selectedJenisSoal, setSelectedJenisSoal] = useState<CBTQuestionType>('pilihan_ganda');
  const [totalSoal, setTotalSoal] = useState<number | ''>('');
  const [customKuota, setCustomKuota] = useState<
    Partial<Record<CBTConcreteQuestionType, number>>
  >({});
  const [soalForm, setSoalForm] = useState<SoalFormState>(defaultSoalState);

  const globalCBTKelasId = useMemo(() => {
    if (!selectedAssignment) return '';
    return getGlobalCBTBankSoalId(
      selectedAssignment.tingkat,
      selectedAssignment.mataPelajaranId,
      selectedAssignment.jurusanId
    );
  }, [selectedAssignment]);

  const { bankSoal: allGlobalBanks, refreshBankSoal } = useCBTBankSoal(
    globalCBTKelasId ? { cbtKelasId: globalCBTKelasId } : {}
  );

  const bankSoal = useMemo(() => {
    if (!selectedAssignment) return [];
    return allGlobalBanks.filter((b) => b.kategoriId === selectedAssignment.kategoriId);
  }, [allGlobalBanks, selectedAssignment]);

  const soal = selectedBank ? (selectedBank.soal ?? []) : [];
  const allowedCustomTypes = useMemo(() => {
    if (!selectedBank || selectedBank.tipe !== 'custom') return [];
    const kuota = (selectedBank.customKuota || {}) as Record<string, unknown>;
    const keys = Object.keys(kuota) as CBTConcreteQuestionType[];
    return keys.filter((k) => Number((kuota as any)[k]) > 0);
  }, [selectedBank]);

  const kategoriAssignment = useMemo(() => {
    if (!selectedAssignment) return null;
    return komponenNilai.find((k) => k.id === selectedAssignment.kategoriId) || null;
  }, [komponenNilai, selectedAssignment]);

  const getMapelName = (id: string) => mataPelajaran.find((m) => m.id === id)?.name || 'Mata Pelajaran';
  const tingkatLabel = (tingkat: number) => `Kelas ${tingkat}`;
  const getJurusanName = (id?: string) =>
    !id ? 'Semua Jurusan' : jurusan.find((j) => j.id === id)?.nama || 'Jurusan';

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

  const handleOpenAddBankModal = () => {
    setBankJudul('');
    setSelectedJenisSoal('pilihan_ganda');
    setTotalSoal('');
    setCustomKuota({});
    setIsAddBankModalOpen(true);
  };

  const handleCreateBankSoal = async () => {
    if (!user || !activeTahunAjaran || !selectedAssignment) return;
    if (!bankJudul.trim()) {
      showErrorNotification('Data belum lengkap', 'Isi judul bank soal terlebih dahulu.');
      return;
    }
    if (totalSoal === '' || totalSoal < 1) {
      showErrorNotification('Data belum lengkap', 'Isi Total Soal (minimal 1).');
      return;
    }
    if (!kategoriAssignment) {
      showErrorNotification('Kategori tidak valid', 'Kategori UTS/UAS tidak ditemukan.');
      return;
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
      const res = await apiService.createCBTBankSoal({
        cbtKelasId: globalCBTKelasId,
        // Akan dioverride backend menjadi "admin" untuk bank global
        guruId: 'admin',
        judul: bankJudul.trim(),
        kategoriId: kategoriAssignment.id,
        kategoriNama: kategoriAssignment.nama,
        tipe: selectedJenisSoal,
        totalSoal,
        customKuota: selectedJenisSoal === 'custom' ? customKuota : {},
      });
      if (!res.success) throw new Error(res.message || 'Gagal membuat bank soal.');
      showSuccessNotification('Berhasil', 'Bank soal global UTS/UAS berhasil dibuat.');
      setIsAddBankModalOpen(false);
      await refreshBankSoal();
    } catch (e: any) {
      showErrorNotification('Gagal', e.message || 'Terjadi kesalahan saat membuat bank soal.');
    }
  };

  const buildJawabanBenar = (): unknown => {
    if (soalForm.tipe === 'pilihan_ganda' || soalForm.tipe === 'pilihan_ganda_kompleks') {
      return soalForm.opsi.filter((o) => o.isCorrect).map((o) => o.id);
    }
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
      if (soalForm.menjodohkanMinimalBenar < 1 || soalForm.menjodohkanMinimalBenar > totalPasangan) {
        showErrorNotification('Data belum lengkap', `Minimal benar harus antara 1 dan ${totalPasangan}.`);
        return false;
      }
    }
    return true;
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
      return { ...prev, opsi: prev.opsi.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)) };
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

  const handleCreateSoal = async () => {
    if (!selectedBank) return;
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
          soalForm.tipe === 'pilihan_ganda' || soalForm.tipe === 'pilihan_ganda_kompleks' ? soalForm.opsi : [],
        jawabanBenar,
        pasanganMenjodohkan: soalForm.tipe === 'menjodohkan' ? soalForm.pasangan : [],
        gambar: soalForm.gambar || null,
        menjodohkanScoring: soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanScoring : 'semua_benar',
        menjodohkanMinimalBenar: soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanMinimalBenar : 1,
      };
      const updatedSoal = [...(selectedBank.soal ?? []), newItem];
      const res = await apiService.updateCBTBankSoal(selectedBank.id, { soal: updatedSoal });
      if (!res.success) throw new Error(res.message || 'Gagal menyimpan soal.');
      showSuccessNotification('Berhasil', 'Soal berhasil ditambahkan.');
      handleCloseSoalModal();
      await refreshBankSoal();
      if (res.data) setSelectedBank(res.data as CBTBankSoal);
    } catch (e: any) {
      showErrorNotification('Gagal', e.message || 'Terjadi kesalahan saat menyimpan soal.');
    }
  };

  const handleUpdateSoal = async () => {
    if (!editingSoal || !selectedBank) return;
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
      const updatedSoal = (selectedBank.soal ?? []).map((s) =>
        s.id === editingSoal.id
          ? {
              ...s,
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
              menjodohkanScoring: soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanScoring : 'semua_benar',
              menjodohkanMinimalBenar:
                soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanMinimalBenar : 1,
            }
          : s
      );
      const res = await apiService.updateCBTBankSoal(selectedBank.id, { soal: updatedSoal });
      if (!res.success) throw new Error(res.message || 'Gagal memperbarui soal.');
      showSuccessNotification('Berhasil', 'Soal berhasil diperbarui.');
      handleCloseSoalModal();
      await refreshBankSoal();
      if (res.data) setSelectedBank(res.data as CBTBankSoal);
    } catch (e: any) {
      showErrorNotification('Gagal', e.message || 'Terjadi kesalahan saat memperbarui soal.');
    }
  };

  const handleDeleteSoal = async (item: CBTSoalItem) => {
    if (!selectedBank) return;
    if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      const updatedSoal = (selectedBank.soal ?? []).filter((s) => s.id !== item.id);
      const res = await apiService.updateCBTBankSoal(selectedBank.id, { soal: updatedSoal });
      if (!res.success) throw new Error(res.message || 'Gagal menghapus soal.');
      showSuccessNotification('Berhasil', 'Soal berhasil dihapus.');
      await refreshBankSoal();
      if (res.data) setSelectedBank(res.data as CBTBankSoal);
    } catch (e: any) {
      showErrorNotification('Gagal', e.message || 'Terjadi kesalahan saat menghapus soal.');
    }
  };

  return {
    isGuru,
    activeTahunAjaran,
    assignments,
    loadingAssignments,
    selectedAssignment,
    setSelectedAssignment,
    selectedBank,
    setSelectedBank,
    bankSoal,
    soal,
    allowedCustomTypes,
    globalCBTKelasId,
    kategoriAssignment,
    jurusanRequired,
    getJurusanName,
    tingkatLabel,
    getMapelName,
    isAddBankModalOpen,
    setIsAddBankModalOpen,
    isAddSoalModalOpen,
    editingSoal,
    selectedSoalDetail,
    setSelectedSoalDetail,
    showPreviewSoal,
    setShowPreviewSoal,
    bankJudul,
    setBankJudul,
    selectedJenisSoal,
    setSelectedJenisSoal,
    totalSoal,
    setTotalSoal,
    customKuota,
    setCustomKuota,
    soalForm,
    setSoalForm,
    handleOpenAddBankModal,
    handleCreateBankSoal,
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
    handleCreateSoal,
    handleUpdateSoal,
    handleDeleteSoal,
  };
}

