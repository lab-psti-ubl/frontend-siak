import { SuratIzin, JadwalPelajaran, Murid } from '../types';

export interface PelajaranIzinDispen {
  jadwalId: string;
  status: 'IZIN';
  reason: string;
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

export const getPelajaranIzinDispen = (
  muridId: string,
  tanggal: string,
  tahunAjaran: string,
  semester: number
): PelajaranIzinDispen[] => {
  const suratIzin = JSON.parse(localStorage.getItem('suratIzin') || '[]') as SuratIzin[];
  const users = JSON.parse(localStorage.getItem('users') || '[]') as Murid[];
  const murid = users.find(u => u.id === muridId && u.role === 'murid');

  if (!murid) return [];

  const jadwalPelajaran = JSON.parse(localStorage.getItem('jadwalPelajaran') || '[]') as JadwalPelajaran[];
  const hari = getHariFromDate(tanggal);

  const jadwalOnDay = jadwalPelajaran.filter(j =>
    j.kelasId === murid.kelasId &&
    j.hari === hari &&
    j.tahunAjaran === tahunAjaran &&
    j.semester === semester
  );

  const pelajaranIzinDispen: PelajaranIzinDispen[] = [];

  const izinDispenOnDate = suratIzin.filter(s =>
    s.muridId === muridId &&
    s.jenis === 'izin_dispen' &&
    s.tanggalMulai === tanggal &&
    s.status === 'diterima' &&
    s.jamMulai &&
    s.jamSelesai
  );

  izinDispenOnDate.forEach(izin => {
    jadwalOnDay.forEach(jadwal => {
      if (isTimeOverlapping(izin.jamMulai!, izin.jamSelesai!, jadwal.jamMulai, jadwal.jamSelesai)) {
        pelajaranIzinDispen.push({
          jadwalId: jadwal.id,
          status: 'IZIN',
          reason: izin.alasan
        });
      }
    });
  });

  return pelajaranIzinDispen;
};

export const checkIfJadwalHasIzinDispen = (
  muridId: string,
  jadwalId: string,
  tanggal: string,
  tahunAjaran: string,
  semester: number
): PelajaranIzinDispen | null => {
  const izinDispenList = getPelajaranIzinDispen(muridId, tanggal, tahunAjaran, semester);
  return izinDispenList.find(i => i.jadwalId === jadwalId) || null;
};
