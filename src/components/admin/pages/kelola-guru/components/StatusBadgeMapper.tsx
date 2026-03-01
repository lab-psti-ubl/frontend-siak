import React from 'react';
import { useLanguage } from '../../../../../context/LanguageContext';
import Badge from '../../../../ui/Badge';

interface StatusBadgeMapperProps {
  status: string;
}

const StatusBadgeMapper: React.FC<StatusBadgeMapperProps> = ({ status }) => {
  const { t } = useLanguage();
  switch (status) {
    case 'tepat_waktu':
      return <Badge variant="success">{t('detailAbsensiModal.tepatWaktu')}</Badge>;
    case 'terlambat':
      return <Badge variant="warning">{t('detailAbsensiModal.terlambat')}</Badge>;
    case 'pulang_awal':
      return <Badge variant="warning">{t('detailAbsensiModal.pulangAwal')}</Badge>;
    case 'tidak_masuk':
      return <Badge variant="danger">{t('detailAbsensiModal.tidakMasuk')}</Badge>;
    case 'tidak_keluar':
      return <Badge variant="danger">{t('detailAbsensiModal.tidakKeluar')}</Badge>;
    case 'izin':
      return <Badge variant="info">{t('detailAbsensiModal.izin')}</Badge>;
    case 'sakit':
      return <Badge variant="secondary">{t('detailAbsensiModal.sakit')}</Badge>;
    case 'alfa':
      return <Badge variant="danger">{t('detailAbsensiModal.alfa')}</Badge>;
    default:
      return <Badge variant="default">{status.replace(/_/g, ' ')}</Badge>;
  }
};

export default StatusBadgeMapper;
