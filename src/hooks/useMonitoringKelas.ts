import { useEffect, useState, useCallback } from 'react';
import { Kelas, JadwalPelajaran, SesiAbsensi, User, TahunAjaran, MataPelajaran } from '../types';
import { KelasMonitoring, getKelasMonitoringStatus } from '../utils/monitoringKelasUtils';

export function useMonitoringKelas(
  kelas: Kelas[],
  jadwal: JadwalPelajaran[],
  sesiAbsensi: SesiAbsensi[],
  users: User[],
  tahunAjaran: TahunAjaran | undefined,
  mataPelajaran: MataPelajaran[] = []
) {
  const [monitoringData, setMonitoringData] = useState<KelasMonitoring[]>([]);

  const updateMonitoringStatus = useCallback(() => {
    if (!tahunAjaran) return;

    const updatedData = kelas.map(k =>
      getKelasMonitoringStatus(
        k.id,
        kelas,
        jadwal,
        sesiAbsensi,
        users,
        tahunAjaran.tahun,
        tahunAjaran.semester,
        mataPelajaran
      )
    );

    setMonitoringData(updatedData);
  }, [kelas, jadwal, sesiAbsensi, users, tahunAjaran, mataPelajaran]);

  useEffect(() => {
    updateMonitoringStatus();

    const interval = setInterval(() => {
      updateMonitoringStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [updateMonitoringStatus]);

  return monitoringData;
}
