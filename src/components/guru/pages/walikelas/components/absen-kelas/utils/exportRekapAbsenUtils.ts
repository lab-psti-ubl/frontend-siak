import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { User, Absensi } from '../../../../../../../types';

interface RekapAbsenData {
  murid: User;
  absensiPerTanggal: Record<number, string>;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalBolos: number;
  totalDispen: number;
}

const getStatusCode = (status: string): string => {
  const statusMap: Record<string, string> = {
    hadir: 'H',
    izin: 'I',
    sakit: 'S',
    alfa: 'A',
    bolos: 'B',
    dispen: 'D',
  };
  return statusMap[status] || '-';
};

const isWeekend = (day: number, tahun: number, bulan: number): boolean => {
  const date = new Date(tahun, bulan - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

const getStatusColors = (day: number): { bg: string; text: string } => {
  const date = new Date();
  date.setDate(day);
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { bg: '#E5E7EB', text: '#6B7280' };
  }
  return { bg: '#FFFFFF', text: '#000000' };
};

export const generateRekapAbsenPDF = (
  data: RekapAbsenData[],
  namaKelas: string,
  bulan: number,
  tahun: number,
  namaWaliKelas: string,
  tahunAjaran?: string,
  semester?: number
) => {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;

  let y = margin + 8;

  doc.setFontSize(14);
  doc.text('REKAP ABSENSI SISWA', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.text(`Kelas: ${namaKelas}`, margin, y);
  y += 4;
  doc.text(`Bulan: ${monthNames[bulan - 1]} ${tahun}`, margin, y);
  y += 4;
  if (tahunAjaran && semester) {
    const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap';
    doc.text(`Tahun Ajaran: ${tahunAjaran} - Semester ${semesterLabel}`, margin, y);
    y += 4;
  }
  doc.text(`Wali Kelas: ${namaWaliKelas}`, margin, y);
  y += 6;

  doc.setFontSize(8);
  const tableData: any[] = [];
  const headers: string[] = ['No', 'Nama Murid', 'NISN'];

  for (let i = 1; i <= daysInMonth; i++) {
    headers.push(i.toString());
  }

  headers.push('H', 'I', 'S', 'A', 'B', 'D');

  data.forEach((student, index) => {
    const row: any[] = [
      index + 1,
      student.murid.name,
      student.murid.nisn || '-'
    ];

    for (let i = 1; i <= daysInMonth; i++) {
      row.push(student.absensiPerTanggal[i] || '-');
    }

    row.push(
      student.totalHadir,
      student.totalIzin,
      student.totalSakit,
      student.totalAlfa,
      student.totalBolos,
      student.totalDispen
    );

    tableData.push(row);
  });

  const columnStyles: any = {
    0: { halign: 'center', cellWidth: 8 },
    1: { halign: 'left', cellWidth: 30 },
    2: { halign: 'center', cellWidth: 20 },
  };

  for (let i = 3; i < 3 + daysInMonth; i++) {
    columnStyles[i] = {
      halign: 'center',
      cellWidth: 6,
      fillColor: isWeekend(i - 2, tahun, bulan) ? [203, 213, 225] : undefined,
    };
  }

  const headRowStyles: any[] = [];
  for (let i = 0; i < headers.length; i++) {
    if (i >= 3 && i < 3 + daysInMonth && isWeekend(i - 2, tahun, bulan)) {
      headRowStyles.push({ fillColor: [100, 116, 139] });
    } else if (i >= 3 && i < 3 + daysInMonth) {
      headRowStyles.push({ fillColor: [59, 130, 246] });
    } else {
      headRowStyles.push({ fillColor: [59, 130, 246] });
    }
  }

  (doc as any).autoTable({
    head: [headers],
    body: tableData,
    startY: y,
    margin: margin,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    didDrawCell: (data: any) => {
      if (data.section === 'head' && data.column.index >= 3 && data.column.index < 3 + daysInMonth) {
        if (isWeekend(data.column.index - 2, tahun, bulan)) {
          data.cell.styles.fillColor = [100, 116, 139];
        }
      }
      if (data.section === 'body' && data.column.index >= 3 && data.column.index < 3 + daysInMonth) {
        if (isWeekend(data.column.index - 2, tahun, bulan)) {
          data.cell.styles.fillColor = [226, 232, 240];
        }
      }
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles,
  });

  doc.save(`Rekap_Absensi_${namaKelas}_${monthNames[bulan - 1]}_${tahun}.pdf`);
};

export const generateRekapAbsenExcel = (
  data: RekapAbsenData[],
  namaKelas: string,
  bulan: number,
  tahun: number,
  namaWaliKelas: string,
  tahunAjaran?: string,
  semester?: number
) => {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  const wb = XLSX.utils.book_new();
  const wsData: any[] = [];

  wsData.push(['REKAP ABSENSI SISWA']);
  wsData.push([]);
  wsData.push([`Kelas: ${namaKelas}`]);
  wsData.push([`Bulan: ${monthNames[bulan - 1]} ${tahun}`]);
  if (tahunAjaran && semester) {
    const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap';
    wsData.push([`Tahun Ajaran: ${tahunAjaran} - Semester ${semesterLabel}`]);
  }
  wsData.push([`Wali Kelas: ${namaWaliKelas}`]);
  wsData.push([]);

  const headers: string[] = ['No', 'Nama Murid', 'NISN'];
  for (let i = 1; i <= daysInMonth; i++) {
    headers.push(i.toString());
  }
  headers.push('H', 'I', 'S', 'A', 'B', 'D');

  wsData.push(headers);

  data.forEach((student, index) => {
    const row: any[] = [
      index + 1,
      student.murid.name,
      student.murid.nisn || '-'
    ];

    for (let i = 1; i <= daysInMonth; i++) {
      row.push(student.absensiPerTanggal[i] || '-');
    }

    row.push(
      student.totalHadir,
      student.totalIzin,
      student.totalSakit,
      student.totalAlfa,
      student.totalBolos,
      student.totalDispen
    );

    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths: XLSX.ColInfo[] = [
    { wch: 4 },
    { wch: 25 },
    { wch: 12 }
  ];
  for (let i = 0; i < daysInMonth; i++) {
    colWidths.push({ wch: 3 });
  }
  colWidths.push({ wch: 3 }, { wch: 3 }, { wch: 3 }, { wch: 3 }, { wch: 3 }, { wch: 3 });

  ws['!cols'] = colWidths;

  const headerRowIndex = 6;
  const headerCellStartCol = 3;

  for (let col = 0; col < daysInMonth; col++) {
    const dayNum = col + 1;
    if (isWeekend(dayNum, tahun, bulan)) {
      const cellRef = XLSX.utils.encode_col(headerCellStartCol + col) + (headerRowIndex + 1);
      if (!ws[cellRef]) ws[cellRef] = {};
      if (!ws[cellRef].s) ws[cellRef].s = {};
      ws[cellRef].s.fill = { type: 'solid', fgColor: { rgb: 'FF9CA3AF' } };
      ws[cellRef].s.font = { bold: true, color: { rgb: 'FF000000' } };

      for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
        const dataCellRef = XLSX.utils.encode_col(headerCellStartCol + col) + (headerRowIndex + 2 + rowIdx);
        if (!ws[dataCellRef]) ws[dataCellRef] = {};
        if (!ws[dataCellRef].s) ws[dataCellRef].s = {};
        ws[dataCellRef].s.fill = { type: 'solid', fgColor: { rgb: 'FFE2E8F0' } };
      }
    } else {
      const cellRef = XLSX.utils.encode_col(headerCellStartCol + col) + (headerRowIndex + 1);
      if (!ws[cellRef]) ws[cellRef] = {};
      if (!ws[cellRef].s) ws[cellRef].s = {};
      ws[cellRef].s.fill = { type: 'solid', fgColor: { rgb: 'FF3B82F6' } };
      ws[cellRef].s.font = { bold: true, color: { rgb: 'FFFFFFFF' } };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');
  XLSX.writeFile(wb, `Rekap_Absensi_${namaKelas}_${monthNames[bulan - 1]}_${tahun}.xlsx`);
};
