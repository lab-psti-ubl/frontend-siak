import { useState, useEffect, useCallback } from 'react';
import { useTahunAjaran, clearTahunAjaranCache } from './useTahunAjaran';
import { useGurus, clearGurusCache } from './useGurus';
import { useJurusan, clearJurusanCache } from './useJurusan';
import { useKelas, clearKelasCache } from './useKelas';
import { useMurid, clearMuridCache } from './useMurid';
import { useMataPelajaran, clearMataPelajaranCache } from './useMataPelajaran';
import { apiService } from '../services/apiService';
import { getActiveJenjang } from '../utils/jenjangPendidikanUtils';
import { isSystemActive } from '../utils/systemActivationUtils';

export interface OnboardingStep {
  id: string;
  title: string;
  message: string;
  route: string;
  isRequired: boolean;
}

export const useOnboardingTour = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jenjang, setJenjang] = useState<'SD' | 'SMP' | 'SMA/SMK' | null>(null);
  const [systemActive, setSystemActive] = useState<boolean>(false);
  const [checkingActivation, setCheckingActivation] = useState(true);

  const { tahunAjaran, loading: tahunAjaranLoading, refreshTahunAjaran } = useTahunAjaran();
  const { gurus, loading: gurusLoading, refreshGurus } = useGurus();
  const { jurusan, loading: jurusanLoading, refreshJurusan } = useJurusan();
  const { kelas, loading: kelasLoading, refreshKelas } = useKelas();
  const { murid, loading: muridLoading, refreshMurid } = useMurid();
  const { mataPelajaran, loading: mapelLoading, refreshMataPelajaran } = useMataPelajaran();
  
  // State untuk trigger refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State untuk data yang tidak ada hook-nya
  const [guruMapel, setGuruMapel] = useState<any[]>([]);
  const [guruMapelLoading, setGuruMapelLoading] = useState(true);
  const [jadwalPelajaran, setJadwalPelajaran] = useState<any[]>([]);
  const [jadwalLoading, setJadwalLoading] = useState(true);

  // Check system activation first
  useEffect(() => {
    const checkActivation = async () => {
      try {
        setCheckingActivation(true);
        const active = await isSystemActive();
        setSystemActive(active);
      } catch (error) {
        console.error('Error checking system activation:', error);
        setSystemActive(false);
      } finally {
        setCheckingActivation(false);
      }
    };
    checkActivation();
  }, []);

  // Fetch jenjang
  useEffect(() => {
    const fetchJenjang = async () => {
      try {
        const activeJenjang = await getActiveJenjang();
        setJenjang(activeJenjang);
      } catch (error) {
        console.error('Error fetching jenjang:', error);
      }
    };
    fetchJenjang();
  }, []);

  // Fetch guru mapel
  const fetchGuruMapel = useCallback(async () => {
    try {
      setGuruMapelLoading(true);
      const response = await apiService.getAllGuruMapel();
      if (response.success && response.guruMapel) {
        setGuruMapel(response.guruMapel);
      }
    } catch (error) {
      console.error('Error fetching guru mapel:', error);
    } finally {
      setGuruMapelLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuruMapel();
  }, [fetchGuruMapel, refreshTrigger]);

  // Fetch jadwal pelajaran
  const fetchJadwal = useCallback(async () => {
    try {
      setJadwalLoading(true);
      const response = await apiService.getAllJadwalPelajaran();
      if (response.success && response.jadwalPelajaran) {
        setJadwalPelajaran(response.jadwalPelajaran);
      }
    } catch (error) {
      console.error('Error fetching jadwal pelajaran:', error);
    } finally {
      setJadwalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal, refreshTrigger]);

  // Check all conditions and determine current step
  useEffect(() => {
    // Don't check if system is not active yet or still checking activation
    if (checkingActivation || !systemActive) {
      setIsLoading(true);
      setCurrentStep(null);
      return;
    }

    const allLoading = 
      tahunAjaranLoading || 
      gurusLoading || 
      jurusanLoading || 
      kelasLoading || 
      muridLoading || 
      mapelLoading || 
      guruMapelLoading || 
      jadwalLoading;

    if (allLoading || jenjang === null) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    // Step 1: Check tahun ajaran
    if (!tahunAjaran || tahunAjaran.length === 0) {
      setCurrentStep({
        id: 'tahun-ajaran',
        title: 'Belum Ada Tahun Ajaran',
        message: 'Belum ada data tahun ajaran. Silakan tambah tahun ajaran terlebih dahulu.',
        route: '/dashboard/tahun-ajaran',
        isRequired: true,
      });
      return;
    }

    // Step 2: Check guru
    if (!gurus || gurus.length === 0) {
      setCurrentStep({
        id: 'guru',
        title: 'Belum Ada Data Guru',
        message: 'Belum ada data guru. Silakan tambah data guru terlebih dahulu.',
        route: '/dashboard/guru',
        isRequired: true,
      });
      return;
    }

    // Step 3: Check jurusan (only for SMA/SMK)
    if (jenjang === 'SMA/SMK') {
      if (!jurusan || jurusan.length === 0) {
        setCurrentStep({
          id: 'jurusan',
          title: 'Belum Ada Data Jurusan',
          message: 'Belum ada data jurusan. Silakan tambah data jurusan terlebih dahulu.',
          route: '/dashboard/jurusan',
          isRequired: true,
        });
        return;
      }
    }

    // Step 4: Check kelas
    if (!kelas || kelas.length === 0) {
      setCurrentStep({
        id: 'kelas',
        title: 'Belum Ada Data Kelas',
        message: 'Belum ada data kelas. Silakan tambah data kelas terlebih dahulu.',
        route: '/dashboard/kelas',
        isRequired: true,
      });
      return;
    }

    // Step 5: Check murid
    if (!murid || murid.length === 0) {
      setCurrentStep({
        id: 'murid',
        title: 'Belum Ada Data Murid',
        message: 'Belum ada data murid. Silakan tambah data murid terlebih dahulu.',
        route: '/dashboard/kelola-data-murid',
        isRequired: true,
      });
      return;
    }

    // Step 6: Check mata pelajaran
    if (!mataPelajaran || mataPelajaran.length === 0) {
      setCurrentStep({
        id: 'mapel',
        title: 'Belum Ada Data Mata Pelajaran',
        message: 'Belum ada data mata pelajaran. Silakan tambah data mapel terlebih dahulu.',
        route: '/dashboard/mapel',
        isRequired: true,
      });
      return;
    }

    // Step 7: Check kelola guru mapel
    if (!guruMapel || guruMapel.length === 0) {
      setCurrentStep({
        id: 'guru-mapel',
        title: 'Belum Ada Data Kelola Guru Mapel',
        message: 'Belum ada data kelola guru mapel. Silakan tambah data kelola guru mapel terlebih dahulu.',
        route: '/dashboard/guru-mapel',
        isRequired: true,
      });
      return;
    }

    // Step 8: Check jadwal pelajaran
    if (!jadwalPelajaran || jadwalPelajaran.length === 0) {
      setCurrentStep({
        id: 'jadwal',
        title: 'Belum Ada Data Jadwal Pelajaran',
        message: 'Belum ada data jadwal pelajaran. Silakan tambah data jadwal pelajaran terlebih dahulu.',
        route: '/dashboard/jadwal',
        isRequired: true,
      });
      return;
    }

    // All steps completed
    setCurrentStep(null);
  }, [
    tahunAjaran,
    gurus,
    jurusan,
    kelas,
    murid,
    mataPelajaran,
    guruMapel,
    jadwalPelajaran,
    tahunAjaranLoading,
    gurusLoading,
    jurusanLoading,
    kelasLoading,
    muridLoading,
    mapelLoading,
    guruMapelLoading,
    jadwalLoading,
    jenjang,
    systemActive,
    checkingActivation,
  ]);

  // Fungsi untuk refresh semua data dengan menghapus cache terlebih dahulu
  const refreshAllData = useCallback(async () => {
    try {
      // Clear semua cache
      clearTahunAjaranCache();
      clearGurusCache();
      clearJurusanCache();
      clearKelasCache();
      clearMuridCache();
      clearMataPelajaranCache();
      
      // Refresh semua data dari API
      await Promise.all([
        refreshTahunAjaran(),
        refreshGurus(),
        refreshJurusan(),
        refreshKelas(),
        refreshMurid(),
        refreshMataPelajaran(),
      ]);
      
      // Refresh data yang tidak ada hook-nya
      await fetchGuruMapel();
      await fetchJadwal();
      
      // Trigger re-check dengan update refreshTrigger
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing all data:', error);
    }
  }, [refreshTahunAjaran, refreshGurus, refreshJurusan, refreshKelas, refreshMurid, refreshMataPelajaran, fetchGuruMapel, fetchJadwal]);

  return {
    currentStep,
    isLoading,
    refreshData: refreshAllData,
  };
};

