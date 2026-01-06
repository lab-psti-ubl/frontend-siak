import React from 'react';
import { Users, Download, Filter, Calendar } from 'lucide-react';
import Badge from '../../../../../ui/Badge';
import Button from '../../../../../ui/Button';
import { TahunAjaran } from '../../../../../../types';

interface DataMuridKelasHeaderProps {
  myKelas: any;
  onExportData: () => void;
}

const DataMuridKelasHeader: React.FC<DataMuridKelasHeaderProps> = ({
  myKelas,
  onExportData
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Data Murid Kelas</h2>
        <p className="sm:block hidden">Kelola data dan informasi murid di kelas Anda</p>
      </div>
      <div className="flex items-center space-x-3">
        <Button onClick={onExportData} variant="secondary" className="bg-green-600 justify-center flex items-center text-white">
          <Download size={16} className="mr-2 text-white" />
          Export Excel
        </Button>
      </div>
    </div>
  );
};

export default DataMuridKelasHeader;