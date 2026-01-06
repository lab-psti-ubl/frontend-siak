import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProfilSekolah } from '../types';

// Utility untuk mendapatkan data sekolah dari localStorage
const getSchoolDataFromStorage = (): ProfilSekolah | null => {
  try {
    const data = localStorage.getItem('profilSekolah');
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading school data from localStorage:', error);
  }
  return null;
};

// Default school data jika tidak ada di localStorage
const DEFAULT_SCHOOL_DATA: ProfilSekolah = {
  id: 'default',
  namaSekolah: 'Sekolah',
  alamat: 'Alamat belum dikonfigurasi',
  nomorTelepon: '-',
  email: '-',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Utility untuk format tanggal Indonesia
export const formatDateID = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Utility untuk format waktu Indonesia
export const formatTimeID = (timeString: string): string => {
  return new Date(timeString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Export ke PDF dengan jsPDF
export const exportToPDF = (
  data: any[],
  columns: { header: string; dataKey: string; width?: number }[],
  title: string,
  filename: string
) => {
  const schoolData = getSchoolDataFromStorage() || DEFAULT_SCHOOL_DATA;

  // Determine orientation based on number of columns
  // If columns > 8, use landscape, otherwise use portrait
  const useLandscape = columns.length > 8;
  const doc = new jsPDF(useLandscape ? 'landscape' : 'portrait');
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - (margin * 2);

  let currentY = 15;

  // Logo sekolah jika ada
  if (schoolData.logoSekolah) {
    try {
      doc.addImage(schoolData.logoSekolah, 'PNG', margin, 10, 15, 15);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // Header sekolah
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolData.namaSekolah, pageWidth / 2, currentY + 8, { align: 'center' });

  currentY += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolData.alamat, pageWidth / 2, currentY, { align: 'center' });

  currentY += 6;
  doc.text(`Telp: ${schoolData.nomorTelepon} | Email: ${schoolData.email}`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 8;
  // Garis pemisah
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 8;
  // Judul utama - bold dan center
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titleLines = title.split('\n');
  const mainTitle = titleLines[0]; // "DAFTAR NILAI MURID"
  doc.text(mainTitle, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Detail title (mata pelajaran, kelas, periode) - normal, rata kiri
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  titleLines.slice(1).forEach((line) => {
    doc.text(line, margin, currentY, { align: 'left' });
    currentY += 6;
  });

  currentY += 4;
  // Tanggal cetak - normal, rata kiri
  doc.setFontSize(9);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, margin, currentY, { align: 'left' });

  currentY += 8;
  
  // Calculate column widths proportionally based on available width
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 15), 0);
  const columnStyles: any = {};
  
  columns.forEach((col, index) => {
    const proportionalWidth = ((col.width || 15) / totalWidth) * usableWidth;
    columnStyles[index] = {
      cellWidth: proportionalWidth,
      fontSize: 8,
      overflow: 'linebreak',
      cellPadding: 3,
    };
  });

  // Tabel data dengan full width
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => {
      const value = row[col.dataKey];
      return value !== null && value !== undefined ? String(value) : '-';
    })),
    startY: currentY,
    margin: { top: currentY, left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue-500
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 9,
    },
    bodyStyles: {
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Gray-50
    },
    columnStyles: columnStyles,
    tableWidth: 'wrap',
    showHead: 'everyPage',
    showFoot: 'never',
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`${filename}.pdf`);
};

// Export ke Excel dengan jsexcel
export const exportToExcel = (
  data: any[],
  columns: { header: string; dataKey: string; width?: number }[],
  title: string,
  filename: string
) => {
  const schoolData = getSchoolDataFromStorage() || DEFAULT_SCHOOL_DATA;

  // Buat worksheet dengan header yang rapi
  const worksheetData = [
    // Header sekolah
    [schoolData.namaSekolah],
    [schoolData.alamat],
    [`Telp: ${schoolData.nomorTelepon} | Email: ${schoolData.email}`],
    [], // Baris kosong
    [title],
    [`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`],
    [], // Baris kosong
    // Header kolom
    columns.map(col => col.header),
    // Data
    ...data.map(row => columns.map(col => row[col.dataKey] || '-'))
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set lebar kolom
  const colWidths = columns.map(col => ({
    wch: col.width || 15
  }));
  worksheet['!cols'] = colWidths;

  // Merge cells untuk header sekolah
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: columns.length - 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: columns.length - 1 } },
  ];

  // Style untuk header
  const headerRowIndex = 7;
  for (let i = 0; i < columns.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
    if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' };
    worksheet[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }

  // Style untuk data rows
  for (let r = headerRowIndex + 1; r < worksheetData.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' };
      worksheet[cellRef].s = {
        border: {
          top: { style: 'thin', color: { rgb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
          left: { style: 'thin', color: { rgb: 'CCCCCC' } },
          right: { style: 'thin', color: { rgb: 'CCCCCC' } }
        },
        alignment: { vertical: 'center' }
      };

      if ((r - headerRowIndex) % 2 === 0) {
        worksheet[cellRef].s.fill = { fgColor: { rgb: 'F8FAFC' } };
      }
    }
  }

  // Style untuk header sekolah
  const schoolHeaderCells = [
    { r: 0, c: 0 },
    { r: 4, c: 0 },
  ];

  schoolHeaderCells.forEach(cell => {
    const cellRef = XLSX.utils.encode_cell(cell);
    if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' };
    worksheet[cellRef].s = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export CSV sederhana
export const exportToCSV = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename: string
) => {
  const csvContent = [
    // Header
    columns.map(col => col.header).join(','),
    // Data
    ...data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};