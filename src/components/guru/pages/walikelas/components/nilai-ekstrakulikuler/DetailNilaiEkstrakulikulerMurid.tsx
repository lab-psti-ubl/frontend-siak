import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import { useAuth } from '../../../../../../context/AuthContext';
import { useMurid } from '../../../../../../hooks/useMurid';
import { useKelas } from '../../../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../../../hooks/useTahunAjaran';
import { useEkstrakulikuler } from '../../../../../../hooks/useEkstrakulikuler';
import { useNilaiEkstrakulikuler } from '../../../../../../hooks/useNilaiEkstrakulikuler';
import { refreshNilaiEkstrakulikulerKelasCache } from '../../../../../../hooks/useNilaiEkstrakulikulerKelas';
import { apiService } from '../../../../../../services/apiService';
import { NilaiEkstrakulikuler } from '../../../../../../types';
import { showSuccessToast, showErrorToast } from '../../../../../../components/ui/ToastContainer';
import DetailNilaiEkstrakulikulerHeader from './DetailNilaiEkstrakulikulerHeader';
import NilaiEkstrakulikulerTable from './NilaiEkstrakulikulerTable';
import NilaiEkstrakulikulerCard from './NilaiEkstrakulikulerCard';
import TambahNilaiEkstrakulikulerModal from './TambahNilaiEkstrakulikulerModal';
import EditNilaiEkstrakulikulerModal from './EditNilaiEkstrakulikulerModal';
import DetailNilaiEkstrakulikulerModal from './DetailNilaiEkstrakulikulerModal';

