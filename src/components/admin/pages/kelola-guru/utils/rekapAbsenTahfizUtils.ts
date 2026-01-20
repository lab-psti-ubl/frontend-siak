import { SesiAbsensiTahfiz, TahfizSchedule, User } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../../hooks/useSantri';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface MeetingInfoTahfiz {
  pertemuanKe: number;
  tanggal: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  status: 'mengajar' | 'tidak_mengajar';
  sesiId?: string;
}

export interface StudentInfoTahfiz {
  id: string;
  name: string;
  nisn: string;
  email: string;
}

export interface AttendanceMatrixTahfiz {
  [studentId: string]: {
    [sesiId: string]: 'H' | 'A' | 'I' | 'S' | '-';
  };
}

export interface RekapAbsenTahfizData {
  meetings: MeetingInfoTahfiz[];
  students: StudentInfoTahfiz[];
  attendanceMatrix: AttendanceMatrixTahfiz;
}

const hariNames: Record<string, string> = {
  'senin': 'Senin',
  'selasa': 'Selasa',
  'rabu': 'Rabu',
  'kamis': 'Kamis',
  'jumat': 'Jumat',
  'sabtu': 'Sabtu',
  'minggu': 'Minggu',
};

const hariToDay: Record<string, number> = {
  'minggu': 0,
  'senin': 1,
  'selasa': 2,
  'rabu': 3,
  'kamis': 4,
  'jumat': 5,
  'sabtu': 6,
};

