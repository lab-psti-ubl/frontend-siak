import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Ekstrakulikuler } from '../types';

// Global cache untuk semua instance hook
let globalEkstrakulikulerCache: Ekstrakulikuler[] | null = null;
let globalEkstrakulikulerCacheTime: number = 0;
let globalEkstrakulikulerLoadingPromise: Promise<Ekstrakulikuler[]> | null = null;

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useEkstrakulikuler = (params?: { isActive?: boolean }) => {
  const [ekstrakulikuler, setEkstrakulikuler] = useState<Ekstrakulikuler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // For now, we'll use a simple cache (can be enhanced later with params-based caching)
    // Check cache validity
    const cacheValid = globalEkstrakulikulerCache && 
                      (Date.now() - globalEkstrakulikulerCacheTime) < CACHE_DURATION;

    if (cacheValid && !params) {
      // Use cached data (only if no params)
      setEkstrakulikuler(globalEkstrakulikulerCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalEkstrakulikulerLoadingPromise && !params) {
      globalEkstrakulikulerLoadingPromise
        .then(data => {
          setEkstrakulikuler(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data ekstrakulikuler');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalEkstrakulikulerLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllEkstrakulikuler(params);
        if (response.success && response.ekstrakulikuler) {
          // Update cache
          if (!params) {
            globalEkstrakulikulerCache = response.ekstrakulikuler;
            globalEkstrakulikulerCacheTime = Date.now();
          }
          
          setEkstrakulikuler(response.ekstrakulikuler);
          setLoading(false);
          return response.ekstrakulikuler;
        } else {
          throw new Error(response.message || 'Gagal mengambil data ekstrakulikuler');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data ekstrakulikuler');
        console.error('Error fetching ekstrakulikuler:', err);
        setLoading(false);
        throw err;
      } finally {
        globalEkstrakulikulerLoadingPromise = null;
      }
    })();
  }, [params?.isActive]);

  const refreshEkstrakulikuler = async () => {
    // Clear cache and force refresh
    globalEkstrakulikulerCache = null;
    globalEkstrakulikulerCacheTime = 0;
    globalEkstrakulikulerLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllEkstrakulikuler(params);
      if (response.success && response.ekstrakulikuler) {
        if (!params) {
          globalEkstrakulikulerCache = response.ekstrakulikuler;
          globalEkstrakulikulerCacheTime = Date.now();
        }
        setEkstrakulikuler(response.ekstrakulikuler);
      } else {
        setError(response.message || 'Gagal mengambil data ekstrakulikuler');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data ekstrakulikuler');
      console.error('Error fetching ekstrakulikuler:', err);
    } finally {
      setLoading(false);
    }
  };

  return { ekstrakulikuler, loading, error, refreshEkstrakulikuler };
};

// Export function to refresh cache globally
export const refreshEkstrakulikulerCache = async () => {
  globalEkstrakulikulerCache = null;
  globalEkstrakulikulerCacheTime = 0;
  globalEkstrakulikulerLoadingPromise = null;
};

// Export function to clear all cache (useful when logging out)
export const clearEkstrakulikulerCache = () => {
  globalEkstrakulikulerCache = null;
  globalEkstrakulikulerCacheTime = 0;
  globalEkstrakulikulerLoadingPromise = null;
};

