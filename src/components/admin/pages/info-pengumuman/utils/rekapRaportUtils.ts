import {
  User,
  Kelas,
  Jurusan,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi
} from '../../../../../types';
import { generateRaportData } from '../../../../../utils/raport';
import { shouldShowJurusanSync, isMaxTingkatSync, getTingkatKelasOptionsSync } from '../../../../../utils/jenjangPendidikanUtils';

// Helper function to filter out alumni classes
const filterAlumniClasses = (kelas: Kelas[]): Kelas[] => {
  const validTingkatLevels = getTingkatKelasOptionsSync();
  return kelas.filter(k => {
    const isAlumniClass = k.tingkat === 99 || k.name.toLowerCase().includes('alumni');
    const isValidTingkat = validTingkatLevels.includes(k.tingkat);
    return !isAlumniClass && isValidTingkat;
  });
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

export const getAvailableSemesters = (
  tahunAjaranValue: string,
  tahunAjaran: TahunAjaran[],
  nilai: Nilai[],
  jadwalPelajaran: JadwalPelajaran[]
) => {
  const semestersFromTahunAjaran = tahunAjaran
    .filter(ta => ta.tahun === tahunAjaranValue)
    .map(ta => ta.semester);

  const semestersFromNilai = new Set<number>();
  nilai
    .filter(n => n.tahunAjaran === tahunAjaranValue)
    .forEach(n => semestersFromNilai.add(n.semester));

  const semestersFromJadwal = new Set<number>();
  jadwalPelajaran
    .filter(j => j.tahunAjaran === tahunAjaranValue)
    .forEach(j => semestersFromJadwal.add(j.semester));

  const allSemesters = new Set([
    ...semestersFromTahunAjaran,
    ...Array.from(semestersFromNilai),
    ...Array.from(semestersFromJadwal)
  ]);

  return Array.from(allSemesters)
    .sort((a, b) => a - b)
    .map(sem => ({
      id: `sem-${sem}`,
      tahun: tahunAjaranValue,
      semester: sem,
      isActive: false,
      tanggalMulai: '',
      tanggalSelesai: ''
    }));
};

export const getKelasForJurusan = (
  jurusanId: string,
  tahunAjaranValue: string,
  kelas: Kelas[],
  nilai: Nilai[]
) => {
  if (!shouldShowJurusanSync()) {
    return getAllKelas(tahunAjaranValue, kelas, nilai);
  }
  // Filter out alumni classes first
  const activeKelas = filterAlumniClasses(kelas);
  const kelasForJurusan = activeKelas.filter(k => k.jurusanId === jurusanId);

  if (!tahunAjaranValue) {
    return kelasForJurusan;
  }

  const kelasWithNilai = new Set(
    nilai
      .filter(n => n.tahunAjaran === tahunAjaranValue)
      .map(n => n.kelasId)
  );

  return kelasForJurusan.filter(k => kelasWithNilai.has(k.id));
};

export const getAllKelas = (
  tahunAjaranValue: string,
  kelas: Kelas[],
  nilai: Nilai[]
) => {
  // Filter out alumni classes first
  const activeKelas = filterAlumniClasses(kelas);
  
  if (!tahunAjaranValue) {
    return activeKelas;
  }

  const kelasWithNilai = new Set(
    nilai
      .filter(n => n.tahunAjaran === tahunAjaranValue)
      .map(n => n.kelasId)
  );

  return activeKelas.filter(k => kelasWithNilai.has(k.id));
};

export const getMuridForFilter = (
  selectedKelas: string,
  selectedTahunAjaran: string,
  selectedSemester: number,
  users: User[],
  kelas: Kelas[],
  nilai: Nilai[],
  searchQuery: string
) => {
  if (!selectedKelas || !selectedTahunAjaran) {
    return [];
  }

  const muridIds = new Set(
    nilai
      .filter(n =>
        n.kelasId === selectedKelas &&
        n.tahunAjaran === selectedTahunAjaran &&
        n.semester === selectedSemester
      )
      .map(n => n.muridId)
  );

  let murid = users.filter(u =>
    u.role === 'murid' &&
    muridIds.has(u.id)
  );

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    murid = murid.filter(u =>
      u.name.toLowerCase().includes(query) ||
      (u.nisn && u.nisn.includes(query))
    );
  }

  return murid.sort((a, b) => a.name.localeCompare(b.name));
};

export const generateRekapRaportData = (
  muridList: User[],
  selectedSemester: number,
  selectedTahunAjaran: string,
  selectedKelas: string,
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[]
) => {
  return muridList.map(murid => {
    const raportData = generateRaportData(
      murid.id,
      selectedSemester,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );

    const kelasData = kelas.find(k => k.id === selectedKelas);
    const jurusanData = shouldShowJurusanSync() && kelasData?.jurusanId ? jurusan.find(j => j.id === kelasData.jurusanId) : null;
    const isMaxTingkat = kelasData ? isMaxTingkatSync(kelasData.tingkat) : false;

    return {
      murid,
      kelasData,
      jurusanData,
      nilaiAkhir: raportData?.overallGrade || 0,
      attendanceRate: raportData?.attendanceRate || 0,
      isNaikKelas: raportData?.isNaikKelas || false,
      semester: selectedSemester,
      isMaxTingkat,
      raportData
    };
  }).sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);
};

export const getRekapRaportStats = (rekapData: any[]) => {
  if (rekapData.length === 0) {
    return {
      totalMurid: 0,
      rataRataNilai: 0,
      muridNaik: 0,
      muridTidakNaik: 0,
      persentaseNaik: 0,
      isMaxTingkat: false
    };
  }

  // Check if this is max tingkat (kelulusan) or not (kenaikan kelas)
  const isMaxTingkat = rekapData.length > 0 && rekapData[0].isMaxTingkat === true;

  const totalNilai = rekapData.reduce((sum, item) => sum + item.nilaiAkhir, 0);
  const rataRataNilai = totalNilai / rekapData.length;
  const muridNaik = rekapData.filter(item => item.isNaikKelas).length;
  const muridTidakNaik = rekapData.length - muridNaik;
  const persentaseNaik = (muridNaik / rekapData.length) * 100;

  return {
    totalMurid: rekapData.length,
    rataRataNilai,
    muridNaik,
    muridTidakNaik,
    persentaseNaik,
    isMaxTingkat
  };
};
