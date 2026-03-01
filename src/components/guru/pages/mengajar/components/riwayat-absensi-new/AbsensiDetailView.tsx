import React, { useState } from 'react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import Modal from '../../../../../ui/Modal';
import { Calendar, Clock, Users, User as UserIcon, Save, CheckCircle } from 'lucide-react';
import { SesiAbsensi, JadwalPelajaran, User, Kelas, MataPelajaran, Absensi, Murid, RiwayatKelasMurid, TahunAjaran } from '../../../../../../types';
import { useAbsensi } from '../../../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../../../hooks/useSesiAbsensi';
import { useRiwayatKelasMurid } from '../../../../../../hooks/useRiwayatKelasMurid';
import { getMuridByKelasAndTahunAjaran } from '../../../../../../utils/riwayatKelasMuridUtils';
import { apiService } from '../../../../../../services/apiService';
import { getLocalTimeISOString } from '../../../../../../utils/absensiUtils';

interface AbsensiDetailViewProps {
  sesiId: string;
  jadwalId: string;
  kelasId: string;
  sesiAbsensi: SesiAbsensi[];
  jadwalPelajaran: JadwalPelajaran[];
  users: User[];
  kelas: Kelas[];
  mataPelajaran: MataPelajaran[];
  isAdminView?: boolean;
  selectedTahunAjaran?: string;
  selectedSemester?: number;
  tahunAjaran?: TahunAjaran[];
}

