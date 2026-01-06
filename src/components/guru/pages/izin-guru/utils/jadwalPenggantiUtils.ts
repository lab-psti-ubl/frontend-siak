import { JadwalPelajaran, Guru, GuruPenggantiJadwal } from '../../../../../types';

export interface JadwalDetail {
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

export const getDatesBetween = (tanggalMulai: string, tanggalSelesai: string): string[] => {
  const dates: string[] = [];
  const startDate = new Date(tanggalMulai + 'T00:00:00');
  const endDate = new Date(tanggalSelesai + 'T00:00:00');

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

export const getJadwalGuruInDateRange = (
  guruId: string,
  tanggalMulai: string,
  tanggalSelesai: string,
  tahunAjaran: string,
  semester: number,
  jadwalPelajaran: JadwalPelajaran[] = []
): JadwalDetail[] => {
  const dates = getDatesBetween(tanggalMulai, tanggalSelesai);
  const jadwalDetailsMap = new Map<string, JadwalDetail>();

  dates.forEach(tanggal => {
    const hari = getHariFromDate(tanggal);
    const jadwalOnDay = jadwalPelajaran.filter(j =>
      j.guruId === guruId &&
      j.hari === hari &&
      j.tahunAjaran === tahunAjaran &&
      j.semester === semester
    );

    jadwalOnDay.forEach(jadwal => {
      const jadwalKey = jadwal.id;
      if (!jadwalDetailsMap.has(jadwalKey)) {
        jadwalDetailsMap.set(jadwalKey, {
          jadwal,
          tanggal,
          hari,
          jadwalKey
        });
      }
    });
  });

  return Array.from(jadwalDetailsMap.values());
};

export const getGurusWithoutScheduleOnDate = (
  guruIdToExclude: string,
  tanggal: string,
  tahunAjaran: string,
  semester: number,
  gurus: Guru[] = [],
  jadwalPelajaran: JadwalPelajaran[] = []
): Guru[] => {
  const hari = getHariFromDate(tanggal);

  const allGurus = gurus.filter(u => u.role === 'guru' && u.isActive !== false && u.id !== guruIdToExclude);

  return allGurus.filter(guru => {
    const jadwalGuruOnDay = jadwalPelajaran.filter(j =>
      j.guruId === guru.id &&
      j.hari === hari &&
      j.tahunAjaran === tahunAjaran &&
      j.semester === semester
    );
    return jadwalGuruOnDay.length === 0;
  });
};

export const getGurusWithoutTimeConflict = (
  guruIdToExclude: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  tahunAjaran: string,
  semester: number,
  gurus: Guru[] = [],
  jadwalPelajaran: JadwalPelajaran[] = []
): Guru[] => {
  const hari = getHariFromDate(tanggal);

  const allGurus = gurus.filter(u => u.role === 'guru' && u.isActive !== false && u.id !== guruIdToExclude);

  return allGurus.filter(guru => {
    const jadwalGuruOnDay = jadwalPelajaran.filter(j =>
      j.guruId === guru.id &&
      j.hari === hari &&
      j.tahunAjaran === tahunAjaran &&
      j.semester === semester
    );

    const hasTimeConflict = jadwalGuruOnDay.some(jadwal => {
      return isTimeOverlapping(jamMulai, jamSelesai, jadwal.jamMulai, jadwal.jamSelesai);
    });

    return !hasTimeConflict;
  });
};

export const getGurusWithoutScheduleOnDates = (
  guruIdToExclude: string,
  dates: string[],
  tahunAjaran: string,
  semester: number,
  gurus: Guru[] = [],
  jadwalPelajaran: JadwalPelajaran[] = []
): Map<string, Guru[]> => {
  const result = new Map<string, Guru[]>();

  dates.forEach(tanggal => {
    const availableGurus = getGurusWithoutScheduleOnDate(guruIdToExclude, tanggal, tahunAjaran, semester, gurus, jadwalPelajaran);
    result.set(tanggal, availableGurus);
  });

  return result;
};

export const getGuruNameById = (guruId: string, gurus: Guru[] = []): string => {
  const guru = gurus.find(u => u.id === guruId && u.role === 'guru');
  return guru?.name || 'Tidak diketahui';
};

export const getMataPelajaranNameById = (mataPelajaranId: string, mataPelajaran: any[] = []): string => {
  const mata = mataPelajaran.find(m => m.id === mataPelajaranId);
  return mata?.name || 'Tidak diketahui';
};

export const getKelasNameById = (kelasId: string, kelas: any[] = []): string => {
  const k = kelas.find(k => k.id === kelasId);
  return k?.name || 'Tidak diketahui';
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

export const getJadwalGuruInDateRangeWithTime = (
  guruId: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  tahunAjaran: string,
  semester: number,
  jadwalPelajaran: JadwalPelajaran[] = []
): JadwalDetail[] => {
  const hari = getHariFromDate(tanggal);
  const jadwalDetails: JadwalDetail[] = [];

  const jadwalOnDay = jadwalPelajaran.filter(j =>
    j.guruId === guruId &&
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

export const isJadwalFinished = (jamSelesai: string): boolean => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  return currentTime >= jamSelesai;
};

export const getJadwalGuruInDateRangeNotFinished = (
  guruId: string,
  tanggalMulai: string,
  tanggalSelesai: string,
  tahunAjaran: string,
  semester: number,
  jadwalPelajaran: JadwalPelajaran[] = []
): JadwalDetail[] => {
  const dates = getDatesBetween(tanggalMulai, tanggalSelesai);
  const jadwalDetailsMap = new Map<string, JadwalDetail>();
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const today = now.toISOString().split('T')[0];

  dates.forEach(tanggal => {
    const hari = getHariFromDate(tanggal);
    const jadwalOnDay = jadwalPelajaran.filter(j =>
      j.guruId === guruId &&
      j.hari === hari &&
      j.tahunAjaran === tahunAjaran &&
      j.semester === semester
    );

    jadwalOnDay.forEach(jadwal => {
      const isToday = tanggal === today;
      const isFinished = isToday && currentTime >= jadwal.jamSelesai;

      if (!isFinished) {
        const jadwalKey = jadwal.id;
        if (!jadwalDetailsMap.has(jadwalKey)) {
          jadwalDetailsMap.set(jadwalKey, {
            jadwal,
            tanggal,
            hari,
            jadwalKey
          });
        }
      }
    });
  });

  return Array.from(jadwalDetailsMap.values());
};

export const getJadwalGuruInDateRangeWithTimeNotFinished = (
  guruId: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  tahunAjaran: string,
  semester: number,
  jadwalPelajaran: JadwalPelajaran[] = []
): JadwalDetail[] => {
  const hari = getHariFromDate(tanggal);
  const jadwalDetails: JadwalDetail[] = [];
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const today = now.toISOString().split('T')[0];

  const jadwalOnDay = jadwalPelajaran.filter(j =>
    j.guruId === guruId &&
    j.hari === hari &&
    j.tahunAjaran === tahunAjaran &&
    j.semester === semester
  );

  jadwalOnDay.forEach(jadwal => {
    const isToday = tanggal === today;
    const isFinished = isToday && currentTime >= jadwal.jamSelesai;

    if (isTimeOverlapping(jamMulai, jamSelesai, jadwal.jamMulai, jadwal.jamSelesai) && !isFinished) {
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
