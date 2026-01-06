import React, { useState } from 'react';
import { Eye, Edit, Trash2, Download, Users, QrCode } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { User } from '../../../../../../types';
import { getInitials } from '../../../../../admin/pages/manejemen-murid/utils/muridUtils';
import PhotoPreviewModal from '../../../../../ui/PhotoPreviewModal';

interface DataMuridKelasTableProps {
  muridKelas: User[];
  filteredMurid: User[];
  searchTerm: string;
  targetKelas: any;
  selectedTahunAjaran: string;
  selectedSemester: number;
  activeTahunAjaran: any;
  getAttendanceStats: (muridId: string) => {
    hadir: number;
    izin: number;
    sakit: number;
    alfa: number;
    total: number;
    attendanceRate: number;
  };
  onViewDetail: (murid: User) => void;
  onEditMurid: (murid: User) => void;
  onDeleteMurid: (murid: User) => void;
  onViewQR: (murid: User) => void;
  onDownloadQR: (murid: User) => void;
}

const DataMuridKelasTable: React.FC<DataMuridKelasTableProps> = ({
  muridKelas,
  filteredMurid,
  searchTerm,
  targetKelas,
  selectedTahunAjaran,
  selectedSemester,
  activeTahunAjaran,
  getAttendanceStats,
  onViewDetail,
  onEditMurid,
  onDeleteMurid,
  onViewQR,
  onDownloadQR
}) => {
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [selectedPhotoMurid, setSelectedPhotoMurid] = useState<User | null>(null);

  const openPhotoPreview = (murid: User) => {
    setSelectedPhotoMurid(murid);
    setIsPhotoPreviewOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden sm:block">
          <div className="bg-slate-50 px-5 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-slate-200">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 uppercase tracking-wide">Daftar Murid Kelas</h3>
          </div>

          {!targetKelas ? (
            <div className="text-center py-12 sm:py-16">
              <Users className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400" />
              <p className="text-sm sm:text-base font-semibold text-slate-600 mb-1">Kelas Tidak Ditemukan</p>
              <p className="text-xs sm:text-sm text-slate-500">
                Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}.
              </p>
            </div>
          ) : filteredMurid.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Nama</TableCell>
                  <TableCell header>NISN</TableCell>
                  <TableCell header>Email</TableCell>
                  <TableCell header>Kehadiran</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>QR</TableCell>
                  <TableCell header>Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMurid.map((murid) => {
                  const stats = getAttendanceStats(murid.id);

                  return (
                    <TableRow key={murid.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => murid.profileImage && openPhotoPreview(murid)}
                            className={`transition-all flex-shrink-0 ${
                              murid.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                            }`}
                          >
                            {murid.profileImage ? (
                              <img
                                src={murid.profileImage}
                                alt={murid.name}
                                className="w-8 h-8 object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-xs">
                                  {getInitials(murid.name).charAt(0)}
                                </span>
                              </div>
                            )}
                          </button>
                          <span className="text-xs sm:text-sm font-medium text-slate-900 truncate">{murid.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-700">
                          {murid.nisn}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs sm:text-sm text-slate-700 truncate">{murid.email}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                stats.attendanceRate >= 80 ? 'bg-emerald-500' :
                                stats.attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                            {stats.attendanceRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            stats.attendanceRate >= 80 ? 'success' :
                            stats.attendanceRate >= 60 ? 'warning' : 'danger'
                          }
                          className="text-xs"
                        >
                          {stats.attendanceRate >= 80 ? 'Baik' :
                           stats.attendanceRate >= 60 ? 'Cukup' : 'Perlu Perhatian'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onViewQR(murid)}
                            className="!px-2 !py-2"
                            title="Lihat QR Code"
                          >
                            <QrCode size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onDownloadQR(murid)}
                            className="!px-2 !py-2"
                            title="Download QR Code"
                          >
                            <Download size={14} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onViewDetail(murid)}
                            className="!px-2 !py-2 justify-center flex items-center"
                            title="Lihat Detail"
                          >
                            <Eye size={14} className="mr-1" /> Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onEditMurid(murid)}
                            className="!px-2 !py-2 justify-center flex items-center"
                            title="Edit"
                          >
                            <Edit className="mr-1" size={14} /> Edit
                          </Button>
                          
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 sm:py-16">
              <Users className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400" />
              <p className="text-sm sm:text-base font-semibold text-slate-600 mb-1">Tidak ada murid</p>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm ?
                  `Tidak ada murid yang sesuai dengan pencarian "${searchTerm}"` :
                  `Tidak ada data murid untuk periode ini`
                }
              </p>
            </div>
          )}
        </div>

        <div className="sm:hidden space-y-3 p-5">
          {!targetKelas ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Kelas Tidak Ditemukan</p>
            </div>
          ) : filteredMurid.length > 0 ? (
            filteredMurid.map((murid) => {
              const stats = getAttendanceStats(murid.id);

              return (
                <div
                  key={murid.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => murid.profileImage && openPhotoPreview(murid)}
                        className={`transition-all flex-shrink-0 ${
                          murid.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                        }`}
                      >
                        {murid.profileImage ? (
                          <img
                            src={murid.profileImage}
                            alt={murid.name}
                            className="w-10 h-10 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {getInitials(murid.name).charAt(0)}
                            </span>
                          </div>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{murid.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{murid.nisn}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        stats.attendanceRate >= 80 ? 'success' :
                        stats.attendanceRate >= 60 ? 'warning' : 'danger'
                      }
                      className="text-xs flex-shrink-0"
                    >
                      {stats.attendanceRate >= 80 ? 'Baik' :
                       stats.attendanceRate >= 60 ? 'Cukup' : 'Perlu'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Email</span>
                      <span className="text-xs text-slate-700 truncate block">{murid.email}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Kehadiran</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              stats.attendanceRate >= 80 ? 'bg-emerald-500' :
                              stats.attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{stats.attendanceRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewDetail(murid)}
                        className="flex-1 text-xs !py-2 flex items-center justify-center"
                      >
                        <Eye size={14} className="mr-1" />
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewQR(murid)}
                        className="flex-1 text-xs !py-2 flex items-center justify-center"
                      >
                        <QrCode size={14} className="mr-1" />
                        QR
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEditMurid(murid)}
                        className="flex-1 text-xs !py-2 flex items-center justify-center"
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      {selectedTahunAjaran === activeTahunAjaran?.tahun && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDeleteMurid(murid)}
                          className="flex-1 text-xs !py-2 flex items-center justify-center"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600 mb-1">Tidak ada murid</p>
              <p className="text-xs text-slate-500">
                {searchTerm ?
                  `Tidak ada murid yang sesuai dengan pencarian "${searchTerm}"` :
                  `Tidak ada data murid untuk periode ini`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <PhotoPreviewModal
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        photoUrl={selectedPhotoMurid?.profileImage || null}
        name={selectedPhotoMurid?.name || ''}
      />
    </>
  );
};

export default DataMuridKelasTable;