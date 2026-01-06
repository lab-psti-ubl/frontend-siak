import React from 'react';
import { BookOpen, Filter } from 'lucide-react';
import Button from '../../../ui/Button';
import { TahunAjaran } from '../../../../types';

interface RaportMuridInfoCardProps {
  targetKelas: any;
  selectedTahunAjaran: string;
  selectedSemester: number;
  activeTahunAjaran: TahunAjaran | undefined;
  onResetToActive: () => void;
}

const RaportMuridInfoCard: React.FC<RaportMuridInfoCardProps> = ({
  targetKelas,
  selectedTahunAjaran,
  selectedSemester,
  activeTahunAjaran,
  onResetToActive
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 sm:px-6 py-4 border-b border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 rounded-lg p-2 mt-0.5">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
                {targetKelas?.name || 'Kelas tidak ditemukan'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {selectedTahunAjaran} - Semester {selectedSemester} ({selectedSemester === 1 ? 'Ganjil' : 'Genap'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedTahunAjaran === activeTahunAjaran?.tahun && selectedSemester === activeTahunAjaran?.semester && (
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Periode Aktif
              </span>
            )}
            {selectedTahunAjaran !== activeTahunAjaran?.tahun && (
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                Data Historis
              </span>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={onResetToActive}
              className="text-xs flex items-center"
            >
              <Filter size={14} className="mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaportMuridInfoCard;