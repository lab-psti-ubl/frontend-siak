import React from 'react';
import { Eye, Download, FileDown, Printer, FileText, FileCheck } from 'lucide-react';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { User } from '../../../../../types';

interface RekapRaportTableProps {
  rekapData: any[];
  isLoading?: boolean;
  onViewDetail: (murid: User) => void;
  onPrintRaport: (murid: User) => void;
  onDownloadRaportPDF: (murid: User) => void;
  onExportRaport: (murid: User) => void;
  onViewERaport: (murid: User) => void;
}

const RekapRaportTable: React.FC<RekapRaportTableProps> = ({
  rekapData,
  isLoading = false,
  onViewDetail,
  onPrintRaport,
  onDownloadRaportPDF,
  onExportRaport,
  onViewERaport
}) => {
  const getGradeColor = (nilai: number) => {
    if (nilai >= 85) return 'text-green-600 bg-green-50';
    if (nilai >= 75) return 'text-blue-600 bg-blue-50';
    if (nilai >= 65) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <div className="p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-gray-500">Memuat data...</p>
        </div>
      </Card>
    );
  }

  if (rekapData.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <div className="p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-gray-500">Tidak ada data raport untuk filter yang dipilih</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Daftar laporan hasil belajar murid</h3>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">No</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">Nama Murid</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">NISN</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">Nilai Akhir</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">Kehadiran</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">Status</th>
                <th className="px-4 lg:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">E-Raport</th>
                <th className="px-4 lg:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rekapData.map((item, index) => (
                <tr key={item.murid.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                  <td className="px-4 lg:px-6 py-4 text-xs sm:text-sm text-slate-600">{index + 1}</td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="font-medium text-slate-900 text-xs sm:text-sm">{item.murid.name}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-700">
                      {item.murid.nisn}
                    </code>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm ${getGradeColor(item.nilaiAkhir)}`}>
                      {item.nilaiAkhir.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.attendanceRate >= 80 ? 'bg-emerald-500' :
                            item.attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(item.attendanceRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 min-w-fit">
                        {item.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <Badge variant={item.isNaikKelas ? 'success' : (item.semester === 1 ? 'info' : 'warning')}>
                      {item.semester === 1 
                        ? 'Semester Ganjil' 
                        : item.isMaxTingkat 
                          ? (item.isNaikKelas ? 'Lulus' : 'Tidak Lulus')
                          : (item.isNaikKelas ? 'Naik Kelas' : 'Tidak Naik')}
                    </Badge>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onViewERaport(item.murid)}
                        className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-2"
                        title="Lihat E-Raport"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Lihat</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-nowrap">
                      <button
                        onClick={() => onViewDetail(item.murid)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPrintRaport(item.murid)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                        title="Cetak Raport"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownloadRaportPDF(item.murid)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex-shrink-0"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onExportRaport(item.murid)}
                        className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors flex-shrink-0"
                        title="Export Raport"
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

        {/* Mobile View - Simplified */}
        <div className="md:hidden space-y-3 p-4">
          {rekapData.map((item, index) => (
            <div key={item.murid.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow duration-200">
              {/* Header: Nama, NISN, Peringkat */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 truncate mb-1">{item.murid.name}</p>
                  <p className="text-sm text-slate-600">NISN: {item.murid.nisn}</p>
                </div>
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg font-bold text-sm flex-shrink-0 ml-3">
                  #{index + 1}
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <Badge variant={item.isNaikKelas ? 'success' : (item.semester === 1 ? 'info' : 'warning')} size="sm">
                  {item.semester === 1 
                    ? 'Semester Ganjil' 
                    : item.isMaxTingkat 
                      ? (item.isNaikKelas ? 'Lulus' : 'Tidak Lulus')
                      : (item.isNaikKelas ? 'Naik Kelas' : 'Tidak Naik')}
                </Badge>
              </div>

              {/* E-Raport */}
              <div className="mb-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onViewERaport(item.murid)}
                  className="w-full px-3 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                  title="Lihat E-Raport"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Lihat E-Raport</span>
                </button>
              </div>

              {/* Aksi */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onViewDetail(item.murid)}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-xs font-medium"
                  title="Lihat Detail"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPrintRaport(item.murid)}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-medium"
                  title="Cetak Raport"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadRaportPDF(item.murid)}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors text-xs font-medium"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onExportRaport(item.murid)}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg transition-colors text-xs font-medium"
                  title="Export Raport"
                >
                  <FileDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet View - Full Details */}
        <div className="hidden md:block lg:hidden space-y-3 p-4 sm:p-5">
          {rekapData.map((item, index) => (
            <div key={item.murid.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Murid #{index + 1}</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{item.murid.name}</p>
                  <p className="text-xs text-slate-600 mt-1">NISN: {item.murid.nisn}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Nilai Akhir</p>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-xs ${getGradeColor(item.nilaiAkhir)}`}>
                    {item.nilaiAkhir.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Kehadiran</p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 bg-slate-200 rounded-full h-1.5 flex-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          item.attendanceRate >= 80 ? 'bg-emerald-500' :
                          item.attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(item.attendanceRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 min-w-fit">{item.attendanceRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Status</p>
                <Badge variant={item.isNaikKelas ? 'success' : (item.semester === 1 ? 'info' : 'warning')}>
                  {item.semester === 1 
                    ? 'Semester Ganjil' 
                    : item.isMaxTingkat 
                      ? (item.isNaikKelas ? 'Lulus' : 'Tidak Lulus')
                      : (item.isNaikKelas ? 'Naik Kelas' : 'Tidak Naik')}
                </Badge>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">E-Raport</p>
                <button
                  onClick={() => onViewERaport(item.murid)}
                  className="w-full px-3 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
                  title="Lihat E-Raport"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Lihat E-Raport</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Aksi</p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => onViewDetail(item.murid)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-xs font-medium"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Detail</span>
                  </button>
                  <button
                    onClick={() => onPrintRaport(item.murid)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-medium"
                    title="Cetak Raport"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Cetak</span>
                  </button>
                  <button
                    onClick={() => onDownloadRaportPDF(item.murid)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors text-xs font-medium"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    onClick={() => onExportRaport(item.murid)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg transition-colors text-xs font-medium"
                    title="Export Raport"
                  >
                    <FileDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rekapData.length === 0 && (
          <div className="text-center py-12 px-4">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tidak ada data</h3>
            <p className="text-xs sm:text-sm text-slate-600">Lengkapi filter untuk melihat laporan hasil belajar murid</p>
          </div>
        )}

        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-xs sm:text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{rekapData.length}</span> murid
          </p>
        </div>
      </div>
    </div>
  );
};

export default RekapRaportTable;
