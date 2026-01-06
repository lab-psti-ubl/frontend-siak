import React, { useMemo, useState } from 'react';
import { Users, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import {
  User,
  Nilai,
  MataPelajaran,
  JadwalPelajaran
} from '../../../../../../types';
import { exportRekapNilaiPDF, exportRekapNilaiExcel } from './exportRekapNilaiUtils';

interface NilaiKelasRekapTableProps {
  muridKelas: User[];
  uniqueMapel: string[];
  mataPelajaran: MataPelajaran[];
  kelasWali: string;
  activeTahunAjaran: { tahun: string; semester: number };
  nilai: Nilai[];
  jadwalKelas: JadwalPelajaran[];
  namaKelas: string;
  namaWaliKelas: string;
}

const NilaiKelasRekapTable: React.FC<NilaiKelasRekapTableProps> = ({
  muridKelas,
  uniqueMapel,
  mataPelajaran,
  kelasWali,
  activeTahunAjaran,
  nilai,
  jadwalKelas,
  namaKelas,
  namaWaliKelas
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (muridId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(muridId)) {
        newSet.delete(muridId);
      } else {
        newSet.add(muridId);
      }
      return newSet;
    });
  };

  // Get nilai akhir untuk setiap murid dan setiap mata pelajaran
  const rekapData = useMemo(() => {
    return muridKelas.map((murid) => {
      const nilaiPerMapel: { [mapelId: string]: number | null } = {};
      
      uniqueMapel.forEach((mapelId) => {
        const nilaiMurid = nilai.find(n =>
          n.muridId === murid.id &&
          n.mataPelajaranId === mapelId &&
          n.kelasId === kelasWali &&
          n.semester === activeTahunAjaran.semester &&
          n.tahunAjaran === activeTahunAjaran.tahun
        );
        
        nilaiPerMapel[mapelId] = nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir : null;
      });

      // Calculate rata-rata: sum all values (null treated as 0), divide by total number of mata pelajaran
      const totalMapel = uniqueMapel.length;
      const sumNilai = uniqueMapel.reduce((sum, mapelId) => {
        const nilai = nilaiPerMapel[mapelId];
        return sum + (nilai != null ? nilai : 0);
      }, 0);
      const rataRata = totalMapel > 0 ? sumNilai / totalMapel : null;

      return {
        murid,
        nilaiPerMapel,
        rataRata
      };
    });
  }, [muridKelas, uniqueMapel, nilai, kelasWali, activeTahunAjaran]);

  // Sort mata pelajaran by name
  const sortedMapel = useMemo(() => {
    return [...uniqueMapel].sort((a, b) => {
      const nameA = mataPelajaran.find(m => m.id === a)?.name || '';
      const nameB = mataPelajaran.find(m => m.id === b)?.name || '';
      return nameA.localeCompare(nameB);
    });
  }, [uniqueMapel, mataPelajaran]);

  const handleExportPDF = () => {
    exportRekapNilaiPDF(
      rekapData.map(d => ({ murid: d.murid, nilaiPerMapel: d.nilaiPerMapel, rataRata: d.rataRata })),
      sortedMapel,
      mataPelajaran,
      namaKelas,
      activeTahunAjaran.tahun,
      activeTahunAjaran.semester,
      namaWaliKelas
    );
  };

  const handleExportExcel = () => {
    exportRekapNilaiExcel(
      rekapData.map(d => ({ murid: d.murid, nilaiPerMapel: d.nilaiPerMapel, rataRata: d.rataRata })),
      sortedMapel,
      mataPelajaran,
      namaKelas,
      activeTahunAjaran.tahun,
      activeTahunAjaran.semester,
      namaWaliKelas
    );
  };

  if (muridKelas.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 sm:py-16">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
          <p className="text-sm sm:text-base font-semibold text-slate-600">Belum ada murid di kelas ini</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Tambahkan murid untuk melihat nilai</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">
              Rekap Nilai Semua Mata Pelajaran
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              Nilai Akhir semua murid untuk semua mata pelajaran
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              variant="secondary"
              className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 bg-white text-blue-600 hover:bg-blue-50"
            >
              <FileText size={16} />
              Export PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="green"
              className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4"
            >
              <Download size={16} />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8 overflow-x-auto">
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              {/* First header row */}
              <TableRow>
                <TableCell header rowSpan={2} className="sticky left-0 z-10 align-middle">No</TableCell>
                <TableCell header rowSpan={2} className="sticky left-12 z-10 align-middle">NISN</TableCell>
                <TableCell header rowSpan={2} className="sticky left-40 z-10 min-w-[200px] align-middle">Nama Murid</TableCell>
                <TableCell 
                  header 
                  colSpan={sortedMapel.length} 
                  className="text-center font-bold"
                >
                  Nilai Akhir Mata Pelajaran
                </TableCell>
                <TableCell header rowSpan={2} className="text-center font-bold align-middle min-w-[100px]">
                  Rata-Rata
                </TableCell>
              </TableRow>
              {/* Second header row */}
              <TableRow>
                {sortedMapel.map((mapelId) => {
                  const mapel = mataPelajaran.find(m => m.id === mapelId);
                  return (
                    <TableCell key={mapelId} header className="min-w-[120px] text-center">
                      {mapel?.name || 'Unknown'}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rekapData.map((data, index) => (
                <TableRow key={data.murid.id}>
                  <TableCell className="sticky left-0 z-10 bg-white">{index + 1}</TableCell>
                  <TableCell className="sticky left-12 z-10 bg-white">{data.murid.nisn}</TableCell>
                  <TableCell className="sticky left-40 z-10 bg-white font-medium">{data.murid.name}</TableCell>
                  {sortedMapel.map((mapelId) => {
                    const nilaiAkhir = data.nilaiPerMapel[mapelId];
                    return (
                      <TableCell key={mapelId} className="text-center">
                        {nilaiAkhir != null ? (
                          <span className="font-semibold text-blue-600">
                            {nilaiAkhir.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    {data.rataRata != null ? (
                      <span className="font-bold text-green-600">
                        {data.rataRata.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view */}
        <div className="sm:hidden space-y-3">
          {rekapData.map((data, index) => {
            const isExpanded = expandedCards.has(data.murid.id);
            return (
              <div
                key={data.murid.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card Header - Always Visible */}
                <button
                  onClick={() => toggleCard(data.murid.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                      <h4 className="text-sm font-bold text-slate-900">{data.murid.name}</h4>
                    </div>
                    <p className="text-xs text-slate-600">NISN: {data.murid.nisn || '-'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-0.5">Rata-Rata</p>
                      {data.rataRata != null ? (
                        <span className="text-base font-bold text-green-600">
                          {data.rataRata.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="text-slate-400" size={20} />
                    ) : (
                      <ChevronDown className="text-slate-400" size={20} />
                    )}
                  </div>
                </button>

                {/* Card Content - Expandable */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-200 space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                        Nilai Akhir Mata Pelajaran
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {sortedMapel.map((mapelId) => {
                          const mapel = mataPelajaran.find(m => m.id === mapelId);
                          const nilaiAkhir = data.nilaiPerMapel[mapelId];
                          return (
                            <div
                              key={mapelId}
                              className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700">
                                  {mapel?.name || 'Unknown'}
                                </span>
                                {nilaiAkhir != null ? (
                                  <span className="text-sm font-bold text-blue-600">
                                    {nilaiAkhir.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default NilaiKelasRekapTable;

