import React from 'react';
import Badge from '../../../../ui/Badge';

interface StatusBadgeMapperProps {
  status: string;
}

const StatusBadgeMapper: React.FC<StatusBadgeMapperProps> = ({ status }) => {
  switch (status) {
    case 'tepat_waktu':
      return <Badge variant="success">Tepat Waktu</Badge>;
    case 'terlambat':
      return <Badge variant="warning">Terlambat</Badge>;
    case 'pulang_awal':
      return <Badge variant="warning">Pulang Awal</Badge>;
    case 'tidak_masuk':
      return <Badge variant="danger">Tidak Masuk</Badge>;
    case 'tidak_keluar':
      return <Badge variant="danger">Tidak Keluar</Badge>;
    case 'izin':
      return <Badge variant="info">Izin</Badge>;
    case 'sakit':
      return <Badge variant="secondary">Sakit</Badge>;
    case 'alfa':
      return <Badge variant="danger">Alfa</Badge>;
    default:
      return <Badge variant="default">{status.replace(/_/g, ' ')}</Badge>;
  }
};

export default StatusBadgeMapper;
