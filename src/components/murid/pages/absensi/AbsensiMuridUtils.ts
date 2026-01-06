import { JadwalPelajaran, SesiAbsensi, Absensi, MataPelajaran, User, Kelas, TahunAjaran } from '../../../../types';
import { getMinTingkat, getMaxTingkat, formatTingkatKelas, shouldShowJurusanSync } from '../../../../utils/jenjangPendidikanUtils';

export const getKelasForTahunAjaran = (
  currentKelasId: string,
  targetTahunAjaran: string,
  kelas: Kelas[],
  activeTahunAjaran?: TahunAjaran
) => {
  const currentKelas = kelas.find(k => k.id === currentKelasId);
  if (!currentKelas) return null;

  if (targetTahunAjaran === activeTahunAjaran?.tahun) {
    return currentKelas;
  }

  const currentYear = parseInt(activeTahunAjaran?.tahun.split('/')[0] || '2024');
  const targetYear = parseInt(targetTahunAjaran.split('/')[0]);
  const yearDiff = currentYear - targetYear;

  const targetTingkat = currentKelas.tingkat - yearDiff;

  const minTingkat = getMinTingkat();
  const maxTingkat = getMaxTingkat();

  if (targetTingkat < minTingkat || targetTingkat > maxTingkat) {
    return null;
  }

  const showJurusan = shouldShowJurusanSync();

  const targetKelas = kelas.find(k => {
    if (k.tingkat !== targetTingkat) return false;

    if (showJurusan && currentKelas.jurusanId) {
      return k.jurusanId === currentKelas.jurusanId &&
        k.name.includes(currentKelas.name.split(' ').slice(1).join(' '));
    } else {
      return k.name.includes(currentKelas.name.split(' ').slice(1).join(' '));
    }
  });

  return targetKelas || {
    ...currentKelas,
    id: `virtual-${currentKelas.id}-${targetTingkat}`,
    name: `${formatTingkatKelas(targetTingkat)} ${currentKelas.name.split(' ').slice(1).join(' ')}`,
    tingkat: targetTingkat,
    jurusanId: showJurusan ? currentKelas.jurusanId : undefined
  };
};

export const getJadwalInfo = (
  jadwalId: string,
  jadwalPelajaran: JadwalPelajaran[],
  mataPelajaran: MataPelajaran[],
  users: User[]
) => {
  const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
  if (!jadwal) return { mapel: 'Unknown', guru: 'Unknown', waktu: 'Unknown' };

  const mapelName = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId)?.name || 'Unknown';
  const guruName = users.find(u => u.id === jadwal.guruId)?.name || 'Unknown';
  const waktu = `${jadwal.jamMulai} - ${jadwal.jamSelesai}`;

  return { mapel: mapelName, guru: guruName, waktu };
};

// This function now needs to receive absensi data as parameter
// since we're using hooks instead of localStorage
// PRIMARY SOURCE: sesi.dataAbsensi (absensi pelajaran)
// FALLBACK: Absensi collection (for backward compatibility)
export const getAttendanceStatus = (
  sesiId: string,
  userId?: string,
  absensiData?: Absensi[],
  sesiAbsensi?: SesiAbsensi[],
  jadwalPelajaran?: JadwalPelajaran[]
): Absensi | undefined => {
  if (!userId) return undefined;

  // First, try to get from sesi.dataAbsensi (absensi pelajaran) - PRIMARY SOURCE
  if (sesiAbsensi) {
    const session = sesiAbsensi.find(s => s.id === sesiId);
    if (session?.dataAbsensi) {
      const absensiPelajaran = session.dataAbsensi.find(a => a.muridId === userId);
      if (absensiPelajaran) {
        // Get kelasId from jadwal if available
        let kelasId = '';
        if (jadwalPelajaran && session.jadwalId) {
          const jadwal = jadwalPelajaran.find(j => j.id === session.jadwalId);
          if (jadwal) {
            kelasId = jadwal.kelasId;
          }
        }

        // Convert AbsensiPelajaran to Absensi format for compatibility
        return {
          id: absensiPelajaran.id,
          sesiId: sesiId,
          muridId: absensiPelajaran.muridId,
          tanggal: session.tanggal,
          kelasId: kelasId,
          tipeAbsen: 'masuk',
          status: absensiPelajaran.status,
          waktu: absensiPelajaran.waktu,
          keterangan: absensiPelajaran.keterangan,
          method: absensiPelajaran.method,
          tahunAjaranId: session.tahunAjaranId || '',
          semester: session.semester || 1,
          statusAbsen: absensiPelajaran.statusAbsen,
          keteranganAbsensi: absensiPelajaran.keteranganAbsensi,
        } as Absensi;
      }
    }
  }

  // Fallback to Absensi collection if not found in sesi.dataAbsensi
  if (absensiData) {
    return absensiData.find((a: Absensi) => a.muridId === userId && a.sesiId === sesiId);
  }

  return undefined;
};

export const getFilteredSessions = (
  sesiAbsensi: SesiAbsensi[],
  mySchedules: JadwalPelajaran[],
  selectedMonth: number,
  selectedYear: number,
  activeTahunAjaran?: TahunAjaran
) => {
  const filteredSessions = sesiAbsensi.filter(s => {
    const sesiDate = new Date(s.tanggal);
    const sesiMonth = sesiDate.getMonth() + 1;
    const sesiYear = sesiDate.getFullYear();

    const belongsToMySchedule = mySchedules.some(j => j.id === s.jadwalId);

    let isInTahunAjaran = true;
    if (activeTahunAjaran) {
      isInTahunAjaran = s.tanggal >= activeTahunAjaran.tanggalMulai &&
                        s.tanggal <= activeTahunAjaran.tanggalSelesai;
    }

    return belongsToMySchedule &&
           sesiMonth === selectedMonth &&
           sesiYear === selectedYear &&
           isInTahunAjaran;
  });

  return filteredSessions.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
};

export const getAvailableTahunAjaran = (tahunAjaran: TahunAjaran[]) => {
  return Array.from(
    new Map(tahunAjaran.map(ta => [ta.tahun, ta])).values()
  ).sort((a, b) => {
    const yearA = parseInt(a.tahun.split('/')[0]);
    const yearB = parseInt(b.tahun.split('/')[0]);
    return yearB - yearA;
  });
};

export const getAvailableSemesters = (tahunAjaranValue: string, tahunAjaran: TahunAjaran[]) => {
  return tahunAjaran
    .filter(ta => ta.tahun === tahunAjaranValue)
    .sort((a, b) => a.semester - b.semester);
};

export const getAvailableMonthsYears = (activeTahunAjaran?: TahunAjaran) => {
  if (!activeTahunAjaran) {
    const currentDate = new Date();
    return {
      months: [currentDate.getMonth() + 1],
      years: [currentDate.getFullYear()]
    };
  }

  const startDate = new Date(activeTahunAjaran.tanggalMulai);
  const endDate = new Date(activeTahunAjaran.tanggalSelesai);

  const monthsYearsSet = new Set<string>();
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    monthsYearsSet.add(`${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const monthsYears = Array.from(monthsYearsSet).map(my => {
    const [year, month] = my.split('-').map(Number);
    return { year, month };
  });

  const years = Array.from(new Set(monthsYears.map(my => my.year))).sort();
  const months = Array.from(new Set(monthsYears.map(my => my.month))).sort();

  return { months, years, monthsYears };
};
