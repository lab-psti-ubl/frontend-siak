import { JadwalPelajaran, SesiAbsensi, TahunAjaran, Kelas, MataPelajaran } from '../../../../../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MeetingInfo {
  pertemuanKe: number;
  tanggal: string;
  status: 'mengajar' | 'tidak_mengajar' | 'guru_memberi_absen';
  sesiId?: string;
}

interface SubjectMeetings {
  [pertemuanKe: number]: MeetingInfo;
}

interface SubjectInfo {
  jadwalId: string;
  kodeMapel: string;
  namaMapel: string;
  kelas: string;
  meetings: SubjectMeetings;
}

interface MeetingSummary {
  pertemuanKe: number;
  mengajar: number;
  memberiAbsen: number;
  tidakMengajar: number;
}

export interface RekapMengajarGuruData {
  subjects: SubjectInfo[];
  maxPertemuan: number;
  meetings: MeetingSummary[];
}

const hariToDay: Record<string, number> = {
  'minggu': 0,
  'senin': 1,
  'selasa': 2,
  'rabu': 3,
  'kamis': 4,
  'jumat': 5,
  'sabtu': 6,
};

export const generateRekapMengajarGuru = (
  guruId: string,
  tahun: string,
  semester: number,
  jadwalPelajaran: JadwalPelajaran[],
  sesiAbsensi: SesiAbsensi[],
  tahunAjaran: TahunAjaran[],
  kelas: Kelas[],
  mataPelajaran: MataPelajaran[]
): RekapMengajarGuruData | null => {
  const activeTahunAjaran = tahunAjaran.find(
    ta => ta.tahun === tahun && ta.semester === semester
  );

  if (!activeTahunAjaran) {
    return null;
  }

  const jadwalGuru = jadwalPelajaran.filter(
    j => j.guruId === guruId && j.tahunAjaran === tahun && j.semester === semester
  );

  if (jadwalGuru.length === 0) {
    return {
      subjects: [],
      maxPertemuan: 0,
      meetings: [],
    };
  }

  const startDate = new Date(activeTahunAjaran.tanggalMulai);
  const endDate = new Date(activeTahunAjaran.tanggalSelesai);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const actualEndDate = endDate < today ? endDate : today;

  const subjects: SubjectInfo[] = [];
  let maxPertemuan = 0;

  jadwalGuru.forEach(jadwal => {
    const kelasData = kelas.find(k => k.id === jadwal.kelasId);
    const mapelData = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId);

    if (!kelasData || !mapelData) return;

    const targetDay = hariToDay[jadwal.hari];
    let currentDate = new Date(startDate);

    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const meetings: SubjectMeetings = {};
    let pertemuanCounter = 1;

    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const virtualSesiId = `virtual-${jadwal.id}-${dateStr}`;
      const session = sesiAbsensi.find(s =>
        (s.jadwalId === jadwal.id &&
        s.tanggal === dateStr &&
        s.status === 'ditutup') || s.id === virtualSesiId
      );

      let meetingStatus: 'mengajar' | 'tidak_mengajar' | 'guru_memberi_absen' = 'tidak_mengajar';

      if (session) {
        if (session.id.startsWith('virtual-')) {
          meetingStatus = 'guru_memberi_absen';
        } else {
          meetingStatus = 'mengajar';
        }
      }

      meetings[pertemuanCounter] = {
        pertemuanKe: pertemuanCounter,
        tanggal: dateStr,
        status: meetingStatus,
        sesiId: session?.id || virtualSesiId,
      };

      pertemuanCounter++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    const totalPertemuan = pertemuanCounter - 1;
    if (totalPertemuan > maxPertemuan) {
      maxPertemuan = totalPertemuan;
    }

    subjects.push({
      jadwalId: jadwal.id,
      kodeMapel: mapelData.code,
      namaMapel: mapelData.name,
      kelas: kelasData.name,
      meetings,
    });
  });

  const meetingSummary: MeetingSummary[] = [];
  for (let i = 1; i <= maxPertemuan; i++) {
    let mengajar = 0;
    let memberiAbsen = 0;
    let tidakMengajar = 0;

    subjects.forEach(subject => {
      const meeting = subject.meetings[i];
      if (meeting) {
        if (meeting.status === 'mengajar') {
          mengajar++;
        } else if (meeting.status === 'guru_memberi_absen') {
          memberiAbsen++;
        } else {
          tidakMengajar++;
        }
      }
    });

    meetingSummary.push({
      pertemuanKe: i,
      mengajar,
      memberiAbsen,
      tidakMengajar,
    });
  }

  subjects.sort((a, b) => {
    const codeCompare = a.kodeMapel.localeCompare(b.kodeMapel);
    if (codeCompare !== 0) return codeCompare;
    return a.kelas.localeCompare(b.kelas);
  });

  return {
    subjects,
    maxPertemuan,
    meetings: meetingSummary,
  };
};

