import React from 'react';
import { CreditCard } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { User, Kelas, Jurusan } from '../../../../../types';
import { shouldShowJurusanSync } from '../../../../../utils/jenjangPendidikanUtils';

interface MuridAcademicInfoProps {
  murid: User;
  currentKelas: Kelas | undefined;
  currentJurusan: Jurusan | undefined;
  onDownloadKartu: (murid: User) => void;
}

const MuridAcademicInfo: React.FC<MuridAcademicInfoProps> = ({
  murid,
  currentKelas,
  currentJurusan,
  onDownloadKartu
}) => {
  const showJurusan = shouldShowJurusanSync();

  return (
    <Card className="p-4">
      <h4 className="font-semibold text-gray-900 mb-3">Informasi Akademik</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Kelas Saat Ini:</span>
          <span className="font-medium text-gray-900">{currentKelas?.name || 'Unknown'}</span>
        </div>
        {showJurusan && currentJurusan && (
          <div className="flex justify-between">
            <span className="text-gray-600">Jurusan:</span>
            <span className="font-medium text-gray-900">{currentJurusan.name || 'Unknown'}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <Badge variant={murid.isActive !== false ? 'success' : 'default'}>
            {murid.isActive !== false ? 'Aktif' : 'Tidak Aktif'}
          </Badge>
        </div>
      </div>
      
      <div className="mt-4">
        <Button 
          onClick={() => onDownloadKartu(murid)}
          fullWidth
          variant="secondary"
          className="justify-center flex items-center"
        >
          <CreditCard size={16} className="mr-2" />
          Download Kartu Pelajar
        </Button>
      </div>
    </Card>
  );
};

export default MuridAcademicInfo;