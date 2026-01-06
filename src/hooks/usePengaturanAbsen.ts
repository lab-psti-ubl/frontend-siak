import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { PengaturanAbsen } from '../types';

// Global cache untuk semua instance hook
let globalPengaturanAbsenCache: PengaturanAbsen[] | null = null;
let globalPengaturanAbsenCacheTime: number = 0;
let globalPengaturanAbsenLoadingPromise: Promise<PengaturanAbsen[]> | null = null;

const CACHE_DURATION = 1500000; // 10 menit (600000 ms)

export const usePengaturanAbsen = () => {
  const [pengaturanAbsen, setPengaturanAbsen] = useState<PengaturanAbsen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalPengaturanAbsenCache && 
                      (Date.now() - globalPengaturanAbsenCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setPengaturanAbsen(globalPengaturanAbsenCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalPengaturanAbsenLoadingPromise) {
      globalPengaturanAbsenLoadingPromise
        .then(data => {
          setPengaturanAbsen(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan absen');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalPengaturanAbsenLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllPengaturanAbsen();
        if (response.success && response.pengaturanAbsen) {
          // Update cache
          globalPengaturanAbsenCache = response.pengaturanAbsen;
          globalPengaturanAbsenCacheTime = Date.now();
          
          setPengaturanAbsen(response.pengaturanAbsen);
          setLoading(false);
          return response.pengaturanAbsen;
        } else {
          throw new Error(response.message || 'Gagal mengambil data pengaturan absen');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan absen');
        console.error('Error fetching pengaturan absen:', err);
        setLoading(false);
        throw err;
      } finally {
        globalPengaturanAbsenLoadingPromise = null;
      }
    })();
  }, []);

  const refreshPengaturanAbsen = async () => {
    // Clear cache and force refresh
    globalPengaturanAbsenCache = null;
    globalPengaturanAbsenCacheTime = 0;
    globalPengaturanAbsenLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllPengaturanAbsen();
      if (response.success && response.pengaturanAbsen) {
        globalPengaturanAbsenCache = response.pengaturanAbsen;
        globalPengaturanAbsenCacheTime = Date.now();
        setPengaturanAbsen(response.pengaturanAbsen);
      } else {
        setError(response.message || 'Gagal mengambil data pengaturan absen');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan absen');
      console.error('Error fetching pengaturan absen:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get active pengaturan absen
  const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive) || null;

  return { pengaturanAbsen, loading, error, refreshPengaturanAbsen, activePengaturanAbsen };
};

// Export function to clear all cache (useful when logging out)
export const clearPengaturanAbsenCache = () => {
  globalPengaturanAbsenCache = null;
  globalPengaturanAbsenCacheTime = 0;
  globalPengaturanAbsenLoadingPromise = null;
};

