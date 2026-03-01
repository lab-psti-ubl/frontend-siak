import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';
import { useKelas } from '../../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useKomponenNilai } from '../../../../../hooks/useKomponenNilai';
import { useCBTBankSoal } from '../../../../../hooks/useCBTBankSoal';
import { apiService } from '../../../../../services/apiService';
import type { CBTBankSoal, CBTSoalItem, CBTQuestionType } from '../../../../../types';
import { showSuccessNotification, showErrorNotification } from '../../../../../utils/notificationUtils';
import { defaultSoalState, getGlobalCBTBankSoalId, type KelasAdmin, type SoalFormState } from './types';

export function useAdminBankSoalCBT() {
  const { user } = useAuth();
  const { tahunAjaran } = useTahunAjaran();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { komponenNilai } = useKomponenNilai();

  const activeTahunAjaran = tahunAjaran.find((ta) => ta.isActive);
  const isAdmin = user?.role === 'admin';

  const tingkatList = useMemo(() => {
    const set = new Set<number>();
    kelas.forEach((k) => {
      if (typeof k.tingkat === 'number') set.add(k.tingkat);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [kelas]);

  const [selectedKelasAdmin, setSelectedKelasAdmin] = useState<KelasAdmin | null>(null);
  const [selectedBank, setSelectedBank] = useState<CBTBankSoal | null>(null);
  const [addedCombos, setAddedCombos] = useState<KelasAdmin[]>([]);
  const [allAdminBanks, setAllAdminBanks] = useState<CBTBankSoal[]>([]);
  const [loadingAdminBanks, setLoadingAdminBanks] = useState(false);
  const [isAddKelasModalOpen, setIsAddKelasModalOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isAddSoalModalOpen, setIsAddSoalModalOpen] = useState(false);
  const [editingSoal, setEditingSoal] = useState<CBTSoalItem | null>(null);
  const [selectedSoalDetail, setSelectedSoalDetail] = useState<CBTSoalItem | null>(null);
  const [showPreviewSoal, setShowPreviewSoal] = useState(false);
  const [bankJudul, setBankJudul] = useState('');
  const [selectedKategoriId, setSelectedKategoriId] = useState('');
  const [selectedJenisSoal, setSelectedJenisSoal] = useState<CBTQuestionType>('pilihan_ganda');
  const [soalForm, setSoalForm] = useState<SoalFormState>(defaultSoalState);
  const [addKelasTingkat, setAddKelasTingkat] = useState<number | ''>('');
  const [addKelasMapelId, setAddKelasMapelId] = useState('');

  const globalCBTKelasId = selectedKelasAdmin
    ? getGlobalCBTBankSoalId(selectedKelasAdmin.tingkat, selectedKelasAdmin.mataPelajaranId)
    : '';

  const { bankSoal, refreshBankSoal } = useCBTBankSoal(
    globalCBTKelasId ? { cbtKelasId: globalCBTKelasId } : {}
  );

  const soal = selectedBank ? (selectedBank.soal ?? []) : [];

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingAdminBanks(true);
    apiService
      .getAllCBTBankSoal({ guruId: 'admin' })
      .then((res) => {
        if (res.success && res.data) setAllAdminBanks(res.data as CBTBankSoal[]);
        else setAllAdminBanks([]);
      })
      .catch((e) => {
        console.error(e);
        setAllAdminBanks([]);
      })
      .finally(() => setLoadingAdminBanks(false));
  }, [isAdmin]);

  const kelasCBTList = useMemo(() => {
    const seen = new Set<string>();
    const list: KelasAdmin[] = [];
    const add = (k: KelasAdmin) => {
      const key = `${k.tingkat}-${k.mataPelajaranId}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push(k);
    };
    allAdminBanks.forEach((b) => {
      const m = b.cbtKelasId?.match(/^global-(\d+)-(.+)$/);
      if (m) add({ tingkat: parseInt(m[1], 10), mataPelajaranId: m[2] });
    });
    addedCombos.forEach((k) => add(k));
    return list.sort((a, b) => {
      if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
      const nameA = mataPelajaran.find((m) => m.id === a.mataPelajaranId)?.name || '';
      const nameB = mataPelajaran.find((m) => m.id === b.mataPelajaranId)?.name || '';
      return nameA.localeCompare(nameB);
    });
  }, [allAdminBanks, addedCombos, mataPelajaran]);

  const getMapelName = (id: string) =>
    mataPelajaran.find((m) => m.id === id)?.name || 'Mata Pelajaran';
  const tingkatLabel = (tingkat: number) => `Kelas ${tingkat}`;

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

  const refreshAdminBanks = async () => {
    try {
      const res = await apiService.getAllCBTBankSoal({ guruId: 'admin' });
      if (res.success && res.data) setAllAdminBanks(res.data as CBTBankSoal[]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddKelasModal = () => {
    setAddKelasTingkat('');
    setAddKelasMapelId('');
    setIsAddKelasModalOpen(true);
  };

  const handleCreateKelasAdmin = () => {
    if (!addKelasTingkat || !addKelasMapelId) {
      showErrorNotification('Data belum lengkap', 'Pilih tingkat kelas dan mata pelajaran terlebih dahulu.');
      return;
    }
    const combo: KelasAdmin = { tingkat: addKelasTingkat as number, mataPelajaranId: addKelasMapelId };
    const key = `${combo.tingkat}-${combo.mataPelajaranId}`;
    const exists = kelasCBTList.some((k) => `${k.tingkat}-${k.mataPelajaranId}` === key);
    if (exists) {
      showErrorNotification('Sudah ada', 'Kombinasi tingkat dan mata pelajaran ini sudah ada di daftar.');
      return;
    }
    setAddedCombos((prev) => [...prev, combo]);
    setIsAddKelasModalOpen(false);
    showSuccessNotification(
      'Berhasil',
      'Kelas CBT global berhasil ditambahkan. Klik Lihat Bank Soal untuk menambahkan bank soal UTS/UAS.'
    );
  };

  const handleOpenAddBankModal = () => {
    setBankJudul('');
    setSelectedKategoriId('');
    setSelectedJenisSoal('pilihan_ganda');
    setIsAddBankModalOpen(true);
  };

  const handleOpenAddSoalModal = () => {
    if (!selectedBank) return;
    resetSoalForm();
    setSoalForm((prev) => ({ ...prev, tipe: selectedBank.tipe }));
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
    if (!selectedKelasAdmin) {
      showErrorNotification('Data belum lengkap', 'Pilih kelas CBT terlebih dahulu.');
      return;
    }
    if (!bankJudul.trim() || !selectedKategoriId) {
      showErrorNotification('Data belum lengkap', 'Isi judul bank soal dan pilih kategori nilai terlebih dahulu.');
      return;
    }
    const kategori = komponenNilai.find((k) => k.id === selectedKategoriId);
    if (!kategori) {
      showErrorNotification('Data tidak valid', 'Kategori nilai yang dipilih tidak ditemukan.');
      return;
    }
    const lowerName = kategori.nama.toLowerCase();
    if (lowerName !== 'uts' && lowerName !== 'uas') {
      showErrorNotification('Tidak diperbolehkan', 'Bank soal CBT admin hanya untuk kategori UTS dan UAS.');
      return;
    }
    const globalId = getGlobalCBTBankSoalId(selectedKelasAdmin.tingkat, selectedKelasAdmin.mataPelajaranId);
    try {
      const response = await apiService.createCBTBankSoal({
        cbtKelasId: globalId,
        guruId: 'admin',
        judul: bankJudul.trim(),
        kategoriId: kategori.id,
        kategoriNama: kategori.nama,
        tipe: selectedJenisSoal,
      });
      if (!response.success) throw new Error(response.message || 'Gagal membuat bank soal CBT');
      showSuccessNotification('Berhasil', 'Bank soal CBT global berhasil ditambahkan.');
      setIsAddBankModalOpen(false);
      await refreshBankSoal();
      await refreshAdminBanks();
    } catch (error: unknown) {
      console.error(error);
      showErrorNotification('Gagal', (error as Error).message || 'Terjadi kesalahan saat membuat bank soal CBT.');
    }
  };

  const handleDeleteBankSoal = async (bank: CBTBankSoal) => {
    if (!window.confirm('Yakin ingin menghapus bank soal ini?')) return;
    try {
      const res = await apiService.deleteCBTBankSoal(bank.id);
      if (!res.success) throw new Error(res.message || 'Gagal menghapus bank soal CBT.');
      showSuccessNotification('Berhasil', 'Bank soal CBT berhasil dihapus.');
      if (selectedBank?.id === bank.id) setSelectedBank(null);
      await refreshBankSoal();
      await refreshAdminBanks();
    } catch (err: unknown) {
      console.error(err);
      showErrorNotification('Gagal', (err as Error).message || 'Terjadi kesalahan saat menghapus bank soal CBT.');
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
        showErrorNotification(
          'Data belum lengkap',
          'Semua teks opsi jawaban tidak boleh kosong. Mohon isi teks untuk setiap opsi A, B, C, dan seterusnya.'
        );
        return false;
      }
      if (soalForm.opsi.filter((o) => o.isCorrect).length === 0) {
        showErrorNotification('Data belum lengkap', 'Tentukan minimal satu jawaban benar untuk soal pilihan ganda.');
        return false;
      }
    }
    if (soalForm.tipe === 'benar_salah' && soalForm.jawabanBenarBoolean === undefined) {
      showErrorNotification('Data belum lengkap', 'Pilih jawaban benar/salah untuk soal ini.');
      return false;
    }
    if (soalForm.tipe === 'menjodohkan' && soalForm.menjodohkanScoring === 'minimal_benar') {
      const totalPasangan =
        soalForm.pasangan.filter((p) => p.left.trim() || p.right.trim()).length || soalForm.pasangan.length;
      if (
        soalForm.menjodohkanMinimalBenar < 1 ||
        soalForm.menjodohkanMinimalBenar > totalPasangan
      ) {
        showErrorNotification(
          'Data belum lengkap',
          `Minimal benar harus antara 1 dan ${totalPasangan} (jumlah pasangan).`
        );
        return false;
      }
    }
    return true;
  };

  const handleCreateSoal = async () => {
    if (!selectedBank) return;
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
    if (!editingSoal || !selectedBank) return;
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
              menjodohkanScoring:
                soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanScoring : 'semua_benar',
              menjodohkanMinimalBenar:
                soalForm.tipe === 'menjodohkan' ? soalForm.menjodohkanMinimalBenar : 1,
            }
          : s
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
    if (!selectedBank) return;
    if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
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

  const kategoriUTSUAS = useMemo(
    () => komponenNilai.filter((k) => ['uts', 'uas'].includes(k.nama.toLowerCase())),
    [komponenNilai]
  );

  return {
    isAdmin,
    activeTahunAjaran,
    tingkatList,
    mataPelajaran,
    tingkatLabel,
    getMapelName,
    selectedKelasAdmin,
    setSelectedKelasAdmin,
    selectedBank,
    setSelectedBank,
    bankSoal,
    soal,
    kelasCBTList,
    loadingAdminBanks,
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
    bankJudul,
    setBankJudul,
    selectedKategoriId,
    setSelectedKategoriId,
    selectedJenisSoal,
    setSelectedJenisSoal,
    soalForm,
    setSoalForm,
    addKelasTingkat,
    setAddKelasTingkat,
    addKelasMapelId,
    setAddKelasMapelId,
    kategoriUTSUAS,
    handleOpenAddKelasModal,
    handleCreateKelasAdmin,
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
    handleDeleteBankSoal,
    handleCreateSoal,
    handleUpdateSoal,
    handleDeleteSoal,
  };
}
