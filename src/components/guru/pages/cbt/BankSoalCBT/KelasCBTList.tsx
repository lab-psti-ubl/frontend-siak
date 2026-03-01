import React from 'react';
import { BookOpen, Layers, Plus, ListChecks, HelpCircle } from 'lucide-react';
import Button from '../../../../ui/Button';
import Card from '../../../../ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';

type CBTKelas = {
  id: string;
  tingkat: number;
  mataPelajaranId: string;
  semester: number;
  tahunAjaran: string;
};

type Props = {
  cbtKelas: CBTKelas[];
  tingkatLabel: (tingkat: number) => string;
  getMapelName: (id: string) => string;
  onOpenAddKelas: () => void;
  onSelectKelas: (k: CBTKelas) => void;
};

const KelasCBTList: React.FC<Props> = ({
  cbtKelas,
  tingkatLabel,
  getMapelName,
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
                Kelas CBT Saya
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Daftar kombinasi tingkat kelas dan mata pelajaran yang memiliki bank soal CBT.
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

        {cbtKelas.length === 0 ? (
          <div className="py-10 sm:py-12 px-5 sm:px-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">
              Belum ada kelas CBT
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Tambahkan kombinasi tingkat kelas dan mata pelajaran yang Anda ajar
              untuk mulai membuat bank soal CBT.
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
                    <TableCell header>Semester</TableCell>
                    <TableCell header>Tahun Ajaran</TableCell>
                    <TableCell header className="w-52 min-w-[200px]">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cbtKelas.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{tingkatLabel(item.tingkat)}</TableCell>
                      <TableCell>{getMapelName(item.mataPelajaranId)}</TableCell>
                      <TableCell>{item.semester}</TableCell>
                      <TableCell>{item.tahunAjaran}</TableCell>
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
              {cbtKelas.map((item, index) => (
                <div
                  key={item.id}
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
                  <p className="text-xs text-slate-500">
                    Semester {item.semester} • Tahun Ajaran {item.tahunAjaran}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Card className="flex items-start gap-3 p-4 sm:p-5 border-dashed border-slate-300">
        <div className="mt-0.5">
          <HelpCircle className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-1">
            Alur Bank Soal CBT
          </h4>
          <p className="text-xs sm:text-sm text-slate-600">
            Tambah dulu <span className="font-semibold">Kelas CBT</span> berdasarkan
            tingkat kelas dan mata pelajaran yang Anda ajar. Setelah itu, klik{' '}
            <span className="font-semibold">Lihat Bank Soal</span> untuk mengisi soal
            pilihan ganda, benar salah, menjodohkan, maupun essay.
          </p>
        </div>
      </Card>
    </>
  );
};

export default KelasCBTList;
