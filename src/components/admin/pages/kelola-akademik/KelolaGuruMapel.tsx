import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Users, BookOpen, Save, X, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { GuruMapel } from '../../../../types';
import { apiService } from '../../../../services/apiService';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import { formatTingkatKelasSync, getActiveJenjang } from '../../../../utils/jenjangPendidikanUtils';
import { useGurus } from '../../../../hooks/useGurus';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useOnboardingTourContext } from '../../../../context/OnboardingTourContext';

const KelolaGuruMapel: React.FC = () => {
  const { refreshTour } = useOnboardingTourContext();
  // Cache hooks
  const { gurus } = useGurus();
  const { mataPelajaran } = useMataPelajaran();
  const { kelas } = useKelas();
  const { jurusan } = useJurusan();
  const { activeTahunAjaran } = useTahunAjaran();
  
  // Get jadwal pelajaran untuk tahun ajaran aktif
  const { jadwalPelajaran } = useJadwalPelajaran(
    activeTahunAjaran
      ? {
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  // State untuk guruMapel (belum ada hook khusus)
  const [guruMapel, setGuruMapel] = useState<GuruMapel[]>([]);
  const [isLoadingGuruMapel, setIsLoadingGuruMapel] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<typeof gurus[0] | null>(null);
  const [selectedMapelIds, setSelectedMapelIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const activeJenjang = getActiveJenjang();
  const isJurusanVisible = activeJenjang === 'SMA/SMK';

  // Fetch guruMapel data
  const fetchGuruMapel = async () => {
    try {
      setIsLoadingGuruMapel(true);
      const response = await apiService.getAllGuruMapel({ isActive: true });
      if (response.success && response.guruMapel) {
        setGuruMapel(response.guruMapel);
      }
    } catch (error) {
      console.error('Error fetching guru mapel:', error);
      alert('Gagal memuat data guru mapel');
    } finally {
      setIsLoadingGuruMapel(false);
    }
  };

  // Fetch guruMapel on mount
  useEffect(() => {
    fetchGuruMapel();
  }, []);

  // Filter active gurus
  const activeGurus = useMemo(() => {
    return gurus.filter(u => u.role === 'guru' && u.isActive !== false);
  }, [gurus]);

  const filteredGurus = useMemo(() => {
    return activeGurus.filter(guru =>
      guru.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guru.nip && guru.nip.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [activeGurus, searchTerm]);

  // Auto-sync guru mapel with jadwal pelajaran
  useEffect(() => {
    if (!activeTahunAjaran || isLoadingGuruMapel) return;

    // jadwalPelajaran sudah difilter oleh hook berdasarkan tahunAjaran dan semester
    // Get unique guru-mapel combinations from current jadwal
    const guruMapelFromJadwal = new Set<string>();
    jadwalPelajaran.forEach(jadwal => {
      guruMapelFromJadwal.add(`${jadwal.guruId}-${jadwal.mataPelajaranId}`);
    });

    // Check if we need to sync
    const needsSync = Array.from(guruMapelFromJadwal).some(combination => {
      const [guruId, mapelId] = combination.split('-');
      return !guruMapel.find(gm => 
        gm.guruId === guruId && 
        gm.mataPelajaranId === mapelId && 
        gm.isActive
      );
    });

    if (needsSync) {
      const newGuruMapelPromises: Promise<any>[] = [];
      
      Array.from(guruMapelFromJadwal).forEach(combination => {
        const [guruId, mapelId] = combination.split('-');
        
        // Check if this combination already exists and is active
        const existing = guruMapel.find(gm => 
          gm.guruId === guruId && 
          gm.mataPelajaranId === mapelId && 
          gm.isActive
        );
        
        if (!existing) {
          newGuruMapelPromises.push(
            apiService.createGuruMapel({
              guruId,
              mataPelajaranId: mapelId,
              isActive: true,
            })
          );
        }
      });

      if (newGuruMapelPromises.length > 0) {
        Promise.all(newGuruMapelPromises).then(() => {
          fetchGuruMapel();
        }).catch(error => {
          console.error('Error syncing guru mapel:', error);
        });
      }
    }
  }, [jadwalPelajaran, activeTahunAjaran, guruMapel, isLoadingGuruMapel]);
  const getGuruMapel = (guruId: string) => {
    return guruMapel.filter(gm => gm.guruId === guruId && gm.isActive);
  };

  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  const getMapelCode = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.code || 'Unknown';
  };

  const getJurusanName = (jurusanId: string) => {
    return jurusan.find(j => j.id === jurusanId)?.name || 'Unknown';
  };

  const getAvailableMapelForGuru = () => {
    // Get all mata pelajaran yang bisa diajarkan
    return mataPelajaran.filter(m => m.keterangan === 'umum' || m.keterangan === 'agama' || m.keterangan === 'jurusan');
  };

  const handleEditGuru = (guru: typeof activeGurus[0]) => {
    setSelectedGuru(guru);
    const currentMapel = getGuruMapel(guru.id).map(gm => gm.mataPelajaranId);
    setSelectedMapelIds(currentMapel);
    setIsModalOpen(true);
  };

  const handleSaveGuruMapel = async () => {
    if (!selectedGuru) return;

    try {
      const response = await apiService.updateGuruMapelAssignments(
        selectedGuru.id,
        selectedMapelIds
      );
      
      if (response.success) {
        await fetchGuruMapel();
        resetForm();
        alert(`Mata pelajaran untuk ${selectedGuru.name} berhasil diperbarui!`);
        // Refresh tour untuk menampilkan modal berikutnya
        // Note: refreshTour() akan otomatis di-skip jika user klik "Nanti Saja" di menu ini
        setTimeout(() => {
          refreshTour();
        }, 100);
      } else {
        alert(response.message || 'Gagal memperbarui mata pelajaran guru');
      }
    } catch (error) {
      console.error('Error saving guru mapel:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    }
  };

  const resetForm = () => {
    setSelectedGuru(null);
    setSelectedMapelIds([]);
    setIsModalOpen(false);
  };

  const handleMapelToggle = (mapelId: string) => {
    setSelectedMapelIds(prev => 
      prev.includes(mapelId)
        ? prev.filter(id => id !== mapelId)
        : [...prev, mapelId]
    );
  };

  const getGuruStats = (guruId: string) => {
    const guruMapelList = getGuruMapel(guruId);
    const totalMapel = guruMapelList.length;
    const mapelUmum = guruMapelList.filter(gm => {
      const mapel = mataPelajaran.find(m => m.id === gm.mataPelajaranId);
      return mapel?.keterangan === 'umum';
    }).length;
    const mapelAgama = guruMapelList.filter(gm => {
      const mapel = mataPelajaran.find(m => m.id === gm.mataPelajaranId);
      return mapel?.keterangan === 'agama';
    }).length;
    const mapelJurusan = guruMapelList.filter(gm => {
      const mapel = mataPelajaran.find(m => m.id === gm.mataPelajaranId);
      return mapel?.keterangan === 'jurusan';
    }).length;

    return { totalMapel, mapelUmum, mapelAgama, mapelJurusan };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const groupedMataPelajaran = useMemo(() => ({
    umum: mataPelajaran.filter(m => m.keterangan === 'umum'),
    agama: mataPelajaran.filter(m => m.keterangan === 'agama'),
    jurusan: mataPelajaran.filter(m => m.keterangan === 'jurusan')
  }), [mataPelajaran]);

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Kelola Guru Mapel
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Atur mata pelajaran yang diajarkan oleh setiap guru
              </p>
            </div>
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
                placeholder="Cari nama guru atau NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            Menampilkan <span className="font-semibold text-slate-900">{filteredGurus.length}</span> dari <span className="font-semibold text-slate-900">{activeGurus.length}</span> guru
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Guru</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{activeGurus.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Sudah Diatur</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {activeGurus.filter(g => getGuruMapel(g.id).length > 0).length}
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
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Belum Diatur</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {activeGurus.filter(g => getGuruMapel(g.id).length === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table - Desktop View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Daftar Guru dan Mata Pelajaran</h3>
        </div>

        <div className="overflow-x-auto">
          {isLoadingGuruMapel ? (
            <div className="text-center py-12 px-6">
              <p className="text-sm text-gray-600">Memuat data...</p>
            </div>
          ) : filteredGurus.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableCell header className="text-sm">Guru</TableCell>
                  <TableCell header className="text-sm">NIP</TableCell>
                  <TableCell header className="text-sm">Mata Pelajaran</TableCell>
                  <TableCell header className="text-sm">Statistik</TableCell>
                  <TableCell header className="text-sm">Status</TableCell>
                  <TableCell header className="text-sm">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGurus.map((guru) => {
                  const guruMapelList = getGuruMapel(guru.id);
                  const stats = getGuruStats(guru.id);

                  return (
                    <TableRow key={guru.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {getInitials(guru.name)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{guru.name}</p>
                            {guru.isWaliKelas && (
                              <Badge variant="info" size="sm" className="text-xs">Wali Kelas</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                          {guru.nip}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1 max-w-xs">
                          {guruMapelList.length > 0 ? (
                            <>
                              {guruMapelList.slice(0, 2).map((gm) => (
                                <div key={gm.id} className="flex items-center space-x-2">
                                  <BookOpen size={12} className="text-blue-600 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-slate-700 truncate">
                                    {getMapelName(gm.mataPelajaranId)}
                                  </span>
                                </div>
                              ))}
                              {guruMapelList.length > 2 && (
                                <div className="text-xs text-slate-500 font-medium">
                                  +{guruMapelList.length - 2} lainnya
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs">Belum ada</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-slate-600">Total: </span>
                            <span className="font-semibold text-slate-900">{stats.totalMapel}</span>
                          </div>
                          <div className="flex space-x-1 flex-wrap">
                            <Badge variant="info" size="sm" className="text-xs">U: {stats.mapelUmum}</Badge>
                            <Badge variant="success" size="sm" className="text-xs">A: {stats.mapelAgama}</Badge>
                            {isJurusanVisible && (
                              <Badge variant="warning" size="sm" className="text-xs">J: {stats.mapelJurusan}</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {guruMapelList.length > 0 ? (
                          <Badge variant="success" className="text-xs">Teratur</Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditGuru(guru)}
                          className="text-xs flex items-center justify-center !px-3"
                        >
                          <Edit size={12} className="sm:mr-1" />
                          <span className="hidden sm:inline">Atur</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 px-6">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchTerm ? 'Tidak ada hasil' : 'Belum ada data guru'}
              </h3>
              <p className="text-sm text-slate-600">
                {searchTerm
                  ? `Tidak ditemukan guru dengan kata kunci "${searchTerm}"`
                  : 'Tambahkan guru terlebih dahulu di menu Manajemen Guru'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data List - Mobile View */}
      <div className="lg:hidden space-y-3">
        {isLoadingGuruMapel ? (
          <Card className="p-8">
            <div className="text-center">
              <p className="text-sm text-gray-600">Memuat data...</p>
            </div>
          </Card>
        ) : filteredGurus.length > 0 ? (
          filteredGurus.map((guru) => {
            const guruMapelList = getGuruMapel(guru.id);
            const stats = getGuruStats(guru.id);

            return (
              <div key={guru.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 space-y-3">
                  {/* Guru Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {getInitials(guru.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{guru.name}</p>
                      <p className="text-xs text-slate-500">NIP: {guru.nip}</p>
                      {guru.isWaliKelas && (
                        <Badge variant="info" size="sm" className="text-xs mt-1">Wali Kelas</Badge>
                      )}
                    </div>
                  </div>

                  {/* Mata Pelajaran Info */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">Mata Pelajaran:</div>
                    {guruMapelList.length > 0 ? (
                      <div className="space-y-1.5">
                        {guruMapelList.slice(0, 3).map((gm) => (
                          <div key={gm.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                            <span className="text-xs text-slate-700">{getMapelName(gm.mataPelajaranId)}</span>
                            <Badge
                              variant={
                                mataPelajaran.find(m => m.id === gm.mataPelajaranId)?.keterangan === 'umum' 
                                  ? 'info' 
                                  : mataPelajaran.find(m => m.id === gm.mataPelajaranId)?.keterangan === 'agama'
                                  ? 'success'
                                  : 'warning'
                              }
                              size="sm"
                              className="text-xs"
                            >
                              {getMapelCode(gm.mataPelajaranId)}
                            </Badge>
                          </div>
                        ))}
                        {guruMapelList.length > 3 && (
                          <div className="text-xs text-slate-500 font-medium pl-4">
                            +{guruMapelList.length - 3} mata pelajaran lainnya
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Belum ada mata pelajaran</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className={`grid gap-2 pt-2 border-t border-slate-100 ${isJurusanVisible ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{stats.totalMapel}</p>
                      <p className="text-xs text-slate-600">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{stats.mapelUmum}</p>
                      <p className="text-xs text-slate-600">Umum</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{stats.mapelAgama}</p>
                      <p className="text-xs text-slate-600">Agama</p>
                    </div>
                    {isJurusanVisible && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{stats.mapelJurusan}</p>
                        <p className="text-xs text-slate-600">Jurusan</p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      onClick={() => handleEditGuru(guru)}
                      className="w-full text-xs flex items-center justify-center"
                    >
                      <Edit size={14} className="mr-1" />
                      Atur Mata Pelajaran
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? 'Tidak ada hasil' : 'Belum ada data guru'}
            </h3>
            <p className="text-xs text-slate-600">
              {searchTerm
                ? `Tidak ditemukan guru dengan kata kunci "${searchTerm}"`
                : 'Tambahkan guru terlebih dahulu di menu Manajemen Guru'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal Atur Mata Pelajaran */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={`Atur Mata Pelajaran - ${selectedGuru?.name}`}
        size="xl"
      >
        {selectedGuru && (
          <div className="space-y-6">
            {/* Guru Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getInitials(selectedGuru.name)}
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedGuru.name}</h3>
                  <p className="text-sm text-blue-700">NIP: {selectedGuru.nip}</p>
                  {selectedGuru.isWaliKelas && (
                    <Badge variant="info" size="sm">Wali Kelas</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Mata Pelajaran Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Pilih Mata Pelajaran</h4>
                <div className="text-sm text-gray-600">
                  {selectedMapelIds.length} mata pelajaran dipilih
                </div>
              </div>

              {/* Mata Pelajaran Umum */}
              {groupedMataPelajaran.umum.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                    <BookOpen size={16} className="mr-2 text-blue-600" />
                    Mata Pelajaran Umum
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupedMataPelajaran.umum.map((mapel) => (
                      <div
                        key={mapel.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedMapelIds.includes(mapel.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleMapelToggle(mapel.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{mapel.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="info" size="sm">{mapel.code}</Badge>
                              <span className="text-xs text-gray-500">{mapel.sks} SKS</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedMapelIds.includes(mapel.id)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedMapelIds.includes(mapel.id) && (
                              <CheckCircle size={12} className="text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mata Pelajaran Agama */}
              {groupedMataPelajaran.agama.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                    <BookOpen size={16} className="mr-2 text-green-600" />
                    Mata Pelajaran Agama
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupedMataPelajaran.agama.map((mapel) => (
                      <div
                        key={mapel.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedMapelIds.includes(mapel.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleMapelToggle(mapel.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{mapel.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="success" size="sm">{mapel.code}</Badge>
                              <span className="text-xs text-gray-500">{mapel.sks} SKS</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedMapelIds.includes(mapel.id)
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedMapelIds.includes(mapel.id) && (
                              <CheckCircle size={12} className="text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mata Pelajaran Jurusan */}
              {groupedMataPelajaran.jurusan.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                    <BookOpen size={16} className="mr-2 text-orange-600" />
                    Mata Pelajaran Jurusan
                  </h5>
                  <div className="space-y-3">
                    {jurusan.filter(j => j.isActive).map((jurusanItem) => {
                      const mapelJurusan = groupedMataPelajaran.jurusan.filter(m => m.jurusanId === jurusanItem.id);
                      
                      if (mapelJurusan.length === 0) return null;
                      
                      return (
                        <div key={jurusanItem.id} className="border border-gray-200 rounded-lg p-4">
                          <h6 className="font-medium text-gray-700 mb-3">
                            {jurusanItem.name} ({jurusanItem.code})
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {mapelJurusan.map((mapel) => (
                              <div
                                key={mapel.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedMapelIds.includes(mapel.id)
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleMapelToggle(mapel.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{mapel.name}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge variant="warning" size="sm">{mapel.code}</Badge>
                                      <span className="text-xs text-gray-500">{mapel.sks} SKS</span>
                                    </div>
                                  </div>
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    selectedMapelIds.includes(mapel.id)
                                      ? 'border-orange-500 bg-orange-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedMapelIds.includes(mapel.id) && (
                                      <CheckCircle size={12} className="text-white" />
                                    )}
                                    
                                  </div>
                                </div>
                                <Badge 
                                  variant={mapel.semester === 'ganjil' ? 'info' : mapel.semester === 'genap' ? 'warning' : 'success'} 
                                  size="sm"
                                >
                                  {mapel.semester === 'ganjil' ? 'Ganjil' : mapel.semester === 'genap' ? 'Genap' : 'Keduanya'}
                                </Badge>
                                <div className="flex space-x-1">
                                  {(Array.isArray(mapel.tingkatKelas) ? mapel.tingkatKelas : []).map(tingkat => (
                                    <Badge key={tingkat} variant="default" size="sm">
                                      {formatTingkatKelasSync(tingkat)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedMapelIds.length > 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-medium text-emerald-900 mb-2">Ringkasan Pilihan:</h4>
                <div className={`grid gap-4 text-sm ${isJurusanVisible ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <div>
                    <span className="text-emerald-700">Total Mata Pelajaran:</span>
                    <span className="ml-2 font-medium text-emerald-900">{selectedMapelIds.length}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700">Mata Pelajaran Umum:</span>
                    <span className="ml-2 font-medium text-emerald-900">
                      {selectedMapelIds.filter(id => {
                        const mapel = mataPelajaran.find(m => m.id === id);
                        return mapel?.keterangan === 'umum';
                      }).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700">Mata Pelajaran Agama:</span>
                    <span className="ml-2 font-medium text-emerald-900">
                      {selectedMapelIds.filter(id => {
                        const mapel = mataPelajaran.find(m => m.id === id);
                        return mapel?.keterangan === 'agama';
                      }).length}
                    </span>
                  </div>
                  {isJurusanVisible && (
                    <div>
                      <span className="text-emerald-700">Mata Pelajaran Jurusan:</span>
                      <span className="ml-2 font-medium text-emerald-900">
                        {selectedMapelIds.filter(id => {
                          const mapel = mataPelajaran.find(m => m.id === id);
                          return mapel?.keterangan === 'jurusan';
                        }).length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <Button 
                onClick={handleSaveGuruMapel}
                fullWidth
                disabled={selectedMapelIds.length === 0}
                className="flex items-center justify-center"
              >
                <Save size={16} className="mr-2" />
                Simpan 
              </Button>
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={resetForm}
                className="flex items-center justify-center"
              >
                <X size={16} className="mr-2" />
                Batal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KelolaGuruMapel;