export const exportRekapMengajarToExcel = async (
  rekapData: RekapMengajarGuruData,
  namaGuru: string,
  tahunAjaran: string,
  semester: string
): Promise<void> => {
  const headers = ['No', 'Kode Mapel', 'Nama Mapel', 'Kelas'];
  for (let i = 1; i <= rekapData.maxPertemuan; i++) {
    headers.push(i.toString());
  }

  const data = rekapData.subjects.map((subject, idx) => {
    const row: any[] = [idx + 1, subject.kodeMapel, subject.namaMapel, subject.kelas];

    for (let i = 1; i <= rekapData.maxPertemuan; i++) {
      const meeting = subject.meetings[i];
      if (!meeting) {
        row.push('-');
      } else {
        let status = 'T';
        if (meeting.status === 'mengajar') {
          status = 'M';
        } else if (meeting.status === 'guru_memberi_absen') {
          status = 'A';
        }
        row.push(status);
      }
    }

    return row;
  });

  const wsData = [
    [`REKAP MENGAJAR GURU`],
    [`Guru: ${namaGuru}`],
    [`Tahun Ajaran: ${tahunAjaran}`],
    [`Semester: ${semester}`],
    [],
    headers,
    ...data,
    [],
    ['Keterangan:'],
    ['M = Guru Mengajar', 'A = Guru Memberi Absen', 'T = Tidak Mengajar', '- = Tidak Ada Jadwal'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    ...Array.from({ length: rekapData.maxPertemuan }, () => ({ wch: 5 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Mengajar');

  XLSX.writeFile(wb, `Rekap_Mengajar_${namaGuru.replace(/\s/g, '_')}_${tahunAjaran}_Semester_${semester}.xlsx`);
};

export const printRekapMengajar = (
  rekapData: RekapMengajarGuruData,
  namaGuru: string,
  tahunAjaran: string,
  semester: string
): void => {
  const doc = new jsPDF({
    orientation: rekapData.maxPertemuan > 12 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAP MENGAJAR GURU', doc.internal.pageSize.getWidth() / 2, 15, {
    align: 'center',
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Guru: ${namaGuru}`, 14, 25);
  doc.text(`Tahun Ajaran: ${tahunAjaran}`, 14, 30);
  doc.text(`Semester: ${semester}`, 14, 35);

  const headers = [
    ['No', 'Kode', 'Mata Pelajaran', 'Kelas', ...Array.from({ length: rekapData.maxPertemuan }, (_, i) => (i + 1).toString())],
  ];

  const data = rekapData.subjects.map((subject, idx) => {
    const row = [
      (idx + 1).toString(),
      subject.kodeMapel,
      subject.namaMapel,
      subject.kelas,
      ...Array.from({ length: rekapData.maxPertemuan }, (_, i) => {
        const meeting = subject.meetings[i + 1];
        if (!meeting) return '-';

        if (meeting.status === 'mengajar') return 'M';
        if (meeting.status === 'guru_memberi_absen') return 'A';
        return 'T';
      }),
    ];
    return row;
  });

  const colCount = 4 + rekapData.maxPertemuan;
  const pertemuanColWidth = rekapData.maxPertemuan > 12 ? 6 : 8;

  autoTable(doc, {
    head: headers,
    body: data,
    startY: 40,
    theme: 'grid',
    styles: {
      fontSize: rekapData.maxPertemuan > 15 ? 7 : 8,
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
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: rekapData.meetings.length > 8 ? 15 : 25, halign: 'center' },
      2: { cellWidth: rekapData.meetings.length > 8 ? 40 : 60, halign: 'left' },
      3: { cellWidth: rekapData.meetings.length > 8 ? 20 : 30, halign: 'center' },
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

  const finalY = (doc as any).lastAutoTable.finalY || 40;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Keterangan:', 14, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.text('M = Guru Mengajar', 14, finalY + 15);
  doc.text('A = Guru Memberi Absen', 14, finalY + 20);
  doc.text('T = Tidak Mengajar', 14, finalY + 25);
  doc.text('- = Tidak Ada Jadwal', 14, finalY + 30);

  doc.save(`Rekap_Mengajar_${namaGuru.replace(/\s/g, '_')}_${tahunAjaran}_Semester_${semester}.pdf`);
};
