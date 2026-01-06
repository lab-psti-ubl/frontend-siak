import React from 'react';
import { Eye, CalendarDays, Clock, Check, FileText } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { SuratIzin } from '../../../../../../types';

interface SuratIzinTableProps {
  title: string;
  suratList: SuratIzin[];
  getMuridName: (muridId: string) => string;
  getMuridNisn: (muridId: string) => string;
  onDetailClick: (surat: SuratIzin) => void;
  isPending?: boolean;
}

const SuratIzinTable: React.FC<SuratIzinTableProps> = ({
  title,
  suratList,
  getMuridName,
  getMuridNisn,
  onDetailClick,
  isPending = false
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (!isPending && suratList.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop Table View */}
      <Card className="hidden lg:block">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="overflow-x-auto">
          {suratList.length > 0 ? (
            <Table>
              <TableHeader>
              <TableRow>
                <TableCell header>Murid</TableCell>
                <TableCell header>Jenis & Periode</TableCell>
                {isPending ? (
                  <>
                    <TableCell header>Alasan</TableCell>
                    <TableCell header>Tanggal Pengajuan</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Tanggal Verifikasi</TableCell>
                  </>
                )}
                <TableCell header>Aksi</TableCell>
              </TableRow>
          </TableHeader>
          <TableBody>
            {suratList.map((surat) => (
              <TableRow key={surat.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {getInitials(getMuridName(surat.muridId))}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getMuridName(surat.muridId)}</p>
                      <p className="text-sm text-gray-500">NISN: {getMuridNisn(surat.muridId)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant={surat.jenis === 'izin' ? 'warning' : 'info'}>
                      {surat.jenis.toUpperCase()}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      <div>{new Date(surat.tanggalMulai).toLocaleDateString('id-ID')}</div>
                      {surat.tanggalMulai !== surat.tanggalSelesai && (
                        <div className="text-gray-500">s/d {new Date(surat.tanggalSelesai).toLocaleDateString('id-ID')}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                {isPending ? (
                  <>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 line-clamp-2" title={surat.alasan}>
                          {surat.alasan}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(surat.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={surat.status === 'diterima' ? 'success' : 'danger'}>
                          {surat.status.toUpperCase()}
                        </Badge>
                        {surat.verifiedAt && (
                          <div className="text-xs text-gray-500">
                            {new Date(surat.verifiedAt).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {surat.verifiedAt
                          ? new Date(surat.verifiedAt).toLocaleDateString('id-ID')
                          : '-'}
                      </div>
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => onDetailClick(surat)}
                    className="!p-2 flex items-center justify-center"
                  >
                    <Eye className="mr-2" size={16} /> Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
              <p className="text-gray-600">Belum ada surat izin untuk ditampilkan</p>
            </div>
          )}
        </div>
      </Card>

      {/* Mobile Card View */}
      <Card className="lg:hidden">
        <div className="p-1 sm:p-6 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        {suratList.length > 0 ? (
          <div className="space-y-3 p-1 pt-2 sm:p-6">
            {suratList.map((surat) => (
              <Card 
                key={surat.id} 
                className="overflow-hidden border border-gray-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300 bg-white group"
              >
                <div className="p-1 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                  {/* Header with Murid Info */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/30">
                          {getInitials(getMuridName(surat.muridId))}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-gray-900 text-sm sm:text-base leading-snug break-words">
                          {getMuridName(surat.muridId)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">NISN: {getMuridNisn(surat.muridId)}</p>
                      </div>
                    </div>
                    {!isPending && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex-shrink-0 transform group-hover:scale-105 transition-transform duration-200">
                          <Badge 
                            variant={surat.status === 'diterima' ? 'success' : 'danger'}
                            size="sm"
                            className="!text-[10px] sm:!text-xs"
                          >
                            {surat.status.toUpperCase()}
                          </Badge>
                        </div>
                        {surat.verifiedAt && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Check size={12} className="text-gray-400" />
                            <span>
                              <span className="font-medium text-gray-600">Verifikasi:</span>{' '}
                              {new Date(surat.verifiedAt).toLocaleDateString('id-ID', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2 sm:my-0"></div>

                  {/* Jenis & Periode */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={surat.jenis === 'izin' ? 'warning' : 'info'}
                        size="sm"
                        className="!text-[10px] sm:!text-xs"
                      >
                        {surat.jenis.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200/50">
                      <CalendarDays size={12} className="sm:w-3.5 sm:h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-medium">
                        {new Date(surat.tanggalMulai).toLocaleDateString('id-ID', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </span>
                      {surat.tanggalMulai !== surat.tanggalSelesai && (
                        <>
                          <span className="text-gray-400 mx-0.5 sm:mx-1">-</span>
                          <span className="font-medium">
                            {new Date(surat.tanggalSelesai).toLocaleDateString('id-ID', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Alasan */}
                  {isPending && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                      <p className="text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText size={11} className="sm:w-3 sm:h-3 text-gray-500 flex-shrink-0" />
                        Alasan
                      </p>
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed line-clamp-3">
                        {surat.alasan}
                      </p>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-gray-400" />
                            <span>
                              <span className="font-medium text-gray-600">Pengajuan:</span>{' '}
                              {new Date(surat.createdAt).toLocaleDateString('id-ID', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => onDetailClick(surat)}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 text-xs sm:text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-200"
                      >
                        <Eye size={14} className="sm:w-4 sm:h-4" />
                        <span>Detail</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
            <p className="text-sm text-gray-600">Belum ada surat izin untuk ditampilkan</p>
          </div>
        )}
      </Card>
    </>
  );
};

export default SuratIzinTable;
