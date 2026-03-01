import { useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import type { TahfizClass } from '../utils/monitoringKelasTahfizUtils';
import { TahfizSchedule } from '../types';
import { SesiAbsensiTahfiz } from '../types';
import { KelasTahfizMonitoring, getKelasTahfizMonitoringStatus } from '../utils/monitoringKelasTahfizUtils';

export function useMonitoringKelasTahfiz(
  kelasTahfiz: TahfizClass[],
  jadwalTahfiz: TahfizSchedule[],
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[],
  users: User[]
) {
  const [monitoringData, setMonitoringData] = useState<KelasTahfizMonitoring[]>([]);

  const updateMonitoringStatus = useCallback(() => {
    const updatedData = kelasTahfiz.map(k =>
      getKelasTahfizMonitoringStatus(
        k.id,
        kelasTahfiz,
        jadwalTahfiz,
        sesiAbsensiTahfiz,
        users
      )
    );
    setMonitoringData(updatedData);
  }, [kelasTahfiz, jadwalTahfiz, sesiAbsensiTahfiz, users]);

  useEffect(() => {
    updateMonitoringStatus();
    const interval = setInterval(updateMonitoringStatus, 10000);
    return () => clearInterval(interval);
  }, [updateMonitoringStatus]);

  return monitoringData;
}
