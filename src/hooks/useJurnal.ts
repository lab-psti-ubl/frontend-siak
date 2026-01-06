import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export interface Pertemuan {
  tanggal: string;
  judul: string;
  deskripsi: string;
  waktuInput: string;
  file?: {
    name: string;
    type: string;
    data: string;
    size: number;
  };
}

export interface Jurnal {
  id: string;
  jadwalId: string;
  kelasId: string;
  // Old structure fields (for backward compatibility)
  tanggal?: string;
  judul?: string;
  deskripsi?: string;
  waktuInput?: string;
  file?: {
    name: string;
    type: string;
    data: string;
    size: number;
  };
  // New structure field
  pertemuan?: Pertemuan[];
  tahunAjaranId: string;
  semester: number;
  createdAt: string;
  updatedAt: string;
}

// Global cache untuk semua instance hook
let globalJurnalCache: Jurnal[] | null = null;
let globalJurnalCacheTime: number = 0;
let globalJurnalLoadingPromise: Promise<Jurnal[]> | null = null;

const CACHE_DURATION = 2000000; // 5 menit (300000 ms)

interface JurnalParams {
  tanggal?: string;
  jadwalId?: string;
  kelasId?: string;
  tahunAjaranId?: string;
  semester?: number;
  createdBy?: string;
}

