import { useState, useEffect } from 'react';
import * as React from 'react';
import { apiService } from '../services/apiService';
import { SesiAbsensi } from '../types';

// Global cache untuk semua instance hook
let globalSesiAbsensiCache: SesiAbsensi[] | null = null;
let globalSesiAbsensiCacheTime: number = 0;
let globalSesiAbsensiLoadingPromise: Promise<SesiAbsensi[]> | null = null;

const CACHE_DURATION = 2000000; // 5 menit (300000 ms) - shorter cache for session data

interface SesiAbsensiParams {
  tanggal?: string;
  jadwalId?: string;
  createdBy?: string;
}

export type SesiAbsensiRefreshOptions = {
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

type RefreshOptions = SesiAbsensiRefreshOptions;

export const useSesiAbsensi = (params?: SesiAbsensiParams) => {
  const [sesiAbsensi, setSesiAbsensi] = useState<SesiAbsensi[]>([]);
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
        const response = await apiService.getSesiAbsensiById(opts.sesiId);
        if (response.success && response.sesiAbsensi) {
          // Check if the absensi for this murid exists in dataAbsensi
          const absensi = response.sesiAbsensi.dataAbsensi?.find(a => a.muridId === opts.muridId);
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
                return response.sesiAbsensi;
              } else {
                // Data exists but doesn't match yet, continue waiting
                console.log(`⏳ Waiting for worker to update data (attempt ${i + 1}/${attempts})...`);
              }
            } else {
              // No expected data, just check existence
              return response.sesiAbsensi;
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
    const cacheValid = globalSesiAbsensiCache && 
                      !hasFilters &&
                      (Date.now() - globalSesiAbsensiCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data only for getAll
      setSesiAbsensi(globalSesiAbsensiCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it (only for getAll)
    if (globalSesiAbsensiLoadingPromise && !hasFilters) {
      globalSesiAbsensiLoadingPromise
        .then(data => {
          setSesiAbsensi(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi');
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
          response = await apiService.getSesiAbsensiByTanggal(params?.tanggal, params?.jadwalId, params?.createdBy);
        } else {
          // Fetch all
          if (!globalSesiAbsensiLoadingPromise) {
            globalSesiAbsensiLoadingPromise = (async () => {
              const resp = await apiService.getAllSesiAbsensi();
              if (resp.success && resp.sesiAbsensi) {
                globalSesiAbsensiCache = resp.sesiAbsensi;
                globalSesiAbsensiCacheTime = Date.now();
                return resp.sesiAbsensi;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data sesi absensi');
              }
            })();
          }
          const data = await globalSesiAbsensiLoadingPromise;
          globalSesiAbsensiLoadingPromise = null;
          setSesiAbsensi(data);
          setLoading(false);
          return;
        }

        if (response.success && response.sesiAbsensi) {
          setSesiAbsensi(response.sesiAbsensi);
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data sesi absensi');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi');
        console.error('Error fetching sesi absensi:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.tanggal, params?.jadwalId, params?.createdBy]);

  const refreshSesiAbsensi = async (options?: RefreshOptions) => {
    const shouldWaitForWorker = !!options?.waitForWorker?.sesiId && !!options?.waitForWorker?.muridId;
    if (shouldWaitForWorker) {
      setIsSyncingWithWorker(true);
      setSyncMessage('Menunggu worker menyimpan data absensi pelajaran...');
      await waitForWorkerPersistence(
        options?.waitForWorker,
        options?.maxAttempts,
        options?.delayMs,
      );
      setSyncMessage('Memuat ulang data sesi absensi...');
    }

    // Clear cache and force refresh
    globalSesiAbsensiCache = null;
    globalSesiAbsensiCacheTime = 0;
    globalSesiAbsensiLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    const currentParams = currentParamsRef.current;
    
    try {
      let response;
      const hasFilters = currentParams?.tanggal || currentParams?.jadwalId || currentParams?.createdBy;
      if (hasFilters) {
        response = await apiService.getSesiAbsensiByTanggal(currentParams?.tanggal, currentParams?.jadwalId, currentParams?.createdBy);
      } else {
        response = await apiService.getAllSesiAbsensi();
      }
      
      if (response.success && response.sesiAbsensi) {
        if (!currentParams?.tanggal && !currentParams?.jadwalId && !currentParams?.createdBy) {
          globalSesiAbsensiCache = response.sesiAbsensi;
          globalSesiAbsensiCacheTime = Date.now();
        }
        setSesiAbsensi(response.sesiAbsensi);
      } else {
        setError(response.message || 'Gagal mengambil data sesi absensi');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi');
      console.error('Error fetching sesi absensi:', err);
    } finally {
      setLoading(false);
      if (shouldWaitForWorker) {
        setIsSyncingWithWorker(false);
        setSyncMessage(null);
      }
    }
  };

  const createSesiAbsensi = async (data: Partial<SesiAbsensi>) => {
    try {
      const response = await apiService.createSesiAbsensi(data);
      if (response.success && response.sesiAbsensi) {
        // Invalidate cache immediately
        globalSesiAbsensiCache = null;
        globalSesiAbsensiCacheTime = 0;
        globalSesiAbsensiLoadingPromise = null;
        
        // Immediately update state with new session
        setSesiAbsensi(prev => {
          // Check if session already exists
          const exists = prev.some(s => s.id === response.sesiAbsensi?.id);
          if (exists) {
            return prev.map(s => s.id === response.sesiAbsensi?.id ? response.sesiAbsensi : s);
          }
          return [...prev, response.sesiAbsensi];
        });
        
        return response.sesiAbsensi;
      } else {
        throw new Error(response.message || 'Gagal membuat sesi absensi');
      }
    } catch (err: any) {
      console.error('Error creating sesi absensi:', err);
      throw err;
    }
  };

  const updateSesiAbsensi = async (id: string, data: Partial<SesiAbsensi>) => {
    try {
      const response = await apiService.updateSesiAbsensi(id, data);
      if (response.success && response.sesiAbsensi) {
        // Invalidate cache
        globalSesiAbsensiCache = null;
        globalSesiAbsensiCacheTime = 0;
        globalSesiAbsensiLoadingPromise = null;
        
        // Immediately update state with updated session
        setSesiAbsensi(prev => 
          prev.map(s => s.id === id ? response.sesiAbsensi : s)
        );
        
        return response.sesiAbsensi;
      } else {
        throw new Error(response.message || 'Gagal memperbarui sesi absensi');
      }
    } catch (err: any) {
      console.error('Error updating sesi absensi:', err);
      throw err;
    }
  };

  const addAbsensiToSesi = async (sesiId: string, absensiData: any) => {
    try {
      const response = await apiService.submitAbsensiPelajaranWithFallback(sesiId, absensiData);
      // Worker path returns 202 without sesiAbsensi payload; we treat it as success and refresh later.
      if (response.success) {
        // Wait for worker to persist data, then refresh
        const shouldWaitForWorker = !!sesiId && !!absensiData.muridId;
        if (shouldWaitForWorker) {
          setIsSyncingWithWorker(true);
          setSyncMessage('Menunggu worker menyimpan data absensi pelajaran...');
          
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
          
          setSyncMessage('Memuat ulang data sesi absensi...');
        }
        
        // Invalidate cache AFTER worker has successfully saved data
        globalSesiAbsensiCache = null;
        globalSesiAbsensiCacheTime = 0;
        globalSesiAbsensiLoadingPromise = null;
        
        // Refresh after waiting and cache invalidation
        await refreshSesiAbsensi();
        
        if (shouldWaitForWorker) {
          setIsSyncingWithWorker(false);
          setSyncMessage(null);
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Gagal menyimpan absensi pelajaran');
      }
    } catch (err: any) {
      setIsSyncingWithWorker(false);
      setSyncMessage(null);
      console.error('Error adding absensi to sesi:', err);
      throw err;
    }
  };

  const bulkAddAbsensiToSesi = async (sesiId: string, absensiList: any[]) => {
    try {
      const response = await apiService.bulkSubmitAbsensiPelajaranWithFallback(sesiId, absensiList);
      if (response.success) {
        // Wait for all murids to be persisted
        setIsSyncingWithWorker(true);
        setSyncMessage('Menunggu worker menyimpan data absensi pelajaran...');
        
        // Wait for all murids to be persisted - verify all are in database
        setSyncMessage(`Menunggu worker menyimpan ${absensiList.length} data absensi pelajaran...`);
        
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
          const checkResponse = await apiService.getSesiAbsensiById(sesiId);
          if (checkResponse.success && checkResponse.sesiAbsensi) {
            const persistedAbsensi = checkResponse.sesiAbsensi.dataAbsensi || [];
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
              setSyncMessage(`Menunggu worker menyimpan ${missingCount} dari ${absensiList.length} data absensi pelajaran...`);
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
        globalSesiAbsensiCache = null;
        globalSesiAbsensiCacheTime = 0;
        globalSesiAbsensiLoadingPromise = null;
        
        setSyncMessage('Memuat ulang data sesi absensi...');
        
        // Final refresh to get all data
        await refreshSesiAbsensi();
        
        setIsSyncingWithWorker(false);
        setSyncMessage(null);
        
        return response;
      } else {
        throw new Error(response.message || 'Gagal menyimpan absensi pelajaran');
      }
    } catch (err: any) {
      setIsSyncingWithWorker(false);
      setSyncMessage(null);
      console.error('Error bulk adding absensi to sesi:', err);
      throw err;
    }
  };

  return { 
    sesiAbsensi, 
    loading, 
    error, 
    refreshSesiAbsensi, 
    createSesiAbsensi, 
    updateSesiAbsensi,
    addAbsensiToSesi,
    bulkAddAbsensiToSesi,
    isSyncingWithWorker,
    syncMessage,
  };
};

// Export function to clear all cache (useful when logging out)
export const clearSesiAbsensiCache = () => {
  globalSesiAbsensiCache = null;
  globalSesiAbsensiCacheTime = 0;
  globalSesiAbsensiLoadingPromise = null;
};

