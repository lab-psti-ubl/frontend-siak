import { useState, useEffect } from 'react';
import * as React from 'react';
import { apiService } from '../services/apiService';
import { SesiAbsensiTahfiz } from '../types';

// Global cache untuk semua instance hook
let globalSesiAbsensiTahfizCache: SesiAbsensiTahfiz[] | null = null;
let globalSesiAbsensiTahfizCacheTime: number = 0;
let globalSesiAbsensiTahfizLoadingPromise: Promise<SesiAbsensiTahfiz[]> | null = null;

const CACHE_DURATION = 2000000; // 5 menit (300000 ms) - shorter cache for session data

interface SesiAbsensiTahfizParams {
  tanggal?: string;
  jadwalId?: string;
  createdBy?: string;
}

export type SesiAbsensiTahfizRefreshOptions = {
  waitForWorker?: {
    sesiId?: string;
    muridId?: string;
    expectedData?: {
      status?: string;
      keterangan?: string;
      waktu?: string;
    };
  };
  maxAttempts?: number;
  delayMs?: number;
};

type RefreshOptions = SesiAbsensiTahfizRefreshOptions;

export const useSesiAbsensiTahfiz = (params?: SesiAbsensiTahfizParams) => {
  const [sesiAbsensiTahfiz, setSesiAbsensiTahfiz] = useState<SesiAbsensiTahfiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncingWithWorker, setIsSyncingWithWorker] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Store current params for refresh function
  const currentParamsRef = React.useRef(params);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const waitForWorkerPersistence = async (opts: RefreshOptions['waitForWorker'], attempts = 12, delayMs = 1000) => {
    if (!opts?.sesiId || !opts?.muridId) return;

    const expectedData = opts.expectedData;
    const hasExpectedData = expectedData && (expectedData.status || expectedData.keterangan || expectedData.waktu);

    for (let i = 0; i < attempts; i++) {
      try {
        const response = await apiService.getSesiAbsensiTahfizById(opts.sesiId);
        if (response.success && response.sesiAbsensiTahfiz) {
          // Check if the absensi for this murid exists in dataAbsensi
          const absensi = response.sesiAbsensiTahfiz.dataAbsensi?.find(a => a.muridId === opts.muridId);
          if (absensi) {
            // If we have expected data, verify that the data matches
            if (hasExpectedData) {
              let dataMatches = true;
              
              // Check status match
              if (expectedData.status && absensi.status !== expectedData.status) {
                dataMatches = false;
              }
              
              // Check keterangan match (allow empty string or undefined)
              if (expectedData.keterangan !== undefined) {
                const absensiKeterangan = absensi.keterangan || '';
                const expectedKeterangan = expectedData.keterangan || '';
                if (absensiKeterangan !== expectedKeterangan) {
                  dataMatches = false;
                }
              }
              
              // Check waktu match (if provided, check if it's close - within 5 seconds)
              if (expectedData.waktu) {
                const absensiWaktu = new Date(absensi.waktu).getTime();
                const expectedWaktu = new Date(expectedData.waktu).getTime();
                const timeDiff = Math.abs(absensiWaktu - expectedWaktu);
                if (timeDiff > 5000) { // 5 seconds tolerance
                  dataMatches = false;
                }
              }
              
              if (dataMatches) {
                console.log('✅ Worker persistence verified: data matches expected values');
                return response.sesiAbsensiTahfiz;
              } else {
                // Data exists but doesn't match yet, continue waiting
                console.log(`⏳ Waiting for worker to update data (attempt ${i + 1}/${attempts})...`);
              }
            } else {
              // No expected data, just check existence
              return response.sesiAbsensiTahfiz;
            }
          }
        }
      } catch (err) {
        console.warn(`Waiting for worker persistence (attempt ${i + 1}/${attempts})...`, err);
      }
      if (i < attempts - 1) {
        await sleep(delayMs);
      }
    }
    console.warn('Worker persistence timeout: data may not be available yet or does not match expected values');
  };

  useEffect(() => {
    currentParamsRef.current = params;
    
    // Check if has filters
    const hasFilters = params?.tanggal || params?.jadwalId || params?.createdBy;
    
    // Check cache validity (only for getAll, not for filtered queries)
    const cacheValid = globalSesiAbsensiTahfizCache && 
                      !hasFilters &&
                      (Date.now() - globalSesiAbsensiTahfizCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data only for getAll
      setSesiAbsensiTahfiz(globalSesiAbsensiTahfizCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it (only for getAll)
    if (globalSesiAbsensiTahfizLoadingPromise && !hasFilters) {
      globalSesiAbsensiTahfizLoadingPromise
        .then(data => {
          setSesiAbsensiTahfiz(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi tahfiz');
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
        if (hasFilters) {
          // Fetch with filters
          response = await apiService.getSesiAbsensiTahfizByTanggal(params?.tanggal, params?.jadwalId, params?.createdBy);
        } else {
          // Fetch all
          if (!globalSesiAbsensiTahfizLoadingPromise) {
            globalSesiAbsensiTahfizLoadingPromise = (async () => {
              const resp = await apiService.getAllSesiAbsensiTahfiz();
              if (resp.success && resp.sesiAbsensiTahfiz) {
                globalSesiAbsensiTahfizCache = resp.sesiAbsensiTahfiz;
                globalSesiAbsensiTahfizCacheTime = Date.now();
                return resp.sesiAbsensiTahfiz;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data sesi absensi tahfiz');
              }
            })();
          }
          const data = await globalSesiAbsensiTahfizLoadingPromise;
          globalSesiAbsensiTahfizLoadingPromise = null;
          setSesiAbsensiTahfiz(data);
          setLoading(false);
          return;
        }

        if (response.success && response.sesiAbsensiTahfiz) {
          setSesiAbsensiTahfiz(response.sesiAbsensiTahfiz);
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data sesi absensi tahfiz');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi tahfiz');
        console.error('Error fetching sesi absensi tahfiz:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.tanggal, params?.jadwalId, params?.createdBy]);

  const refreshSesiAbsensiTahfiz = async (options?: RefreshOptions) => {
    const shouldWaitForWorker = !!options?.waitForWorker?.sesiId && !!options?.waitForWorker?.muridId;
    if (shouldWaitForWorker) {
      setIsSyncingWithWorker(true);
      setSyncMessage('Menunggu worker menyimpan data absensi tahfiz...');
      await waitForWorkerPersistence(
        options?.waitForWorker,
        options?.maxAttempts,
        options?.delayMs,
      );
      setSyncMessage('Memuat ulang data sesi absensi tahfiz...');
    }

    // Clear cache and force refresh
    globalSesiAbsensiTahfizCache = null;
    globalSesiAbsensiTahfizCacheTime = 0;
    globalSesiAbsensiTahfizLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    const currentParams = currentParamsRef.current;
    
    try {
      let response;
      const hasFilters = currentParams?.tanggal || currentParams?.jadwalId || currentParams?.createdBy;
      if (hasFilters) {
        response = await apiService.getSesiAbsensiTahfizByTanggal(currentParams?.tanggal, currentParams?.jadwalId, currentParams?.createdBy);
      } else {
        response = await apiService.getAllSesiAbsensiTahfiz();
      }
      
      if (response.success && response.sesiAbsensiTahfiz) {
        if (!currentParams?.tanggal && !currentParams?.jadwalId && !currentParams?.createdBy) {
          globalSesiAbsensiTahfizCache = response.sesiAbsensiTahfiz;
          globalSesiAbsensiTahfizCacheTime = Date.now();
        }
        setSesiAbsensiTahfiz(response.sesiAbsensiTahfiz);
      } else {
        setError(response.message || 'Gagal mengambil data sesi absensi tahfiz');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi tahfiz');
      console.error('Error fetching sesi absensi tahfiz:', err);
    } finally {
      setLoading(false);
      if (shouldWaitForWorker) {
        setIsSyncingWithWorker(false);
        setSyncMessage(null);
      }
    }
  };

  const createSesiAbsensiTahfiz = async (data: Partial<SesiAbsensiTahfiz>) => {
    try {
      const response = await apiService.createSesiAbsensiTahfiz(data);
      if (response.success && response.sesiAbsensiTahfiz) {
        // Invalidate cache immediately
        globalSesiAbsensiTahfizCache = null;
        globalSesiAbsensiTahfizCacheTime = 0;
        globalSesiAbsensiTahfizLoadingPromise = null;
        
        // Immediately update state with new session
        setSesiAbsensiTahfiz(prev => {
          // Check if session already exists
          const exists = prev.some(s => s.id === response.sesiAbsensiTahfiz?.id);
          if (exists) {
            return prev.map(s => s.id === response.sesiAbsensiTahfiz?.id ? response.sesiAbsensiTahfiz : s);
          }
          return [...prev, response.sesiAbsensiTahfiz];
        });
        
        return response.sesiAbsensiTahfiz;
      } else {
        throw new Error(response.message || 'Gagal membuat sesi absensi tahfiz');
      }
    } catch (err: any) {
      console.error('Error creating sesi absensi tahfiz:', err);
      throw err;
    }
  };

  const updateSesiAbsensiTahfiz = async (id: string, data: Partial<SesiAbsensiTahfiz>) => {
    try {
      const response = await apiService.updateSesiAbsensiTahfiz(id, data);
      if (response.success && response.sesiAbsensiTahfiz) {
        // Invalidate cache
        globalSesiAbsensiTahfizCache = null;
        globalSesiAbsensiTahfizCacheTime = 0;
        globalSesiAbsensiTahfizLoadingPromise = null;
        
        // Immediately update state with updated session
        setSesiAbsensiTahfiz(prev => 
          prev.map(s => s.id === id ? response.sesiAbsensiTahfiz : s)
        );
        
        return response.sesiAbsensiTahfiz;
      } else {
        throw new Error(response.message || 'Gagal memperbarui sesi absensi tahfiz');
      }
    } catch (err: any) {
      console.error('Error updating sesi absensi tahfiz:', err);
      throw err;
    }
  };

  const addAbsensiToSesiTahfiz = async (sesiId: string, absensiData: any) => {
    try {
      const response = await apiService.submitAbsensiTahfizWithFallback(sesiId, absensiData);
      // Worker path returns 202 without sesiAbsensiTahfiz payload; we treat it as success and refresh later.
      if (response.success) {
        // Wait for worker to persist data, then refresh
        const shouldWaitForWorker = !!sesiId && !!absensiData.muridId;
        if (shouldWaitForWorker) {
          setIsSyncingWithWorker(true);
          setSyncMessage('Menunggu worker menyimpan data absensi tahfiz...');
          
          // Wait for worker to persist and verify the data matches expected values
          await waitForWorkerPersistence({
            sesiId: sesiId,
            muridId: absensiData.muridId,
            expectedData: {
              status: absensiData.status,
              keterangan: absensiData.keterangan,
              waktu: absensiData.waktu,
            },
          }, 15, 1200); // Increase attempts and delay for better reliability
          
          setSyncMessage('Memuat ulang data sesi absensi tahfiz...');
        }
        
        // Invalidate cache AFTER worker has successfully saved data
        globalSesiAbsensiTahfizCache = null;
        globalSesiAbsensiTahfizCacheTime = 0;
        globalSesiAbsensiTahfizLoadingPromise = null;
        
        // Refresh after waiting and cache invalidation
        await refreshSesiAbsensiTahfiz();
        
        if (shouldWaitForWorker) {
          setIsSyncingWithWorker(false);
          setSyncMessage(null);
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Gagal menyimpan absensi tahfiz');
      }
    } catch (err: any) {
      setIsSyncingWithWorker(false);
      setSyncMessage(null);
      console.error('Error adding absensi to sesi tahfiz:', err);
      throw err;
    }
  };

  const bulkAddAbsensiToSesiTahfiz = async (sesiId: string, absensiList: any[]) => {
    try {
      const response = await apiService.bulkSubmitAbsensiTahfizWithFallback(sesiId, absensiList);
      if (response.success) {
        // Wait for all murids to be persisted
        setIsSyncingWithWorker(true);
        setSyncMessage('Menunggu worker menyimpan data absensi tahfiz...');
        
        // Wait for all murids to be persisted - verify all are in database
        setSyncMessage(`Menunggu worker menyimpan ${absensiList.length} data absensi tahfiz...`);
        
        // Verify all murids are persisted by checking the sesi data
        // For bulk operations, we verify that all expected murids exist and match expected data
        const expectedMuridIds = new Set(absensiList.map(a => a.muridId));
        const expectedDataMap = new Map(
          absensiList.map(a => [a.muridId, { status: a.status, keterangan: a.keterangan, waktu: a.waktu }])
        );
        let allPersisted = false;
        let retryCount = 0;
        const maxRetries = 15;
        let persistedCount = 0;
        
        while (!allPersisted && retryCount < maxRetries) {
          // Get current sesi data to check all murids at once
          const checkResponse = await apiService.getSesiAbsensiTahfizById(sesiId);
          if (checkResponse.success && checkResponse.sesiAbsensiTahfiz) {
            const persistedAbsensi = checkResponse.sesiAbsensiTahfiz.dataAbsensi || [];
            const persistedMuridIds = new Set(persistedAbsensi.map(a => a.muridId));
            
            // Count how many expected murids are persisted AND match expected data
            persistedCount = 0;
            for (const muridId of expectedMuridIds) {
              const persistedAbsensiItem = persistedAbsensi.find(a => a.muridId === muridId);
              if (persistedAbsensiItem) {
                const expectedData = expectedDataMap.get(muridId);
                if (expectedData) {
                  // Verify data matches
                  let dataMatches = true;
                  if (expectedData.status && persistedAbsensiItem.status !== expectedData.status) {
                    dataMatches = false;
                  }
                  if (expectedData.keterangan !== undefined) {
                    const absensiKeterangan = persistedAbsensiItem.keterangan || '';
                    const expectedKeterangan = expectedData.keterangan || '';
                    if (absensiKeterangan !== expectedKeterangan) {
                      dataMatches = false;
                    }
                  }
                  if (dataMatches) {
                    persistedCount++;
                  }
                } else {
                  // No expected data, just check existence
                  persistedCount++;
                }
              }
            }
            
            allPersisted = persistedCount === absensiList.length;
            
            if (allPersisted) {
              console.log(`✅ All ${absensiList.length} murids successfully persisted and verified`);
              break;
            } else {
              const missingCount = absensiList.length - persistedCount;
              setSyncMessage(`Menunggu worker menyimpan ${missingCount} dari ${absensiList.length} data absensi tahfiz...`);
              console.log(`⏳ ${persistedCount}/${absensiList.length} murids persisted and verified, waiting for ${missingCount} more (attempt ${retryCount + 1}/${maxRetries})`);
            }
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            await sleep(1200);
          }
        }
        
        if (!allPersisted) {
          console.warn(`⚠️ Only ${persistedCount}/${absensiList.length} murids persisted and verified after ${maxRetries} attempts`);
        }
        
        // Invalidate cache AFTER worker has successfully saved data
        globalSesiAbsensiTahfizCache = null;
        globalSesiAbsensiTahfizCacheTime = 0;
        globalSesiAbsensiTahfizLoadingPromise = null;
        
        setSyncMessage('Memuat ulang data sesi absensi tahfiz...');
        
        // Final refresh to get all data
        await refreshSesiAbsensiTahfiz();
        
        setIsSyncingWithWorker(false);
        setSyncMessage(null);
        
        return response;
      } else {
        throw new Error(response.message || 'Gagal menyimpan absensi tahfiz');
      }
    } catch (err: any) {
      setIsSyncingWithWorker(false);
      setSyncMessage(null);
      console.error('Error bulk adding absensi to sesi tahfiz:', err);
      throw err;
    }
  };

  return { 
    sesiAbsensiTahfiz, 
    loading, 
    error, 
    refreshSesiAbsensiTahfiz, 
    createSesiAbsensiTahfiz, 
    updateSesiAbsensiTahfiz,
    addAbsensiToSesiTahfiz,
    bulkAddAbsensiToSesiTahfiz,
    isSyncingWithWorker,
    syncMessage,
  };
};

// Export function to clear all cache (useful when logging out)
export const clearSesiAbsensiTahfizCache = () => {
  globalSesiAbsensiTahfizCache = null;
  globalSesiAbsensiTahfizCacheTime = 0;
  globalSesiAbsensiTahfizLoadingPromise = null;
};

