import { JadwalPelajaran, SesiAbsensi, Absensi, User, TahunAjaran, Murid, RiwayatKelasMurid } from '../../../../../../types';
import { getMuridByKelasAndTahunAjaran } from '../../../../../../utils/riwayatKelasMuridUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface MeetingInfo {
  pertemuanKe: number;
  tanggal: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  status: 'mengajar' | 'tidak_mengajar' | 'guru_memberi_absen';
  sesiId?: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  nisn: string;
  email: string;
}

export interface AttendanceMatrix {
  [studentId: string]: {
    [sesiId: string]: 'H' | 'A' | 'I' | 'S' | '-';
  };
}

export interface RekapAbsenData {
  meetings: MeetingInfo[];
  students: StudentInfo[];
  attendanceMatrix: AttendanceMatrix;
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

export const generateRekapAbsenData = (
  kelasId: string,
  mapelId: string,
  jadwalId: string,
  sesiAbsensi: SesiAbsensi[],
  absensi: Absensi[],
  users: User[],
  jadwalPelajaran: JadwalPelajaran[],
  tahunAjaran: TahunAjaran[],
  riwayatKelasMurid: RiwayatKelasMurid[] = []
): RekapAbsenData => {
  const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
  if (!jadwal) {
    return {
      meetings: [],
      students: [],
      attendanceMatrix: {},
    };
  }

  const activeTahunAjaran = tahunAjaran.find(
    ta => ta.tahun === jadwal.tahunAjaran && ta.semester === jadwal.semester
  );

  if (!activeTahunAjaran) {
    return {
      meetings: [],
      students: [],
      attendanceMatrix: {},
    };
  }

  const meetings: MeetingInfo[] = [];
  const startDate = new Date(activeTahunAjaran.tanggalMulai);
  const endDate = new Date(activeTahunAjaran.tanggalSelesai);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const actualEndDate = endDate < today ? endDate : today;

  const targetDay = hariToDay[jadwal.hari];
  let currentDate = new Date(startDate);

  while (currentDate.getDay() !== targetDay) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  let pertemuanCounter = 1;
  while (currentDate <= actualEndDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    const virtualSesiId = `virtual-${jadwal.id}-${dateStr}`;
    const session = sesiAbsensi.find(s =>
      (s.jadwalId === jadwal.id &&
      s.tanggal === dateStr &&
      s.status === 'ditutup') || s.id === virtualSesiId
    );

    if (session) {
      const hasAbsensi = absensi.some(a => a.sesiId === session.id);
      let meetingStatus: 'mengajar' | 'tidak_mengajar' | 'guru_memberi_absen' = 'mengajar';

      if (session.id.startsWith('virtual-')) {
        meetingStatus = hasAbsensi ? 'guru_memberi_absen' : 'tidak_mengajar';
      }

      meetings.push({
        pertemuanKe: pertemuanCounter,
        tanggal: dateStr,
        hari: hariNames[jadwal.hari],
        jamMulai: jadwal.jamMulai,
        jamSelesai: jadwal.jamSelesai,
        status: meetingStatus,
        sesiId: session.id,
      });
    } else {
      const hasAbsensi = absensi.some(a => a.sesiId === virtualSesiId);

      meetings.push({
        pertemuanKe: pertemuanCounter,
        tanggal: dateStr,
        hari: hariNames[jadwal.hari],
        jamMulai: jadwal.jamMulai,
        jamSelesai: jadwal.jamSelesai,
        status: hasAbsensi ? 'guru_memberi_absen' : 'tidak_mengajar',
        sesiId: virtualSesiId,
      });
    }

    pertemuanCounter++;
    currentDate.setDate(currentDate.getDate() + 7);
  }

  let muridList: User[];
  if (activeTahunAjaran && riwayatKelasMurid.length > 0) {
    muridList = getMuridByKelasAndTahunAjaran(
      kelasId,
      activeTahunAjaran.id,
      users,
      riwayatKelasMurid
    );
  } else {
    muridList = users.filter(u => u.role === 'murid' && (u as Murid).kelasId === kelasId);
  }

  const students: StudentInfo[] = muridList
    .map(u => ({
      id: u.id,
      name: u.name,
      nisn: (u as Murid).nisn,
      email: u.email,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const attendanceMatrix: AttendanceMatrix = {};

  students.forEach(student => {
    attendanceMatrix[student.id] = {};

    meetings.forEach(meeting => {
      const virtualSesiId = `virtual-${jadwalId}-${meeting.tanggal}`;
      const sesiIdToCheck = meeting.sesiId || virtualSesiId;

      // First, try to get from sesi.dataAbsensi (absensi pelajaran) - PRIMARY SOURCE
      const session = sesiAbsensi.find(s => s.id === sesiIdToCheck);
      let attendance = null;
      
      if (session?.dataAbsensi) {
        const absensiPelajaran = session.dataAbsensi.find(a => a.muridId === student.id);
        if (absensiPelajaran) {
          attendance = {
            status: absensiPelajaran.status,
            muridId: absensiPelajaran.muridId,
          };
        }
      }
      
      // Fallback to Absensi collection if not found in sesi.dataAbsensi
      if (!attendance) {
        const absensiFromCollection = absensi.find(
          a => a.muridId === student.id && a.sesiId === sesiIdToCheck
        );
        if (absensiFromCollection) {
          attendance = absensiFromCollection;
        }
      }

      if (attendance) {
        switch (attendance.status) {
          case 'hadir':
            attendanceMatrix[student.id][sesiIdToCheck] = 'H';
            break;
          case 'alfa':
            attendanceMatrix[student.id][sesiIdToCheck] = 'A';
            break;
          case 'izin':
            attendanceMatrix[student.id][sesiIdToCheck] = 'I';
            break;
          case 'sakit':
            attendanceMatrix[student.id][sesiIdToCheck] = 'S';
            break;
          default:
            attendanceMatrix[student.id][sesiIdToCheck] = '-';
        }
      } else {
        attendanceMatrix[student.id][sesiIdToCheck] = '-';
      }
    });
  });

  return {
    meetings,
    students,
    attendanceMatrix,
  };
};

export const exportRekapAbsenToExcel = async (
  rekapData: RekapAbsenData,
  kelasName: string,
  mapelName: string,
  tahunAjaran: string,
  semester: string
): Promise<void> => {
  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const headers = ['No', 'Nama Murid', 'NISN'];
  rekapData.meetings.forEach(meeting => {
    headers.push(`${meeting.pertemuanKe}(${formatTanggalShort(meeting.tanggal)})`);
  });

  const data = rekapData.students.map((student, idx) => {
    const row: any[] = [idx + 1, student.name, student.nisn];

    rekapData.meetings.forEach(meeting => {
      const attendance = rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''] || '-';
      row.push(attendance);
    });

    return row;
  });

  const wsData = [
    [`REKAP ABSENSI PERTEMUAN`],
    [`Kelas: ${kelasName}`],
    [`Mata Pelajaran: ${mapelName}`],
    [`Tahun Ajaran: ${tahunAjaran}`],
    [`Semester: ${semester}`],
    [],
    headers,
    ...data,
    [],
    ['Keterangan:'],
    ['H = Hadir', 'A = Alfa', 'I = Izin', 'S = Sakit', '- = Tidak Ada Absen'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  ws['!cols'] = [
    { wch: 5 },
    { wch: 25 },
    { wch: 15 },
    ...rekapData.meetings.map(() => ({ wch: 8 })),
  ];

  for (let R = 0; R <= 4; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'left' },
        };
      }
    }
  }

  for (let C = 0; C <= range.e.c; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 6, c: C });
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        fill: { fgColor: { rgb: 'DBEAFE' } },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        },
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');

  XLSX.writeFile(wb, `Rekap_Absensi_${kelasName}_${mapelName}_${tahunAjaran}_${semester}.xlsx`);
};

