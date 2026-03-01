import React, { useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import QRScanner from '../../../ui/QRScanner';
import CameraCapture from '../../../ui/CameraCapture';
import { useAuth } from '../../../../context/AuthContext';
import { useIzinGuru } from '../../../../hooks/useIzinGuru';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useSuratIzin } from '../../../../hooks/useSuratIzin';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useAbsensiGuru } from '../../../../hooks/useAbsensiGuru';
import { useRiwayatKelasMurid } from '../../../../hooks/useRiwayatKelasMurid';
import { JadwalPelajaran, SesiAbsensi, Absensi, User, Kelas, MataPelajaran, SuratIzin, TahunAjaran, AbsensiGuru, RiwayatKelasMurid } from '../../../../types';
import JadwalCard from '../mengajar/components/kelola-absensi/JadwalCard';
import AbsensiManualModal from '../mengajar/components/kelola-absensi/AbsensiManualModal';
import SubjectQRModal from '../mengajar/components/kelola-absensi/SubjectQRModal';
import KeteranganModal from '../mengajar/components/kelola-absensi/KeteranganModal';
import SuratDetailModal from '../mengajar/components/kelola-absensi/SuratDetailModal';
import JurnalModal from '../mengajar/components/kelola-absensi/JurnalModal';
import DetailAbsensiModal from '../mengajar/components/kelola-absensi/DetailAbsensiModal';
import EditAbsensiModal from '../mengajar/components/kelola-absensi/EditAbsensiModal';
import { useKelolaAbsensiHandlers } from '../mengajar/components/kelola-absensi/useKelolaAbsensiHandlers';
import { getActiveIzinForSubstitute, getGroupedSchedulesByDate, getGuruNameById } from './utils/penggantiUtils';
import { getTodayIndonesia } from '../../../../utils/absensiUtils';
import { isTimeOverlapping } from '../../../../utils/izinDispenMuridUtils';

