import React from 'react';
import { ChevronLeft, Plus, ListChecks, Eye, Pencil, Trash2, Monitor } from 'lucide-react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';

type CBTSoalItem = { id: string; pertanyaan: string; poin: number };
type CBTBankSoal = { id: string; judul: string; kategoriNama: string; tipe: string };
type KelasAdmin = { tingkat: number; mataPelajaranId: string };

type Props = {
  selectedKelasAdmin: KelasAdmin;
  selectedBank: CBTBankSoal;
  soal: CBTSoalItem[];
  getMapelName: (id: string) => string;
  tingkatLabel: (tingkat: number) => string;
  onBack: () => void;
  onAddSoal: () => void;
  onPreview: () => void;
  onDetail: (item: CBTSoalItem) => void;
  onEdit: (item: CBTSoalItem) => void;
  onDelete: (item: CBTSoalItem) => void;
};

const AdminSoalList: React.FC<Props> = ({
  selectedKelasAdmin,
  selectedBank,
  soal,
  getMapelName,
  tingkatLabel,
  onBack,
  onAddSoal,
  onPreview,
  onDetail,
  onEdit,
  onDelete,
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
          <span>Kembali ke Bank Soal</span>
        </Button>
        <Button
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          onClick={onAddSoal}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Buat Soal</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Data Soal • {selectedBank.judul}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {tingkatLabel(selectedKelasAdmin.tingkat)} •{' '}
              {getMapelName(selectedKelasAdmin.mataPelajaranId)} • Kategori{' '}
              {selectedBank.kategoriNama} • Jenis{' '}
              {selectedBank.tipe.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {soal.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 border-slate-300"
                onClick={onPreview}
              >
                <Monitor className="w-4 h-4" />
                <span>Preview</span>
              </Button>
            )}
            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
              Total Soal: {soal.length}
            </Badge>
          </div>
        </div>

        {soal.length === 0 ? (
          <div className="py-10 sm:py-12 px-5 sm:px-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <ListChecks className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">
              Belum ada soal pada bank soal ini
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Klik tombol <span className="font-semibold">Tambah Buat Soal</span> di
              atas untuk mulai menambahkan soal ke dalam bank ini.
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <div className="hidden md:block overflow-x-auto">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableCell header className="w-12">No</TableCell>
                    <TableCell header className="max-w-[280px]">Pertanyaan</TableCell>
                    <TableCell header className="w-16">Poin</TableCell>
                    <TableCell header className="w-52 min-w-[200px]">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soal.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="text-xs sm:text-sm text-slate-800 line-clamp-2">{item.pertanyaan}</p>
                      </TableCell>
                      <TableCell>{item.poin}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => onDetail(item)}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Detail</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => onEdit(item)}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">
              {soal.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-slate-500">No. {index + 1} • Poin: {item.poin}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-1.5 text-blue-600 hover:bg-blue-50"
                        onClick={() => onDetail(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-1.5 text-amber-600 hover:bg-amber-50"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-1.5 text-red-600 hover:bg-red-50"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 line-clamp-2">{item.pertanyaan}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSoalList;