export const printRekapAbsen = (
  rekapData: RekapAbsenData,
  kelasName: string,
  mapelName: string,
  tahunAjaran: string,
  semester: string
): void => {
  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const doc = new jsPDF({
    orientation: rekapData.meetings.length > 8 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAP ABSENSI PERTEMUAN', doc.internal.pageSize.getWidth() / 2, 15, {
    align: 'center',
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kelas: ${kelasName}`, 14, 25);
  doc.text(`Mata Pelajaran: ${mapelName}`, 14, 30);
  doc.text(`Tahun Ajaran: ${tahunAjaran}`, 14, 35);
  doc.text(`Semester: ${semester}`, 14, 40);

  const headers = [
    // ['No', 'Nama Murid', 'NISN', ...rekapData.meetings.map(m => `${m.pertemuanKe}\n${formatTanggalShort(m.tanggal)}`)],
     ['No', 'Nama Murid', 'NISN', ...rekapData.meetings.map(m => `${m.pertemuanKe}`)],
  ];

  const data = rekapData.students.map((student, idx) => {
    const row = [
      (idx + 1).toString(),
      student.name,
      student.nisn,
      ...rekapData.meetings.map(meeting => {
        return rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''] || '-';
      }),
    ];
    return row;
  });

  autoTable(doc, {
    head: headers,
    body: data,
    startY: 45,
    theme: 'grid',
    styles: {
      fontSize: rekapData.meetings.length > 10 ? 7 : 8,
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
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: rekapData.meetings.length > 8 ? 40 : 60, halign: 'left' },
      2: { cellWidth: rekapData.meetings.length > 8 ? 30 : 35, halign: 'center' },
    },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Halaman ${data.pageNumber}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 45;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Keterangan:', 14, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.text('H = Hadir', 14, finalY + 15);
  doc.text('A = Alfa', 14, finalY + 20);
  doc.text('I = Izin', 14, finalY + 25);
  doc.text('S = Sakit', 14, finalY + 30);
  doc.text('- = Tidak Ada Absen (Guru Tidak Mengajar)', 14, finalY + 35);

  doc.save(`Rekap_Absensi_${kelasName}_${mapelName}_${tahunAjaran}_${semester}.pdf`);
};
