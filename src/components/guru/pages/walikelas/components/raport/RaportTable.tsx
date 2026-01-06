import React from 'react';
import { FileText, Printer, Download, Send, Users } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { User } from '../../../../../../types';
import { isMaxTingkatSync } from '../../../../../../utils/jenjangPendidikanUtils';

interface RaportTableProps {
  muridKelas: User[];
  selectedSemester: number;
  targetKelas: any;
  canDistribute: boolean;
  isDistributed: boolean;
  selectedTahunAjaran: string;
  onDistributeRaport: () => void;
  onViewDetail: (murid: User) => void;
  onPrintRaport: (murid: User) => void;
  onDownloadRaportPDF: (murid: User) => void;
  onExportRaport: (murid: User) => void;
  generateRaportData: (muridId: string) => any;
}

const RaportTable: React.FC<RaportTableProps> = ({
  muridKelas,
  selectedSemester,
  targetKelas,
  canDistribute,
  isDistributed,
  selectedTahunAjaran,
  onDistributeRaport,
  onViewDetail,
  onPrintRaport,
  onDownloadRaportPDF,
  onExportRaport,
  generateRaportData
}) => {
  const isKelasMaxTingkat =
    targetKelas?.tingkat != null ? isMaxTingkatSync(targetKelas.tingkat) : false;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Daftar Raport Murid
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Semester {selectedSemester} ({selectedSemester === 1 ? 'Ganjil' : 'Genap'})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="text-xs sm:text-sm">
              {selectedTahunAjaran}
            </Badge>

            {canDistribute && !isDistributed && (
              <Button
                onClick={onDistributeRaport}
                variant="success"
                className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Sebarkan Raport</span>
                <span className="sm:hidden">Sebarkan</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* JIKA DATA ADA */}
      <div className="overflow-x-auto">

        {muridKelas.length > 0 ? (
          <>
            {/* DESKTOP/TABLET VIEW: TABEL */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header className="text-sm">Nama Murid</TableCell>
                    <TableCell header className="text-sm">NISN</TableCell>
                    <TableCell header className="text-sm text-center">Rata-rata Nilai</TableCell>
                    <TableCell header className="text-sm text-center">Kehadiran</TableCell>
                    <TableCell header className="text-sm text-center">Status</TableCell>
                    <TableCell header className="text-sm text-center">Aksi</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {muridKelas.map((murid) => {
                    const raportData = generateRaportData(murid.id);

                    return (
                      <TableRow key={murid.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell className="text-sm font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-600">
                                {murid.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="truncate">{murid.name}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-slate-600">
                          <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                            {murid.nisn}
                          </code>
                        </TableCell>

                        <TableCell className="text-sm text-center font-bold">
                          {raportData?.overallGrade.toFixed(1) || '-'}
                        </TableCell>

                        <TableCell className="text-sm text-center">
                          {raportData?.attendanceRate.toFixed(1) || '-'}%
                        </TableCell>

                        <TableCell className="text-sm text-center">
                          {raportData && selectedSemester === 2 ? (
                            <Badge
                              variant={raportData.isNaikKelas ? 'success' : 'danger'}
                              className="text-xs"
                            >
                              {isKelasMaxTingkat
                                ? raportData.isNaikKelas
                                  ? 'LULUS'
                                  : 'TIDAK LULUS'
                                : raportData.isNaikKelas
                                  ? 'NAIK'
                                  : 'TIDAK NAIK'}
                            </Badge>
                          ) : (
                            <Badge variant="info" className="text-xs">
                              Sem {selectedSemester}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="secondary" onClick={() => onViewDetail(murid)} className="flex items-center justify-center">
                              <FileText className="w-4 h-4 mr-1" />
                              <span className="hidden md:inline">Detail</span>
                            </Button>

                            <Button size="sm" variant="secondary" onClick={() => onPrintRaport(murid)} className="flex items-center justify-center">
                              <Printer className="w-4 h-4 mr-1" />
                              <span className="hidden md:inline">Print</span>
                            </Button>

                            <Button size="sm" variant="secondary" onClick={() => onDownloadRaportPDF(murid)} className="flex items-center justify-center">
                              <Download className="w-4 h-4 mr-1" />
                              <span className="hidden md:inline">PDF</span>
                            </Button>

                            <Button size="sm" variant="secondary" onClick={() => onExportRaport(murid)} className="flex items-center justify-center">
                              <FileText className="w-4 h-4 mr-1" />
                              <span className="hidden md:inline">Excel</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* MOBILE VIEW: CARD LIST */}
            <div className="sm:hidden p-3 space-y-3">
              {muridKelas.map((murid) => {
                const raportData = generateRaportData(murid.id);

                return (
                  <div
                    key={murid.id}
                    className="border border-slate-200 rounded-xl p-4 shadow-sm bg-white"
                  >
                    {/* NAMA + AVATAR */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {murid.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{murid.name}</p>
                        <p className="text-xs text-slate-500">{murid.nisn}</p>
                      </div>
                    </div>

                    {/* NILAI / KEHADIRAN */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Rata-rata</p>
                        <p className="font-bold text-slate-800">
                          {raportData?.overallGrade.toFixed(1) || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Kehadiran</p>
                        <p className="font-semibold text-slate-800">
                          {raportData?.attendanceRate.toFixed(1) || '-'}%
                        </p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-slate-500">Status</p>

                        {raportData && selectedSemester === 2 ? (
                          <Badge
                            variant={raportData.isNaikKelas ? 'success' : 'danger'}
                            className="text-xs mt-1"
                          >
                            {isKelasMaxTingkat
                              ? raportData.isNaikKelas
                                ? 'LULUS'
                                : 'TIDAK LULUS'
                              : raportData.isNaikKelas
                                ? 'NAIK'
                                : 'TIDAK NAIK'}
                          </Badge>
                        ) : (
                          <Badge variant="info" className="text-xs mt-1">
                            Sem {selectedSemester}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* BUTTON AKSI */}
                    <div className="sm:hidden flex flex-col gap-2 mt-2">

                        {/* Row: print, pdf, excel */}
                        <div className="flex justify-between gap-1">

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onPrintRaport(murid)}
                            className="w-full py-1.5 px-2 flex items-center justify-center gap-1"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onDownloadRaportPDF(murid)}
                            className="w-full py-1.5 px-2 flex items-center justify-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onExportRaport(murid)}
                            className="w-full py-1.5 px-2 flex items-center justify-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Detail full width */}
                        <Button
                          size="sm"
                          
                          onClick={() => onViewDetail(murid)}
                          className="w-full py-2 flex items-center justify-center gap-2 bg-blue-500"
                        >
                          <FileText className="w-4 h-4" />
                          Detail Raport
                        </Button>
                      </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-600">Belum ada murid di kelas ini</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Tambahkan murid untuk melihat data raport</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default RaportTable;
