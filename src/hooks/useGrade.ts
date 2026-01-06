import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { PengaturanGrade } from '../types';

// Global cache untuk semua instance hook
let globalGradeCache: PengaturanGrade[] | null = null;
let globalGradeCacheTime: number = 0;
let globalGradeLoadingPromise: Promise<PengaturanGrade[]> | null = null;

const CACHE_DURATION = 600000; // 10 menit (600000 ms)

export const useGrade = () => {
  const [grade, setGrade] = useState<PengaturanGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalGradeCache && 
                      (Date.now() - globalGradeCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setGrade(globalGradeCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalGradeLoadingPromise) {
      globalGradeLoadingPromise
        .then(data => {
          setGrade(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data grade');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalGradeLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllGrade();
        if (response.success && response.grades) {
          // Update cache
          globalGradeCache = response.grades;
          globalGradeCacheTime = Date.now();
          
          setGrade(response.grades);
          setLoading(false);
          return response.grades;
        } else {
          throw new Error(response.message || 'Gagal mengambil data grade');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data grade');
        console.error('Error fetching grade:', err);
        setLoading(false);
        throw err;
      } finally {
        globalGradeLoadingPromise = null;
      }
    })();
  }, []);

  const refreshGrade = async () => {
    // Clear cache and force refresh
    globalGradeCache = null;
    globalGradeCacheTime = 0;
    globalGradeLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllGrade();
      if (response.success && response.grades) {
        globalGradeCache = response.grades;
        globalGradeCacheTime = Date.now();
        setGrade(response.grades);
      } else {
        setError(response.message || 'Gagal mengambil data grade');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data grade');
      console.error('Error fetching grade:', err);
    } finally {
      setLoading(false);
    }
  };

  return { grade, loading, error, refreshGrade };
};

// Export function to clear all cache (useful when logging out)
export const clearGradeCache = () => {
  globalGradeCache = null;
  globalGradeCacheTime = 0;
  globalGradeLoadingPromise = null;
};

