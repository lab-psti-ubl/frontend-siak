import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { JurnalTahfiz } from '../types';

// Global cache untuk semua instance hook
let globalJurnalTahfizCache: JurnalTahfiz[] | null = null;
let globalJurnalTahfizCacheTime: number = 0;
let globalJurnalTahfizLoadingPromise: Promise<JurnalTahfiz[]> | null = null;

const CACHE_DURATION = 2000000; // 5 menit (300000 ms)

interface JurnalTahfizParams {
  tanggal?: string;
  jadwalId?: string;
  kelasId?: string;
  tahun?: string;
}

export const useJurnalTahfiz = (params?: JurnalTahfizParams) => {
  const [jurnalTahfiz, setJurnalTahfiz] = useState<JurnalTahfiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if has filters
    const hasFilters = params?.tanggal || params?.jadwalId || params?.kelasId || params?.tahun;
    
    // Check cache validity (only for getAll, not for filtered queries)
    const cacheValid = globalJurnalTahfizCache && 
                      !hasFilters &&
                      (Date.now() - globalJurnalTahfizCacheTime) < CACHE_DURATION;

    if (cacheValid && globalJurnalTahfizCache) {
      // Use cached data only for getAll
      setJurnalTahfiz(globalJurnalTahfizCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it (only for getAll)
    if (globalJurnalTahfizLoadingPromise && !hasFilters) {
      globalJurnalTahfizLoadingPromise
        .then(data => {
          setJurnalTahfiz(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data jurnal tahfiz');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        let response;
      if (params?.tanggal && params?.jadwalId) {
        // Fetch by jadwalId and tanggal (single jurnal)
        response = await apiService.getJurnalTahfizByJadwalIdAndTanggal(
          params.jadwalId,
          params.tanggal,
          params.kelasId
        );
          if (response.success) {
            setJurnalTahfiz(response.jurnalTahfiz ? [response.jurnalTahfiz] : []);
          } else {
            throw new Error(response.message || 'Gagal mengambil data jurnal tahfiz');
          }
        } else if (hasFilters) {
          // Fetch with filters - use getJurnalTahfizByJadwalIdAndTanggal if jadwalId and tanggal provided
          if (params?.jadwalId && params?.tanggal) {
            response = await apiService.getJurnalTahfizByJadwalIdAndTanggal(
              params.jadwalId,
              params.tanggal,
              params.kelasId
            );
            if (response.success && response.jurnalTahfiz) {
              setJurnalTahfiz(Array.isArray(response.jurnalTahfiz) ? response.jurnalTahfiz : [response.jurnalTahfiz]);
            } else {
              throw new Error(response.message || 'Gagal mengambil data jurnal tahfiz');
            }
          } else {
            // For other filters, fetch all and filter client-side
            const allResponse = await apiService.getAllJurnalTahfiz();
            if (allResponse.success && allResponse.jurnalTahfiz) {
              let filtered = allResponse.jurnalTahfiz;
              if (params?.kelasId) {
                filtered = filtered.filter(j => j.kelasId === params.kelasId);
              }
              if (params?.tahun) {
                filtered = filtered.filter(j => j.tahun === params.tahun);
              }
              setJurnalTahfiz(filtered);
            } else {
              throw new Error(allResponse.message || 'Gagal mengambil data jurnal tahfiz');
            }
          }
        } else {
          // Fetch all
          if (!globalJurnalTahfizLoadingPromise) {
            globalJurnalTahfizLoadingPromise = (async () => {
              const resp = await apiService.getAllJurnalTahfiz();
              if (resp.success && resp.jurnalTahfiz) {
                globalJurnalTahfizCache = resp.jurnalTahfiz;
                globalJurnalTahfizCacheTime = Date.now();
                return resp.jurnalTahfiz;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data jurnal tahfiz');
              }
            })();
          }
          const data = await globalJurnalTahfizLoadingPromise;
          globalJurnalTahfizLoadingPromise = null;
          setJurnalTahfiz(data);
          setLoading(false);
          return;
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data jurnal tahfiz');
        console.error('Error fetching jurnal tahfiz:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.tanggal, params?.jadwalId, params?.kelasId, params?.tahun]);

  const refreshJurnalTahfiz = async () => {
    // Clear cache and force refresh
    globalJurnalTahfizCache = null;
    globalJurnalTahfizCacheTime = 0;
    globalJurnalTahfizLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      const hasFilters = params?.tanggal || params?.jadwalId || params?.kelasId || params?.tahun;
      
      if (params?.tanggal && params?.jadwalId) {
        response = await apiService.getJurnalTahfizByJadwalIdAndTanggal(
          params.jadwalId,
          params.tanggal,
          params.kelasId
        );
        if (response.success) {
          setJurnalTahfiz(response.jurnalTahfiz ? [response.jurnalTahfiz] : []);
        } else {
          throw new Error(response.message || 'Gagal mengambil data jurnal tahfiz');
        }
      } else if (hasFilters) {
        // Fetch with filters - use getJurnalTahfizByJadwalIdAndTanggal if jadwalId and tanggal provided
        if (params?.jadwalId && params?.tanggal) {
          response = await apiService.getJurnalTahfizByJadwalIdAndTanggal(
            params.jadwalId,
            params.tanggal,
            params.kelasId
          );
          if (response.success && response.jurnalTahfiz) {
            setJurnalTahfiz(Array.isArray(response.jurnalTahfiz) ? response.jurnalTahfiz : [response.jurnalTahfiz]);
          } else {
            throw new Error(response.message || 'Gagal mengambil data jurnal tahfiz');
          }
        } else {
          // For other filters, fetch all and filter client-side
          const allResponse = await apiService.getAllJurnalTahfiz();
          if (allResponse.success && allResponse.jurnalTahfiz) {
            let filtered = allResponse.jurnalTahfiz;
            if (params?.kelasId) {
              filtered = filtered.filter(j => j.kelasId === params.kelasId);
            }
            if (params?.tahun) {
              filtered = filtered.filter(j => j.tahun === params.tahun);
            }
            setJurnalTahfiz(filtered);
          } else {
            throw new Error(allResponse.message || 'Gagal mengambil data jurnal tahfiz');
          }
        }
      } else {
        response = await apiService.getAllJurnalTahfiz();
        if (response.success && response.jurnalTahfiz) {
          globalJurnalTahfizCache = response.jurnalTahfiz;
          globalJurnalTahfizCacheTime = Date.now();
          setJurnalTahfiz(response.jurnalTahfiz);
        } else {
          throw new Error(response.message || 'Gagal mengambil data jurnal tahfiz');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data jurnal tahfiz');
      console.error('Error fetching jurnal tahfiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const createJurnalTahfiz = async (data: Partial<JurnalTahfiz>) => {
    try {
      const response = await apiService.createJurnalTahfiz(data);
      if (response.success && response.jurnalTahfiz) {
        // Invalidate cache immediately
        globalJurnalTahfizCache = null;
        globalJurnalTahfizCacheTime = 0;
        globalJurnalTahfizLoadingPromise = null;
        
        // Immediately update state with new jurnal
        setJurnalTahfiz(prev => {
          // Check if jurnal already exists
          const exists = prev.some(j => j.id === response.jurnalTahfiz?.id);
          if (exists) {
            return prev.map(j => j.id === response.jurnalTahfiz?.id ? response.jurnalTahfiz : j);
          }
          return [...prev, response.jurnalTahfiz];
        });
        
        return response.jurnalTahfiz;
      } else {
        throw new Error(response.message || 'Gagal membuat jurnal tahfiz');
      }
    } catch (err: any) {
      console.error('Error creating jurnal tahfiz:', err);
      throw err;
    }
  };

  const updateJurnalTahfiz = async (id: string, data: Partial<JurnalTahfiz>) => {
    try {
      const response = await apiService.updateJurnalTahfiz(id, data);
      if (response.success && response.jurnalTahfiz) {
        // Invalidate cache
        globalJurnalTahfizCache = null;
        globalJurnalTahfizCacheTime = 0;
        globalJurnalTahfizLoadingPromise = null;
        
        // Immediately update state with updated jurnal
        setJurnalTahfiz(prev => 
          prev.map(j => j.id === id ? response.jurnalTahfiz : j)
        );
        
        return response.jurnalTahfiz;
      } else {
        throw new Error(response.message || 'Gagal memperbarui jurnal tahfiz');
      }
    } catch (err: any) {
      console.error('Error updating jurnal tahfiz:', err);
      throw err;
    }
  };

  const deleteJurnalTahfiz = async (id: string) => {
    try {
      const response = await apiService.deleteJurnalTahfiz(id);
      if (response.success) {
        // Invalidate cache
        globalJurnalTahfizCache = null;
        globalJurnalTahfizCacheTime = 0;
        globalJurnalTahfizLoadingPromise = null;
        
        // Immediately update state
        setJurnalTahfiz(prev => prev.filter(j => j.id !== id));
        return true;
      } else {
        throw new Error(response.message || 'Gagal menghapus jurnal tahfiz');
      }
    } catch (err: any) {
      console.error('Error deleting jurnal tahfiz:', err);
      throw err;
    }
  };

  return { jurnalTahfiz, loading, error, refreshJurnalTahfiz, createJurnalTahfiz, updateJurnalTahfiz, deleteJurnalTahfiz };
};

// Export function to clear all cache (useful when logging out)
export const clearJurnalTahfizCache = () => {
  globalJurnalTahfizCache = null;
  globalJurnalTahfizCacheTime = 0;
  globalJurnalTahfizLoadingPromise = null;
};

