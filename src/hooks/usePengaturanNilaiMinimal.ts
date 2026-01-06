import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { PengaturanNilaiMinimal } from '../types';
import { setNilaiMinimalCache } from '../utils/nilaiUtils';

// Global cache untuk semua instance hook
let globalPengaturanNilaiMinimalCache: PengaturanNilaiMinimal | null = null;
let globalPengaturanNilaiMinimalCacheTime: number = 0;
let globalPengaturanNilaiMinimalLoadingPromise: Promise<PengaturanNilaiMinimal | null> | null = null;

const CACHE_DURATION = 1000000; // 10 menit (600000 ms)

export const usePengaturanNilaiMinimal = () => {
  const [pengaturanNilaiMinimal, setPengaturanNilaiMinimal] = useState<PengaturanNilaiMinimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalPengaturanNilaiMinimalCache !== null && 
                      (Date.now() - globalPengaturanNilaiMinimalCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setPengaturanNilaiMinimal(globalPengaturanNilaiMinimalCache);
      
      // Update cache di nilaiUtils untuk getNilaiMinimalSettings()
      if (globalPengaturanNilaiMinimalCache) {
        setNilaiMinimalCache({
          nilaiAkhirMinimal: globalPengaturanNilaiMinimalCache.nilaiAkhirMinimal,
          tingkatKehadiranMinimal: globalPengaturanNilaiMinimalCache.tingkatKehadiranMinimal,
        });
      }
      
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalPengaturanNilaiMinimalLoadingPromise) {
      globalPengaturanNilaiMinimalLoadingPromise
        .then(data => {
          setPengaturanNilaiMinimal(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan nilai minimal');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalPengaturanNilaiMinimalLoadingPromise = (async () => {
      try {
        const response = await apiService.getPengaturanNilaiMinimal();
        if (response.success && response.pengaturanNilaiMinimal) {
          // Update cache
          globalPengaturanNilaiMinimalCache = response.pengaturanNilaiMinimal;
          globalPengaturanNilaiMinimalCacheTime = Date.now();
          
          // Update cache di nilaiUtils untuk getNilaiMinimalSettings()
          setNilaiMinimalCache({
            nilaiAkhirMinimal: response.pengaturanNilaiMinimal.nilaiAkhirMinimal,
            tingkatKehadiranMinimal: response.pengaturanNilaiMinimal.tingkatKehadiranMinimal,
          });
          
          setPengaturanNilaiMinimal(response.pengaturanNilaiMinimal);
          setLoading(false);
          return response.pengaturanNilaiMinimal;
        } else {
          setPengaturanNilaiMinimal(null);
          setLoading(false);
          return null;
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan nilai minimal');
        console.error('Error fetching pengaturan nilai minimal:', err);
        setLoading(false);
        throw err;
      } finally {
        globalPengaturanNilaiMinimalLoadingPromise = null;
      }
    })();
  }, []);

  const refreshPengaturanNilaiMinimal = async () => {
    // Clear cache and force refresh
    globalPengaturanNilaiMinimalCache = null;
    globalPengaturanNilaiMinimalCacheTime = 0;
    globalPengaturanNilaiMinimalLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getPengaturanNilaiMinimal();
      if (response.success && response.pengaturanNilaiMinimal) {
        globalPengaturanNilaiMinimalCache = response.pengaturanNilaiMinimal;
        globalPengaturanNilaiMinimalCacheTime = Date.now();
          
          // Update cache di nilaiUtils untuk getNilaiMinimalSettings()
          setNilaiMinimalCache({
            nilaiAkhirMinimal: response.pengaturanNilaiMinimal.nilaiAkhirMinimal,
            tingkatKehadiranMinimal: response.pengaturanNilaiMinimal.tingkatKehadiranMinimal,
          });
          
        setPengaturanNilaiMinimal(response.pengaturanNilaiMinimal);
      } else {
        setPengaturanNilaiMinimal(null);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan nilai minimal');
      console.error('Error fetching pengaturan nilai minimal:', err);
    } finally {
      setLoading(false);
    }
  };

  return { pengaturanNilaiMinimal, loading, error, refreshPengaturanNilaiMinimal };
};

// Export function to clear all cache (useful when logging out)
export const clearPengaturanNilaiMinimalCache = () => {
  globalPengaturanNilaiMinimalCache = null;
  globalPengaturanNilaiMinimalCacheTime = 0;
  globalPengaturanNilaiMinimalLoadingPromise = null;
};

