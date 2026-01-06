import { useState, useMemo } from 'react';
import { User, RiwayatKelasMurid } from '../../../../../types';
import { useLocalStorage } from '../../../../../hooks/useLocalStorage';

export const useMuridFilters = (muridKelas: User[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [riwayatKelasMurid] = useLocalStorage<RiwayatKelasMurid[]>('riwayatKelasMurid', []);

  const filteredMurid = useMemo(() => {
    return muridKelas.filter(murid => {
      const muridRiwayat = riwayatKelasMurid.filter(r => r.muridId === murid.id);
      const hasGraduated = muridRiwayat.some(r => r.status === 'lulus' || r.status === 'tidak_lulus');

      if (hasGraduated) {
        return false;
      }

      const matchesSearch = murid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           murid.nisn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           murid.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'active' && murid.isActive !== false) ||
                           (statusFilter === 'inactive' && murid.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [muridKelas, searchTerm, statusFilter, riwayatKelasMurid]);

  return {
    searchTerm,
    statusFilter,
    filteredMurid,
    setSearchTerm,
    setStatusFilter
  };
};