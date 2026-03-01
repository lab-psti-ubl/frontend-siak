import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, Calendar, Users, ClipboardList } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import QRScanner from '../../../ui/QRScanner';
import CameraCapture from '../../../ui/CameraCapture';
import { useAuth } from '../../../../context/AuthContext';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useSuratIzin } from '../../../../hooks/useSuratIzin';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useAbsensiGuru } from '../../../../hooks/useAbsensiGuru';
import { useRiwayatKelasMurid } from '../../../../hooks/useRiwayatKelasMurid';
import { getMuridByKelasAndTahunAjaran } from '../../../../utils/riwayatKelasMuridUtils';
import { JadwalPelajaran, SesiAbsensi, Absensi, User, Kelas, MataPelajaran, SuratIzin, TahunAjaran, AbsensiGuru, RiwayatKelasMurid } from '../../../../types';
import JadwalCard from './components/kelola-absensi/JadwalCard';
import AbsensiManualModal from './components/kelola-absensi/AbsensiManualModal';
import SubjectQRModal from './components/kelola-absensi/SubjectQRModal';
import KeteranganModal from './components/kelola-absensi/KeteranganModal';
import SuratDetailModal from './components/kelola-absensi/SuratDetailModal';
import JurnalModal from './components/kelola-absensi/JurnalModal';
import DetailAbsensiModal from './components/kelola-absensi/DetailAbsensiModal';
import EditAbsensiModal from './components/kelola-absensi/EditAbsensiModal';
import { useKelolaAbsensiHandlers } from './components/kelola-absensi/useKelolaAbsensiHandlers';
import { isTimeOverlapping } from '../../../../utils/izinDispenMuridUtils';
import { apiService } from '../../../../services/apiService';
import { getLocalTimeISOString } from '../../../../utils/absensiUtils';
import { AbsensiPelajaran } from '../../../../types';