const DetailNilaiEkstrakulikulerMurid: React.FC = () => {
  const { muridId } = useParams<{ muridId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { activeTahunAjaran } = useTahunAjaran();
  const { ekstrakulikuler } = useEkstrakulikuler({ isActive: true });

  // Always use active tahun ajaran and semester
  const tahunAjaranParam = activeTahunAjaran?.tahun || '';
  const semesterParam = activeTahunAjaran?.semester || 1;

  const { nilaiEkstrakulikuler, loading: loadingNilai, refreshNilaiEkstrakulikuler } = useNilaiEkstrakulikuler({
    muridId: muridId || '',
    semester: semesterParam,
    tahunAjaran: tahunAjaranParam,
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNilai, setSelectedNilai] = useState<NilaiEkstrakulikuler | null>(null);
  const [formData, setFormData] = useState({
    ekstrakulikulerId: '',
    nilai: '',
  });

  const muridData = murid.find(m => m.id === muridId);
  const muridKelas = muridData ? kelas.find(k => k.id === (muridData as any).kelasId) : null;

  useEffect(() => {
    if (!muridId || !(user as any)?.isWaliKelas) {
      navigate('/dashboard/nilai-ekstrakulikuler-kelas');
    }
  }, [muridId, user, navigate]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!muridId || !formData.ekstrakulikulerId || !formData.nilai || !muridKelas) {
      showErrorToast('Validasi Gagal', 'Semua field wajib diisi!');
      return;
    }

    const nilai = parseFloat(formData.nilai);
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      showErrorToast('Validasi Gagal', 'Nilai harus antara 0-100!');
      return;
    }

    try {
      const response = await apiService.addOrUpdateNilaiEkstrakulikulerMurid({
        kelasId: muridKelas.id,
        tahunAjaran: tahunAjaranParam,
        semester: semesterParam,
        muridId,
        ekstrakulikulerId: formData.ekstrakulikulerId,
        nilai,
      });

      if (response.success) {
        showSuccessToast('Berhasil', 'Nilai ekstrakulikuler berhasil ditambahkan!');
        setShowAddForm(false);
        setFormData({ ekstrakulikulerId: '', nilai: '' });
        await refreshNilaiEkstrakulikuler();
        await refreshNilaiEkstrakulikulerKelasCache();
      } else {
        showErrorToast('Gagal', response.message || 'Gagal menambahkan nilai ekstrakulikuler');
      }
    } catch (error: any) {
      showErrorToast('Gagal', error.message || 'Terjadi kesalahan saat menambahkan nilai ekstrakulikuler');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNilai || !formData.nilai || !muridKelas) {
      showErrorToast('Validasi Gagal', 'Semua field wajib diisi!');
      return;
    }

    const nilai = parseFloat(formData.nilai);
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      showErrorToast('Validasi Gagal', 'Nilai harus antara 0-100!');
      return;
    }

    try {
      const response = await apiService.addOrUpdateNilaiEkstrakulikulerMurid({
        kelasId: muridKelas.id,
        tahunAjaran: tahunAjaranParam,
        semester: semesterParam,
        muridId,
        ekstrakulikulerId: selectedNilai.ekstrakulikulerId,
        nilai,
      });

      if (response.success) {
        showSuccessToast('Berhasil', 'Nilai ekstrakulikuler berhasil diperbarui!');
        setShowEditForm(false);
        setSelectedNilai(null);
        setFormData({ ekstrakulikulerId: '', nilai: '' });
        await refreshNilaiEkstrakulikuler();
        await refreshNilaiEkstrakulikulerKelasCache();
      } else {
        showErrorToast('Gagal', response.message || 'Gagal memperbarui nilai ekstrakulikuler');
      }
    } catch (error: any) {
      showErrorToast('Gagal', error.message || 'Terjadi kesalahan saat memperbarui nilai ekstrakulikuler');
    }
  };

  const handleDelete = async (nilai: NilaiEkstrakulikuler) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus nilai ekstrakulikuler ${nilai.ekstrakulikuler?.nama}?`) || !muridKelas) {
      return;
    }

    try {
      const response = await apiService.deleteNilaiEkstrakulikulerMurid({
        kelasId: muridKelas.id,
        tahunAjaran: tahunAjaranParam,
        semester: semesterParam,
        muridId,
        ekstrakulikulerId: nilai.ekstrakulikulerId,
      });
      if (response.success) {
        showSuccessToast('Berhasil', 'Nilai ekstrakulikuler berhasil dihapus!');
        await refreshNilaiEkstrakulikuler();
        await refreshNilaiEkstrakulikulerKelasCache();
      } else {
        showErrorToast('Gagal', response.message || 'Gagal menghapus nilai ekstrakulikuler');
      }
    } catch (error: any) {
      showErrorToast('Gagal', error.message || 'Terjadi kesalahan saat menghapus nilai ekstrakulikuler');
    }
  };

  const handleEditClick = (nilai: NilaiEkstrakulikuler) => {
    setSelectedNilai(nilai);
    setFormData({
      ekstrakulikulerId: nilai.ekstrakulikulerId,
      nilai: nilai.nilai.toString(),
    });
    setShowEditForm(true);
  };

  const handleDetailClick = (nilai: NilaiEkstrakulikuler) => {
    setSelectedNilai(nilai);
    setShowDetailModal(true);
  };

  const getAvailableEkstrakulikuler = () => {
    const existingIds = nilaiEkstrakulikuler.map(n => n.ekstrakulikulerId);
    return ekstrakulikuler.filter(e => !existingIds.includes(e.id));
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setFormData({ ekstrakulikulerId: '', nilai: '' });
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedNilai(null);
    setFormData({ ekstrakulikulerId: '', nilai: '' });
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNilai(null);
  };

  if (!muridData) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-600">Data murid tidak ditemukan</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <DetailNilaiEkstrakulikulerHeader muridData={muridData} muridKelas={muridKelas} />

      {/* Tabel Nilai Ekstrakulikuler */}
      <Card className="border-0 shadow-lg">
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h4 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">Nilai Ekstrakulikuler</h4>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              disabled={getAvailableEkstrakulikuler().length === 0}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm sm:text-base">Tambah Kegiatan</span>
            </Button>
          </div>

          {loadingNilai ? (
            <div className="text-center py-8 text-slate-500">Memuat data...</div>
          ) : nilaiEkstrakulikuler.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Belum ada nilai ekstrakulikuler
            </div>
          ) : (
            <>
              <NilaiEkstrakulikulerTable
                nilaiEkstrakulikuler={nilaiEkstrakulikuler}
                onDetailClick={handleDetailClick}
                onEditClick={handleEditClick}
                onDelete={handleDelete}
              />
              <NilaiEkstrakulikulerCard
                nilaiEkstrakulikuler={nilaiEkstrakulikuler}
                onEditClick={handleEditClick}
                onDelete={handleDelete}
              />
            </>
          )}
        </div>
      </Card>

      {/* Modals */}
      <TambahNilaiEkstrakulikulerModal
        isOpen={showAddForm}
        onClose={handleCloseAddForm}
        onSubmit={handleAdd}
        formData={formData}
        setFormData={setFormData}
        availableEkstrakulikuler={getAvailableEkstrakulikuler()}
      />

      <EditNilaiEkstrakulikulerModal
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        onSubmit={handleEdit}
        selectedNilai={selectedNilai}
        formData={{ nilai: formData.nilai }}
        setFormData={(data) => setFormData({ ...formData, nilai: data.nilai })}
      />

      <DetailNilaiEkstrakulikulerModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        selectedNilai={selectedNilai}
      />
    </div>
  );
};

export default DetailNilaiEkstrakulikulerMurid;
