import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

interface FooterSettingsState {
  footerCompanyName: string;
  loading: boolean;
}

const DEFAULT_COMPANY_NAME = 'iSchola - Garnusa Studio Technologi';

// Global cache footer (mirip pola di usePengaturanSistem)
let globalFooterCompanyName: string | null = null;
let globalFooterCacheTime: number = 0;
let globalFooterLoadingPromise: Promise<string> | null = null;

const FOOTER_CACHE_DURATION = 2000000; // sama durasi cache dengan pengaturan sistem

export const useFooterSettings = (): FooterSettingsState => {
  const [footerCompanyName, setFooterCompanyName] = useState<string>(DEFAULT_COMPANY_NAME);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    // Cek cache global terlebih dahulu
    const cacheValid =
      globalFooterCompanyName !== null &&
      Date.now() - globalFooterCacheTime < FOOTER_CACHE_DURATION;

    if (cacheValid && globalFooterCompanyName) {
      setFooterCompanyName(globalFooterCompanyName);
      setLoading(false);
      return;
    }

    // Jika sudah ada request berjalan, tunggu hasilnya
    if (globalFooterLoadingPromise) {
      setLoading(true);
      globalFooterLoadingPromise
        .then((name) => {
          if (!cancelled) {
            setFooterCompanyName(name || DEFAULT_COMPANY_NAME);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFooterCompanyName(DEFAULT_COMPANY_NAME);
            setLoading(false);
          }
        });
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await apiService.getFooterSettingsPublic();
        const name =
          res.success && res.footerCompanyName
            ? res.footerCompanyName
            : DEFAULT_COMPANY_NAME;

        // Simpan ke cache global
        globalFooterCompanyName = name;
        globalFooterCacheTime = Date.now();

        if (!cancelled) {
          setFooterCompanyName(name);
        }
      } catch {
        // Abaikan error, fallback ke default
        if (!cancelled) {
          setFooterCompanyName(DEFAULT_COMPANY_NAME);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        globalFooterLoadingPromise = null;
      }
    };

    globalFooterLoadingPromise = (async () => {
      await fetchSettings();
      return globalFooterCompanyName || DEFAULT_COMPANY_NAME;
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { footerCompanyName, loading };
};

