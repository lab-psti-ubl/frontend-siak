import React from 'react';
import { Award, FileText, Printer, Download, Users, Eye } from 'lucide-react';
import { Alumni } from '../../../../../types';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import Card from '../../../../ui/Card';

interface AlumniTableProps {
  alumni: Alumni[];
  onViewRaport: (alumniItem: Alumni) => void;
  onPrintRaport: (alumniItem: Alumni) => void;
  onDownloadRaport: (alumniItem: Alumni) => void;
}

const AlumniTable: React.FC<AlumniTableProps> = ({
  alumni,
  onViewRaport,
  onPrintRaport,
  onDownloadRaport
}) => {
  if (alumni.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm sm:text-base">Tidak ada data alumni untuk kelas ini</p>
      </div>
    );
  }

  const getGradeColor = (nilai: number) => {
    if (nilai >= 85) return 'text-green-600 bg-green-50';
    if (nilai >= 75) return 'text-blue-600 bg-blue-50';
    if (nilai >= 65) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block max-h-96 overflow-y-auto border border-slate-200 rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Peringkat</TableCell>
              <TableCell header>Nama</TableCell>
              <TableCell header>NISN</TableCell>
              <TableCell header>Rata-rata Nilai</TableCell>
              <TableCell header>Kehadiran</TableCell>
              <TableCell header>Status</TableCell>
              <TableCell header>Aksi</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alumni.map((alumniItem) => (
              <TableRow key={alumniItem.id} className={alumniItem.peringkatKelas <= 3 ? 'bg-slate-50' : ''}>
                <TableCell>
                  <div className="flex items-center">
                    {alumniItem.peringkatKelas <= 3 && (
                      <Award className={`w-4 h-4 mr-2 ${
                        alumniItem.peringkatKelas === 1 ? 'text-amber-600' :
                        alumniItem.peringkatKelas === 2 ? 'text-slate-500' : 'text-amber-500'
                      }`} />
                    )}
                    <span className="font-bold">{alumniItem.peringkatKelas}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      (#{alumniItem.peringkatSekolah} sekolah)
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{alumniItem.nama}</div>
                </TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {alumniItem.nisn}
                  </code>
                </TableCell>
                <TableCell>
                  <div className={`inline-flex items-center px-2 py-1 rounded-lg text-sm font-semibold ${getGradeColor(alumniItem.nilaiAkhir)}`}>
                    {alumniItem.nilaiAkhir.toFixed(1)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-center">
                    {alumniItem.tingkatKehadiran.toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="success">LULUS</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onViewRaport(alumniItem)}
                      className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Raport"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPrintRaport(alumniItem)}
                      className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Cetak Raport"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDownloadRaport(alumniItem)}
                      className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="pb-10 lg:hidden space-y-3 max-h-96 overflow-y-auto">
        {alumni.map((alumniItem) => (
          <Card key={alumniItem.id} className={`border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
            alumniItem.peringkatKelas <= 3 ? 'bg-slate-50' : ''
          }`}>
            <div className=" p-4 space-y-3">
              {/* Header dengan Peringkat & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {alumniItem.peringkatKelas <= 3 && (
                      <Award className={`w-5 h-5 ${
                        alumniItem.peringkatKelas === 1 ? 'text-amber-600' :
                        alumniItem.peringkatKelas === 2 ? 'text-slate-500' : 'text-amber-500'
                      }`} />
                    )}
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                      {alumniItem.peringkatKelas}
                    </span>
                    <h4 className="font-semibold text-slate-900 text-sm">{alumniItem.nama}</h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-500">NISN: {alumniItem.nisn}</p>
                    <span className="text-xs text-slate-500">
                      (#{alumniItem.peringkatSekolah} sekolah)
                    </span>
                  </div>
                </div>
                <Badge variant="success" className="text-xs whitespace-nowrap">
                  LULUS
                </Badge>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-600 mb-0.5">Rata-rata Nilai</p>
                  <p className={`text-sm font-bold ${getGradeColor(alumniItem.nilaiAkhir)}`}>
                    {alumniItem.nilaiAkhir.toFixed(1)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-600 mb-0.5">Kehadiran</p>
                  <p className="text-sm font-bold text-slate-900">
                    {alumniItem.tingkatKehadiran.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onViewRaport(alumniItem)}
                  className="text-xs flex items-center justify-center gap-1"
                >
                  <Eye size={14} />
                  <span>Raport</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onPrintRaport(alumniItem)}
                  className="text-xs flex items-center justify-center gap-1"
                >
                  <Printer size={14} />
                  <span>Cetak</span>
                </Button>
                <Button
                  size="sm"
                  className="text-xs flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => onDownloadRaport(alumniItem)}
                >
                  <Download size={14} />
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

export default AlumniTable;
