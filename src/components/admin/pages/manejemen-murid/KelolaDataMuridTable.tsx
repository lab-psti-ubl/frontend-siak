import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { School } from 'lucide-react';
import Card from '../../../ui/Card';
import { useKelas } from '../../../../hooks/useKelas';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useMurid } from '../../../../hooks/useMurid';
import { useGurus } from '../../../../hooks/useGurus';
import { shouldShowJurusanSync } from '../../../../utils/jenjangPendidikanUtils';
import JurusanListView from './views/JurusanListView';
import KelasListView from './views/KelasListView';
import MuridListView from './views/MuridListView';

interface KelolaDataMuridTableProps {
  onAddMurid: (kelasId?: string) => void;
}

const KelolaDataMuridTable: React.FC<KelolaDataMuridTableProps> = ({ onAddMurid }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { kelas } = useKelas();
  const { jurusan } = useJurusan();
  const { murid, refreshMurid } = useMurid();
  const { gurus } = useGurus();
  const showJurusan = shouldShowJurusanSync();
  
  // Convert murid to users format for compatibility
  const users = murid;

  // Refresh murid data when navigating back from TambahMurid
  useEffect(() => {
    // Check if we just navigated back from tambah-murid
    const shouldRefresh = sessionStorage.getItem('shouldRefreshMurid');
    if (shouldRefresh === 'true') {
      // Clear all caches to ensure all views (including MuridListView) get updated
      refreshMurid(true);
      sessionStorage.removeItem('shouldRefreshMurid');
    }
  }, [location.pathname, refreshMurid]);

  const [selectedJurusan, setSelectedJurusan] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');

  const handleJurusanClick = (jurusanId: string) => {
    setSelectedJurusan(jurusanId);
    setSelectedKelas('');
  };

  const handleKelasClick = (kelasId: string) => {
    setSelectedKelas(kelasId);
  };

  const handleBack = () => {
    if (selectedKelas) {
      setSelectedKelas('');
    } else if (showJurusan && selectedJurusan) {
      setSelectedJurusan('');
    }
  };

  const handleAddMurid = (kelasId?: string) => {
    onAddMurid(kelasId);
  };

  // For SD/SMP: Skip jurusan view, go directly to kelas view
  if (!showJurusan && !selectedKelas) {
    return (
      <KelasListView
        selectedJurusan="" // No jurusan for SD/SMP
        jurusan={jurusan}
        kelas={kelas}
        users={users}
        gurus={gurus}
        onBack={handleBack}
        onKelasClick={handleKelasClick}
        onAddMurid={handleAddMurid}
      />
    );
  }

  // For SMA/SMK: View - Daftar Jurusan
  if (showJurusan && !selectedJurusan) {
    return (
      <JurusanListView
        jurusan={jurusan}
        kelas={kelas}
        users={users}
        onJurusanClick={handleJurusanClick}
      />
    );
  }

  // For SMA/SMK: View - Daftar Kelas dalam Jurusan
  if (showJurusan && selectedJurusan && !selectedKelas) {
    return (
      <KelasListView
        selectedJurusan={selectedJurusan}
        jurusan={jurusan}
        kelas={kelas}
        users={users}
        gurus={gurus}
        onBack={handleBack}
        onKelasClick={handleKelasClick}
        onAddMurid={handleAddMurid}
      />
    );
  }

  // View: Daftar Murid dalam Kelas
  return (
    <MuridListView
      selectedKelas={selectedKelas}
      selectedJurusan={selectedJurusan}
      kelas={kelas}
      jurusan={jurusan}
      users={users}
      onBack={handleBack}
      onAddMurid={handleAddMurid}
    />
  );
};

export default KelolaDataMuridTable;