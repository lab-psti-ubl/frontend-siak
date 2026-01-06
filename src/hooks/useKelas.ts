import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Kelas } from '../types';

// Global cache untuk semua instance hook
let globalKelasCache: Kelas[] | null = null;
let globalKelasCacheTime: number = 0;
let globalKelasCacheParams: string | null = null;
let globalKelasLoadingPromise: Promise<Kelas[]> | null = null;

const CACHE_DURATION = 2000000; // 10 menit (600000 ms)

export const useKelas = (params?: { jurusanId?: string; tingkat?: number }) => {
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check if params changed
    const paramsChanged = cacheKey !== globalKelasCacheParams;
    
    // Check cache validity
    const cacheValid = globalKelasCache && 
                      !paramsChanged &&
                      (Date.now() - globalKelasCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setKelas(globalKelasCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    if (globalKelasLoadingPromise && !paramsChanged) {
      globalKelasLoadingPromise
        .then(data => {
          setKelas(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data kelas');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalKelasLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllKelas(params);
        if (response.success && response.kelas) {
          // Update cache
          globalKelasCache = response.kelas;
          globalKelasCacheTime = Date.now();
          globalKelasCacheParams = cacheKey;
          
          setKelas(response.kelas);
          setLoading(false);
          return response.kelas;
        } else {
          throw new Error(response.message || 'Gagal mengambil data kelas');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data kelas');
        console.error('Error fetching kelas:', err);
        setLoading(false);
        throw err;
      } finally {
        globalKelasLoadingPromise = null;
      }
    })();
  }, [params?.jurusanId, params?.tingkat]);

  const refreshKelas = async () => {
    // Clear cache and force refresh
    globalKelasCache = null;
    globalKelasCacheTime = 0;
    globalKelasCacheParams = null;
    globalKelasLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllKelas(params);
      if (response.success && response.kelas) {
        const cacheKey = JSON.stringify(params || {});
        globalKelasCache = response.kelas;
        globalKelasCacheTime = Date.now();
        globalKelasCacheParams = cacheKey;
        setKelas(response.kelas);
      } else {
        setError(response.message || 'Gagal mengambil data kelas');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data kelas');
      console.error('Error fetching kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  return { kelas, loading, error, refreshKelas };
};

// Export function to clear all cache (useful when logging out)
export const clearKelasCache = () => {
  globalKelasCache = null;
  globalKelasCacheTime = 0;
  globalKelasCacheParams = null;
  globalKelasLoadingPromise = null;
};

