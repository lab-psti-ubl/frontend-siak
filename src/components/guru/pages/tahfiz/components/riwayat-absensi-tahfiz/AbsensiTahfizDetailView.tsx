import React, { useMemo, useState } from 'react';
import Card from '../../../../../ui/Card';
import Badge from '../../../../../ui/Badge';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import { Calendar, Clock, Users, User as UserIcon, Save, CheckCircle } from 'lucide-react';
import { SesiAbsensiTahfiz, TahfizSchedule, User } from '../../../../../../types';
import { TahfizClass } from '../../../../../../hooks/useKelasTahfiz';
import { useSesiAbsensiTahfiz } from '../../../../../../hooks/useSesiAbsensiTahfiz';
import { useAuth } from '../../../../../../context/AuthContext';
import { apiService } from '../../../../../../services/apiService';
import { getLocalTimeISOString } from '../../../../../../utils/absensiUtils';

interface AbsensiTahfizDetailViewProps {
  sesiId: string;
  jadwalId: string;
  kelasId: string;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  jadwalTahfiz: TahfizSchedule[];
  santri: User[];
  kelasTahfiz: TahfizClass[];
  selectedTahun: string;
}

const AbsensiTahfizDetailView: React.FC<AbsensiTahfizDetailViewProps> = ({
  sesiId,
  jadwalId,
  kelasId,
  sesiAbsensiTahfiz,
  jadwalTahfiz,
  santri,
  kelasTahfiz,
  selectedTahun,
}) => {
  const { user } = useAuth();
  const { sesiAbsensiTahfiz: allSesiAbsensiTahfiz, refreshSesiAbsensiTahfiz, createSesiAbsensiTahfiz } = useSesiAbsensiTahfiz();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isCreatingSesi, setIsCreatingSesi] = React.useState(false);

  // Check if this is a virtual session (pertemuan yang tidak mengajar)
  const isVirtualSession = sesiId.startsWith('virtual-tahfiz-');
  
  // Extract tanggal from virtual session ID
  // Format: virtual-tahfiz-YYYY-MM-DD-jadwalId
  const virtualSessionDate = isVirtualSession
    ? sesiId.replace('virtual-tahfiz-', '').split('-').slice(0, 3).join('-')
    : null;

  // Gunakan data sesi dari hook (paling baru), fallback ke props
  const sesi = useMemo(() => {
    if (isVirtualSession) {
      // For virtual session, try to find existing sesi by tanggal and jadwalId
      const existingSesi = allSesiAbsensiTahfiz.find(s => 
        s.jadwalId === jadwalId && 
        s.tanggal === virtualSessionDate &&
        s.tahun === selectedTahun
      );
      return existingSesi || null;
    }
    const hookSesi = allSesiAbsensiTahfiz.find(s => s.id === sesiId);
    if (hookSesi) return hookSesi;
    return sesiAbsensiTahfiz.find(s => s.id === sesiId);
  }, [allSesiAbsensiTahfiz, sesiAbsensiTahfiz, sesiId, refreshKey, isVirtualSession, jadwalId, virtualSessionDate, selectedTahun]);

  // Create sesi if virtual session and sesi doesn't exist
  React.useEffect(() => {
    if (isVirtualSession && !sesi && !isCreatingSesi && user && jadwalId && virtualSessionDate) {
      setIsCreatingSesi(true);
      const createVirtualSesi = async () => {
        try {
          const newSesiId = `sesi-tahfiz-${jadwalId}-${virtualSessionDate}-${Date.now()}`;
          const newSesi: Partial<SesiAbsensiTahfiz> = {
            id: newSesiId,
            jadwalId: jadwalId,
            tanggal: virtualSessionDate,
            jamBuka: '00:00',
            jamTutup: '23:59',
            status: 'ditutup', // Set as closed so absensi can be added
            createdBy: user.id,
            tahun: selectedTahun,
            dataAbsensi: [],
          };
          await createSesiAbsensiTahfiz(newSesi);
          await refreshSesiAbsensiTahfiz();
          setRefreshKey(prev => prev + 1);
        } catch (error) {
          console.error('Error creating virtual sesi:', error);
        } finally {
          setIsCreatingSesi(false);
        }
      };
      createVirtualSesi();
    }
  }, [isVirtualSession, sesi, isCreatingSesi, user, jadwalId, virtualSessionDate, selectedTahun, createSesiAbsensiTahfiz, refreshSesiAbsensiTahfiz]);

  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
  const kelasData = kelasTahfiz.find(k => k.id === kelasId);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState<User | null>(null);
  const [editStatus, setEditStatus] = useState<'hadir' | 'izin' | 'sakit' | 'alfa'>('hadir');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [isNewAbsensi, setIsNewAbsensi] = useState(false);

  // Get santri list for this class
  const santriList = useMemo(() => {
    if (!kelasData) return [];
    return kelasData.santriIds
      .map(id => santri.find(s => s.id === id))
      .filter(Boolean) as User[];
  }, [kelasData, santri]);

  // Get absensi data from sesi (or empty array if sesi doesn't exist yet)
  const absensiData = useMemo(() => {
    return sesi?.dataAbsensi || [];
  }, [sesi]);

  const getSantriAbsensi = (santriId: string) => {
    return absensiData.find(a => a.muridId === santriId);
  };

  const handleEditAbsensi = (santriItem: User, absensiItem?: any) => {
    setSelectedSantri(santriItem);
    if (absensiItem) {
      setEditStatus(absensiItem.status);
      setEditKeterangan(absensiItem.keterangan || '');
      setIsNewAbsensi(false);
    } else {
      setEditStatus('hadir');
      setEditKeterangan('');
      setIsNewAbsensi(true);
    }
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSantri) return;

    // If virtual session and sesi doesn't exist yet, create it first
    let activeSesi = sesi;
    if (isVirtualSession && !sesi && user && jadwalId && virtualSessionDate) {
      try {
        const newSesiId = `sesi-tahfiz-${jadwalId}-${virtualSessionDate}-${Date.now()}`;
        const newSesi: Partial<SesiAbsensiTahfiz> = {
          id: newSesiId,
          jadwalId: jadwalId,
          tanggal: virtualSessionDate,
          jamBuka: '00:00',
          jamTutup: '23:59',
          status: 'ditutup',
          createdBy: user.id,
          tahun: selectedTahun,
          dataAbsensi: [],
        };
        const createdSesi = await createSesiAbsensiTahfiz(newSesi);
        await refreshSesiAbsensiTahfiz();
        activeSesi = createdSesi;
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error creating sesi for absensi:', error);
        return;
      }
    }

    if (!activeSesi) {
      console.error('Sesi tidak ditemukan dan gagal dibuat');
      return;
    }

    const absensiPelajaranData = {
      muridId: selectedSantri.id,
      status: editStatus,
      waktu: getLocalTimeISOString(),
      keterangan: editKeterangan,
      method: 'manual',
      statusAbsen: editStatus === 'hadir' ? 'tepat_waktu' : undefined,
      keteranganAbsensi:
        editStatus === 'hadir'
          ? 'Hadir'
          : editStatus === 'izin'
          ? 'Izin'
          : editStatus === 'sakit'
          ? 'Sakit'
          : editStatus === 'alfa'
          ? 'Alfa'
          : undefined,
    };

    try {
      const response = await apiService.addAbsensiToSesiTahfiz(activeSesi.id, absensiPelajaranData);
      if (response.success) {
        await refreshSesiAbsensiTahfiz();
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error saving tahfiz absensi:', error);
    }

    setEditModalOpen(false);
    setSelectedSantri(null);
  };

  const handleCeklisHadirSemua = async () => {
    // If virtual session and sesi doesn't exist yet, create it first
    let activeSesi = sesi;
    if (isVirtualSession && !sesi && user && jadwalId && virtualSessionDate) {
      try {
        const newSesiId = `sesi-tahfiz-${jadwalId}-${virtualSessionDate}-${Date.now()}`;
        const newSesi: Partial<SesiAbsensiTahfiz> = {
          id: newSesiId,
          jadwalId: jadwalId,
          tanggal: virtualSessionDate,
          jamBuka: '00:00',
          jamTutup: '23:59',
          status: 'ditutup',
          createdBy: user.id,
          tahun: selectedTahun,
          dataAbsensi: [],
        };
        const createdSesi = await createSesiAbsensiTahfiz(newSesi);
        await refreshSesiAbsensiTahfiz();
        activeSesi = createdSesi;
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error creating sesi for bulk absensi:', error);
        return;
      }
    }

    if (!activeSesi) {
      console.error('Sesi tidak ditemukan dan gagal dibuat');
      return;
    }

    const absensiList = santriList.map(s => ({
      muridId: s.id,
      status: 'hadir' as const,
      waktu: getLocalTimeISOString(),
      keterangan: 'Hadir semua - manual',
      method: 'manual' as const,
      statusAbsen: 'tepat_waktu' as const,
      keteranganAbsensi: 'Hadir' as const,
    }));

    try {
      const response = await apiService.bulkAddAbsensiToSesiTahfiz(activeSesi.id, absensiList);
      if (response.success) {
        await refreshSesiAbsensiTahfiz();
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error bulk saving tahfiz absensi:', error);
    }
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const formatWaktu = (waktu: string) => {
    const date = new Date(waktu);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
        return <Badge variant="success">Hadir</Badge>;
      case 'izin':
        return <Badge variant="warning">Izin</Badge>;
      case 'sakit':
        return <Badge variant="info">Sakit</Badge>;
      case 'alfa':
        return <Badge variant="error">Alfa</Badge>;
      case 'terlambat':
        return <Badge variant="warning">Terlambat</Badge>;
      case 'pulang_cepat':
        return <Badge variant="warning">Pulang Cepat</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const stats = useMemo(() => {
    const hadir = absensiData.filter(a => a.status === 'hadir').length;
    const izin = absensiData.filter(a => a.status === 'izin').length;
    const sakit = absensiData.filter(a => a.status === 'sakit').length;
    const alfa = absensiData.filter(a => a.status === 'alfa').length;
    const total = santriList.length;

    return { hadir, izin, sakit, alfa, total };
  }, [absensiData, santriList.length]);

  if (!jadwal || !kelasData) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
          <p className="text-sm sm:text-base text-slate-600">Data tidak ditemukan</p>
        </div>
      </div>
    );
  }

  // For virtual session, use virtual date or current date
  const displayTanggal = sesi?.tanggal || virtualSessionDate || new Date().toISOString().split('T')[0];
  
  // If sesi doesn't exist yet (virtual session), show loading or allow creating
  if (isVirtualSession && !sesi && isCreatingSesi) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
          <p className="text-sm sm:text-base text-slate-600">Mempersiapkan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Info */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                {kelasData.namaKelas}
              </h3>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTanggal(displayTanggal)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{jadwal.jamMulai} - {jadwal.jamSelesai}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{santriList.length} Santri</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={sesi?.status === 'ditutup' ? 'success' : sesi ? 'warning' : 'secondary'}>
                {sesi?.status === 'ditutup' ? 'Ditutup' : sesi ? 'Dibuka' : 'Belum Mengajar'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <div className="p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Hadir</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.hadir}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Izin</p>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{stats.izin}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Sakit</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">{stats.sakit}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <div className="p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Alfa</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.alfa}</p>
          </div>
        </Card>
      </div>

      {/* Absensi Table */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <h4 className="text-base sm:text-lg font-bold text-slate-900">Daftar Absensi Santri</h4>
            {santriList.length > 0 && (sesi?.status === 'ditutup' || !sesi) && (
              <Button
                onClick={handleCeklisHadirSemua}
                variant="primary"
                size="sm"
                className="text-xs sm:text-sm w-full sm:w-auto flex items-center justify-center"
              >
                <CheckCircle size={14} className="mr-1.5 sm:mr-2" />
                Ceklis Hadir Semua
              </Button>
            )}
          </div>
          
          {/* Desktop/Tablet Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Santri</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Waktu</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Keterangan</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {santriList.map((santriItem, index) => {
                  const absensi = getSantriAbsensi(santriItem.id);
                  return (
                    <tr key={santriItem.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {santriItem.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-slate-900">{santriItem.name}</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {absensi ? getStatusBadge(absensi.status) : <Badge variant="secondary">-</Badge>}
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                        {absensi ? formatWaktu(absensi.waktu) : '-'}
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600">
                        {absensi?.keterangan || '-'}
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                        <Button
                          onClick={() => handleEditAbsensi(santriItem, absensi)}
                          variant="secondary"
                          size="sm"
                          className="text-xs px-2 py-1 mx-auto"
                        >
                          {absensi ? 'Edit' : 'Tambah'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {santriList.map((santriItem, index) => {
              const absensi = getSantriAbsensi(santriItem.id);
              return (
                <Card key={santriItem.id} className="border border-slate-200">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {santriItem.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{santriItem.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">#{index + 1}</p>
                      </div>
                      <div>
                        {absensi ? getStatusBadge(absensi.status) : <Badge variant="secondary">-</Badge>}
                      </div>
                    </div>
                    {absensi && (
                      <div className="pt-3 border-t border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatWaktu(absensi.waktu)}</span>
                        </div>
                        {absensi.keterangan && (
                          <p className="text-xs text-slate-600">{absensi.keterangan}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleEditAbsensi(santriItem, absensi)}
                    variant="primary"
                    size="sm"
                    className="w-full mt-3 text-xs flex items-center justify-center"
                  >
                    {absensi ? 'Edit Absensi' : 'Tambah Absensi'}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} size="md">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {isNewAbsensi ? 'Tambah' : 'Edit'} Absensi Tahfiz
          </h3>

          {selectedSantri && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Santri:</p>
              <p className="text-base font-semibold text-gray-900">
                {selectedSantri.name}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Kehadiran
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as 'hadir' | 'izin' | 'sakit' | 'alfa')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hadir">Hadir</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="alfa">Alfa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan (Opsional)
            </label>
            <textarea
              value={editKeterangan}
              onChange={(e) => setEditKeterangan(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tambahkan keterangan..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setEditModalOpen(false)}
              variant="secondary"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="primary"
              className="flex items-center"
            >
              <Save size={16} className="mr-2" />
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AbsensiTahfizDetailView;

