import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, Calendar, Users, ClipboardList } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useJadwalTahfiz } from '../../../../hooks/useJadwalTahfiz';
import { useSesiAbsensiTahfiz } from '../../../../hooks/useSesiAbsensiTahfiz';
import { useSantri } from '../../../../hooks/useSantri';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useSuratIzin } from '../../../../hooks/useSuratIzin';
import { useJurnalTahfiz } from '../../../../hooks/useJurnalTahfiz';
import { TahfizSchedule, SesiAbsensiTahfiz, User, SuratIzin } from '../../../../types';
import JadwalCard from '../mengajar/components/kelola-absensi/JadwalCard';
import AbsensiManualModal from '../mengajar/components/kelola-absensi/AbsensiManualModal';
import SubjectQRModal from '../mengajar/components/kelola-absensi/SubjectQRModal';
import KeteranganModal from '../mengajar/components/kelola-absensi/KeteranganModal';
import SuratDetailModal from '../mengajar/components/kelola-absensi/SuratDetailModal';
import JurnalModal from '../mengajar/components/kelola-absensi/JurnalModal';
import DetailAbsensiModal from '../mengajar/components/kelola-absensi/DetailAbsensiModal';
import EditAbsensiModal from '../mengajar/components/kelola-absensi/EditAbsensiModal';
import { useAbsensiTahfizHandlers } from './useAbsensiTahfizHandlers';
import { getTodayIndonesia } from '../../../../utils/absensiUtils';
import { getDateLocale } from '../../../../utils/dateLocaleUtils';
import { isTimeOverlapping } from '../../../../utils/izinDispenMuridUtils';
import QRScanner from '../../../ui/QRScanner';
import CameraCapture from '../../../ui/CameraCapture';

