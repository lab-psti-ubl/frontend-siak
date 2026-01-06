import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import { Ekstrakulikuler } from '../../../../types';
import { apiService } from '../../../../services/apiService';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import TambahEkstrakulikulerForm from '../../forms/TambahEkstrakulikulerForm';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { useEkstrakulikuler, refreshEkstrakulikulerCache } from '../../../../hooks/useEkstrakulikuler';

const ManajemenEkstrakulikuler: React.FC = () => {
  const { ekstrakulikuler, loading, refreshEkstrakulikuler } = useEkstrakulikuler();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEkstrakulikuler, setEditingEkstrakulikuler] = useState<Ekstrakulikuler | null>(null);

  const handleEdit = (ekstra: Ekstrakulikuler) => {
    setEditingEkstrakulikuler(ekstra);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingEkstrakulikuler(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const ekstra = ekstrakulikuler.find(e => e.id === id);
    if (!ekstra) return;

    showDangerConfirmation(
      'Hapus Ekstrakulikuler',
      `Apakah Anda yakin ingin menghapus ekstrakulikuler "${ekstra.nama}"?\n\nTindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.`,
      async () => {
        try {
          const response = await apiService.deleteEkstrakulikuler(id);
          if (response.success) {
            await refreshEkstrakulikuler();
            await refreshEkstrakulikulerCache();
          } else {
            alert(response.message || 'Gagal menghapus ekstrakulikuler');
          }
        } catch (error) {
          console.error('Error deleting ekstrakulikuler:', error);
          alert('Gagal menghapus ekstrakulikuler');
        }
      },
      {
        confirmText: 'Ya, Hapus Ekstrakulikuler',
        cancelText: 'Batal'
      }
    );
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiService.updateEkstrakulikuler(id, { isActive: !currentStatus });
      if (response.success) {
        await refreshEkstrakulikuler();
        await refreshEkstrakulikulerCache();
      } else {
        alert(response.message || 'Gagal memperbarui status ekstrakulikuler');
      }
    } catch (error) {
      console.error('Error updating ekstrakulikuler status:', error);
      alert('Gagal memperbarui status ekstrakulikuler');
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ekstrakulikuler</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola ekstrakulikuler sekolah</p>
        </div>
        <Button onClick={handleAdd} className="justify-center flex items-center w-full sm:w-auto">
          <Plus size={16} className="mr-2" />
          Tambah Ekstrakulikuler
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <p className="text-sm text-gray-600">Memuat data...</p>
          </div>
        </Card>
      ) : ekstrakulikuler.length === 0 ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Belum ada data</h3>
            <p className="text-sm text-gray-600">Tambahkan ekstrakulikuler untuk memulai</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop/Tablet View - Table */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell header>Nama Ekstrakulikuler</TableCell>
                      <TableCell header>Deskripsi</TableCell>
                      <TableCell header>Pembina</TableCell>
                      <TableCell header>Status</TableCell>
                      <TableCell header>Aksi</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ekstrakulikuler.map((ekstra) => (
                      <TableRow key={ekstra.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <BookOpen size={16} className="mr-3 text-blue-600" />
                            <span className="font-medium text-gray-900">{ekstra.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700 line-clamp-2 max-w-md">
                            {ekstra.deskripsi || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users size={16} className="mr-2 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {ekstra.pembina?.name || 'Tidak diketahui'}
                              </p>
                              {ekstra.pembina?.nip && (
                                <p className="text-xs text-gray-500">NIP: {ekstra.pembina.nip}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(ekstra.id, ekstra.isActive)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ${
                                ekstra.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  ekstra.isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="text-sm font-medium">
                              {ekstra.isActive ? (
                                <Badge variant="success">Aktif</Badge>
                              ) : (
                                <Badge variant="default">Tidak Aktif</Badge>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(ekstra)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(ekstra.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-3">
            {ekstrakulikuler.map((ekstra) => (
              <Card key={ekstra.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <BookOpen size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm break-words">{ekstra.nama}</p>
                        {ekstra.deskripsi && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ekstra.deskripsi}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActive(ekstra.id, ekstra.isActive)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          ekstra.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            ekstra.isActive ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-medium">
                        {ekstra.isActive ? (
                          <Badge variant="success" className="text-xs">Aktif</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">Tidak Aktif</Badge>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {ekstra.pembina?.name || 'Tidak diketahui'}
                        </p>
                        {ekstra.pembina?.nip && (
                          <p className="text-xs text-gray-500">NIP: {ekstra.pembina.nip}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(ekstra)}
                      className="flex-1 flex items-center justify-center"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(ekstra.id)}
                      className="flex-1 flex items-center justify-center"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <TambahEkstrakulikulerForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEkstrakulikuler(null);
        }}
        editingEkstrakulikuler={editingEkstrakulikuler}
        onSuccess={async () => {
          await refreshEkstrakulikuler();
          await refreshEkstrakulikulerCache();
        }}
      />
    </div>
  );
};

export default ManajemenEkstrakulikuler;

