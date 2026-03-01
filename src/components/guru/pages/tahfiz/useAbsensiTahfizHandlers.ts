import { useState, useRef, useEffect } from 'react';
import { TahfizSchedule, SesiAbsensiTahfiz, AbsensiPelajaran, User, JurnalMengajar, SuratIzin, FotoMengajar } from '../../../../types';
import { parseQRCodeData, generateSubjectQRCodeData, generateQRCodeURL } from '../../../../utils/qrCodeGenerator';
import { showNotification, sendWhatsAppNotification as sendWhatsApp } from '../mengajar/components/kelola-absensi/kelolaAbsensiUtils';
import { apiService } from '../../../../services/apiService';
import { getLocalTimeISOString, getTodayIndonesia, getCurrentTimeIndonesia } from '../../../../utils/absensiUtils';

export const useAbsensiTahfizHandlers = (
  user: any,
  mySchedules: TahfizSchedule[],
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[],
  refreshSesiAbsensiTahfiz: () => Promise<void>,
  createSesiAbsensiTahfizAPI: (sesi: Partial<SesiAbsensiTahfiz>) => Promise<SesiAbsensiTahfiz>,
  updateSesiAbsensiTahfizAPI: (id: string, sesi: Partial<SesiAbsensiTahfiz>) => Promise<SesiAbsensiTahfiz>,
  addAbsensiToSesiTahfizAPI: (sesiId: string, absensiData: any) => Promise<any>,
  bulkAddAbsensiToSesiTahfizAPI: (sesiId: string, absensiList: any[]) => Promise<any>,
  jadwalTahfiz: TahfizSchedule[],
  santri: User[],
  kelasTahfiz: any[],
  getJadwalInfo: (jadwalId: string) => { kelas: string; mapel: string },
  getSantriByKelas: (kelasId: string) => User[],
  tahun: string,
  getSuratIzinForSantri: (santriId: string, jadwalId?: string) => SuratIzin | undefined,
  t: (key: string, params?: Record<string, any>) => string
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsensiTahfiz | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedJadwalForPhoto, setSelectedJadwalForPhoto] = useState<TahfizSchedule | null>(null);
  const [subjectQRCodeURL, setSubjectQRCodeURL] = useState<string>('');
  const [isSubjectQRModalOpen, setIsSubjectQRModalOpen] = useState(false);
  const [selectedSesiForQR, setSelectedSesiForQR] = useState<SesiAbsensiTahfiz | null>(null);
  const [isDetailSuratModalOpen, setIsDetailSuratModalOpen] = useState(false);
  const [selectedSuratDetail, setSelectedSuratDetail] = useState<SuratIzin | null>(null);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [selectedSesiForJurnal, setSelectedSesiForJurnal] = useState<SesiAbsensiTahfiz | null>(null);
  const [jurnalJudul, setJurnalJudul] = useState('');
  const [jurnalDeskripsi, setJurnalDeskripsi] = useState('');
  const [jurnalFile, setJurnalFile] = useState<File | null>(null);
  const [isDetailAbsensiModalOpen, setIsDetailAbsensiModalOpen] = useState(false);
  const [selectedSesiForDetail, setSelectedSesiForDetail] = useState<SesiAbsensiTahfiz | null>(null);
  const [editingAbsensi, setEditingAbsensi] = useState<AbsensiPelajaran | null>(null);
  const [editStatus, setEditStatus] = useState<'hadir' | 'izin' | 'sakit' | 'alfa'>('hadir');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [isKeteranganModalOpen, setIsKeteranganModalOpen] = useState(false);
  const [selectedMuridForKeterangan, setSelectedMuridForKeterangan] = useState<User | null>(null);
  const [keteranganInput, setKeteranganInput] = useState('');
  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [existingJurnalFile, setExistingJurnalFile] = useState<{ name: string; type: string; data: string; size: number } | undefined>(undefined);
  const [loadingMuridIds, setLoadingMuridIds] = useState<Set<string>>(new Set()); // Loading state per murid
  const [isBulkLoading, setIsBulkLoading] = useState(false); // Loading state for bulk operation
  const [isEditingAbsensi, setIsEditingAbsensi] = useState(false); // Loading state for edit operation

  const scrollPositionRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const SCAN_DEBOUNCE_TIME = 2000;
  const today = getTodayIndonesia();

  // Sync selectedSesi with latest data from sesiAbsensiTahfiz
  useEffect(() => {
    if (selectedSesi) {
      const updatedSesi = sesiAbsensiTahfiz.find(s => s.id === selectedSesi.id);
      if (updatedSesi) {
        setSelectedSesi(updatedSesi);
      }
    }
  }, [sesiAbsensiTahfiz, selectedSesi?.id]);

  const openSession = async (jadwalId: string) => {
    const jadwal = mySchedules.find(j => j.id === jadwalId);
    if (!jadwal) return;

    const currentTime = getCurrentTimeIndonesia();

    if (currentTime >= jadwal.jamSelesai) {
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.waktuSudahBerlalu'),
        t('tahfiz.guruTahfiz.absensiTahfiz.tidakDapatMembukaSesi', { jamSelesai: jadwal.jamSelesai }));
      return;
    }

    const startTime = jadwal.jamMulai;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const currentMinutes = currentHour * 60 + currentMin;
    const timeDiff = startMinutes - currentMinutes;

    if (timeDiff > 30) {
      showNotification('warning', t('tahfiz.guruTahfiz.absensiTahfiz.terlaluAwal'),
        t('tahfiz.guruTahfiz.absensiTahfiz.sesiDapatDibukaMaksimal', { startTime }));
      return;
    }

    const newSesi: Partial<SesiAbsensiTahfiz> = {
      id: `sesi-tahfiz-${Date.now()}`,
      jadwalId,
      tanggal: today,
      jamBuka: getCurrentTimeIndonesia(),
      status: 'dibuka',
      createdBy: user?.id || '',
      tahun,
    };
    
    try {
      await createSesiAbsensiTahfizAPI(newSesi);
      await refreshSesiAbsensiTahfiz();
      showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.sesiDibuka'),
        t('tahfiz.guruTahfiz.absensiTahfiz.sesiAbsensiBerhasilDibuka', { mapel: getJadwalInfo(jadwalId).mapel }));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating session:', error);
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMembukaSesi'));
    }
  };

  const closeSession = async (sesiId: string) => {
    const session = sesiAbsensiTahfiz.find(s => s.id === sesiId);
    if (!session) return;

    const jadwal = jadwalTahfiz.find(j => j.id === session.jadwalId);
    if (!jadwal) return;

    const santriList = getSantriByKelas(jadwal.kelasId);
    const newAbsensiRecords: Partial<AbsensiPelajaran>[] = [];

    // Check existing absensi for this session
    const existingAbsensiMap = new Map(
      (session.dataAbsensi || []).map(a => [a.muridId, a])
    );

    // Find santri who don't have absensi
    santriList.forEach(santri => {
      if (!existingAbsensiMap.has(santri.id)) {
        const alfaAbsensi: Partial<AbsensiPelajaran> = {
          id: `absensi-alfa-${santri.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          muridId: santri.id,
          status: 'alfa',
          waktu: getLocalTimeISOString(),
          keterangan: 'Absen masuk manual oleh ustadz - alfa',
          method: 'manual',
        };
        newAbsensiRecords.push(alfaAbsensi);
      }
    });

    try {
      await updateSesiAbsensiTahfizAPI(sesiId, {
        status: 'ditutup',
        jamTutup: getCurrentTimeIndonesia()
      });

      if (newAbsensiRecords.length > 0) {
        await bulkAddAbsensiToSesiTahfizAPI(sesiId, newAbsensiRecords);
        showNotification('info', t('tahfiz.guruTahfiz.absensiTahfiz.sesiDitutup'), t('tahfiz.guruTahfiz.absensiTahfiz.santriTidakAbsenOtomatisAlfa', { count: newAbsensiRecords.length }));
      } else {
        showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.sesiDitutup'), t('tahfiz.guruTahfiz.absensiTahfiz.sesiAbsensiTelahDitutup'));
      }

      await refreshSesiAbsensiTahfiz();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error closing session:', error);
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMenutupSesi'));
    }
  };

  const handleManualAttendance = (sesi: SesiAbsensiTahfiz) => {
    setSelectedSesi(sesi);
    setIsModalOpen(true);
  };

  const handleTakePhoto = (jadwal: TahfizSchedule) => {
    setSelectedJadwalForPhoto(jadwal);
    setIsCameraOpen(true);
  };

  const handleShowSubjectQR = async (sesi: SesiAbsensiTahfiz) => {
    const jadwal = jadwalTahfiz.find(j => j.id === sesi.jadwalId);
    if (!jadwal) return;

    const qrData = generateSubjectQRCodeData(
      sesi.id,
      sesi.jadwalId,
      'tahfiz',
      user?.id || '',
      jadwal.kelasId,
      sesi.tanggal,
      jadwal.jamMulai,
      jadwal.jamSelesai
    );

    const url = await generateQRCodeURL(qrData, 400);
    setSubjectQRCodeURL(url);
    setSelectedSesiForQR(sesi);
    setIsSubjectQRModalOpen(true);
  };

  const handlePhotoCapture = async (imageBase64: string) => {
    if (!selectedJadwalForPhoto || !user) return;

    const today = getTodayIndonesia();
    const session = sesiAbsensiTahfiz.find(s => 
      s.jadwalId === selectedJadwalForPhoto.id && 
      s.tanggal === today
    );

    const newFoto: any = {
      id: `foto-tahfiz-${Date.now()}`,
      jadwalId: selectedJadwalForPhoto.id,
      mataPelajaranId: 'tahfiz',
      kelasId: selectedJadwalForPhoto.kelasId,
      fotoBase64: imageBase64,
      waktuFoto: new Date().toISOString(),
      keterangan: `Foto bukti mengajar ${getJadwalInfo(selectedJadwalForPhoto.id).mapel} di kelas ${getJadwalInfo(selectedJadwalForPhoto.id).kelas}`
    };

    // Format foto mengajar for JurnalTahfiz collection
    const fotoMengajarForJurnal = {
      id: newFoto.id,
      fotoBase64: newFoto.fotoBase64,
      waktuFoto: newFoto.waktuFoto,
      keterangan: newFoto.keterangan
    };

    try {
      let currentSession = session;
      if (session) {
        // Update existing session with new photo
        const updatedFotoMengajar = [...(session.fotoMengajar || []), newFoto];
        await updateSesiAbsensiTahfizAPI(session.id, {
          fotoMengajar: updatedFotoMengajar
        });
        await refreshSesiAbsensiTahfiz();
        // Get updated session
        currentSession = sesiAbsensiTahfiz.find(s => s.id === session.id) || session;
      } else {
        // Create new session with photo
        const newSesi: Partial<SesiAbsensiTahfiz> = {
          id: `sesi-tahfiz-foto-${Date.now()}`,
          jadwalId: selectedJadwalForPhoto.id,
          tanggal: today,
          jamBuka: getCurrentTimeIndonesia(),
          status: 'dibuka',
          createdBy: user.id,
          tahun,
          fotoMengajar: [newFoto],
        };
        const createdSesi = await createSesiAbsensiTahfizAPI(newSesi);
        await refreshSesiAbsensiTahfiz();
        currentSession = createdSesi;
      }

      // Save foto mengajar to JurnalTahfiz collection
      try {
        // Check if jurnal tahfiz exists
        const existingJurnal = await apiService.getJurnalTahfizByJadwalIdAndTanggal(
          selectedJadwalForPhoto.id,
          today,
          selectedJadwalForPhoto.kelasId
        );

        if (existingJurnal.success && existingJurnal.jurnalTahfiz) {
          // Update existing jurnal tahfiz with foto mengajar
          await apiService.updateJurnalTahfiz(existingJurnal.jurnalTahfiz.id, {
            tanggal: today,
            fotoMengajar: fotoMengajarForJurnal
          });
        } else {
          // Create new jurnal tahfiz with foto mengajar
          // If there's existing jurnal data in session, use it; otherwise create minimal jurnal
          const jurnalId = `jurnal-tahfiz-${selectedJadwalForPhoto.id}-${selectedJadwalForPhoto.kelasId}-${Date.now()}`;
          await apiService.createJurnalTahfiz({
            id: jurnalId,
            jadwalId: selectedJadwalForPhoto.id,
            kelasId: selectedJadwalForPhoto.kelasId,
            tanggal: today,
            judul: currentSession?.jurnal?.judul || 'Jurnal Tahfiz',
            deskripsi: currentSession?.jurnal?.deskripsi || 'Jurnal mengajar tahfiz',
            waktuInput: currentSession?.jurnal?.waktuInput || new Date().toISOString(),
            file: currentSession?.jurnal?.file,
            fotoMengajar: fotoMengajarForJurnal,
            tahun: currentSession?.tahun || tahun
          });
        }
      } catch (jurnalError) {
        console.error('Error saving foto mengajar to jurnaltahfiz collection:', jurnalError);
        // Don't fail the whole operation, just log the error
      }

      // Refresh session data to get latest foto mengajar
      await refreshSesiAbsensiTahfiz();

      // Dispatch event to trigger jurnal refresh in JadwalCard
      window.dispatchEvent(new Event('jurnal-saved'));

      showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.fotoDisimpan'), t('tahfiz.guruTahfiz.absensiTahfiz.fotoBuktiMengajarBerhasilDisimpan'));

      setSelectedJadwalForPhoto(null);
      setIsCameraOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving photo:', error);
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMenyimpanFoto'));
    }
  };

  const markAttendance = async (santriId: string, status: 'hadir' | 'izin' | 'sakit' | 'alfa', keteranganAbsen?: string) => {
    if (!selectedSesi) return;

    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }

    const existingAbsensi = selectedSesi.dataAbsensi?.find(a => a.muridId === santriId);

    try {
      // Set loading state for this murid
      setLoadingMuridIds(prev => new Set(prev).add(santriId));
      
      const absensiData: Partial<AbsensiPelajaran> = {
        id: existingAbsensi?.id || `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: santriId,
        status,
        waktu: getLocalTimeISOString(),
        keterangan: keteranganAbsen,
        method: 'manual',
      };

      await addAbsensiToSesiTahfizAPI(selectedSesi.id, absensiData);
      // refreshSesiAbsensiTahfiz is already called inside addAbsensiToSesiTahfizAPI

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error marking attendance:', error);
      showNotification('error', 'Error', 'Gagal menyimpan absensi');
    } finally {
      // Clear loading state
      setLoadingMuridIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(santriId);
        return newSet;
      });
    }
  };

  const markAllPresent = async () => {
    if (!selectedSesi) return;

    const jadwal = jadwalTahfiz.find(j => j.id === selectedSesi.jadwalId);
    if (!jadwal) return;

    const santriList = getSantriByKelas(jadwal.kelasId);
    const timestamp = getLocalTimeISOString();
    const absensiList: Partial<AbsensiPelajaran>[] = [];

    const existingAbsensiMap = new Map(
      (selectedSesi.dataAbsensi || []).map(a => [a.muridId, a])
    );

    santriList.forEach(santri => {
      const existingAbsensi = existingAbsensiMap.get(santri.id);
      
      const suratIzin = getSuratIzinForSantri(santri.id, selectedSesi.jadwalId);
      
      let status: 'hadir' | 'izin' | 'sakit' | 'alfa' = 'hadir';
      let keterangan = 'Absen masuk manual - hadir semua';
      
      if (suratIzin) {
        if (suratIzin.jenis === 'izin_dispen' || suratIzin.jenis === 'izin') {
          status = 'izin';
          keterangan = suratIzin.jenis === 'izin_dispen' 
            ? `Izin dispen disetujui (${suratIzin.jamMulai} - ${suratIzin.jamSelesai})`
            : 'Surat izin disetujui';
        } else if (suratIzin.jenis === 'sakit') {
          status = 'sakit';
          keterangan = 'Surat sakit disetujui';
        }
      } else if (existingAbsensi) {
        if (existingAbsensi.status === 'izin' || existingAbsensi.status === 'sakit') {
          status = existingAbsensi.status;
          keterangan = existingAbsensi.keterangan || keterangan;
        }
      }
      
      absensiList.push({
        id: existingAbsensi?.id || `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: santri.id,
        status,
        waktu: timestamp,
        keterangan,
        method: 'manual',
      });
    });

    if (absensiList.length > 0) {
      try {
        setIsBulkLoading(true);
        
        await bulkAddAbsensiToSesiTahfizAPI(selectedSesi.id, absensiList);
        // refreshSesiAbsensiTahfiz is already called inside bulkAddAbsensiToSesiTahfizAPI

        const hadirCount = absensiList.filter(a => a.status === 'hadir').length;
        const izinCount = absensiList.filter(a => a.status === 'izin').length;
        const sakitCount = absensiList.filter(a => a.status === 'sakit').length;
        
        let message = `${hadirCount} santri ditandai hadir`;
        if (izinCount > 0) message += `, ${izinCount} santri tetap izin`;
        if (sakitCount > 0) message += `, ${sakitCount} santri tetap sakit`;
        
        showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.absensiDiperbarui'), message);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error creating bulk absensi:', error);
        showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMenandaiSemuaSantriHadir'));
      } finally {
        setIsBulkLoading(false);
      }
    }
  };

  const handleQRScan = async (qrData: string) => {
    const currentTime = Date.now();

    if (lastProcessedScan &&
        lastProcessedScan.data === qrData &&
        (currentTime - lastProcessedScan.time) < SCAN_DEBOUNCE_TIME) {
      console.log('Duplicate QR scan detected, ignoring...');
      return;
    }

    setLastProcessedScan({ data: qrData, time: currentTime });

    const parsed = parseQRCodeData(qrData);

    if (!parsed.isValid || !selectedSesi) {
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.qrCodeTidakValid'), t('tahfiz.guruTahfiz.absensiTahfiz.qrCodeTidakValidAtauSesiTidakDitemukan'));
      return;
    }

    const santriUser = santri.find(u => u.id === parsed.muridId) ||
      santri.find(u => (u as any).muridId === parsed.muridId) ||
      santri.find(u => parsed.nisn && (u as any).nisn === parsed.nisn);
    if (!santriUser) {
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.santriTidakDitemukan'), t('tahfiz.guruTahfiz.absensiTahfiz.santriTidakDitemukanDalamSistem'));
      return;
    }

    const possibleSantriIds: string[] = [];
    if (santriUser.id) possibleSantriIds.push(santriUser.id);
    const muridIdFromSantri = (santriUser as any)?.muridId as string | undefined;
    if (muridIdFromSantri) possibleSantriIds.push(muridIdFromSantri);

    const jadwal = jadwalTahfiz.find(j => j.id === selectedSesi.jadwalId);
    const kelas = kelasTahfiz.find(k => k.id === jadwal?.kelasId);
    const santriKelasIds = kelas?.santriIds || [];
    
    const isMemberOfClass = possibleSantriIds.some(id => santriKelasIds.includes(id));

    if (!jadwal || !isMemberOfClass) {
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.kelasTidakSesuai'), t('tahfiz.guruTahfiz.absensiTahfiz.santriBukanDariKelasIni'));
      return;
    }

    const attendanceId = santriUser.id || muridIdFromSantri || parsed.muridId;
    const existingAbsensi = selectedSesi.dataAbsensi?.find(a => a.muridId === attendanceId);

    if (existingAbsensi) {
      showNotification('warning', t('tahfiz.guruTahfiz.absensiTahfiz.sudahAbsen'), t('tahfiz.guruTahfiz.absensiTahfiz.santriSudahMelakukanAbsensi', { santriName: santriUser.name }));
      return;
    }

    try {
      // Set loading state for this murid
      setLoadingMuridIds(prev => new Set(prev).add(attendanceId));
      
      const absensiData: Partial<AbsensiPelajaran> = {
        id: `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: attendanceId,
        status: 'hadir',
        waktu: getLocalTimeISOString(),
        keterangan: 'Absen via QR Code',
        method: 'qr',
      };

      await addAbsensiToSesiTahfizAPI(selectedSesi.id, absensiData);
      // refreshSesiAbsensiTahfiz is already called inside addAbsensiToSesiTahfizAPI

      showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.absensiBerhasil'), `${santriUser.name} - ${(santriUser as any).nisn || 'N/A'}`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating QR scan absensi:', error);
      showNotification('error', 'Error', 'Gagal menyimpan absensi');
    } finally {
      // Clear loading state
      setLoadingMuridIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attendanceId);
        return newSet;
      });
    }
  };

  const handleViewSuratDetail = (surat: SuratIzin) => {
    setSelectedSuratDetail(surat);
    setIsDetailSuratModalOpen(true);
  };

  const handleMarkWithSurat = (santriId: string, surat: SuratIzin) => {
    const status = surat.jenis === 'izin_dispen' || surat.jenis === 'izin' ? 'izin' : 'sakit';
    const keterangan = surat.jenis === 'izin_dispen' 
      ? `Izin dispen disetujui (${surat.jamMulai} - ${surat.jamSelesai})`
      : `Surat ${surat.jenis} disetujui`;
    markAttendance(santriId, status, keterangan);
  };

  const handleOpenJurnalModal = async (sesi: SesiAbsensiTahfiz) => {
    setSelectedSesiForJurnal(sesi);
    
    // For tahfiz, jurnal is stored in sesiAbsensiTahfiz itself
    if (sesi.jurnal) {
      setJurnalJudul(sesi.jurnal.judul);
      setJurnalDeskripsi(sesi.jurnal.deskripsi);
      setExistingJurnalFile(sesi.jurnal.file);
    } else {
      setJurnalJudul('');
      setJurnalDeskripsi('');
      setExistingJurnalFile(undefined);
    }
    
    setJurnalFile(null);
    setIsJurnalModalOpen(true);
  };

  const handleSaveJurnal = async () => {
    if (!selectedSesiForJurnal) return;

    if (!jurnalJudul.trim() || !jurnalDeskripsi.trim()) {
      showNotification('warning', t('tahfiz.guruTahfiz.absensiTahfiz.dataTidakLengkap'), t('tahfiz.guruTahfiz.absensiTahfiz.judulDanDeskripsiJurnalHarusDiisi'));
      return;
    }

    let fileData = existingJurnalFile;
    if (jurnalFile) {
      try {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(jurnalFile);
        });

        fileData = {
          name: jurnalFile.name,
          type: jurnalFile.type,
          data: base64Data,
          size: jurnalFile.size
        };
      } catch (error) {
        showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.gagalUpload'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMenguploadFile'));
        return;
      }
    }

    const jurnal: JurnalMengajar = {
      judul: jurnalJudul.trim(),
      deskripsi: jurnalDeskripsi.trim(),
      waktuInput: new Date().toISOString(),
      file: fileData
    };

    try {
      // Save to SesiAbsensiTahfiz
      await updateSesiAbsensiTahfizAPI(selectedSesiForJurnal.id, {
        jurnal
      });

      // Get jadwal info to get kelasId
      const jadwal = jadwalTahfiz.find(j => j.id === selectedSesiForJurnal.jadwalId);
      if (!jadwal) {
        throw new Error('Jadwal tidak ditemukan');
      }

      // Get foto mengajar from session if exists (take the first/latest one)
      let fotoMengajarData = undefined;
      if (selectedSesiForJurnal.fotoMengajar && selectedSesiForJurnal.fotoMengajar.length > 0) {
        const latestFoto = selectedSesiForJurnal.fotoMengajar[selectedSesiForJurnal.fotoMengajar.length - 1];
        fotoMengajarData = {
          id: latestFoto.id,
          fotoBase64: latestFoto.fotoBase64,
          waktuFoto: latestFoto.waktuFoto,
          keterangan: latestFoto.keterangan
        };
      }

      // Save to JurnalTahfiz collection
      try {
        // Check if jurnal tahfiz exists
        const existingJurnal = await apiService.getJurnalTahfizByJadwalIdAndTanggal(
          selectedSesiForJurnal.jadwalId,
          selectedSesiForJurnal.tanggal,
          jadwal.kelasId
        );

        if (existingJurnal.success && existingJurnal.jurnalTahfiz) {
          // Update existing jurnal tahfiz
          await apiService.updateJurnalTahfiz(existingJurnal.jurnalTahfiz.id, {
            tanggal: selectedSesiForJurnal.tanggal,
            judul: jurnal.judul,
            deskripsi: jurnal.deskripsi,
            waktuInput: jurnal.waktuInput,
            file: jurnal.file,
            fotoMengajar: fotoMengajarData
          });
        } else {
          // Create new jurnal tahfiz
          const jurnalId = `jurnal-tahfiz-${selectedSesiForJurnal.jadwalId}-${jadwal.kelasId}-${Date.now()}`;
          await apiService.createJurnalTahfiz({
            id: jurnalId,
            jadwalId: selectedSesiForJurnal.jadwalId,
            kelasId: jadwal.kelasId,
            tanggal: selectedSesiForJurnal.tanggal,
            judul: jurnal.judul,
            deskripsi: jurnal.deskripsi,
            waktuInput: jurnal.waktuInput,
            file: jurnal.file,
            fotoMengajar: fotoMengajarData,
            tahun: selectedSesiForJurnal.tahun || tahun
          });
        }
      } catch (jurnalError) {
        console.error('Error saving jurnal to jurnaltahfiz collection:', jurnalError);
        // Don't fail the whole operation, just log the error
      }

      showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.jurnalDisimpan'),
        jurnalFile ? t('tahfiz.guruTahfiz.absensiTahfiz.jurnalMengajarDanFileBerhasilDisimpan') : t('tahfiz.guruTahfiz.absensiTahfiz.jurnalMengajarBerhasilDisimpan')
      );

      window.dispatchEvent(new Event('jurnal-saved'));

      setIsJurnalModalOpen(false);
      setSelectedSesiForJurnal(null);
      setJurnalJudul('');
      setJurnalDeskripsi('');
      setJurnalFile(null);
      setExistingJurnalFile(undefined);
      await refreshSesiAbsensiTahfiz();
    } catch (error) {
      console.error('Error saving jurnal:', error);
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMenyimpanJurnal'));
    }
  };

  const handleOpenDetailAbsensi = (sesi: SesiAbsensiTahfiz) => {
    setSelectedSesiForDetail(sesi);
    setIsDetailAbsensiModalOpen(true);
  };

  const handleEditAbsensi = (absensiItem: AbsensiPelajaran) => {
    setEditingAbsensi(absensiItem);
    setEditStatus(absensiItem.status as 'hadir' | 'izin' | 'sakit' | 'alfa');
    setEditKeterangan(absensiItem.keterangan || '');
  };

  const handleSaveEditAbsensi = async () => {
    if (!editingAbsensi || !selectedSesiForDetail) return;

    try {
      setIsEditingAbsensi(true);
      // Set loading state for this murid
      setLoadingMuridIds(prev => new Set(prev).add(editingAbsensi.muridId));
      
      const absensiData: Partial<AbsensiPelajaran> = {
        id: editingAbsensi.id,
        muridId: editingAbsensi.muridId,
        status: editStatus,
        keterangan: editKeterangan,
        waktu: getLocalTimeISOString(),
        method: 'manual',
      };

      await addAbsensiToSesiTahfizAPI(selectedSesiForDetail.id, absensiData);
      // refreshSesiAbsensiTahfiz is already called inside addAbsensiToSesiTahfizAPI

      showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.absensiDiperbarui'), t('tahfiz.guruTahfiz.absensiTahfiz.dataAbsensiBerhasilDiperbarui'));
      setEditingAbsensi(null);
      setEditStatus('hadir');
      setEditKeterangan('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating absensi:', error);
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMemperbaruiAbsensi'));
    } finally {
      setIsEditingAbsensi(false);
      // Clear loading state
      setLoadingMuridIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(editingAbsensi.muridId);
        return newSet;
      });
    }
  };

  const openInputKeteranganModal = (santri: User, getAttendanceStatus: (santriId: string, sesiId: string) => AbsensiPelajaran | undefined) => {
    setSelectedMuridForKeterangan(santri);
    if (selectedSesi) {
      const attendance = getAttendanceStatus(santri.id, selectedSesi.id);
      if (attendance && attendance.keterangan) {
        setKeteranganInput(attendance.keterangan);
      } else {
        setKeteranganInput('');
      }
    }
    setIsKeteranganModalOpen(true);
  };

  const handleSaveKeteranganInput = async (getAttendanceStatus: (santriId: string, sesiId: string) => AbsensiPelajaran | undefined) => {
    if (!selectedMuridForKeterangan || !selectedSesi) return;

    const attendance = getAttendanceStatus(selectedMuridForKeterangan.id, selectedSesi.id);
    if (attendance) {
      try {
        // Set loading state for this murid
        setLoadingMuridIds(prev => new Set(prev).add(selectedMuridForKeterangan.id));
        
        const absensiData: Partial<AbsensiPelajaran> = {
          id: attendance.id,
          muridId: attendance.muridId,
          status: attendance.status,
          keterangan: keteranganInput,
          waktu: getLocalTimeISOString(),
          method: 'manual',
        };

        await addAbsensiToSesiTahfizAPI(selectedSesi.id, absensiData);
        // refreshSesiAbsensiTahfiz is already called inside addAbsensiToSesiTahfizAPI
        showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.keteranganDisimpan'), t('tahfiz.guruTahfiz.absensiTahfiz.keteranganBerhasilDiperbarui'));
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error updating keterangan:', error);
        showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMemperbaruiKeterangan'));
      } finally {
        // Clear loading state
        setLoadingMuridIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedMuridForKeterangan.id);
          return newSet;
        });
      }
    }

    setIsKeteranganModalOpen(false);
    setSelectedMuridForKeterangan(null);
    setKeteranganInput('');
  };

  const sendWhatsAppNotification = (santri: User, status: string, mataPelajaranName: string) => {
    sendWhatsApp(santri, status, mataPelajaranName, santri, kelasTahfiz);
  };

  const handleRemoveExistingFile = () => {
    setExistingJurnalFile(undefined);
  };

  // Handler untuk menghapus foto dari SesiAbsensiTahfiz
  const handleDeletePhoto = async (fotoId: string, jadwalId: string) => {
    const today = getTodayIndonesia();
    const session = sesiAbsensiTahfiz.find(s => 
      s.jadwalId === jadwalId && 
      s.tanggal === today
    );

    if (!session) {
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.sesiTidakDitemukan'));
      return;
    }

    try {
      // First, update JurnalTahfiz collection to remove the photo
      // This is the primary storage for tahfiz photos
      try {
        const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
        if (jadwal) {
          const existingJurnal = await apiService.getJurnalTahfizByJadwalIdAndTanggal(
            jadwalId,
            today,
            jadwal.kelasId
          );

          if (existingJurnal.success && existingJurnal.jurnalTahfiz) {
            const jurnalDoc = existingJurnal.jurnalTahfiz;
            
            // Check if using new structure (pertemuan array)
            if (jurnalDoc.pertemuan && Array.isArray(jurnalDoc.pertemuan)) {
              // Find pertemuan with matching tanggal
              const pertemuanIndex = jurnalDoc.pertemuan.findIndex((p: any) => p.tanggal === today);
              
              if (pertemuanIndex >= 0) {
                const pertemuan = jurnalDoc.pertemuan[pertemuanIndex];
                
                // Check if the foto mengajar in pertemuan matches the fotoId to be deleted
                if (pertemuan.fotoMengajar && pertemuan.fotoMengajar.id === fotoId) {
                  // Remove foto mengajar from pertemuan by setting it to null
                  // Controller checks !== undefined, so null will be set
                  await apiService.updateJurnalTahfiz(jurnalDoc.id, {
                    tanggal: today,
                    fotoMengajar: null as any
                  });
                }
              }
            } else {
              // Old structure - check if foto mengajar matches and remove it
              if (jurnalDoc.fotoMengajar && jurnalDoc.fotoMengajar.id === fotoId) {
                await apiService.updateJurnalTahfiz(jurnalDoc.id, {
                  tanggal: today,
                  fotoMengajar: null as any
                });
              }
            }
          }
        }
      } catch (jurnalError) {
        console.error('Error updating jurnal tahfiz after photo deletion:', jurnalError);
        // Continue with session update even if jurnal update fails
      }

      // Also remove from session.fotoMengajar if it exists there
      const updatedFotoMengajar = (session.fotoMengajar || []).filter(f => f.id !== fotoId);
      await updateSesiAbsensiTahfizAPI(session.id, {
        fotoMengajar: updatedFotoMengajar
      });
      await refreshSesiAbsensiTahfiz();

      showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.fotoDihapus'), t('tahfiz.guruTahfiz.absensiTahfiz.fotoBuktiMengajarBerhasilDihapus'));
      
      // Dispatch event to trigger jurnal refresh in JadwalCard
      window.dispatchEvent(new Event('jurnal-saved'));
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting photo:', error);
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMenghapusFoto'));
    }
  };

  // Handler untuk mengganti foto di SesiAbsensiTahfiz
  const handleReplacePhoto = async (fotoId: string, jadwalId: string, imageBase64: string) => {
    const today = getTodayIndonesia();
    const session = sesiAbsensiTahfiz.find(s => 
      s.jadwalId === jadwalId && 
      s.tanggal === today
    );

    if (!session) {
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.sesiTidakDitemukan'));
      return;
    }

    try {
      const existingFoto = session.fotoMengajar?.find(f => f.id === fotoId);
      if (!existingFoto) {
        showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.fotoTidakDitemukan'));
        return;
      }

      const updatedFoto: FotoMengajar = {
        ...existingFoto,
        fotoBase64: imageBase64,
        waktuFoto: new Date().toISOString(),
      };

      const updatedFotoMengajar = (session.fotoMengajar || []).map(f => 
        f.id === fotoId ? updatedFoto : f
      );

      await updateSesiAbsensiTahfizAPI(session.id, {
        fotoMengajar: updatedFotoMengajar
      });
      await refreshSesiAbsensiTahfiz();

      // Update JurnalTahfiz collection
      try {
        const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
        if (jadwal) {
          const existingJurnal = await apiService.getJurnalTahfizByJadwalIdAndTanggal(
            jadwalId,
            today,
            jadwal.kelasId
          );

          if (existingJurnal.success && existingJurnal.jurnalTahfiz) {
            // Get the latest foto mengajar (the replaced one if it's the latest, or the actual latest)
            const latestFoto = updatedFotoMengajar.length > 0 
              ? updatedFotoMengajar[updatedFotoMengajar.length - 1]
              : null;

            const fotoMengajarData = latestFoto ? {
              id: latestFoto.id,
              fotoBase64: latestFoto.fotoBase64,
              waktuFoto: latestFoto.waktuFoto,
              keterangan: latestFoto.keterangan
            } : undefined;

            // Update jurnal tahfiz with updated foto mengajar
            await apiService.updateJurnalTahfiz(existingJurnal.jurnalTahfiz.id, {
              tanggal: today,
              fotoMengajar: fotoMengajarData
            });
          }
        }
      } catch (jurnalError) {
        console.error('Error updating jurnal tahfiz after photo replacement:', jurnalError);
        // Don't fail the whole operation
      }

      showNotification('success', t('tahfiz.guruTahfiz.absensiTahfiz.fotoDiganti'), t('tahfiz.guruTahfiz.absensiTahfiz.fotoBuktiMengajarBerhasilDiganti'));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error replacing photo:', error);
      showNotification('error', t('tahfiz.guruTahfiz.absensiTahfiz.error'), t('tahfiz.guruTahfiz.absensiTahfiz.gagalMenggantiFoto'));
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    selectedSesi,
    isQRScannerOpen,
    setIsQRScannerOpen,
    isCameraOpen,
    setIsCameraOpen,
    selectedJadwalForPhoto,
    setSelectedJadwalForPhoto,
    subjectQRCodeURL,
    setSubjectQRCodeURL,
    isSubjectQRModalOpen,
    setIsSubjectQRModalOpen,
    selectedSesiForQR,
    setSelectedSesiForQR,
    isDetailSuratModalOpen,
    setIsDetailSuratModalOpen,
    selectedSuratDetail,
    setSelectedSuratDetail,
    isJurnalModalOpen,
    setIsJurnalModalOpen,
    selectedSesiForJurnal,
    jurnalJudul,
    setJurnalJudul,
    jurnalDeskripsi,
    setJurnalDeskripsi,
    jurnalFile,
    setJurnalFile,
    existingJurnalFile,
    handleRemoveExistingFile,
    isDetailAbsensiModalOpen,
    setIsDetailAbsensiModalOpen,
    selectedSesiForDetail,
    editingAbsensi,
    setEditingAbsensi,
    editStatus,
    setEditStatus,
    editKeterangan,
    setEditKeterangan,
    isKeteranganModalOpen,
    setIsKeteranganModalOpen,
    selectedMuridForKeterangan,
    keteranganInput,
    setKeteranganInput,
    refreshKey,
    scrollContainerRef,
    openSession,
    closeSession,
    handleManualAttendance,
    handleShowSubjectQR,
    handleTakePhoto,
    handlePhotoCapture,
    markAttendance,
    handleQRScan,
    handleViewSuratDetail,
    handleMarkWithSurat,
    handleOpenJurnalModal,
    handleSaveJurnal,
    handleOpenDetailAbsensi,
    handleEditAbsensi,
    handleSaveEditAbsensi,
    openInputKeteranganModal,
    handleSaveKeteranganInput,
    sendWhatsAppNotification,
    markAllPresent,
    setSelectedSesiForDetail,
    handleDeletePhoto,
    handleReplacePhoto,
    loadingMuridIds,
    isBulkLoading,
    isEditingAbsensi,
  };
};

