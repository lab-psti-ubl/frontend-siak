import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';
import { useGurus } from '../../../../../hooks/useGurus';
import { useKelas } from '../../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useKomponenNilai } from '../../../../../hooks/useKomponenNilai';
import { useJurusan } from '../../../../../hooks/useJurusan';
import { apiService } from '../../../../../services/apiService';
import type { CBTSoalInputAssignment, PengaturanKomponenNilai } from '../../../../../types';
import {
  showErrorNotification,
  showSuccessNotification,
} from '../../../../../utils/notificationUtils';
import { shouldShowJurusanSync } from '../../../../../utils/jenjangPendidikanUtils';

export function useAdminPilihGuruCBT() {
  const { user } = useAuth();
  const { tahunAjaran } = useTahunAjaran();
  const { gurus } = useGurus();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { komponenNilai } = useKomponenNilai();
  const { jurusan } = useJurusan();

  const isAdmin = user?.role === 'admin';
  const activeTahunAjaran = tahunAjaran.find((ta) => ta.isActive);
  const jurusanRequired = shouldShowJurusanSync();

  const tingkatList = useMemo(() => {
    const s = new Set<number>();
    kelas.forEach((k) => {
      if (typeof k.tingkat === 'number') s.add(k.tingkat);
    });
    return Array.from(s).sort((a, b) => a - b);
  }, [kelas]);

  const kategoriUTSUAS = useMemo(() => {
    return komponenNilai.filter((k) => {
      const n = (k.nama || '').toLowerCase().trim();
      return n === 'uts' || n === 'uas';
    });
  }, [komponenNilai]);

  const [selectedGuruId, setSelectedGuruId] = useState('');
  const [selectedKategoriId, setSelectedKategoriId] = useState('');
  const [selectedTingkat, setSelectedTingkat] = useState<number | ''>('');
  const [selectedMapelId, setSelectedMapelId] = useState('');
  const [selectedJurusanId, setSelectedJurusanId] = useState('');

  const [assignments, setAssignments] = useState<CBTSoalInputAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const getGuruName = (id: string) =>
    gurus.find((g) => g.id === id)?.name || 'Guru';
  const getMapelName = (id: string) =>
    mataPelajaran.find((m) => m.id === id)?.name || 'Mata Pelajaran';
  const getJurusanName = (id?: string) =>
    !id ? 'Semua Jurusan' : jurusan.find((j) => j.id === id)?.nama || 'Jurusan';

  const refreshAssignments = async () => {
    if (!activeTahunAjaran) return;
    setLoading(true);
    try {
      const res = await apiService.getAllCBTSoalInputAssignments({
        tahunAjaran: activeTahunAjaran.tahun,
        semester: activeTahunAjaran.semester,
      });
      if (res.success && res.data) {
        setAssignments(res.data as CBTSoalInputAssignment[]);
      } else {
        setAssignments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || !activeTahunAjaran) return;
    refreshAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTahunAjaran?.tahun, activeTahunAjaran?.semester]);

  const handleCreate = async () => {
    if (!activeTahunAjaran) {
      showErrorNotification('Tidak ada tahun ajaran aktif', 'Aktifkan tahun ajaran terlebih dahulu.');
      return;
    }
    if (!selectedGuruId || !selectedKategoriId || !selectedMapelId || !selectedTingkat) {
      showErrorNotification('Data belum lengkap', 'Pilih guru, kategori UTS/UAS, mata pelajaran, dan tingkat kelas.');
      return;
    }

    const kategori = kategoriUTSUAS.find((k) => k.id === selectedKategoriId) as
      | PengaturanKomponenNilai
      | undefined;
    if (!kategori) {
      showErrorNotification('Kategori tidak valid', 'Kategori UTS/UAS tidak ditemukan.');
      return;
    }

    try {
      const res = await apiService.createCBTSoalInputAssignment({
        guruId: selectedGuruId,
        kategoriId: kategori.id,
        kategoriNama: kategori.nama,
        mataPelajaranId: selectedMapelId,
        tingkat: selectedTingkat,
        jurusanId: jurusanRequired ? selectedJurusanId : '',
      });
      if (!res.success) throw new Error(res.message || 'Gagal menyimpan penunjukan.');
      showSuccessNotification('Berhasil', 'Penunjukan guru penginput soal UTS/UAS berhasil disimpan.');
      await refreshAssignments();
    } catch (e: any) {
      showErrorNotification('Gagal', e.message || 'Terjadi kesalahan saat menyimpan penunjukan.');
    }
  };

  const handleDelete = async (assignment: CBTSoalInputAssignment) => {
    if (!window.confirm('Yakin ingin menghapus penunjukan ini?')) return;
    try {
      const res = await apiService.deleteCBTSoalInputAssignment(assignment.id);
      if (!res.success) throw new Error(res.message || 'Gagal menghapus penunjukan.');
      showSuccessNotification('Berhasil', 'Penunjukan berhasil dihapus.');
      await refreshAssignments();
    } catch (e: any) {
      showErrorNotification('Gagal', e.message || 'Terjadi kesalahan saat menghapus penunjukan.');
    }
  };

  return {
    isAdmin,
    activeTahunAjaran,
    gurus,
    mataPelajaran,
    tingkatList,
    kategoriUTSUAS,
    jurusanRequired,
    jurusan,
    selectedGuruId,
    setSelectedGuruId,
    selectedKategoriId,
    setSelectedKategoriId,
    selectedTingkat,
    setSelectedTingkat,
    selectedMapelId,
    setSelectedMapelId,
    selectedJurusanId,
    setSelectedJurusanId,
    assignments,
    loading,
    getGuruName,
    getMapelName,
    getJurusanName,
    handleCreate,
    handleDelete,
  };
}

