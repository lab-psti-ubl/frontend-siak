import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Jurusan } from '../types';

// Global cache untuk semua instance hook
let globalJurusanCache: Jurusan[] | null = null;
let globalJurusanCacheTime: number = 0;
let globalJurusanLoadingPromise: Promise<Jurusan[]> | null = null;

const CACHE_DURATION = 2000000; // 10 menit (600000 ms)

export const useJurusan = () => {
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalJurusanCache && 
                      (Date.now() - globalJurusanCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setJurusan(globalJurusanCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalJurusanLoadingPromise) {
      globalJurusanLoadingPromise
        .then(data => {
          setJurusan(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data jurusan');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalJurusanLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllJurusan();
        if (response.success && response.jurusan) {
          // Update cache
          globalJurusanCache = response.jurusan;
          globalJurusanCacheTime = Date.now();
          
          setJurusan(response.jurusan);
          setLoading(false);
          return response.jurusan;
        } else {
          throw new Error(response.message || 'Gagal mengambil data jurusan');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data jurusan');
        console.error('Error fetching jurusan:', err);
        setLoading(false);
        throw err;
      } finally {
        globalJurusanLoadingPromise = null;
      }
    })();
  }, []);

  const refreshJurusan = async () => {
    // Clear cache and force refresh
    globalJurusanCache = null;
    globalJurusanCacheTime = 0;
    globalJurusanLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllJurusan();
      if (response.success && response.jurusan) {
        globalJurusanCache = response.jurusan;
        globalJurusanCacheTime = Date.now();
        setJurusan(response.jurusan);
      } else {
        setError(response.message || 'Gagal mengambil data jurusan');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data jurusan');
      console.error('Error fetching jurusan:', err);
    } finally {
      setLoading(false);
    }
  };

  return { jurusan, loading, error, refreshJurusan };
};

// Export function to clear all cache (useful when logging out)
export const clearJurusanCache = () => {
  globalJurusanCache = null;
  globalJurusanCacheTime = 0;
  globalJurusanLoadingPromise = null;
};

