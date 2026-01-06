import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { PengaturanKomponenNilai } from '../types';

// Global cache untuk semua instance hook
let globalKomponenNilaiCache: PengaturanKomponenNilai[] | null = null;
let globalKomponenNilaiCacheTime: number = 0;
let globalKomponenNilaiLoadingPromise: Promise<PengaturanKomponenNilai[]> | null = null;

const CACHE_DURATION = 1800000; // 10 menit (600000 ms)

export const useKomponenNilai = () => {
  const [komponenNilai, setKomponenNilai] = useState<PengaturanKomponenNilai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalKomponenNilaiCache && 
                      (Date.now() - globalKomponenNilaiCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setKomponenNilai(globalKomponenNilaiCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalKomponenNilaiLoadingPromise) {
      globalKomponenNilaiLoadingPromise
        .then(data => {
          setKomponenNilai(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data komponen nilai');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalKomponenNilaiLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllKomponenNilai();
        if (response.success && response.komponenNilai) {
          // Update cache
          globalKomponenNilaiCache = response.komponenNilai;
          globalKomponenNilaiCacheTime = Date.now();
          
          setKomponenNilai(response.komponenNilai);
          setLoading(false);
          return response.komponenNilai;
        } else {
          throw new Error(response.message || 'Gagal mengambil data komponen nilai');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data komponen nilai');
        console.error('Error fetching komponen nilai:', err);
        setLoading(false);
        throw err;
      } finally {
        globalKomponenNilaiLoadingPromise = null;
      }
    })();
  }, []);

  const refreshKomponenNilai = async () => {
    // Clear cache and force refresh
    globalKomponenNilaiCache = null;
    globalKomponenNilaiCacheTime = 0;
    globalKomponenNilaiLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllKomponenNilai();
      if (response.success && response.komponenNilai) {
        globalKomponenNilaiCache = response.komponenNilai;
        globalKomponenNilaiCacheTime = Date.now();
        setKomponenNilai(response.komponenNilai);
      } else {
        setError(response.message || 'Gagal mengambil data komponen nilai');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data komponen nilai');
      console.error('Error fetching komponen nilai:', err);
    } finally {
      setLoading(false);
    }
  };

  return { komponenNilai, loading, error, refreshKomponenNilai };
};

// Export function to clear all cache (useful when logging out)
export const clearKomponenNilaiCache = () => {
  globalKomponenNilaiCache = null;
  globalKomponenNilaiCacheTime = 0;
  globalKomponenNilaiLoadingPromise = null;
};
