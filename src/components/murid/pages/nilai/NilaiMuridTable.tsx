import React, { useState } from 'react';
import { BookOpen, Eye, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import { getGradeColor, getSemuaKomponenNilai } from '../../../../utils/nilaiUtils';
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';
import { exportToPDF, exportToExcel } from '../../../../utils/exportUtils';

interface NilaiData {
  mapelId: string;
  mapelName: string;
  guruName: string;
  kehadiran: number | undefined;
  rataTugas: number | undefined;
  jumlahTugas: number | undefined;
  uts: number | null;
  uas: number | null;
  nilaiAkhir: number | null | undefined;
  grade: string | null;
  komponenDinamis?: Array<{ komponenNama: string; nilai: number }>;
}

interface NilaiMuridTableProps {
  nilaiData: NilaiData[];
  kelasName: string;
  selectedTahunAjaran: string;
  selectedSemester: number;
  onViewDetail: (mapelId: string) => void;
}

const NilaiMuridTable: React.FC<NilaiMuridTableProps> = ({
  nilaiData,
  kelasName,
  selectedTahunAjaran,
  selectedSemester,
  onViewDetail
}) => {
  const { komponenNilai: semuaKomponen } = useKomponenNilai();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const getDynamicKomponen = () => {
    return semuaKomponen.filter(k => !['Kehadiran', 'Tugas', 'UTS', 'UAS'].includes(k.nama));
  };

  const handleExportPDF = () => {
    const semuaKomponenNilai = getSemuaKomponenNilai();
    const komponenDinamisList = semuaKomponenNilai.filter(k => !['UTS', 'UAS', 'Tugas', 'Kehadiran'].includes(k.nama));

    const data = nilaiData.map((data) => {
      const rowData: any = {
        mataPelajaran: data.mapelName,
        guru: data.guruName,
        kehadiran: data.kehadiran !== undefined && data.kehadiran !== null ? `${data.kehadiran.toFixed(1)}%` : '0.0%',
        rataTugas: data.rataTugas !== undefined && data.rataTugas !== null ? data.rataTugas.toFixed(1) : '0.0',
        jumlahTugas: data.jumlahTugas || 0,
        uts: data.uts !== null ? data.uts : '-',
        uas: data.uas !== null ? data.uas : '-',
        nilaiAkhir: data.nilaiAkhir !== null && data.nilaiAkhir !== undefined ? data.nilaiAkhir.toFixed(1) : '-',
        grade: data.grade || '-'
      };

      komponenDinamisList.forEach(komponen => {
        const komponenValue = data.komponenDinamis?.find(kd => kd.komponenNama === komponen.nama);
        rowData[komponen.nama] = komponenValue?.nilai !== undefined ? komponenValue.nilai.toFixed(1) : '-';
      });

      return rowData;
    });

    const baseColumns = [
      { header: 'Mata Pelajaran', dataKey: 'mataPelajaran', width: 25 },
      { header: 'Guru', dataKey: 'guru', width: 20 },
      { header: 'Kehadiran (%)', dataKey: 'kehadiran', width: 12 },
      { header: 'Rata-rata Tugas', dataKey: 'rataTugas', width: 15 },
      { header: 'Jumlah Tugas', dataKey: 'jumlahTugas', width: 12 },
      { header: 'UTS', dataKey: 'uts', width: 10 },
      { header: 'UAS', dataKey: 'uas', width: 10 }
    ];

    const komponenColumns = komponenDinamisList.map(komponen => ({
      header: komponen.nama,
      dataKey: komponen.nama,
      width: 12
    }));

    const columns = [
      ...baseColumns,
      ...komponenColumns,
      { header: 'Nilai Akhir', dataKey: 'nilaiAkhir', width: 12 },
      { header: 'Grade', dataKey: 'grade', width: 10 }
    ];

    const title = `DAFTAR NILAI SAYA\nKelas: ${kelasName}\nPeriode: ${selectedTahunAjaran} Semester ${selectedSemester}`;
    const filename = `nilai-saya-${kelasName}-${selectedTahunAjaran}-S${selectedSemester}`;

    exportToPDF(data, columns, title, filename);
  };

  const handleExportExcel = () => {
    const semuaKomponenNilai = getSemuaKomponenNilai();
    const komponenDinamisList = semuaKomponenNilai.filter(k => !['UTS', 'UAS', 'Tugas', 'Kehadiran'].includes(k.nama));

    const data = nilaiData.map((data) => {
      const rowData: any = {
        mataPelajaran: data.mapelName,
        guru: data.guruName,
        kehadiran: data.kehadiran !== undefined && data.kehadiran !== null ? `${data.kehadiran.toFixed(1)}%` : '0.0%',
        rataTugas: data.rataTugas !== undefined && data.rataTugas !== null ? data.rataTugas.toFixed(1) : '0.0',
        jumlahTugas: data.jumlahTugas || 0,
        uts: data.uts !== null ? data.uts : '-',
        uas: data.uas !== null ? data.uas : '-',
        nilaiAkhir: data.nilaiAkhir !== null && data.nilaiAkhir !== undefined ? data.nilaiAkhir.toFixed(1) : '-',
        grade: data.grade || '-'
      };

      komponenDinamisList.forEach(komponen => {
        const komponenValue = data.komponenDinamis?.find(kd => kd.komponenNama === komponen.nama);
        rowData[komponen.nama] = komponenValue?.nilai !== undefined ? komponenValue.nilai.toFixed(1) : '-';
      });

      return rowData;
    });

    const baseColumns = [
      { header: 'Mata Pelajaran', dataKey: 'mataPelajaran', width: 25 },
      { header: 'Guru', dataKey: 'guru', width: 20 },
      { header: 'Kehadiran (%)', dataKey: 'kehadiran', width: 12 },
      { header: 'Rata-rata Tugas', dataKey: 'rataTugas', width: 15 },
      { header: 'Jumlah Tugas', dataKey: 'jumlahTugas', width: 12 },
      { header: 'UTS', dataKey: 'uts', width: 10 },
      { header: 'UAS', dataKey: 'uas', width: 10 }
    ];

    const komponenColumns = komponenDinamisList.map(komponen => ({
      header: komponen.nama,
      dataKey: komponen.nama,
      width: 12
    }));

    const columns = [
      ...baseColumns,
      ...komponenColumns,
      { header: 'Nilai Akhir', dataKey: 'nilaiAkhir', width: 12 },
      { header: 'Grade', dataKey: 'grade', width: 10 }
    ];

    const title = `DAFTAR NILAI SAYA\nKelas: ${kelasName}\nPeriode: ${selectedTahunAjaran} Semester ${selectedSemester}`;
    const filename = `nilai-saya-${kelasName}-${selectedTahunAjaran}-S${selectedSemester}`;

    exportToExcel(data, columns, title, filename);
  };

  const toggleCard = (mapelId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mapelId)) {
        newSet.delete(mapelId);
      } else {
        newSet.add(mapelId);
      }
      return newSet;
    });
  };

  return (
    <Card className="shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></span>
          Nilai per Mata Pelajaran
        </h3>
        {nilaiData.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="danger"
              onClick={handleExportPDF}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleExportExcel}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </div>
        )}
      </div>

      {nilaiData.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <TableCell header>Mata Pelajaran</TableCell>
                  <TableCell header>Guru</TableCell>
                  <TableCell header>Kehadiran</TableCell>
                  <TableCell header>Tugas</TableCell>
                  <TableCell header>UTS</TableCell>
                  <TableCell header>UAS</TableCell>
                  {getDynamicKomponen().map((k) => (
                    <TableCell key={k.id} header>{k.nama}</TableCell>
                  ))}
                  <TableCell header>Nilai Akhir</TableCell>
                  <TableCell header>Grade</TableCell>
                  <TableCell header>Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nilaiData.map((data) => (
                  <TableRow key={data.mapelId} className="hover:bg-blue-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <BookOpen size={16} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{data.mapelName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{data.guruName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="inline-flex px-2.5 py-1 bg-blue-50 rounded-lg">
                          <span className="text-sm font-semibold text-blue-700">
                            {data.kehadiran !== undefined && data.kehadiran !== null ? data.kehadiran.toFixed(1) : '0.0'}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="inline-flex flex-col px-2.5 py-1 bg-emerald-50 rounded-lg">
                          <span className="text-sm font-semibold text-emerald-700">
                            {data.rataTugas !== undefined && data.rataTugas !== null ? data.rataTugas.toFixed(1) : '0.0'}
                          </span>
                          
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="inline-flex px-3 py-1 bg-orange-50 rounded-lg font-semibold text-orange-700">
                          {data.uts !== null ? data.uts : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="inline-flex px-3 py-1 bg-rose-50 rounded-lg font-semibold text-rose-700">
                          {data.uas !== null ? data.uas : '-'}
                        </span>
                      </div>
                    </TableCell>
                    {getDynamicKomponen().map((k) => {
                      const komponenValue = data.komponenDinamis?.find(kd => kd.komponenNama === k.nama);
                      return (
                        <TableCell key={k.id}>
                          <div className="text-center">
                            <span className="inline-flex px-3 py-1 bg-purple-50 rounded-lg font-semibold text-purple-700">
                              {komponenValue?.nilai !== undefined ? komponenValue.nilai.toFixed(1) : '-'}
                            </span>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <div className="text-center">
                        <span className="inline-flex px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold text-base shadow-sm">
                          {data.nilaiAkhir !== null && data.nilaiAkhir !== undefined ? data.nilaiAkhir.toFixed(1) : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {data.grade ? (
                        <div className="flex justify-center">
                          <span className={`inline-flex px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm ${getGradeColor(data.grade)}`}>
                            {data.grade}
                          </span>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">-</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewDetail(data.mapelId)}
                        className="shadow-sm hover:shadow transition-shadow flex items-center"
                      >
                        <Eye size={14} className="mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="sm:hidden space-y-3">
            {nilaiData.map((data) => {
              const isExpanded = expandedCards.has(data.mapelId);
              return (
                <div
                  key={data.mapelId}
                  className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all duration-200"
                >
                  {/* Collapsed View - Always Visible */}
                  <div
                    onClick={() => toggleCard(data.mapelId)}
                    className="p-4 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{data.mapelName}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{data.guruName}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <div className="text-right">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg px-3 py-1.5 font-bold text-base shadow-sm">
                            {data.nilaiAkhir !== null && data.nilaiAkhir !== undefined ? data.nilaiAkhir.toFixed(1) : '-'}
                          </div>
                        </div>
                        {data.grade && (
                          <Badge variant={
                            data.grade === 'A' ? 'success' :
                            data.grade === 'B' ? 'info' :
                            data.grade === 'C' ? 'warning' :
                            'danger'
                          }>
                            {data.grade}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded View - Detail Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Kehadiran</span>
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-bold text-blue-600">
                              {data.kehadiran !== undefined && data.kehadiran !== null ? data.kehadiran.toFixed(1) : '0.0'}%
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Tugas</span>
                          <div className="bg-emerald-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-bold text-emerald-600">
                              {data.rataTugas !== undefined && data.rataTugas !== null ? data.rataTugas.toFixed(1) : '0.0'}
                            </div>
                            <p className="text-xs text-emerald-700 mt-0.5">
                              {data.jumlahTugas || 0} tugas
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">UTS</span>
                          <div className="bg-orange-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-bold text-orange-600">
                              {data.uts !== null ? data.uts : '-'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">UAS</span>
                          <div className="bg-rose-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-bold text-rose-600">
                              {data.uas !== null ? data.uas : '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {getDynamicKomponen().length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {getDynamicKomponen().map((k) => {
                            const komponenValue = data.komponenDinamis?.find(kd => kd.komponenNama === k.nama);
                            return (
                              <div key={k.id}>
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">{k.nama}</span>
                                <div className="bg-slate-100 rounded-lg p-1.5 text-center">
                                  <div className="text-xs font-bold text-slate-700">
                                    {komponenValue?.nilai !== undefined ? komponenValue.nilai.toFixed(1) : '-'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onViewDetail(data.mapelId)}
                          className="w-full flex items-center justify-center gap-2 text-xs py-2"
                        >
                          <Eye size={14} />
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
            <BookOpen className="w-12 h-12 text-gray-300" />
          </div>
          <h4 className="text-base font-medium text-gray-700 mb-2">Belum ada data nilai</h4>
          <p className="text-sm">Belum ada mata pelajaran untuk {kelasName} pada {selectedTahunAjaran} semester {selectedSemester}</p>
        </div>
      )}
    </Card>
  );
};

export default NilaiMuridTable;
