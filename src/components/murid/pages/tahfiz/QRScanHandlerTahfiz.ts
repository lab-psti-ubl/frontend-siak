import { SesiAbsensiTahfiz, AbsensiPelajaran, User, TahfizSchedule } from '../../../../types';
import { TahfizClass } from '../../../../hooks/useKelasTahfiz';
import { parseSubjectQRCodeData } from '../../../../utils/qrCodeGenerator';
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../../../../utils/notificationUtils';
import { apiService } from '../../../../services/apiService';
import { clearSesiAbsensiTahfizCache } from '../../../../hooks/useSesiAbsensiTahfiz';
import { getLocalTimeISOString } from '../../../../utils/absensiUtils';

interface QRScanHandlerTahfizParams {
  qrData: string;
  user: User | null;
  selectedSesi: SesiAbsensiTahfiz | null;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  jadwalTahfiz: TahfizSchedule[];
  kelasTahfiz: TahfizClass[];
  santriList?: User[];
  attendanceUserId?: string;
  refreshSesiAbsensiTahfiz: () => Promise<void>;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  lastProcessedScan: {data: string, time: number} | null;
  setLastProcessedScan: (scan: {data: string, time: number} | null) => void;
  SCAN_DEBOUNCE_TIME: number;
  addAbsensiToSesiTahfizAPI?: (sesiId: string, absensiData: Partial<AbsensiPelajaran>) => Promise<void>;
}

let isProcessingTahfiz = false;
let lastProcessedTimeTahfiz = 0;
let lastSuccessfulScanTahfiz: {data: string, time: number} | null = null;
const processedScansTahfiz = new Set<string>();
const processedScanTimeoutsTahfiz = new Map<string, NodeJS.Timeout>();
const PROCESSED_SCAN_CLEANUP_TIME = 5 * 60 * 1000;

export const resetQRScanStateTahfiz = () => {
  isProcessingTahfiz = false;
  lastProcessedTimeTahfiz = 0;
  lastSuccessfulScanTahfiz = null;
};

