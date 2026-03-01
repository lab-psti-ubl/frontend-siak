import { useState, useEffect } from 'react';
import * as React from 'react';
import { apiService } from '../services/apiService';
import { AbsensiGuru } from '../types';

// Global cache untuk semua instance hook
let globalAbsensiGuruCache: AbsensiGuru[] | null = null;
let globalAbsensiGuruCacheTime: number = 0;
let globalAbsensiGuruLoadingPromise: Promise<AbsensiGuru[]> | null = null;

const CACHE_DURATION = 2000000; // 10 menit (600000 ms) - shorter cache for attendance data

export type AbsensiGuruRefreshOptions = {
  waitForWorker?: {
    guruId?: string;
    tanggal?: string;
  };
  maxAttempts?: number;
  delayMs?: number;
};

type RefreshOptions = AbsensiGuruRefreshOptions;

export const useAbsensiGuru = (guruId?: string, bulan?: number, tahun?: number) => {
  const [absensiGuru, setAbsensiGuru] = useState<AbsensiGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncingWithWorker, setIsSyncingWithWorker] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Store current params for refresh function
  const currentParamsRef = React.useRef({ guruId, bulan, tahun });

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const waitForWorkerPersistence = async (opts: RefreshOptions['waitForWorker'], attempts = 8, delayMs = 1200) => {
    if (!opts?.guruId || !opts?.tanggal) return;

    for (let i = 0; i < attempts; i++) {
      try {
        const response = await apiService.getAbsensiGuruByGuruIdAndTanggal(opts.guruId, opts.tanggal);
        if (response.success && response.absensiGuru) {
          return response.absensiGuru;
        }
      } catch (err) {
        console.warn('Waiting for worker persistence failed, retrying...', err);
      }
      await sleep(delayMs);
    }
  };

  useEffect(() => {
    currentParamsRef.current = { guruId, bulan, tahun };
    
    const fetchData = async () => {
      // Check cache validity (only for getAll, not for filtered queries)
      const cacheValid = globalAbsensiGuruCache && 
                        (Date.now() - globalAbsensiGuruCacheTime) < CACHE_DURATION &&
                        !guruId && !bulan && !tahun;

      if (cacheValid) {
        // Use cached data only for getAll
        setAbsensiGuru(globalAbsensiGuruCache);
        setLoading(false);
        return;
      }

      // If there's already a request in progress, wait for it (only for getAll)
      if (globalAbsensiGuruLoadingPromise && !guruId && !bulan && !tahun) {
        globalAbsensiGuruLoadingPromise
          .then(data => {
            setAbsensiGuru(data);
            setLoading(false);
          })
          .catch(err => {
            setError(err.message || 'Terjadi kesalahan saat mengambil data absensi guru');
            setLoading(false);
          });
        return;
      }

      // Make new request
      setLoading(true);
      setError(null);
      
      try {
        let response;
        if (guruId) {
          // Fetch by guruId (with optional bulan/tahun filter)
          response = await apiService.getAbsensiGuruByGuruId(guruId, bulan, tahun);
        } else {
          // Fetch all
          if (!globalAbsensiGuruLoadingPromise) {
            globalAbsensiGuruLoadingPromise = (async () => {
              const resp = await apiService.getAllAbsensiGuru();
              if (resp.success && resp.absensiGuru) {
                globalAbsensiGuruCache = resp.absensiGuru;
                globalAbsensiGuruCacheTime = Date.now();
                return resp.absensiGuru;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data absensi guru');
              }
            })();
          }
          const data = await globalAbsensiGuruLoadingPromise;
          globalAbsensiGuruLoadingPromise = null;
          setAbsensiGuru(data);
          setLoading(false);
          return;
        }

        if (response.success && response.absensiGuru) {
          setAbsensiGuru(response.absensiGuru);
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data absensi guru');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data absensi guru');
        console.error('Error fetching absensi guru:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [guruId, bulan, tahun]);

  const refreshAbsensiGuru = async (options?: RefreshOptions) => {
    const shouldWaitForWorker = !!options?.waitForWorker?.guruId && !!options?.waitForWorker?.tanggal;
    if (shouldWaitForWorker) {
      setIsSyncingWithWorker(true);
      setSyncMessage('Menunggu worker menyimpan data absensi...');
      await waitForWorkerPersistence(
        options?.waitForWorker,
        options?.maxAttempts,
        options?.delayMs,
      );
      setSyncMessage('Memuat ulang data absensi guru...');
    }

    // Clear cache and force refresh
    globalAbsensiGuruCache = null;
    globalAbsensiGuruCacheTime = 0;
    globalAbsensiGuruLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    const params = currentParamsRef.current;
    
    try {
      let response;
      if (params.guruId) {
        response = await apiService.getAbsensiGuruByGuruId(params.guruId, params.bulan, params.tahun);
      } else {
        response = await apiService.getAllAbsensiGuru();
      }
      
      if (response.success && response.absensiGuru) {
        if (!params.guruId && !params.bulan && !params.tahun) {
          globalAbsensiGuruCache = response.absensiGuru;
          globalAbsensiGuruCacheTime = Date.now();
        }
        setAbsensiGuru(response.absensiGuru);
      } else {
        setError(response.message || 'Gagal mengambil data absensi guru');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data absensi guru');
      console.error('Error fetching absensi guru:', err);
    } finally {
      setLoading(false);
      if (shouldWaitForWorker) {
        setIsSyncingWithWorker(false);
        setSyncMessage(null);
      }
    }
  };

  const createAbsensiGuru = async (data: Partial<AbsensiGuru>) => {
    try {
      const response = await apiService.submitAbsensiGuruWithFallback(data);
      // Worker path returns 202 without absensiGuru payload; we treat it as success and refresh later.
      if (response.success) {
        // Invalidate cache
        globalAbsensiGuruCache = null;
        globalAbsensiGuruCacheTime = 0;
        globalAbsensiGuruLoadingPromise = null;
        await refreshAbsensiGuru({
          waitForWorker: {
            guruId: data.guruId,
            tanggal: data.tanggal as string | undefined,
          },
        });
        return response;
      } else {
        throw new Error(response.message || 'Gagal membuat absensi guru');
      }
    } catch (err: any) {
      console.error('Error creating absensi guru:', err);
      throw err;
    }
  };

  const updateAbsensiGuru = async (id: string, data: Partial<AbsensiGuru>) => {
    try {
      const response = await apiService.submitAbsensiGuruUpdateWithFallback(id, data);
      if (response.success) {
        // Invalidate cache
        globalAbsensiGuruCache = null;
        globalAbsensiGuruCacheTime = 0;
        globalAbsensiGuruLoadingPromise = null;
        await refreshAbsensiGuru({
          waitForWorker: {
            guruId: data.guruId,
            tanggal: data.tanggal as string | undefined,
          },
        });
        return response;
      } else {
        throw new Error(response.message || 'Gagal memperbarui absensi guru');
      }
    } catch (err: any) {
      console.error('Error updating absensi guru:', err);
      throw err;
    }
  };

  return { absensiGuru, loading, error, refreshAbsensiGuru, createAbsensiGuru, updateAbsensiGuru, isSyncingWithWorker, syncMessage };
};

// Export function to clear all cache (useful when logging out)
export const clearAbsensiGuruCache = () => {
  globalAbsensiGuruCache = null;
  globalAbsensiGuruCacheTime = 0;
  globalAbsensiGuruLoadingPromise = null;
};

