import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { TahunAjaran } from '../../../../../../types';

interface DataMuridKelasInfoCardProps {
  targetKelas: any;
  selectedTahunAjaran: string;
  selectedSemester: number;
  activeTahunAjaran: TahunAjaran | undefined;
  onResetToActive: () => void;
}

const DataMuridKelasInfoCard: React.FC<DataMuridKelasInfoCardProps> = ({
  targetKelas,
  selectedTahunAjaran,
  selectedSemester,
  activeTahunAjaran,
  onResetToActive
}) => {
  return (
    <Card className="p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <h4 className="font-medium text-blue-900">
              Kelas: {targetKelas?.name || 'Kelas tidak ditemukan'}
            </h4>
            <p className="text-sm text-blue-700">
              {selectedTahunAjaran} - Semester {selectedSemester} ({selectedSemester === 1 ? 'Ganjil' : 'Genap'})
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedTahunAjaran === activeTahunAjaran?.tahun && selectedSemester === activeTahunAjaran?.semester && (
            <Badge variant="success">Periode Aktif</Badge>
          )}
          {selectedTahunAjaran !== activeTahunAjaran?.tahun && (
            <Badge variant="info">Data Historis</Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DataMuridKelasInfoCard;