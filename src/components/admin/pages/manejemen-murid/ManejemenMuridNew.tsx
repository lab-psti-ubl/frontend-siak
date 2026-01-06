import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KelolaDataMuridTable from './KelolaDataMuridTable';

interface ManajemenMuridNewProps {
  onAddMurid: (kelasId?: string) => void;
}

const ManajemenMuridNew: React.FC<ManajemenMuridNewProps> = ({ onAddMurid }) => {
  const navigate = useNavigate();

  const handleAddMurid = (kelasId?: string) => {
    // Store kelas ID in sessionStorage for persistence across navigation
    if (kelasId) {
      sessionStorage.setItem('selectedKelasId', kelasId);
    }
    
    // Navigate with kelas ID as state
    if (kelasId) {
      navigate('/dashboard/tambah-murid', { state: { selectedKelasId: kelasId } });
    } else {
      navigate('/dashboard/tambah-murid');
    }
  };

  return <KelolaDataMuridTable onAddMurid={handleAddMurid} />;
};

export default ManajemenMuridNew;