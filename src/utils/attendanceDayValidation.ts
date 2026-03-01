import { PengaturanAbsen } from '../types';

/**
 * Get active pengaturan absen
 */
export const getActivePengaturanAbsen = (pengaturanAbsen: PengaturanAbsen[]): PengaturanAbsen | null => {
  const active = pengaturanAbsen.find(p => p.isActive);
  return active || null;
};

/**
 * Check if attendance is allowed on the given date based on role
 * @param dateString - Date string in YYYY-MM-DD format
 * @param role - 'guru' or 'murid'
 * @param pengaturanAbsen - Array of pengaturan absen
 * @returns true if attendance is allowed, false otherwise
 */
export const isAttendanceDayAllowed = (
  dateString: string,
  role: 'guru' | 'murid',
  pengaturanAbsen: PengaturanAbsen[]
): boolean => {
  const pengaturan = getActivePengaturanAbsen(pengaturanAbsen);
  if (!pengaturan) return true; // If no pengaturan, allow by default

  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const date = new Date(dateString + 'T00:00:00');
  const dayOfWeek = date.getDay();

  // Check based on role
  if (role === 'guru') {
    const hariKerja = pengaturan.hariKerja || []; // Get from database, empty if not set
    if (hariKerja.length === 0) {
      // If no hari kerja set, allow by default (backward compatibility)
      return true;
    }
    return hariKerja.includes(dayOfWeek);
  } else if (role === 'murid') {
    const hariSekolah = pengaturan.hariSekolah || []; // Get from database, empty if not set
    if (hariSekolah.length === 0) {
      // If no hari sekolah set, allow by default (backward compatibility)
      return true;
    }
    return hariSekolah.includes(dayOfWeek);
  }

  return true; // Default allow
};

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_NAMES_MS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

/**
 * Get day name in Indonesian
 */
export const getDayNameInIndonesian = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  return DAY_NAMES_ID[date.getDay()];
};

/**
 * Get day name by language (id = Indonesian, ms = Malay)
 */
export const getDayName = (dateString: string, language: 'id' | 'ms' = 'id'): string => {
  const date = new Date(dateString + 'T00:00:00');
  const names = language === 'ms' ? DAY_NAMES_MS : DAY_NAMES_ID;
  return names[date.getDay()];
};

