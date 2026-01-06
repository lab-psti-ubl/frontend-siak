import React from 'react';
import { Eye, Users } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { User, ERaport } from '../../../../../../types';
import { getInitials } from '../../../../../admin/pages/manejemen-murid/utils/muridUtils';

interface ERaportTableProps {
  muridKelas: Array<User & { peringkat: number; avgNilai: number }>;
  eraport: ERaport | null;
  muridStatusMap: Record<string, 'berhasil' | 'gagal'>;
  selectedTahunAjaran: string;
  selectedSemester: number;
  targetKelas: any;
  onViewDetail: (murid: User) => void;
}

const ERaportTable: React.FC<ERaportTableProps> = ({
  muridKelas,
  eraport,
  muridStatusMap,
  selectedTahunAjaran,
  selectedSemester,
  targetKelas,
  onViewDetail,
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="hidden sm:block">
        <div className="bg-slate-50 px-5 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-slate-200">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 uppercase tracking-wide">
            Daftar Murid Kelas
          </h3>
        </div>

        {muridKelas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>No</TableCell>
                <TableCell header>NISN</TableCell>
                <TableCell header>Nama Murid</TableCell>
                <TableCell header className="text-center">Peringkat</TableCell>
                <TableCell header className="text-center">Status</TableCell>
                <TableCell header className="text-center">Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {muridKelas.map((murid, index) => {
                const status = muridStatusMap[murid.id] || 'gagal';
                
                return (
                  <TableRow key={murid.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <TableCell className="text-sm text-slate-600">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-slate-700">
                      {murid.nisn || '-'}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-600 font-bold text-sm">
                            {getInitials(murid.name).charAt(0)}
                          </span>
                        </div>
                        <span>{murid.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-center font-semibold text-slate-700">
                      {murid.peringkat}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={status === 'berhasil' ? 'success' : 'danger'}
                        className="text-xs"
                      >
                        {status === 'berhasil' ? 'Berhasil' : 'Gagal'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        
                        onClick={() => onViewDetail(murid)}
                        className="flex items-center gap-2 bg-blue-600 text-white"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden lg:inline">Lihat Detail</span>
                        <span className="lg:hidden">Detail</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10 sm:py-16">
            <Users className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400" />
            <p className="text-sm sm:text-base font-semibold text-slate-600 mb-1">Tidak ada murid</p>
            <p className="text-xs sm:text-sm text-slate-500">
              Tidak ada data murid untuk periode ini
            </p>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="sm:hidden space-y-3 p-5">
        {muridKelas.length > 0 ? (
          muridKelas.map((murid, index) => {
            const status = muridStatusMap[murid.id] || 'gagal';
            
            return (
              <div
                key={murid.id}
                className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 hover:border-slate-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-600 font-bold text-sm">
                        {getInitials(murid.name).charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{murid.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{murid.nisn || '-'}</p>
                    </div>
                  </div>
                  <Badge
                    variant={status === 'berhasil' ? 'success' : 'danger'}
                    className="text-xs flex-shrink-0"
                  >
                    {status === 'berhasil' ? 'Berhasil' : 'Gagal'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">
                      Peringkat
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{murid.peringkat}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">
                      Rata-rata
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {murid.avgNilai > 0 ? murid.avgNilai.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onViewDetail(murid)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Detail</span>
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada murid</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ERaportTable;

