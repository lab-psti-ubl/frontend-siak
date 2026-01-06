import React from 'react';
import { Download, Filter } from 'lucide-react';
import Button from '../../../../../ui/Button';
import { TahunAjaran } from '../../../../../../types';

interface MuridKelasPeriodSelectorProps {
  selectedTahunAjaran: string;
  selectedSemester: number;
  availableTahunAjaran: TahunAjaran[];
  availableSemesters: TahunAjaran[];
  onTahunAjaranChange: (tahun: string) => void;
  onSemesterChange: (semester: number) => void;
  onResetToActive: () => void;
  onExport: () => void;
}

const MuridKelasPeriodSelector: React.FC<MuridKelasPeriodSelectorProps> = ({
  selectedTahunAjaran,
  selectedSemester,
  availableTahunAjaran,
  availableSemesters,
  onTahunAjaranChange,
  onSemesterChange,
  onResetToActive,
  onExport
}) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Tahun Ajaran:</label>
        <select
          value={selectedTahunAjaran}
          onChange={(e) => onTahunAjaranChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {availableTahunAjaran.map((ta) => (
            <option key={ta.id} value={ta.tahun}>
              {ta.tahun} {ta.isActive && '(Aktif)'}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Semester:</label>
        <select
          value={selectedSemester}
          onChange={(e) => onSemesterChange(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {availableSemesters.map((ta) => (
            <option key={`${ta.tahun}-${ta.semester}`} value={ta.semester}>
              Semester {ta.semester} ({ta.semester === 1 ? 'Ganjil' : 'Genap'}) {ta.isActive && '(Aktif)'}
            </option>
          ))}
        </select>
      </div>
      <Button variant="secondary" onClick={onResetToActive}>
        <Filter size={16} className="mr-2" />
        Reset ke Aktif
      </Button>
      <Button onClick={onExport} variant="secondary">
        <Download size={16} className="mr-2" />
        Export Excel
      </Button>
    </div>
  );
};

export default MuridKelasPeriodSelector;
