import React from 'react';
import { Calendar, BookOpen, Filter } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { TahunAjaran } from '../../../../../../types';

interface RaportHeaderProps {
  targetKelas: any;
  selectedTahunAjaran: string;
  selectedSemester: number;
  availableTahunAjaran: TahunAjaran[];
  availableSemesters: TahunAjaran[];
  activeTahunAjaran: TahunAjaran | undefined;
  onTahunAjaranChange: (tahun: string) => void;
  onSemesterChange: (semester: number) => void;
  onResetToActive: () => void;
}

const RaportHeader: React.FC<RaportHeaderProps> = ({
  targetKelas,
  selectedTahunAjaran,
  selectedSemester,
  availableTahunAjaran,
  availableSemesters,
  activeTahunAjaran,
  onTahunAjaranChange,
  onSemesterChange,
  onResetToActive
}) => {
  const selectedTahunAjaranData = availableTahunAjaran.find(ta => ta.tahun === selectedTahunAjaran);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-md">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">Laporan Hasil Belajar</h2>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5 sm:mt-1">
                  {targetKelas?.name || 'Kelas Tidak Ditemukan'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm text-blue-100">Kelola dan sebarkan laporan hasil belajar untuk murid kelas Anda</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">Filter & Pengaturan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Tahun Ajaran</label>
              <select
                value={selectedTahunAjaran}
                onChange={(e) => onTahunAjaranChange(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {availableTahunAjaran.map((ta) => (
                  <option key={ta.id} value={ta.tahun}>
                    {ta.tahun} {ta.isActive && '(Aktif)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => onSemesterChange(parseInt(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {availableSemesters.map((ta) => (
                  <option key={`${ta.tahun}-${ta.semester}`} value={ta.semester}>
                    Semester {ta.semester} ({ta.semester === 1 ? 'Ganjil' : 'Genap'}) {ta.isActive && '(Aktif)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex flex-col">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Aksi</label>
              <Button
                onClick={onResetToActive}
               
                className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center bg-blue-500 justify-center"
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                Reset Aktif
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs sm:text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Periode Aktif:</span> {selectedTahunAjaranData?.tahun} - Semester {selectedSemester}
            </span>
          </div>
         
        </div>
      </div>
    </div>
  );
};

export default RaportHeader;