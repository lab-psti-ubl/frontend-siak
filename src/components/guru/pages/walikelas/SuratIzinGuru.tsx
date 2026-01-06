import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import Card from '../../../ui/Card';
import { useAuth } from '../../../../context/AuthContext';
import { useSuratIzin } from '../../../../hooks/useSuratIzin';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { SuratIzin } from '../../../../types';
import { showSuccessNotification } from '../../../../utils/notificationUtils';
import { showSuccessConfirmation, showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { apiService } from '../../../../services/apiService';
import SuratIzinStatsCards from './components/surat-izin/SuratIzinStatsCards';
import SuratIzinTable from './components/surat-izin/SuratIzinTable';
import SuratIzinDetailModal from './components/surat-izin/SuratIzinDetailModal';
import SuratIzinEmptyState from './components/surat-izin/SuratIzinEmptyState';

const SuratIzinGuru: React.FC = () => {
  const { user } = useAuth();
  const { suratIzin, loading: loadingSuratIzin, refreshSuratIzin } = useSuratIzin();
  const { gurus, loading: loadingGurus } = useGurus();
  const { murid, loading: loadingMurid } = useMurid();
  const { kelas, loading: loadingKelas } = useKelas();
  const { sesiAbsensi, loading: loadingSesiAbsensi } = useSesiAbsensi();
  const { jadwalPelajaran, loading: loadingJadwalPelajaran } = useJadwalPelajaran();
  const { activeTahunAjaran } = useTahunAjaran();
  const [selectedSurat, setSelectedSurat] = useState<SuratIzin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Combine gurus and murid into users array for compatibility
  const users = [...gurus, ...murid];

  if (!user?.isWaliKelas) {
    return (
      <Card className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Hanya wali kelas yang dapat mengakses halaman ini.</p>
      </Card>
    );
  }

  // Show loading state
  if (loadingSuratIzin || loadingGurus || loadingMurid || loadingKelas || loadingSesiAbsensi || loadingJadwalPelajaran) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-600">Memuat data...</p>
      </Card>
    );
  }

  // Get surat izin for students in wali kelas's class
  const muridKelas = murid.filter(m => m.kelasId === user.kelasWali);
  const suratIzinKelas = suratIzin.filter(s =>
    muridKelas.some(m => m.id === s.muridId)
  );

  const handleVerify = async (suratId: string, status: 'diterima' | 'ditolak') => {
    const surat = suratIzin.find(s => s.id === suratId);
    if (!surat) return;

    const muridName = getMuridName(surat.muridId);
    const actionText = status === 'diterima' ? 'menerima' : 'menolak';
    const statusText = status === 'diterima' ? 'diterima' : 'ditolak';

    const confirmationFunction = status === 'diterima' ? showSuccessConfirmation : showDangerConfirmation;

    confirmationFunction(
      `${status === 'diterima' ? 'Terima' : 'Tolak'} Surat ${surat.jenis.charAt(0).toUpperCase() + surat.jenis.slice(1)}`,
      `Apakah Anda yakin ingin ${actionText} surat ${surat.jenis} dari ${muridName}?\n\nPeriode: ${new Date(surat.tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(surat.tanggalSelesai).toLocaleDateString('id-ID')}\nAlasan: ${surat.alasan}${status === 'diterima' ? '\n\n✓ Absensi murid akan otomatis diperbarui untuk periode ini' : ''}`,
      async () => {
        setIsVerifying(true);
        try {
          // Verify surat izin via API (this will also update attendance records)
          const response = await apiService.verifySuratIzin(suratId, {
            status,
            keterangan,
            verifiedBy: user.id,
            kelasWali: user.kelasWali
          });

          if (response.success) {
            // Refresh surat izin data
            await refreshSuratIzin();

            setSelectedSurat(null);
            setIsModalOpen(false);
            setKeterangan('');

            showSuccessNotification(
              `Surat ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
              `Surat ${surat.jenis} dari ${muridName} telah ${statusText}.`
            );
          } else {
            throw new Error(response.message || 'Gagal memverifikasi surat izin');
          }
        } catch (error: any) {
          console.error('Error verifying surat izin:', error);
          showSuccessNotification(
            'Error',
            error.message || 'Terjadi kesalahan saat memverifikasi surat izin'
          );
        } finally {
          setIsVerifying(false);
        }
      },
      {
        confirmText: `Ya, ${status === 'diterima' ? 'Terima' : 'Tolak'} Surat`,
        cancelText: 'Batal',
        confirmVariant: status === 'diterima' ? 'success' : 'danger'
      }
    );
  };

  const openDetailModal = (surat: SuratIzin) => {
    setSelectedSurat(surat);
    setIsModalOpen(true);
    setKeterangan('');
  };

  const getMuridName = (muridId: string) => {
    return users.find(u => u.id === muridId)?.name || 'Unknown';
  };

  const getMuridNisn = (muridId: string) => {
    const muridData = murid.find(m => m.id === muridId);
    return muridData?.nisn || '-';
  };

  const pendingSurat = suratIzinKelas.filter(s => s.status === 'menunggu');
  const processedSurat = suratIzinKelas.filter(s => s.status !== 'menunggu');

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Verifikasi Surat Izin</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola surat izin dan sakit dari murid kelas Anda</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="px-3 py-2 bg-orange-100 text-orange-800 rounded-full text-center sm:text-left text-sm font-medium">
            {pendingSurat.length} menunggu verifikasi
          </div>
        </div>
      </div>

      <SuratIzinStatsCards pendingSurat={pendingSurat} processedSurat={processedSurat} />

      {pendingSurat.length > 0 && (
        <SuratIzinTable
          title="Surat Menunggu Verifikasi"
          suratList={pendingSurat}
          getMuridName={getMuridName}
          getMuridNisn={getMuridNisn}
          onDetailClick={openDetailModal}
          isPending={true}
        />
      )}

      {processedSurat.length > 0 ? (
        <SuratIzinTable
          title="Riwayat Verifikasi"
          suratList={processedSurat}
          getMuridName={getMuridName}
          getMuridNisn={getMuridNisn}
          onDetailClick={openDetailModal}
          isPending={false}
        />
      ) : (
        <SuratIzinEmptyState />
      )}

      <SuratIzinDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        surat={selectedSurat}
        getMuridName={getMuridName}
        users={users}
        kelas={kelas}
        currentUserName={user?.name || ''}
        keterangan={keterangan}
        setKeterangan={setKeterangan}
        onVerify={handleVerify}
        isVerifying={isVerifying}
      />
    </div>
  );
};

export default SuratIzinGuru;
