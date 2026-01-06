import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { MataPelajaran } from '../types';

// Global cache untuk semua instance hook
let globalMataPelajaranCache: MataPelajaran[] | null = null;
let globalMataPelajaranCacheTime: number = 0;
let globalMataPelajaranLoadingPromise: Promise<MataPelajaran[]> | null = null;

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useMataPelajaran = () => {
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalMataPelajaranCache && 
                      (Date.now() - globalMataPelajaranCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setMataPelajaran(globalMataPelajaranCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalMataPelajaranLoadingPromise) {
      globalMataPelajaranLoadingPromise
        .then(data => {
          setMataPelajaran(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data mata pelajaran');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalMataPelajaranLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllMataPelajaran();
        if (response.success && response.mataPelajaran) {
          // Update cache
          globalMataPelajaranCache = response.mataPelajaran;
          globalMataPelajaranCacheTime = Date.now();
          
          setMataPelajaran(response.mataPelajaran);
          setLoading(false);
          return response.mataPelajaran;
        } else {
          throw new Error(response.message || 'Gagal mengambil data mata pelajaran');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data mata pelajaran');
        console.error('Error fetching mata pelajaran:', err);
        setLoading(false);
        throw err;
      } finally {
        globalMataPelajaranLoadingPromise = null;
      }
    })();
  }, []);

  const refreshMataPelajaran = async () => {
    // Clear cache and force refresh
    globalMataPelajaranCache = null;
    globalMataPelajaranCacheTime = 0;
    globalMataPelajaranLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllMataPelajaran();
      if (response.success && response.mataPelajaran) {
        globalMataPelajaranCache = response.mataPelajaran;
        globalMataPelajaranCacheTime = Date.now();
        setMataPelajaran(response.mataPelajaran);
      } else {
        setError(response.message || 'Gagal mengambil data mata pelajaran');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data mata pelajaran');
      console.error('Error fetching mata pelajaran:', err);
    } finally {
      setLoading(false);
    }
  };

  return { mataPelajaran, loading, error, refreshMataPelajaran };
};

// Export function to clear all cache (useful when logging out)
export const clearMataPelajaranCache = () => {
  globalMataPelajaranCache = null;
  globalMataPelajaranCacheTime = 0;
  globalMataPelajaranLoadingPromise = null;
};

