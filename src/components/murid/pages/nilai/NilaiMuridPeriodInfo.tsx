import React from 'react';
import { Calendar } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { Kelas } from '../../../../types';

interface NilaiMuridPeriodInfoProps {
  targetKelas: Kelas | null;
  selectedTahunAjaran: string;
  selectedSemester: number;
}

const NilaiMuridPeriodInfo: React.FC<NilaiMuridPeriodInfoProps> = ({
  targetKelas,
  selectedTahunAjaran,
  selectedSemester
}) => {
  return (
    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-base mb-1">
              {targetKelas?.name || 'Kelas tidak ditemukan'}
            </h4>
            <p className="text-sm text-gray-600">
              {selectedTahunAjaran} - Semester {selectedSemester} ({selectedSemester === 1 ? 'Ganjil' : 'Genap'})
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">Periode Aktif</Badge>
        </div>
      </div>
    </Card>
  );
};

export default NilaiMuridPeriodInfo;