export const handleQRScanResultTahfiz = async ({
  qrData,
  user,
  selectedSesi,
  sesiAbsensiTahfiz,
  jadwalTahfiz,
  kelasTahfiz,
  santriList,
  attendanceUserId,
  refreshSesiAbsensiTahfiz,
  setRefreshKey,
  lastProcessedScan,
  setLastProcessedScan,
  SCAN_DEBOUNCE_TIME,
  addAbsensiToSesiTahfizAPI
}: QRScanHandlerTahfizParams): Promise<boolean> => {
  const currentTime = Date.now();
  const resolvedUserId = attendanceUserId || user?.id;
  const santriRecord = resolvedUserId && santriList
    ? santriList.find(s => s.id === resolvedUserId || (s as any).muridId === resolvedUserId)
    : undefined;
  const possibleSantriIds: string[] = [];
  if (resolvedUserId) possibleSantriIds.push(resolvedUserId);
  if (santriRecord?.id && !possibleSantriIds.includes(santriRecord.id)) {
    possibleSantriIds.push(santriRecord.id);
  }
  const muridIdFromSantri = (santriRecord as any)?.muridId as string | undefined;
  if (muridIdFromSantri && !possibleSantriIds.includes(muridIdFromSantri)) {
    possibleSantriIds.push(muridIdFromSantri);
  }

  // Check if scan already processed
  if (processedScansTahfiz.has(qrData)) {
    return false;
  }

  if (isProcessingTahfiz) {
    return false;
  }

  if ((currentTime - lastProcessedTimeTahfiz) < SCAN_DEBOUNCE_TIME) {
    return false;
  }

  if (lastProcessedScan &&
      lastProcessedScan.data === qrData &&
      (currentTime - lastProcessedScan.time) < SCAN_DEBOUNCE_TIME) {
    return false;
  }

  if (lastSuccessfulScanTahfiz &&
      lastSuccessfulScanTahfiz.data === qrData &&
      (currentTime - lastSuccessfulScanTahfiz.time) < (SCAN_DEBOUNCE_TIME * 10)) {
    return false;
  }

  isProcessingTahfiz = true;
  lastProcessedTimeTahfiz = currentTime;
  setLastProcessedScan({ data: qrData, time: currentTime });

  if (!processedScansTahfiz.has(qrData)) {
    processedScansTahfiz.add(qrData);
    const cleanupTimeout = setTimeout(() => {
      processedScansTahfiz.delete(qrData);
      processedScanTimeoutsTahfiz.delete(qrData);
    }, PROCESSED_SCAN_CLEANUP_TIME);
    processedScanTimeoutsTahfiz.set(qrData, cleanupTimeout);
  }

  if (!user) {
    isProcessingTahfiz = false;
    const timeout = processedScanTimeoutsTahfiz.get(qrData);
    if (timeout) {
      clearTimeout(timeout);
      processedScanTimeoutsTahfiz.delete(qrData);
    }
    processedScansTahfiz.delete(qrData);
    showErrorNotification('Error', 'User tidak valid!');
    return false;
  }

  const subjectParsed = parseSubjectQRCodeData(qrData);

  if (subjectParsed.isValid) {
    clearSesiAbsensiTahfizCache();

    let sesi: SesiAbsensiTahfiz | null = null;
    if (!subjectParsed.sesiId) {
      isProcessingTahfiz = false;
      showErrorNotification('QR Code Tidak Valid', 'Sesi ID tidak ditemukan dalam QR Code!');
      return false;
    }
    
    try {
      const sesiResponse = await apiService.getSesiAbsensiTahfizById(subjectParsed.sesiId);
      if (sesiResponse.success && sesiResponse.sesiAbsensiTahfiz) {
        sesi = sesiResponse.sesiAbsensiTahfiz;
      }
    } catch (error) {
      console.error('Error fetching sesi tahfiz:', error);
      sesi = sesiAbsensiTahfiz.find(s => s.id === subjectParsed.sesiId) || null;
    }

    if (!sesi) {
      isProcessingTahfiz = false;
      showErrorNotification('Sesi Tidak Ditemukan', 'Sesi absensi tahfiz tidak ditemukan!');
      return false;
    }

    if (sesi.status !== 'dibuka') {
      isProcessingTahfiz = false;
      showErrorNotification('Sesi Ditutup', 'Sesi absensi tahfiz sudah ditutup!');
      return false;
    }

    const jadwal = jadwalTahfiz.find(j => j.id === sesi.jadwalId);
    if (!jadwal) {
      isProcessingTahfiz = false;
      showErrorNotification('Jadwal Tidak Ditemukan', 'Jadwal tahfiz tidak ditemukan!');
      return false;
    }

    const kelas = kelasTahfiz.find(k => k.id === jadwal.kelasId);
    const isMemberOfClass = kelas
      ? possibleSantriIds.some(id => kelas.santriIds.includes(id))
      : false;

    if (!kelas || !isMemberOfClass) {
      isProcessingTahfiz = false;
      showErrorNotification('Kelas Tidak Sesuai', 'Anda bukan santri dari kelas ini!');
      return false;
    }

    try {
      const attendanceId = santriRecord?.id || resolvedUserId || user.id;
      if (!attendanceId) {
        isProcessingTahfiz = false;
        showErrorNotification('Error', 'User ID tidak valid!');
        return false;
      }

      const existingAbsensiPelajaran = sesi.dataAbsensi?.find(a => a.muridId === attendanceId);

      if (existingAbsensiPelajaran) {
        isProcessingTahfiz = false;
        showWarningNotification('Sudah Absen', 'Anda sudah melakukan absensi untuk tahfiz ini!');
        return false;
      }

      if (!sesi.id) {
        isProcessingTahfiz = false;
        showErrorNotification('Error', 'Sesi ID tidak valid!');
        return false;
      }

      const absensiPelajaranData: Partial<AbsensiPelajaran> = {
        id: `absensi-tahfiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: attendanceId,
        status: 'hadir',
        waktu: getLocalTimeISOString(),
        keterangan: 'Absen via QR Code',
        method: 'qr',
        statusAbsen: 'tepat_waktu',
        keteranganAbsensi: 'Hadir',
      };

      // Use worker-enabled function from hook if available, otherwise fallback to API service
      if (addAbsensiToSesiTahfizAPI) {
        // Use hook function which includes worker support and data verification
        await addAbsensiToSesiTahfizAPI(sesi.id, absensiPelajaranData);
        // refreshSesiAbsensiTahfiz is already called inside addAbsensiToSesiTahfizAPI
      } else {
        // Fallback: Use worker-first strategy with fallback
        const response = await apiService.submitAbsensiTahfizWithFallback(sesi.id, absensiPelajaranData);

        if (!response.success) {
          throw new Error(response.message || 'Gagal menyimpan absensi tahfiz');
        }

        // Wait a bit for worker to process, then refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clearSesiAbsensiTahfizCache();
        await refreshSesiAbsensiTahfiz();
      }

      showSuccessNotification('Absensi Berhasil!', `Tahfiz Qur'an - ${new Date().toLocaleTimeString('id-ID')}`);

      lastSuccessfulScanTahfiz = { data: qrData, time: currentTime };
      setRefreshKey(prev => prev + 1);
      isProcessingTahfiz = false;

      return true;
    } catch (error) {
      console.error('Error creating absensi tahfiz:', error);
      isProcessingTahfiz = false;
      showErrorNotification('Error', 'Gagal menyimpan absensi tahfiz');
      return false;
    }
  } else {
    isProcessingTahfiz = false;
    showErrorNotification('QR Code Tidak Valid', 'QR Code tidak valid atau tidak dikenali!');
    return false;
  }
};

