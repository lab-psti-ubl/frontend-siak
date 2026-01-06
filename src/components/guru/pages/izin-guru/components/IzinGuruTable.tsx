import React from 'react';
import {
  FileText,
  Trash2,
  Edit,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { IzinGuru } from '../../../../../types';
import { getStatusBadge, getJenisBadge } from '../utils/izinGuruUtils';

interface IzinGuruTableProps {
  izinList: IzinGuru[];
  onViewDetail: (izin: IzinGuru) => void;
  onEdit?: (izin: IzinGuru) => void;
  onDelete?: (izin: IzinGuru) => void;
}

const IzinGuruTable: React.FC<IzinGuruTableProps> = ({
  izinList,
  onViewDetail,
  onEdit,
  onDelete
}) => {
  const isApproved = (status: string) => status === 'diterima';

  if (izinList.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Riwayat Pengajuan</h3>
              <p className="text-xs sm:text-sm text-white">
                Daftar semua pengajuan izin Anda
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-base sm:text-lg font-medium text-slate-600">
            Belum ada pengajuan izin
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Mulai dengan mengajukan izin melalui tombol di atas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Riwayat Pengajuan</h3>
            <p className="text-xs sm:text-sm text-white">
              Daftar semua pengajuan izin Anda ({izinList.length})
            </p>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/*             MOBILE LIST VIEW           */}
      {/* ====================================== */}
      <div className="block sm:hidden p-4 space-y-4">
        {izinList.map((izin) => (
          <div
            key={izin.id}
            className="border rounded-xl p-4 shadow-sm bg-white space-y-3"
          >
            {/* JENIS */}
            

            {/* TANGGAL */}
            <div className="text-sm text-slate-700 space-y-1">
              {izin.jenis === 'izin_dispen' ? (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{new Date(izin.tanggalMulai).toLocaleDateString('id-ID')}</span>
                  </div>

                  {izin.jamMulai && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>
                        {izin.jamMulai} - {izin.jamSelesai}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant={getJenisBadge(izin.jenis) as any}>
                {izin.jenis === 'izin_dispen' ? 'DISPEN' : izin.jenis.toUpperCase()}
              </Badge>
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>
                    {new Date(izin.tanggalMulai).toLocaleDateString('id-ID')} -{' '}
                    {new Date(izin.tanggalSelesai).toLocaleDateString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {/* ALASAN */}
            <div className="text-sm text-slate-600">
              <span className="font-semibold">Alasan:</span> {izin.alasan}
            </div>

            {/* STATUS */}
            

            {/* TANGGAL DIBUAT */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant={getStatusBadge(izin.status) as any}>
                {izin.status === 'menunggu' && 'Menunggu'}
                {izin.status === 'diterima' && 'Diterima'}
                {izin.status === 'ditolak' && 'Ditolak'}
              </Badge>
              Diajukan: {new Date(izin.createdAt).toLocaleDateString('id-ID')}
            </div>

            {/* ACTION BUTTONS */}
            {/* ACTION BUTTONS (MOBILE — 1 ROW) */}
<div className="pt-2 flex items-center gap-2">
  <Button
    variant="secondary"
    className="flex-1 flex items-center justify-center gap-2"
    onClick={() => onViewDetail(izin)}
  >
    
    Detail
  </Button>

  {!isApproved(izin.status) && onEdit && (
    <Button
      variant="secondary"
      className="flex-1 flex items-center justify-center gap-2"
      onClick={() => onEdit(izin)}
    >
      
      Edit
    </Button>
  )}

  {!isApproved(izin.status) && onDelete && (
    <Button
      variant="danger"
      className="flex-1 flex items-center justify-center gap-2"
      onClick={() => onDelete(izin)}
    >
      
      Hapus
    </Button>
  )}
</div>

          </div>
        ))}
      </div>

      {/* ====================================== */}
      {/*          DESKTOP / TABLET VIEW         */}
      {/* ====================================== */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Jenis</TableCell>
              <TableCell header>Tanggal</TableCell>
              <TableCell header>Alasan</TableCell>
              <TableCell header>Status</TableCell>
              <TableCell header>Diajukan</TableCell>
              <TableCell header>Aksi</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {izinList.map((izin) => (
              <TableRow key={izin.id} className="hover:bg-slate-50 transition-colors duration-150">
                <TableCell>
                  <Badge variant={getJenisBadge(izin.jenis) as any}>
                    {izin.jenis === 'izin_dispen' ? 'DISPEN' : izin.jenis.toUpperCase()}
                  </Badge>
                </TableCell>

                <TableCell>
                  {izin.jenis === 'izin_dispen' ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(izin.tanggalMulai).toLocaleDateString('id-ID')}
                      </div>

                      {izin.jamMulai && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs">
                            {izin.jamMulai} - {izin.jamSelesai}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-900">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(izin.tanggalMulai).toLocaleDateString('id-ID')} -{' '}
                        {new Date(izin.tanggalSelesai).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="truncate max-w-xs text-slate-700" title={izin.alasan}>
                    {izin.alasan}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusBadge(izin.status) as any}>
                    {izin.status === 'menunggu' && 'Menunggu'}
                    {izin.status === 'diterima' && 'Diterima'}
                    {izin.status === 'ditolak' && 'Ditolak'}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-slate-600">
                  {new Date(izin.createdAt).toLocaleDateString('id-ID')}
                </TableCell>

                <TableCell>
                  <div className="flex gap-2">
                    <Button className="flex items-center justify-center" size="sm" variant="secondary" onClick={() => onViewDetail(izin)}>
                      <ChevronRight className="w-3.5 h-3.5" /> Detail
                    </Button>

                    {!isApproved(izin.status) && onEdit && (
                      <Button className="flex items-center justify-center" size="sm" variant="secondary" onClick={() => onEdit(izin)}>
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Button>
                    )}

                    {!isApproved(izin.status) && onDelete && (
                      <Button className="flex items-center justify-center" size="sm" variant="danger" onClick={() => onDelete(izin)}>
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IzinGuruTable;
