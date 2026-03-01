import { AbsensiGuru } from '../../../../types';
import { getTodayIndonesia } from '../../../../utils/absensiUtils';

export const getMyAttendance = (
  absensiGuru: AbsensiGuru[],
  userId: string | undefined,
  tanggal: string
): AbsensiGuru | undefined => {
  return absensiGuru.find(a => a.guruId === userId && a.tanggal === tanggal);
};

export interface AttendanceRecord {
  tanggal: string;
  attendance: AbsensiGuru | undefined;
  dateExistsInDb: boolean; // true if date exists in database, false otherwise
}

export const getRecentAttendance = (
  absensiGuru: AbsensiGuru[],
  userId: string | undefined,
  selectedMonth: number,
  selectedYear: number,
  datesInDb: string[] = [] // Array of dates that exist in database
): AttendanceRecord[] => {
  const attendanceData: AttendanceRecord[] = [];
  // Gunakan waktu Indonesia untuk konsistensi tanggal
  const todayStr = getTodayIndonesia();
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
  const currentMonth = todayMonth;
  const currentYear = todayYear;

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  let maxDay = daysInMonth;

  if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
    maxDay = 0;
  } else if (selectedYear === currentYear && selectedMonth === currentMonth) {
    maxDay = todayDay;
  }

  // Create a Set for faster lookup
  const datesInDbSet = new Set(datesInDb);

  for (let day = 1; day <= maxDay; day++) {
    const monthStr = String(selectedMonth).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
    const attendance = getMyAttendance(absensiGuru, userId, dateStr);
    const dateExistsInDb = datesInDbSet.has(dateStr);
    
    attendanceData.push({
      tanggal: dateStr,
      attendance,
      dateExistsInDb
    });
  }

  return attendanceData.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
};
