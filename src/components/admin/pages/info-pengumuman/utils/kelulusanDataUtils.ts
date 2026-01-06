import {
  User,
  Kelas,
  Jurusan,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi,
  PengumumanKelulusan
} from '../../../../../types';
import { generateRaportData } from '../../../../../utils/raport';
import { getNilaiMinimalSettings } from '../../../../../utils/nilaiUtils';

export const getKelulusanData = (
  muridKelas12: User[],
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
) => {
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

  return muridKelas12.map(murid => {
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
      kehadiran: raportData?.attendanceRate || 0,
      kelas: kelas.find(k => k.id === murid.kelasId)
    };
  }).sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);
};