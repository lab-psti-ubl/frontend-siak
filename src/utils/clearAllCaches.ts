/**
 * Utility function to clear all application caches on logout
 * This ensures no user data persists after logout
 */

// Import all clear cache functions from hooks
import { clearAbsensiCache } from '../hooks/useAbsensi';
import { clearAllJadwalPelajaranCache } from '../hooks/useJadwalPelajaran';
import { clearNilaiCache } from '../hooks/useNilai';
import { refreshKokulikulerCache } from '../hooks/useKokulikuler';
import { refreshERaportCache } from '../hooks/useERaport';
// NOTE: Face recognition cache TIDAK di-clear saat logout
// karena data wajah guru bersifat global dan tidak user-specific.
// Cache hanya di-refresh otomatis saat TTL expired.

// Import all clear cache functions from hooks
import { clearMuridCache } from '../hooks/useMurid';
import { clearGurusCache } from '../hooks/useGurus';
import { clearAlumniCache } from '../hooks/useAlumni';
import { clearProfilSekolahCache } from '../hooks/useProfilSekolah';
import { clearKelasCache } from '../hooks/useKelas';
import { clearJurusanCache } from '../hooks/useJurusan';
import { clearReadNotificationsCache } from '../hooks/useReadNotifications';
import { clearAbsensiGuruCache } from '../hooks/useAbsensiGuru';
import { clearBackgroundKTACache } from '../hooks/useBackgroundKTA';
import { clearAlatRFIDCache } from '../hooks/useAlatRFID';
import { clearKomponenNilaiCache } from '../hooks/useKomponenNilai';
import { clearEkstrakulikulerCache } from '../hooks/useEkstrakulikuler';
import { clearDataKepsekCache } from '../hooks/useDataKepsek';
import { clearGradeCache } from '../hooks/useGrade';
import { clearCapaianPembelajaranKelasCache } from '../hooks/useCapaianPembelajaranKelas';
import { clearTahunAjaranCache } from '../hooks/useTahunAjaran';
import { clearMataPelajaranCache } from '../hooks/useMataPelajaran';
import { clearPengumumanKelulusanCache } from '../hooks/usePengumumanKelulusan';
import { clearIzinGuruCache } from '../hooks/useIzinGuru';
import { clearRiwayatWaliKelasCache } from '../hooks/useRiwayatWaliKelasData';
import { clearSesiAbsensiCache } from '../hooks/useSesiAbsensi';
import { clearInfoSekolahCache } from '../hooks/useInfoSekolah';
import { clearHasGivenKenaikanKelasInfoCache } from '../hooks/useHasGivenKenaikanKelasInfo';
import { clearNilaiEkstrakulikulerKelasCache } from '../hooks/useNilaiEkstrakulikulerKelas';
import { clearNilaiEkstrakulikulerCache } from '../hooks/useNilaiEkstrakulikuler';
import { clearSuratIzinCache } from '../hooks/useSuratIzin';
import { clearStatusKenaikanKelasCache } from '../hooks/useStatusKenaikanKelas';
import { clearStatusBagiRaportCache } from '../hooks/useStatusBagiRaport';
import { clearJenjangPendidikanCache } from '../hooks/useJenjangPendidikan';
import { clearPengaturanSKSCache } from '../hooks/usePengaturanSKS';
import { clearPengaturanIstirahatCache } from '../hooks/usePengaturanIstirahat';
import { clearRiwayatKelasMuridCache } from '../hooks/useRiwayatKelasMurid';
import { clearPengaturanNilaiMinimalCache } from '../hooks/usePengaturanNilaiMinimal';
import { clearPengaturanAbsenCache } from '../hooks/usePengaturanAbsen';
import { clearProfilSekolahPublicCache } from '../hooks/useProfilSekolahPublic';
import { clearCapaianPembelajaranCache } from '../hooks/useCapaianPembelajaran';
import { clearPengaturanCache } from '../hooks/usePengaturanSistem';

/**
 * Clears all application caches
 * Should be called on user logout to ensure no data persists
 */
export const clearAllCaches = () => {
  try {
    // NOTE: Face recognition cache TIDAK di-clear saat logout
    // karena data wajah guru bersifat global, tidak user-specific,
    // dan cache hanya di-refresh otomatis saat TTL expired.
    
    // Clear all hook caches
    clearAbsensiCache();
    clearAllJadwalPelajaranCache();
    clearNilaiCache();
    clearMuridCache();
    clearGurusCache();
    clearAlumniCache();
    clearProfilSekolahCache();
    clearKelasCache();
    clearJurusanCache();
    clearReadNotificationsCache();
    clearAbsensiGuruCache();
    clearBackgroundKTACache();
    clearAlatRFIDCache();
    clearKomponenNilaiCache();
    clearEkstrakulikulerCache();
    clearDataKepsekCache();
    clearGradeCache();
    clearCapaianPembelajaranKelasCache();
    clearTahunAjaranCache();
    clearMataPelajaranCache();
    clearPengumumanKelulusanCache();
    clearIzinGuruCache();
    clearRiwayatWaliKelasCache();
    clearSesiAbsensiCache();
    clearInfoSekolahCache();
    clearHasGivenKenaikanKelasInfoCache();
    clearNilaiEkstrakulikulerKelasCache();
    clearNilaiEkstrakulikulerCache();
    clearSuratIzinCache();
    clearStatusKenaikanKelasCache();
    clearStatusBagiRaportCache();
    clearJenjangPendidikanCache();
    clearPengaturanSKSCache();
    clearPengaturanIstirahatCache();
    clearRiwayatKelasMuridCache();
    clearPengaturanNilaiMinimalCache();
    clearPengaturanAbsenCache();
    clearProfilSekolahPublicCache();
    clearCapaianPembelajaranCache();
    clearPengaturanCache();
    
    // Clear caches that use refresh functions (async, but we call them without await for speed)
    refreshKokulikulerCache();
    refreshERaportCache();
    
    console.log('All caches cleared successfully');
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
};

