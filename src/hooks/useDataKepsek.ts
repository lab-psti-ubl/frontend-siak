import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { DataKepsek } from '../types';

// Global cache untuk semua instance hook
let globalDataKepsekCache: DataKepsek[] | null = null;
let globalDataKepsekCacheTime: number = 0;
let globalDataKepsekLoadingPromise: Promise<DataKepsek[]> | null = null;

const CACHE_DURATION = 600000; // 10 menit (600000 ms)

export const useDataKepsek = () => {
  const [dataKepsek, setDataKepsek] = useState<DataKepsek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalDataKepsekCache && 
                      (Date.now() - globalDataKepsekCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setDataKepsek(globalDataKepsekCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalDataKepsekLoadingPromise) {
      globalDataKepsekLoadingPromise
        .then(data => {
          setDataKepsek(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data kepsek');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalDataKepsekLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllDataKepsek();
        if (response.success && response.dataKepsek) {
          // Update cache
          globalDataKepsekCache = response.dataKepsek;
          globalDataKepsekCacheTime = Date.now();
          
          setDataKepsek(response.dataKepsek);
          setLoading(false);
          return response.dataKepsek;
        } else {
          throw new Error(response.message || 'Gagal mengambil data kepsek');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data kepsek');
        console.error('Error fetching data kepsek:', err);
        setLoading(false);
        throw err;
      } finally {
        globalDataKepsekLoadingPromise = null;
      }
    })();
  }, []);

  const refreshDataKepsek = async () => {
    // Clear cache and force refresh
    globalDataKepsekCache = null;
    globalDataKepsekCacheTime = 0;
    globalDataKepsekLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllDataKepsek();
      if (response.success && response.dataKepsek) {
        globalDataKepsekCache = response.dataKepsek;
        globalDataKepsekCacheTime = Date.now();
        setDataKepsek(response.dataKepsek);
      } else {
        setError(response.message || 'Gagal mengambil data kepsek');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data kepsek');
      console.error('Error fetching data kepsek:', err);
    } finally {
      setLoading(false);
    }
  };

  return { dataKepsek, loading, error, refreshDataKepsek };
};

// Export function to clear all cache (useful when logging out)
export const clearDataKepsekCache = () => {
  globalDataKepsekCache = null;
  globalDataKepsekCacheTime = 0;
  globalDataKepsekLoadingPromise = null;
};

