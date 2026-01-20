import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Clock, ArrowLeft, School, BookOpen, Calculator, AlertCircle } from 'lucide-react';
import { JadwalPelajaran } from '../../../../types';
import { apiService } from '../../../../services/apiService';
import { formatDurasi, calculateTotalDurasi, getJadwalBreakdown } from '../../../../utils/sksUtils';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import TambahJadwalForm from '../../forms/TambahJadwalForm';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import JurusanListView from '../manejemen-murid/views/JurusanListView';
import KelasListView from '../manejemen-murid/views/KelasListView';
import { isJurusanRequiredSync } from '../../../../utils/jenjangPendidikanUtils';
import { useGurus } from '../../../../hooks/useGurus';
import { useOnboardingTourContext } from '../../../../context/OnboardingTourContext';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useJadwalPelajaran, clearAllJadwalPelajaranCache } from '../../../../hooks/useJadwalPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useMurid } from '../../../../hooks/useMurid';
import { usePengaturanSKS } from '../../../../hooks/usePengaturanSKS';
import { usePengaturanIstirahat } from '../../../../hooks/usePengaturanIstirahat';

const ManajemenJadwal: React.FC = () => {
  const { refreshTour } = useOnboardingTourContext();
  // Cache hooks
  const { gurus } = useGurus();
  const { mataPelajaran } = useMataPelajaran();
  const { kelas } = useKelas();
  const { jurusan } = useJurusan();
  const { activeTahunAjaran } = useTahunAjaran();
  const { murid } = useMurid();
  const { activePengaturanSKS } = usePengaturanSKS();
  const { activePengaturanIstirahat } = usePengaturanIstirahat();
  
  const [selectedJurusan, setSelectedJurusan] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalPelajaran | null>(null);

  // Get jadwal pelajaran dengan filter kelas, tahun ajaran, dan semester
  const { jadwalPelajaran, refreshJadwalPelajaran } = useJadwalPelajaran(
    selectedKelas && activeTahunAjaran
      ? {
          kelasId: selectedKelas,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  // Combine gurus and murid into users array for backward compatibility
  const users = useMemo(() => {
    return [...gurus, ...murid];
  }, [gurus, murid]);

  const activeJurusan = jurusan.filter(j => j.isActive);


  const handleJurusanClick = (jurusanId: string) => {
    setSelectedJurusan(jurusanId);
    setSelectedKelas('');
  };

  const handleKelasClick = (kelasId: string) => {
    setSelectedKelas(kelasId);
  };

  const handleBack = () => {
    if (selectedKelas) {
      setSelectedKelas('');
    } else if (selectedJurusan) {
      setSelectedJurusan('');
    }
  };

  const handleEdit = (jadwal: JadwalPelajaran) => {
    setEditingJadwal(jadwal);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingJadwal(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const jadwal = jadwalPelajaran.find(j => j.id === id);
    if (!jadwal) return;

    const mapelName = getMapelName(jadwal.mataPelajaranId);
    const kelasName = getKelasName(jadwal.kelasId);
    const guruName = getGuruName(jadwal.guruId);

    showDangerConfirmation(
      'Hapus Jadwal Pelajaran',
      `Apakah Anda yakin ingin menghapus jadwal:\n\n• Mata Pelajaran: ${mapelName}\n• Kelas: ${kelasName}\n• Guru: ${guruName}\n• Hari: ${jadwal.hari}\n• Waktu: ${jadwal.jamMulai} - ${jadwal.jamSelesai}\n\nTindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const response = await apiService.deleteJadwalPelajaran(id);
          if (response.success) {
            // Clear cache dan muat ulang data dari useJadwalPelajaran
            clearAllJadwalPelajaranCache();
            await refreshJadwalPelajaran();
          } else {
            alert(response.message || 'Gagal menghapus jadwal pelajaran');
          }
        } catch (error) {
          console.error('Error deleting jadwal pelajaran:', error);
          alert('Gagal menghapus jadwal pelajaran');
        }
      },
      {
        confirmText: 'Ya, Hapus Jadwal',
        cancelText: 'Batal'
      }
    );
  };

  const getKelasName = (kelasId: string) => {
    return kelas.find(k => k.id === kelasId)?.name || 'Unknown';
  };

  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  const getGuruName = (guruId: string) => {
    return gurus.find(g => g.id === guruId)?.name || 'Unknown';
  };

  const getJurusanName = (jurusanId: string) => {
    return jurusan.find(j => j.id === jurusanId)?.name || 'Unknown';
  };

  const getMuridCount = (jurusanId: string) => {
    const kelasIds = kelas.filter(k => k.jurusanId === jurusanId).map(k => k.id);
    return users.filter(u => u.role === 'murid' && kelasIds.includes(u.kelasId || '')).length;
  };

  const getMuridCountInKelas = (kelasId: string) => {
    return users.filter(u => u.role === 'murid' && u.kelasId === kelasId).length;
  };

  const getMapelDurasi = (mapelId: string) => {
    const mapel = mataPelajaran.find(m => m.id === mapelId);
    if (!mapel || !activePengaturanSKS) return '';
    return formatDurasi(calculateTotalDurasi(mapel.sks, activePengaturanSKS));
  };

  // View: Daftar Jurusan (only for SMA/SMK)
  const showJurusan = isJurusanRequiredSync();

  if (!showJurusan && !selectedKelas) {
    // For SD/SMP, skip jurusan selection and go directly to kelas list
    return (
      <div className="space-y-6">
        <KelasListView
          selectedJurusan="" // No jurusan for SD/SMP
          jurusan={jurusan}
          kelas={kelas}
          users={murid} // Murid data for count
          gurus={gurus} // Guru data for wali kelas
          onBack={() => {}} // No back button for SD/SMP
          onKelasClick={handleKelasClick}
          showAddMuridButton={false}
          header={{
            icon: <School className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />,
            title: 'Jadwal Pelajaran',
            description: 'Pilih kelas untuk mengelola jadwal pelajaran'
          }}
        />
      </div>
    );
  }

  if (!selectedJurusan && showJurusan) {
    return (
      <div className="space-y-6">


        <JurusanListView
          jurusan={jurusan}
          kelas={kelas}
          users={murid}
          onJurusanClick={handleJurusanClick}
          header={{
            icon: <School className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />,
            title: 'Jadwal Pelajaran',
            description: 'Pilih jurusan untuk mengelola jadwal pelajaran'
          }}
          showStats={false}
        />
      </div>
    );
  }

  // View: Daftar Kelas dalam Jurusan
  if (selectedJurusan && !selectedKelas) {
    return (
      <KelasListView
        selectedJurusan={selectedJurusan}
        jurusan={jurusan}
        kelas={kelas}
        users={murid} // Murid data for count
        gurus={gurus} // Guru data for wali kelas
        onBack={handleBack}
        onKelasClick={handleKelasClick}
        showAddMuridButton={false}
      />
    );
  }

  // View: Jadwal Pelajaran dalam Kelas
  const currentKelas = kelas.find(k => k.id === selectedKelas);
  const currentJurusan = jurusan.find(j => j.id === currentKelas?.jurusanId);
  const jadwalKelas = jadwalPelajaran; // Already filtered by API

  if (!activeTahunAjaran) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tahun Ajaran Tidak Aktif</h3>
        <p className="text-gray-600">Tidak ada tahun ajaran yang sedang aktif. Silakan aktifkan tahun ajaran terlebih dahulu di menu Tahun Ajaran.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="secondary"
                onClick={handleBack}
                className="flex-shrink-0 !p-2.5 sm:!p-3 flex items-center"
              >
                <ArrowLeft size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white truncate">
                  Jadwal {currentKelas?.name}
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 truncate">
                  {currentJurusan?.name} • {jadwalKelas.length} jadwal • {activeTahunAjaran.tahun} Semester {activeTahunAjaran.semester}
                </p>
              </div>
            </div>
            <Button
              onClick={handleAdd}
              className="flex items-center bg-green-600 justify-center text-xs sm:text-sm whitespace-nowrap w-full sm:w-auto"
            >
              <Plus size={16} className="sm:mr-2 text-white" />
              <span className="text-white" >Tambah Jadwal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* SKS Settings Info */}
      {activePengaturanSKS && (
        <Card padding="sm" className="border-l-4 border-l-blue-500 bg-blue-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-blue-600 flex-shrink-0" />
              <span className="font-medium text-sm text-gray-900">Pengaturan JP:</span>
              <Badge variant="info" size="sm">
                {activePengaturanSKS.durasiPerSKS} menit/JP
              </Badge>
              {activePengaturanSKS.istirahatAntarSKS > 0 && (
                <Badge variant="warning" size="sm">
                  +{activePengaturanSKS.istirahatAntarSKS} menit istirahat
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-600">
              Jam selesai dihitung otomatis berdasarkan JP
            </div>
          </div>
        </Card>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Daftar Jadwal Pelajaran</h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableCell header className="text-sm">Mata Pelajaran</TableCell>
                <TableCell header className="text-sm">Keterangan</TableCell>
                <TableCell header className="text-sm">Guru</TableCell>
                <TableCell header className="text-sm">Hari</TableCell>
                <TableCell header className="text-sm">Waktu</TableCell>
                <TableCell header className="text-sm">Semester</TableCell>
                <TableCell header className="text-sm">Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jadwalKelas.map((jadwal) => {
                const mapel = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId);
                return (
                  <TableRow key={jadwal.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-blue-600 flex-shrink-0" />
                        <span className="truncate">{getMapelName(jadwal.mataPelajaranId)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="default" size="sm">{mapel?.sks || 0} JP</Badge>
                          <Badge variant={
                            mapel?.keterangan === 'umum' 
                              ? 'info' 
                              : mapel?.keterangan === 'agama'
                              ? 'success'
                              : 'warning'
                          } size="sm">
                            {mapel?.keterangan === 'umum' 
                              ? 'UMUM' 
                              : mapel?.keterangan === 'agama'
                              ? 'AGAMA'
                              : 'JURUSAN'}
                          </Badge>
                        </div>
                        {activePengaturanSKS && mapel && (
                          <div className="text-xs text-gray-500">
                            Durasi: {getMapelDurasi(jadwal.mataPelajaranId)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getGuruName(jadwal.guruId)}</TableCell>
                    <TableCell className="text-sm capitalize">{jadwal.hari}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="font-mono text-sm">{jadwal.jamMulai} - {jadwal.jamSelesai}</div>
                          {activePengaturanSKS && mapel && activePengaturanIstirahat && (
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const breakdown = getJadwalBreakdown(
                                  jadwal.jamMulai,
                                  mapel.sks,
                                  activePengaturanSKS,
                                  activePengaturanIstirahat
                                );

                                const hasBreak = breakdown.segments.some(s => s.type === 'break');

                                if (hasBreak) {
                                  return 'Terpotong istirahat';
                                } else {
                                  const [startHour, startMin] = jadwal.jamMulai.split(':').map(Number);
                                  const [endHour, endMin] = jadwal.jamSelesai.split(':').map(Number);
                                  const actualDuration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                                  const expectedDuration = calculateTotalDurasi(mapel.sks, activePengaturanSKS);
                                  return actualDuration === expectedDuration ?
                                    'Sesuai SKS' :
                                    `${actualDuration} menit (seharusnya ${expectedDuration})`;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="default">
                        S - {jadwal.semester}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(jadwal)}
                          className="!p-2 flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit size={14} className="mr-2"/> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(jadwal.id)}
                          className="!p-2 flex items-center justify-center"
                          title="Hapus"
                        >
                          <Trash2 size={14} className="mr-2 "/>Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {jadwalKelas.length === 0 && (
            <div className="text-center py-12 px-6">
              <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Belum Ada Jadwal</h3>
              <p className="text-sm text-slate-600">
                Belum ada jadwal pelajaran untuk kelas {currentKelas?.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet List View */}
      <div className="lg:hidden space-y-3 sm:space-y-4">
        {jadwalKelas.length > 0 ? (
          jadwalKelas.map((jadwal) => {
            const mapel = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId);
            return (
              <div
                key={jadwal.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 space-y-3 sm:p-4">
                  {/* Header dengan Mata Pelajaran */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2.5 rounded-lg bg-blue-100 flex-shrink-0 mt-0.5">
                        <BookOpen size={16} className="text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">
                          {getMapelName(jadwal.mataPelajaranId)}
                        </h3>
                        <p className="text-xs text-slate-600 truncate">
                          Guru: {getGuruName(jadwal.guruId)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="info" size="sm" className="flex-shrink-0">
                      {mapel?.sks || 0} JP
                    </Badge>
                  </div>

                  {/* Informasi Jadwal */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-600">Hari</p>
                        <p className="text-sm font-medium text-slate-900 capitalize">{jadwal.hari}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Waktu</p>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-sm font-mono text-slate-900">
                            {jadwal.jamMulai} - {jadwal.jamSelesai}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Keterangan Mapel */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <Badge
                        variant={
                          mapel?.keterangan === 'umum' 
                            ? 'info' 
                            : mapel?.keterangan === 'agama'
                            ? 'success'
                            : 'warning'
                        }
                        size="sm"
                        className="text-xs"
                      >
                        {mapel?.keterangan === 'umum' 
                          ? 'UMUM' 
                          : mapel?.keterangan === 'agama'
                          ? 'AGAMA'
                          : 'JURUSAN'}
                      </Badge>
                      <Badge variant="default" size="sm" className="text-xs">
                        Semester {jadwal.semester}
                      </Badge>
                      {activePengaturanSKS && mapel && (
                        <span className="text-xs text-slate-600">
                          Durasi: {getMapelDurasi(jadwal.mataPelajaranId)}
                        </span>
                      )}
                    </div>

                    {/* Status Durasi */}
                    {activePengaturanSKS && mapel && activePengaturanIstirahat && (
                      <div className="text-xs px-2.5 py-1.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                        {(() => {
                          const breakdown = getJadwalBreakdown(
                            jadwal.jamMulai,
                            mapel.sks,
                            activePengaturanSKS,
                            activePengaturanIstirahat
                          );

                          const hasBreak = breakdown.segments.some(s => s.type === 'break');

                          if (hasBreak) {
                            return 'Status: Terpotong istirahat';
                          } else {
                            const [startHour, startMin] = jadwal.jamMulai.split(':').map(Number);
                            const [endHour, endMin] = jadwal.jamSelesai.split(':').map(Number);
                            const actualDuration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                            const expectedDuration = calculateTotalDurasi(mapel.sks, activePengaturanSKS);
                            return actualDuration === expectedDuration ?
                              'Status: Sesuai SKS' :
                              `Status: ${actualDuration} menit (seharusnya ${expectedDuration})`;
                          }
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(jadwal)}
                      className="flex-1 text-xs flex items-center justify-center"
                    >
                      <Edit size={12} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(jadwal.id)}
                      className="flex-1 text-xs flex items-center justify-center"
                    >
                      <Trash2 size={12} className="mr-1" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">Belum Ada Jadwal</h3>
            <p className="text-xs text-slate-600 mb-4">
              Belum ada jadwal pelajaran untuk kelas {currentKelas?.name}
            </p>
           
          </div>
        )}
      </div>

      {/* Form Component */}
      <TambahJadwalForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingJadwal(null);
        }}
        editingJadwal={editingJadwal}
        selectedKelas={selectedKelas}
        onSuccess={async () => {
          // Clear cache dan muat ulang data dari useJadwalPelajaran
          clearAllJadwalPelajaranCache();
          await refreshJadwalPelajaran();
          // Refresh tour untuk menampilkan modal berikutnya (jika ada)
          setTimeout(() => {
            refreshTour();
          }, 100);
        }}
      />
    </div>
  );
};

export default ManajemenJadwal;