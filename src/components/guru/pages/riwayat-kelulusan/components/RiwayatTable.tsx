import React from 'react';
import { GraduationCap, CheckCircle, AlertCircle, Eye, Download } from 'lucide-react';
import { RiwayatWaliKelas } from '../../../../../types';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { calculatePersentaseKelulusan } from '../utils/riwayatKelulusanUtils';
import { getGraduationTingkatLabelSync } from '../../../../../utils/jenjangPendidikanUtils';

interface RiwayatTableProps {
  riwayat: RiwayatWaliKelas[];
  onViewDetail: (riwayat: RiwayatWaliKelas) => void;
  onExport: (riwayat: RiwayatWaliKelas) => void;
}

const RiwayatTable: React.FC<RiwayatTableProps> = ({
  riwayat,
  onViewDetail,
  onExport
}) => {
  if (riwayat.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
        <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">Belum Ada Riwayat Kelulusan</h3>
        <p className="text-xs sm:text-sm text-slate-600 mb-6">
          Anda belum pernah menjadi wali {getGraduationTingkatLabelSync()} yang mengalami kelulusan, atau belum ada proses kelulusan yang dilakukan admin.
        </p>
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
          <h4 className="font-medium text-blue-900 mb-2 text-xs sm:text-sm">Informasi:</h4>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>• Riwayat kelulusan akan muncul setelah admin memproses kelulusan</li>
            <li>• Hanya guru yang pernah menjadi wali {getGraduationTingkatLabelSync()} yang memiliki riwayat</li>
            <li>• Data mencakup semua murid yang pernah Anda bimbing hingga lulus</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableCell header className="text-sm">Kelas</TableCell>
              <TableCell header className="text-sm">Tahun Ajaran</TableCell>
              <TableCell header className="text-sm">Murid Lulus</TableCell>
              <TableCell header className="text-sm">Tidak Lulus</TableCell>
              <TableCell header className="text-sm">Tingkat Kelulusan</TableCell>
              <TableCell header className="text-sm">Tanggal Kelulusan</TableCell>
              <TableCell header className="text-sm">Aksi</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riwayat.map((item) => {
              const persentaseKelulusan = calculatePersentaseKelulusan(
                item.jumlahMuridLulus,
                item.jumlahMuridTidakLulus
              );

              return (
                <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-sm">
                    <div className="flex items-center">
                      <GraduationCap size={16} className="mr-2 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-slate-900">{item.namaKelas}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="info">{item.tahunAjaran}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center">
                      <CheckCircle size={16} className="mr-2 text-emerald-600 flex-shrink-0" />
                      <span className="font-bold text-emerald-700">{item.jumlahMuridLulus}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center">
                      <AlertCircle size={16} className="mr-2 text-red-600 flex-shrink-0" />
                      <span className="font-bold text-red-700">{item.jumlahMuridTidakLulus}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(persentaseKelulusan) >= 80 ? 'bg-emerald-500' :
                            parseFloat(persentaseKelulusan) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(parseFloat(persentaseKelulusan), 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 min-w-fit">{persentaseKelulusan}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {new Date(item.tanggalKelulusan).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewDetail(item)}
                        className="justify-center flex items-center"
                        title="Lihat detail"
                      >
                        <Eye size={14} className="mr-1" />
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onExport(item)}
                        className="justify-center flex items-center"
                        title="Export ke Excel"
                      >
                        <Download size={14} className="mr-1" />
                        Export
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile & Tablet List View */}
      <div className="lg:hidden space-y-3">
        {riwayat.map((item) => {
          const persentaseKelulusan = calculatePersentaseKelulusan(
            item.jumlahMuridLulus,
            item.jumlahMuridTidakLulus
          );

          return (
            <div key={item.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                      <GraduationCap size={18} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{item.namaKelas}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="info" className="text-xs">{item.tahunAjaran}</Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(item.tanggalKelulusan).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                      <p className="text-xs font-semibold text-slate-900">{item.jumlahMuridLulus}</p>
                    </div>
                    <p className="text-xs text-slate-500">Lulus</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
                      <p className="text-xs font-semibold text-slate-900">{item.jumlahMuridTidakLulus}</p>
                    </div>
                    <p className="text-xs text-slate-500">Tidak Lulus</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900 mb-1">{persentaseKelulusan}%</p>
                    <p className="text-xs text-slate-500">Kelulusan</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Tingkat Kelulusan</span>
                    <span className="text-xs font-bold text-slate-900">{persentaseKelulusan}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        parseFloat(persentaseKelulusan) >= 80 ? 'bg-emerald-500' :
                        parseFloat(persentaseKelulusan) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(parseFloat(persentaseKelulusan), 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onViewDetail(item)}
                    className="flex-1 text-xs justify-center flex items-center"
                  >
                    <Eye size={12} className="mr-1" />
                    Detail
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onExport(item)}
                    className="flex-1 text-xs justify-center flex items-center"
                  >
                    <Download size={12} className="mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default RiwayatTable;
