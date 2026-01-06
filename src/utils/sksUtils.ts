import { PengaturanSKS, PengaturanIstirahat } from '../types';

export const calculateJamSelesai = (
  jamMulai: string, 
  sks: number, 
  pengaturanSKS: PengaturanSKS,
  pengaturanIstirahat?: PengaturanIstirahat
): string => {
  const [hours, minutes] = jamMulai.split(':').map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);
  
  // Hitung total durasi dalam menit (tanpa istirahat antar SKS)
  const totalDurasi = sks * pengaturanSKS.durasiPerSKS;
  
  // Jika tidak ada pengaturan istirahat, hitung normal
  if (!pengaturanIstirahat) {
    const endTime = new Date(startTime.getTime() + totalDurasi * 60000);
    const endHours = endTime.getHours().toString().padStart(2, '0');
    const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  }

  // Parse jam istirahat
  const [breakStartHour, breakStartMin] = pengaturanIstirahat.jamMulai.split(':').map(Number);
  const [breakEndHour, breakEndMin] = pengaturanIstirahat.jamSelesai.split(':').map(Number);
  
  const breakStartTime = new Date();
  breakStartTime.setHours(breakStartHour, breakStartMin, 0, 0);
  
  const breakEndTime = new Date();
  breakEndTime.setHours(breakEndHour, breakEndMin, 0, 0);
  
  // Hitung jam selesai tanpa mempertimbangkan istirahat dulu
  const tempEndTime = new Date(startTime.getTime() + totalDurasi * 60000);
  
  // Cek apakah jadwal melewati jam istirahat
  const isOverlappingBreak = startTime < breakStartTime && tempEndTime > breakStartTime;
  
  if (isOverlappingBreak) {
    // Hitung durasi sebelum istirahat
    const durasiSebelumIstirahat = (breakStartTime.getTime() - startTime.getTime()) / 60000;
    
    // Hitung sisa durasi yang perlu dilanjutkan setelah istirahat
    const sisaDurasi = totalDurasi - durasiSebelumIstirahat;
    
    if (sisaDurasi > 0) {
      // Lanjutkan setelah istirahat
      const finalEndTime = new Date(breakEndTime.getTime() + sisaDurasi * 60000);
      const endHours = finalEndTime.getHours().toString().padStart(2, '0');
      const endMinutes = finalEndTime.getMinutes().toString().padStart(2, '0');
      return `${endHours}:${endMinutes}`;
    } else {
      // Jadwal selesai sebelum istirahat
      const endHours = tempEndTime.getHours().toString().padStart(2, '0');
      const endMinutes = tempEndTime.getMinutes().toString().padStart(2, '0');
      return `${endHours}:${endMinutes}`;
    }
  } else {
    // Tidak ada overlap dengan istirahat, hitung normal
    const endHours = tempEndTime.getHours().toString().padStart(2, '0');
    const endMinutes = tempEndTime.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  }
};

export const formatDurasi = (totalMenit: number): string => {
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  
  if (jam === 0) {
    return `${menit} menit`;
  } else if (menit === 0) {
    return `${jam} jam`;
  } else {
    return `${jam} jam ${menit} menit`;
  }
};

export const calculateTotalDurasi = (sks: number, pengaturanSKS: PengaturanSKS): number => {
  return sks * pengaturanSKS.durasiPerSKS;
};

export const validateJamPelajaran = (
  jamMulai: string,
  jamSelesai: string,
  sks: number,
  pengaturanSKS: PengaturanSKS,
  pengaturanIstirahat?: PengaturanIstirahat
): { isValid: boolean; message?: string; calculatedEnd?: string } => {
  const calculatedEnd = calculateJamSelesai(jamMulai, sks, pengaturanSKS, pengaturanIstirahat);
  
  if (jamSelesai !== calculatedEnd) {
    return {
      isValid: false,
      message: `Jam selesai tidak sesuai dengan SKS. Seharusnya: ${calculatedEnd}`,
      calculatedEnd
    };
  }
  
  return { isValid: true };
};

export const getJadwalBreakdown = (
  jamMulai: string,
  sks: number,
  pengaturanSKS: PengaturanSKS,
  pengaturanIstirahat?: PengaturanIstirahat
): { segments: Array<{start: string, end: string, type: 'lesson' | 'break'}>, totalDuration: number } => {
  const [hours, minutes] = jamMulai.split(':').map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);
  
  const totalDurasi = sks * pengaturanSKS.durasiPerSKS;
  const segments: Array<{start: string, end: string, type: 'lesson' | 'break'}> = [];
  
  if (!pengaturanIstirahat) {
    // Tanpa istirahat, jadwal normal
    const endTime = new Date(startTime.getTime() + totalDurasi * 60000);
    segments.push({
      start: jamMulai,
      end: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
      type: 'lesson'
    });
    return { segments, totalDuration: totalDurasi };
  }

  // Parse jam istirahat
  const [breakStartHour, breakStartMin] = pengaturanIstirahat.jamMulai.split(':').map(Number);
  const [breakEndHour, breakEndMin] = pengaturanIstirahat.jamSelesai.split(':').map(Number);
  
  const breakStartTime = new Date();
  breakStartTime.setHours(breakStartHour, breakStartMin, 0, 0);
  
  const breakEndTime = new Date();
  breakEndTime.setHours(breakEndHour, breakEndMin, 0, 0);
  
  const tempEndTime = new Date(startTime.getTime() + totalDurasi * 60000);
  
  // Cek apakah jadwal melewati jam istirahat
  const isOverlappingBreak = startTime < breakStartTime && tempEndTime > breakStartTime;
  
  if (isOverlappingBreak) {
    // Jadwal terpotong istirahat
    const durasiSebelumIstirahat = (breakStartTime.getTime() - startTime.getTime()) / 60000;
    const sisaDurasi = totalDurasi - durasiSebelumIstirahat;
    
    // Segment sebelum istirahat
    segments.push({
      start: jamMulai,
      end: pengaturanIstirahat.jamMulai,
      type: 'lesson'
    });
    
    // Segment istirahat
    segments.push({
      start: pengaturanIstirahat.jamMulai,
      end: pengaturanIstirahat.jamSelesai,
      type: 'break'
    });
    
    if (sisaDurasi > 0) {
      // Segment setelah istirahat
      const finalEndTime = new Date(breakEndTime.getTime() + sisaDurasi * 60000);
      segments.push({
        start: pengaturanIstirahat.jamSelesai,
        end: `${finalEndTime.getHours().toString().padStart(2, '0')}:${finalEndTime.getMinutes().toString().padStart(2, '0')}`,
        type: 'lesson'
      });
    }
  } else {
    // Tidak ada overlap dengan istirahat
    segments.push({
      start: jamMulai,
      end: `${tempEndTime.getHours().toString().padStart(2, '0')}:${tempEndTime.getMinutes().toString().padStart(2, '0')}`,
      type: 'lesson'
    });
  }
  
  return { segments, totalDuration: totalDurasi };
};