const KelolaAbsensi: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const jadwalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { sesiAbsensi, refreshSesiAbsensi, createSesiAbsensi: createSesiAbsensiAPI, updateSesiAbsensi: updateSesiAbsensiAPI, addAbsensiToSesi: addAbsensiToSesiAPI, bulkAddAbsensiToSesi: bulkAddAbsensiToSesiAPI } = useSesiAbsensi();
  const { absensi, refreshAbsensi, createAbsensi: createAbsensiAPI, updateAbsensi: updateAbsensiAPI } = useAbsensi();
  const { gurus } = useGurus();
  const { murid: allMurid } = useMurid();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { suratIzin } = useSuratIzin();
  const { tahunAjaran } = useTahunAjaran();
  const { absensiGuru, refreshAbsensiGuru, createAbsensiGuru: createAbsensiGuruAPI, updateAbsensiGuru: updateAbsensiGuruAPI } = useAbsensiGuru();
  const { riwayatKelasMurid, refreshRiwayatKelasMurid, bulkCreateRiwayatKelasMurid } = useRiwayatKelasMurid();
  
  // For compatibility with utility functions that expect users array (gurus + murid)
  const users = [...gurus, ...allMurid];

  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);

  const today = new Date().toISOString().split('T')[0];
  const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();

  const mySchedules = jadwalPelajaran.filter(j =>
    j.guruId === user?.id &&
    j.tahunAjaran === activeTahunAjaran?.tahun &&
    j.semester === activeTahunAjaran?.semester
  );
  const todaySchedules = mySchedules.filter(j => j.hari === currentDay);

  const todaySessions = sesiAbsensi.filter(s =>
    s.tanggal === today &&
    mySchedules.some(j => j.id === s.jadwalId)
  );

  const getJadwalInfo = (jadwalId: string) => {
    const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
    if (!jadwal) return { kelas: 'Unknown', mapel: 'Unknown' };

    const kelasName = kelas.find(k => k.id === jadwal.kelasId)?.name || 'Unknown';
    const mapelName = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId)?.name || 'Unknown';

    return { kelas: kelasName, mapel: mapelName };
  };

  const getMuridsByKelas = (kelasId: string) => {
    if (!activeTahunAjaran) {
      // Fallback: jika tidak ada tahun ajaran aktif, gunakan kelasId langsung
      return allMurid.filter(u => u.kelasId === kelasId && u.isActive !== false);
    }
    
    // Gunakan riwayatKelasMurid untuk mendapatkan murid yang benar berdasarkan tahun ajaran
    return getMuridByKelasAndTahunAjaran(
      kelasId,
      activeTahunAjaran.id,
      allMurid,
      riwayatKelasMurid
    ).filter(u => u.isActive !== false);
  };

  const getAttendanceStatus = (muridId: string, sesiId: string) => {
    const sesi = sesiAbsensi.find(s => s.id === sesiId);
    if (!sesi || !sesi.dataAbsensi) return undefined;
    return sesi.dataAbsensi.find(a => a.muridId === muridId);
  };

  const getSuratIzinForMurid = (muridId: string, jadwalId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    
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
    user,
    mySchedules,
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
    tahunAjaran,
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

  // Scroll to specific jadwal when navigating from JadwalGuru
  useEffect(() => {
    const scrollToJadwalId = (location.state as any)?.scrollToJadwalId;
    if (scrollToJadwalId) {
      // Wait for DOM to render and schedules to be loaded
      const scrollToElement = () => {
        const jadwalElement = jadwalRefs.current[scrollToJadwalId];
        if (jadwalElement) {
          // Scroll to element with smooth behavior
          jadwalElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // Highlight the card briefly with animation
          jadwalElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'transition-all', 'duration-300');
          setTimeout(() => {
            jadwalElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
          
          return true;
        }
        return false;
      };

      // Try immediately, then retry with delays if element not found
      let timeout1: NodeJS.Timeout;
      let timeout2: NodeJS.Timeout;
      
      if (!scrollToElement()) {
        timeout1 = setTimeout(() => {
          if (!scrollToElement()) {
            timeout2 = setTimeout(() => {
              scrollToElement();
            }, 500);
          }
        }, 100);
      }
      
      return () => {
        if (timeout1) clearTimeout(timeout1);
        if (timeout2) clearTimeout(timeout2);
      };
    }
  }, [location.state, todaySchedules]);

  useEffect(() => {
    const checkAndCloseSessions = async () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      const sessionsToClose = sesiAbsensi.filter(sesi => {
        if (sesi.status !== 'dibuka' || sesi.tanggal !== today) return false;

        const jadwal = mySchedules.find(j => j.id === sesi.jadwalId);
        if (!jadwal) return false;

        return currentTime >= jadwal.jamSelesai;
      });

      if (sessionsToClose.length > 0) {
        // Update sessions via API and mark unmarked students as alfa
        for (const sesi of sessionsToClose) {
          try {
            // Get the jadwal for this session
            const jadwal = mySchedules.find(j => j.id === sesi.jadwalId);
            if (!jadwal) continue;

            // Get all students in the class
            const muridList = getMuridsByKelas(jadwal.kelasId);
            
            // Check existing absensi for this session
            const existingAbsensiMap = new Map(
              (sesi.dataAbsensi || []).map(a => [a.muridId, a])
            );

            // Find students who don't have absensi
            const newAbsensiRecords: Partial<AbsensiPelajaran>[] = [];
            muridList.forEach(murid => {
              if (!existingAbsensiMap.has(murid.id)) {
                const alfaAbsensi: Partial<AbsensiPelajaran> = {
                  id: `absensi-alfa-auto-${murid.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  muridId: murid.id,
                  status: 'alfa',
                  waktu: getLocalTimeISOString(),
                  keterangan: 'Absen otomatis alfa - sesi ditutup karena waktu pelajaran berakhir',
                  method: 'manual',
                };
                newAbsensiRecords.push(alfaAbsensi);
              }
            });

            // Update session status via API
            await updateSesiAbsensiAPI(sesi.id, {
              status: 'ditutup',
              jamTutup: currentTime
            });

            // Bulk add alfa absensi if any
            if (newAbsensiRecords.length > 0) {
              await apiService.bulkAddAbsensiToSesi(sesi.id, newAbsensiRecords);
              console.log(`Session ${sesi.id} closed: ${newAbsensiRecords.length} students marked as alfa`);
            }
          } catch (error) {
            console.error('Error closing session:', error);
          }
        }
        // Refresh after all updates
        try {
          await refreshSesiAbsensi();
        } catch (error) {
          console.error('Error refreshing sesi absensi:', error);
        }
      }

      const missedSessions = mySchedules.filter(jadwal => {
        if (jadwal.hari !== currentDay) return false;

        const sessionExists = sesiAbsensi.find(s =>
          s.jadwalId === jadwal.id && s.tanggal === today
        );

        if (sessionExists) return false;

        return currentTime >= jadwal.jamSelesai;
      });

      if (missedSessions.length > 0) {
        // Check if absensi guru already exists for today
        const todayAbsensiGuru = absensiGuru.find((a: any) =>
          a.guruId === user?.id && a.tanggal === today
        );

        if (!todayAbsensiGuru) {
          // Get active tahun ajaran
          const activeTA = tahunAjaran.find(ta => ta.isActive);
          if (activeTA) {
            try {
              const newAbsensi: Partial<AbsensiGuru> = {
                id: `absensi-guru-missed-${Date.now()}`,
                guruId: user?.id || '',
                tanggal: today,
                statusMasuk: 'tidak_masuk',
                statusKeluar: 'tidak_keluar',
                keterangan: `Tidak mengajar ${missedSessions.length} mata pelajaran: ${missedSessions.map(j => {
                  const mapel = mataPelajaran.find(m => m.id === j.mataPelajaranId);
                  return mapel?.name || 'Unknown';
                }).join(', ')}`,
                tahunAjaranId: activeTA.id,
                semester: activeTA.semester,
                createdAt: new Date().toISOString(),
              };

              await createAbsensiGuruAPI(newAbsensi);
              await refreshAbsensiGuru();
            } catch (error) {
              console.error('Error creating missed absensi guru:', error);
            }
          }
        }
      }
    };

    checkAndCloseSessions();

    const interval = setInterval(checkAndCloseSessions, 60000);

    return () => clearInterval(interval);
  }, [sesiAbsensi, mySchedules, today, currentDay, user?.id, refreshSesiAbsensi, refreshAbsensiGuru, createAbsensiGuruAPI, absensiGuru, mataPelajaran, tahunAjaran, getMuridsByKelas, updateSesiAbsensiAPI, allMurid, riwayatKelasMurid]);

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Kelola Absensi
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Buka sesi absensi dan catat kehadiran murid Anda
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 w-fit">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="text-xs sm:text-sm text-white font-medium">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Jadwal Hari Ini</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">{todaySchedules.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Sesi Aktif</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">{todaySessions.filter(s => s.status === 'dibuka').length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-orange-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Sesi Ditutup</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">{todaySessions.filter(s => s.status === 'ditutup').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Jadwal Mengajar</h3>
              <p className="text-xs sm:text-sm text-blue-100">Kelola sesi absensi murid</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6">
          {todaySchedules.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
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
                  <div
                    key={jadwal.id}
                    ref={(el) => {
                      jadwalRefs.current[jadwal.id] = el;
                    }}
                  >
                    <JadwalCard
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
                      absensiGuru={absensiGuru}
                      userId={user?.id}
                      today={today}
                      onOpenSession={handlers.openSession}
                      onManualAttendance={handlers.handleManualAttendance}
                      onCloseSession={handlers.closeSession}
                      onOpenDetailAbsensi={handlers.handleOpenDetailAbsensi}
                      onTakePhoto={handlers.handleTakePhoto}
                      onOpenJurnalModal={handlers.handleOpenJurnalModal}
                      refreshAbsensiGuru={refreshAbsensiGuru}
                      getJadwalInfo={getJadwalInfo}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-500">Tidak ada jadwal mengajar hari ini</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2">
                Hari: {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
              </p>
            </div>
          )}
        </div>
      </div>

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
          if (!handlers.loadingMuridIds.has(handlers.selectedMuridForKeterangan?.id || '')) {
            handlers.setIsKeteranganModalOpen(false);
            handlers.setKeteranganInput('');
          }
        }}
        selectedMurid={handlers.selectedMuridForKeterangan}
        keteranganInput={handlers.keteranganInput}
        setKeteranganInput={handlers.setKeteranganInput}
        onSave={() => handlers.handleSaveKeteranganInput(getAttendanceStatus)}
        isSaving={handlers.selectedMuridForKeterangan ? handlers.loadingMuridIds.has(handlers.selectedMuridForKeterangan.id) : false}
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
        refreshAbsensiGuru={refreshAbsensiGuru}
        loadingMuridIds={handlers.loadingMuridIds}
      />

      <EditAbsensiModal
        isOpen={!!handlers.editingAbsensi}
        onClose={() => {
          if (!handlers.isEditingAbsensi) {
            handlers.setEditingAbsensi(null);
            handlers.setEditStatus('hadir');
            handlers.setEditKeterangan('');
          }
        }}
        editingAbsensi={handlers.editingAbsensi}
        editStatus={handlers.editStatus}
        setEditStatus={handlers.setEditStatus}
        editKeterangan={handlers.editKeterangan}
        setEditKeterangan={handlers.setEditKeterangan}
        onSave={handlers.handleSaveEditAbsensi}
        users={users}
        isSaving={handlers.isEditingAbsensi}
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

export default KelolaAbsensi;
