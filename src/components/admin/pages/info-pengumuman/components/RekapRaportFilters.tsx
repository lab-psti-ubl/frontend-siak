import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { TahunAjaran, Kelas, Jurusan } from '../../../../../types';
import { isJurusanRequiredSync } from '../../../../../utils/jenjangPendidikanUtils';

interface RekapRaportFiltersProps {
  selectedTahunAjaran: string;
  selectedSemester: number;
  selectedJurusan: string;
  selectedKelas: string;
  searchQuery: string;
  availableTahunAjaran: TahunAjaran[];
  availableSemesters: TahunAjaran[];
  jurusanList: Jurusan[];
  kelasList: Kelas[];
  onTahunAjaranChange: (value: string) => void;
  onSemesterChange: (value: number) => void;
  onJurusanChange: (value: string) => void;
  onKelasChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

const RekapRaportFilters: React.FC<RekapRaportFiltersProps> = ({
  selectedTahunAjaran,
  selectedSemester,
  selectedJurusan,
  selectedKelas,
  searchQuery,
  availableTahunAjaran,
  availableSemesters,
  jurusanList,
  kelasList,
  onTahunAjaranChange,
  onSemesterChange,
  onJurusanChange,
  onKelasChange,
  onSearchChange,
  onReset
}) => {
  const selectClass = "w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg sm:rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
  const labelClass = "block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-2.5";
  const showJurusan = isJurusanRequiredSync();

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Filter Laporan Hasil Belajar</h3>
          <p className="text-xs sm:text-sm text-slate-500">Pilih tahun ajaran, semester, jurusan, dan kelas untuk melihat laporan hasil belajar</p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${showJurusan ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
          <div>
            <label className={labelClass}>Tahun Ajaran</label>
            <select
              value={selectedTahunAjaran}
              onChange={(e) => onTahunAjaranChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Pilih Tahun Ajaran</option>
              {availableTahunAjaran.map((ta) => (
                <option key={ta.id} value={ta.tahun}>
                  {ta.tahun}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => onSemesterChange(parseInt(e.target.value))}
              disabled={!selectedTahunAjaran}
              className={selectClass}
            >
              <option value="">Pilih Semester</option>
              {availableSemesters.map((sem) => (
                <option key={sem.id} value={sem.semester}>
                  Semester {sem.semester} {sem.semester === 1 ? '(Ganjil)' : '(Genap)'}
                </option>
              ))}
            </select>
          </div>

          {showJurusan && (
            <div>
              <label className={labelClass}>Jurusan</label>
              <select
                value={selectedJurusan}
                onChange={(e) => onJurusanChange(e.target.value)}
                disabled={!selectedTahunAjaran}
                className={selectClass}
              >
                <option value="">Pilih Jurusan</option>
                {jurusanList.map((jurusan) => (
                  <option key={jurusan.id} value={jurusan.id}>
                    {jurusan.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => onKelasChange(e.target.value)}
              disabled={showJurusan ? !selectedJurusan : !selectedTahunAjaran}
              className={selectClass}
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

        <div>
          <label className={labelClass}>Cari Murid</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-600">
            {selectedTahunAjaran && selectedKelas ? (
              <span>Filter aktif - Siap untuk ditampilkan</span>
            ) : (
              <span className="text-slate-400">Lengkapi filter untuk melihat data</span>
            )}
          </p>
          <Button
            variant="secondary"
            onClick={onReset}
            className="text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
            size="sm"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Reset</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RekapRaportFilters;
