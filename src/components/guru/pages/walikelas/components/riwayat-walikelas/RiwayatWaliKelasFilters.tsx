import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import { TahunAjaran, Kelas } from '../../../../../types';

interface RiwayatWaliKelasFiltersProps {
  selectedTahunAjaran: string;
  selectedSemester: number;
  selectedKelas: string;
  searchQuery: string;
  availableTahunAjaran: TahunAjaran[];
  availableSemesters: TahunAjaran[];
  kelasList: Kelas[];
  onTahunAjaranChange: (value: string) => void;
  onSemesterChange: (value: number) => void;
  onKelasChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

const RiwayatWaliKelasFilters: React.FC<RiwayatWaliKelasFiltersProps> = ({
  selectedTahunAjaran,
  selectedSemester,
  selectedKelas,
  searchQuery,
  availableTahunAjaran,
  availableSemesters,
  kelasList,
  onTahunAjaranChange,
  onSemesterChange,
  onKelasChange,
  onSearchChange,
  onReset
}) => {
  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-4 sm:mb-5">Filter Data Laporan Hasil Belajar</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Tahun Ajaran */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                Tahun Ajaran
              </label>
              <select
                value={selectedTahunAjaran}
                onChange={(e) => onTahunAjaranChange(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Pilih Tahun Ajaran</option>
                {availableTahunAjaran.map((ta) => (
                  <option key={ta.id} value={ta.tahun}>
                    {ta.tahun}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => onSemesterChange(parseInt(e.target.value))}
                disabled={!selectedTahunAjaran}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 transition-colors"
              >
                <option value="">Pilih Semester</option>
                {availableSemesters.map((sem) => (
                  <option key={sem.id} value={sem.semester}>
                    Semester {sem.semester} {sem.semester === 1 ? '(Ganjil)' : '(Genap)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                Kelas
              </label>
              <select
                value={selectedKelas}
                onChange={(e) => onKelasChange(e.target.value)}
                disabled={!selectedTahunAjaran || !selectedSemester}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 transition-colors"
              >
                <option value="">Pilih Kelas</option>
                {kelasList.map((kelas) => (
                  <option key={kelas.id} value={kelas.id}>
                    {kelas.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
            Cari Murid
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Info & Reset */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-600">
            {selectedTahunAjaran && selectedSemester && selectedKelas ? (
              <>Menampilkan data siswa dengan filter</>
            ) : (
              <>Pilih tahun ajaran, semester, dan kelas untuk melihat data</>
            )}
          </p>
          <Button
            variant="secondary"
            onClick={onReset}
            className="text-xs sm:text-sm flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RiwayatWaliKelasFilters;
