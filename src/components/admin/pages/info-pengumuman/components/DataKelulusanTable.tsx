import React, { useState } from 'react';
import { Award, Eye, Download, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User } from '../../../../../types';
import { getGraduationKelasTextSync } from '../../../../../utils/jenjangPendidikanUtils';

interface DataKelulusanTableProps {
  kelulusanData: any[];
  onViewDetail: (murid: User) => void;
  onExportData: () => void;
}

const DataKelulusanTable: React.FC<DataKelulusanTableProps> = ({
  kelulusanData,
  onViewDetail,
  onExportData
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

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 sm:px-6 lg:px-8 py-4 border-b border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Data Kelulusan Lengkap</h3>
              <p className="text-xs sm:text-sm text-blue-100">Total {kelulusanData.length} murid</p>
            </div>
          </div>
          <Button onClick={onExportData} variant="secondary" className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 w-full sm:w-auto flex items-center justify-center">
            <Download size={14} className="mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        {kelulusanData.length > 0 ? (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Peringkat</TableCell>
                    <TableCell header>Nama Murid</TableCell>
                    <TableCell header>NISN</TableCell>
                    <TableCell header>Kelas</TableCell>
                    <TableCell header>Rata-rata Nilai</TableCell>
                    <TableCell header>Kehadiran</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelulusanData.map((data, index) => (
                    <TableRow
                      key={data.murid.id}
                      className={index < 3 ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-slate-50'}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Award
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                index === 0
                                  ? 'text-yellow-500'
                                  : index === 1
                                    ? 'text-slate-500'
                                    : 'text-orange-500'
                              }`}
                            />
                          )}
                          <span className="font-bold text-slate-900">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{data.murid.name}</div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm text-slate-700 font-mono">
                          {data.murid.nisn}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{data.kelas?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center font-bold text-slate-900">
                          {data.nilaiAkhir.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center text-slate-900">
                          {data.kehadiran.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={data.isLulus ? 'success' : 'danger'}>
                          {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onViewDetail(data.murid)}
                          className="text-xs sm:text-sm flex items-center justify-center"
                        >
                          <Eye size={12} className="mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="lg:hidden space-y-3">
              {kelulusanData.map((data, index) => {
                const isExpanded = expandedRows.has(data.murid.id);
                return (
                  <div
                    key={data.murid.id}
                    className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                      index < 3
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => toggleRow(data.murid.id)}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between hover:bg-opacity-75 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {index < 3 && (
                            <Award
                              className={`w-4 h-4 ${
                                index === 0
                                  ? 'text-yellow-500'
                                  : index === 1
                                    ? 'text-slate-500'
                                    : 'text-orange-500'
                              }`}
                            />
                          )}
                          {!(index < 3) && (
                            <span className="text-sm font-bold text-slate-600">{index + 1}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-sm font-semibold text-slate-900 truncate text-left">
                            {data.murid.name}
                          </p>
                          <p className="text-xs text-slate-600 mt-1 text-left">
                            {data.murid.nisn} • {data.kelas?.name}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant={data.isLulus ? 'success' : 'danger'}>
                            {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                          </Badge>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-slate-200 bg-white space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-xs sm:text-sm text-slate-600">Rata-rata Nilai</p>
                          <p className="text-base sm:text-lg font-bold text-slate-900">
                            {data.nilaiAkhir.toFixed(1)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs sm:text-sm text-slate-600">Kehadiran</p>
                          <p className="text-base sm:text-lg font-bold text-slate-900">
                            {data.kehadiran.toFixed(1)}%
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-200">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onViewDetail(data.murid)}
                            className="w-full text-xs sm:text-sm flex items-center justify-center"
                          >
                            <Eye size={14} className="mr-2" />
                            Lihat Detail Lengkap
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8 sm:py-10">
            <Users className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 text-slate-300" />
            <p className="text-sm sm:text-base text-slate-500 font-medium">Belum ada data murid {getGraduationKelasTextSync()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataKelulusanTable;