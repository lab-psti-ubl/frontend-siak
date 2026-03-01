/**
 * Date locale utilities for Indonesian (id) and Malaysian Malay (ms).
 * Use these when displaying day names and month names so that when language
 * is Malaysia, the UI shows Malay names (Isnin, Selasa, ..., Januari, Mac, Disember, etc.).
 */

export type DateLocaleLanguage = 'id' | 'ms';

/** Locale string for Intl / toLocaleDateString */
export function getDateLocale(language: DateLocaleLanguage): string {
  return language === 'ms' ? 'ms-MY' : 'id-ID';
}

/** Day names for display - Monday first index 0 is convention in some code; JS getDay() is 0=Sunday. */
const DAY_NAMES_ID: string[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_NAMES_MS: string[] = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

export function getDayNames(language: DateLocaleLanguage): string[] {
  return language === 'ms' ? DAY_NAMES_MS : DAY_NAMES_ID;
}

/** Month names for display (index 0 = January). User-requested Malay: Januari, Februari, Mac, April, Mei, Jun, Julai, Ogos, September, Oktober, November, Disember */
const MONTH_NAMES_ID: string[] = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const MONTH_NAMES_MS: string[] = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export function getMonthNames(language: DateLocaleLanguage): string[] {
  return language === 'ms' ? [...MONTH_NAMES_MS] : [...MONTH_NAMES_ID];
}

/** Format a date for display with weekday and/or month according to language */
export function formatDateWithLocale(
  date: Date,
  language: DateLocaleLanguage,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
): string {
  const locale = getDateLocale(language);
  return date.toLocaleDateString(locale, options);
}
