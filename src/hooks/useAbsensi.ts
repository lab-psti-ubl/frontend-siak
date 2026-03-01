import { useState, useEffect, useCallback } from 'react';
import * as React from 'react';
import { apiService } from '../services/apiService';
import { Absensi } from '../types';

// Global cache untuk semua instance hook
let globalAbsensiCache: Absensi[] | null = null;
let globalAbsensiCacheTime: number = 0;
let globalAbsensiLoadingPromise: Promise<Absensi[]> | null = null;
let cacheInvalidationCounter = 0; // Counter to force re-fetch when cache is cleared

const CACHE_DURATION = 2000000; // ~33 menit (2000000 ms) - shorter cache for attendance data

interface AbsensiParams {
  muridId?: string;
  kelasId?: string;
  tanggal?: string;
  bulan?: number;
  tahun?: number;
  tahunAjaranId?: string;
  semester?: number;
}

export type AbsensiRefreshOptions = {
  waitForWorker?: {
    muridId?: string;
    tanggal?: string;
  };
  maxAttempts?: number;
  delayMs?: number;
};

type RefreshOptions = AbsensiRefreshOptions;

export const useAbsensi = (params?: AbsensiParams) => {
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncingWithWorker, setIsSyncingWithWorker] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Store current params for refresh function
  const currentParamsRef = React.useRef(params);
  
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const waitForWorkerPersistence = async (opts: RefreshOptions['waitForWorker'], attempts = 8, delayMs = 1200) => {
    if (!opts?.muridId || !opts?.tanggal) return;

    for (let i = 0; i < attempts; i++) {
      try {
        const response = await apiService.getAbsensiByMuridIdAndTanggal(opts.muridId, opts.tanggal);
        if (response.success && response.absensi && response.absensi.length > 0) {
          return response.absensi;
        }
      } catch (err) {
        console.warn('Waiting for worker persistence failed, retrying...', err);
      }
      await sleep(delayMs);
    }
  };

  useEffect(() => {
    currentParamsRef.current = params;
    
    const fetchData = async () => {
      // Check cache validity (only for getAll, not for filtered queries)
      const hasFilters = params?.muridId || params?.kelasId || params?.tanggal || params?.bulan || params?.tahun;
      const cacheValid = globalAbsensiCache && 
                        !hasFilters &&
                        (Date.now() - globalAbsensiCacheTime) < CACHE_DURATION;

      if (cacheValid) {
        // Use cached data only for getAll
        setAbsensi(globalAbsensiCache);
        setLoading(false);
        return;
      }

      // If there's already a request in progress, wait for it (only for getAll)
      if (globalAbsensiLoadingPromise && !hasFilters) {
        globalAbsensiLoadingPromise
          .then(data => {
            setAbsensi(data);
            setLoading(false);
          })
          .catch(err => {
            setError(err.message || 'Terjadi kesalahan saat mengambil data absensi');
            setLoading(false);
          });
        return;
      }

      // Make new request
      setLoading(true);
      setError(null);
      
      try {
        let response;
        if (params?.muridId) {
          // Fetch by muridId (with optional bulan/tahun filter)
          response = await apiService.getAbsensiByMuridId(params.muridId, params.bulan, params.tahun);
        } else {
          // Fetch all (with optional filters)
          if (!globalAbsensiLoadingPromise && !hasFilters) {
            globalAbsensiLoadingPromise = (async () => {
              const resp = await apiService.getAllAbsensi(params);
              if (resp.success && resp.absensi) {
                globalAbsensiCache = resp.absensi;
                globalAbsensiCacheTime = Date.now();
                return resp.absensi;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data absensi');
              }
            })();
          }
          
          if (globalAbsensiLoadingPromise && !hasFilters) {
            const data = await globalAbsensiLoadingPromise;
            globalAbsensiLoadingPromise = null;
            setAbsensi(data);
            setLoading(false);
            return;
          } else {
            response = await apiService.getAllAbsensi(params);
          }
        }

        if (response.success && response.absensi) {
          const absensiData = response.absensi;
          setAbsensi(absensiData);
          
          // Update cache only for getAll (no filters)
          if (!hasFilters) {
            globalAbsensiCache = absensiData;
            globalAbsensiCacheTime = Date.now();
          }
          
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data absensi');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data absensi');
        console.error('Error fetching absensi:', err);
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params?.muridId, 
    params?.kelasId, 
    params?.tanggal, 
    params?.bulan, 
    params?.tahun, 
    params?.tahunAjaranId, 
    params?.semester
  ]);

  const refreshAbsensi = useCallback(async (options?: RefreshOptions) => {
    const shouldWaitForWorker = !!options?.waitForWorker?.muridId && !!options?.waitForWorker?.tanggal;
    if (shouldWaitForWorker) {
      setIsSyncingWithWorker(true);
      setSyncMessage('Menunggu worker menyimpan data absensi...');
      await waitForWorkerPersistence(
        options?.waitForWorker,
        options?.maxAttempts,
        options?.delayMs,
      );
      setSyncMessage('Memuat ulang data absensi...');
    }

    // Clear cache and force refresh
    globalAbsensiCache = null;
    globalAbsensiCacheTime = 0;
    globalAbsensiLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    const params = currentParamsRef.current;
    
    try {
      let response;
      if (params?.muridId) {
        response = await apiService.getAbsensiByMuridId(params.muridId, params.bulan, params.tahun);
      } else {
        response = await apiService.getAllAbsensi(params);
      }
      
      if (response.success && response.absensi) {
        const hasFilters = params?.muridId || params?.kelasId || params?.tanggal || params?.bulan || params?.tahun;
        if (!hasFilters) {
          globalAbsensiCache = response.absensi;
          globalAbsensiCacheTime = Date.now();
        }
        setAbsensi(response.absensi);
      } else {
        setError(response.message || 'Gagal mengambil data absensi');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data absensi');
      console.error('Error fetching absensi:', err);
    } finally {
      setLoading(false);
      if (shouldWaitForWorker) {
        setIsSyncingWithWorker(false);
        setSyncMessage(null);
      }
    }
  }, []);

  // Listen for cache invalidation events (after refreshAbsensi is defined)
  useEffect(() => {
    const handleCacheInvalidation = () => {
      // Force refresh when cache is cleared
      refreshAbsensi();
    };
    
    window.addEventListener('absensi-cache-cleared', handleCacheInvalidation);
    return () => {
      window.removeEventListener('absensi-cache-cleared', handleCacheInvalidation);
    };
  }, [refreshAbsensi]);

  const createAbsensi = async (absensiData: Partial<Absensi>) => {
    try {
      const response = await apiService.submitAbsensiMuridWithFallback(absensiData as any);
      // Worker path returns 202 without absensi payload; we treat it as success and refresh later.
      if (response.success) {
        // Invalidate cache
        globalAbsensiCache = null;
        globalAbsensiCacheTime = 0;
        globalAbsensiLoadingPromise = null;
        await refreshAbsensi({
          waitForWorker: {
            muridId: absensiData.muridId as string | undefined,
            tanggal: absensiData.tanggal as string | undefined,
          },
        });
        return response.absensi;
      } else {
        throw new Error(response.message || 'Gagal membuat absensi');
      }
    } catch (err: any) {
      console.error('Error creating absensi:', err);
      throw err;
    }
  };

  const updateAbsensi = async (id: string, absensiData: Partial<Absensi>) => {
    try {
      const response = await apiService.updateAbsensi(id, absensiData);
      if (response.success && response.absensi) {
        // Invalidate cache
        globalAbsensiCache = null;
        globalAbsensiCacheTime = 0;
        globalAbsensiLoadingPromise = null;
        
        // Refresh data after update (usually direct to server, no worker)
        await refreshAbsensi();
        return response.absensi;
      } else {
        throw new Error(response.message || 'Gagal memperbarui absensi');
      }
    } catch (err: any) {
      console.error('Error updating absensi:', err);
      throw err;
    }
  };

  const deleteAbsensi = async (id: string) => {
    try {
      const response = await apiService.deleteAbsensi(id);
      if (response.success) {
        // Refresh data after deletion
        await refreshAbsensi();
      } else {
        throw new Error(response.message || 'Gagal menghapus absensi');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menghapus absensi');
      throw err;
    }
  };

  return { 
    absensi, 
    loading, 
    error, 
    refreshAbsensi,
    createAbsensi,
    updateAbsensi,
    deleteAbsensi,
    isSyncingWithWorker,
    syncMessage,
  };
};

// Export function to clear global cache
export const clearAbsensiCache = () => {
  globalAbsensiCache = null;
  globalAbsensiCacheTime = 0;
  globalAbsensiLoadingPromise = null;
  cacheInvalidationCounter++; // Increment counter for tracking
  
  // Dispatch event to notify all hook instances to refresh
  window.dispatchEvent(new CustomEvent('absensi-cache-cleared'));
};

