import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { PengaturanIstirahat } from '../types';

// Global cache untuk semua instance hook
let globalPengaturanIstirahatCache: PengaturanIstirahat[] | null = null;
let globalPengaturanIstirahatCacheTime: number = 0;
let globalPengaturanIstirahatLoadingPromise: Promise<PengaturanIstirahat[]> | null = null;

const CACHE_DURATION = 600000; // 10 menit (600000 ms)

export const usePengaturanIstirahat = () => {
  const [pengaturanIstirahat, setPengaturanIstirahat] = useState<PengaturanIstirahat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalPengaturanIstirahatCache && 
                      (Date.now() - globalPengaturanIstirahatCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setPengaturanIstirahat(globalPengaturanIstirahatCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalPengaturanIstirahatLoadingPromise) {
      globalPengaturanIstirahatLoadingPromise
        .then(data => {
          setPengaturanIstirahat(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan istirahat');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalPengaturanIstirahatLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllPengaturanIstirahat();
        if (response.success && response.pengaturanIstirahat) {
          // Update cache
          globalPengaturanIstirahatCache = response.pengaturanIstirahat;
          globalPengaturanIstirahatCacheTime = Date.now();
          
          setPengaturanIstirahat(response.pengaturanIstirahat);
          setLoading(false);
          return response.pengaturanIstirahat;
        } else {
          throw new Error(response.message || 'Gagal mengambil data pengaturan istirahat');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan istirahat');
        console.error('Error fetching pengaturan istirahat:', err);
        setLoading(false);
        throw err;
      } finally {
        globalPengaturanIstirahatLoadingPromise = null;
      }
    })();
  }, []);

  const refreshPengaturanIstirahat = async () => {
    // Clear cache and force refresh
    globalPengaturanIstirahatCache = null;
    globalPengaturanIstirahatCacheTime = 0;
    globalPengaturanIstirahatLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllPengaturanIstirahat();
      if (response.success && response.pengaturanIstirahat) {
        globalPengaturanIstirahatCache = response.pengaturanIstirahat;
        globalPengaturanIstirahatCacheTime = Date.now();
        setPengaturanIstirahat(response.pengaturanIstirahat);
      } else {
        setError(response.message || 'Gagal mengambil data pengaturan istirahat');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan istirahat');
      console.error('Error fetching pengaturan istirahat:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get active pengaturan istirahat
  const activePengaturanIstirahat = pengaturanIstirahat.find(p => p.isActive) || null;

  return { pengaturanIstirahat, loading, error, refreshPengaturanIstirahat, activePengaturanIstirahat };
};

// Export function to clear all cache (useful when logging out)
export const clearPengaturanIstirahatCache = () => {
  globalPengaturanIstirahatCache = null;
  globalPengaturanIstirahatCacheTime = 0;
  globalPengaturanIstirahatLoadingPromise = null;
};