const AbsensiTahfiz: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const jadwalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const { jadwalTahfiz } = useJadwalTahfiz();
  const { 
    sesiAbsensiTahfiz, 
    refreshSesiAbsensiTahfiz, 
    createSesiAbsensiTahfiz: createSesiAbsensiTahfizAPI, 
    updateSesiAbsensiTahfiz: updateSesiAbsensiTahfizAPI,
    addAbsensiToSesiTahfiz: addAbsensiToSesiTahfizAPI,
    bulkAddAbsensiToSesiTahfiz: bulkAddAbsensiToSesiTahfizAPI,
    isSyncingWithWorker,
    syncMessage,
  } = useSesiAbsensiTahfiz();
  const { santri: allSantri } = useSantri();
  const { kelasTahfiz } = useKelasTahfiz();
  const { suratIzin } = useSuratIzin();
  const { jurnalTahfiz: allJurnalTahfiz, refreshJurnalTahfiz } = useJurnalTahfiz({ tahun: new Date().getFullYear().toString() });

  const today = getTodayIndonesia();
  const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).toLowerCase();
  const currentYear = new Date().getFullYear().toString();

  // Filter jadwal tahfiz for logged-in ustadz
  const mySchedules = jadwalTahfiz.filter(j => {
    const kelas = kelasTahfiz.find(k => k.id === j.kelasId);
    return kelas && kelas.ustadzId === user?.id;
  });
  const todaySchedules = mySchedules.filter(j => j.hari === currentDay);

  const todaySessions = sesiAbsensiTahfiz.filter(s =>
    s.tanggal === today &&
    mySchedules.some(j => j.id === s.jadwalId)
  );

  const getJadwalInfo = (jadwalId: string) => {
    const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
    if (!jadwal) return { kelas: 'Unknown', mapel: 'Tahfiz Qur\'an' };

    const kelas = kelasTahfiz.find(k => k.id === jadwal.kelasId);
    const kelasName = kelas?.namaKelas || 'Unknown';

    return { kelas: kelasName, mapel: 'Tahfiz Qur\'an' };
  };

  const getSantriByKelas = (kelasId: string) => {
    const kelas = kelasTahfiz.find(k => k.id === kelasId);
    if (!kelas) return [];
    
    return kelas.santriIds
      .map(santriId => allSantri.find(s => s.id === santriId))
      .filter(Boolean) as User[];
  };

  const getAttendanceStatus = (santriId: string, sesiId: string) => {
    const sesi = sesiAbsensiTahfiz.find(s => s.id === sesiId);
    if (!sesi || !sesi.dataAbsensi) return undefined;
    return sesi.dataAbsensi.find(a => a.muridId === santriId);
  };

  const getSuratIzinForSantri = (santriId: string, jadwalId?: string) => {
    const today = getTodayIndonesia();
    
    // Cari semua surat izin yang diterima untuk santri ini hari ini
    const suratIzinHariIni = suratIzin.filter(s =>
      s.muridId === santriId &&
      s.status === 'diterima' &&
      s.tanggalMulai <= today &&
      s.tanggalSelesai >= today
    );

    // Jika ada jadwalId, prioritaskan izin dispen yang overlap dengan jadwal ini
    if (jadwalId) {
      const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
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
    return suratIzinHariIni.find(s => s.jenis !== 'izin_dispen');
  };

  const isJadwalFinished = (jadwal: TahfizSchedule) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= jadwal.jamSelesai;
  };

  const hasPhotoForJadwal = (jadwalId: string) => {
    // Check session.fotoMengajar (old way)
    const session = todaySessions.find(s => s.jadwalId === jadwalId);
    if (session?.fotoMengajar && session.fotoMengajar.length > 0) {
      return true;
    }

    // Check jurnalTahfiz.pertemuan[].fotoMengajar (new way)
    if (allJurnalTahfiz && allJurnalTahfiz.length > 0) {
      const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
      if (jadwal) {
        const jurnalDoc = allJurnalTahfiz.find(j => 
          j.jadwalId === jadwalId && 
          j.kelasId === jadwal.kelasId
        );
        
        if (jurnalDoc) {
          // Check new structure (pertemuan array)
          if (jurnalDoc.pertemuan && Array.isArray(jurnalDoc.pertemuan)) {
            const pertemuan = jurnalDoc.pertemuan.find((p: any) => p.tanggal === today);
            if (pertemuan && pertemuan.fotoMengajar) {
              return true;
            }
          }
          
          // Check old structure (backward compatibility)
          if (jurnalDoc.tanggal === today && jurnalDoc.fotoMengajar) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const handlers = useAbsensiTahfizHandlers(
    user,
    mySchedules,
    sesiAbsensiTahfiz,
    refreshSesiAbsensiTahfiz,
    createSesiAbsensiTahfizAPI,
    updateSesiAbsensiTahfizAPI,
    addAbsensiToSesiTahfizAPI,
    bulkAddAbsensiToSesiTahfizAPI,
    jadwalTahfiz,
    allSantri,
    kelasTahfiz,
    getJadwalInfo,
    getSantriByKelas,
    currentYear,
    getSuratIzinForSantri,
    t
  );

  useEffect(() => {
    if (handlers.scrollContainerRef.current) {
      handlers.scrollContainerRef.current.scrollTop = 0;
    }
  }, [handlers.refreshKey]);

  // Listen for jurnal-saved event to refresh jurnalTahfiz cache
  useEffect(() => {
    const handleJurnalSaved = () => {
      refreshJurnalTahfiz();
    };
    
    window.addEventListener('jurnal-saved', handleJurnalSaved);
    return () => {
      window.removeEventListener('jurnal-saved', handleJurnalSaved);
    };
  }, [refreshJurnalTahfiz]);

  // Scroll to specific jadwal when navigating from JadwalTahfizGuru
  useEffect(() => {
    const scrollToJadwalId = (location.state as any)?.scrollToJadwalId;
    if (scrollToJadwalId) {
      const scrollToElement = () => {
        const jadwalElement = jadwalRefs.current[scrollToJadwalId];
        if (jadwalElement) {
          jadwalElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          jadwalElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'transition-all', 'duration-300');
          setTimeout(() => {
            jadwalElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
          
          return true;
        }
        return false;
      };

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

      const sessionsToClose = sesiAbsensiTahfiz.filter(sesi => {
        if (sesi.status !== 'dibuka' || sesi.tanggal !== today) return false;

        const jadwal = mySchedules.find(j => j.id === sesi.jadwalId);
        if (!jadwal) return false;

        return currentTime >= jadwal.jamSelesai;
      });

      if (sessionsToClose.length > 0) {
        for (const sesi of sessionsToClose) {
          try {
            // Gunakan closeSession agar santri yang belum absen otomatis ditandai alfa
            await handlers.closeSession(sesi.id);
          } catch (error) {
            console.error('Error closing session:', error);
          }
        }
      }
    };

    checkAndCloseSessions();
    const interval = setInterval(checkAndCloseSessions, 60000);
    return () => clearInterval(interval);
  }, [sesiAbsensiTahfiz, mySchedules, today, refreshSesiAbsensiTahfiz, updateSesiAbsensiTahfizAPI]);

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Global Loading Indicator for Worker Sync */}
      {(isSyncingWithWorker || handlers.isBulkLoading) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-down">
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm font-medium flex-1">
              {syncMessage || (handlers.isBulkLoading ? 'Menyimpan absensi tahfiz...' : 'Memproses absensi tahfiz...')}
            </p>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('sidebar.absensiTahfiz')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {t('tahfiz.guruTahfiz.absensiTahfiz.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 w-fit">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="text-xs sm:text-sm text-white font-medium">
                {new Date().toLocaleDateString(getDateLocale(language), {
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
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">{t('tahfiz.guruTahfiz.absensiTahfiz.jadwalHariIni')}</p>
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
                <p className="text-xs sm:text-sm text-slate-600 mb-1">{t('tahfiz.guruTahfiz.absensiTahfiz.sesiAktif')}</p>
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
                <p className="text-xs sm:text-sm text-slate-600 mb-1">{t('tahfiz.guruTahfiz.absensiTahfiz.sesiDitutup')}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">{todaySessions.filter(s => s.status === 'ditutup').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">{t('tahfiz.guruTahfiz.absensiTahfiz.jadwalTahfiz')}</h3>
              <p className="text-xs sm:text-sm text-emerald-100">{t('tahfiz.guruTahfiz.absensiTahfiz.kelolaSesiAbsensi')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6">
          {todaySchedules.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {todaySchedules.map((jadwal) => {
                const session = todaySessions.find(s => s.jadwalId === jadwal.id);
                const { kelas: kelasName, mapel: mapelName } = getJadwalInfo(jadwal.id);
                const kelasObj = kelasTahfiz.find(k => k.namaKelas === kelasName);
                const santriCount = kelasObj ? getSantriByKelas(kelasObj.id).length : 0;
                const attendanceCount = session?.dataAbsensi?.length || 0;

                const now = new Date();
                const currentTime = now.toTimeString().slice(0, 5);
                const canOpenSession = currentTime < jadwal.jamSelesai;
                const isSessionExpired = currentTime >= jadwal.jamSelesai;
                const isFinished = isJadwalFinished(jadwal);
                const hasPhoto = hasPhotoForJadwal(jadwal.id);

                // Convert TahfizSchedule to JadwalPelajaran format for JadwalCard compatibility
                const jadwalForCard = {
                  ...jadwal,
                  guruId: user?.id || '',
                  mataPelajaranId: 'tahfiz',
                  kelasId: jadwal.kelasId,
                  tahunAjaran: currentYear,
                  semester: 1, // Not used for tahfiz
                } as any;

                // Create absensiGuru-like structure for JadwalCard compatibility
                // This wrapper allows JadwalCard to work with Tahfiz data
                const absensiGuruForCard = session?.fotoMengajar ? [{
                  id: `absensi-guru-tahfiz-${session.id}`,
                  guruId: user?.id || '',
                  tanggal: today,
                  fotoMengajar: session.fotoMengajar,
                  sesiId: session.id, // Store session ID for deletion
                }] : [];

                // Custom refresh handler that handles photo deletion from SesiAbsensiTahfiz
                // JadwalCard will call apiService.updateAbsensiGuru to delete photos,
                // but for Tahfiz we need to update SesiAbsensiTahfiz instead
                const refreshAbsensiGuruWrapper = async () => {
                  // Refresh sesi absensi tahfiz to get latest data
                  await refreshSesiAbsensiTahfiz();
                  setRefreshKey(prev => prev + 1);
                };

                return (
                  <div
                    key={`${jadwal.id}-${session?.id || 'no-session'}-${refreshKey}`}
                    ref={(el) => {
                      jadwalRefs.current[jadwal.id] = el;
                    }}
                  >
                    <JadwalCard
                      key={`jadwal-card-${jadwal.id}-${session?.id || 'no-session'}-${refreshKey}`}
                      jadwal={jadwalForCard}
                      session={session as any}
                      kelasName={kelasName}
                      mapelName={mapelName}
                      muridCount={santriCount}
                      attendanceCount={attendanceCount}
                      canOpenSession={canOpenSession}
                      isSessionExpired={isSessionExpired}
                      isFinished={isFinished}
                      hasPhoto={hasPhoto}
                      absensiGuru={absensiGuruForCard as any}
                      userId={user?.id}
                      today={today}
                      onOpenSession={handlers.openSession}
                      onManualAttendance={handlers.handleManualAttendance}
                      onCloseSession={handlers.closeSession}
                      onOpenDetailAbsensi={handlers.handleOpenDetailAbsensi}
                      onTakePhoto={handlers.handleTakePhoto}
                      onOpenJurnalModal={handlers.handleOpenJurnalModal}
                      refreshAbsensiGuru={async () => {
                        await refreshSesiAbsensiTahfiz();
                        setRefreshKey(prev => prev + 1);
                      }}
                      onDeletePhoto={async (fotoId: string, jadwalId: string) => {
                        await handlers.handleDeletePhoto(fotoId, jadwalId);
                        await refreshSesiAbsensiTahfiz();
                        setRefreshKey(prev => prev + 1);
                      }}
                      onReplacePhoto={async (fotoId: string, jadwalId: string, imageBase64: string) => {
                        await handlers.handleReplacePhoto(fotoId, jadwalId, imageBase64);
                        await refreshSesiAbsensiTahfiz();
                        setRefreshKey(prev => prev + 1);
                      }}
                      isTahfiz={true}
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
              <p className="text-sm sm:text-base font-medium text-slate-500">{t('tahfiz.guruTahfiz.absensiTahfiz.tidakAdaJadwalHariIni')}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2">
                {t('tahfiz.guruTahfiz.absensiTahfiz.hari')}: {new Date().toLocaleDateString(getDateLocale(language), { weekday: 'long' })}
              </p>
            </div>
          )}
        </div>
      </div>

      <AbsensiManualModal
        isOpen={handlers.isModalOpen}
        onClose={() => handlers.setIsModalOpen(false)}
        selectedSesi={handlers.selectedSesi as any}
        getJadwalInfo={getJadwalInfo}
        onScanQR={() => handlers.setIsQRScannerOpen(true)}
        onShowSubjectQR={handlers.handleShowSubjectQR}
        jadwalPelajaran={jadwalTahfiz as any}
        getMuridsByKelas={getSantriByKelas as any}
        getAttendanceStatus={getAttendanceStatus}
        getSuratIzinForMurid={getSuratIzinForSantri as any}
        handleViewSuratDetail={handlers.handleViewSuratDetail}
        handleMarkWithSurat={handlers.handleMarkWithSurat}
        markAttendance={handlers.markAttendance}
        sendWhatsAppNotification={handlers.sendWhatsAppNotification}
        openInputKeteranganModal={(santri) => handlers.openInputKeteranganModal(santri, getAttendanceStatus)}
        refreshKey={handlers.refreshKey}
        scrollContainerRef={handlers.scrollContainerRef}
        mataPelajaran={[]}
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
        selectedSesiForQR={handlers.selectedSesiForQR as any}
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
        users={allSantri}
        kelas={[]}
      />

      <JurnalModal
        isOpen={handlers.isJurnalModalOpen}
        onClose={() => {
          handlers.setIsJurnalModalOpen(false);
          handlers.setJurnalJudul('');
          handlers.setJurnalDeskripsi('');
          handlers.setJurnalFile(null);
        }}
        selectedSesi={handlers.selectedSesiForJurnal as any}
        jurnalJudul={handlers.jurnalJudul}
        setJurnalJudul={handlers.setJurnalJudul}
        jurnalDeskripsi={handlers.jurnalDeskripsi}
        setJurnalDeskripsi={handlers.setJurnalDeskripsi}
        jurnalFile={handlers.jurnalFile}
        setJurnalFile={handlers.setJurnalFile}
        onSave={async () => {
          await handlers.handleSaveJurnal();
          await refreshSesiAbsensiTahfiz();
          setRefreshKey(prev => prev + 1);
        }}
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
        selectedSesi={handlers.selectedSesiForDetail as any}
        getJadwalInfo={getJadwalInfo}
        absensiGuru={[]}
        userId={user?.id}
        jadwalPelajaran={jadwalTahfiz as any}
        getMuridsByKelas={getSantriByKelas as any}
        getAttendanceStatus={getAttendanceStatus}
        onEditAbsensi={handlers.handleEditAbsensi}
        users={allSantri}
        refreshAbsensiGuru={async () => {}}
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
        users={allSantri}
        isSaving={handlers.editingAbsensi ? handlers.loadingMuridIds.has(handlers.editingAbsensi.muridId) : false}
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
        title={handlers.selectedJadwalForPhoto ? `${t('tahfiz.guruTahfiz.absensiTahfiz.fotoBuktiMengajar')} - ${getJadwalInfo(handlers.selectedJadwalForPhoto.id).mapel}` : t('tahfiz.guruTahfiz.absensiTahfiz.ambilFoto')}
      />
    </div>
  );
};

export default AbsensiTahfiz;