export const useJurnal = (params?: JurnalParams) => {
  const [jurnal, setJurnal] = useState<Jurnal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if has filters
    const hasFilters = params?.tanggal || params?.jadwalId || params?.kelasId || params?.tahunAjaranId || params?.semester || params?.createdBy;
    
    // Check cache validity (only for getAll, not for filtered queries)
    const cacheValid = globalJurnalCache && 
                      !hasFilters &&
                      (Date.now() - globalJurnalCacheTime) < CACHE_DURATION;

    if (cacheValid && globalJurnalCache) {
      // Use cached data only for getAll
      setJurnal(globalJurnalCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it (only for getAll)
    if (globalJurnalLoadingPromise && !hasFilters) {
      globalJurnalLoadingPromise
        .then(data => {
          setJurnal(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data jurnal');
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
        response = await apiService.getJurnalByJadwalIdAndTanggal(
          params.jadwalId,
          params.tanggal,
          params.kelasId
        );
          if (response.success) {
            setJurnal(response.jurnal ? [response.jurnal] : []);
          } else {
            throw new Error(response.message || 'Gagal mengambil data jurnal');
          }
        } else if (hasFilters) {
          // Fetch with filters - use getJurnalByJadwalIdAndTanggal if jadwalId and tanggal provided
          if (params?.jadwalId && params?.tanggal) {
            response = await apiService.getJurnalByJadwalIdAndTanggal(
              params.jadwalId,
              params.tanggal,
              params.kelasId
            );
            if (response.success && response.jurnal) {
              setJurnal(Array.isArray(response.jurnal) ? response.jurnal : [response.jurnal]);
            } else {
              throw new Error(response.message || 'Gagal mengambil data jurnal');
            }
          } else {
            // For other filters, fetch all and filter client-side
            const allResponse = await apiService.getAllJurnal();
            if (allResponse.success && allResponse.jurnal) {
              let filtered = allResponse.jurnal;
              if (params?.kelasId) {
                filtered = filtered.filter(j => j.kelasId === params.kelasId);
              }
              if (params?.tahunAjaranId) {
                filtered = filtered.filter(j => j.tahunAjaranId === params.tahunAjaranId);
              }
              if (params?.semester !== undefined) {
                filtered = filtered.filter(j => j.semester === params.semester);
              }
              if (params?.createdBy) {
                filtered = filtered.filter(j => j.createdBy === params.createdBy);
              }
              setJurnal(filtered);
            } else {
              throw new Error(allResponse.message || 'Gagal mengambil data jurnal');
            }
          }
        } else {
          // Fetch all
          if (!globalJurnalLoadingPromise) {
            globalJurnalLoadingPromise = (async () => {
              const resp = await apiService.getAllJurnal();
              if (resp.success && resp.jurnal) {
                globalJurnalCache = resp.jurnal;
                globalJurnalCacheTime = Date.now();
                return resp.jurnal;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data jurnal');
              }
            })();
          }
          const data = await globalJurnalLoadingPromise;
          globalJurnalLoadingPromise = null;
          setJurnal(data);
          setLoading(false);
          return;
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data jurnal');
        console.error('Error fetching jurnal:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.tanggal, params?.jadwalId, params?.kelasId, params?.tahunAjaranId, params?.semester, params?.createdBy]);

  const refreshJurnal = async () => {
    // Clear cache and force refresh
    globalJurnalCache = null;
    globalJurnalCacheTime = 0;
    globalJurnalLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      const hasFilters = params?.tanggal || params?.jadwalId || params?.kelasId || params?.tahunAjaranId || params?.semester || params?.createdBy;
      
      if (params?.tanggal && params?.jadwalId) {
        response = await apiService.getJurnalByJadwalIdAndTanggal(
          params.jadwalId,
          params.tanggal,
          params.kelasId
        );
        if (response.success) {
          setJurnal(response.jurnal ? [response.jurnal] : []);
        } else {
          throw new Error(response.message || 'Gagal mengambil data jurnal');
        }
      } else if (hasFilters) {
        // Fetch with filters - use getJurnalByJadwalIdAndTanggal if jadwalId and tanggal provided
        if (params?.jadwalId && params?.tanggal) {
          response = await apiService.getJurnalByJadwalIdAndTanggal(
            params.jadwalId,
            params.tanggal,
            params.kelasId
          );
          if (response.success && response.jurnal) {
            setJurnal(Array.isArray(response.jurnal) ? response.jurnal : [response.jurnal]);
          } else {
            throw new Error(response.message || 'Gagal mengambil data jurnal');
          }
        } else {
          // For other filters, fetch all and filter client-side
          const allResponse = await apiService.getAllJurnal();
          if (allResponse.success && allResponse.jurnal) {
            let filtered = allResponse.jurnal;
            if (params?.kelasId) {
              filtered = filtered.filter(j => j.kelasId === params.kelasId);
            }
            if (params?.tahunAjaranId) {
              filtered = filtered.filter(j => j.tahunAjaranId === params.tahunAjaranId);
            }
            if (params?.semester !== undefined) {
              filtered = filtered.filter(j => j.semester === params.semester);
            }
            if (params?.createdBy) {
              filtered = filtered.filter(j => j.createdBy === params.createdBy);
            }
            setJurnal(filtered);
          } else {
            throw new Error(allResponse.message || 'Gagal mengambil data jurnal');
          }
        }
      } else {
        response = await apiService.getAllJurnal();
        if (response.success && response.jurnal) {
          globalJurnalCache = response.jurnal;
          globalJurnalCacheTime = Date.now();
          setJurnal(response.jurnal);
        } else {
          throw new Error(response.message || 'Gagal mengambil data jurnal');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data jurnal');
      console.error('Error fetching jurnal:', err);
    } finally {
      setLoading(false);
    }
  };

  const createJurnal = async (data: Partial<Jurnal>) => {
    try {
      const response = await apiService.createJurnal(data);
      if (response.success && response.jurnal) {
        // Invalidate cache immediately
        globalJurnalCache = null;
        globalJurnalCacheTime = 0;
        globalJurnalLoadingPromise = null;
        
        // Immediately update state with new jurnal
        setJurnal(prev => {
          // Check if jurnal already exists
          const exists = prev.some(j => j.id === response.jurnal?.id);
          if (exists) {
            return prev.map(j => j.id === response.jurnal?.id ? response.jurnal : j);
          }
          return [...prev, response.jurnal];
        });
        
        return response.jurnal;
      } else {
        throw new Error(response.message || 'Gagal membuat jurnal');
      }
    } catch (err: any) {
      console.error('Error creating jurnal:', err);
      throw err;
    }
  };

  const updateJurnal = async (id: string, data: Partial<Jurnal>) => {
    try {
      const response = await apiService.updateJurnal(id, data);
      if (response.success && response.jurnal) {
        // Invalidate cache
        globalJurnalCache = null;
        globalJurnalCacheTime = 0;
        globalJurnalLoadingPromise = null;
        
        // Immediately update state with updated jurnal
        setJurnal(prev => 
          prev.map(j => j.id === id ? response.jurnal : j)
        );
        
        return response.jurnal;
      } else {
        throw new Error(response.message || 'Gagal memperbarui jurnal');
      }
    } catch (err: any) {
      console.error('Error updating jurnal:', err);
      throw err;
    }
  };

  const deleteJurnal = async (id: string) => {
    try {
      const response = await apiService.deleteJurnal(id);
      if (response.success) {
        // Invalidate cache
        globalJurnalCache = null;
        globalJurnalCacheTime = 0;
        globalJurnalLoadingPromise = null;
        
        // Immediately update state
        setJurnal(prev => prev.filter(j => j.id !== id));
        return true;
      } else {
        throw new Error(response.message || 'Gagal menghapus jurnal');
      }
    } catch (err: any) {
      console.error('Error deleting jurnal:', err);
      throw err;
    }
  };

  return { jurnal, loading, error, refreshJurnal, createJurnal, updateJurnal, deleteJurnal };
};

// Export function to clear all cache (useful when logging out)
export const clearJurnalCache = () => {
  globalJurnalCache = null;
  globalJurnalCacheTime = 0;
  globalJurnalLoadingPromise = null;
};

