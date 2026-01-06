import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { TahunAjaran } from '../types';

// Global cache untuk semua instance hook
let globalTahunAjaranCache: TahunAjaran[] | null = null;
let globalTahunAjaranCacheTime: number = 0;
let globalTahunAjaranLoadingPromise: Promise<TahunAjaran[]> | null = null;
let cacheUpdateListeners: Set<() => void> = new Set();

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

// Fungsi untuk invalidate cache dari luar hook
export const invalidateTahunAjaranCache = () => {
  globalTahunAjaranCache = null;
  globalTahunAjaranCacheTime = 0;
  globalTahunAjaranLoadingPromise = null;
  // Notify all listeners to refresh
  cacheUpdateListeners.forEach(listener => listener());
};

// Fungsi untuk refresh cache dari luar hook
export const refreshTahunAjaranCache = async (): Promise<TahunAjaran[]> => {
  invalidateTahunAjaranCache();
  
  try {
    const response = await apiService.getAllTahunAjaran();
    if (response.success && response.tahunAjaran) {
      globalTahunAjaranCache = response.tahunAjaran;
      globalTahunAjaranCacheTime = Date.now();
      // Notify all listeners
      cacheUpdateListeners.forEach(listener => listener());
      return response.tahunAjaran;
    } else {
      throw new Error(response.message || 'Gagal mengambil data tahun ajaran');
    }
  } catch (err: any) {
    console.error('Error refreshing tahun ajaran cache:', err);
    throw err;
  }
};

export const useTahunAjaran = () => {
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Register listener untuk cache updates
  useEffect(() => {
    const listener = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    cacheUpdateListeners.add(listener);
    return () => {
      cacheUpdateListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalTahunAjaranCache && 
                      (Date.now() - globalTahunAjaranCacheTime) < CACHE_DURATION;

    if (cacheValid && globalTahunAjaranCache) {
      // Use cached data (sudah termasuk tanggal akademik: tanggalMulai, tanggalSelesai)
      setTahunAjaran(globalTahunAjaranCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalTahunAjaranLoadingPromise) {
      globalTahunAjaranLoadingPromise
        .then(data => {
          setTahunAjaran(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data tahun ajaran');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalTahunAjaranLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllTahunAjaran();
        if (response.success && response.tahunAjaran) {
          // Update cache dengan data lengkap termasuk tanggal akademik (tanggalMulai, tanggalSelesai)
          // Cache ini akan digunakan oleh semua komponen yang membutuhkan data tahun ajaran
          globalTahunAjaranCache = response.tahunAjaran;
          globalTahunAjaranCacheTime = Date.now();
          
          setTahunAjaran(response.tahunAjaran);
          setLoading(false);
          return response.tahunAjaran;
        } else {
          throw new Error(response.message || 'Gagal mengambil data tahun ajaran');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data tahun ajaran');
        console.error('Error fetching tahun ajaran:', err);
        setLoading(false);
        throw err;
      } finally {
        globalTahunAjaranLoadingPromise = null;
      }
    })();
  }, [refreshTrigger]);

  const refreshTahunAjaran = async () => {
    // Clear cache and force refresh
    globalTahunAjaranCache = null;
    globalTahunAjaranCacheTime = 0;
    globalTahunAjaranLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllTahunAjaran();
      if (response.success && response.tahunAjaran) {
        globalTahunAjaranCache = response.tahunAjaran;
        globalTahunAjaranCacheTime = Date.now();
        setTahunAjaran(response.tahunAjaran);
        // Notify all listeners
        cacheUpdateListeners.forEach(listener => listener());
      } else {
        setError(response.message || 'Gagal mengambil data tahun ajaran');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data tahun ajaran');
      console.error('Error fetching tahun ajaran:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get active tahun ajaran
  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive) || null;

  // Helper to get tahun ajaran by tahun and semester (with academic calendar dates)
  const getTahunAjaranByTahunAndSemester = (tahun: string, semester: number): TahunAjaran | null => {
    return tahunAjaran.find(ta => ta.tahun === tahun && ta.semester === semester) || null;
  };

  // Helper to get academic calendar dates for a specific tahun ajaran and semester
  const getAcademicCalendarDates = (tahun: string, semester: number): { tanggalMulai: string; tanggalSelesai: string } | null => {
    const taData = getTahunAjaranByTahunAndSemester(tahun, semester);
    if (taData && taData.tanggalMulai && taData.tanggalSelesai) {
      return {
        tanggalMulai: taData.tanggalMulai,
        tanggalSelesai: taData.tanggalSelesai
      };
    }
    return null;
  };

  return { 
    tahunAjaran, 
    loading, 
    error, 
    refreshTahunAjaran, 
    activeTahunAjaran,
    getTahunAjaranByTahunAndSemester,
    getAcademicCalendarDates
  };
};

// Export function to clear all cache (useful when logging out)
export const clearTahunAjaranCache = () => {
  invalidateTahunAjaranCache();
};

