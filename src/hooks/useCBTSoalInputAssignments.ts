import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import type { CBTSoalInputAssignment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTahunAjaran } from './useTahunAjaran';

type Params = {
  enabled?: boolean;
  tahunAjaran?: string;
  semester?: number;
};

export function useCBTSoalInputAssignments(params: Params = {}) {
  const { user } = useAuth();
  const { activeTahunAjaran } = useTahunAjaran();

  const effective = useMemo(() => {
    const ta = params.tahunAjaran ?? activeTahunAjaran?.tahun;
    const sem = params.semester ?? activeTahunAjaran?.semester;
    return { enabled: params.enabled !== false, tahunAjaran: ta, semester: sem };
  }, [params.enabled, params.tahunAjaran, params.semester, activeTahunAjaran]);

  const [data, setData] = useState<CBTSoalInputAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!effective.enabled || !user) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getAllCBTSoalInputAssignments({
        tahunAjaran: effective.tahunAjaran,
        semester: effective.semester,
      });
      if (res.success && res.data) {
        setData(res.data as CBTSoalInputAssignment[]);
      } else {
        setData([]);
        setError(res.message || 'Gagal mengambil data penunjukan guru penginput CBT');
      }
    } catch (e: any) {
      setData([]);
      setError(e.message || 'Terjadi kesalahan saat mengambil data penunjukan CBT');
    } finally {
      setLoading(false);
    }
  }, [effective.enabled, effective.tahunAjaran, effective.semester, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { assignments: data, loading, error, refresh: fetchData };
}

