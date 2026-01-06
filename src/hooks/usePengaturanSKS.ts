import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { PengaturanSKS } from '../types';

// Global cache untuk semua instance hook
let globalPengaturanSKSCache: PengaturanSKS[] | null = null;
let globalPengaturanSKSCacheTime: number = 0;
let globalPengaturanSKSLoadingPromise: Promise<PengaturanSKS[]> | null = null;

const CACHE_DURATION = 600000; // 10 menit (600000 ms)

export const usePengaturanSKS = () => {
  const [pengaturanSKS, setPengaturanSKS] = useState<PengaturanSKS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalPengaturanSKSCache && 
                      (Date.now() - globalPengaturanSKSCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setPengaturanSKS(globalPengaturanSKSCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalPengaturanSKSLoadingPromise) {
      globalPengaturanSKSLoadingPromise
        .then(data => {
          setPengaturanSKS(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan SKS');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalPengaturanSKSLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllPengaturanSKS();
        if (response.success && response.pengaturanSKS) {
          // Update cache
          globalPengaturanSKSCache = response.pengaturanSKS;
          globalPengaturanSKSCacheTime = Date.now();
          
          setPengaturanSKS(response.pengaturanSKS);
          setLoading(false);
          return response.pengaturanSKS;
        } else {
          throw new Error(response.message || 'Gagal mengambil data pengaturan SKS');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan SKS');
        console.error('Error fetching pengaturan SKS:', err);
        setLoading(false);
        throw err;
      } finally {
        globalPengaturanSKSLoadingPromise = null;
      }
    })();
  }, []);

  const refreshPengaturanSKS = async () => {
    // Clear cache and force refresh
    globalPengaturanSKSCache = null;
    globalPengaturanSKSCacheTime = 0;
    globalPengaturanSKSLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllPengaturanSKS();
      if (response.success && response.pengaturanSKS) {
        globalPengaturanSKSCache = response.pengaturanSKS;
        globalPengaturanSKSCacheTime = Date.now();
        setPengaturanSKS(response.pengaturanSKS);
      } else {
        setError(response.message || 'Gagal mengambil data pengaturan SKS');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data pengaturan SKS');
      console.error('Error fetching pengaturan SKS:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get active pengaturan SKS
  const activePengaturanSKS = pengaturanSKS.find(p => p.isActive) || null;

  return { pengaturanSKS, loading, error, refreshPengaturanSKS, activePengaturanSKS };
};

// Export function to clear all cache (useful when logging out)
export const clearPengaturanSKSCache = () => {
  globalPengaturanSKSCache = null;
  globalPengaturanSKSCacheTime = 0;
  globalPengaturanSKSLoadingPromise = null;
};

