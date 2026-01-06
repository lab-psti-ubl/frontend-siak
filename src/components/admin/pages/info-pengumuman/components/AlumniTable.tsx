import React from 'react';
import { GraduationCap, Award, Eye, Users } from 'lucide-react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { Alumni } from '../../../../../types';
import { shouldShowJurusanSync } from '../../../../../utils/jenjangPendidikanUtils';

interface AlumniTableProps {
  alumni: Alumni[];
  onViewDetail: (alumni: Alumni) => void;
  searchTerm: string;
}

const AlumniTable: React.FC<AlumniTableProps> = ({ alumni, onViewDetail, searchTerm }) => {
  const showJurusan = shouldShowJurusanSync();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50 border border-yellow-200';
    if (rank === 2) return 'text-slate-600 bg-slate-50 border border-slate-200';
    if (rank === 3) return 'text-orange-600 bg-orange-50 border border-orange-200';
    return 'text-slate-600 bg-white border border-slate-200';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Daftar Alumni</h3>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          {alumni.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header className="text-xs sm:text-sm">Peringkat</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Alumni</TableCell>
                  <TableCell header className="text-xs sm:text-sm">NISN</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Kelas</TableCell>
                  {showJurusan && (
                    <TableCell header className="text-xs sm:text-sm">Jurusan</TableCell>
                  )}
                  <TableCell header className="text-xs sm:text-sm">Tahun Lulus</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Rata-rata Nilai</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Kehadiran</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumni.map((alumniItem) => (
                  <TableRow key={alumniItem.id} className={alumniItem.peringkatSekolah <= 3 ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'}>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        {alumniItem.peringkatSekolah <= 3 && (
                          <Award className={`w-4 h-4 flex-shrink-0 ${
                            alumniItem.peringkatSekolah === 1 ? 'text-yellow-500' :
                            alumniItem.peringkatSekolah === 2 ? 'text-slate-400' : 'text-orange-600'
                          }`} />
                        )}
                        <div>
                          <div className="font-bold text-slate-900">#{alumniItem.peringkatSekolah}</div>
                          <div className="text-xs text-slate-500">Rank: {alumniItem.peringkatKelas}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                          {getInitials(alumniItem.nama)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{alumniItem.nama}</p>
                          <p className="text-xs text-slate-500">Alumni {alumniItem.tahunLulus}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-700">
                        {alumniItem.nisn}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <Badge variant="info">{alumniItem.namaKelas}</Badge>
                    </TableCell>
                    {showJurusan && (
                      <TableCell className="text-xs sm:text-sm">
                        {alumniItem.namaJurusan ? (
                          <Badge variant="warning">{alumniItem.namaJurusan}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-slate-900">{alumniItem.tahunLulus}</span>
                          <div className="text-xs text-slate-500">
                            {new Date(alumniItem.tanggalLulus).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="text-center font-bold text-slate-900">
                        {alumniItem.nilaiAkhir.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="text-center font-semibold text-slate-700">
                        {alumniItem.tingkatKehadiran.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewDetail(alumniItem)}
                        className="text-xs sm:text-sm flex items-center justify-center"
                      >
                        <Eye size={14} className="mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </div>

        {/* Mobile View - Simplified (sm only) */}
        <div className="md:hidden space-y-3 p-4">
          {alumni.length > 0 ? (
            alumni.map((alumniItem) => (
              <div key={alumniItem.id} className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-lg ${
                alumniItem.peringkatSekolah <= 3
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                  : 'bg-white border-slate-200'
              }`}>
                {/* Header: Foto, Nama, Peringkat */}
                <div className="flex items-center gap-3 mb-4">
                  {/* Foto Profile */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md">
                      {getInitials(alumniItem.nama)}
                    </div>
                    {alumniItem.peringkatSekolah <= 3 && (
                      <div className="absolute -top-1 -right-1">
                        <Award className={`w-5 h-5 ${
                          alumniItem.peringkatSekolah === 1 ? 'text-yellow-500' :
                          alumniItem.peringkatSekolah === 2 ? 'text-slate-400' : 'text-orange-600'
                        }`} />
                      </div>
                    )}
                  </div>

                  {/* Nama dan NISN */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate mb-1">{alumniItem.nama}</p>
                    <p className="text-xs text-slate-600 font-medium">NISN: {alumniItem.nisn}</p>
                  </div>

                  {/* Peringkat Badge */}
                  <div className={`px-3 py-1.5 rounded-lg font-bold text-sm flex-shrink-0 ${getRankBadgeColor(alumniItem.peringkatSekolah)}`}>
                    #{alumniItem.peringkatSekolah}
                  </div>
                </div>

                {/* Kelas dan Jurusan */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="info" size="sm">{alumniItem.namaKelas}</Badge>
                  {alumniItem.namaJurusan && (
                    <Badge variant="warning" size="sm">{alumniItem.namaJurusan}</Badge>
                  )}
                </div>

                {/* Tombol Lihat Detail */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onViewDetail(alumniItem)}
                  fullWidth
                  className="text-sm flex items-center justify-center"
                >
                  <Eye size={16} className="mr-2" />
                  Lihat Detail
                </Button>
              </div>
            ))
          ) : null}
        </div>

        {/* Tablet View - Full Details (md to lg) */}
        <div className="hidden md:block lg:hidden space-y-3 p-4 sm:p-5">
          {alumni.length > 0 ? (
            alumni.map((alumniItem) => (
              <div key={alumniItem.id} className={`border rounded-lg p-4 space-y-3 transition-all duration-200 hover:shadow-md ${
                alumniItem.peringkatSekolah <= 3
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {getInitials(alumniItem.nama)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {alumniItem.peringkatSekolah <= 3 && (
                          <Award className={`w-4 h-4 flex-shrink-0 ${
                            alumniItem.peringkatSekolah === 1 ? 'text-yellow-500' :
                            alumniItem.peringkatSekolah === 2 ? 'text-slate-400' : 'text-orange-600'
                          }`} />
                        )}
                        <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{alumniItem.nama}</p>
                      </div>
                      <p className="text-xs text-slate-600">NISN: {alumniItem.nisn}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg font-bold text-xs flex-shrink-0 ${getRankBadgeColor(alumniItem.peringkatSekolah)}`}>
                      #{alumniItem.peringkatSekolah}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Kelas & Jurusan</p>
                    <div className="space-y-1">
                      <Badge variant="info" size="sm">{alumniItem.namaKelas}</Badge>
                      {alumniItem.namaJurusan && (
                        <div>
                          <Badge variant="warning" size="sm">{alumniItem.namaJurusan}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Tahun & Nilai</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-900">{alumniItem.tahunLulus}</p>
                      <p className="text-xs font-bold text-slate-700">{alumniItem.nilaiAkhir.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Kehadiran</p>
                    <p className="text-sm font-bold text-slate-900">{alumniItem.tingkatKehadiran.toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Tanggal Lulus</p>
                    <p className="text-xs font-medium text-slate-700">
                      {new Date(alumniItem.tanggalLulus).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onViewDetail(alumniItem)}
                    fullWidth
                    className="text-xs sm:text-sm flex items-center justify-center"
                  >
                    <Eye size={14} className="mr-1.5" />
                    Lihat Detail
                  </Button>
                </div>
              </div>
            ))
          ) : null}
        </div>

        {alumni.length === 0 && (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              {searchTerm ? 'Tidak ada hasil' : 'Belum ada data alumni'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {searchTerm
                ? `Tidak ditemukan alumni dengan kata kunci "${searchTerm}"`
                : 'Data alumni akan muncul setelah admin memproses kelulusan'
              }
            </p>
          </div>
        )}

        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-xs sm:text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{alumni.length}</span> alumni
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlumniTable;