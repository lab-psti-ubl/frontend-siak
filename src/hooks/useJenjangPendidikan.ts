import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { PengaturanJenjangPendidikan } from '../types';

// Global cache untuk semua instance hook
let globalJenjangPendidikanCache: PengaturanJenjangPendidikan[] | null = null;
let globalJenjangPendidikanCacheTime: number = 0;
let globalJenjangPendidikanLoadingPromise: Promise<PengaturanJenjangPendidikan[]> | null = null;

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useJenjangPendidikan = () => {
  const [jenjangPendidikan, setJenjangPendidikan] = useState<PengaturanJenjangPendidikan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalJenjangPendidikanCache && 
                      (Date.now() - globalJenjangPendidikanCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setJenjangPendidikan(globalJenjangPendidikanCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalJenjangPendidikanLoadingPromise) {
      globalJenjangPendidikanLoadingPromise
        .then(data => {
          setJenjangPendidikan(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data jenjang pendidikan');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalJenjangPendidikanLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllJenjang();
        if (response.success && response.jenjangList) {
          // Update cache
          globalJenjangPendidikanCache = response.jenjangList;
          globalJenjangPendidikanCacheTime = Date.now();
          
          setJenjangPendidikan(response.jenjangList);
          setLoading(false);
          return response.jenjangList;
        } else {
          throw new Error(response.message || 'Gagal mengambil data jenjang pendidikan');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data jenjang pendidikan');
        console.error('Error fetching jenjang pendidikan:', err);
        setLoading(false);
        throw err;
      } finally {
        globalJenjangPendidikanLoadingPromise = null;
      }
    })();
  }, []);

  const refreshJenjangPendidikan = async () => {
    // Clear cache and force refresh
    globalJenjangPendidikanCache = null;
    globalJenjangPendidikanCacheTime = 0;
    globalJenjangPendidikanLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllJenjang();
      if (response.success && response.jenjangList) {
        globalJenjangPendidikanCache = response.jenjangList;
        globalJenjangPendidikanCacheTime = Date.now();
        setJenjangPendidikan(response.jenjangList);
      } else {
        setError(response.message || 'Gagal mengambil data jenjang pendidikan');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data jenjang pendidikan');
      console.error('Error fetching jenjang pendidikan:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get active jenjang
  const activeJenjang = jenjangPendidikan.find(j => j.isActive) || null;

  return { jenjangPendidikan, loading, error, refreshJenjangPendidikan, activeJenjang };
};

// Export function to clear all cache (useful when logging out)
export const clearJenjangPendidikanCache = () => {
  globalJenjangPendidikanCache = null;
  globalJenjangPendidikanCacheTime = 0;
  globalJenjangPendidikanLoadingPromise = null;
};

