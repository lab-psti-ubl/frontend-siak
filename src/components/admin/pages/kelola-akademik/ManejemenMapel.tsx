import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { MataPelajaran, Jurusan } from '../../../../types';
import { apiService } from '../../../../services/apiService';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import TambahMapelForm from '../../forms/TambahMapelForm';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { formatTingkatKelasSync, isJurusanRequiredSync } from '../../../../utils/jenjangPendidikanUtils';
import { useOnboardingTourContext } from '../../../../context/OnboardingTourContext';

const ManajemenMapel: React.FC = () => {
  const { refreshTour } = useOnboardingTourContext();
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
  const { refreshMataPelajaran } = useMataPelajaran();

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [mapelResponse, jurusanResponse] = await Promise.all([
        apiService.getAllMataPelajaran(),
        apiService.getAllJurusan(),
      ]);
      
      if (mapelResponse.success && mapelResponse.mataPelajaran) {
        setMataPelajaran(mapelResponse.mataPelajaran);
      }
      
      if (jurusanResponse.success && jurusanResponse.jurusan) {
        setJurusan(jurusanResponse.jurusan);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (mapel: MataPelajaran) => {
    setEditingMapel(mapel);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingMapel(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const mapel = mataPelajaran.find(m => m.id === id);
    if (!mapel) return;

    showDangerConfirmation(
      'Hapus Mata Pelajaran',
      `Apakah Anda yakin ingin menghapus mata pelajaran "${mapel.name}"?\n\nTindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.`,
      async () => {
        try {
          const response = await apiService.deleteMataPelajaran(id);
          if (response.success) {
            // Clear cache dan muat ulang data dari useMataPelajaran
            await refreshMataPelajaran();
            await fetchData();
          } else {
            alert(response.message || 'Gagal menghapus mata pelajaran');
          }
        } catch (error) {
          console.error('Error deleting mata pelajaran:', error);
          alert('Gagal menghapus mata pelajaran');
        }
      },
      {
        confirmText: 'Ya, Hapus Mata Pelajaran',
        cancelText: 'Batal'
      }
    );
  };

  const getJurusanName = (jurusanId: string) => {
    return jurusan.find(j => j.id === jurusanId)?.name || 'Unknown';
  };

  const showJurusan = isJurusanRequiredSync();

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mata Pelajaran</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola mata pelajaran dan SKS</p>
        </div>
        <Button onClick={handleAdd} className="justify-center flex items-center w-full sm:w-auto">
          <Plus size={16} className="mr-2" />
          Tambah Mata Pelajaran
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <p className="text-sm text-gray-600">Memuat data...</p>
          </div>
        </Card>
      ) : mataPelajaran.length === 0 ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Belum ada data</h3>
            <p className="text-sm text-gray-600">Tambahkan mata pelajaran untuk memulai</p>
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
                      <TableCell header>Nama Mata Pelajaran</TableCell>
                      <TableCell header>Kode</TableCell>
                      <TableCell header>SKS</TableCell>
                      <TableCell header>Semester</TableCell>
                      <TableCell header>Tingkat Kelas</TableCell>
                      <TableCell header>Keterangan</TableCell>
                      {showJurusan && <TableCell header>Jurusan</TableCell>}
                      <TableCell header>Status</TableCell>
                      <TableCell header>Aksi</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mataPelajaran.map((mapel) => (
                      <TableRow key={mapel.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <BookOpen size={16} className="mr-3 text-blue-600" />
                            <span className="font-medium text-gray-900">{mapel.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2.5 py-1 rounded text-sm font-mono">
                            {mapel.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-900">{mapel.sks} SKS</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            mapel.semester === 'ganjil' ? 'info' :
                            mapel.semester === 'genap' ? 'warning' : 'success'
                          }>
                            {mapel.semester === 'ganjil' ? 'GANJIL' :
                             mapel.semester === 'genap' ? 'GENAP' : 'KEDUANYA'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {mapel.tingkatKelas?.map(tingkat => (
                              <Badge key={tingkat} variant="default" size="sm">
                                {formatTingkatKelasSync(tingkat)}
                              </Badge>
                            )) || <span className="text-sm text-gray-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={mapel.keterangan === 'umum' ? 'info' : 'warning'}>
                            {mapel.keterangan === 'umum' ? 'UMUM' : 'JURUSAN'}
                          </Badge>
                        </TableCell>
                        {showJurusan && (
                          <TableCell>
                            {mapel.keterangan === 'jurusan' && mapel.jurusanId ?
                              <Badge variant="warning" className="text-xs">{getJurusanName(mapel.jurusanId)}</Badge> :
                              <span className="text-sm text-gray-400">-</span>
                            }
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="success">Aktif</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(mapel)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(mapel.id)}>
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

          <div className="lg:hidden space-y-3">
            {mataPelajaran.map((mapel) => (
              <Card key={mapel.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <BookOpen size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm break-words">{mapel.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Kode: <span className="font-mono text-gray-700">{mapel.code}</span></p>
                      </div>
                    </div>
                    <Badge variant="success" className="text-xs flex-shrink-0">Aktif</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-gray-500">SKS</p>
                      <p className="font-semibold text-gray-900">{mapel.sks}</p>
                    </div>
                    <div className="p-2 bg-amber-50 rounded">
                      <p className="text-gray-500">Semester</p>
                      <p className="font-semibold text-gray-900 truncate">
                        {mapel.semester === 'ganjil' ? 'Ganjil' :
                         mapel.semester === 'genap' ? 'Genap' : 'Keduanya'}
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded">
                      <p className="text-gray-500">Jenis</p>
                      <p className="font-semibold text-gray-900 truncate">
                        {mapel.keterangan === 'umum' ? 'Umum' : 'Jurusan'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600">Kelas:</span>
                    {mapel.tingkatKelas?.map(tingkat => (
                      <Badge key={tingkat} variant="default" size="sm" className="text-xs">
                        {formatTingkatKelasSync(tingkat)}
                      </Badge>
                    )) || <span className="text-xs text-gray-400">-</span>}
                  </div>

                  {showJurusan && mapel.keterangan === 'jurusan' && mapel.jurusanId && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Jurusan: <span className="font-semibold text-gray-900">{getJurusanName(mapel.jurusanId)}</span></p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(mapel)} className="flex-1 flex items-center justify-center">
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(mapel.id)} className="flex-1 flex items-center justify-center">
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

      <TambahMapelForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMapel(null);
        }}
        editingMapel={editingMapel}
        onSuccess={async () => {
          // Clear cache dan muat ulang data dari useMataPelajaran
          await refreshMataPelajaran();
          await fetchData();
          // Refresh tour untuk menampilkan modal berikutnya
          setTimeout(() => {
            refreshTour();
          }, 100);
        }}
      />
    </div>
  );
};

export default ManajemenMapel;