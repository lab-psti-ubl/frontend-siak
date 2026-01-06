import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { BackgroundKTA } from '../types';

// Global cache untuk semua instance hook
let globalBackgroundKTACache: BackgroundKTA | null = null;
let globalBackgroundKTACacheTime: number = 0;
let globalBackgroundKTALoadingPromise: Promise<BackgroundKTA | null> | null = null;

const CACHE_DURATION = 600000; // 10 menit (600000 ms)

export const useBackgroundKTA = () => {
  const [backgroundKTA, setBackgroundKTA] = useState<BackgroundKTA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalBackgroundKTACache !== null && 
                      (Date.now() - globalBackgroundKTACacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setBackgroundKTA(globalBackgroundKTACache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalBackgroundKTALoadingPromise) {
      globalBackgroundKTALoadingPromise
        .then(data => {
          setBackgroundKTA(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data background KTA');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalBackgroundKTALoadingPromise = (async () => {
      try {
        const response = await apiService.getBackgroundKTA();
        if (response.success && response.backgroundKTA) {
          // Update cache
          globalBackgroundKTACache = response.backgroundKTA;
          globalBackgroundKTACacheTime = Date.now();
          
          setBackgroundKTA(response.backgroundKTA);
          setLoading(false);
          return response.backgroundKTA;
        } else {
          setBackgroundKTA(null);
          setLoading(false);
          return null;
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data background KTA');
        console.error('Error fetching background KTA:', err);
        setLoading(false);
        throw err;
      } finally {
        globalBackgroundKTALoadingPromise = null;
      }
    })();
  }, []);

  const refreshBackgroundKTA = async () => {
    // Clear cache and force refresh
    globalBackgroundKTACache = null;
    globalBackgroundKTACacheTime = 0;
    globalBackgroundKTALoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getBackgroundKTA();
      if (response.success && response.backgroundKTA) {
        globalBackgroundKTACache = response.backgroundKTA;
        globalBackgroundKTACacheTime = Date.now();
        setBackgroundKTA(response.backgroundKTA);
      } else {
        setBackgroundKTA(null);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data background KTA');
      console.error('Error fetching background KTA:', err);
    } finally {
      setLoading(false);
    }
  };

  return { backgroundKTA, loading, error, refreshBackgroundKTA };
};

// Export function to clear all cache (useful when logging out)
export const clearBackgroundKTACache = () => {
  globalBackgroundKTACache = null;
  globalBackgroundKTACacheTime = 0;
  globalBackgroundKTALoadingPromise = null;
};

