import React from 'react';
import { Search, Filter } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';

interface SearchAndFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'hadir' | 'tidak_hadir' | 'izin';
  onStatusFilterChange: (value: 'all' | 'hadir' | 'tidak_hadir' | 'izin') => void;
  filteredCount: number;
  totalCount: number;
}

const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
  totalCount
}) => {
  return (
    <Card className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama, email, atau NIP..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 lg:py-3 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 lg:gap-3">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-32 lg:min-w-40 transition-colors"
          >
            <option value="all">Semua Status</option>
            <option value="hadir">Sudah Absen</option>
            <option value="tidak_hadir">Belum Absen</option>
            <option value="izin">Izin/Sakit</option>
          </select>
          <Button variant="secondary" className="px-3 lg:px-4 py-2.5 lg:py-3 flex items-center justify-center" title="Filter options">
            <Filter size={16} />
          </Button>
        </div>
      </div>

      <div className="mt-3 lg:mt-4 text-xs lg:text-sm text-gray-600">
        Menampilkan <span className="font-semibold text-gray-900">{filteredCount}</span> dari <span className="font-semibold text-gray-900">{totalCount}</span> guru
      </div>
    </Card>
  );
};

export default SearchAndFilterBar;
