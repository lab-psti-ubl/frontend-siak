import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { User } from '../types';

// Global cache untuk semua instance hook
let globalGurusCache: User[] | null = null;
let globalGurusCacheTime: number = 0;
let globalGurusLoadingPromise: Promise<User[]> | null = null;

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useGurus = () => {
  const [gurus, setGurus] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalGurusCache && 
                      (Date.now() - globalGurusCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setGurus(globalGurusCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalGurusLoadingPromise) {
      globalGurusLoadingPromise
        .then(data => {
          setGurus(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data guru');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalGurusLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllGurus();
        if (response.success && response.gurus) {
          // Update cache
          globalGurusCache = response.gurus;
          globalGurusCacheTime = Date.now();
          
          setGurus(response.gurus);
          setLoading(false);
          return response.gurus;
        } else {
          throw new Error(response.message || 'Gagal mengambil data guru');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data guru');
        console.error('Error fetching gurus:', err);
        setLoading(false);
        throw err;
      } finally {
        globalGurusLoadingPromise = null;
      }
    })();
  }, []);

  const refreshGurus = async () => {
    // Clear cache and force refresh
    globalGurusCache = null;
    globalGurusCacheTime = 0;
    globalGurusLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllGurus();
      if (response.success && response.gurus) {
        globalGurusCache = response.gurus;
        globalGurusCacheTime = Date.now();
        setGurus(response.gurus);
      } else {
        setError(response.message || 'Gagal mengambil data guru');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data guru');
      console.error('Error fetching gurus:', err);
    } finally {
      setLoading(false);
    }
  };

  return { gurus, loading, error, refreshGurus };
};

// Export function to clear all cache (useful when logging out)
export const clearGurusCache = () => {
  globalGurusCache = null;
  globalGurusCacheTime = 0;
  globalGurusLoadingPromise = null;
};

