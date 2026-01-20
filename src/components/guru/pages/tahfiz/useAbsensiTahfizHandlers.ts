import { useState, useRef, useEffect } from 'react';
import { TahfizSchedule, SesiAbsensiTahfiz, AbsensiPelajaran, User, JurnalMengajar, SuratIzin, FotoMengajar } from '../../../../types';
import { parseQRCodeData, generateSubjectQRCodeData, generateQRCodeURL } from '../../../../utils/qrCodeGenerator';
import { showNotification, sendWhatsAppNotification as sendWhatsApp } from '../mengajar/components/kelola-absensi/kelolaAbsensiUtils';
import { apiService } from '../../../../services/apiService';
import { getLocalTimeISOString } from '../../../../utils/absensiUtils';

export const useAbsensiTahfizHandlers = (
  user: any,
  mySchedules: TahfizSchedule[],
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[],
  refreshSesiAbsensiTahfiz: () => Promise<void>,
  createSesiAbsensiTahfizAPI: (sesi: Partial<SesiAbsensiTahfiz>) => Promise<SesiAbsensiTahfiz>,
  updateSesiAbsensiTahfizAPI: (id: string, sesi: Partial<SesiAbsensiTahfiz>) => Promise<SesiAbsensiTahfiz>,
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

  const scrollPositionRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const SCAN_DEBOUNCE_TIME = 2000;
  const today = new Date().toISOString().split('T')[0];

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

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    if (currentTime >= jadwal.jamSelesai) {
      showNotification('error', t('tahfiz.absensiTahfiz.waktuSudahBerlalu'),
        t('tahfiz.absensiTahfiz.tidakDapatMembukaSesi', { jamSelesai: jadwal.jamSelesai }));
      return;
    }

    const startTime = jadwal.jamMulai;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const currentMinutes = currentHour * 60 + currentMin;
    const timeDiff = startMinutes - currentMinutes;

    if (timeDiff > 30) {
      showNotification('warning', t('tahfiz.absensiTahfiz.terlaluAwal'),
        t('tahfiz.absensiTahfiz.sesiDapatDibukaMaksimal', { startTime }));
      return;
    }

    const newSesi: Partial<SesiAbsensiTahfiz> = {
      id: `sesi-tahfiz-${Date.now()}`,
      jadwalId,
      tanggal: today,
      jamBuka: new Date().toLocaleTimeString('id-ID', { hour12: false }),
      status: 'dibuka',
      createdBy: user?.id || '',
      tahun,
    };
    
    try {
      await createSesiAbsensiTahfizAPI(newSesi);
      await refreshSesiAbsensiTahfiz();
      showNotification('success', t('tahfiz.absensiTahfiz.sesiDibuka'),
        t('tahfiz.absensiTahfiz.sesiAbsensiBerhasilDibuka', { mapel: getJadwalInfo(jadwalId).mapel }));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating session:', error);
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMembukaSesi'));
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
        jamTutup: new Date().toLocaleTimeString('id-ID', { hour12: false })
      });

      if (newAbsensiRecords.length > 0) {
        await apiService.bulkAddAbsensiToSesiTahfiz(sesiId, newAbsensiRecords);
        showNotification('info', t('tahfiz.absensiTahfiz.sesiDitutup'), t('tahfiz.absensiTahfiz.santriTidakAbsenOtomatisAlfa', { count: newAbsensiRecords.length }));
      } else {
        showNotification('success', t('tahfiz.absensiTahfiz.sesiDitutup'), t('tahfiz.absensiTahfiz.sesiAbsensiTelahDitutup'));
      }

      await refreshSesiAbsensiTahfiz();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error closing session:', error);
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMenutupSesi'));
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

    const today = new Date().toISOString().split('T')[0];
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

    try {
      if (session) {
        // Update existing session with new photo
        const updatedFotoMengajar = [...(session.fotoMengajar || []), newFoto];
        await updateSesiAbsensiTahfizAPI(session.id, {
          fotoMengajar: updatedFotoMengajar
        });
        await refreshSesiAbsensiTahfiz();
        showNotification('success', t('tahfiz.absensiTahfiz.fotoDisimpan'), t('tahfiz.absensiTahfiz.fotoBuktiMengajarBerhasilDisimpan'));
      } else {
        // Create new session with photo
        const newSesi: Partial<SesiAbsensiTahfiz> = {
          id: `sesi-tahfiz-foto-${Date.now()}`,
          jadwalId: selectedJadwalForPhoto.id,
          tanggal: today,
          jamBuka: new Date().toLocaleTimeString('id-ID', { hour12: false }),
          status: 'dibuka',
          createdBy: user.id,
          tahun,
          fotoMengajar: [newFoto],
        };
        await createSesiAbsensiTahfizAPI(newSesi);
        await refreshSesiAbsensiTahfiz();
        showNotification('success', t('tahfiz.absensiTahfiz.fotoDisimpan'), t('tahfiz.absensiTahfiz.fotoBuktiMengajarBerhasilDisimpan'));
      }

      setSelectedJadwalForPhoto(null);
      setIsCameraOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving photo:', error);
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMenyimpanFoto'));
    }
  };

  const markAttendance = async (santriId: string, status: 'hadir' | 'izin' | 'sakit' | 'alfa', keteranganAbsen?: string) => {
    if (!selectedSesi) return;

    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }

    const existingAbsensi = selectedSesi.dataAbsensi?.find(a => a.muridId === santriId);

    try {
      const absensiData: Partial<AbsensiPelajaran> = {
        id: existingAbsensi?.id || `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: santriId,
        status,
        waktu: getLocalTimeISOString(),
        keterangan: keteranganAbsen,
        method: 'manual',
      };

      await apiService.addAbsensiToSesiTahfiz(selectedSesi.id, absensiData);
      await refreshSesiAbsensiTahfiz();

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error marking attendance:', error);
      showNotification('error', 'Error', 'Gagal menyimpan absensi');
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
        await apiService.bulkAddAbsensiToSesiTahfiz(selectedSesi.id, absensiList);
        await refreshSesiAbsensiTahfiz();

        const hadirCount = absensiList.filter(a => a.status === 'hadir').length;
        const izinCount = absensiList.filter(a => a.status === 'izin').length;
        const sakitCount = absensiList.filter(a => a.status === 'sakit').length;
        
        let message = `${hadirCount} santri ditandai hadir`;
        if (izinCount > 0) message += `, ${izinCount} santri tetap izin`;
        if (sakitCount > 0) message += `, ${sakitCount} santri tetap sakit`;
        
        showNotification('success', t('tahfiz.absensiTahfiz.absensiDiperbarui'), message);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error creating bulk absensi:', error);
        showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMenandaiSemuaSantriHadir'));
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
      showNotification('error', t('tahfiz.absensiTahfiz.qrCodeTidakValid'), t('tahfiz.absensiTahfiz.qrCodeTidakValidAtauSesiTidakDitemukan'));
      return;
    }

    const santriUser = santri.find(u => u.id === parsed.muridId) ||
      santri.find(u => parsed.nisn && (u as any).nisn === parsed.nisn);
    if (!santriUser) {
      showNotification('error', t('tahfiz.absensiTahfiz.santriTidakDitemukan'), t('tahfiz.absensiTahfiz.santriTidakDitemukanDalamSistem'));
      return;
    }

    const jadwal = jadwalTahfiz.find(j => j.id === selectedSesi.jadwalId);
    const kelas = kelasTahfiz.find(k => k.id === jadwal?.kelasId);
    const santriKelasIds = kelas?.santriIds || [];
    
    if (!jadwal || !santriKelasIds.includes(santriUser.id)) {
      showNotification('error', t('tahfiz.absensiTahfiz.kelasTidakSesuai'), t('tahfiz.absensiTahfiz.santriBukanDariKelasIni'));
      return;
    }

    const existingAbsensi = selectedSesi.dataAbsensi?.find(a => a.muridId === santriUser.id);

    if (existingAbsensi) {
      showNotification('warning', t('tahfiz.absensiTahfiz.sudahAbsen'), t('tahfiz.absensiTahfiz.santriSudahMelakukanAbsensi', { santriName: santriUser.name }));
      return;
    }

    try {
      const absensiData: Partial<AbsensiPelajaran> = {
        id: `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: santriUser.id,
        status: 'hadir',
        waktu: getLocalTimeISOString(),
        keterangan: 'Absen via QR Code',
        method: 'qr',
      };

      await apiService.addAbsensiToSesiTahfiz(selectedSesi.id, absensiData);
      await refreshSesiAbsensiTahfiz();

      showNotification('success', t('tahfiz.absensiTahfiz.absensiBerhasil'), `${santriUser.name} - ${(santriUser as any).nisn || 'N/A'}`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating QR scan absensi:', error);
      showNotification('error', 'Error', 'Gagal menyimpan absensi');
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
      showNotification('warning', t('tahfiz.absensiTahfiz.dataTidakLengkap'), t('tahfiz.absensiTahfiz.judulDanDeskripsiJurnalHarusDiisi'));
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
        showNotification('error', t('tahfiz.absensiTahfiz.gagalUpload'), t('tahfiz.absensiTahfiz.gagalMenguploadFile'));
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
      await updateSesiAbsensiTahfizAPI(selectedSesiForJurnal.id, {
        jurnal
      });

      showNotification('success', t('tahfiz.absensiTahfiz.jurnalDisimpan'),
        jurnalFile ? 'Jurnal mengajar dan file berhasil disimpan' : 'Jurnal mengajar berhasil disimpan'
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
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMenyimpanJurnal'));
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
      const absensiData: Partial<AbsensiPelajaran> = {
        id: editingAbsensi.id,
        muridId: editingAbsensi.muridId,
        status: editStatus,
        keterangan: editKeterangan,
        waktu: getLocalTimeISOString(),
        method: 'manual',
      };

      await apiService.addAbsensiToSesiTahfiz(selectedSesiForDetail.id, absensiData);
      await refreshSesiAbsensiTahfiz();

      showNotification('success', t('tahfiz.absensiTahfiz.absensiDiperbarui'), t('tahfiz.absensiTahfiz.dataAbsensiBerhasilDiperbarui'));
      setEditingAbsensi(null);
      setEditStatus('hadir');
      setEditKeterangan('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating absensi:', error);
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMemperbaruiAbsensi'));
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
        const absensiData: Partial<AbsensiPelajaran> = {
          id: attendance.id,
          muridId: attendance.muridId,
          status: attendance.status,
          keterangan: keteranganInput,
          waktu: getLocalTimeISOString(),
          method: 'manual',
        };

        await apiService.addAbsensiToSesiTahfiz(selectedSesi.id, absensiData);
        await refreshSesiAbsensiTahfiz();
        showNotification('success', t('tahfiz.absensiTahfiz.keteranganDisimpan'), t('tahfiz.absensiTahfiz.keteranganBerhasilDiperbarui'));
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error updating keterangan:', error);
        showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMemperbaruiKeterangan'));
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
    const today = new Date().toISOString().split('T')[0];
    const session = sesiAbsensiTahfiz.find(s => 
      s.jadwalId === jadwalId && 
      s.tanggal === today
    );

    if (!session) {
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.sesiTidakDitemukan'));
      return;
    }

    try {
      const updatedFotoMengajar = (session.fotoMengajar || []).filter(f => f.id !== fotoId);
      await updateSesiAbsensiTahfizAPI(session.id, {
        fotoMengajar: updatedFotoMengajar
      });
      await refreshSesiAbsensiTahfiz();
      showNotification('success', t('tahfiz.absensiTahfiz.fotoDihapus'), t('tahfiz.absensiTahfiz.fotoBuktiMengajarBerhasilDihapus'));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting photo:', error);
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMenghapusFoto'));
    }
  };

  // Handler untuk mengganti foto di SesiAbsensiTahfiz
  const handleReplacePhoto = async (fotoId: string, jadwalId: string, imageBase64: string) => {
    const today = new Date().toISOString().split('T')[0];
    const session = sesiAbsensiTahfiz.find(s => 
      s.jadwalId === jadwalId && 
      s.tanggal === today
    );

    if (!session) {
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.sesiTidakDitemukan'));
      return;
    }

    try {
      const existingFoto = session.fotoMengajar?.find(f => f.id === fotoId);
      if (!existingFoto) {
        showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.fotoTidakDitemukan'));
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
      showNotification('success', t('tahfiz.absensiTahfiz.fotoDiganti'), t('tahfiz.absensiTahfiz.fotoBuktiMengajarBerhasilDiganti'));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error replacing photo:', error);
      showNotification('error', t('tahfiz.absensiTahfiz.error'), t('tahfiz.absensiTahfiz.gagalMenggantiFoto'));
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
  };
};

