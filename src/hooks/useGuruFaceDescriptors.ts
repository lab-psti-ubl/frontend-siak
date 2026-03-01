import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { base64ToDescriptor } from '../utils/faceDetection';

export interface GuruFaceRecord {
  guruId: string;
  name: string;
  nip?: string;
  faceDescriptors: Float32Array[];
}

interface UseGuruFaceDescriptorsState {
  guruFaces: GuruFaceRecord[];
  isLoading: boolean;
  errorMessage: string;
}

// Simple in-memory cache so data face recognition tidak perlu di-fetch
// dan dikonversi berulang kali antar render / antar komponen.
// 
// PENTING: Cache TIDAK dihapus saat logout karena:
// - Data wajah guru bersifat global (tidak user-specific)
// - Mempercepat proses saat login kembali
// - Cache hanya di-refresh otomatis saat TTL expired
const CACHE_TTL_MS = 1800 * 60 * 1000; // 30 menit

let cachedGuruFaces: GuruFaceRecord[] | null = null;
let loadPromise: Promise<GuruFaceRecord[] | null> | null = null;
let cacheTimestamp: number | null = null;

/**
 * Clear cache guru face descriptors secara manual
 * 
 * NOTE: Fungsi ini TIDAK dipanggil saat logout.
 * Cache akan tetap tersimpan dan hanya di-refresh saat TTL expired.
 * 
 * Gunakan fungsi ini hanya untuk force-refresh data
 * (misalnya setelah menambah/edit data wajah guru baru).
 */
export const clearGuruFaceDescriptorsCache = (): void => {
  cachedGuruFaces = null;
  loadPromise = null;
  cacheTimestamp = null;
};

/**
 * Preload guru face descriptors ke cache
 * Dipanggil saat admin login untuk mempercepat proses face recognition
 * Returns: Promise<boolean> - true jika berhasil, false jika gagal
 */
export const preloadGuruFaceDescriptors = async (): Promise<boolean> => {
  const now = Date.now();
  const isCacheValid =
    cachedGuruFaces && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS;

  // Jika cache masih valid, skip preload
  if (isCacheValid) {
    console.log('[FaceCache] Guru face descriptors already cached, skipping preload');
    return true;
  }

  // Jika sudah ada loading promise yang sedang berjalan, tunggu
  if (loadPromise) {
    console.log('[FaceCache] Preload already in progress, waiting...');
    const result = await loadPromise;
    return result !== null;
  }

  console.log('[FaceCache] Preloading guru face descriptors...');

  loadPromise = (async () => {
    try {
      const res = await apiService.getAllGuruFaceDescriptors();
      if (res.success && res.data && res.data.length > 0) {
        const converted: GuruFaceRecord[] = res.data.map((item: any) => ({
          guruId: item.guruId,
          name: item.name,
          nip: item.nip,
          faceDescriptors: item.faceDescriptors.map((d: string) => base64ToDescriptor(d)),
        }));
        cachedGuruFaces = converted;
        cacheTimestamp = Date.now();
        console.log(`[FaceCache] Successfully cached ${converted.length} guru face records`);
        return converted;
      }

      cachedGuruFaces = [];
      cacheTimestamp = Date.now();
      console.log('[FaceCache] No guru face data found');
      return [];
    } catch (error) {
      console.error('[FaceCache] Error preloading guru face descriptors:', error);
      return null;
    }
  })();

  const result = await loadPromise;
  loadPromise = null; // Reset promise setelah selesai
  return result !== null;
};

/**
 * Get cached guru faces tanpa trigger fetch
 * Berguna untuk mengecek apakah cache sudah terisi
 */
export const getCachedGuruFaces = (): GuruFaceRecord[] | null => {
  const now = Date.now();
  const isCacheValid =
    cachedGuruFaces && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS;
  return isCacheValid ? cachedGuruFaces : null;
};

/**
 * Check if cache is valid
 */
export const isGuruFaceCacheValid = (): boolean => {
  const now = Date.now();
  return !!(cachedGuruFaces && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS);
};

export const useGuruFaceDescriptors = (): UseGuruFaceDescriptorsState => {
  // Gunakan data dari cache jika tersedia untuk initial state
  const [guruFaces, setGuruFaces] = useState<GuruFaceRecord[]>(() => {
    const cached = getCachedGuruFaces();
    return cached || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !isGuruFaceCacheValid());
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadGuruFaces = async () => {
      // Jika cache valid, gunakan langsung
      if (isGuruFaceCacheValid()) {
        if (!isMounted) return;
        setGuruFaces(cachedGuruFaces as GuruFaceRecord[]);
        setIsLoading(false);
        return;
      }

      // Gunakan preload function untuk konsistensi
      setIsLoading(true);
      const success = await preloadGuruFaceDescriptors();

      if (!isMounted) return;

      if (!success) {
        setErrorMessage('Gagal memuat data wajah guru untuk verifikasi.');
        setGuruFaces([]);
      } else if (cachedGuruFaces && cachedGuruFaces.length === 0) {
        setErrorMessage(
          'Belum ada data wajah guru yang terdaftar. Silakan daftarkan wajah guru di menu Data Face Recognition.'
        );
        setGuruFaces([]);
      } else {
        setGuruFaces(cachedGuruFaces || []);
        setErrorMessage('');
      }

      setIsLoading(false);
    };

    loadGuruFaces();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    guruFaces,
    isLoading,
    errorMessage,
  };
};

