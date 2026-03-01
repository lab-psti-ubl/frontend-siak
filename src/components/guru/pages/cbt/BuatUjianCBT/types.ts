export interface UjianFormState {
  mapelId: string;
  kelasId: string;
  kategoriId: string;
  kategoriKe: string;
  bankSoalId: string;
  judulUjian: string;
  tanggalMulai: string;
  jamMulai: string;
  tanggalSelesai: string;
  jamSelesai: string;
  durasiMenit: string;
  acakSoal: boolean;
  tunjukanHasilNilai: boolean;
}

export const defaultFormState: UjianFormState = {
  mapelId: '',
  kelasId: '',
  kategoriId: '',
  kategoriKe: '',
  bankSoalId: '',
  judulUjian: '',
  tanggalMulai: '',
  jamMulai: '',
  tanggalSelesai: '',
  jamSelesai: '',
  durasiMenit: '60',
  acakSoal: true,
  tunjukanHasilNilai: false,
};
