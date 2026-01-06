import React, { useState } from 'react';
import { ArrowLeft, School, Users, Eye, Plus, Filter, Search, ChevronRight } from 'lucide-react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User, Kelas, Jurusan, Alumni, Murid } from '../../../../../types';
import { useAuth } from '../../../../../context/AuthContext';
import { useMurid } from '../../../../../hooks/useMurid';
import { useJurusan } from '../../../../../hooks/useJurusan';
import { useKelas } from '../../../../../hooks/useKelas';
import { useGurus } from '../../../../../hooks/useGurus';
import { getTingkatKelasOptionsSync, formatTingkatKelasSync, shouldShowJurusanSync, getActiveJenjangSync } from '../../../../../utils/jenjangPendidikanUtils';

interface KelasListViewProps {
  selectedJurusan: string;
  jurusan?: Jurusan[];
  kelas?: Kelas[];
  users?: User[];
  gurus?: User[];
  onBack: () => void;
  onKelasClick: (kelasId: string) => void;
  onAddMurid?: (kelasId?: string) => void;
  showAddMuridButton?: boolean;
}

const KelasListView: React.FC<KelasListViewProps> = ({
  selectedJurusan,
  jurusan: jurusanProp,
  kelas: kelasProp,
  users: usersProp,
  gurus: gurusProp,
  onBack,
  onKelasClick,
  onAddMurid,
  showAddMuridButton = true
}) => {
  // Use hooks with cache - prioritize cache data over props
  const { jurusan: jurusanCache } = useJurusan();
  const { kelas: kelasCache } = useKelas();
  const { murid: muridCache } = useMurid();
  const { gurus: gurusCache } = useGurus();
  
  // Use cache data if available, otherwise fallback to props
  const jurusan = jurusanCache.length > 0 ? jurusanCache : (jurusanProp || []);
  const kelas = kelasCache.length > 0 ? kelasCache : (kelasProp || []);
  const users = muridCache.length > 0 ? muridCache : (usersProp || []);
  const gurus = gurusCache.length > 0 ? gurusCache : (gurusProp || []);
  const { user } = useAuth();
  const [alumniLocal] = useState<Alumni[]>(() => {
    try {
      const stored = localStorage.getItem('alumni');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [tingkatFilter, setTingkatFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const isKepalaSekolah = user?.role === 'kepala_sekolah';
  const showButton = showAddMuridButton && !isKepalaSekolah;
  const tingkatOptions = getTingkatKelasOptionsSync();
  const showJurusan = shouldShowJurusanSync();
  const activeJenjang = getActiveJenjangSync();
  const showBackButton = activeJenjang === 'SMA/SMK';

  // Buat Set dari ID murid yang sudah menjadi alumni
  const alumniMuridIds = new Set(alumniLocal.map(a => a.muridId));

  const currentJurusan = jurusan.find(j => j.id === selectedJurusan);
  
  // Filter out alumni classes (tingkat 99 or name contains 'Alumni')
  const activeKelas = kelas.filter(k => {
    const isAlumniClass = k.tingkat === 99 || k.name.toLowerCase().includes('alumni');
    const isValidTingkat = tingkatOptions.includes(k.tingkat);
    return !isAlumniClass && isValidTingkat;
  });
  
  const kelasInJurusan = activeKelas.filter(k => {
    const matchJurusan = showJurusan ? k.jurusanId === selectedJurusan : true;
    const matchTingkat = !tingkatFilter || k.tingkat.toString() === tingkatFilter;
    const matchSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchJurusan && matchTingkat && matchSearch;
  });

  // Dynamic tingkat counts based on jenjang
  const tingkatCounts: Record<number, number> = {};
  tingkatOptions.forEach(tingkat => {
    tingkatCounts[tingkat] = activeKelas.filter(k => {
      const matchJurusan = showJurusan ? k.jurusanId === selectedJurusan : true;
      return matchJurusan && k.tingkat === tingkat;
    }).length;
  });

  const getWaliKelasName = (waliKelasId: string) => {
    if (!waliKelasId || waliKelasId.trim() === '') {
      return 'Belum ditentukan';
    }
    // Find guru by matching ID exactly (case-sensitive)
    const waliKelas = gurus.find(g => g.id && g.id.toString().trim() === waliKelasId.toString().trim());
    return waliKelas?.name || 'Belum ditentukan';
  };

  const getMuridCount = (kelasId: string) => {
    // Use users prop which now comes from useMurid hook (already filtered by role)
    return users.filter((u): u is Murid => {
      const murid = u as Murid;
      return murid.role === 'murid' &&
        murid.kelasId === kelasId &&
        murid.isActive !== false &&
        !alumniMuridIds.has(murid.id);
    }).length;
  };

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {showBackButton && (
                  <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    title="Kembali"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                )}
                <div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                    {showJurusan && currentJurusan ? `Kelas ${currentJurusan.name}` : 'Daftar Kelas'}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100">Pilih kelas untuk mengelola data murid</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Dynamic based on jenjang */}
      <div className={`grid grid-cols-${Math.min(tingkatOptions.length, 6)} gap-3 sm:gap-4 lg:gap-5`}>
        {tingkatOptions.map((tingkat, index) => {
          const colors = [
            { bg: 'bg-blue-100', text: 'text-blue-600' },
            { bg: 'bg-emerald-100', text: 'text-emerald-600' },
            { bg: 'bg-orange-100', text: 'text-orange-600' },
            { bg: 'bg-purple-100', text: 'text-purple-600' },
            { bg: 'bg-pink-100', text: 'text-pink-600' },
            { bg: 'bg-cyan-100', text: 'text-cyan-600' },
          ];
          const color = colors[index % colors.length];

          return (
            <div key={tingkat} className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-3 sm:p-4 lg:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600">Kelas {formatTingkatKelasSync(tingkat)}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mt-1">{tingkatCounts[tingkat] || 0}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg ${color.bg} group-hover:scale-110 transition-transform`}>
                    <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${color.text}`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Cari nama kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <select
              value={tingkatFilter}
              onChange={(e) => setTingkatFilter(e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
            >
              <option value="">Semua Tingkat</option>
              {tingkatOptions.map(tingkat => (
                <option key={tingkat} value={tingkat}>
                  Kelas {formatTingkatKelasSync(tingkat)}
                </option>
              ))}
            </select>
            {(searchTerm || tingkatFilter) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setTingkatFilter('');
                }}
                className="text-xs sm:text-sm"
              >
                <Filter size={14} className="sm:mr-2" />
                <span>Reset</span>
              </Button>
            )}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            Menampilkan <span className="font-semibold text-slate-900">{kelasInJurusan.length}</span> kelas
          </div>
        </div>
      </div>

      {/* Kelas List - Desktop Table View */}
      {kelasInJurusan.length > 0 ? (
        <>
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Daftar Kelas</h3>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableCell header className="text-sm">Nama Kelas</TableCell>
                    <TableCell header className="text-sm">Tingkat</TableCell>
                    <TableCell header className="text-sm">Wali Kelas</TableCell>
                    <TableCell header className="text-sm">Murid</TableCell>
                    <TableCell header className="text-sm">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelasInJurusan.map((kelasItem) => {
                    const muridCount = getMuridCount(kelasItem.id);

                    return (
                      <TableRow key={kelasItem.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-sm">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                            <span className="font-medium text-slate-900">{kelasItem.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="default">
                            {formatTingkatKelasSync(kelasItem.tingkat)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {getWaliKelasName(kelasItem.waliKelasId || '')}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-medium text-slate-900">{muridCount}</span>
                          <span className="text-xs text-slate-500 ml-1">murid</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onKelasClick(kelasItem.id)}
                              className="flex items-center justify-center"
                              title="Lihat murid"
                            >
                              <Eye size={14} className="mr-2"/>Lihat
                            </Button>
                            {showButton && onAddMurid && (
                              <Button
                                size="sm"
                                onClick={() => onAddMurid(kelasItem.id)}
                                className="flex items-center justify-center"
                                title="Tambah murid"
                              >
                                <Plus size={14} className="mr-1"/>Tambah Murid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Kelas List - Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {kelasInJurusan.map((kelasItem) => {
              const muridCount = getMuridCount(kelasItem.id);

              return (
                <div key={kelasItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">
                          {kelasItem.name.split(' ').pop()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm">{kelasItem.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tingkat {formatTingkatKelasSync(kelasItem.tingkat)}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Wali Kelas:</span>
                        <span className="font-medium text-slate-900">
                          {getWaliKelasName(kelasItem.waliKelasId || '')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Jumlah Murid:</span>
                        <span className="font-medium text-slate-900">{muridCount}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={() => onKelasClick(kelasItem.id)}
                        className="flex-1 px-3 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                      >
                        Lihat Murid
                        <ChevronRight size={14} />
                      </button>
                      {showButton && onAddMurid && (
                        <Button
                          size="sm"
                          onClick={() => onAddMurid(kelasItem.id)}
                          className="flex items-center justify-center"
                          title="Tambah murid"
                        >
                          <Plus size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
          <School className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchTerm ? 'Tidak ada hasil' : 'Belum ada kelas'}
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm
              ? `Tidak ditemukan kelas dengan kata kunci "${searchTerm}"`
              : `Belum ada kelas untuk jurusan ${currentJurusan?.name}`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default KelasListView;
