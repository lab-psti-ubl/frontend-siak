import { Absensi, SesiAbsensi, JadwalPelajaran, MataPelajaran, User, TahunAjaran } from '../../../../types';
import { parseQRCodeData, parseSubjectQRCodeData } from '../../../../utils/qrCodeGenerator';
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../../../../utils/notificationUtils';
import { apiService } from '../../../../services/apiService';
import { clearSesiAbsensiCache } from '../../../../hooks/useSesiAbsensi';
import { getLocalTimeISOString } from '../../../../utils/absensiUtils';

interface QRScanHandlerParams {
  qrData: string;
  user: User | null;
  selectedSesi: SesiAbsensi | null;
  sesiAbsensi: SesiAbsensi[];
  jadwalPelajaran: JadwalPelajaran[];
  mataPelajaran: MataPelajaran[];
  tahunAjaran: TahunAjaran[];
  refreshAbsensi: () => Promise<void>;
  createAbsensiAPI: (absensi: Partial<Absensi>) => Promise<Absensi>;
  refreshSesiAbsensi: () => Promise<void>;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  lastProcessedScan: {data: string, time: number} | null;
  setLastProcessedScan: (scan: {data: string, time: number} | null) => void;
  SCAN_DEBOUNCE_TIME: number;
}

let isProcessing = false;
let lastProcessedTime = 0;
let lastSuccessfulScan: {data: string, time: number} | null = null;
// Set untuk tracking semua scan yang sudah berhasil diproses (untuk mencegah pemrosesan ulang)
const processedScans = new Set<string>();
// Map untuk menyimpan timeout cleanup per scan
const processedScanTimeouts = new Map<string, NodeJS.Timeout>();
// Waktu untuk membersihkan processedScans (5 menit)
const PROCESSED_SCAN_CLEANUP_TIME = 5 * 60 * 1000;

// Fungsi untuk reset state ketika modal QR scanner ditutup
// CATATAN: processedScans TIDAK di-clear untuk mencegah scan yang sama diproses ulang
// processedScans akan otomatis di-cleanup setelah PROCESSED_SCAN_CLEANUP_TIME
export const resetQRScanState = () => {
  isProcessing = false;
  lastProcessedTime = 0;
  lastSuccessfulScan = null;
  // JANGAN clear processedScans di sini - biarkan tetap untuk mencegah pemrosesan ulang
  // processedScans akan otomatis di-cleanup oleh setTimeout yang sudah di-set
  // Timeout references juga tidak perlu di-clear karena akan otomatis di-cleanup
};

