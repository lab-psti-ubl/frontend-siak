import React from 'react';
import { BookOpen, Users } from 'lucide-react';
import { MataPelajaran, Kelas } from '../../../../../../types';

interface NilaiFiltersProps {
  selectedMapel: string;
  setSelectedMapel: (mapel: string) => void;
  selectedKelas: string;
  setSelectedKelas: (kelas: string) => void;
  uniqueMapel: string[];
  uniqueKelas: string[];
  mataPelajaran: MataPelajaran[];
  kelas: Kelas[];
}

const NilaiFilters: React.FC<NilaiFiltersProps> = ({
  selectedMapel,
  setSelectedMapel,
  selectedKelas,
  setSelectedKelas,
  uniqueMapel,
  uniqueKelas,
  mataPelajaran,
  kelas
}) => {
  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  const getKelasName = (kelasId: string) => {
    return kelas.find(k => k.id === kelasId)?.name || 'Unknown';
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Pilih Mata Pelajaran & Kelas</h3>
            <p className="text-xs sm:text-sm text-blue-100">Tentukan mata pelajaran dan kelas untuk input nilai</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 sm:mb-3">
              Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => {
                setSelectedMapel(e.target.value);
                setSelectedKelas('');
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-400 appearance-none cursor-pointer"
            >
              <option value="">Pilih Mata Pelajaran</option>
              {uniqueMapel.map(mapelId => (
                <option key={mapelId} value={mapelId}>
                  {getMapelName(mapelId)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 sm:mb-3">
              Kelas
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
              disabled={!selectedMapel}
            >
              <option value="">
                {!selectedMapel ? 'Pilih mata pelajaran terlebih dahulu' : 'Pilih Kelas'}
              </option>
              {uniqueKelas.map(kelasId => (
                <option key={kelasId} value={kelasId}>
                  {getKelasName(kelasId)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NilaiFilters;