const AbsensiDetailView: React.FC<AbsensiDetailViewProps> = ({
  sesiId,
  jadwalId,
  kelasId,
  sesiAbsensi,
  jadwalPelajaran,
  users,
  kelas,
  mataPelajaran,
  isAdminView = false,
  selectedTahunAjaran,
  selectedSemester,
  tahunAjaran = [],
}) => {
  const { absensi, refreshAbsensi } = useAbsensi();
  const { sesiAbsensi: allSesiAbsensi, createSesiAbsensi, updateSesiAbsensi, refreshSesiAbsensi, addAbsensiToSesi, bulkAddAbsensiToSesi, isSyncingWithWorker, syncMessage } = useSesiAbsensi();
  const { riwayatKelasMurid, createRiwayatKelasMurid, refreshRiwayatKelasMurid } = useRiwayatKelasMurid();
  const [refreshKey, setRefreshKey] = React.useState(0); // Force re-render after refresh
  const [loadingMuridIds, setLoadingMuridIds] = React.useState<Set<string>>(new Set()); // Loading state per murid
  const [isBulkLoading, setIsBulkLoading] = React.useState(false); // Loading state for bulk operation
  
  // Get current sesi - prioritize hook data (which is refreshed and has latest data)
  const activeSesi = React.useMemo(() => {
    // First check hook data (fresh, after refresh this will have latest data)
    const hookSesi = allSesiAbsensi.find(s => s.id === sesiId);
    if (hookSesi) return hookSesi;
    // Fallback to prop
    return sesiAbsensi.find(s => s.id === sesiId);
  }, [allSesiAbsensi, sesiAbsensi, sesiId, refreshKey]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMurid, setSelectedMurid] = useState<Murid | null>(null);
  const [editStatus, setEditStatus] = useState<'hadir' | 'izin' | 'sakit' | 'alfa'>('hadir');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [isNewAbsensi, setIsNewAbsensi] = useState(false);
  const [isSavingAbsensi, setIsSavingAbsensi] = useState(false);

  const isCurrentTahunAjaran = tahunAjaran.find(ta => ta.isActive);
  const isFilteringPreviousTahunAjaran = isCurrentTahunAjaran &&
    (selectedTahunAjaran !== isCurrentTahunAjaran.tahun || selectedSemester !== isCurrentTahunAjaran.semester);

  const isVirtualSession = sesiId.startsWith('virtual-');

  // Use activeSesi which combines hook data and prop data
  const sesi = activeSesi;
  const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
  const kelasData = kelas.find(k => k.id === kelasId);
  const mapel = mataPelajaran.find(m => m.id === jadwal?.mataPelajaranId);
  const guru = users.find(u => u.id === jadwal?.guruId);

  const virtualSessionDate = isVirtualSession
    ? sesiId.split('-').slice(-3).join('-')
    : null;

  let muridList: Murid[];

  if (sesi?.tahunAjaranId && riwayatKelasMurid.length > 0) {
    muridList = getMuridByKelasAndTahunAjaran(
      kelasId,
      sesi.tahunAjaranId,
      users,
      riwayatKelasMurid
    ) as Murid[];
  } else {
    muridList = users.filter(u => u.role === 'murid' && (u as Murid).kelasId === kelasId) as Murid[];
  }

  // Get absensi from sesi.dataAbsensi (absensi pelajaran) - this is the primary source
  // Also check Absensi collection as fallback for backward compatibility
  const absensiData = React.useMemo(() => {
    // Primary: Get from sesi.dataAbsensi (absensi pelajaran)
    const absensiFromSesi = activeSesi?.dataAbsensi || [];
    
    // Fallback: Get from Absensi collection (for backward compatibility)
    const absensiFromCollection = absensi.filter(a => a.sesiId === sesiId);
    
    // Combine both sources, prioritize sesi.dataAbsensi
    const combined: Absensi[] = [];
    const muridIdsProcessed = new Set<string>();
    
    // First, add from sesi.dataAbsensi (absensi pelajaran) - PRIMARY SOURCE
    absensiFromSesi.forEach(absenPelajaran => {
      combined.push({
        id: absenPelajaran.id,
        sesiId: sesiId,
        muridId: absenPelajaran.muridId,
        tanggal: activeSesi?.tanggal || virtualSessionDate || '',
        kelasId: kelasId,
        tipeAbsen: 'masuk',
        status: absenPelajaran.status,
        waktu: absenPelajaran.waktu,
        keterangan: absenPelajaran.keterangan,
        method: absenPelajaran.method,
        tahunAjaranId: activeSesi?.tahunAjaranId || '',
        semester: activeSesi?.semester || selectedSemester || 1,
        statusAbsen: absenPelajaran.statusAbsen,
        keteranganAbsensi: absenPelajaran.keteranganAbsensi,
      } as Absensi);
      muridIdsProcessed.add(absenPelajaran.muridId);
    });
    
    // Then add from Absensi collection for murid that don't have absensi in sesi (backward compatibility)
    absensiFromCollection.forEach(absen => {
      if (!muridIdsProcessed.has(absen.muridId)) {
        combined.push(absen);
      }
    });
    
    return combined;
  }, [activeSesi, absensi, sesiId, virtualSessionDate, kelasId, selectedSemester]);

  const getMuridAbsensi = (muridId: string) => {
    return absensiData.find(a => a.muridId === muridId);
  };

  const hariNames: Record<string, string> = {
    'senin': 'Senin',
    'selasa': 'Selasa',
    'rabu': 'Rabu',
    'kamis': 'Kamis',
    'jumat': 'Jumat',
    'sabtu': 'Sabtu',
    'minggu': 'Minggu',
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
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const handleEditAbsensi = (murid: Murid, absensiItem?: Absensi) => {
    setSelectedMurid(murid);
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
    if (!selectedMurid) return;

    let tahunAjaranId = activeSesi?.tahunAjaranId || sesi?.tahunAjaranId;
    let semester = selectedSemester;

    if (isVirtualSession && !activeSesi) {
      const activeTahunAjaran = tahunAjaran.find(ta =>
        ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester
      );
      tahunAjaranId = activeTahunAjaran?.id;
      semester = activeTahunAjaran?.semester || selectedSemester;

      const newVirtualSession: Partial<SesiAbsensi> = {
        id: sesiId,
        jadwalId: jadwalId,
        tanggal: virtualSessionDate || new Date().toISOString().split('T')[0],
        jamBuka: '00:00',
        jamTutup: '23:59',
        status: 'ditutup',
        createdBy: guru?.id || 'system',
        tahunAjaranId: tahunAjaranId,
        semester: semester,
      };
      try {
        await createSesiAbsensi(newVirtualSession);
      } catch (error) {
        console.error('Error creating virtual session:', error);
      }
    }

    if (tahunAjaranId) {
      const activeTahunAjaranData = tahunAjaran.find(ta => ta.id === tahunAjaranId);
      if (activeTahunAjaranData) {
        // Check if riwayat already exists
        const existingRiwayat = riwayatKelasMurid.find(
          r => r.muridId === selectedMurid.id &&
               r.kelasId === kelasId &&
               r.tahunAjaran === tahunAjaranId &&
               r.semester === activeTahunAjaranData.semester
        );
        
        if (!existingRiwayat) {
          try {
            await createRiwayatKelasMurid({
              muridId: selectedMurid.id,
              kelasId: kelasId,
              tahunAjaran: tahunAjaranId,
              semester: activeTahunAjaranData.semester,
              status: 'aktif',
            });
          } catch (error) {
            console.error('Error creating riwayat kelas murid:', error);
          }
        }
      }
    }

    // Use addAbsensiToSesi from hook (with worker fallback) to save absensi pelajaran to sesi.dataAbsensi
    try {
      setIsSavingAbsensi(true);
      // Set loading state for this murid
      setLoadingMuridIds(prev => new Set(prev).add(selectedMurid.id));
      
      const absensiPelajaranData = {
        muridId: selectedMurid.id,
        status: editStatus,
        waktu: getLocalTimeISOString(),
        keterangan: editKeterangan,
        method: 'manual',
        statusAbsen: editStatus === 'hadir' ? 'tepat_waktu' : undefined,
        keteranganAbsensi: editStatus === 'hadir' ? 'Hadir' : 
                          editStatus === 'izin' ? 'Izin' :
                          editStatus === 'sakit' ? 'Sakit' :
                          editStatus === 'alfa' ? 'Alfa' : undefined,
      };
      
      // Hook's addAbsensiToSesi handles worker fallback and auto-refresh with waitForWorker
      await addAbsensiToSesi(sesiId, absensiPelajaranData);
      
      // Refresh other related data
      await refreshAbsensi();
      await refreshRiwayatKelasMurid();
      
      // Force re-render dengan update key setelah semua refresh selesai
      setRefreshKey(prev => prev + 1);
      
      // Close modal after successful save
      setEditModalOpen(false);
      setSelectedMurid(null);
    } catch (error) {
      console.error('Error saving absensi pelajaran:', error);
      throw error; // Re-throw to show error to user
    } finally {
      setIsSavingAbsensi(false);
      // Clear loading state
      setLoadingMuridIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedMurid.id);
        return newSet;
      });
    }
  };

  const handleCeklisHadirSemua = async () => {
    let tahunAjaranId = activeSesi?.tahunAjaranId || sesi?.tahunAjaranId;
    let semester = selectedSemester;

    if (isVirtualSession && !activeSesi) {
      const activeTahunAjaran = tahunAjaran.find(ta =>
        ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester
      );
      tahunAjaranId = activeTahunAjaran?.id;
      semester = activeTahunAjaran?.semester || selectedSemester;

      const newVirtualSession: Partial<SesiAbsensi> = {
        id: sesiId,
        jadwalId: jadwalId,
        tanggal: virtualSessionDate || new Date().toISOString().split('T')[0],
        jamBuka: '00:00',
        jamTutup: '23:59',
        status: 'ditutup',
        createdBy: guru?.id || 'system',
        tahunAjaranId: tahunAjaranId,
        semester: semester,
      };
      try {
        await createSesiAbsensi(newVirtualSession);
      } catch (error) {
        console.error('Error creating virtual session:', error);
      }
    }

    if (tahunAjaranId) {
      const activeTahunAjaranData = tahunAjaran.find(ta => ta.id === tahunAjaranId);
      if (activeTahunAjaranData) {
        const muridIds = muridList.map(m => m.id);
        // Create riwayat for all murid if not exists
        for (const muridId of muridIds) {
          const existingRiwayat = riwayatKelasMurid.find(
            r => r.muridId === muridId &&
                 r.kelasId === kelasId &&
                 r.tahunAjaran === tahunAjaranId &&
                 r.semester === activeTahunAjaranData.semester
          );
          
          if (!existingRiwayat) {
            try {
              await createRiwayatKelasMurid({
                muridId: muridId,
                kelasId: kelasId,
                tahunAjaran: tahunAjaranId,
                semester: activeTahunAjaranData.semester,
                status: 'aktif',
              });
            } catch (error) {
              console.error('Error creating riwayat kelas murid:', error);
            }
          }
        }
      }
    }

    // Use bulkAddAbsensiToSesi from hook to save all absensi pelajaran at once
    const absensiList = muridList.map(murid => ({
      muridId: murid.id,
      status: 'hadir' as const,
      waktu: getLocalTimeISOString(),
      keterangan: 'Hadir semua - manual',
      method: 'manual' as const,
      statusAbsen: 'tepat_waktu' as const,
      keteranganAbsensi: 'Hadir' as const,
    }));
    
    try {
      setIsBulkLoading(true);
      
      // Hook's bulkAddAbsensiToSesi handles worker fallback and auto-refresh with waitForWorker
      await bulkAddAbsensiToSesi(sesiId, absensiList);
      
      // Refresh other related data
      await refreshAbsensi();
      await refreshRiwayatKelasMurid();
      
      // Force re-render dengan update key setelah semua refresh selesai
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving bulk absensi pelajaran:', error);
      throw error; // Re-throw to show error to user
    } finally {
      setIsBulkLoading(false);
    }
  };

  const calculateStats = () => {
    const hadir = absensiData.filter(a => a.status === 'hadir').length;
    const izin = absensiData.filter(a => a.status === 'izin').length;
    const sakit = absensiData.filter(a => a.status === 'sakit').length;
    const alfa = absensiData.filter(a => a.status === 'alfa').length;

    return { hadir, izin, sakit, alfa };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 via-slate-50 to-slate-50 border-blue-200">
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 truncate">{mapel?.name}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {kelasData?.name} • {formatTanggal(sesi?.tanggal || virtualSessionDate || '')}
                </p>
                {isVirtualSession && (
                  <div className="mt-2">
                    <Badge variant="error" className="text-xs">Guru Tidak Mengajar</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-blue-200">
            <div className="bg-white bg-opacity-60 rounded-lg p-2 sm:p-3">
              <p className="text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">Hari & Jam</p>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-900 font-semibold">
                <Clock size={14} className="flex-shrink-0 text-blue-600" />
                <span className="truncate">{hariNames[jadwal?.hari || '']} {jadwal?.jamMulai}</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-60 rounded-lg p-2 sm:p-3">
              <p className="text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">Guru Pengajar</p>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-900 font-semibold">
                <UserIcon size={14} className="flex-shrink-0 text-blue-600" />
                <span className="truncate">{guru?.name}</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-60 rounded-lg p-2 sm:p-3">
              <p className="text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">Total Murid</p>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-900 font-semibold">
                <Users size={14} className="flex-shrink-0 text-blue-600" />
                <span>{muridList.length}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border-emerald-200">
          <div className="text-center py-2 sm:py-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{stats.hadir}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Hadir</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-50/50 border-amber-200">
          <div className="text-center py-2 sm:py-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{stats.izin}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Izin</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-sky-50 to-sky-50/50 border-sky-200">
          <div className="text-center py-2 sm:py-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-600">{stats.sakit}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Sakit</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-50/50 border-red-200">
          <div className="text-center py-2 sm:py-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{stats.alfa}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Alfa</p>
          </div>
        </Card>
      </div>

      {(isSyncingWithWorker || isBulkLoading) && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-4">
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label="Memuat data absensi" />
          <p className="text-sm font-medium">
            {syncMessage || (isBulkLoading ? 'Menyimpan absensi pelajaran...' : 'Memproses absensi pelajaran...')}
          </p>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Data Absensi Murid</h3>
          {muridList.length > 0 && !isAdminView && !isFilteringPreviousTahunAjaran && (
            <Button
              onClick={handleCeklisHadirSemua}
              variant="primary"
              size="sm"
              disabled={isBulkLoading}
              className="text-xs sm:text-sm w-full sm:w-auto flex items-center justify-center"
            >
              {isBulkLoading ? (
                <>
                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle size={14} className="mr-1.5 sm:mr-2" />
                  Ceklis Hadir Semua
                </>
              )}
            </Button>
          )}
        </div>

        {muridList.length === 0 ? (
          <Card>
            <div className="text-center py-8 sm:py-12">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
              <p className="text-slate-600 font-medium text-sm sm:text-base">Tidak ada murid</p>
            </div>
          </Card>
        ) : (
          <>
            <div className="hidden lg:block border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-slate-50 border-b-2 border-blue-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Murid</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">NISN</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                      {!isAdminView && !isFilteringPreviousTahunAjaran && (
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {muridList.map((murid, index) => {
                      const absensiMurid = getMuridAbsensi(murid.id);
                      return (
                        <tr key={murid.id} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                          <td className="px-3 sm:px-6 py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{murid.name}</p>
                                <p className="text-xs text-slate-500 truncate">{murid.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium">
                              {murid.nisn}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3">
                            {absensiMurid ? getStatusBadge(absensiMurid.status) : <Badge variant="secondary" className="text-xs">-</Badge>}
                          </td>
                          {!isAdminView && !isFilteringPreviousTahunAjaran && (
                            <td className="px-3 sm:px-6 py-3 text-center">
                              {loadingMuridIds.has(murid.id) ? (
                                <div className="flex items-center justify-center gap-2 text-blue-600">
                                  <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs">Menyimpan...</span>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleEditAbsensi(murid, absensiMurid)}
                                  variant="secondary"
                                  size="sm"
                                  className="text-xs px-2 py-1 mx-auto"
                                >
                                  {absensiMurid ? 'Edit' : 'Tambah'}
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:hidden space-y-2.5">
              {muridList.map((murid, index) => {
                const absensiMurid = getMuridAbsensi(murid.id);
                return (
                  <Card key={murid.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-150">
                    <div className="space-y-2.5 sm:space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md mt-0.5">
                            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">{murid.name}</p>
                            <p className="text-xs text-slate-500 truncate">{murid.email}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Badge variant="info" className="text-xs">{murid.nisn}</Badge>
                              <span className="text-xs text-slate-500">No {index + 1}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-2 sm:p-3 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600">Status Kehadiran:</span>
                          {absensiMurid ? getStatusBadge(absensiMurid.status) : <Badge variant="secondary" className="text-xs">Belum Absen</Badge>}
                        </div>
                        {absensiMurid?.keterangan && (
                          <p className="text-xs text-slate-600 mt-1.5 italic">{absensiMurid.keterangan}</p>
                        )}
                      </div>

                      {!isAdminView && !isFilteringPreviousTahunAjaran && (
                        loadingMuridIds.has(murid.id) ? (
                          <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
                            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs sm:text-sm">Menyimpan...</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleEditAbsensi(murid, absensiMurid)}
                            variant="primary"
                            size="sm"
                            className="w-full text-xs sm:text-sm flex items-center justify-center"
                          >
                            {absensiMurid ? 'Edit Absensi' : 'Tambah Absensi'}
                          </Button>
                        )
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Modal isOpen={editModalOpen} onClose={() => !isSavingAbsensi && setEditModalOpen(false)} size="md">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">{isNewAbsensi ? 'Tambah' : 'Edit'} Absensi</h3>

          {selectedMurid && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Murid:</p>
              <p className="text-base font-semibold text-gray-900">
                {selectedMurid.name}
              </p>
            </div>
          )}

          {isSavingAbsensi && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label="Menyimpan data absensi" />
              <p className="text-sm font-medium">
                Menyimpan absensi pelajaran melalui worker...
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
              disabled={isSavingAbsensi}
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
              disabled={isSavingAbsensi}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setEditModalOpen(false)}
              variant="secondary"
              disabled={isSavingAbsensi}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="primary"
              className="flex items-center"
              disabled={isSavingAbsensi}
            >
              {isSavingAbsensi ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AbsensiDetailView;