export const handleQRScanResult = async ({
  qrData,
  user,
  selectedSesi,
  sesiAbsensi,
  jadwalPelajaran,
  mataPelajaran,
  tahunAjaran,
  refreshAbsensi,
  createAbsensiAPI,
  refreshSesiAbsensi,
  setRefreshKey,
  lastProcessedScan,
  setLastProcessedScan,
  SCAN_DEBOUNCE_TIME
}: QRScanHandlerParams): Promise<boolean> => {
  const currentTime = Date.now();

  // PRIORITAS 1: Check jika scan ini sudah pernah diproses dengan sukses (paling efektif)
  if (processedScans.has(qrData)) {
    // Scan ini sudah pernah diproses dengan sukses, abaikan sepenuhnya
    return false;
  }

  // PRIORITAS 2: Enhanced duplicate detection: check both lastProcessedScan and global processing state
  if (isProcessing) {
    // Silently ignore if already processing
    return false;
  }

  // PRIORITAS 3: Check global time-based debounce (prevents rapid successive scans)
  if ((currentTime - lastProcessedTime) < SCAN_DEBOUNCE_TIME) {
    return false;
  }

  // PRIORITAS 4: Check last processed scan data (from component state)
  if (lastProcessedScan &&
      lastProcessedScan.data === qrData &&
      (currentTime - lastProcessedScan.time) < SCAN_DEBOUNCE_TIME) {
    // Silently ignore duplicate scans
    return false;
  }

  // PRIORITAS 5: Check last successful scan (global state) - mencegah scan yang sama diproses berulang kali
  // Setelah scan berhasil, scan dengan data yang sama akan diabaikan untuk waktu yang lebih lama
  if (lastSuccessfulScan &&
      lastSuccessfulScan.data === qrData &&
      (currentTime - lastSuccessfulScan.time) < (SCAN_DEBOUNCE_TIME * 10)) { // 10x lebih lama untuk scan yang sudah berhasil
    // Silently ignore - scan ini sudah berhasil diproses sebelumnya
    return false;
  }

  // Mark as processing and update timestamps
  isProcessing = true;
  lastProcessedTime = currentTime;
  setLastProcessedScan({ data: qrData, time: currentTime });
  
  // TAMBAHKAN ke processedScans SEGERA untuk mencegah pemrosesan ulang
  // Ini akan mencegah race condition jika scanner masih membaca QR code yang sama
  // Hanya tambahkan jika belum ada (untuk menghindari duplikasi timeout)
  if (!processedScans.has(qrData)) {
    processedScans.add(qrData);
    // Set timeout untuk cleanup
    const cleanupTimeout = setTimeout(() => {
      processedScans.delete(qrData);
      processedScanTimeouts.delete(qrData);
    }, PROCESSED_SCAN_CLEANUP_TIME);
    processedScanTimeouts.set(qrData, cleanupTimeout);
  }

  if (!user) {
    isProcessing = false;
    // Hapus dari processedScans jika validasi gagal (boleh scan ulang)
    const timeout = processedScanTimeouts.get(qrData);
    if (timeout) {
      clearTimeout(timeout);
      processedScanTimeouts.delete(qrData);
    }
    processedScans.delete(qrData);
    showErrorNotification('Error', 'User tidak valid!');
    return false;
  }

  const subjectParsed = parseSubjectQRCodeData(qrData);

  if (subjectParsed.isValid) {
    // LANGKAH 1: Clear cache terlebih dahulu untuk memastikan tidak menggunakan data lama
    clearSesiAbsensiCache();
    
    // LANGKAH 2: Fetch fresh sesi data langsung dari API untuk mendapatkan data terbaru
    let sesi: SesiAbsensi | null = null;
    try {
      const sesiResponse = await apiService.getSesiAbsensiById(subjectParsed.sesiId);
      if (sesiResponse.success && sesiResponse.sesiAbsensi) {
        sesi = sesiResponse.sesiAbsensi;
      }
    } catch (error) {
      console.error('Error fetching sesi:', error);
      // Fallback ke data dari parameter jika API call gagal
      sesi = sesiAbsensi.find(s => s.id === subjectParsed.sesiId) || null;
    }

    if (!sesi) {
      isProcessing = false;
      showErrorNotification('Sesi Tidak Ditemukan', 'Sesi absensi tidak ditemukan!');
      return false;
    }

    if (sesi.status !== 'dibuka') {
      isProcessing = false;
      showErrorNotification('Sesi Ditutup', 'Sesi absensi sudah ditutup!');
      return false;
    }

    const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);
    if (jadwal) {
      const activeTahunAjaran = tahunAjaran.find(
        ta => ta.tahun === jadwal.tahunAjaran && ta.semester === jadwal.semester && ta.isActive
      );

      if (activeTahunAjaran) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(activeTahunAjaran.tanggalMulai);
        const endDate = new Date(activeTahunAjaran.tanggalSelesai);

        if (today < startDate || today > endDate) {
          isProcessing = false;
          showErrorNotification('Di Luar Periode Akademik', 'Absensi tidak dapat dilakukan karena berada di luar periode akademik yang telah ditentukan.');
          return false;
        }
      }
    }

    if (user.kelasId !== subjectParsed.kelasId) {
      isProcessing = false;
      showErrorNotification('Kelas Tidak Sesuai', 'Anda bukan murid dari kelas ini!');
      return false;
    }

    // LANGKAH 3: Check duplikat menggunakan data fresh yang baru di-fetch
    try {
      // Check if absensi already exists in sesi.dataAbsensi dengan data fresh dari API
      const existingAbsensiPelajaran = sesi.dataAbsensi?.find(a => a.muridId === user.id);

      if (existingAbsensiPelajaran) {
        isProcessing = false;
        showWarningNotification('Sudah Absen', 'Anda sudah melakukan absensi untuk mata pelajaran ini!');
        return false;
      }

      // Get active tahun ajaran
      const activeTA = tahunAjaran.find(ta => ta.isActive);
      if (!activeTA) {
        isProcessing = false;
        showErrorNotification('Error', 'Tidak ada tahun ajaran aktif');
        return false;
      }

      // LANGKAH 4: Simpan absensi mata pelajaran ke SesiAbsensi.dataAbsensi
      const absensiPelajaranData = {
        id: `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: user.id,
        status: 'hadir',
        waktu: getLocalTimeISOString(),
        keterangan: 'Absen via QR Code',
        method: 'qr',
        statusAbsen: 'tepat_waktu',
        keteranganAbsensi: 'Hadir',
      };

      // Simpan ke SesiAbsensi.dataAbsensi
      const response = await apiService.addAbsensiToSesi(sesi.id, absensiPelajaranData);
      
      if (!response.success) {
        throw new Error(response.message || 'Gagal menyimpan absensi');
      }

      // LANGKAH 5: Setelah penyimpanan berhasil, clear cache dan refresh data
      clearSesiAbsensiCache();
      
      // Refresh sesi absensi untuk mendapatkan data terbaru setelah penyimpanan
      await refreshSesiAbsensi();
      // Juga refresh absensi untuk memastikan UI terupdate
      await refreshAbsensi();

      const mapel = mataPelajaran.find(m => m.id === jadwal?.mataPelajaranId);

      showSuccessNotification('Absensi Berhasil!', `${mapel?.name || 'Mata Pelajaran'} - ${new Date().toLocaleTimeString('id-ID')}`);

      // Tandai scan ini sebagai berhasil untuk mencegah pemrosesan ulang
      // processedScans sudah ditambahkan di awal, jadi tidak perlu ditambahkan lagi
      // Timeout cleanup sudah di-set di awal, tidak perlu di-set lagi
      lastSuccessfulScan = { data: qrData, time: currentTime };
      
      setRefreshKey(prev => prev + 1);
      isProcessing = false;

      return true;
    } catch (error) {
      console.error('Error creating absensi pelajaran:', error);
      isProcessing = false;
      showErrorNotification('Error', 'Gagal menyimpan absensi');
      return false;
    }
  } else {
    const parsed = parseQRCodeData(qrData);

    if (!parsed.isValid) {
      isProcessing = false;
      showErrorNotification('QR Code Tidak Valid', 'QR Code tidak valid atau tidak dikenali!');
      return false;
    }

    if (!selectedSesi) {
      isProcessing = false;
      showErrorNotification('Error', 'Sesi tidak ditemukan!');
      return false;
    }

    const isSelf = parsed.muridId
      ? parsed.muridId === user.id
      : parsed.nisn && user.nisn && parsed.nisn === user.nisn;

    if (!isSelf) {
      isProcessing = false;
      showErrorNotification('QR Code Tidak Sesuai', 'QR Code tidak sesuai dengan data Anda!');
      return false;
    }

    // Check if absensi already exists
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingAbsensiResponse = await apiService.getAllAbsensi({
        muridId: user.id,
        tanggal: today,
      });
      
      const existingAbsensi = existingAbsensiResponse.absensi?.find((a: Absensi) =>
        a.sesiId === selectedSesi.id && a.muridId === user.id
      );

      if (existingAbsensi) {
        isProcessing = false;
        showWarningNotification('Sudah Absen', 'Anda sudah melakukan absensi untuk sesi ini!');
        return false;
      }

      // Get active tahun ajaran
      const activeTA = tahunAjaran.find(ta => ta.isActive);
      if (!activeTA) {
        isProcessing = false;
        showErrorNotification('Error', 'Tidak ada tahun ajaran aktif');
        return false;
      }

      // Get jadwal to find kelasId
      const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId);
      const kelasId = jadwal?.kelasId || user.kelasId;
      const tanggal = today;

      const newAbsensi: Partial<Absensi> = {
        sesiId: selectedSesi.id,
        muridId: user.id,
        tanggal: tanggal,
        kelasId: kelasId,
        tipeAbsen: 'masuk', // Default untuk absensi per sesi
        status: 'hadir',
        waktu: new Date().toISOString(),
        method: 'qr',
        tahunAjaranId: activeTA.id,
        semester: activeTA.semester,
      };

      await createAbsensiAPI(newAbsensi);
      await refreshAbsensi();

      showSuccessNotification('Absensi Berhasil!', 'Kehadiran Anda telah tercatat');

      // Tandai scan ini sebagai berhasil untuk mencegah pemrosesan ulang
      // processedScans sudah ditambahkan di awal, jadi tidak perlu ditambahkan lagi
      // Timeout cleanup sudah di-set di awal, tidak perlu di-set lagi
      lastSuccessfulScan = { data: qrData, time: currentTime };

      setRefreshKey(prev => prev + 1);
      isProcessing = false;

      return true;
    } catch (error) {
      console.error('Error creating absensi:', error);
      isProcessing = false;
      showErrorNotification('Error', 'Gagal menyimpan absensi');
      return false;
    }
  }
};
