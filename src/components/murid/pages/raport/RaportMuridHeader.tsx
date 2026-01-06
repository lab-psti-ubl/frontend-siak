import React from 'react';
import { FileText, Filter } from 'lucide-react';
import Button from '../../../ui/Button';
import { TahunAjaran } from '../../../../types';

interface RaportMuridHeaderProps {
  targetKelas: any;
  selectedTahunAjaran: string;
  selectedSemester: number;
  availableTahunAjaran: TahunAjaran[];
  availableSemesters: TahunAjaran[];
  activeTahunAjaran: TahunAjaran | undefined;
  selectedTahunAjaranData: TahunAjaran | undefined;
  onTahunAjaranChange: (tahun: string) => void;
  onSemesterChange: (semester: number) => void;
  onResetToActive: () => void;
}

const RaportMuridHeader: React.FC<RaportMuridHeaderProps> = ({
  targetKelas,
  selectedTahunAjaran,
  selectedSemester,
  availableTahunAjaran,
  availableSemesters,
  activeTahunAjaran,
  selectedTahunAjaranData,
  onTahunAjaranChange,
  onSemesterChange,
  onResetToActive
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="text-white">
            <h2 className="text-xl sm:text-2xl font-bold mb-1">Laporan Hasil Belajar</h2>
            <p className="text-xs sm:text-sm text-blue-100">
              Lihat laporan hasil belajar dan prestasi akademik Anda
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-white mb-1">Tahun Ajaran</label>
            <select
              value={selectedTahunAjaran}
              onChange={(e) => onTahunAjaranChange(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium shadow-sm transition-all"
            >
              {availableTahunAjaran.map((ta) => (
                <option key={ta.id} value={ta.tahun}>
                  {ta.tahun}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-white mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => onSemesterChange(parseInt(e.target.value))}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium shadow-sm transition-all"
            >
              {availableSemesters.map((ta) => (
                <option key={`${ta.tahun}-${ta.semester}`} value={ta.semester}>
                  Semester {ta.semester} {ta.isActive && '(Aktif)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="lg:hidden mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-white mb-1">Tahun Ajaran</label>
          <select
            value={selectedTahunAjaran}
            onChange={(e) => onTahunAjaranChange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium shadow-sm"
          >
            {availableTahunAjaran.map((ta) => (
              <option key={ta.id} value={ta.tahun}>
                {ta.tahun}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-white mb-1">Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => onSemesterChange(parseInt(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium shadow-sm"
          >
            {availableSemesters.map((ta) => (
              <option key={`${ta.tahun}-${ta.semester}`} value={ta.semester}>
                Semester {ta.semester}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default RaportMuridHeader;