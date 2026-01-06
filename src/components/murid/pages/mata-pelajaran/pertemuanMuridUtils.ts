import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MeetingInfo {
  pertemuanKe: number;
  tanggal: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa' | 'guru_tidak_mengajar';
  sesiId?: string;
}

const formatTanggalShort = (tanggal: string) => {
  const date = new Date(tanggal);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'hadir': return 'Hadir';
    case 'izin': return 'Izin';
    case 'sakit': return 'Sakit';
    case 'alfa': return 'Alfa';
    case 'guru_tidak_mengajar': return 'Guru Tidak Mengajar';
    default: return '-';
  }
};

export const exportPertemuanMuridToExcel = (
  meetings: MeetingInfo[],
  namaMurid: string,
  nisn: string,
  kelas: string,
  mataPelajaran: string,
  tahunAjaran: string,
  semester: string,
  guruPengajar: string
): void => {
  const headers = ['No', 'Pertemuan', 'Tanggal', 'Hari', 'Jam', 'Status Kehadiran'];

  const data = meetings.map((meeting, idx) => [
    idx + 1,
    `Pertemuan ${meeting.pertemuanKe}`,
    formatTanggalShort(meeting.tanggal),
    meeting.hari,
    `${meeting.jamMulai} - ${meeting.jamSelesai}`,
    getStatusLabel(meeting.status),
  ]);

  const totalHadir = meetings.filter(m => m.status === 'hadir').length;
  const totalIzin = meetings.filter(m => m.status === 'izin').length;
  const totalSakit = meetings.filter(m => m.status === 'sakit').length;
  const totalAlfa = meetings.filter(m => m.status === 'alfa').length;

  const wsData = [
    ['DAFTAR PERTEMUAN MATA PELAJARAN'],
    [],
    ['Nama', namaMurid],
    ['NISN', nisn],
    ['Kelas', kelas],
    ['Mata Pelajaran', mataPelajaran],
    ['Tahun Ajaran', tahunAjaran],
    ['Semester', semester],
    ['Guru Pengajar', guruPengajar],
    [],
    headers,
    ...data,
    [],
    ['RINGKASAN KEHADIRAN'],
    ['Hadir', totalHadir],
    ['Izin', totalIzin],
    ['Sakit', totalSakit],
    ['Alfa', totalAlfa],
    ['Total Pertemuan', meetings.length],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pertemuan');

  XLSX.writeFile(wb, `Pertemuan_${mataPelajaran}_${namaMurid}_${tahunAjaran}_${semester}.xlsx`);
};

export const printPertemuanMurid = (
  meetings: MeetingInfo[],
  namaMurid: string,
  nisn: string,
  kelas: string,
  mataPelajaran: string,
  tahunAjaran: string,
  semester: string,
  guruPengajar: string
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DAFTAR PERTEMUAN MATA PELAJARAN', doc.internal.pageSize.getWidth() / 2, 15, {
    align: 'center',
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama: ${namaMurid}`, 14, 25);
  doc.text(`NISN: ${nisn}`, 14, 30);
  doc.text(`Kelas: ${kelas}`, 14, 35);
  doc.text(`Mata Pelajaran: ${mataPelajaran}`, 14, 40);
  doc.text(`Tahun Ajaran: ${tahunAjaran}`, 14, 45);
  doc.text(`Semester: ${semester}`, 14, 50);
  doc.text(`Guru Pengajar: ${guruPengajar}`, 14, 55);

  const headers = [['No', 'Pertemuan', 'Tanggal', 'Hari', 'Jam', 'Status Kehadiran']];

  const data = meetings.map((meeting, idx) => [
    (idx + 1).toString(),
    `Pertemuan ${meeting.pertemuanKe}`,
    formatTanggalShort(meeting.tanggal),
    meeting.hari,
    `${meeting.jamMulai} - ${meeting.jamSelesai}`,
    getStatusLabel(meeting.status),
  ]);

  autoTable(doc, {
    head: headers,
    body: data,
    startY: 60,
    theme: 'grid',
    styles: {
      fontSize: 8,
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
      1: { cellWidth: 25, halign: 'left' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' },
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

  const finalY = (doc as any).lastAutoTable.finalY || 60;

  const totalHadir = meetings.filter(m => m.status === 'hadir').length;
  const totalIzin = meetings.filter(m => m.status === 'izin').length;
  const totalSakit = meetings.filter(m => m.status === 'sakit').length;
  const totalAlfa = meetings.filter(m => m.status === 'alfa').length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN KEHADIRAN', 14, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.text(`Hadir: ${totalHadir}`, 14, finalY + 16);
  doc.text(`Izin: ${totalIzin}`, 14, finalY + 21);
  doc.text(`Sakit: ${totalSakit}`, 14, finalY + 26);
  doc.text(`Alfa: ${totalAlfa}`, 14, finalY + 31);
  doc.text(`Total Pertemuan: ${meetings.length}`, 14, finalY + 36);

  doc.save(`Pertemuan_${mataPelajaran}_${namaMurid}_${tahunAjaran}_${semester}.pdf`);
};
