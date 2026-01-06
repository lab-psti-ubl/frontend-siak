import React from 'react';
import { Search, Filter } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Kelas, Jurusan } from '../../../../../types';
import { isJurusanRequiredSync } from '../../../../../utils/jenjangPendidikanUtils';

interface AlumniFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  tahunLulusFilter: string;
  setTahunLulusFilter: (tahun: string) => void;
  jurusanFilter: string;
  setJurusanFilter: (jurusan: string) => void;
  kelasFilter: string;
  setKelasFilter: (kelas: string) => void;
  uniqueTahunLulus: string[];
  uniqueJurusan: string[];
  availableKelas: Kelas[];
  jurusan: Jurusan[];
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

const AlumniFilters: React.FC<AlumniFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  tahunLulusFilter,
  setTahunLulusFilter,
  jurusanFilter,
  setJurusanFilter,
  kelasFilter,
  setKelasFilter,
  uniqueTahunLulus,
  uniqueJurusan,
  availableKelas,
  jurusan,
  onResetFilters,
  filteredCount,
  totalCount
}) => {
  const getJurusanName = (jurusanId: string) => {
    return jurusan.find(j => j.id === jurusanId)?.name || 'Unknown';
  };

  const selectClass = "w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
  const labelClass = "block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-2.5";
  const showJurusan = isJurusanRequiredSync();

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Filter Data Alumni</h3>
          <p className="text-xs sm:text-sm text-slate-500">Cari dan filter data alumni berdasarkan kriteria</p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${showJurusan ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
          <div>
            <label className={labelClass}>Cari Alumni</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Nama, NISN, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tahun Lulus</label>
            <select
              value={tahunLulusFilter}
              onChange={(e) => setTahunLulusFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">Semua Tahun</option>
              {uniqueTahunLulus.map((tahun) => (
                <option key={tahun} value={tahun}>
                  {tahun}
                </option>
              ))}
            </select>
          </div>

          {showJurusan && (
            <div>
              <label className={labelClass}>Jurusan</label>
              <select
                value={jurusanFilter}
                onChange={(e) => {
                  setJurusanFilter(e.target.value);
                  setKelasFilter('');
                }}
                className={selectClass}
              >
                <option value="">Semua Jurusan</option>
                {uniqueJurusan.map((jurusanId) => (
                  <option key={jurusanId} value={jurusanId}>
                    {getJurusanName(jurusanId)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Kelas</label>
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className={selectClass}
              disabled={showJurusan ? !jurusanFilter : false}
            >
              <option value="">
                {(showJurusan && !jurusanFilter) ? 'Pilih jurusan dulu' : 'Semua Kelas'}
              </option>
              {availableKelas.map((kelasItem) => (
                <option key={kelasItem.id} value={kelasItem.id}>
                  {kelasItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <Button
              variant="secondary"
              onClick={onResetFilters}
              className="text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2"
              size="sm"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Reset</span>
              <span className="sm:hidden">Reset</span>
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-600">
            Menampilkan <span className="font-semibold text-slate-900">{filteredCount}</span> dari <span className="font-semibold text-slate-900">{totalCount}</span> alumni
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AlumniFilters;