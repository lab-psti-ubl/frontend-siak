import React from 'react';
import { Download, FileText, BookMarked } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import { MataPelajaran } from '../../../../../../types';

interface NilaiKelasFiltersProps {
  selectedMapel: string;
  setSelectedMapel: (mapel: string) => void;
  uniqueMapel: string[];
  getMapelName: (mapelId: string) => string;
  getGuruName: (mapelId: string) => string;
  onExport: () => void;
  onExportPDF: () => void;
}

const NilaiKelasFilters: React.FC<NilaiKelasFiltersProps> = ({
  selectedMapel,
  setSelectedMapel,
  uniqueMapel,
  getMapelName,
  getGuruName,
  onExport,
  onExportPDF
}) => {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex-1">
          <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
            <BookMarked className="w-4 h-4 text-blue-600" />
            Mata Pelajaran
          </label>
          <select
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
          >
            <option value="">Pilih Mata Pelajaran</option>
            {uniqueMapel.map(mapelId => (
              <option key={mapelId} value={mapelId}>
                {getMapelName(mapelId)} - {getGuruName(mapelId)}
              </option>
            ))}
          </select>
        </div>
        {selectedMapel && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={onExportPDF}
              variant="danger"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5 sm:py-3 px-4"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              onClick={onExport}
              variant="green"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5 sm:py-3 px-4"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NilaiKelasFilters;
