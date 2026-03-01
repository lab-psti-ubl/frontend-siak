import React from 'react';
import { ChevronLeft, Plus, ListChecks } from 'lucide-react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';

type CBTBankSoal = { id: string; judul: string; kategoriNama: string; tipe: string };
type KelasAdmin = { tingkat: number; mataPelajaranId: string };
type TahunAjaran = { tahun: string; semester: number };

type Props = {
  selectedKelasAdmin: KelasAdmin;
  bankSoal: CBTBankSoal[];
  activeTahunAjaran: TahunAjaran | undefined;
  tingkatLabel: (tingkat: number) => string;
  getMapelName: (id: string) => string;
  onBack: () => void;
  onAddBank: () => void;
  onSelectBank: (bank: CBTBankSoal) => void;
};

const AdminBankSoalList: React.FC<Props> = ({
  selectedKelasAdmin,
  bankSoal,
  activeTahunAjaran,
  tingkatLabel,
  getMapelName,
  onBack,
  onAddBank,
  onSelectBank,
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-1"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Kelas CBT</span>
        </Button>
        <Button
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          onClick={onAddBank}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Bank Soal</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Bank Soal CBT • {getMapelName(selectedKelasAdmin.mataPelajaranId)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {tingkatLabel(selectedKelasAdmin.tingkat)} • Semester{' '}
              {activeTahunAjaran?.semester ?? '-'} • Tahun Ajaran {activeTahunAjaran?.tahun ?? '-'}
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
            Total Bank Soal: {bankSoal.length}
          </Badge>
        </div>

        {bankSoal.length === 0 ? (
          <div className="py-10 sm:py-12 px-5 sm:px-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <ListChecks className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">
              Belum ada bank soal untuk kelas ini
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Klik tombol <span className="font-semibold">Tambah Bank Soal</span> di
              atas untuk membuat bank soal UTS atau UAS.
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <div className="hidden md:block overflow-x-auto">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableCell header className="w-12">No</TableCell>
                    <TableCell header className="max-w-[200px]">Judul Bank Soal</TableCell>
                    <TableCell header className="w-28">Kategori</TableCell>
                    <TableCell header className="w-40">Jenis Soal</TableCell>
                    <TableCell header className="w-52 min-w-[180px]">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankSoal.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs sm:text-sm text-slate-800 font-medium line-clamp-2">{item.judul}</p>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs sm:text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200">
                          {item.kategoriNama}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {item.tipe.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
                          onClick={() => onSelectBank(item)}
                        >
                          <ListChecks className="w-4 h-4" />
                          <span className="hidden sm:inline">Buat Soal</span>
                          <span className="sm:hidden">Soal</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">
              {bankSoal.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-slate-500">No. {index + 1}</span>
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white border-0 shrink-0"
                      onClick={() => onSelectBank(item)}
                    >
                      <ListChecks className="w-4 h-4" />
                      Buat Soal
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-2">{item.judul}</p>
                  <p className="text-xs text-slate-600">{item.kategoriNama} • {item.tipe.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBankSoalList;
