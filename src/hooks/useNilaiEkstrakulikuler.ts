import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { NilaiEkstrakulikuler } from '../types';

// Global cache untuk semua instance hook
let globalNilaiEkstrakulikulerCache: { [key: string]: NilaiEkstrakulikuler[] } = {};
let globalNilaiEkstrakulikulerCacheTime: { [key: string]: number } = {};
let globalNilaiEkstrakulikulerLoadingPromise: { [key: string]: Promise<NilaiEkstrakulikuler[]> } = {};

const CACHE_DURATION = 2000000; // 5 menit (300000 ms)

export const useNilaiEkstrakulikuler = (params?: { 
  muridId?: string; 
  kelasId?: string; 
  semester?: number; 
  tahunAjaran?: string;
  ekstrakulikulerId?: string;
}) => {
  const [nilaiEkstrakulikuler, setNilaiEkstrakulikuler] = useState<NilaiEkstrakulikuler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check cache validity
    const cacheValid = globalNilaiEkstrakulikulerCache[cacheKey] && 
                      globalNilaiEkstrakulikulerCacheTime[cacheKey] &&
                      (Date.now() - globalNilaiEkstrakulikulerCacheTime[cacheKey]) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setNilaiEkstrakulikuler(globalNilaiEkstrakulikulerCache[cacheKey]);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalNilaiEkstrakulikulerLoadingPromise[cacheKey]) {
      globalNilaiEkstrakulikulerLoadingPromise[cacheKey]
        .then(data => {
          setNilaiEkstrakulikuler(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalNilaiEkstrakulikulerLoadingPromise[cacheKey] = (async () => {
      try {
        const response = await apiService.getAllNilaiEkstrakulikuler(params);
        if (response.success && response.nilaiEkstrakulikuler) {
          // Update cache
          globalNilaiEkstrakulikulerCache[cacheKey] = response.nilaiEkstrakulikuler;
          globalNilaiEkstrakulikulerCacheTime[cacheKey] = Date.now();
          
          setNilaiEkstrakulikuler(response.nilaiEkstrakulikuler);
          setLoading(false);
          return response.nilaiEkstrakulikuler;
        } else {
          throw new Error(response.message || 'Gagal mengambil data nilai ekstrakulikuler');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler');
        console.error('Error fetching nilai ekstrakulikuler:', err);
        setLoading(false);
        throw err;
      } finally {
        delete globalNilaiEkstrakulikulerLoadingPromise[cacheKey];
      }
    })();
  }, [params?.muridId, params?.kelasId, params?.semester, params?.tahunAjaran, params?.ekstrakulikulerId]);

  const refreshNilaiEkstrakulikuler = async () => {
    // Clear cache for this specific params
    const cacheKey = JSON.stringify(params || {});
    delete globalNilaiEkstrakulikulerCache[cacheKey];
    delete globalNilaiEkstrakulikulerCacheTime[cacheKey];
    delete globalNilaiEkstrakulikulerLoadingPromise[cacheKey];
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllNilaiEkstrakulikuler(params);
      if (response.success && response.nilaiEkstrakulikuler) {
        globalNilaiEkstrakulikulerCache[cacheKey] = response.nilaiEkstrakulikuler;
        globalNilaiEkstrakulikulerCacheTime[cacheKey] = Date.now();
        setNilaiEkstrakulikuler(response.nilaiEkstrakulikuler);
      } else {
        setError(response.message || 'Gagal mengambil data nilai ekstrakulikuler');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler');
      console.error('Error fetching nilai ekstrakulikuler:', err);
    } finally {
      setLoading(false);
    }
  };

  return { nilaiEkstrakulikuler, loading, error, refreshNilaiEkstrakulikuler };
};

// Export function to refresh cache globally
export const refreshNilaiEkstrakulikulerCache = async () => {
  globalNilaiEkstrakulikulerCache = {};
  globalNilaiEkstrakulikulerCacheTime = {};
  globalNilaiEkstrakulikulerLoadingPromise = {};
};

// Export function to clear all cache (useful when logging out)
export const clearNilaiEkstrakulikulerCache = () => {
  globalNilaiEkstrakulikulerCache = {};
  globalNilaiEkstrakulikulerCacheTime = {};
  globalNilaiEkstrakulikulerLoadingPromise = {};
};

