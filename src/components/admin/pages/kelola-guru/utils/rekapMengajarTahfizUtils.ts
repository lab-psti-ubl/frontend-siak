import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RekapData } from '../components/RekapMengajarTahfizModal';

export type { RekapData };

const hariNames: Record<string, string> = {
  'senin': 'Senin',
  'selasa': 'Selasa',
  'rabu': 'Rabu',
  'kamis': 'Kamis',
  'jumat': 'Jumat',
  'sabtu': 'Sabtu',
  'minggu': 'Minggu',
};

export const exportRekapMengajarTahfizToExcel = (
  rekapData: RekapData,
  namaGuru: string,
  tahun: string
): void => {
  const headers = ['No', 'Kelas', 'Jadwal'];
  for (let i = 1; i <= rekapData.maxPertemuan; i++) {
    headers.push(i.toString());
  }

  const data = rekapData.classes.map((cls, idx) => {
    const row: any[] = [
      idx + 1,
      cls.namaKelas,
      cls.jadwalList
        .map(j => `${hariNames[j.hari]} ${j.jamMulai}-${j.jamSelesai}`)
        .join(', ')
    ];

    for (let i = 1; i <= rekapData.maxPertemuan; i++) {
      const meeting = cls.meetings[i];
      if (!meeting) {
        row.push('-');
      } else {
        const status = meeting.status === 'mengajar' ? 'M' : 'T';
        row.push(status);
      }
    }

    return row;
  });

  

  const wsData = [
    ['REKAP MENGAJAR TAHFIZ'],
    [`Ustadz: ${namaGuru}`],
    [`Tahun: ${tahun}`],
    [],
    headers,
    ...data,
    [],
   
    [],
    ['Keterangan:'],
    ['M = Mengajar'], ['T = Tidak Mengajar'], ['- = Tidak Ada Jadwal'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 }, // No
    { wch: 20 }, // Kelas
    { wch: 50 }, // Jadwal
    ...Array.from({ length: rekapData.maxPertemuan }, () => ({ wch: 5 })), // Pertemuan columns
  ];

  // Merge cells for header
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } },
    { s: { r: wsData.length - 2, c: 0 }, e: { r: wsData.length - 2, c: headers.length - 1 } },
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 2 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Mengajar Tahfiz');

  const filename = `Rekap_Mengajar_Tahfiz_${namaGuru.replace(/\s/g, '_')}_${tahun}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const printRekapMengajarTahfiz = (
  rekapData: RekapData,
  namaGuru: string,
  tahun: string
): void => {
  const doc = new jsPDF({
    orientation: rekapData.maxPertemuan > 12 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 15;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAP MENGAJAR TAHFIZ', pageWidth / 2, currentY, {
    align: 'center',
  });

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ustadz: ${namaGuru}`, margin, currentY);
  currentY += 6;
  doc.text(`Tahun: ${tahun}`, margin, currentY);
  currentY += 10;

  // Prepare table data
  const headers: any[][] = [];
  const headerRow: any[] = ['No', 'Kelas', 'Jadwal'];
  for (let i = 1; i <= rekapData.maxPertemuan; i++) {
    headerRow.push(i.toString());
  }
  headers.push(headerRow);

  const data = rekapData.classes.map((cls, idx) => {
    const jadwalText = cls.jadwalList
      .map(j => `${hariNames[j.hari]} ${j.jamMulai}-${j.jamSelesai}`)
      .join(', ');

    const row: any[] = [
      (idx + 1).toString(),
      cls.namaKelas,
      jadwalText,
      ...Array.from({ length: rekapData.maxPertemuan }, (_, i) => {
        const meeting = cls.meetings[i + 1];
        if (!meeting) return '-';
        return meeting.status === 'mengajar' ? 'M' : 'T';
      }),
    ];
    return row;
  });

  // Column styles
  const colCount = 3 + rekapData.maxPertemuan;
  const pertemuanColWidth = rekapData.maxPertemuan > 12 ? 6 : 8;

  const columnStyles: any = {
    0: { cellWidth: 10, halign: 'center' },
    1: { cellWidth: rekapData.maxPertemuan > 12 ? 25 : 35, halign: 'left' },
    2: { cellWidth: rekapData.maxPertemuan > 12 ? 40 : 50, halign: 'left', fontSize: 7 },
  };

  // Add column styles for pertemuan columns
  for (let i = 3; i < colCount; i++) {
    columnStyles[i] = { cellWidth: pertemuanColWidth, halign: 'center' };
  }

  autoTable(doc, {
    head: headers,
    body: data,
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: rekapData.maxPertemuan > 15 ? 7 : 8,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak',
      cellWidth: 'wrap',
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

  // Keterangan section
  let summaryY = finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Keterangan:', margin, summaryY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('M = Mengajar', margin, summaryY + 5);
  doc.text('T = Tidak Mengajar', margin + 40, summaryY + 5);
  doc.text('- = Tidak Ada Jadwal', margin + 85, summaryY + 5);

  const filename = `Rekap_Mengajar_Tahfiz_${namaGuru.replace(/\s/g, '_')}_${tahun}.pdf`;
  doc.save(filename);
};

