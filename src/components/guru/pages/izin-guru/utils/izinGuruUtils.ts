import { IzinGuru, JadwalPelajaran, Guru } from '../../../../../types';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'menunggu':
      return 'warning';
    case 'diterima':
      return 'success';
    case 'ditolak':
      return 'danger';
    default:
      return 'default';
  }
};

export const getJenisBadge = (jenis: string) => {
  switch (jenis) {
    case 'izin':
      return 'warning';
    case 'sakit':
      return 'info';
    case 'cuti':
      return 'secondary';
    case 'izin_dispen':
      return 'info';
    default:
      return 'default';
  }
};

export const isDateInRange = (tanggal: string, mulai: string, selesai: string) => {
  const date = new Date(tanggal);
  const startDate = new Date(mulai);
  const endDate = new Date(selesai);
  return date >= startDate && date <= endDate;
};

export const getActiveIzin = (myIzin: IzinGuru[]) => {
  const today = new Date().toISOString().split('T')[0];
  return myIzin.find(i =>
    i.status === 'diterima' &&
    isDateInRange(today, i.tanggalMulai, i.tanggalSelesai)
  );
};

export const validateFileUpload = (file: File) => {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

  if (file.size > maxSize) {
    return { valid: false, error: 'Ukuran file maksimal 5MB!' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Hanya file JPG, PNG, dan PDF yang diperbolehkan!' };
  }

  return { valid: true };
};

export const validateDates = (tanggalMulai: string, tanggalSelesai: string) => {
  if (new Date(tanggalMulai) > new Date(tanggalSelesai)) {
    return { valid: false, error: 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai!' };
  }
  return { valid: true };
};

export const getHariFromDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const daysInIndonesian = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  return daysInIndonesian[date.getDay()];
};


export const getGuruNameById = (guruId: string, gurus: Guru[] = []): string => {
  const guru = gurus.find(u => u.id === guruId && u.role === 'guru');
  return guru?.name || 'Tidak diketahui';
};

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDisabledDatesByGuru = (guruId: string, izinGuru: IzinGuru[] = []): string[] => {
  const approvedIzin = izinGuru.filter(
    i => i.guruId === guruId && i.status === 'diterima' && i.jenis !== 'izin_dispen'
  );

  const disabledDates: string[] = [];

  approvedIzin.forEach(izin => {
    const startDate = new Date(izin.tanggalMulai);
    const endDate = new Date(izin.tanggalSelesai);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      disabledDates.push(formatDateToString(date));
    }
  });

  return disabledDates;
};

export const getActiveIzinRanges = (guruId: string, izinGuru: IzinGuru[] = []): Array<{ start: string; end: string }> => {
  return izinGuru
    .filter(i => i.guruId === guruId && i.status === 'diterima' && i.jenis !== 'izin_dispen')
    .map(i => ({
      start: i.tanggalMulai,
      end: i.tanggalSelesai
    }));
};
