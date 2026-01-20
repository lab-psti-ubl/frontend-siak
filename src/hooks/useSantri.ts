import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { User } from '../types';

// Global cache untuk semua instance hook
let globalSantriCache: User[] | null = null;
let globalSantriCacheTime: number = 0;
let globalSantriLoadingPromise: Promise<User[]> | null = null;

const CACHE_DURATION = 300000; // 5 menit

export const useSantri = () => {
  const [santri, setSantri] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalSantriCache && 
                      (Date.now() - globalSantriCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setSantri(globalSantriCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalSantriLoadingPromise) {
      globalSantriLoadingPromise
        .then(data => {
          setSantri(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data santri');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalSantriLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllSantri();
        if (response.success && response.santri) {
          // Update cache
          globalSantriCache = response.santri;
          globalSantriCacheTime = Date.now();
          
          setSantri(response.santri);
          setLoading(false);
          return response.santri;
        } else {
          throw new Error(response.message || 'Gagal mengambil data santri');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data santri');
        console.error('Error fetching santri:', err);
        setLoading(false);
        throw err;
      } finally {
        globalSantriLoadingPromise = null;
      }
    })() as Promise<User[]>;
  }, []);

  const refreshSantri = async () => {
    // Clear cache and force refresh
    globalSantriCache = null;
    globalSantriCacheTime = 0;
    globalSantriLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllSantri();
      if (response.success && response.santri) {
        globalSantriCache = response.santri;
        globalSantriCacheTime = Date.now();
        setSantri(response.santri);
      } else {
        setError(response.message || 'Gagal mengambil data santri');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data santri');
      console.error('Error fetching santri:', err);
    } finally {
      setLoading(false);
    }
  };

  return { santri, loading, error, refreshSantri };
};

// Export function to clear all cache (useful when logging out)
export const clearSantriCache = () => {
  globalSantriCache = null;
  globalSantriCacheTime = 0;
  globalSantriLoadingPromise = null;
};

