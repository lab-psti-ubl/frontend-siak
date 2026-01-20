import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { User } from '../types';

// Global cache untuk semua instance hook
let globalUstadzCache: User[] | null = null;
let globalUstadzCacheTime: number = 0;
let globalUstadzLoadingPromise: Promise<User[]> | null = null;

const CACHE_DURATION = 300000; // 5 menit

export const useUstadz = () => {
  const [ustadz, setUstadz] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalUstadzCache && 
                      (Date.now() - globalUstadzCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setUstadz(globalUstadzCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalUstadzLoadingPromise) {
      globalUstadzLoadingPromise
        .then(data => {
          setUstadz(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data ustadz');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalUstadzLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllUstadz();
        if (response.success && response.ustadz) {
          // Update cache
          globalUstadzCache = response.ustadz;
          globalUstadzCacheTime = Date.now();
          
          setUstadz(response.ustadz);
          setLoading(false);
          return response.ustadz;
        } else {
          throw new Error(response.message || 'Gagal mengambil data ustadz');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data ustadz');
        console.error('Error fetching ustadz:', err);
        setLoading(false);
        throw err;
      } finally {
        globalUstadzLoadingPromise = null;
      }
    })() as Promise<User[]>;
  }, []);

  const refreshUstadz = async () => {
    // Clear cache and force refresh
    globalUstadzCache = null;
    globalUstadzCacheTime = 0;
    globalUstadzLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllUstadz();
      if (response.success && response.ustadz) {
        globalUstadzCache = response.ustadz;
        globalUstadzCacheTime = Date.now();
        setUstadz(response.ustadz);
      } else {
        setError(response.message || 'Gagal mengambil data ustadz');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data ustadz');
      console.error('Error fetching ustadz:', err);
    } finally {
      setLoading(false);
    }
  };

  return { ustadz, loading, error, refreshUstadz };
};

// Export function to clear all cache (useful when logging out)
export const clearUstadzCache = () => {
  globalUstadzCache = null;
  globalUstadzCacheTime = 0;
  globalUstadzLoadingPromise = null;
};

