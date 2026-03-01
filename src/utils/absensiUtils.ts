import { PengaturanAbsen } from '../types';

const TIMEZONE_INDONESIA = 'Asia/Jakarta';

/**
 * Get today's date in Indonesia timezone (WIB/UTC+7)
 * PENTING: Jangan gunakan new Date().toISOString().split('T')[0] karena toISOString()
 * selalu mengembalikan UTC. Saat jam 00:00-06:59 WIB, tanggal UTC masih hari sebelumnya,
 * sehingga absensi sebelum jam 7 pagi terhitung di hari yang salah.
 * @returns Tanggal hari ini dalam format YYYY-MM-DD sesuai waktu Indonesia
 */
export const getTodayIndonesia = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_INDONESIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Returns YYYY-MM-DD
};

/**
 * Get current time in Indonesia timezone (HH:MM format)
 * @returns Waktu saat ini dalam format HH:MM sesuai waktu Indonesia
 */
export const getCurrentTimeIndonesia = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE_INDONESIA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
};

/**
 * Get current time in device local timezone (HH:MM format).
 * Digunakan untuk nilai jamMasuk/jamKeluar yang disimpan ke database dari
 * absen QR, RFID, manual, dan face recognition (guru & murid).
 * @returns Waktu saat ini dalam format HH:MM sesuai jam lokal perangkat
 */
export const getCurrentTimeLocal = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
};

/**
 * Convert local time to ISO string format with local timezone offset
 * This preserves the local time without converting to UTC
 * @returns ISO string format like "2025-12-31T15:31:49.584+07:00" (with timezone offset)
 */
export const getLocalTimeISOString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  // Get timezone offset in minutes
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetString}`;
};

export const calculateAttendanceStatus = (
  jamAbsen: string,
  pengaturan: PengaturanAbsen,
  type: 'masuk' | 'keluar'
): 'tepat_waktu' | 'terlambat' | 'pulang_awal' => {
  const absenTime = new Date(`2000-01-01T${jamAbsen}:00`);
  
  if (type === 'masuk') {
    const jamMasukTime = new Date(`2000-01-01T${pengaturan.jamMasuk}:00`);
    const batasTerlambat = new Date(jamMasukTime.getTime() + pengaturan.toleransiMasuk * 60000);
    
    if (absenTime <= batasTerlambat) {
      return 'tepat_waktu';
    } else {
      return 'terlambat';
    }
  } else {
    const jamPulangTime = new Date(`2000-01-01T${pengaturan.jamPulang}:00`);
    const batasPulangAwal = new Date(jamPulangTime.getTime() - pengaturan.toleransiPulang * 60000);
    
    if (absenTime < batasPulangAwal) {
      return 'pulang_awal';
    } else {
      return 'tepat_waktu';
    }
  }
};

export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}:00`).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format time string to HH:MM format
 * Handles both ISO timestamp format and HH:MM format
 * @param timeString - Time string in ISO format or HH:MM format
 * @returns Formatted time string in HH:MM format or '-' if invalid
 */
export const formatTimeDisplay = (timeString: string | undefined): string => {
  if (!timeString) return '-';
  
  try {
    // Check if it's an ISO timestamp (contains 'T' or is a full date-time string)
    if (timeString.includes('T') || timeString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      }
    }
    
    // Check if it's already in HH:MM or HH:mm format (with colon or dot separator)
    if (timeString.match(/^\d{1,2}[:.]\d{2}$/)) {
      // Normalize to HH:MM format
      const parts = timeString.split(/[:.]/);
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      
      // Validate hours and minutes
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
    
    // If it's just a time string without separator, try to parse it as HHMM
    if (timeString.match(/^\d{3,4}$/)) {
      // Assume HHMM format (e.g., 0830 or 830)
      const padded = timeString.padStart(4, '0');
      const hours = parseInt(padded.slice(0, 2), 10);
      const minutes = parseInt(padded.slice(2), 10);
      
      // Validate hours and minutes
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
    
    // Return as-is if we can't parse it (might already be in correct format)
    return timeString;
  } catch {
    // If parsing fails, return as-is
    return timeString;
  }
};

export const isWithinWorkingHours = (
  currentTime: string,
  pengaturan: PengaturanAbsen
): boolean => {
  const current = new Date(`2000-01-01T${currentTime}:00`);
  const jamMasuk = new Date(`2000-01-01T${pengaturan.jamMasuk}:00`);
  const jamPulang = new Date(`2000-01-01T${pengaturan.jamPulang}:00`);
  
  return current >= jamMasuk && current <= jamPulang;
};