const PenggantiAbsensi: React.FC = () => {
  const { user } = useAuth();
  const { izinGuru } = useIzinGuru();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { activeTahunAjaran } = useTahunAjaran();
  const { gurus } = useGurus();
  const { murid: allMurid } = useMurid();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { suratIzin } = useSuratIzin();
  const { sesiAbsensi, refreshSesiAbsensi, createSesiAbsensi: createSesiAbsensiAPI, updateSesiAbsensi: updateSesiAbsensiAPI, addAbsensiToSesi: addAbsensiToSesiAPI, bulkAddAbsensiToSesi: bulkAddAbsensiToSesiAPI } = useSesiAbsensi();
  const { absensi, refreshAbsensi, createAbsensi: createAbsensiAPI, updateAbsensi: updateAbsensiAPI } = useAbsensi();
  const { absensiGuru, refreshAbsensiGuru, createAbsensiGuru: createAbsensiGuruAPI, updateAbsensiGuru: updateAbsensiGuruAPI } = useAbsensiGuru();
  const { riwayatKelasMurid, refreshRiwayatKelasMurid, bulkCreateRiwayatKelasMurid } = useRiwayatKelasMurid();

  // For compatibility with utility functions that expect users array (gurus + murid)
  const users = [...gurus, ...allMurid];

  const activeIzin = getActiveIzinForSubstitute(user?.id || '', izinGuru);
  const groupedSchedules = getGroupedSchedulesByDate(user?.id || '', activeIzin, jadwalPelajaran, activeTahunAjaran);

  const today = getTodayIndonesia();
  const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).toLowerCase();

  const todaySchedules = activeIzin && groupedSchedules.get(today) ? groupedSchedules.get(today) || [] : [];

  const todaySessions = sesiAbsensi.filter(s =>
    s.tanggal === today &&
    todaySchedules.some(j => j.id === s.jadwalId)
  );

  const getJadwalInfo = (jadwalId: string) => {
    const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
    if (!jadwal) return { kelas: 'Unknown', mapel: 'Unknown' };

    const kelasName = kelas.find(k => k.id === jadwal.kelasId)?.name || 'Unknown';
    const mapelName = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId)?.name || 'Unknown';

    return { kelas: kelasName, mapel: mapelName };
  };

  const getMuridsByKelas = (kelasId: string) => {
    return users.filter(u => u.role === 'murid' && u.kelasId === kelasId && u.isActive !== false);
  };

  const getAttendanceStatus = (muridId: string, sesiId: string) => {
    const sesi = sesiAbsensi.find(s => s.id === sesiId);
    if (!sesi || !sesi.dataAbsensi) return undefined;
    return sesi.dataAbsensi.find(a => a.muridId === muridId);
  };

  const getSuratIzinForMurid = (muridId: string, jadwalId?: string) => {
    const today = getTodayIndonesia();
    
    // Cari semua surat izin yang diterima untuk murid ini hari ini
    const suratIzinHariIni = suratIzin.filter(s =>
      s.muridId === muridId &&
      s.status === 'diterima' &&
      s.tanggalMulai <= today &&
      s.tanggalSelesai >= today
    );

    // Jika ada jadwalId, prioritaskan izin dispen yang overlap dengan jadwal ini
    if (jadwalId) {
      const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
      if (jadwal) {
        // Cek izin dispen yang overlap dengan jadwal ini (prioritas tertinggi)
        const izinDispen = suratIzinHariIni.find(s =>
          s.jenis === 'izin_dispen' &&
          s.jamMulai &&
          s.jamSelesai &&
          isTimeOverlapping(s.jamMulai, s.jamSelesai, jadwal.jamMulai, jadwal.jamSelesai)
        );
        
        if (izinDispen) {
          return izinDispen;
        }
        
        // Jika tidak ada izin dispen yang overlap, return surat izin/sakit biasa
        return suratIzinHariIni.find(s => s.jenis !== 'izin_dispen');
      }
    }

    // Jika tidak ada jadwalId, return surat izin/sakit biasa (bukan izin dispen)
    // karena izin dispen hanya berlaku untuk jadwal spesifik
    return suratIzinHariIni.find(s => s.jenis !== 'izin_dispen');
  };

  const hasPhotoForJadwal = (jadwalId: string) => {
    const todayAbsensi = absensiGuru.find(a => a.guruId === user?.id && a.tanggal === today);
    return todayAbsensi?.fotoMengajar?.some(f => f.jadwalId === jadwalId) || false;
  };

  const isJadwalFinished = (jadwal: JadwalPelajaran) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= jadwal.jamSelesai;
  };

  const handlers = useKelolaAbsensiHandlers(
    { ...user, id: user?.id || '' },
    todaySchedules,
    sesiAbsensi,
    refreshSesiAbsensi,
    createSesiAbsensiAPI,
    updateSesiAbsensiAPI,
    addAbsensiToSesiAPI,
    bulkAddAbsensiToSesiAPI,
    absensi,
    refreshAbsensi,
    createAbsensiAPI,
    updateAbsensiAPI,
    absensiGuru,
    refreshAbsensiGuru,
    createAbsensiGuruAPI,
    updateAbsensiGuruAPI,
    jadwalPelajaran,
    users,
    kelas,
    mataPelajaran,
    getJadwalInfo,
    getMuridsByKelas,
    activeTahunAjaran ? [activeTahunAjaran] : [],
    riwayatKelasMurid,
    refreshRiwayatKelasMurid,
    bulkCreateRiwayatKelasMurid,
    getSuratIzinForMurid
  );

  useEffect(() => {
    if (handlers.scrollContainerRef.current) {
      handlers.scrollContainerRef.current.scrollTop = 0;
    }
  }, [handlers.refreshKey]);

  useEffect(() => {
    const checkAndCloseSessions = async () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      const sessionsToClose = sesiAbsensi.filter(sesi => {
        if (sesi.status !== 'dibuka' || sesi.tanggal !== today) return false;

        const jadwal = todaySchedules.find(j => j.id === sesi.jadwalId);
        if (!jadwal) return false;

        return currentTime >= jadwal.jamSelesai;
      });

      if (sessionsToClose.length > 0) {
        // Update each session via API
        for (const sesi of sessionsToClose) {
          try {
            await updateSesiAbsensiAPI(sesi.id, {
              status: 'ditutup',
              jamTutup: currentTime
            });
          } catch (error) {
            console.error('Error closing session:', error);
          }
        }
        // Refresh sesi absensi after updates
        await refreshSesiAbsensi();
      }
    };

    checkAndCloseSessions();

    const interval = setInterval(checkAndCloseSessions, 60000);

    return () => clearInterval(interval);
  }, [sesiAbsensi, todaySchedules, today, updateSesiAbsensiAPI, refreshSesiAbsensi]);

  if (!activeIzin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="text-center py-8 px-6 max-w-md">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Penggantian Aktif</h3>
            <p className="text-gray-600">Anda tidak sedang menjadi guru pengganti untuk periode izin apapun saat ini.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Pengganti</h2>
          <p className="text-gray-600">
            Menggantikan {getGuruNameById(activeIzin.guruId, gurus)} (Mulai: {new Date(activeIzin.tanggalMulai).toLocaleDateString('id-ID')})
          </p>
        </div>
        <Badge variant="success">
          Pengganti Aktif
        </Badge>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Jadwal Hari Ini</h3>
        {todaySchedules.length > 0 ? (
          <div className="space-y-4">
            {todaySchedules.map((jadwal) => {
              const session = todaySessions.find(s => s.jadwalId === jadwal.id);
              const { kelas: kelasName, mapel: mapelName } = getJadwalInfo(jadwal.id);
              const kelasObj = kelas.find(k => k.name === kelasName);
              const muridCount = kelasObj ? getMuridsByKelas(kelasObj.id).length : 0;
              const attendanceCount = session?.dataAbsensi?.length || 0;

              const now = new Date();
              const currentTime = now.toTimeString().slice(0, 5);
              const canOpenSession = currentTime < jadwal.jamSelesai;
              const isSessionExpired = currentTime >= jadwal.jamSelesai;
              const isFinished = isJadwalFinished(jadwal);
              const hasPhoto = hasPhotoForJadwal(jadwal.id);

              return (
                <JadwalCard
                  key={jadwal.id}
                  jadwal={jadwal}
                  session={session}
                  kelasName={kelasName}
                  mapelName={mapelName}
                  muridCount={muridCount}
                  attendanceCount={attendanceCount}
                  canOpenSession={canOpenSession}
                  isSessionExpired={isSessionExpired}
                  isFinished={isFinished}
                  hasPhoto={hasPhoto}
                  onOpenSession={handlers.openSession}
                  onManualAttendance={handlers.handleManualAttendance}
                  onCloseSession={handlers.closeSession}
                  onOpenDetailAbsensi={handlers.handleOpenDetailAbsensi}
                  onTakePhoto={handlers.handleTakePhoto}
                  onOpenJurnalModal={handlers.handleOpenJurnalModal}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Tidak ada jadwal mengajar hari ini</p>
            <p className="text-xs mt-1 text-gray-400">
              Hari: {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
            </p>
          </div>
        )}
      </Card>

      <AbsensiManualModal
        isOpen={handlers.isModalOpen}
        onClose={() => handlers.setIsModalOpen(false)}
        selectedSesi={handlers.selectedSesi}
        getJadwalInfo={getJadwalInfo}
        onScanQR={() => handlers.setIsQRScannerOpen(true)}
        onShowSubjectQR={handlers.handleShowSubjectQR}
        jadwalPelajaran={jadwalPelajaran}
        getMuridsByKelas={getMuridsByKelas}
        getAttendanceStatus={getAttendanceStatus}
        getSuratIzinForMurid={getSuratIzinForMurid}
        handleViewSuratDetail={handlers.handleViewSuratDetail}
        handleMarkWithSurat={handlers.handleMarkWithSurat}
        markAttendance={handlers.markAttendance}
        sendWhatsAppNotification={handlers.sendWhatsAppNotification}
        openInputKeteranganModal={(murid) => handlers.openInputKeteranganModal(murid, getAttendanceStatus)}
        refreshKey={handlers.refreshKey}
        scrollContainerRef={handlers.scrollContainerRef}
        mataPelajaran={mataPelajaran}
        markAllPresent={handlers.markAllPresent}
        loadingMuridIds={handlers.loadingMuridIds}
        isBulkLoading={handlers.isBulkLoading}
      />

      <SubjectQRModal
        isOpen={handlers.isSubjectQRModalOpen}
        onClose={() => {
          handlers.setIsSubjectQRModalOpen(false);
          handlers.setSubjectQRCodeURL('');
          handlers.setSelectedSesiForQR(null);
        }}
        selectedSesiForQR={handlers.selectedSesiForQR}
        subjectQRCodeURL={handlers.subjectQRCodeURL}
        getJadwalInfo={getJadwalInfo}
      />

      <KeteranganModal
        isOpen={handlers.isKeteranganModalOpen}
        onClose={() => {
          handlers.setIsKeteranganModalOpen(false);
          handlers.setKeteranganInput('');
        }}
        selectedMurid={handlers.selectedMuridForKeterangan}
        keteranganInput={handlers.keteranganInput}
        setKeteranganInput={handlers.setKeteranganInput}
        onSave={() => handlers.handleSaveKeteranganInput(getAttendanceStatus)}
      />

      <SuratDetailModal
        isOpen={handlers.isDetailSuratModalOpen}
        onClose={() => {
          handlers.setIsDetailSuratModalOpen(false);
          handlers.setSelectedSuratDetail(null);
        }}
        selectedSurat={handlers.selectedSuratDetail}
        users={users}
        kelas={kelas}
      />

      <JurnalModal
        isOpen={handlers.isJurnalModalOpen}
        onClose={() => {
          handlers.setIsJurnalModalOpen(false);
          handlers.setJurnalJudul('');
          handlers.setJurnalDeskripsi('');
          handlers.setJurnalFile(null);
        }}
        selectedSesi={handlers.selectedSesiForJurnal}
        jurnalJudul={handlers.jurnalJudul}
        setJurnalJudul={handlers.setJurnalJudul}
        jurnalDeskripsi={handlers.jurnalDeskripsi}
        setJurnalDeskripsi={handlers.setJurnalDeskripsi}
        jurnalFile={handlers.jurnalFile}
        setJurnalFile={handlers.setJurnalFile}
        onSave={handlers.handleSaveJurnal}
        getJadwalInfo={getJadwalInfo}
        existingFile={handlers.existingJurnalFile}
        onRemoveExistingFile={handlers.handleRemoveExistingFile}
      />

      <DetailAbsensiModal
        isOpen={handlers.isDetailAbsensiModalOpen}
        onClose={() => {
          handlers.setIsDetailAbsensiModalOpen(false);
          handlers.setSelectedSesiForDetail(null);
          handlers.setEditingAbsensi(null);
        }}
        selectedSesi={handlers.selectedSesiForDetail}
        getJadwalInfo={getJadwalInfo}
        absensiGuru={absensiGuru}
        userId={user?.id}
        jadwalPelajaran={jadwalPelajaran}
        getMuridsByKelas={getMuridsByKelas}
        getAttendanceStatus={getAttendanceStatus}
        onEditAbsensi={handlers.handleEditAbsensi}
        users={users}
      />

      <EditAbsensiModal
        isOpen={!!handlers.editingAbsensi}
        onClose={() => {
          handlers.setEditingAbsensi(null);
          handlers.setEditStatus('hadir');
          handlers.setEditKeterangan('');
        }}
        editingAbsensi={handlers.editingAbsensi}
        editStatus={handlers.editStatus}
        setEditStatus={handlers.setEditStatus}
        editKeterangan={handlers.editKeterangan}
        setEditKeterangan={handlers.setEditKeterangan}
        onSave={handlers.handleSaveEditAbsensi}
        users={users}
      />

      <QRScanner
        isOpen={handlers.isQRScannerOpen}
        onScan={handlers.handleQRScan}
        onClose={() => handlers.setIsQRScannerOpen(false)}
      />

      <CameraCapture
        isOpen={handlers.isCameraOpen}
        onClose={() => {
          handlers.setIsCameraOpen(false);
          handlers.setSelectedJadwalForPhoto(null);
        }}
        onCapture={handlers.handlePhotoCapture}
        title={handlers.selectedJadwalForPhoto ? `Foto Bukti Mengajar - ${getJadwalInfo(handlers.selectedJadwalForPhoto.id).mapel}` : 'Ambil Foto'}
      />
    </div>
  );
};

export default PenggantiAbsensi;
