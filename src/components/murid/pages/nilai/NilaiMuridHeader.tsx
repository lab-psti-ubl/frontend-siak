import React from 'react';

interface NilaiMuridHeaderProps {
  selectedTahunAjaran: string;
  selectedSemester: number;
}

const NilaiMuridHeader: React.FC<NilaiMuridHeaderProps> = ({
  selectedTahunAjaran,
  selectedSemester
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div className="text-white">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Nilai Saya</h2>
          <p className="text-blue-50 text-sm md:text-base">Lihat nilai dan prestasi akademik Anda</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-full sm:w-auto bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-center">
              <p className="text-xs font-medium text-white mb-1.5">Periode Aktif</p>
              <p className="text-white font-semibold text-sm">
                {selectedTahunAjaran} - Semester {selectedSemester} ({selectedSemester === 1 ? 'Ganjil' : 'Genap'})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NilaiMuridHeader;
