import { useState, useRef, useEffect } from 'react';
import { JadwalPelajaran, SesiAbsensi, Absensi, AbsensiPelajaran, User, AbsensiGuru, FotoMengajar, JurnalMengajar, SuratIzin, TahunAjaran, RiwayatKelasMurid } from '../../../../../../types';
import { parseQRCodeData, generateSubjectQRCodeData, generateQRCodeURL } from '../../../../../../utils/qrCodeGenerator';
import { showNotification, sendWhatsAppNotification as sendWhatsApp } from './kelolaAbsensiUtils';
import { ensureMultipleRiwayatKelasMurid } from '../../../../../../utils/riwayatKelasMuridUtils';
import { apiService } from '../../../../../../services/apiService';
import { getLocalTimeISOString } from '../../../../../../utils/absensiUtils';

export const useKelolaAbsensiHandlers = (
  user: any,
  mySchedules: JadwalPelajaran[],
  sesiAbsensi: SesiAbsensi[],
  refreshSesiAbsensi: () => Promise<void>,
  createSesiAbsensiAPI: (sesi: Partial<SesiAbsensi>) => Promise<SesiAbsensi>,
  updateSesiAbsensiAPI: (id: string, sesi: Partial<SesiAbsensi>) => Promise<SesiAbsensi>,
  absensi: Absensi[],
  refreshAbsensi: () => Promise<void>,
  createAbsensiAPI: (absensi: Partial<Absensi>) => Promise<Absensi>,
  updateAbsensiAPI: (id: string, absensi: Partial<Absensi>) => Promise<Absensi>,
  absensiGuru: AbsensiGuru[],
  refreshAbsensiGuru: () => Promise<void>,
  createAbsensiGuruAPI: (absensi: Partial<AbsensiGuru>) => Promise<AbsensiGuru>,
  updateAbsensiGuruAPI: (id: string, absensi: Partial<AbsensiGuru>) => Promise<AbsensiGuru>,
  jadwalPelajaran: JadwalPelajaran[],
  users: User[],
  kelas: any[],
  mataPelajaran: any[],
  getJadwalInfo: (jadwalId: string) => { kelas: string; mapel: string },
  getMuridsByKelas: (kelasId: string) => User[],
  tahunAjaran: TahunAjaran[],
  riwayatKelasMurid: RiwayatKelasMurid[],
  refreshRiwayatKelasMurid: () => Promise<void>,
  bulkCreateRiwayatKelasMurid: (riwayatList: Partial<RiwayatKelasMurid>[]) => Promise<RiwayatKelasMurid[]>,
  getSuratIzinForMurid: (muridId: string, jadwalId?: string) => SuratIzin | undefined
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsensi | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedJadwalForPhoto, setSelectedJadwalForPhoto] = useState<JadwalPelajaran | null>(null);
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [subjectQRCodeURL, setSubjectQRCodeURL] = useState<string>('');
  const [isSubjectQRModalOpen, setIsSubjectQRModalOpen] = useState(false);
  const [selectedSesiForQR, setSelectedSesiForQR] = useState<SesiAbsensi | null>(null);
  const [isDetailSuratModalOpen, setIsDetailSuratModalOpen] = useState(false);
  const [selectedSuratDetail, setSelectedSuratDetail] = useState<SuratIzin | null>(null);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [selectedSesiForJurnal, setSelectedSesiForJurnal] = useState<SesiAbsensi | null>(null);
  const [jurnalJudul, setJurnalJudul] = useState('');
  const [jurnalDeskripsi, setJurnalDeskripsi] = useState('');
  const [jurnalFile, setJurnalFile] = useState<File | null>(null);
  const [isDetailAbsensiModalOpen, setIsDetailAbsensiModalOpen] = useState(false);
  const [selectedSesiForDetail, setSelectedSesiForDetail] = useState<SesiAbsensi | null>(null);
  const [editingAbsensi, setEditingAbsensi] = useState<AbsensiPelajaran | null>(null);
  const [editStatus, setEditStatus] = useState<'hadir' | 'izin' | 'sakit' | 'alfa'>('hadir');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [isKeteranganModalOpen, setIsKeteranganModalOpen] = useState(false);
  const [selectedMuridForKeterangan, setSelectedMuridForKeterangan] = useState<User | null>(null);
  const [keteranganInput, setKeteranganInput] = useState('');
  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const scrollPositionRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const SCAN_DEBOUNCE_TIME = 2000;
  const today = new Date().toISOString().split('T')[0];

  // Sync selectedSesi with latest data from sesiAbsensi
  useEffect(() => {
    if (selectedSesi) {
      const updatedSesi = sesiAbsensi.find(s => s.id === selectedSesi.id);
      if (updatedSesi) {
        setSelectedSesi(updatedSesi);
      }
    }
  }, [sesiAbsensi, selectedSesi?.id]);

  const openSession = async (jadwalId: string) => {
    const jadwal = mySchedules.find(j => j.id === jadwalId);
    if (!jadwal) return;

    const activeTahunAjaran = tahunAjaran.find(
      ta => ta.tahun === jadwal.tahunAjaran && ta.semester === jadwal.semester && ta.isActive
    );

    if (!activeTahunAjaran) {
      showNotification('error', 'Tahun Ajaran Tidak Aktif',
        'Tidak dapat membuka sesi karena tahun ajaran tidak aktif');
      return;
    }

    const todayDate = new Date(today);
    const startDate = new Date(activeTahunAjaran.tanggalMulai);
    const endDate = new Date(activeTahunAjaran.tanggalSelesai);

    if (todayDate < startDate) {
      showNotification('error', 'Belum Memasuki Periode Akademik',
        `Sesi tidak dapat dibuka karena belum memasuki periode akademik. Periode dimulai pada ${new Date(activeTahunAjaran.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`);
      return;
    }

    if (todayDate > endDate) {
      showNotification('error', 'Periode Akademik Sudah Berakhir',
        `Sesi tidak dapat dibuka karena periode akademik telah berakhir pada ${new Date(activeTahunAjaran.tanggalSelesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`);
      return;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    if (currentTime >= jadwal.jamSelesai) {
      showNotification('error', 'Waktu Sudah Berlalu',
        `Tidak dapat membuka sesi karena waktu pelajaran sudah berakhir (${jadwal.jamSelesai})`);
      return;
    }

    const startTime = jadwal.jamMulai;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const currentMinutes = currentHour * 60 + currentMin;
    const timeDiff = startMinutes - currentMinutes;

    if (timeDiff > 30) {
      showNotification('warning', 'Terlalu Awal',
        `Sesi dapat dibuka maksimal 30 menit sebelum jam pelajaran dimulai (${startTime})`);
      return;
    }

    const muridList = getMuridsByKelas(jadwal.kelasId);
    const muridIds = muridList.map(m => m.id);
    // Ensure riwayat kelas murid via API
    const existingRiwayat = riwayatKelasMurid.filter(r =>
      muridIds.includes(r.muridId) &&
      r.kelasId === jadwal.kelasId &&
      r.tahunAjaran === activeTahunAjaran.id &&
      r.semester === activeTahunAjaran.semester
    );

    const missingRiwayat = muridIds
      .filter(muridId => !existingRiwayat.some(r => r.muridId === muridId))
      .map(muridId => ({
        muridId,
        kelasId: jadwal.kelasId,
        tahunAjaran: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
        status: 'aktif' as const,
      }));

    if (missingRiwayat.length > 0) {
      try {
        await bulkCreateRiwayatKelasMurid(missingRiwayat);
        await refreshRiwayatKelasMurid();
      } catch (error) {
        console.error('Error creating riwayat kelas murid:', error);
      }
    }

    const newSesi: Partial<SesiAbsensi> = {
      id: `sesi${Date.now()}`,
      jadwalId,
      tanggal: today,
      jamBuka: new Date().toLocaleTimeString('id-ID', { hour12: false }),
      status: 'dibuka',
      createdBy: user?.id || '',
      tahunAjaranId: activeTahunAjaran.id,
      semester: activeTahunAjaran.semester,
    };
    
    try {
      const createdSesi = await createSesiAbsensiAPI(newSesi);
      // Force refresh to get updated data from server
      await refreshSesiAbsensi();
      showNotification('success', 'Sesi Dibuka',
        `Sesi absensi untuk ${getJadwalInfo(jadwalId).mapel} berhasil dibuka`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating session:', error);
      showNotification('error', 'Error', 'Gagal membuka sesi absensi');
    }
  };

  const closeSession = async (sesiId: string) => {
    const session = sesiAbsensi.find(s => s.id === sesiId);
    if (!session) return;

    const jadwal = jadwalPelajaran.find(j => j.id === session.jadwalId);
    if (!jadwal) return;

    const muridList = getMuridsByKelas(jadwal.kelasId);
    const newAbsensiRecords: Partial<AbsensiPelajaran>[] = [];

    // Check existing absensi for this session
    const existingAbsensiMap = new Map(
      (session.dataAbsensi || []).map(a => [a.muridId, a])
    );

    // Find murid who don't have absensi
    muridList.forEach(murid => {
      if (!existingAbsensiMap.has(murid.id)) {
        const alfaAbsensi: Partial<AbsensiPelajaran> = {
          id: `absensi-alfa-${murid.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          muridId: murid.id,
          status: 'alfa',
          waktu: getLocalTimeISOString(),
          keterangan: 'Absen masuk manual oleh wali kelas - alfa',
          method: 'manual',
        };
        newAbsensiRecords.push(alfaAbsensi);
      }
    });

    try {
      // Update session status via API
      await updateSesiAbsensiAPI(sesiId, {
        status: 'ditutup',
        jamTutup: new Date().toLocaleTimeString('id-ID', { hour12: false })
      });

      // Bulk add alfa absensi if any
      if (newAbsensiRecords.length > 0) {
        await apiService.bulkAddAbsensiToSesi(sesiId, newAbsensiRecords);
        showNotification('info', 'Sesi Ditutup', `${newAbsensiRecords.length} murid yang tidak absen otomatis ditandai alfa.`);
      } else {
        showNotification('success', 'Sesi Ditutup', 'Sesi absensi telah ditutup.');
      }

      await refreshSesiAbsensi();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error closing session:', error);
      showNotification('error', 'Error', 'Gagal menutup sesi');
    }
  };

  const handleManualAttendance = (sesi: SesiAbsensi) => {
    setSelectedSesi(sesi);
    setIsModalOpen(true);
  };

  const handleShowSubjectQR = async (sesi: SesiAbsensi) => {
    const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);
    if (!jadwal) return;

    const qrData = generateSubjectQRCodeData(
      sesi.id,
      sesi.jadwalId,
      jadwal.mataPelajaranId,
      jadwal.guruId,
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

  const handleTakePhoto = (jadwal: JadwalPelajaran) => {
    setSelectedJadwalForPhoto(jadwal);
    setIsCameraOpen(true);
  };

  const handlePhotoCapture = async (imageBase64: string) => {
    if (!selectedJadwalForPhoto || !user) return;

    const todayAbsensi = absensiGuru.find(a => a.guruId === user.id && a.tanggal === today);

    const newFoto: FotoMengajar = {
      id: `foto-${Date.now()}`,
      jadwalId: selectedJadwalForPhoto.id,
      mataPelajaranId: selectedJadwalForPhoto.mataPelajaranId,
      kelasId: selectedJadwalForPhoto.kelasId,
      fotoBase64: imageBase64,
      waktuFoto: new Date().toISOString(),
      keterangan: `Foto bukti mengajar ${getJadwalInfo(selectedJadwalForPhoto.id).mapel} di kelas ${getJadwalInfo(selectedJadwalForPhoto.id).kelas}`
    };

    // Get active tahun ajaran
    const activeTA = tahunAjaran.find(ta => ta.isActive);
    if (!activeTA) {
      alert('Tidak ada tahun ajaran aktif');
      return;
    }

    try {
      if (todayAbsensi) {
        // Update existing absensi guru
        const updatedFotoMengajar = [...(todayAbsensi.fotoMengajar || []), newFoto];
        await updateAbsensiGuruAPI(todayAbsensi.id, {
          fotoMengajar: updatedFotoMengajar
        });
        await refreshAbsensiGuru();
      } else {
        // Create new absensi guru
        const newAbsensi: Partial<AbsensiGuru> = {
          id: `absensi-guru-foto-${Date.now()}`,
          guruId: user.id,
          tanggal: today,
          statusMasuk: 'tidak_masuk',
          statusKeluar: 'tidak_keluar',
          fotoMengajar: [newFoto],
          keterangan: 'Foto bukti mengajar',
          tahunAjaranId: activeTA.id,
          semester: activeTA.semester,
          createdAt: new Date().toISOString(),
        };
        await createAbsensiGuruAPI(newAbsensi);
        await refreshAbsensiGuru();
      }

      alert('Foto bukti mengajar berhasil disimpan!');
      setSelectedJadwalForPhoto(null);
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Gagal menyimpan foto bukti mengajar');
    }
  };

  const markAttendance = async (muridId: string, status: 'hadir' | 'izin' | 'sakit' | 'alfa', keteranganAbsen?: string) => {
    if (!selectedSesi) return;

    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }

    // Check if absensi already exists in sesi
    const existingAbsensi = selectedSesi.dataAbsensi?.find(a => a.muridId === muridId);

    try {
      const absensiData: Partial<AbsensiPelajaran> = {
        id: existingAbsensi?.id || `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId,
        status,
        waktu: getLocalTimeISOString(),
        keterangan: keteranganAbsen,
        method: 'manual',
      };

      // Save to sesi dataAbsensi array
      await apiService.addAbsensiToSesi(selectedSesi.id, absensiData);
      await refreshSesiAbsensi();

      setSelectedMurid(null);
      setKeterangan('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error marking attendance:', error);
      showNotification('error', 'Error', 'Gagal menyimpan absensi');
    }
  };

  const markAllPresent = async () => {
    if (!selectedSesi) return;

    const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId);
    if (!jadwal) return;

    const muridList = getMuridsByKelas(jadwal.kelasId);
    const timestamp = getLocalTimeISOString();
    const absensiList: Partial<AbsensiPelajaran>[] = [];

    // Get existing absensi for this session
    const existingAbsensiMap = new Map(
      (selectedSesi.dataAbsensi || []).map(a => [a.muridId, a])
    );

    // Prepare absensi data for all murid
    muridList.forEach(murid => {
      const existingAbsensi = existingAbsensiMap.get(murid.id);
      
      // Check if murid has surat izin
      const suratIzin = getSuratIzinForMurid(murid.id, selectedSesi.jadwalId);
      
      // Determine status: preserve izin/sakit/izin-dispen if exists
      let status: 'hadir' | 'izin' | 'sakit' | 'alfa' = 'hadir';
      let keterangan = 'Absen masuk manual - hadir semua';
      
      if (suratIzin) {
        // If murid has surat izin, use the appropriate status
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
        // If murid already has izin/sakit status, preserve it
        if (existingAbsensi.status === 'izin' || existingAbsensi.status === 'sakit') {
          status = existingAbsensi.status;
          keterangan = existingAbsensi.keterangan || keterangan;
        }
      }
      
      absensiList.push({
        id: existingAbsensi?.id || `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: murid.id,
        status,
        waktu: timestamp,
        keterangan,
        method: 'manual',
      });
    });

    // Bulk add/update absensi to sesi
    if (absensiList.length > 0) {
      try {
        await apiService.bulkAddAbsensiToSesi(selectedSesi.id, absensiList);
        await refreshSesiAbsensi();

        const hadirCount = absensiList.filter(a => a.status === 'hadir').length;
        const izinCount = absensiList.filter(a => a.status === 'izin').length;
        const sakitCount = absensiList.filter(a => a.status === 'sakit').length;
        
        let message = `${hadirCount} murid ditandai hadir`;
        if (izinCount > 0) message += `, ${izinCount} murid tetap izin`;
        if (sakitCount > 0) message += `, ${sakitCount} murid tetap sakit`;
        
        showNotification('success', 'Absensi Diperbarui', message);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error creating bulk absensi:', error);
        showNotification('error', 'Error', 'Gagal menandai semua murid hadir');
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
      showNotification('error', 'QR Code Tidak Valid', 'QR Code tidak valid atau sesi tidak ditemukan!');
      return;
    }

    const murid = users.find(u => u.id === parsed.muridId && u.role === 'murid') ||
      users.find(u => parsed.nisn && u.nisn === parsed.nisn && u.role === 'murid');
    if (!murid) {
      showNotification('error', 'Murid Tidak Ditemukan', 'Murid tidak ditemukan dalam sistem!');
      return;
    }

    const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId);
    const muridKelasId = murid.kelasId || parsed.kelasId;
    if (!jadwal || muridKelasId !== jadwal.kelasId) {
      showNotification('error', 'Kelas Tidak Sesuai', 'Murid bukan dari kelas ini!');
      return;
    }

    // Check if absensi already exists in sesi
    const existingAbsensi = selectedSesi.dataAbsensi?.find(a => a.muridId === murid.id);

    if (existingAbsensi) {
      showNotification('warning', 'Sudah Absen', `${murid.name} sudah melakukan absensi!`);
      return;
    }

    try {
      const absensiData: Partial<AbsensiPelajaran> = {
        id: `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: murid.id,
        status: 'hadir',
        waktu: getLocalTimeISOString(),
        keterangan: 'Absen via QR Code',
        method: 'qr',
      };

      await apiService.addAbsensiToSesi(selectedSesi.id, absensiData);
      await refreshSesiAbsensi();

      showNotification('success', 'Absensi Berhasil!', `${murid.name} - ${murid.nisn}`);
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

  const handleMarkWithSurat = (muridId: string, surat: SuratIzin) => {
    // Untuk izin dispen, status tetap 'izin'
    const status = surat.jenis === 'izin_dispen' || surat.jenis === 'izin' ? 'izin' : 'sakit';
    const keterangan = surat.jenis === 'izin_dispen' 
      ? `Izin dispen disetujui (${surat.jamMulai} - ${surat.jamSelesai})`
      : `Surat ${surat.jenis} disetujui`;
    markAttendance(muridId, status, keterangan);
  };

  const [existingJurnalFile, setExistingJurnalFile] = useState<{ name: string; type: string; data: string; size: number } | undefined>(undefined);

  const handleOpenJurnalModal = async (sesi: SesiAbsensi) => {
    setSelectedSesiForJurnal(sesi);
    
    try {
      // Get jadwal info to get kelasId
      const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);
      if (!jadwal) {
        // If jadwal not found, clear and open modal
        setJurnalJudul('');
        setJurnalDeskripsi('');
        setExistingJurnalFile(undefined);
        setJurnalFile(null);
        setIsJurnalModalOpen(true);
        return;
      }

      // Fetch jurnal from jurnal collection
      const jurnalResponse = await apiService.getJurnalByJadwalIdAndTanggal(
        sesi.jadwalId,
        sesi.tanggal,
        jadwal.kelasId
      );

      if (jurnalResponse.success && jurnalResponse.jurnal) {
        // Set jurnal data from collection
        setJurnalJudul(jurnalResponse.jurnal.judul);
        setJurnalDeskripsi(jurnalResponse.jurnal.deskripsi);
        setExistingJurnalFile(jurnalResponse.jurnal.file);
      } else {
        // No jurnal found, clear fields
        setJurnalJudul('');
        setJurnalDeskripsi('');
        setExistingJurnalFile(undefined);
      }
    } catch (error) {
      console.error('Error fetching jurnal:', error);
      // On error, clear fields and open modal anyway
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
      showNotification('warning', 'Data Tidak Lengkap', 'Judul dan deskripsi jurnal harus diisi');
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
        showNotification('error', 'Gagal Upload', 'Gagal mengupload file. Silakan coba lagi.');
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
      // Get jadwal info
      const jadwal = jadwalPelajaran.find(j => j.id === selectedSesiForJurnal.jadwalId);
      if (!jadwal) {
        throw new Error('Jadwal tidak ditemukan');
      }

      // Get tahun ajaran info
      const activeTA = tahunAjaran.find(ta => ta.tahun === jadwal.tahunAjaran && ta.semester === jadwal.semester);
      if (!activeTA) {
        throw new Error('Tahun ajaran tidak ditemukan');
      }

      // Check if jurnal exists
      const existingJurnal = await apiService.getJurnalByJadwalIdAndTanggal(
        selectedSesiForJurnal.jadwalId,
        selectedSesiForJurnal.tanggal,
        jadwal.kelasId
      );

      if (existingJurnal.success && existingJurnal.jurnal) {
        // Update existing jurnal pertemuan
        await apiService.updateJurnal(existingJurnal.jurnal.id, {
          tanggal: selectedSesiForJurnal.tanggal,
          judul: jurnal.judul,
          deskripsi: jurnal.deskripsi,
          waktuInput: new Date().toISOString(),
          file: jurnal.file,
        });
      } else {
        // Create new jurnal
        const jurnalId = `jurnal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await apiService.createJurnal({
          id: jurnalId,
          jadwalId: selectedSesiForJurnal.jadwalId,
          kelasId: jadwal.kelasId,
          tanggal: selectedSesiForJurnal.tanggal,
          judul: jurnal.judul,
          deskripsi: jurnal.deskripsi,
          waktuInput: new Date().toISOString(),
          file: jurnal.file,
          tahunAjaranId: activeTA.id,
          semester: activeTA.semester,
        });
      }

      showNotification('success', 'Jurnal Disimpan',
        jurnalFile ? 'Jurnal mengajar dan file berhasil disimpan' : 'Jurnal mengajar berhasil disimpan'
      );

      // Dispatch event to trigger refresh in JadwalCard
      window.dispatchEvent(new Event('jurnal-saved'));

      setIsJurnalModalOpen(false);
      setSelectedSesiForJurnal(null);
      setJurnalJudul('');
      setJurnalDeskripsi('');
      setJurnalFile(null);
      setExistingJurnalFile(undefined);
    } catch (error) {
      console.error('Error saving jurnal:', error);
      showNotification('error', 'Error', 'Gagal menyimpan jurnal');
    }
  };

  const handleOpenDetailAbsensi = (sesi: SesiAbsensi) => {
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

      await apiService.addAbsensiToSesi(selectedSesiForDetail.id, absensiData);
      await refreshSesiAbsensi();

      showNotification('success', 'Absensi Diperbarui', 'Data absensi berhasil diperbarui');
      setEditingAbsensi(null);
      setEditStatus('hadir');
      setEditKeterangan('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating absensi:', error);
      showNotification('error', 'Error', 'Gagal memperbarui absensi');
    }
  };

  const openInputKeteranganModal = (murid: User, getAttendanceStatus: (muridId: string, sesiId: string) => Absensi | undefined) => {
    setSelectedMuridForKeterangan(murid);
    if (selectedSesi) {
      const attendance = getAttendanceStatus(murid.id, selectedSesi.id);
      if (attendance && attendance.keterangan) {
        setKeteranganInput(attendance.keterangan);
      } else {
        setKeteranganInput('');
      }
    }
    setIsKeteranganModalOpen(true);
  };

  const handleSaveKeteranganInput = async (getAttendanceStatus: (muridId: string, sesiId: string) => AbsensiPelajaran | undefined) => {
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

        await apiService.addAbsensiToSesi(selectedSesi.id, absensiData);
        await refreshSesiAbsensi();
        showNotification('success', 'Keterangan Disimpan', 'Keterangan berhasil diperbarui');
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error updating keterangan:', error);
        showNotification('error', 'Error', 'Gagal memperbarui keterangan');
      }
    }

    setIsKeteranganModalOpen(false);
    setSelectedMuridForKeterangan(null);
    setKeteranganInput('');
  };

  const sendWhatsAppNotification = (murid: User, status: string, mataPelajaranName: string) => {
    sendWhatsApp(murid, status, mataPelajaranName, users, kelas);
  };

  const handleRemoveExistingFile = () => {
    setExistingJurnalFile(undefined);
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
    selectedMurid,
    keterangan,
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
  };
};
