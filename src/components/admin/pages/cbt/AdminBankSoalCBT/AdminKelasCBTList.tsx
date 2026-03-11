import React from 'react';
import { BookOpen, Layers, Plus, ListChecks, HelpCircle } from 'lucide-react';
import Button from '../../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';

type KelasAdmin = { tingkat: number; mataPelajaranId: string; jurusanId?: string };
type TahunAjaran = { tahun: string; semester: number };

type Props = {
  kelasCBTList: KelasAdmin[];
  loadingAdminBanks: boolean;
  activeTahunAjaran: TahunAjaran | undefined;
  jurusanRequired?: boolean;
  tingkatLabel: (tingkat: number) => string;
  getMapelName: (id: string) => string;
  getJurusanName?: (id?: string) => string;
  onOpenAddKelas: () => void;
  onSelectKelas: (k: KelasAdmin) => void;
};

const AdminKelasCBTList: React.FC<Props> = ({
  kelasCBTList,
  loadingAdminBanks,
  activeTahunAjaran,
  jurusanRequired = false,
  tingkatLabel,
  getMapelName,
  getJurusanName,
  onOpenAddKelas,
  onSelectKelas,
}) => {
  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Kelas CBT Admin
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Daftar kombinasi tingkat kelas dan mata pelajaran yang memiliki bank soal CBT global (UTS/UAS).
              </p>
            </div>
          </div>
          <Button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
            onClick={onOpenAddKelas}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Kelas CBT</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>

        {loadingAdminBanks ? (
          <div className="py-10 sm:py-12 px-5 sm:px-6 text-center text-slate-500 text-sm">
            Memuat data...
          </div>
        ) : kelasCBTList.length === 0 ? (
          <div className="py-10 sm:py-12 px-5 sm:px-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">
              Belum ada kelas CBT
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Tambahkan kombinasi tingkat kelas dan mata pelajaran untuk mulai membuat bank soal CBT global (UTS/UAS).
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <div className="hidden md:block overflow-x-auto">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableCell header className="w-16">No</TableCell>
                    <TableCell header>Tingkat</TableCell>
                    <TableCell header>Mata Pelajaran</TableCell>
                    {jurusanRequired && <TableCell header>Jurusan</TableCell>}
                    <TableCell header>Semester</TableCell>
                    <TableCell header>Tahun Ajaran</TableCell>
                    <TableCell header className="w-52 min-w-[200px]">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelasCBTList.map((item, index) => (
                    <TableRow key={`${item.tingkat}-${item.mataPelajaranId}-${item.jurusanId || ''}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{tingkatLabel(item.tingkat)}</TableCell>
                      <TableCell>{getMapelName(item.mataPelajaranId)}</TableCell>
                      {jurusanRequired && (
                        <TableCell>{getJurusanName ? getJurusanName(item.jurusanId) : item.jurusanId || '-'}</TableCell>
                      )}
                      <TableCell>
                        {activeTahunAjaran ? activeTahunAjaran.semester : '-'}
                      </TableCell>
                      <TableCell>
                        {activeTahunAjaran ? activeTahunAjaran.tahun : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
                          onClick={() => onSelectKelas(item)}
                        >
                          <ListChecks className="w-4 h-4" />
                          <span className="hidden sm:inline">Lihat Bank Soal</span>
                          <span className="sm:hidden">Bank Soal</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">
              {kelasCBTList.map((item, index) => (
                <div
                  key={`${item.tingkat}-${item.mataPelajaranId}-${item.jurusanId || ''}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-slate-500">No. {index + 1}</span>
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white border-0 shrink-0"
                      onClick={() => onSelectKelas(item)}
                    >
                      <ListChecks className="w-4 h-4" />
                      Lihat Bank Soal
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {tingkatLabel(item.tingkat)} • {getMapelName(item.mataPelajaranId)}
                  </p>
                  {jurusanRequired && (
                    <p className="text-xs text-slate-600">
                      Jurusan: {getJurusanName ? getJurusanName(item.jurusanId) : item.jurusanId || '-'}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Semester {activeTahunAjaran?.semester ?? '-'} • Tahun Ajaran {activeTahunAjaran?.tahun ?? '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 sm:p-5 border border-dashed border-slate-300 rounded-xl bg-white">
        <div className="mt-0.5">
          <HelpCircle className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-1">
            Alur Bank Soal CBT
          </h4>
          <p className="text-xs sm:text-sm text-slate-600">
            Tambah dulu <span className="font-semibold">Kelas CBT</span> berdasarkan
            tingkat kelas dan mata pelajaran. Setelah itu, klik{' '}
            <span className="font-semibold">Lihat Bank Soal</span> untuk menambahkan bank soal
            UTS/UAS dan mengisi soal pilihan ganda, benar salah, menjodohkan, maupun essay.
          </p>
        </div>
      </div>
    </>
  );
};

export default AdminKelasCBTList;
