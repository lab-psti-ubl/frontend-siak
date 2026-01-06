import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, CheckCircle, Sparkles, Zap } from 'lucide-react';
import { TahunAjaran } from '../../../../types';
import { apiService } from '../../../../services/apiService';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import TambahTahunAjaranForm from '../../forms/TambahTahunAjaranForm';
import { showDangerConfirmation, showWarningConfirmation } from '../../../../utils/confirmationUtils';
import { refreshTahunAjaranCache } from '../../../../hooks/useTahunAjaran';
import { useOnboardingTourContext } from '../../../../context/OnboardingTourContext';

const ManajemenTahunAjaran: React.FC = () => {
  const { refreshTour } = useOnboardingTourContext();
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTahunAjaran, setEditingTahunAjaran] = useState<TahunAjaran | null>(null);

  // Fetch tahun ajaran from API
  useEffect(() => {
    fetchTahunAjaran();
  }, []);

  const fetchTahunAjaran = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAllTahunAjaran();
      if (response.success && response.tahunAjaran) {
        setTahunAjaran(response.tahunAjaran);
      }
    } catch (error) {
      console.error('Error fetching tahun ajaran:', error);
      alert('Gagal memuat data tahun ajaran');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (ta: TahunAjaran) => {
    setEditingTahunAjaran(ta);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingTahunAjaran(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const taToDelete = tahunAjaran.find(ta => ta.id === id);
    if (!taToDelete) return;

    if (taToDelete?.isActive) {
      showWarningConfirmation(
        'Tidak Dapat Menghapus',
        `Tahun ajaran "${taToDelete.tahun} Semester ${taToDelete.semester}" sedang aktif.\n\nNonaktifkan tahun ajaran ini terlebih dahulu sebelum menghapus.`,
        () => {},
        {
          confirmText: 'Mengerti',
          cancelText: ''
        }
      );
      return;
    }

      showDangerConfirmation(
      'Hapus Tahun Ajaran',
      `Apakah Anda yakin ingin menghapus tahun ajaran "${taToDelete.tahun} Semester ${taToDelete.semester}"?\n\nTindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.`,
      async () => {
        try {
          const response = await apiService.deleteTahunAjaran(id);
          if (response.success) {
            await fetchTahunAjaran();
            // Refresh cache global agar semua komponen yang menggunakan hook mendapatkan data terbaru
            await refreshTahunAjaranCache();
          } else {
            alert(response.message || 'Gagal menghapus tahun ajaran');
          }
        } catch (error) {
          console.error('Error deleting tahun ajaran:', error);
          alert('Gagal menghapus tahun ajaran');
        }
      },
      {
        confirmText: 'Ya, Hapus Tahun Ajaran',
        cancelText: 'Batal'
      }
    );
  };

  const handleActivate = async (id: string) => {
    try {
      const response = await apiService.activateTahunAjaran(id);
      if (response.success) {
        await fetchTahunAjaran();
        // Refresh cache global agar semua komponen yang menggunakan hook mendapatkan data terbaru
        await refreshTahunAjaranCache();
      } else {
        alert(response.message || 'Gagal mengaktifkan tahun ajaran');
      }
    } catch (error) {
      console.error('Error activating tahun ajaran:', error);
      alert('Gagal mengaktifkan tahun ajaran');
    }
  };

  const activeTa = tahunAjaran.find(ta => ta.isActive);

  // Fungsi untuk mendapatkan tahun ajaran terbaru (untuk menentukan tombol aksi)
  const getLatestTahunAjaran = (): TahunAjaran | null => {
    if (tahunAjaran.length === 0) return null;
    
    // Urutkan berdasarkan tahun (descending) dan semester (descending)
    const sorted = [...tahunAjaran].sort((a, b) => {
      // Bandingkan tahun dulu
      const tahunA = a.tahun.split('/')[0];
      const tahunB = b.tahun.split('/')[0];
      if (tahunA !== tahunB) {
        return parseInt(tahunB) - parseInt(tahunA);
      }
      // Jika tahun sama, bandingkan semester
      return b.semester - a.semester;
    });
    
    return sorted[0];
  };

  const latestTahunAjaran = getLatestTahunAjaran();
  
  // Fungsi untuk mengecek apakah tahun ajaran adalah yang terbaru
  const isLatestTahunAjaran = (ta: TahunAjaran): boolean => {
    return latestTahunAjaran?.id === ta.id;
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tahun Ajaran</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola tahun ajaran dan semester aktif</p>
        </div>
        <Button onClick={handleAdd} className="justify-center flex items-center w-full sm:w-auto">
          <Plus size={16} className="mr-2" />
          Tambah Tahun Ajaran
        </Button>
      </div>

      {activeTa && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-emerald-500 rounded-lg flex-shrink-0">
              <Zap size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-900 text-sm sm:text-base">Tahun Ajaran Aktif</p>
              <p className="text-xs sm:text-sm text-emerald-700 mt-1">
                <span className="font-bold">{activeTa.tahun}</span> - Semester {activeTa.semester} ({activeTa.semester === 1 ? 'Ganjil' : 'Genap'})
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                {new Date(activeTa.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} hingga {new Date(activeTa.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <p className="text-sm text-gray-600">Memuat data...</p>
          </div>
        </Card>
      ) : tahunAjaran.length === 0 ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Belum ada data</h3>
            <p className="text-sm text-gray-600">Tambahkan tahun ajaran untuk memulai</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="hidden lg:block">
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell header>Tahun Ajaran</TableCell>
                      <TableCell header>Semester</TableCell>
                      <TableCell header>Tanggal Mulai</TableCell>
                      <TableCell header>Tanggal Selesai</TableCell>
                      <TableCell header>Status</TableCell>
                      <TableCell header>Aksi</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tahunAjaran.map((ta) => (
                      <TableRow
                        key={ta.id}
                        className={ta.isAutoCreated ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-l-4 border-l-amber-400' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center">
                            {ta.isAutoCreated ? (
                              <div title="Tahun ajaran yang dibuat otomatis">
                                <Sparkles size={16} className="mr-3 text-amber-500" />
                              </div>
                            ) : (
                              <Calendar size={16} className="mr-3 text-blue-600" />
                            )}
                            <span className="font-medium text-gray-900">
                              {ta.tahun}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ta.semester === 1 ? 'info' : 'warning'}>
                            Semester {ta.semester} ({ta.semester === 1 ? 'Ganjil' : 'Genap'})
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">
                            {new Date(ta.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">
                            {new Date(ta.tanggalSelesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {ta.isActive ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-emerald-600" />
                              <Badge variant="success">Aktif</Badge>
                            </div>
                          ) : (
                            <Badge variant="default">Tidak Aktif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isLatestTahunAjaran(ta) ? (
                            <div className="flex gap-2">
                              {!ta.isActive && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleActivate(ta.id)}
                                >
                                  Aktifkan
                                </Button>
                              )}
                              <Button size="sm" variant="secondary" onClick={() => handleEdit(ta)}>
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(ta.id)}
                                disabled={ta.isActive}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          <div className="lg:hidden space-y-3">
            {tahunAjaran.map((ta) => (
              <Card key={ta.id} className={`p-4 hover:shadow-md transition-shadow ${ta.isAutoCreated ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-l-4 border-l-amber-400' : ''}`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {ta.isAutoCreated ? (
                        <div title="Tahun ajaran yang dibuat otomatis">
                          <Sparkles size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        </div>
                      ) : (
                        <Calendar size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{ta.tahun}</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Semester {ta.semester} ({ta.semester === 1 ? 'Ganjil' : 'Genap'})
                        </p>
                      </div>
                    </div>
                    {ta.isActive ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CheckCircle size={16} className="text-emerald-600" />
                        <Badge variant="success">Aktif</Badge>
                      </div>
                    ) : (
                      <Badge variant="default">Tidak Aktif</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-gray-500 text-xs">Mulai</p>
                      <p className="font-semibold text-gray-900 text-xs">
                        {new Date(ta.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-gray-500 text-xs">Selesai</p>
                      <p className="font-semibold text-gray-900 text-xs">
                        {new Date(ta.tanggalSelesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {isLatestTahunAjaran(ta) ? (
                    <div className="flex gap-2 pt-2 border-t border-gray-200 ">
                      {!ta.isActive && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleActivate(ta.id)}
                          className="flex-1"
                        >
                          Aktifkan
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(ta)}
                        className={!ta.isActive ? 'flex-1 flex items-center justify-center' : 'w-full flex items-center justify-center'}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(ta.id)}
                        disabled={ta.isActive}
                        className={!ta.isActive ? 'flex-1 flex items-center justify-center' : 'w-full flex items-center justify-center'}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Hapus
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-400 text-center">Tidak ada aksi tersedia</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <TambahTahunAjaranForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTahunAjaran(null);
        }}
        editingTahunAjaran={editingTahunAjaran}
        onSuccess={async () => {
          await fetchTahunAjaran();
          // Refresh tour untuk menampilkan modal berikutnya
          // refreshTour sudah akan clear cache dan reload semua data termasuk tahun ajaran
          setTimeout(() => {
            refreshTour();
          }, 100);
        }}
      />
    </div>
  );
};

export default ManajemenTahunAjaran;