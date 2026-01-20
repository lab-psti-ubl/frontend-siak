import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import Card from '../../../ui/Card';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useSuratIzin } from '../../../../hooks/useSuratIzin';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../hooks/useSantri';
import { SuratIzin } from '../../../../types';
import { showSuccessNotification } from '../../../../utils/notificationUtils';
import { showSuccessConfirmation, showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { apiService } from '../../../../services/apiService';
import SuratIzinStatsCards from '../walikelas/components/surat-izin/SuratIzinStatsCards';
import SuratIzinTable from '../walikelas/components/surat-izin/SuratIzinTable';
import SuratIzinDetailModal from '../walikelas/components/surat-izin/SuratIzinDetailModal';
import SuratIzinEmptyState from '../walikelas/components/surat-izin/SuratIzinEmptyState';

const IzinSantriTahfiz: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { suratIzin: allSuratIzin, loading: loadingSuratIzin, refreshSuratIzin } = useSuratIzin();
  const { gurus, loading: loadingGurus } = useGurus();
  const { murid, loading: loadingMurid } = useMurid();
  const { kelasTahfiz, loading: loadingKelasTahfiz } = useKelasTahfiz();
  const { santri, loading: loadingSantri } = useSantri();
  const [selectedSurat, setSelectedSurat] = useState<SuratIzin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Get surat izin for santri in ustadz's tahfiz classes
  const suratIzinSantri = allSuratIzin.filter(s => {
    // Only show surat izin that have ustadzId matching current user
    if (!s.ustadzId || s.ustadzId !== user?.id) return false;
    return true;
  });

  // Combine gurus, murid, and santri into users array for compatibility
  const users = [...gurus, ...murid, ...santri];

  // Check if user is an ustadz
  const isUstadz = kelasTahfiz.some(k => k.ustadzId === user?.id);

  if (!isUstadz) {
    return (
      <Card className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('tahfiz.guruTahfiz.izinSantriTahfiz.aksesDitolak')}</h3>
        <p className="text-gray-600">{t('tahfiz.guruTahfiz.izinSantriTahfiz.aksesDitolakDesc')}</p>
      </Card>
    );
  }

  // Show loading state
  if (loadingSuratIzin || loadingGurus || loadingMurid || loadingKelasTahfiz || loadingSantri) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-600">{t('tahfiz.guruTahfiz.izinSantriTahfiz.memuatData')}</p>
      </Card>
    );
  }

  const handleVerify = async (suratId: string, status: 'diterima' | 'ditolak') => {
    const surat = suratIzinSantri.find(s => s.id === suratId);
    if (!surat) return;

    const santriName = getSantriName(surat.muridId);
    const actionText = status === 'diterima' ? 'menerima' : 'menolak';
    const statusText = status === 'diterima' ? 'diterima' : 'ditolak';

    const confirmationFunction = status === 'diterima' ? showSuccessConfirmation : showDangerConfirmation;

    confirmationFunction(
      `${status === 'diterima' ? 'Terima' : 'Tolak'} Surat ${surat.jenis.charAt(0).toUpperCase() + surat.jenis.slice(1)}`,
      `Apakah Anda yakin ingin ${actionText} surat ${surat.jenis} dari ${santriName}?\n\nPeriode: ${new Date(surat.tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(surat.tanggalSelesai).toLocaleDateString('id-ID')}\nAlasan: ${surat.alasan}${status === 'diterima' ? '\n\n✓ Absensi santri akan otomatis diperbarui untuk periode ini' : ''}`,
      async () => {
        setIsVerifying(true);
        try {
          // For santri who are not class members, we don't need kelasWali
          // But we still need to find the tahfiz class for attendance update
          const santriKelasTahfiz = kelasTahfiz.find(k => 
            k.ustadzId === user?.id && k.santriIds.includes(surat.muridId)
          );

          // Verify surat izin via API
          const response = await apiService.verifySuratIzin(suratId, {
            status,
            keterangan,
            verifiedBy: user.id,
            // For santri non-murid kelas, we don't pass kelasWali
            // The backend should handle this based on ustadzId
          });

          if (response.success) {
            // Refresh surat izin data
            await refreshSuratIzin();

            setSelectedSurat(null);
            setIsModalOpen(false);
            setKeterangan('');

            showSuccessNotification(
              `Surat ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
              `Surat ${surat.jenis} dari ${santriName} telah ${statusText}.`
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

  const getSantriName = (santriId: string) => {
    // First check in santri
    const santriData = santri.find(s => s.id === santriId);
    if (santriData) return santriData.name;
    
    // Then check in murid
    const muridData = murid.find(m => m.id === santriId);
    if (muridData) return muridData.name;
    
    // Finally check in users (gurus)
    const userData = users.find(u => u.id === santriId);
    return userData?.name || 'Unknown';
  };

  const getSantriNisn = (santriId: string) => {
    // First check in santri
    const santriData = santri.find(s => s.id === santriId);
    if (santriData) return santriData.nisn || '-';
    
    // Then check in murid
    const muridData = murid.find(m => m.id === santriId);
    if (muridData) return muridData.nisn || '-';
    
    return '-';
  };

  const pendingSurat = suratIzinSantri.filter(s => s.status === 'menunggu');
  const processedSurat = suratIzinSantri.filter(s => s.status !== 'menunggu');

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{t('tahfiz.guruTahfiz.izinSantriTahfiz.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('tahfiz.guruTahfiz.izinSantriTahfiz.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="px-3 py-2 bg-orange-100 text-orange-800 rounded-full text-center sm:text-left text-sm font-medium">
            {pendingSurat.length} {t('tahfiz.guruTahfiz.izinSantriTahfiz.menungguVerifikasi')}
          </div>
        </div>
      </div>

      <SuratIzinStatsCards pendingSurat={pendingSurat} processedSurat={processedSurat} />

      {pendingSurat.length > 0 && (
        <SuratIzinTable
          title="Surat Menunggu Verifikasi"
          suratList={pendingSurat}
          getMuridName={getSantriName}
          getMuridNisn={getSantriNisn}
          onDetailClick={openDetailModal}
          isPending={true}
        />
      )}

      {processedSurat.length > 0 ? (
        <SuratIzinTable
          title="Riwayat Verifikasi"
          suratList={processedSurat}
          getMuridName={getSantriName}
          getMuridNisn={getSantriNisn}
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
        getMuridName={getSantriName}
        users={users}
        kelas={[]} // No kelas for santri non-murid kelas
        currentUserName={user?.name || ''}
        keterangan={keterangan}
        setKeterangan={setKeterangan}
        onVerify={handleVerify}
        isVerifying={isVerifying}
      />
    </div>
  );
};

export default IzinSantriTahfiz;