export const generateRekapAbsenTahfizData = (
  kelasId: string,
  jadwalId: string,
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[],
  jadwalTahfiz: TahfizSchedule[],
  kelasTahfiz: TahfizClass[],
  santri: User[],
  selectedYear: string
): RekapAbsenTahfizData => {
  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
  const kelas = kelasTahfiz.find(k => k.id === kelasId);
  
  if (!jadwal || !kelas) {
    return {
      meetings: [],
      students: [],
      attendanceMatrix: {},
    };
  }

  // Get all jadwal for this class to calculate meetings across all schedule days
  const allJadwalKelas = jadwalTahfiz
    .filter(j => j.kelasId === kelasId)
    .sort((a, b) => {
      return hariToDay[a.hari] - hariToDay[b.hari];
    });

  const meetings: MeetingInfoTahfiz[] = [];
  const startDate = new Date(`${selectedYear}-01-01`);
  const endDate = new Date(`${selectedYear}-12-31`);
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const actualEndDate = endDate < today ? endDate : today;

  // Generate all meeting dates for all schedule days
  const allMeetingDates: Array<{ tanggal: string; hari: string; jadwalId: string; jamMulai: string; jamSelesai: string }> = [];

  allJadwalKelas.forEach(j => {
    const targetDay = hariToDay[j.hari];
    let currentDate = new Date(startDate);

    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      allMeetingDates.push({
        tanggal: dateStr,
        hari: j.hari,
        jadwalId: j.id,
        jamMulai: j.jamMulai,
        jamSelesai: j.jamSelesai
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }
  });

  // Sort all meeting dates chronologically
  allMeetingDates.sort((a, b) => {
    const dateCompare = a.tanggal.localeCompare(b.tanggal);
    if (dateCompare !== 0) return dateCompare;
    return a.jamMulai.localeCompare(b.jamMulai);
  });

  // Assign meeting numbers sequentially and filter for selected jadwal
  let pertemuanCounter = 1;
  allMeetingDates.forEach(({ tanggal, hari, jadwalId: jId, jamMulai, jamSelesai }) => {
    // Only include meetings for the selected jadwal
    if (jId !== jadwalId) return;

    const session = sesiAbsensiTahfiz.find(s =>
      s.jadwalId === jId &&
      s.tanggal === tanggal &&
      s.tahun === selectedYear &&
      s.status === 'ditutup'
    );

    meetings.push({
      pertemuanKe: pertemuanCounter,
      tanggal,
      hari: hariNames[hari],
      jamMulai,
      jamSelesai,
      status: session ? 'mengajar' : 'tidak_mengajar',
      sesiId: session?.id,
    });

    pertemuanCounter++;
  });

  // Get santri for this class
  const students: StudentInfoTahfiz[] = kelas.santriIds
    .map(santriId => santri.find(s => s.id === santriId))
    .filter(Boolean)
    .map(s => ({
      id: s!.id,
      name: s!.name,
      nisn: (s as any).nisn || '',
      email: s!.email,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Build attendance matrix
  const attendanceMatrix: AttendanceMatrixTahfiz = {};

  students.forEach(student => {
    attendanceMatrix[student.id] = {};

    meetings.forEach(meeting => {
      if (!meeting.sesiId) {
        attendanceMatrix[student.id][meeting.sesiId || ''] = '-';
        return;
      }

      const session = sesiAbsensiTahfiz.find(s => s.id === meeting.sesiId);
      if (!session || !session.dataAbsensi) {
        attendanceMatrix[student.id][meeting.sesiId] = '-';
        return;
      }

      const absensiPelajaran = session.dataAbsensi.find(a => a.muridId === student.id);
      if (absensiPelajaran) {
        switch (absensiPelajaran.status) {
          case 'hadir':
            attendanceMatrix[student.id][meeting.sesiId] = 'H';
            break;
          case 'alfa':
            attendanceMatrix[student.id][meeting.sesiId] = 'A';
            break;
          case 'izin':
            attendanceMatrix[student.id][meeting.sesiId] = 'I';
            break;
          case 'sakit':
            attendanceMatrix[student.id][meeting.sesiId] = 'S';
            break;
          default:
            attendanceMatrix[student.id][meeting.sesiId] = '-';
        }
      } else {
        attendanceMatrix[student.id][meeting.sesiId] = '-';
      }
    });
  });

  return {
    meetings,
    students,
    attendanceMatrix,
  };
};

export const exportRekapAbsenTahfizToExcel = async (
  rekapData: RekapAbsenTahfizData,
  kelasName: string,
  tahun: string
): Promise<void> => {
  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const headers = ['No', 'Nama Santri', 'NISN'];
  rekapData.meetings.forEach(meeting => {
    headers.push(`P${meeting.pertemuanKe}(${formatTanggalShort(meeting.tanggal)})`);
  });
  headers.push('Hadir', 'Alfa', 'Izin', 'Sakit', 'Total');

  const data = rekapData.students.map((student, index) => {
    const row: any[] = [
      index + 1,
      student.name,
      student.nisn || '-',
    ];

    let hadir = 0;
    let alfa = 0;
    let izin = 0;
    let sakit = 0;

    rekapData.meetings.forEach(meeting => {
      const status = rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''] || '-';
      row.push(status);

      if (status === 'H') hadir++;
      else if (status === 'A') alfa++;
      else if (status === 'I') izin++;
      else if (status === 'S') sakit++;
    });

    row.push(hadir, alfa, izin, sakit, hadir + alfa + izin + sakit);

    return row;
  });

  const wsData = [
    ['REKAP ABSENSI TAHFIZ'],
    [`Kelas: ${kelasName}`],
    [`Tahun: ${tahun}`],
    [],
    headers,
    ...data,
    [],
    ['Keterangan:'],
    ['H = Hadir', 'A = Alfa', 'I = Izin', 'S = Sakit', '- = Tidak Ada Data'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 25 },
    { wch: 15 },
    ...Array.from({ length: rekapData.meetings.length }, () => ({ wch: 8 })),
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi Tahfiz');

  const filename = `Rekap_Absensi_Tahfiz_${kelasName.replace(/\s/g, '_')}_${tahun}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const printRekapAbsenTahfiz = (
  rekapData: RekapAbsenTahfizData,
  kelasName: string,
  tahun: string
): void => {
  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const doc = new jsPDF({
    orientation: rekapData.meetings.length > 12 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAP ABSENSI TAHFIZ', pageWidth / 2, currentY, { align: 'center' });

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kelas: ${kelasName}`, margin, currentY);
  currentY += 6;
  doc.text(`Tahun: ${tahun}`, margin, currentY);
  currentY += 10;

  const headers: any[][] = [];
  const headerRow: any[] = ['No', 'Nama Santri', 'NISN'];
  rekapData.meetings.forEach(meeting => {
    headerRow.push(`P${meeting.pertemuanKe}`);
  });
  headerRow.push('Hadir', 'Alfa', 'Izin', 'Sakit', 'Total');
  headers.push(headerRow);

  const data = rekapData.students.map((student, index) => {
    const row: any[] = [
      (index + 1).toString(),
      student.name,
      student.nisn || '-',
    ];

    let hadir = 0;
    let alfa = 0;
    let izin = 0;
    let sakit = 0;

    rekapData.meetings.forEach(meeting => {
      const status = rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''] || '-';
      row.push(status);

      if (status === 'H') hadir++;
      else if (status === 'A') alfa++;
      else if (status === 'I') izin++;
      else if (status === 'S') sakit++;
    });

    row.push(hadir.toString(), alfa.toString(), izin.toString(), sakit.toString(), (hadir + alfa + izin + sakit).toString());

    return row;
  });

  const colCount = 3 + rekapData.meetings.length + 5;
  const pertemuanColWidth = rekapData.meetings.length > 12 ? 6 : 8;

  const columnStyles: any = {
    0: { cellWidth: 10, halign: 'center' },
    1: { cellWidth: 40, halign: 'left' },
    2: { cellWidth: 20, halign: 'center' },
  };

  for (let i = 3; i < 3 + rekapData.meetings.length; i++) {
    columnStyles[i] = { cellWidth: pertemuanColWidth, halign: 'center' };
  }

  for (let i = 3 + rekapData.meetings.length; i < colCount; i++) {
    columnStyles[i] = { cellWidth: 12, halign: 'center' };
  }

  autoTable(doc, {
    head: headers,
    body: data,
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: rekapData.meetings.length > 15 ? 7 : 8,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles,
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Halaman ${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || currentY;
  let summaryY = finalY + 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Keterangan:', margin, summaryY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('H = Hadir', margin, summaryY + 5);
  doc.text('A = Alfa', margin + 30, summaryY + 5);
  doc.text('I = Izin', margin + 60, summaryY + 5);
  doc.text('S = Sakit', margin + 90, summaryY + 5);
  doc.text('- = Tidak Ada Data', margin + 120, summaryY + 5);

  const filename = `Rekap_Absensi_Tahfiz_${kelasName.replace(/\s/g, '_')}_${tahun}.pdf`;
  doc.save(filename);
};

