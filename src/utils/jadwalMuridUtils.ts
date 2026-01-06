import { JadwalPelajaran, User } from '../types';

export interface JadwalMuridDetail {
  jadwal: JadwalPelajaran;
  tanggal: string;
  hari: string;
  jadwalKey: string;
}

export const getHariFromDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const daysInIndonesian = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  return daysInIndonesian[date.getDay()];
};

export const isTimeOverlapping = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const [h1, m1] = start1.split(':').map(Number);
  const [h2, m2] = end1.split(':').map(Number);
  const [h3, m3] = start2.split(':').map(Number);
  const [h4, m4] = end2.split(':').map(Number);

  const time1Start = h1 * 60 + m1;
  const time1End = h2 * 60 + m2;
  const time2Start = h3 * 60 + m3;
  const time2End = h4 * 60 + m4;

  return time1Start < time2End && time2Start < time1End;
};

export const getJadwalMuridInDateRangeWithTime = (
  muridId: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  tahunAjaran: string,
  semester: number,
  users: User[],
  jadwalPelajaran: JadwalPelajaran[]
): JadwalMuridDetail[] => {
  const murid = users.find(u => u.id === muridId && u.role === 'murid');

  if (!murid) return [];

  const hari = getHariFromDate(tanggal);
  const jadwalDetails: JadwalMuridDetail[] = [];

  const jadwalOnDay = jadwalPelajaran.filter(j =>
    j.kelasId === murid.kelasId &&
    j.hari === hari &&
    j.tahunAjaran === tahunAjaran &&
    j.semester === semester
  );

  jadwalOnDay.forEach(jadwal => {
    if (isTimeOverlapping(jamMulai, jamSelesai, jadwal.jamMulai, jadwal.jamSelesai)) {
      jadwalDetails.push({
        jadwal,
        tanggal,
        hari,
        jadwalKey: jadwal.id
      });
    }
  });

  return jadwalDetails;
};
