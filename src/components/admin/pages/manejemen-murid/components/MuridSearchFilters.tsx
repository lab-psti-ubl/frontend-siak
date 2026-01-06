import React from 'react';
import { Search, Download } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';

interface MuridSearchFiltersProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  filteredCount: number;
  totalCount: number;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  onExportData: () => void;
}

const MuridSearchFilters: React.FC<MuridSearchFiltersProps> = ({
  searchTerm,
  statusFilter,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusFilterChange,
  onExportData
}) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari murid berdasarkan nama, NISN, atau email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-32"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
          <Button onClick={onExportData} variant="success" className="flex items-center ">
            <Download size={16} className="mr-2" />
            Export Excel
          </Button>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Menampilkan {filteredCount} dari {totalCount} murid
      </div>
    </Card>
  );
};

export default MuridSearchFilters;