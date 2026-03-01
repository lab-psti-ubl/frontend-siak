/**
 * useFaceRecognitionCache
 * 
 * Hook untuk mengelola cache face recognition.
 * Cache diisi saat admin login untuk mempercepat proses verifikasi wajah.
 * 
 * PENTING: Cache face recognition TIDAK dihapus saat logout karena:
 * - Data wajah guru bersifat global (tidak user-specific)
 * - Mempercepat proses saat login kembali
 * - Cache hanya di-refresh otomatis saat TTL expired (30 menit)
 * 
 * Fitur:
 * - Pre-load face detection models (face-api.js)
 * - Pre-load guru face descriptors dari database
 * - Status cache readiness
 * - Auto-refresh saat TTL expired
 */

import { useState, useEffect, useCallback } from 'react';
import { loadFaceDetectionModels } from '../utils/faceDetection';
import {
  preloadGuruFaceDescriptors,
  clearGuruFaceDescriptorsCache,
  isGuruFaceCacheValid,
} from './useGuruFaceDescriptors';

export interface FaceRecognitionCacheStatus {
  modelsLoaded: boolean;
  descriptorsLoaded: boolean;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

// Global state untuk track status cache
let globalModelsLoaded = false;
let globalDescriptorsLoaded = false;
let globalIsLoading = false;
let globalError: string | null = null;
let warmupPromise: Promise<boolean> | null = null;

/**
 * Pre-warm semua cache face recognition
 * Dipanggil saat admin login untuk mempercepat proses verifikasi wajah
 * 
 * @returns Promise<boolean> - true jika semua cache berhasil di-load
 */
export const warmupFaceRecognitionCache = async (): Promise<boolean> => {
  // Jika sudah ready, skip
  if (globalModelsLoaded && isGuruFaceCacheValid()) {
    console.log('[FaceCache] Cache already warm, skipping warmup');
    globalDescriptorsLoaded = true;
    return true;
  }

  // Jika sedang loading, tunggu
  if (warmupPromise) {
    console.log('[FaceCache] Warmup already in progress, waiting...');
    return warmupPromise;
  }

  console.log('[FaceCache] Starting face recognition cache warmup...');
  globalIsLoading = true;
  globalError = null;

  warmupPromise = (async () => {
    try {
      // Load models dan descriptors secara parallel untuk performa maksimal
      const [modelsResult, descriptorsResult] = await Promise.all([
        loadFaceDetectionModels(),
        preloadGuruFaceDescriptors(),
      ]);

      globalModelsLoaded = modelsResult;
      globalDescriptorsLoaded = descriptorsResult;

      if (!modelsResult) {
        globalError = 'Gagal memuat model face detection';
        console.error('[FaceCache] Failed to load face detection models');
      }

      if (!descriptorsResult) {
        globalError = globalError 
          ? `${globalError}; Gagal memuat data wajah guru`
          : 'Gagal memuat data wajah guru';
        console.error('[FaceCache] Failed to preload guru face descriptors');
      }

      const success = modelsResult && descriptorsResult;
      
      if (success) {
        console.log('[FaceCache] Cache warmup completed successfully');
      } else {
        console.warn('[FaceCache] Cache warmup completed with errors');
      }

      return success;
    } catch (error: any) {
      console.error('[FaceCache] Error during cache warmup:', error);
      globalError = error.message || 'Error saat memuat cache face recognition';
      return false;
    } finally {
      globalIsLoading = false;
      warmupPromise = null;
    }
  })();

  return warmupPromise;
};

/**
 * Clear semua cache face recognition secara manual
 * 
 * NOTE: Fungsi ini TIDAK dipanggil saat logout.
 * Cache face recognition bersifat persistent karena data wajah guru
 * tidak user-specific dan untuk mempercepat proses saat login kembali.
 * 
 * Gunakan fungsi ini hanya jika perlu force-refresh data
 * (misalnya setelah menambah/edit data wajah guru baru).
 */
export const clearFaceRecognitionCache = (): void => {
  console.log('[FaceCache] Manually clearing face recognition cache...');
  clearGuruFaceDescriptorsCache();
  globalDescriptorsLoaded = false;
  globalError = null;
  warmupPromise = null;
  // Note: Models tidak perlu di-clear karena mereka singleton dan tidak mengandung user data
};

/**
 * Get current cache status
 */
export const getFaceRecognitionCacheStatus = (): FaceRecognitionCacheStatus => ({
  modelsLoaded: globalModelsLoaded,
  descriptorsLoaded: globalDescriptorsLoaded && isGuruFaceCacheValid(),
  isLoading: globalIsLoading,
  isReady: globalModelsLoaded && isGuruFaceCacheValid(),
  error: globalError,
});

/**
 * Check if cache is ready
 */
export const isFaceRecognitionCacheReady = (): boolean => {
  return globalModelsLoaded && isGuruFaceCacheValid();
};

/**
 * Hook untuk menggunakan face recognition cache di komponen React
 * 
 * @param autoWarmup - Jika true, akan otomatis warmup saat mount (default: false)
 * @returns Status cache dan fungsi untuk warmup/clear
 */
export const useFaceRecognitionCache = (autoWarmup: boolean = false) => {
  const [status, setStatus] = useState<FaceRecognitionCacheStatus>(() =>
    getFaceRecognitionCacheStatus()
  );

  // Update status secara periodik saat loading
  useEffect(() => {
    if (!status.isLoading) return;

    const interval = setInterval(() => {
      const newStatus = getFaceRecognitionCacheStatus();
      setStatus(newStatus);
      
      if (!newStatus.isLoading) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [status.isLoading]);

  // Auto warmup jika diminta
  useEffect(() => {
    if (autoWarmup && !status.isReady && !status.isLoading) {
      warmup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoWarmup]);

  const warmup = useCallback(async () => {
    setStatus((prev: FaceRecognitionCacheStatus) => ({ ...prev, isLoading: true, error: null }));
    
    const success = await warmupFaceRecognitionCache();
    
    setStatus(getFaceRecognitionCacheStatus());
    
    return success;
  }, []);

  const clear = useCallback(() => {
    clearFaceRecognitionCache();
    setStatus(getFaceRecognitionCacheStatus());
  }, []);

  const refresh = useCallback(async () => {
    // Clear dulu, lalu warmup ulang
    clearGuruFaceDescriptorsCache();
    globalDescriptorsLoaded = false;
    return warmup();
  }, [warmup]);

  return {
    ...status,
    warmup,
    clear,
    refresh,
  };
};

export default useFaceRecognitionCache;
