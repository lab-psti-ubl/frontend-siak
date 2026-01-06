import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { Nilai } from '../types';

// Global cache untuk semua instance hook
let globalNilaiCache: Nilai[] | null = null;
let globalNilaiCacheTime: number = 0;
let globalNilaiLoadingPromise: Promise<Nilai[]> | null = null;

const CACHE_DURATION = 1500000; // 5 menit (300000 ms)

interface UseNilaiOptions {
  guruId?: string;
  kelasId?: string;
  mataPelajaranId?: string;
  muridId?: string;
  semester?: number;
  tahunAjaran?: string;
}

export const useNilai = (options: UseNilaiOptions = {}) => {
  const [nilai, setNilai] = useState<Nilai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNilai = useCallback(async (forceRefresh = false) => {
    // Check cache validity
    const cacheValid = !forceRefresh && globalNilaiCache && 
                      (Date.now() - globalNilaiCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Filter cached data based on options
      let filteredNilai = globalNilaiCache!;
      if (options.guruId) filteredNilai = filteredNilai.filter(n => n.guruId === options.guruId);
      if (options.kelasId) filteredNilai = filteredNilai.filter(n => n.kelasId === options.kelasId);
      if (options.mataPelajaranId) filteredNilai = filteredNilai.filter(n => n.mataPelajaranId === options.mataPelajaranId);
      if (options.muridId) filteredNilai = filteredNilai.filter(n => n.muridId === options.muridId);
      if (options.semester) filteredNilai = filteredNilai.filter(n => n.semester === options.semester);
      if (options.tahunAjaran) filteredNilai = filteredNilai.filter(n => n.tahunAjaran === options.tahunAjaran);
      
      setNilai(filteredNilai);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalNilaiLoadingPromise && !forceRefresh) {
      try {
        const data = await globalNilaiLoadingPromise;
        let filteredNilai = data;
        if (options.guruId) filteredNilai = filteredNilai.filter(n => n.guruId === options.guruId);
        if (options.kelasId) filteredNilai = filteredNilai.filter(n => n.kelasId === options.kelasId);
        if (options.mataPelajaranId) filteredNilai = filteredNilai.filter(n => n.mataPelajaranId === options.mataPelajaranId);
        if (options.muridId) filteredNilai = filteredNilai.filter(n => n.muridId === options.muridId);
        if (options.semester) filteredNilai = filteredNilai.filter(n => n.semester === options.semester);
        if (options.tahunAjaran) filteredNilai = filteredNilai.filter(n => n.tahunAjaran === options.tahunAjaran);
        
        setNilai(filteredNilai);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data nilai');
        setLoading(false);
      }
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalNilaiLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllNilai();
        if (response.success && response.nilai) {
          // Update cache
          globalNilaiCache = response.nilai;
          globalNilaiCacheTime = Date.now();
          return response.nilai;
        } else {
          throw new Error(response.message || 'Gagal mengambil data nilai');
        }
      } finally {
        globalNilaiLoadingPromise = null;
      }
    })();

    try {
      const data = await globalNilaiLoadingPromise;
      let filteredNilai = data;
      if (options.guruId) filteredNilai = filteredNilai.filter(n => n.guruId === options.guruId);
      if (options.kelasId) filteredNilai = filteredNilai.filter(n => n.kelasId === options.kelasId);
      if (options.mataPelajaranId) filteredNilai = filteredNilai.filter(n => n.mataPelajaranId === options.mataPelajaranId);
      if (options.muridId) filteredNilai = filteredNilai.filter(n => n.muridId === options.muridId);
      if (options.semester) filteredNilai = filteredNilai.filter(n => n.semester === options.semester);
      if (options.tahunAjaran) filteredNilai = filteredNilai.filter(n => n.tahunAjaran === options.tahunAjaran);
      
      setNilai(filteredNilai);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data nilai');
      setLoading(false);
    }
  }, [options.guruId, options.kelasId, options.mataPelajaranId, options.muridId, options.semester, options.tahunAjaran]);

  useEffect(() => {
    fetchNilai();
  }, [fetchNilai]);

  const refreshNilai = useCallback(async () => {
    // Clear cache and force refresh
    globalNilaiCache = null;
    globalNilaiCacheTime = 0;
    globalNilaiLoadingPromise = null;
    await fetchNilai(true);
  }, [fetchNilai]);

  const createNilai = async (nilaiData: Omit<Nilai, 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiService.createNilai(nilaiData);
      if (response.success) {
        // Update cache
        if (globalNilaiCache) {
          globalNilaiCache = [...globalNilaiCache, response.nilai];
        }
        await refreshNilai();
        return response;
      }
      throw new Error(response.message || 'Gagal membuat nilai');
    } catch (err: any) {
      throw err;
    }
  };

  const updateNilai = async (id: string, updates: Partial<Nilai>) => {
    try {
      const response = await apiService.updateNilai(id, updates);
      if (response.success) {
        // Update cache
        if (globalNilaiCache) {
          globalNilaiCache = globalNilaiCache.map(n => n.id === id ? response.nilai : n);
        }
        await refreshNilai();
        return response;
      }
      throw new Error(response.message || 'Gagal mengupdate nilai');
    } catch (err: any) {
      throw err;
    }
  };

  const deleteNilai = async (id: string) => {
    try {
      const response = await apiService.deleteNilai(id);
      if (response.success) {
        // Update cache
        if (globalNilaiCache) {
          globalNilaiCache = globalNilaiCache.filter(n => n.id !== id);
        }
        await refreshNilai();
        return response;
      }
      throw new Error(response.message || 'Gagal menghapus nilai');
    } catch (err: any) {
      throw err;
    }
  };

  const upsertNilai = async (nilaiData: Nilai) => {
    try {
      const response = await apiService.upsertNilai(nilaiData);
      if (response.success) {
        await refreshNilai();
        return response;
      }
      throw new Error(response.message || 'Gagal menyimpan nilai');
    } catch (err: any) {
      throw err;
    }
  };

  const bulkUpsertNilai = async (nilaiList: Nilai[]) => {
    try {
      const response = await apiService.bulkUpsertNilai(nilaiList);
      if (response.success) {
        await refreshNilai();
        return response;
      }
      throw new Error(response.message || 'Gagal menyimpan nilai');
    } catch (err: any) {
      throw err;
    }
  };

  // Helper to update local state optimistically
  const setNilaiLocal = (updater: Nilai[] | ((prev: Nilai[]) => Nilai[])) => {
    if (typeof updater === 'function') {
      setNilai(updater);
      if (globalNilaiCache) {
        globalNilaiCache = updater(globalNilaiCache);
      }
    } else {
      setNilai(updater);
      globalNilaiCache = updater;
    }
  };

  return { 
    nilai, 
    setNilai: setNilaiLocal,
    loading, 
    error, 
    refreshNilai,
    createNilai,
    updateNilai,
    deleteNilai,
    upsertNilai,
    bulkUpsertNilai,
  };
};

// Export function to clear cache (useful when logging out)
export const clearNilaiCache = () => {
  globalNilaiCache = null;
  globalNilaiCacheTime = 0;
  globalNilaiLoadingPromise = null;
};



