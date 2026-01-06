import React from 'react';
import { Eye, Edit2, Trash2, Download, FileText } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import { SuratIzin } from '../../../../types';
import { getStatusBadgeVariant, getJenisBadgeVariant, getJenisLabel } from './suratIzinMuridUtils';

interface SuratIzinTableProps {
  mySuratIzin: SuratIzin[];
  onViewSurat: (surat: SuratIzin) => void;
  onDownloadSurat: (surat: SuratIzin) => void;
  onEditSurat: (surat: SuratIzin) => void;
  onDeleteSurat: (suratId: string) => void;
}

const SuratIzinTable: React.FC<SuratIzinTableProps> = ({
  mySuratIzin,
  onViewSurat,
  onDownloadSurat,
  onEditSurat,
  onDeleteSurat,
}) => {
  const getStatusBadge = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      menunggu: 'MENUNGGU',
      diterima: 'DITERIMA',
      ditolak: 'DITOLAK',
    };
    return <Badge variant={getStatusBadgeVariant(status)}>{statusLabels[status] || status.toUpperCase()}</Badge>;
  };

  const getJenisBadge = (jenis: string) => {
    return <Badge variant={getJenisBadgeVariant(jenis)}>{getJenisLabel(jenis)}</Badge>;
  };

  return (
    <Card className="overflow-hidden">
      {/* HEADER */}
      <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
          Riwayat Pengajuan
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Pantau status pengajuan surat izin Anda</p>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="block sm:hidden p-3 space-y-4">
        {mySuratIzin.length > 0 ? (
          mySuratIzin.map((surat) => (
            <div
              key={surat.id}
              className="border rounded-xl shadow-sm p-4 bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                {getJenisBadge(surat.jenis)}
                {getStatusBadge(surat.status)}
              </div>

              <div className="text-xs text-gray-600 mb-1">
                <strong>Periode:</strong>{' '}
                {surat.jenis === 'izin_dispen' ? (
                  <>
                    {new Date(surat.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}({surat.jamMulai} - {surat.jamSelesai})
                  </>
                ) : (
                  <>
                    {new Date(surat.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {' '}s/d{' '}
                    {new Date(surat.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </>
                )}
              </div>

              <div className="text-xs text-gray-600 mb-1">
                <strong>Alasan:</strong> {surat.alasan}
              </div>

              <div className="text-xs text-gray-600 mb-3">
                <strong>Diajukan:</strong>{' '}
                {new Date(surat.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* MOBILE BUTTONS */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => onViewSurat(surat)}
                  className="flex items-center justify-center bg-blue-50 text-blue-600 p-2 rounded-lg text-xs font-medium"
                >
                  <Eye className="w-4 h-4 mr-1" /> Lihat
                </button>

                {surat.status === 'diterima' && (
                  <button
                    onClick={() => onDownloadSurat(surat)}
                    className="flex items-center justify-center bg-green-50 text-green-600 p-2 rounded-lg text-xs font-medium"
                  >
                    <Download className="w-4 h-4 mr-1" /> Unduh
                  </button>
                )}

                {surat.status === 'menunggu' && (
                  <>
                    <button
                      onClick={() => onEditSurat(surat)}
                      className="flex items-center justify-center bg-amber-50 text-amber-600 p-2 rounded-lg text-xs font-medium"
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </button>

                    <button
                      onClick={() => onDeleteSurat(surat.id)}
                      className="flex items-center justify-center bg-red-50 text-red-600 p-2 rounded-lg text-xs font-medium"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Hapus
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">Belum Ada Pengajuan</p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block overflow-x-auto">
        {mySuratIzin.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableCell header>Jenis</TableCell>
                <TableCell header>Periode</TableCell>
                <TableCell header>Alasan</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Diajukan</TableCell>
                <TableCell header className="text-center">Aksi</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mySuratIzin.map((surat) => (
                <TableRow key={surat.id} className="hover:bg-gray-50 transition">
                  <TableCell>{getJenisBadge(surat.jenis)}</TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      {surat.jenis === 'izin_dispen' ? (
                        <>
                          <span className="font-medium">
                            {new Date(surat.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {surat.jamMulai} - {surat.jamSelesai}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">
                            {new Date(surat.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-gray-500 text-xs">
                            s/d {new Date(surat.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell max-w-xs truncate">
                    {surat.alasan}
                  </TableCell>

                  <TableCell>{getStatusBadge(surat.status)}</TableCell>

                  <TableCell className="hidden md:table-cell text-gray-600">
                    {new Date(surat.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-2">

                      <button
                        onClick={() => onViewSurat(surat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {surat.status === 'diterima' && (
                        <button
                          onClick={() => onDownloadSurat(surat)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      {surat.status === 'menunggu' && (
                        <>
                          <button
                            onClick={() => onEditSurat(surat)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteSurat(surat.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-14 text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">Belum Ada Pengajuan</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SuratIzinTable;
