import {
  User,
  Kelas,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi,
  Jurusan,
  PengumumanKelulusan
} from '../../../../../../types';
import { generateRaportData } from '../../../../../../utils/raport';
import { getNilaiMinimalSettings } from '../../../../../../utils/nilaiUtils';

export interface KelulusanDataItem {
  murid: User;
  raportData: ReturnType<typeof generateRaportData>;
  isLulus: boolean;
  nilaiAkhir: number;
  kehadiran: number;
}

export const getKelulusanData = (
  muridKelas: User[],
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  activePengumuman?: PengumumanKelulusan
): KelulusanDataItem[] => {
  // Determine which tahun ajaran to use for kelulusan data
  let targetTahunAjaran: TahunAjaran[];

  if (activePengumuman?.tahunAjaran) {
    // Use the tahun ajaran from pengumuman (snapshot)
    const pengumumanTahunAjaran = tahunAjaran.find(ta => ta.tahun === activePengumuman.tahunAjaran);
    targetTahunAjaran = pengumumanTahunAjaran ? [pengumumanTahunAjaran] : tahunAjaran.filter(ta => ta.isActive);
    console.log('Using tahun ajaran from pengumuman:', activePengumuman.tahunAjaran);
  } else {
    // Fall back to active tahun ajaran
    targetTahunAjaran = tahunAjaran.filter(ta => ta.isActive);
    console.log('Using active tahun ajaran');
  }

  return muridKelas.map(murid => {
    const raportData = generateRaportData(
      murid.id,
      2, // Semester genap untuk kelulusan
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      targetTahunAjaran, // Use determined tahun ajaran
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );

    const minimalSettings = getNilaiMinimalSettings();
    const isLulus = raportData ?
      (raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal && raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal) : false;

    return {
      murid,
      raportData,
      isLulus,
      nilaiAkhir: raportData?.overallGrade || 0,
      kehadiran: raportData?.attendanceRate || 0
    };
  }).sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);
};
