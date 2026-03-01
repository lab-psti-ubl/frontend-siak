import React, { useState, useMemo } from 'react';
import { Download, Printer, Calendar, BookOpen, GraduationCap, User, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User as UserType, SesiAbsensiTahfiz, TahfizSchedule } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import { exportRekapMengajarTahfizToExcel, printRekapMengajarTahfiz } from '../utils/rekapMengajarTahfizUtils';

interface RekapMengajarTahfizModalProps {
  guru: UserType;
  jadwalTahfiz: TahfizSchedule[];
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  kelasTahfiz: TahfizClass[];
}

interface MeetingInfo {
  pertemuanKe: number;
  tanggal: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  jadwalId: string;
  status: 'mengajar' | 'tidak_mengajar';
  sesiId?: string;
}

interface ClassInfo {
  kelasId: string;
  namaKelas: string;
  jadwalList: Array<{
    jadwalId: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
  }>;
  meetings: Record<number, MeetingInfo>; // Global meetings for all schedules in this class
}

export interface RekapData {
  classes: ClassInfo[];
  maxPertemuan: number;
  meetings: Array<{
    pertemuanKe: number;
    mengajar: number;
    tidakMengajar: number;
  }>;
}

const generateRekapMengajarTahfiz = (
  guruId: string,
  selectedYear: string,
  jadwalTahfiz: TahfizSchedule[],
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[],
  kelasTahfiz: TahfizClass[]
): RekapData | null => {
  // Get classes for this ustadz
  const myKelas = kelasTahfiz.filter(k => k.ustadzId === guruId);
  if (myKelas.length === 0) return null;

  const hariToDay: Record<string, number> = {
    'minggu': 0,
    'senin': 1,
    'selasa': 2,
    'rabu': 3,
    'kamis': 4,
    'jumat': 5,
    'sabtu': 6,
  };

  const hariNames: Record<string, string> = {
    'senin': 'Senin',
    'selasa': 'Selasa',
    'rabu': 'Rabu',
    'kamis': 'Kamis',
    'jumat': 'Jumat',
    'sabtu': 'Sabtu',
    'minggu': 'Minggu',
  };

  const startDate = new Date(`${selectedYear}-01-01`);
  const endDate = new Date(`${selectedYear}-12-31`);
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const actualEndDate = endDate < today ? endDate : today;

  const classes: ClassInfo[] = [];
  let maxPertemuan = 0;

  myKelas.forEach(kelas => {
    const jadwalKelas = jadwalTahfiz.filter(j => j.kelasId === kelas.id);
    if (jadwalKelas.length === 0) return;

    // Collect all meeting dates from all schedules in this class
    const allMeetingDates: Array<{
      tanggal: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      jadwalId: string;
    }> = [];

    // Generate all meeting dates for all schedules in this class
    jadwalKelas.forEach(j => {
      const targetDay = hariToDay[j.hari];
      let currentDate = new Date(startDate);

      // Find first occurrence of this day
      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate all dates for this schedule day
      while (currentDate <= actualEndDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        allMeetingDates.push({
          tanggal: dateStr,
          hari: j.hari,
          jamMulai: j.jamMulai,
          jamSelesai: j.jamSelesai,
          jadwalId: j.id
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    });

    // Sort all meeting dates chronologically (global for all schedules)
    allMeetingDates.sort((a, b) => {
      const dateCompare = a.tanggal.localeCompare(b.tanggal);
      if (dateCompare !== 0) return dateCompare;
      // If same date, sort by time
      return a.jamMulai.localeCompare(b.jamMulai);
    });

    // Assign meeting numbers sequentially (global counter for all schedules)
    const meetings: Record<number, MeetingInfo> = {};
    let pertemuanCounter = 1;

    allMeetingDates.forEach(({ tanggal, hari, jamMulai, jamSelesai, jadwalId }) => {
      const session = sesiAbsensiTahfiz.find(s =>
        s.jadwalId === jadwalId &&
        s.tanggal === tanggal &&
        s.tahun === selectedYear &&
        s.status === 'ditutup'
      );

      meetings[pertemuanCounter] = {
        pertemuanKe: pertemuanCounter,
        tanggal,
        hari,
        jamMulai,
        jamSelesai,
        jadwalId,
        status: session ? 'mengajar' : 'tidak_mengajar',
        sesiId: session?.id
      };

      if (pertemuanCounter > maxPertemuan) {
        maxPertemuan = pertemuanCounter;
      }

      pertemuanCounter++;
    });

    // Format jadwal list for display
    const jadwalList = jadwalKelas.map(j => ({
      jadwalId: j.id,
      hari: j.hari,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai
    })).sort((a, b) => {
      const dayOrder = hariToDay[a.hari] - hariToDay[b.hari];
      if (dayOrder !== 0) return dayOrder;
      return a.jamMulai.localeCompare(b.jamMulai);
    });

    classes.push({
      kelasId: kelas.id,
      namaKelas: kelas.namaKelas,
      jadwalList,
      meetings
    });
  });

  // Generate meeting summary
  const meetings: Array<{ pertemuanKe: number; mengajar: number; tidakMengajar: number }> = [];
  for (let i = 1; i <= maxPertemuan; i++) {
    let mengajar = 0;
    let tidakMengajar = 0;

    classes.forEach(cls => {
      const meeting = cls.meetings[i];
      if (meeting) {
        if (meeting.status === 'mengajar') {
          mengajar++;
        } else {
          tidakMengajar++;
        }
      }
    });

    meetings.push({
      pertemuanKe: i,
      mengajar,
      tidakMengajar
    });
  }

  return {
    classes,
    maxPertemuan,
    meetings
  };
};

const RekapMengajarTahfizModal: React.FC<RekapMengajarTahfizModalProps> = ({
  guru,
  jadwalTahfiz,
  sesiAbsensiTahfiz,
  kelasTahfiz
}) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ms' ? 'ms-MY' : 'id-ID';
  const hariNames: Record<string, string> = useMemo(() => {
    const keys = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const base = new Date(2024, 0, 7);
    const result: Record<string, string> = {};
    keys.forEach((key, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      result[key] = d.toLocaleDateString(dateLocale, { weekday: 'long' });
    });
    return result;
  }, [dateLocale]);

  // Get available years from sesiAbsensiTahfiz
  const availableYears = useMemo(() => {
    const years = sesiAbsensiTahfiz
      .map(s => s.tahun)
      .filter((year, index, self) => self.indexOf(year) === index)
      .sort((a, b) => b.localeCompare(a));
    return years.length > 0 ? years : [new Date().getFullYear().toString()];
  }, [sesiAbsensiTahfiz]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());

  const rekapData = useMemo(() => {
    if (!selectedYear) return null;

    return generateRekapMengajarTahfiz(
      guru.id,
      selectedYear,
      jadwalTahfiz,
      sesiAbsensiTahfiz,
      kelasTahfiz
    );
  }, [guru.id, selectedYear, jadwalTahfiz, sesiAbsensiTahfiz, kelasTahfiz]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
              <div className="flex-shrink-0 h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg sm:text-xl">
                {getInitials(guru.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('detailAbsensiModal.rekapMengajarTahfizTitle')}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {guru.name}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  if (rekapData) {
                    exportRekapMengajarTahfizToExcel(rekapData, guru.name, selectedYear);
                  }
                }}
                variant="secondary"
                className="flex items-center justify-center text-xs sm:text-sm px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-300 w-full sm:w-auto"
                disabled={!rekapData}
              >
                <FileSpreadsheet size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('detailAbsensiModal.exportExcel')}</span>
                <span className="sm:hidden">{t('detailAbsensiModal.excel')}</span>
              </Button>
              <Button
                onClick={() => {
                  if (rekapData) {
                    printRekapMengajarTahfiz(rekapData, guru.name, selectedYear);
                  }
                }}
                variant="secondary"
                className="flex items-center justify-center text-xs sm:text-sm px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-300 w-full sm:w-auto"
                disabled={!rekapData}
              >
                <Printer size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('detailAbsensiModal.cetak')} PDF</span>
                <span className="sm:hidden">{t('detailAbsensiModal.pdf')}</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-blue-200">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <User size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600">{t('detailAbsensiModal.ustadz')}:</span>
                  <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                    {guru.name}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <GraduationCap size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600">{t('detailAbsensiModal.nip')}:</span>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">
                    {guru.nip || '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Calendar size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm text-gray-600 block">{t('detailAbsensiModal.tahun')}:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="mt-1 w-full px-2 sm:px-3 py-1.5 border border-blue-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <BookOpen size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600 block">{t('detailAbsensiModal.totalKelas')}:</span>
                  <p className="font-semibold text-sm sm:text-base text-gray-900 mt-1">
                    {rekapData?.classes.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {rekapData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {rekapData.classes.reduce((sum, cls) => {
                    return sum + Object.keys(cls.meetings).length;
                  }, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('detailAbsensiModal.totalPertemuan')}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {rekapData.meetings.reduce((sum, m) => sum + m.mengajar, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('detailAbsensiModal.mengajar')}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-r from-red-50 to-red-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {rekapData.meetings.reduce((sum, m) => sum + m.tidakMengajar, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('detailAbsensiModal.tidakMengajar')}</p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell header className="sticky left-0 z-10 bg-white border-r text-xs sm:text-sm">No</TableCell>
                      <TableCell header className="sticky left-12 z-10 bg-white border-r text-xs sm:text-sm">Kelas</TableCell>
                      <TableCell header className="sticky min-w-32 left-32 z-10 bg-white border-r text-xs sm:text-sm">Jadwal</TableCell>
                      {Array.from({ length: rekapData.maxPertemuan }, (_, i) => (
                        <TableCell key={i + 1} header className="text-center min-w-10 text-xs sm:text-sm">
                          {i + 1}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapData.classes.map((cls, clsIdx) => {
                      return (
                        <TableRow key={cls.kelasId} className="hover:bg-gray-50">
                          <TableCell className="sticky left-0 z-10 bg-white border-r text-xs sm:text-sm">
                            {clsIdx + 1}
                          </TableCell>
                          <TableCell className="sticky left-12 z-10 bg-white border-r font-medium text-xs sm:text-sm">
                            {cls.namaKelas}
                          </TableCell>
                          <TableCell className="sticky left-32 z-10 bg-white border-r font-medium text-xs sm:text-sm">
                            <div className="flex flex-col gap-1">
                              {cls.jadwalList.map((j, idx) => (
                                <span key={j.jadwalId} className="text-xs">
                                  {hariNames[j.hari]} {j.jamMulai}-{j.jamSelesai}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          {Array.from({ length: rekapData.maxPertemuan }, (_, i) => {
                            const meeting = cls.meetings[i + 1];
                            if (!meeting) {
                              return (
                                <TableCell key={i + 1} className="text-center text-gray-300 text-xs sm:text-sm">
                                  -
                                </TableCell>
                              );
                            }

                            const bgColor = meeting.status === 'mengajar' ? 'bg-green-50' : 'bg-red-50';
                            const textColor = meeting.status === 'mengajar' ? 'text-green-700' : 'text-red-700';
                            const status = meeting.status === 'mengajar' ? 'M' : 'T';

                            return (
                              <TableCell
                                key={i + 1}
                                className={`text-center font-semibold text-xs sm:text-sm ${bgColor} ${textColor}`}
                                title={`Pertemuan ${meeting.pertemuanKe}\nTanggal: ${meeting.tanggal}\nHari: ${hariNames[meeting.hari]}\nJam: ${meeting.jamMulai}-${meeting.jamSelesai}\nStatus: ${
                                  meeting.status === 'mengajar' ? 'Mengajar' : 'Tidak Mengajar'
                                }`}
                              >
                                {status}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('detailAbsensiModal.keteranganStatus')}:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                    <span className="font-semibold text-green-700">M</span>
                  </div>
                  <span className="text-gray-700">{t('detailAbsensiModal.mengajar')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
                    <span className="font-semibold text-red-700">T</span>
                  </div>
                  <span className="text-gray-700">{t('detailAbsensiModal.tidakMengajar')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center border border-gray-200">
                    <span className="font-semibold text-gray-400">-</span>
                  </div>
                  <span className="text-gray-700">{t('detailAbsensiModal.tidakAdaJadwal')}</span>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {!rekapData && (
        <Card className="p-8 sm:p-12">
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-base sm:text-lg font-medium">{t('detailAbsensiModal.tidakAdaDataRekapTahfiz')}</p>
            <p className="text-xs sm:text-sm mt-2 text-gray-600">{t('detailAbsensiModal.pilihTahunRekap')}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RekapMengajarTahfizModal;

