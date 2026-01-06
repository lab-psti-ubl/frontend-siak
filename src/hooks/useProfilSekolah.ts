import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { ProfilSekolah } from '../types';

// Global cache untuk semua instance hook
let globalProfilSekolahCache: ProfilSekolah | null = null;
let globalProfilSekolahCacheTime: number = 0;
let globalProfilSekolahLoadingPromise: Promise<ProfilSekolah | null> | null = null;

const CACHE_DURATION = 2000000; // 10 menit (600000 ms)

export const useProfilSekolah = () => {
  const [profilSekolah, setProfilSekolah] = useState<ProfilSekolah | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalProfilSekolahCache !== null && 
                      (Date.now() - globalProfilSekolahCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setProfilSekolah(globalProfilSekolahCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalProfilSekolahLoadingPromise) {
      globalProfilSekolahLoadingPromise
        .then(data => {
          setProfilSekolah(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data profil sekolah');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalProfilSekolahLoadingPromise = (async () => {
      try {
        const response = await apiService.getProfilSekolah();
        if (response.success && response.profilSekolah) {
          // Update cache
          globalProfilSekolahCache = response.profilSekolah;
          globalProfilSekolahCacheTime = Date.now();
          
          setProfilSekolah(response.profilSekolah);
          setLoading(false);
          return response.profilSekolah;
        } else {
          setProfilSekolah(null);
          setLoading(false);
          return null;
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data profil sekolah');
        console.error('Error fetching profil sekolah:', err);
        setLoading(false);
        throw err;
      } finally {
        globalProfilSekolahLoadingPromise = null;
      }
    })();
  }, []);

  const refreshProfilSekolah = async () => {
    // Clear cache and force refresh
    globalProfilSekolahCache = null;
    globalProfilSekolahCacheTime = 0;
    globalProfilSekolahLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getProfilSekolah();
      if (response.success && response.profilSekolah) {
        globalProfilSekolahCache = response.profilSekolah;
        globalProfilSekolahCacheTime = Date.now();
        setProfilSekolah(response.profilSekolah);
      } else {
        setProfilSekolah(null);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data profil sekolah');
      console.error('Error fetching profil sekolah:', err);
    } finally {
      setLoading(false);
    }
  };

  return { profilSekolah, loading, error, refreshProfilSekolah };
};

// Export function to clear all cache (useful when logging out)
export const clearProfilSekolahCache = () => {
  globalProfilSekolahCache = null;
  globalProfilSekolahCacheTime = 0;
  globalProfilSekolahLoadingPromise = null;
};

