import { Absensi, SesiAbsensi, JadwalPelajaran, TahunAjaran, RiwayatKelasMurid, User, AbsensiGuru, IzinGuru, SuratIzin } from '../types';

export const migrateAbsensiData = (
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  jadwalPelajaran: JadwalPelajaran[],
  tahunAjaran: TahunAjaran[],
  users: User[]
): {
  updatedAbsensi: Absensi[];
  updatedSesiAbsensi: SesiAbsensi[];
  riwayatKelasMurid: RiwayatKelasMurid[];
} => {
  const updatedSesiAbsensi = sesiAbsensi.map(sesi => {
    if (sesi.tahunAjaranId && sesi.semester !== undefined) return sesi;

    const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);
    if (!jadwal) return sesi;

    const tahunAjaranData = tahunAjaran.find(
      ta => ta.tahun === jadwal.tahunAjaran && ta.semester === jadwal.semester
    );

    if (!tahunAjaranData) return sesi;

    return {
      ...sesi,
      tahunAjaranId: tahunAjaranData.id,
      semester: tahunAjaranData.semester,
    };
  });

  const updatedAbsensi = absensi.map(abs => {
    if (abs.tahunAjaranId && abs.kelasId && abs.semester !== undefined) return abs;

    const sesi = updatedSesiAbsensi.find(s => s.id === abs.sesiId);
    if (!sesi) return abs;

    const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);
    if (!jadwal) return abs;

    const tahunAjaranData = tahunAjaran.find(ta => ta.id === sesi.tahunAjaranId);

    return {
      ...abs,
      tahunAjaranId: sesi.tahunAjaranId,
      kelasId: jadwal.kelasId,
      semester: sesi.semester,
    };
  });

  const riwayatKelasMuridMap = new Map<string, RiwayatKelasMurid>();

  updatedAbsensi.forEach(abs => {
    if (!abs.tahunAjaranId || !abs.kelasId) return;

    const murid = users.find(u => u.id === abs.muridId && u.role === 'murid');
    if (!murid) return;

    const tahunAjaranData = tahunAjaran.find(ta => ta.id === abs.tahunAjaranId);
    if (!tahunAjaranData) return;

    const key = `${abs.muridId}-${abs.kelasId}-${abs.tahunAjaranId}-${tahunAjaranData.semester}`;

    if (!riwayatKelasMuridMap.has(key)) {
      const riwayat: RiwayatKelasMurid = {
        id: `riwayat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: abs.muridId,
        kelasId: abs.kelasId,
        tahunAjaran: abs.tahunAjaranId,
        semester: tahunAjaranData.semester,
        status: 'aktif',
        createdAt: new Date().toISOString(),
      };
      riwayatKelasMuridMap.set(key, riwayat);
    }
  });

  return {
    updatedAbsensi,
    updatedSesiAbsensi,
    riwayatKelasMurid: Array.from(riwayatKelasMuridMap.values()),
  };
};

export const migrateAbsensiGuruData = (
  absensiGuru: AbsensiGuru[],
  tahunAjaran: TahunAjaran[]
): AbsensiGuru[] => {
  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
  if (!activeTahunAjaran) return absensiGuru;

  return absensiGuru.map(abs => {
    if (abs.tahunAjaranId && abs.semester !== undefined) return abs;

    return {
      ...abs,
      tahunAjaranId: activeTahunAjaran.id,
      semester: activeTahunAjaran.semester,
    };
  });
};

export const migrateIzinGuruData = (
  izinGuru: IzinGuru[],
  tahunAjaran: TahunAjaran[]
): IzinGuru[] => {
  return izinGuru.map(izin => {
    if (izin.tahunAjaranId) return izin;

    const tahunAjaranForDate = tahunAjaran.find(ta =>
      izin.tanggalMulai >= ta.tanggalMulai && izin.tanggalMulai <= ta.tanggalSelesai
    );

    if (!tahunAjaranForDate) {
      const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
      if (!activeTahunAjaran) return izin;
      return { ...izin, tahunAjaranId: activeTahunAjaran.id };
    }

    return { ...izin, tahunAjaranId: tahunAjaranForDate.id };
  });
};

export const migrateSuratIzinData = (
  suratIzin: SuratIzin[],
  tahunAjaran: TahunAjaran[]
): SuratIzin[] => {
  return suratIzin.map(surat => {
    if (surat.tahunAjaranId) return surat;

    const tahunAjaranForDate = tahunAjaran.find(ta =>
      surat.tanggalMulai >= ta.tanggalMulai && surat.tanggalMulai <= ta.tanggalSelesai
    );

    if (!tahunAjaranForDate) {
      const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
      if (!activeTahunAjaran) return surat;
      return { ...surat, tahunAjaranId: activeTahunAjaran.id };
    }

    return { ...surat, tahunAjaranId: tahunAjaranForDate.id };
  });
};

export const shouldMigrateAbsensiData = (
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  absensiGuru?: AbsensiGuru[],
  izinGuru?: IzinGuru[],
  suratIzin?: SuratIzin[]
): boolean => {
  const hasAbsensiWithoutTahunAjaran = absensi.some(a => !a.tahunAjaranId || a.semester === undefined);
  const hasSesiWithoutTahunAjaran = sesiAbsensi.some(s => !s.tahunAjaranId || s.semester === undefined);
  const hasAbsensiGuruWithoutTahunAjaran = absensiGuru?.some(a => !a.tahunAjaranId || a.semester === undefined);
  const hasIzinGuruWithoutTahunAjaran = izinGuru?.some(i => !i.tahunAjaranId);
  const hasSuratIzinWithoutTahunAjaran = suratIzin?.some(s => !s.tahunAjaranId);

  return hasAbsensiWithoutTahunAjaran ||
         hasSesiWithoutTahunAjaran ||
         !!hasAbsensiGuruWithoutTahunAjaran ||
         !!hasIzinGuruWithoutTahunAjaran ||
         !!hasSuratIzinWithoutTahunAjaran;
};
