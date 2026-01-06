import { TahunAjaran } from '../types';

export const getActiveTahunAjaran = (tahunAjaranList: TahunAjaran[]): TahunAjaran | undefined => {
  return tahunAjaranList.find(ta => ta.isActive);
};

export const isDateInTahunAjaranRange = (
  date: string,
  tahunAjaran: TahunAjaran
): boolean => {
  return date >= tahunAjaran.tanggalMulai && date <= tahunAjaran.tanggalSelesai;
};

export const validateDateInTahunAjaran = (
  date: string,
  tahunAjaran: TahunAjaran
): boolean => {
  if (!tahunAjaran) return false;
  return isDateInTahunAjaranRange(date, tahunAjaran);
};

export const getTahunAjaranForDate = (
  date: string,
  tahunAjaranList: TahunAjaran[]
): TahunAjaran | undefined => {
  return tahunAjaranList.find(ta =>
    isDateInTahunAjaranRange(date, ta)
  );
};

export const isSameTahunAjaran = (
  tahunAjaran1: TahunAjaran | undefined,
  tahunAjaran2: TahunAjaran | undefined
): boolean => {
  if (!tahunAjaran1 || !tahunAjaran2) return false;
  return tahunAjaran1.tahun === tahunAjaran2.tahun &&
         tahunAjaran1.semester === tahunAjaran2.semester;
};
