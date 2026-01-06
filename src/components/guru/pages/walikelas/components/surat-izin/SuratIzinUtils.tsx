import { SuratIzin, Absensi, SesiAbsensi, JadwalPelajaran } from '../../../../../../types';
import { isTimeOverlapping } from '../../../../../../utils/izinDispenMuridUtils';

const generateDateRange = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

export const updateAttendanceRecords = (
  surat: SuratIzin,
  sesiAbsensi: SesiAbsensi[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  setAbsensi: (absensi: Absensi[]) => void,
  kelasWali?: string
) => {
  // Get active tahun ajaran from localStorage
  const tahunAjaranString = localStorage.getItem('tahunAjaran');
  const tahunAjaran: any[] = tahunAjaranString ? JSON.parse(tahunAjaranString) : [];
  const activeTahunAjaran = tahunAjaran.find((ta: any) => ta.isActive);
  // Untuk izin dispen, hanya update jadwal pelajaran yang overlap dengan waktu dispen
  // Tidak update absen masuk/pulang
  if (surat.jenis === 'izin_dispen') {
    if (!surat.jamMulai || !surat.jamSelesai) {
      return; // Izin dispen harus ada jam mulai dan selesai
    }

    const tanggal = surat.tanggalMulai;
    let updatedAbsensi = [...absensi];

    // Hanya update jadwal pelajaran yang overlap dengan waktu izin dispen
    const sessionsOnDate = sesiAbsensi.filter(sesi => {
      const sesiDate = sesi.tanggal;
      const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);

      return jadwal &&
             jadwal.kelasId === kelasWali &&
             sesiDate === tanggal;
    });

    sessionsOnDate.forEach(sesi => {
      const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);
      if (!jadwal) return;

      // Cek apakah jadwal overlap dengan waktu izin dispen
      const isOverlapping = isTimeOverlapping(
        surat.jamMulai!,
        surat.jamSelesai!,
        jadwal.jamMulai,
        jadwal.jamSelesai
      );

      if (!isOverlapping) {
        return; // Skip jadwal yang tidak overlap
      }

      const existingSesiAbsensi = updatedAbsensi.find(a =>
        a.sesiId === sesi.id && a.muridId === surat.muridId
      );

      // Untuk izin dispen, hanya update jika belum ada atau status bukan 'hadir'
      if (sesi.status === 'ditutup' || existingSesiAbsensi?.status === 'hadir') {
        return;
      }

      const keterangan = `Izin dispen disetujui (${surat.jamMulai} - ${surat.jamSelesai})`;

      if (!existingSesiAbsensi) {
        const sesiAbsensiId = `absensi${Date.now()}-${sesi.id}-${surat.muridId}`;
        const newSesiAbsensi: Absensi = {
          id: sesiAbsensiId,
          sesiId: sesi.id,
          muridId: surat.muridId,
          status: 'izin',
          waktu: new Date().toISOString(),
          keterangan: keterangan,
          method: 'manual',
        };
        updatedAbsensi.push(newSesiAbsensi);
      } else {
        updatedAbsensi = updatedAbsensi.map(a =>
          a.id === existingSesiAbsensi.id
            ? { ...a, status: 'izin', keterangan }
            : a
        );
      }
    });

    setAbsensi(updatedAbsensi);
    return;
  }

  // Logika untuk izin/sakit biasa (tidak izin dispen)
  const attendanceStatus = surat.jenis === 'izin' ? 'izin' : 'sakit';
  const keterangan = `Surat ${surat.jenis} disetujui`;

  const dateRange = generateDateRange(surat.tanggalMulai, surat.tanggalSelesai);
  let updatedAbsensi = [...absensi];

  dateRange.forEach(tanggal => {
    const absensiId = `${tanggal}-${kelasWali}-${surat.muridId}`; // One record per day

    // Find today's absensi (one record per day in new structure)
    const existingAbsensi = updatedAbsensi.find(a => 
      a.muridId === surat.muridId && 
      a.tanggal === tanggal && 
      a.kelasId === kelasWali
    );

    // Backward compatibility: check old structure
    const oldMasuk = updatedAbsensi.find(a => a.id === `${tanggal}-${kelasWali}-masuk-${surat.muridId}`);
    const oldPulang = updatedAbsensi.find(a => a.id === `${tanggal}-${kelasWali}-pulang-${surat.muridId}`);

    const hasMasukHadirTerlambat = (existingAbsensi?.statusMasuk === 'tepat_waktu' || existingAbsensi?.statusMasuk === 'terlambat' || existingAbsensi?.statusMasuk === 'hadir') ||
      (oldMasuk && (oldMasuk.status === 'hadir' || oldMasuk.statusAbsen === 'terlambat'));

    const now = new Date().toISOString();
    const mapStatus = (status: string): 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa' | 'hadir' => {
      if (status === 'izin') return 'izin';
      if (status === 'sakit') return 'sakit';
      if (status === 'alfa') return 'alfa';
      return 'tepat_waktu';
    };

    if (existingAbsensi) {
      // Update existing record (one record per day)
      if (!hasMasukHadirTerlambat) {
        updatedAbsensi = updatedAbsensi.map(a =>
          a.id === existingAbsensi.id
            ? {
                ...a,
                jamMasuk: a.jamMasuk || now,
                statusMasuk: mapStatus(attendanceStatus),
                jamKeluar: a.jamKeluar || now,
                statusKeluar: mapStatus(attendanceStatus),
                keterangan: keterangan,
                // Legacy fields
                tipeAbsen: 'masuk',
                status: attendanceStatus,
                waktu: now,
              }
            : a
        );
      } else {
        // Only update pulang if masuk is already hadir
        updatedAbsensi = updatedAbsensi.map(a =>
          a.id === existingAbsensi.id
            ? {
                ...a,
                jamKeluar: a.jamKeluar || now,
                statusKeluar: mapStatus(attendanceStatus),
                keterangan: keterangan,
              }
            : a
        );
      }
    } else if (!hasMasukHadirTerlambat) {
      // Create new record (one document per day)
      const newAbsensi: Absensi = {
        id: absensiId,
        muridId: surat.muridId,
        tanggal: tanggal,
        kelasId: kelasWali || '',
        jamMasuk: now,
        jamKeluar: now,
        statusMasuk: mapStatus(attendanceStatus),
        statusKeluar: mapStatus(attendanceStatus),
        method: 'manual',
        keterangan: keterangan,
        tahunAjaranId: activeTahunAjaran?.id || '',
        semester: activeTahunAjaran?.semester || 1,
        // Legacy fields for backward compatibility
        tipeAbsen: 'masuk',
        status: attendanceStatus,
        waktu: now,
      };
      updatedAbsensi.push(newAbsensi);
    }

    const sessionsOnDate = sesiAbsensi.filter(sesi => {
      const sesiDate = sesi.tanggal;
      const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);

      return jadwal &&
             jadwal.kelasId === kelasWali &&
             sesiDate === tanggal;
    });

    sessionsOnDate.forEach(sesi => {
      const existingSesiAbsensi = updatedAbsensi.find(a =>
        a.sesiId === sesi.id && a.muridId === surat.muridId
      );

      if (sesi.status === 'ditutup' || existingSesiAbsensi?.status === 'hadir') {
        return;
      }

      if (!existingSesiAbsensi) {
        const sesiAbsensiId = `absensi${Date.now()}-${sesi.id}-${surat.muridId}`;
        const newSesiAbsensi: Absensi = {
          id: sesiAbsensiId,
          sesiId: sesi.id,
          muridId: surat.muridId,
          status: attendanceStatus,
          waktu: new Date().toISOString(),
          keterangan: keterangan,
          method: 'manual',
        };
        updatedAbsensi.push(newSesiAbsensi);
      } else {
        updatedAbsensi = updatedAbsensi.map(a =>
          a.id === existingSesiAbsensi.id
            ? { ...a, status: attendanceStatus, keterangan }
            : a
        );
      }
    });
  });

  setAbsensi(updatedAbsensi);
};
