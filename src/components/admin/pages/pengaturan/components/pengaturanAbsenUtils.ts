import { PengaturanAbsen, PengaturanSKS, PengaturanIstirahat } from '../../../../../types';
import { formatDurasi, calculateTotalDurasi } from '../../../../../utils/sksUtils';

export const calculateJamBatas = (jamMasuk: string, jamPulang: string, toleransiMasuk: number, toleransiPulang: number) => {
  const jamMasukTime = new Date(`2000-01-01T${jamMasuk}:00`);
  const jamPulangTime = new Date(`2000-01-01T${jamPulang}:00`);

  const batasTerlambat = new Date(jamMasukTime.getTime() + toleransiMasuk * 60000);
  const batasPulangAwal = new Date(jamPulangTime.getTime() - toleransiPulang * 60000);

  return {
    batasTerlambat: batasTerlambat.toTimeString().slice(0, 5),
    batasPulangAwal: batasPulangAwal.toTimeString().slice(0, 5)
  };
};

export const calculateIstirahatDuration = (jamMulai: string, jamSelesai: string) => {
  const jamMulaiTime = new Date(`2000-01-01T${jamMulai}:00`);
  const jamSelesaiTime = new Date(`2000-01-01T${jamSelesai}:00`);
  const durasiMenit = (jamSelesaiTime.getTime() - jamMulaiTime.getTime()) / (1000 * 60);
  return formatDurasi(durasiMenit);
};

export const validateAbsenForm = (jamMasuk: string, jamPulang: string, toleransiMasuk: number, toleransiPulang: number, hariSekolah?: number[], hariKerja?: number[]) => {
  const jamMasukTime = new Date(`2000-01-01T${jamMasuk}:00`);
  const jamPulangTime = new Date(`2000-01-01T${jamPulang}:00`);

  if (jamMasukTime >= jamPulangTime) {
    return { valid: false, message: 'Jam masuk harus lebih awal dari jam pulang!' };
  }

  if (toleransiMasuk < 0 || toleransiMasuk > 60) {
    return { valid: false, message: 'Toleransi masuk harus antara 0-60 menit!' };
  }

  if (toleransiPulang < 0 || toleransiPulang > 60) {
    return { valid: false, message: 'Toleransi pulang harus antara 0-60 menit!' };
  }

  // Validate hari sekolah
  if (!hariSekolah || hariSekolah.length === 0) {
    return { valid: false, message: 'Pilih minimal 1 hari sekolah untuk murid!' };
  }

  // Validate hari kerja
  if (!hariKerja || hariKerja.length === 0) {
    return { valid: false, message: 'Pilih minimal 1 hari kerja untuk guru!' };
  }

  return { valid: true, message: '' };
};

export const validateSKSForm = (durasiPerSKS: number, istirahatAntarSKS: number) => {
  if (durasiPerSKS < 15 || durasiPerSKS > 120) {
    return { valid: false, message: 'Durasi per SKS harus antara 15-120 menit!' };
  }

  if (istirahatAntarSKS < 0 || istirahatAntarSKS > 30) {
    return { valid: false, message: 'Istirahat antar SKS harus antara 0-30 menit!' };
  }

  return { valid: true, message: '' };
};

export const validateIstirahatForm = (jamMulai: string, jamSelesai: string) => {
  const jamMulaiTime = new Date(`2000-01-01T${jamMulai}:00`);
  const jamSelesaiTime = new Date(`2000-01-01T${jamSelesai}:00`);

  if (jamMulaiTime >= jamSelesaiTime) {
    return { valid: false, message: 'Jam mulai istirahat harus lebih awal dari jam selesai!' };
  }

  const durasiIstirahat = (jamSelesaiTime.getTime() - jamMulaiTime.getTime()) / (1000 * 60);
  if (durasiIstirahat < 30) {
    return { valid: false, message: 'Durasi istirahat minimal 30 menit!' };
  }

  if (durasiIstirahat > 120) {
    return { valid: false, message: 'Durasi istirahat maksimal 2 jam!' };
  }

  return { valid: true, message: '' };
};

export const createPengaturanAbsen = (formData: any) => {
  return {
    id: `pengaturan${Date.now()}`,
    ...formData,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
};

export const createPengaturanSKS = (formData: any) => {
  return {
    id: `pengaturan-sks-${Date.now()}`,
    ...formData,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
};

export const createPengaturanIstirahat = (formData: any) => {
  return {
    id: `pengaturan-istirahat-${Date.now()}`,
    ...formData,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
};

export const calculateEndTimeWithBreak = (
  startTime: Date,
  totalDurasi: number,
  pengaturanIstirahat: PengaturanIstirahat
) => {
  const [breakStartHour, breakStartMin] = pengaturanIstirahat.jamMulai.split(':').map(Number);
  const [breakEndHour, breakEndMin] = pengaturanIstirahat.jamSelesai.split(':').map(Number);

  const breakStartTime = new Date();
  breakStartTime.setHours(breakStartHour, breakStartMin, 0, 0);

  const breakEndTime = new Date();
  breakEndTime.setHours(breakEndHour, breakEndMin, 0, 0);

  const tempEndTime = new Date(startTime.getTime() + totalDurasi * 60000);

  if (startTime < breakStartTime && tempEndTime > breakStartTime) {
    const durasiSebelumIstirahat = (breakStartTime.getTime() - startTime.getTime()) / 60000;
    const sisaDurasi = totalDurasi - durasiSebelumIstirahat;

    if (sisaDurasi > 0) {
      const finalEndTime = new Date(breakEndTime.getTime() + sisaDurasi * 60000);
      return finalEndTime.toTimeString().slice(0, 5);
    }
  }

  return tempEndTime.toTimeString().slice(0, 5);
};
