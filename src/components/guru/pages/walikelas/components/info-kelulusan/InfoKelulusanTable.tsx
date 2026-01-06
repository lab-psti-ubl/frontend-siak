import React from 'react';
import { Users, Award, Eye } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import Card from '../../../../../ui/Card';
import { KelulusanDataItem } from './InfoKelulusanUtils';
import { User } from '../../../../../../types';

interface InfoKelulusanTableProps {
  kelulusanData: KelulusanDataItem[];
  kelasName?: string;
  onViewDetail: (murid: User) => void;
}

const InfoKelulusanTable: React.FC<InfoKelulusanTableProps> = ({
  kelulusanData,
  kelasName,
  onViewDetail
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 sm:px-6 py-4 border-b border-teal-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Data Kelulusan</h3>
            <p className="text-xs sm:text-sm text-teal-100 mt-0.5">Kelas {kelasName}</p>
          </div>
        </div>
      </div>

      {/* DESKTOP / TABLET VIEW */}
      <div className="hidden sm:block overflow-x-auto">
        {kelulusanData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header className="text-center w-12">Rank</TableCell>
                <TableCell header>Nama</TableCell>
                <TableCell header>NISN</TableCell>
                <TableCell header className="text-center">Nilai</TableCell>
                <TableCell header className="text-center">Kehadiran</TableCell>
                <TableCell header className="text-center">Status</TableCell>
                <TableCell header className="text-center w-20">Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelulusanData.map((data, index) => (
                <TableRow
                  key={data.murid.id}
                  className={`hover:bg-slate-50 transition-colors duration-150 ${
                    index < 3 ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <TableCell className="text-center font-semibold">
                    {index < 3 ? (
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-slate-700">{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                      {data.murid.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm font-mono text-slate-700">
                      {data.murid.nisn}
                    </code>
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-900">
                    {data.nilaiAkhir.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-center text-slate-700">
                    {data.kehadiran.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={data.isLulus ? 'success' : 'danger'}>
                      {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onViewDetail(data.murid)}
                      className="flex items-center justify-center gap-1 text-xs sm:text-sm"
                    >
                      <Eye size={14} />
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm text-slate-600">Belum ada murid di kelas ini</p>
          </div>
        )}
      </div>

      {/* MOBILE VIEW */}
      <div className="sm:hidden p-4 space-y-3">
        {kelulusanData.length > 0 ? (
          kelulusanData.map((data, index) => (
            <Card
              key={data.murid.id}
              className={`p-4 border rounded-xl shadow-sm ${
                index < 3 ? 'bg-gray-50/80 border-amber-200' : ''
              }`}
            >
              {/* HEADER */}
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-slate-900 text-lg">
                  {index < 3 ? (
                    <>
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                    </>
                  ) : (
                    <>#{index + 1}</>
                  )}
                </div>

                <Badge variant={data.isLulus ? 'success' : 'danger'}>
                  {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                </Badge>
              </div>

              {/* NAMA */}
              <div className="font-semibold text-slate-900 text-base">
                {data.murid.name}
              </div>

              {/* NISN */}
              <div className="mt-1">
                <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                  {data.murid.nisn}
                </code>
              </div>

              {/* NILAI & KEHADIRAN */}
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Nilai Akhir</p>
                  <p className="font-bold text-slate-900 text-lg">
                    {data.nilaiAkhir.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Kehadiran</p>
                  <p className="font-bold text-slate-900 text-lg">
                    {data.kehadiran.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* BUTTON */}
              <div className="mt-4">
                <Button
                  fullWidth
                  
                  onClick={() => onViewDetail(data.murid)}
                  className="flex items-center justify-center gap-2 bg-blue-500"
                >
                  <Eye size={16} />
                  Detail
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="p-4 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm text-slate-600">Belum ada murid</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoKelulusanTable;
