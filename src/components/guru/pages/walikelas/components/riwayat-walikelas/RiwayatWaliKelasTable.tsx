import React, { useState } from 'react';
import { Eye, Download, FileDown, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Badge from '../../../../../ui/Badge';
import Button from '../../../../../ui/Button';
import { User } from '../../../../../types';

interface RiwayatWaliKelasTableProps {
  rekapData: any[];
  isLoading?: boolean;
  onViewDetail: (murid: User) => void;
  onPrintRaport: (murid: User) => void;
  onDownloadRaportPDF: (murid: User) => void;
  onExportRaport: (murid: User) => void;
}

const RiwayatWaliKelasTable: React.FC<RiwayatWaliKelasTableProps> = ({
  rekapData,
  isLoading = false,
  onViewDetail,
  onPrintRaport,
  onDownloadRaportPDF,
  onExportRaport
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (muridId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(muridId)) {
      newExpanded.delete(muridId);
    } else {
      newExpanded.add(muridId);
    }
    setExpandedRows(newExpanded);
  };

  const getGradeColor = (nilai: number) => {
    if (nilai >= 85) return 'text-green-600 bg-green-50';
    if (nilai >= 75) return 'text-blue-600 bg-blue-50';
    if (nilai >= 65) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getGradeBadge = (nilai: number) => {
    if (nilai >= 85) return 'success';
    if (nilai >= 75) return 'info';
    if (nilai >= 65) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 sm:p-12 text-center">
          <p className="text-slate-500 text-sm sm:text-base">Memuat data...</p>
        </div>
      </Card>
    );
  }

  if (rekapData.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 sm:p-12 text-center">
          <p className="text-slate-500 text-sm sm:text-base">Tidak ada data laporan hasil belajar untuk filter yang dipilih</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block border border-slate-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900">Daftar Siswa</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900">No</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900">Nama Siswa</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900">NISN</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900">Nilai Akhir</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900">Kehadiran</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-slate-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rekapData.map((item, index) => (
                <tr key={item.murid.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-slate-600">{index + 1}</td>
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium text-slate-900">
                    {item.murid.name}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-slate-600">
                    {item.murid.nisn}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold ${getGradeColor(item.nilaiAkhir)}`}>
                      {item.nilaiAkhir.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-slate-600">
                    {item.attendanceRate.toFixed(1)}%
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <Badge variant={item.isNaikKelas ? 'success' : (item.semester === 1 ? 'info' : 'warning')} className="text-xs sm:text-sm">
                      {item.semester === 1 
                        ? 'Semester Ganjil'
                        : item.isMaxTingkat
                          ? (item.isNaikKelas ? 'Lulus' : 'Tidak Lulus')
                          : (item.isNaikKelas ? 'Naik Kelas' : 'Tidak Naik')
                      }
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewDetail(item.murid)}
                        className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPrintRaport(item.murid)}
                        className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Cetak Laporan"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownloadRaportPDF(item.murid)}
                        className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onExportRaport(item.murid)}
                        className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Export Laporan"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-xs sm:text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{rekapData.length}</span> siswa
          </p>
        </div>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {rekapData.map((item, index) => (
          <Card key={item.murid.id} className="border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 space-y-3">
              {/* Header dengan Nomor & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    <h4 className="font-semibold text-slate-900 text-sm">{item.murid.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500">NISN: {item.murid.nisn}</p>
                </div>
                <Badge variant={item.isNaikKelas ? 'success' : (item.semester === 1 ? 'info' : 'warning')} className="text-xs whitespace-nowrap">
                  {item.semester === 1 
                    ? 'Ganjil'
                    : item.isMaxTingkat
                      ? (item.isNaikKelas ? 'Lulus' : 'Tidak Lulus')
                      : (item.isNaikKelas ? 'Naik' : 'Tidak Naik')
                  }
                </Badge>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-600 mb-0.5">Nilai Akhir</p>
                  <p className={`text-sm font-bold ${getGradeColor(item.nilaiAkhir)}`}>
                    {item.nilaiAkhir.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-600 mb-0.5">Kehadiran</p>
                  <p className="text-sm font-bold text-slate-900">
                    {item.attendanceRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onViewDetail(item.murid)}
                  className="text-xs flex items-center justify-center gap-1"
                >
                  <Eye size={14} />
                  <span>Detail</span>
                </Button>
                <Button
                  size="sm"
                  className="text-xs flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => onDownloadRaportPDF(item.murid)}
                >
                  <Download size={14} />
                  <span>Download</span>
                </Button>
              </div>

              {/* More Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onPrintRaport(item.murid)}
                  className="text-xs flex items-center justify-center gap-1"
                >
                  <Printer size={14} />
                  <span>Cetak</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onExportRaport(item.murid)}
                  className="text-xs flex items-center justify-center gap-1"
                >
                  <FileDown size={14} />
                  <span>Export</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}

        <div className="text-center py-4 text-xs sm:text-sm text-slate-600 px-4">
          Total: <span className="font-semibold text-slate-900">{rekapData.length}</span> siswa
        </div>
      </div>
    </>
  );
};

export default RiwayatWaliKelasTable;
