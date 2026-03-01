import React from 'react';
import Badge from '../../../../ui/Badge';

type TahunAjaran = { tahun: string; semester: number };

type Props = {
  selectedKelasAdmin: { tingkat: number; mataPelajaranId: string } | null;
  selectedBank: { judul: string; kategoriNama: string; tipe: string } | null;
  activeTahunAjaran: TahunAjaran | undefined;
};

const AdminBankSoalCBTHeader: React.FC<Props> = ({
  selectedKelasAdmin,
  selectedBank,
  activeTahunAjaran,
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
              {selectedKelasAdmin
                ? selectedBank
                  ? 'Bank Soal CBT'
                  : 'Bank Soal CBT'
                : 'Kelola CBT (Bank Soal)'}
            </h1>
            <p className="text-sm sm:text-base text-blue-100">
              {selectedBank
                ? 'Kelola soal untuk bank soal yang dipilih.'
                : selectedKelasAdmin
                  ? 'Kelola bank soal UTS/UAS untuk kelas yang dipilih.'
                  : 'Kelola bank soal UTS dan UAS global berdasarkan tingkat kelas dan mata pelajaran.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {activeTahunAjaran && (
              <Badge className="bg-white/10 text-white border border-white/20">
                Tahun Ajaran {activeTahunAjaran.tahun} • Semester{' '}
                {activeTahunAjaran.semester}
              </Badge>
            )}
            <p className="text-xs sm:text-sm text-blue-100">
              <span className="font-semibold">Admin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBankSoalCBTHeader;
