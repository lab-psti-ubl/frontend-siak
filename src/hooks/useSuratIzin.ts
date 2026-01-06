import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { SuratIzin } from '../types';

// Global cache untuk semua instance hook
let globalSuratIzinCache: SuratIzin[] | null = null;
let globalSuratIzinCacheTime: number = 0;
let globalSuratIzinLoadingPromise: Promise<SuratIzin[]> | null = null;

const CACHE_DURATION = 1000000; // 5 menit (300000 ms) - shorter cache for permission data

interface SuratIzinParams {
  status?: string;
}

export const useSuratIzin = (params?: SuratIzinParams) => {
  const [suratIzin, setSuratIzin] = useState<SuratIzin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check cache validity (only for getAll, not for filtered queries)
    const cacheValid = globalSuratIzinCache && 
                      !params?.status &&
                      (Date.now() - globalSuratIzinCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data only for getAll
      setSuratIzin(globalSuratIzinCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it (only for getAll)
    if (globalSuratIzinLoadingPromise && !params?.status) {
      globalSuratIzinLoadingPromise
        .then(data => {
          setSuratIzin(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data surat izin');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        let response;
        if (params?.status) {
          // Fetch by status
          response = await apiService.getSuratIzinByStatus(params.status);
        } else {
          // Fetch all
          if (!globalSuratIzinLoadingPromise) {
            globalSuratIzinLoadingPromise = (async () => {
              const resp = await apiService.getAllSuratIzin();
              if (resp.success && resp.suratIzin) {
                globalSuratIzinCache = resp.suratIzin;
                globalSuratIzinCacheTime = Date.now();
                return resp.suratIzin;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data surat izin');
              }
            })();
          }
          const data = await globalSuratIzinLoadingPromise;
          globalSuratIzinLoadingPromise = null;
          setSuratIzin(data);
          setLoading(false);
          return;
        }

        if (response.success && response.suratIzin) {
          setSuratIzin(response.suratIzin);
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data surat izin');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data surat izin');
        console.error('Error fetching surat izin:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.status]);

  const refreshSuratIzin = async () => {
    // Clear cache and force refresh
    globalSuratIzinCache = null;
    globalSuratIzinCacheTime = 0;
    globalSuratIzinLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (params?.status) {
        response = await apiService.getSuratIzinByStatus(params.status);
      } else {
        response = await apiService.getAllSuratIzin();
      }
      
      if (response.success && response.suratIzin) {
        if (!params?.status) {
          globalSuratIzinCache = response.suratIzin;
          globalSuratIzinCacheTime = Date.now();
        }
        setSuratIzin(response.suratIzin);
      } else {
        setError(response.message || 'Gagal mengambil data surat izin');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data surat izin');
      console.error('Error fetching surat izin:', err);
    } finally {
      setLoading(false);
    }
  };

  return { suratIzin, loading, error, refreshSuratIzin };
};

// Export function to clear all cache (useful when logging out)
export const clearSuratIzinCache = () => {
  globalSuratIzinCache = null;
  globalSuratIzinCacheTime = 0;
  globalSuratIzinLoadingPromise = null;
};

