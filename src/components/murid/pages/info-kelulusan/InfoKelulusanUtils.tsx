import {
  User,
  Kelas,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi,
  Jurusan
} from '../../../../types';
import { generateRaportData } from '../../../../utils/raport';
import { getNilaiMinimalSettings } from '../../../../utils/nilaiUtils';

export interface KelulusanData {
  murid: User;
  nilaiAkhir: number;
  kehadiran: number;
  isLulus: boolean;
  kelas?: Kelas;
}

export const generateKelulusanData = (
  murid: User,
  semester: number,
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[]
): KelulusanData => {
  const raportData = generateRaportData(
    murid.id,
    semester,
    users,
    kelas,
    jurusan,
    nilai,
    mataPelajaran,
    tahunAjaran,
    jadwalPelajaran,
    absensi,
    sesiAbsensi
  );

  const minimalSettings = getNilaiMinimalSettings();

  return {
    murid,
    nilaiAkhir: raportData?.overallGrade || 0,
    kehadiran: raportData?.attendanceRate || 0,
    isLulus: raportData ? (raportData.overallGrade >= minimalSettings.nilaiAkhirMinimal && raportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal) : false,
    kelas: kelas.find(k => k.id === murid.kelasId)
  };
};

export const getKelulusanDataKelas = (
  muridKelas: User[],
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[]
): KelulusanData[] => {
  return muridKelas.map(murid =>
    generateKelulusanData(murid, 2, users, kelas, jurusan, nilai, mataPelajaran, tahunAjaran, jadwalPelajaran, absensi, sesiAbsensi)
  ).sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);
};

export const getKelulusanDataSekolah = (
  allMuridKelas12: User[],
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[]
): KelulusanData[] => {
  return allMuridKelas12.map(murid =>
    generateKelulusanData(murid, 2, users, kelas, jurusan, nilai, mataPelajaran, tahunAjaran, jadwalPelajaran, absensi, sesiAbsensi)
  ).sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);
};
