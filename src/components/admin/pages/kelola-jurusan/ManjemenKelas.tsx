import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, School, ArrowLeft, Eye, Filter, ChevronRight, Search } from 'lucide-react';
import { Kelas, User, Jurusan } from '../../../../types';
import { useKelas } from '../../../../hooks/useKelas';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { apiService } from '../../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import TambahKelasForm from '../../forms/TambahKelasForm';
import { shouldShowJurusanSync, formatTingkatKelasSync, getTingkatKelasOptionsSync } from '../../../../utils/jenjangPendidikanUtils';
import { useOnboardingTourContext } from '../../../../context/OnboardingTourContext';

const ManajemenKelas: React.FC = () => {
  const { refreshTour } = useOnboardingTourContext();
  const { kelas, refreshKelas } = useKelas();
  const { jurusan } = useJurusan();
  const { gurus, refreshGurus } = useGurus();
  const { murid } = useMurid();
  const [selectedJurusan, setSelectedJurusan] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [tingkatFilter, setTingkatFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const showJurusan = shouldShowJurusanSync();
  const tingkatOptions = getTingkatKelasOptionsSync();

  // For SD/SMP, skip jurusan selection and go straight to class list
  useEffect(() => {
    if (!showJurusan && !selectedJurusan) {
      setSelectedJurusan('no-jurusan'); // Use a special marker for non-jurusan mode
    }
  }, [showJurusan]);

  const activeJurusan = jurusan.filter(j => j.isActive);
  
  // Filter out alumni classes (tingkat 99 or name contains 'Alumni')
  const activeKelas = kelas.filter(k => {
    const isAlumniClass = k.tingkat === 99 || k.name.toLowerCase().includes('alumni');
    const isValidTingkat = tingkatOptions.includes(k.tingkat);
    return !isAlumniClass && isValidTingkat;
  });
  
  const muridPerKelas = murid.filter(u => u.isActive !== false).reduce((acc, m) => {
    acc[m.kelasId] = (acc[m.kelasId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleJurusanClick = (jurusanId: string) => {
    setSelectedJurusan(jurusanId);
  };

  const handleBack = () => {
    setSelectedJurusan('');
    setTingkatFilter('');
  };

  const handleEdit = (kelasItem: Kelas) => {
    // Find the full kelas object from the original kelas array
    const fullKelasItem = kelas.find(k => k.id === kelasItem.id);
    if (fullKelasItem) {
      setEditingKelas(fullKelasItem);
      setIsFormOpen(true);
    }
  };

  const handleAdd = () => {
    setEditingKelas(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const kelasItem = activeKelas.find(k => k.id === id);
    if (!kelasItem) return;

    const muridCount = muridPerKelas[id] || 0;
    if (muridCount > 0) {
      showErrorToast('Error', `Tidak dapat menghapus kelas yang masih memiliki ${muridCount} murid!`);
      return;
    }
    
    showDangerConfirmation(
      'Hapus Kelas',
      `Apakah Anda yakin ingin menghapus kelas "${kelasItem.name}"?\n\nTindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const response = await apiService.deleteKelas(id);
          if (response.success) {
            showSuccessToast('Berhasil', 'Kelas berhasil dihapus');
            refreshKelas();
            refreshGurus(); // Refresh to update wali kelas status
          } else {
            showErrorToast('Error', response.message || 'Gagal menghapus kelas');
          }
        } catch (error: any) {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat menghapus kelas');
        }
      },
      {
        confirmText: 'Ya, Hapus Kelas',
        cancelText: 'Batal'
      }
    );
  };

  const getWaliKelasName = (waliKelasId: string) => {
    if (!waliKelasId || waliKelasId.trim() === '') {
      return 'Belum ditentukan';
    }
    // Find guru by matching ID exactly (case-sensitive)
    const waliKelas = gurus.find(g => g.id && g.id.toString().trim() === waliKelasId.toString().trim());
    return waliKelas?.name || 'Belum ditentukan';
  };

  const getJurusanName = (jurusanId?: string) => {
    if (!jurusanId || jurusanId === 'no-jurusan') return '-';
    const jurusanItem = jurusan.find(j => j.id === jurusanId);
    return jurusanItem?.name || 'Belum ditentukan';
  };

  const getMuridCount = (jurusanId?: string) => {
    if (!jurusanId) return 0;
    const kelasIds = activeKelas.filter(k => k.jurusanId === jurusanId).map(k => k.id);
    return murid.filter(u => kelasIds.includes(u.kelasId || '') && u.isActive !== false).length;
  };

  // View: Daftar Jurusan (only for SMA/SMK)
  if (!selectedJurusan && showJurusan) {
    return (
      <div className="space-y-5 sm:space-y-6 lg:space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 bg-white rounded-lg">
                  <School className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Manajemen Kelas</h1>
              </div>
              <p className="text-xs sm:text-sm text-blue-100">Kelola kelas berdasarkan jurusan dan tingkat</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {activeJurusan.length > 0 && (
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
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Kelas</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{activeKelas.length}</p>
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
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{murid.filter(u => u.isActive !== false).length}</p>
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
                    {activeJurusan.map((jurusanItem) => (
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
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="default" className="text-xs">
                              {activeKelas.filter(k => k.jurusanId === jurusanItem.id).length}
                            </Badge>
                            <span className="text-xs text-slate-500">kelas</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{getMuridCount(jurusanItem.id)}</span>
                            <span className="text-xs text-slate-500">murid</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleJurusanClick(jurusanItem.id)}
                            className="flex items-center justify-center"
                          >
                            <Eye size={14} className="mr-1" />
                            Lihat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {activeJurusan.map((jurusanItem) => (
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
                          <Badge variant="info" className="text-xs">{jurusanItem.code}</Badge>
                          <Badge variant="success" className="text-xs">Aktif</Badge>
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
                        <p className="font-semibold text-slate-900 text-sm">{activeKelas.filter(k => k.jurusanId === jurusanItem.id).length}</p>
                        <p className="text-xs text-slate-600">Kelas</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-50">
                        <p className="font-semibold text-slate-900 text-sm">{getMuridCount(jurusanItem.id)}</p>
                        <p className="text-xs text-slate-600">Murid</p>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleJurusanClick(jurusanItem.id)}
                      className="w-full px-3 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      Kelola Kelas
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
            <School className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Belum Ada Jurusan</h3>
            <p className="text-sm text-slate-600">Silakan tambah jurusan terlebih dahulu untuk mengelola kelas</p>
          </div>
        )}
      </div>
    );
  }

  // View: Daftar Kelas dalam Jurusan (or all classes for SD/SMP)
  const currentJurusan = jurusan.find(j => j.id === selectedJurusan);

  const kelasInJurusan = activeKelas.filter(k => {
    // For SD/SMP (no jurusan), show all classes
    const matchJurusan = selectedJurusan === 'no-jurusan' || k.jurusanId === selectedJurusan;
    const matchTingkat = !tingkatFilter || k.tingkat.toString() === tingkatFilter;
    const matchSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchJurusan && matchTingkat && matchSearch;
  });

  // Dynamic tingkat counts based on jenjang
  const tingkatCounts: Record<number, number> = {};
  tingkatOptions.forEach(tingkat => {
    tingkatCounts[tingkat] = activeKelas.filter(k => {
      const matchJurusan = selectedJurusan === 'no-jurusan' || k.jurusanId === selectedJurusan;
      return matchJurusan && k.tingkat === tingkat;
    }).length;
  });

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {showJurusan && (
                  <button
                    onClick={handleBack}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    title="Kembali"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                )}
                <div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                    {showJurusan ? `Kelas ${currentJurusan?.name}` : 'Manajemen Kelas'}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100">
                    {showJurusan ? `Kelola kelas untuk jurusan ${currentJurusan?.name}` : 'Kelola semua kelas'}
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleAdd} className="flex items-center justify-center text-xs sm:text-sm bg-green-600">
              <Plus size={14} className="sm:mr-2" />
              <span>Tambah Kelas</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Dynamic based on jenjang */}
      <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${tingkatOptions.length <= 3 ? 'grid-cols-3' : tingkatOptions.length <= 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
        {tingkatOptions.map((tingkat, index) => {
          const colors = ['blue', 'emerald', 'orange', 'purple', 'pink', 'indigo'];
          const color = colors[index % colors.length];
          return (
            <div key={tingkat} className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-3 sm:p-4 lg:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600">Kelas {formatTingkatKelasSync(tingkat)}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mt-1">{tingkatCounts[tingkat] || 0}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg bg-${color}-100 group-hover:scale-110 transition-transform`}>
                    <Users className={`w-4 h-4 sm:w-5 sm:h-5 text-${color}-600`} />
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
                className="text-xs sm:text-sm flex items-center justify-center"
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
                  {kelasInJurusan.map((kelasItem) => (
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
                        <span className="font-medium text-slate-900">{muridPerKelas[kelasItem.id] || 0}</span>
                        <span className="text-xs text-slate-500 ml-1">murid</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(kelasItem)}
                            className="!p-2 flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(kelasItem.id)}
                            className="!p-2 flex items-center justify-center"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Kelas List - Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {kelasInJurusan.map((kelasItem) => (
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
                      <span className="font-medium text-slate-900">{muridPerKelas[kelasItem.id] || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(kelasItem)}
                      className="flex-1 text-xs flex items-center justify-center"
                    >
                      <Edit size={12} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(kelasItem.id)}
                      className="flex-1 text-xs flex items-center justify-center"
                    >
                      <Trash2 size={12} className="mr-1 " />
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
          {!searchTerm && (
            <Button onClick={handleAdd} className="text-sm">
              
              Tambah Kelas Pertama
            </Button>
          )}
        </div>
      )}

      {/* Form Component */}
      <TambahKelasForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingKelas(null);
        }}
        editingKelas={editingKelas}
        selectedJurusan={selectedJurusan}
        onSuccess={() => {
          refreshKelas();
          refreshGurus();
          // Refresh tour untuk menampilkan modal berikutnya
          // Note: refreshTour() akan otomatis di-skip jika user klik "Nanti Saja" di menu ini
          setTimeout(() => {
            refreshTour();
          }, 100);
        }}
      />
    </div>
  );
};

export default ManajemenKelas;