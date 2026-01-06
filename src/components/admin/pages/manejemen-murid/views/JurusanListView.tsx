import React from 'react';
import { School, Users, Eye, ChevronRight } from 'lucide-react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User, Kelas, Jurusan, Alumni, Murid } from '../../../../../types';
import { getTingkatKelasOptionsSync } from '../../../../../utils/jenjangPendidikanUtils';
import { useState } from 'react';
import { useJurusan } from '../../../../../hooks/useJurusan';
import { useKelas } from '../../../../../hooks/useKelas';
import { useMurid } from '../../../../../hooks/useMurid';

interface JurusanListViewProps {
  jurusan?: Jurusan[];
  kelas?: Kelas[];
  users?: User[];
  onJurusanClick: (jurusanId: string) => void;
  header?: {
    icon?: React.ReactNode;
    title: string;
    description: string;
  };
  showStats?: boolean;
}

const JurusanListView: React.FC<JurusanListViewProps> = ({
  jurusan: jurusanProp,
  kelas: kelasProp,
  users: usersProp,
  onJurusanClick,
  header,
  showStats = true
}) => {
  // Use hooks with cache - prioritize cache data over props
  const { jurusan: jurusanCache } = useJurusan();
  const { kelas: kelasCache } = useKelas();
  const { murid: muridCache } = useMurid();
  
  // Use cache data if available, otherwise fallback to props
  const jurusan = jurusanCache.length > 0 ? jurusanCache : (jurusanProp || []);
  const kelas = kelasCache.length > 0 ? kelasCache : (kelasProp || []);
  const users = muridCache.length > 0 ? muridCache : (usersProp || []);
  const [alumniLocal] = useState<Alumni[]>(() => {
    try {
      const stored = localStorage.getItem('alumni');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const activeJurusan = jurusan.filter(j => j.isActive);

  // Buat Set dari ID murid yang sudah menjadi alumni
  const alumniMuridIds = new Set(alumniLocal.map(a => a.muridId));

  const getMuridCount = (jurusanId: string) => {
    const kelasIds = kelas.filter(k => k.jurusanId === jurusanId).map(k => k.id);
    // users prop now comes from useMurid hook (already filtered by role)
    return users.filter((u): u is Murid => {
      const murid = u as Murid;
      return murid.role === 'murid' &&
        kelasIds.includes(murid.kelasId || '') &&
        murid.isActive !== false &&
        !alumniMuridIds.has(murid.id);
    }).length;
  };

  const getKelasStats = (jurusanId: string) => {
    const kelasJurusan = kelas.filter(k => k.jurusanId === jurusanId);
    const tingkatOptions = getTingkatKelasOptionsSync();
    const byTingkat: Record<number, number> = {};

    if (Array.isArray(tingkatOptions)) {
      tingkatOptions.forEach(tingkat => {
        byTingkat[tingkat] = kelasJurusan.filter(k => k.tingkat === tingkat).length;
      });
    }

    return {
      total: kelasJurusan.length,
      byTingkat,
      tingkatOptions
    };
  };

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-white rounded-lg">
                {header?.icon || <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                {header?.title || 'Kelola Data Murid'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-blue-100">
              {header?.description || 'Kelola data murid berdasarkan jurusan dan kelas'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {activeJurusan.length > 0 && showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                    <School className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Jurusan</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{activeJurusan.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                    <School className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Kelas</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{kelas.filter(k => k.jurusanId && activeJurusan.map(j => j.id).includes(k.jurusanId)).length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-orange-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Murid</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{users.filter((u): u is Murid => {
                    const murid = u as Murid;
                    return murid.role === 'murid' && murid.isActive !== false && !alumniMuridIds.has(murid.id);
                  }).length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daftar Jurusan */}
      {activeJurusan.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Daftar Jurusan</h3>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableCell header className="text-sm">Kode</TableCell>
                    <TableCell header className="text-sm">Nama Jurusan</TableCell>
                    <TableCell header className="text-sm">Deskripsi</TableCell>
                    <TableCell header className="text-sm">Kelas</TableCell>
                    <TableCell header className="text-sm">Murid</TableCell>
                    <TableCell header className="text-sm">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeJurusan.map((jurusanItem) => {
                    const stats = getKelasStats(jurusanItem.id);
                    const muridCount = getMuridCount(jurusanItem.id);

                    return (
                      <TableRow key={jurusanItem.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-sm">
                          <Badge variant="info">{jurusanItem.code}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center">
                            <School size={16} className="mr-2 text-blue-600" />
                            <span className="font-medium">{jurusanItem.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-xs truncate text-slate-600" title={jurusanItem.description}>
                            {jurusanItem.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs">
                              <Badge variant="default">{stats.total}</Badge>
                            </span>
                            <span className="text-xs text-slate-500">kelas</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{muridCount}</span>
                            <span className="text-xs text-slate-500">murid</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onJurusanClick(jurusanItem.id)}
                            className="flex items-center justify-center"
                          >
                            <Eye size={14} className="mr-1" />
                            Lihat
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {activeJurusan.map((jurusanItem) => {
              const stats = getKelasStats(jurusanItem.id);
              const muridCount = getMuridCount(jurusanItem.id);

              return (
                <div key={jurusanItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-100 flex-shrink-0">
                        <School className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">{jurusanItem.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="info">{jurusanItem.code}</Badge>
                          <Badge variant="success">Aktif</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Deskripsi */}
                    {jurusanItem.description && (
                      <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 line-clamp-2">
                        {jurusanItem.description}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div className="text-center p-2 rounded-lg bg-slate-50">
                        <p className="font-semibold text-slate-900 text-sm">{stats.total}</p>
                        <p className="text-xs text-slate-600">Kelas</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-50">
                        <p className="font-semibold text-slate-900 text-sm">{muridCount}</p>
                        <p className="text-xs text-slate-600">Murid</p>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => onJurusanClick(jurusanItem.id)}
                      className="w-full px-3 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      Kelola Murid
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
          <School className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Belum Ada Jurusan</h3>
          <p className="text-sm text-slate-600">Silakan tambah jurusan terlebih dahulu di menu Manajemen Jurusan</p>
        </div>
      )}
    </div>
  );
};

export default JurusanListView;