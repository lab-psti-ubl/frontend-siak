import React, { useState } from 'react';
import { Plus, Edit, Trash2, BookOpen, Users, Search } from 'lucide-react';
import { Jurusan, Kelas } from '../../../../types';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useOnboardingTourContext } from '../../../../context/OnboardingTourContext';
import { useKelas } from '../../../../hooks/useKelas';
import { useMurid } from '../../../../hooks/useMurid';
import { apiService } from '../../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import TambahJurusanForm from '../../forms/TambahJurusanForm';
import { showDangerConfirmation, showWarningConfirmation } from '../../../../utils/confirmationUtils';
import { getTingkatKelasOptionsSync } from '../../../../utils/jenjangPendidikanUtils';

const ManajemenJurusan: React.FC = () => {
  const { refreshTour } = useOnboardingTourContext();
  const { jurusan, refreshJurusan } = useJurusan();
  const { kelas } = useKelas();
  const { murid } = useMurid();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJurusan, setEditingJurusan] = useState<Jurusan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter out alumni classes (tingkat 99 or name contains 'Alumni')
  const tingkatOptions = getTingkatKelasOptionsSync();
  const activeKelas = kelas.filter(k => {
    const isAlumniClass = k.tingkat === 99 || k.name.toLowerCase().includes('alumni');
    const isValidTingkat = tingkatOptions.includes(k.tingkat);
    return !isAlumniClass && isValidTingkat;
  });

  const handleEdit = (jurusanItem: Jurusan) => {
    setEditingJurusan(jurusanItem);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingJurusan(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const kelasWithJurusan = activeKelas.filter(k => k.jurusanId === id);
    const jurusanItem = jurusan.find(j => j.id === id);
    if (!jurusanItem) return;

    if (kelasWithJurusan.length > 0) {
      showWarningConfirmation(
        'Tidak Dapat Menghapus Jurusan',
        `Jurusan "${jurusanItem.name}" masih memiliki ${kelasWithJurusan.length} kelas aktif.\n\nHapus atau pindahkan semua kelas terlebih dahulu sebelum menghapus jurusan.`,
        () => {},
        {
          confirmText: 'Mengerti',
          cancelText: ''
        }
      );
      return;
    }
    
    showDangerConfirmation(
      'Hapus Jurusan',
      `Apakah Anda yakin ingin menghapus jurusan "${jurusanItem.name}"?\n\nTindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const response = await apiService.deleteJurusan(id);
          if (response.success) {
            showSuccessToast('Berhasil', 'Jurusan berhasil dihapus');
            refreshJurusan();
          } else {
            showErrorToast('Error', response.message || 'Gagal menghapus jurusan');
          }
        } catch (error: any) {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat menghapus jurusan');
        }
      },
      {
        confirmText: 'Ya, Hapus Jurusan',
        cancelText: 'Batal'
      }
    );
  };

  const toggleJurusanStatus = async (id: string) => {
    const jurusanItem = jurusan.find(j => j.id === id);
    if (!jurusanItem) return;

    try {
      const response = await apiService.updateJurusan(id, {
        isActive: !jurusanItem.isActive,
      });
      if (response.success) {
        showSuccessToast('Berhasil', `Jurusan berhasil ${response.jurusan?.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        refreshJurusan();
      } else {
        showErrorToast('Error', response.message || 'Gagal mengubah status jurusan');
      }
    } catch (error: any) {
      showErrorToast('Error', error.message || 'Terjadi kesalahan saat mengubah status jurusan');
    }
  };

  const getKelasCount = (jurusanId: string) => {
    return activeKelas.filter(k => k.jurusanId === jurusanId).length;
  };

  const getMuridCount = (jurusanId: string) => {
    const kelasIds = activeKelas.filter(k => k.jurusanId === jurusanId).map(k => k.id);
    return murid.filter(u => kelasIds.includes(u.kelasId || '') && u.isActive !== false).length;
  };

  const filteredJurusan = jurusan.filter(j =>
    j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Manajemen Jurusan
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Kelola data jurusan dan program studi
              </p>
            </div>
            <Button onClick={handleAdd} variant="secondary" className="group flex items-center justify-center text-xs sm:text-sm whitespace-nowrap bg-gray-100 hover:!bg-blue-50 text-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95">
              <Plus size={14} className="sm:mr-2 text-blue-800 transition-transform duration-200 group-hover:rotate-90" />
              <span className="text-blue-800">Tambah Jurusan</span>
              
            </Button>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Cari nama, kode, atau deskripsi jurusan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            Menampilkan <span className="font-semibold text-slate-900">{filteredJurusan.length}</span> dari <span className="font-semibold text-slate-900">{jurusan.length}</span> jurusan
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Jurusan</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{jurusan.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Aktif</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {jurusan.filter(j => j.isActive).length}
                </p>
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
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Kelas</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {activeKelas.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Murid</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {murid.filter((u: any) => u.isActive !== false).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table - Desktop View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Daftar Jurusan</h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableCell header className="text-sm">Nama Jurusan</TableCell>
                <TableCell header className="text-sm">Kode</TableCell>
                <TableCell header className="text-sm">Deskripsi</TableCell>
                <TableCell header className="text-sm">Kelas</TableCell>
                <TableCell header className="text-sm">Murid</TableCell>
                <TableCell header className="text-sm">Status</TableCell>
                <TableCell header className="text-sm">Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJurusan.map((jurusanItem) => (
                <TableRow key={jurusanItem.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-blue-600 flex-shrink-0" />
                      <span className="truncate">{jurusanItem.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                      {jurusanItem.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="max-w-xs truncate text-slate-600" title={jurusanItem.description}>
                      {jurusanItem.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900">
                    {getKelasCount(jurusanItem.id)}
                  </TableCell>
                 <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{getMuridCount(jurusanItem.id)}</span>
                            <span className="text-xs text-slate-500">murid</span>
                          </div>
                        </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleJurusanStatus(jurusanItem.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ${
                          jurusanItem.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            jurusanItem.isActive ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-medium text-slate-600">
                        {jurusanItem.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(jurusanItem)} className="!p-2 flex items-center justify-center" title="Edit">
                        <Edit size={12} />
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(jurusanItem.id)} className="!p-2 flex items-center justify-center" title="Hapus">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredJurusan.length === 0 && (
          <div className="text-center py-12 px-6">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? 'Tidak ada hasil' : 'Belum ada data jurusan'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchTerm
                ? `Tidak ditemukan jurusan dengan kata kunci "${searchTerm}"`
                : 'Tambahkan jurusan pertama untuk memulai'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd} className="text-sm flex-1 items-center justify-center">
               
                Tambah Jurusan Pertama
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Data List - Mobile View */}
      <div className="lg:hidden space-y-3">
        {filteredJurusan.length > 0 ? (
          filteredJurusan.map((jurusanItem) => (
            <div key={jurusanItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{jurusanItem.name}</p>
                    <p className="text-xs text-slate-600">Kode: <span className="font-mono">{jurusanItem.code}</span></p>
                  </div>
                </div>

                {/* Description */}
                {jurusanItem.description && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-600">{jurusanItem.description}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-slate-900">{getKelasCount(jurusanItem.id)}</p>
                    <p className="text-xs text-slate-600">Kelas</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-slate-900">{getMuridCount(jurusanItem.id)}</p>
                    <p className="text-xs text-slate-600">Murid</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleJurusanStatus(jurusanItem.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                        jurusanItem.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          jurusanItem.isActive ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-medium text-slate-600">
                      {jurusanItem.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(jurusanItem)} className="flex-1 text-xs flex items-center justify-center">
                    <Edit size={12} className="mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(jurusanItem.id)} className="flex-1 text-xs flex items-center justify-center">
                    <Trash2 size={12} className="mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? 'Tidak ada hasil' : 'Belum ada data jurusan'}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm
                ? `Tidak ditemukan jurusan dengan kata kunci "${searchTerm}"`
                : 'Tambahkan jurusan pertama untuk memulai'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd} className="text-xs flex items-center justify-center">
                <Plus size={14} className="mr-1" />
                Tambah Jurusan
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Form Component */}
      <TambahJurusanForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingJurusan(null);
        }}
        editingJurusan={editingJurusan}
        onSuccess={() => {
          refreshJurusan();
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

export default ManajemenJurusan;