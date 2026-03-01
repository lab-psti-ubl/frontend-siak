import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProfilSekolah } from '../../../../../types';
import { apiService } from '../../../../../services/apiService';
import { getMonthNames, getDateLocale, type DateLocaleLanguage } from '../../../../../utils/dateLocaleUtils';

interface RekapGuruData {
  guru: any;
  absensiPerTanggal: Record<number, string>;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalBolos: number;
  totalDispen: number;
}

// Get school data from database
async function getSchoolDataFromDatabase(): Promise<ProfilSekolah> {
  try {
    const response = await apiService.getProfilSekolah();
    if (response.success && response.profilSekolah) {
      return response.profilSekolah;
    }
  } catch (error) {
    console.error('Error fetching school data from database:', error);
    // Fallback to localStorage if API fails
    try {
      const data = localStorage.getItem('profilSekolah');
      if (data) {
        return JSON.parse(data);
      }
    } catch (localError) {
      console.error('Error reading school data from localStorage:', localError);
    }
  }
  // Default fallback
  return {
    id: 'default',
    namaSekolah: 'Sekolah',
    alamat: 'Alamat belum dikonfigurasi',
    nomorTelepon: '-',
    email: '-',
    logoSekolah: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Helper function to get image dimensions and calculate size with aspect ratio
async function getImageDimensionsWithAspectRatio(
  imageSrc: string,
  maxHeight: number
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let width = maxHeight * aspectRatio;
      let height = maxHeight;
      
      // If width exceeds maximum, scale down proportionally
      const maxWidth = maxHeight * 2; // Allow up to 2x width for wide logos
      if (width > maxWidth) {
        width = maxWidth;
        height = maxWidth / aspectRatio;
      }
      
      resolve({ width, height });
    };
    img.onerror = () => {
      // Fallback to square if image fails to load
      resolve({ width: maxHeight, height: maxHeight });
    };
    img.src = imageSrc;
  });
}

export const generateRekapAbsenGuruPDF = async (
  rekapData: RekapGuruData[],
  namaSekolah: string,
  bulan: number,
  tahun: number,
  language: DateLocaleLanguage = 'id'
) => {
  const monthNames = getMonthNames(language);
  const schoolData = await getSchoolDataFromDatabase();
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  const daysInMonth = Object.keys(rekapData[0]?.absensiPerTanggal || {}).length;

  let currentY = margin;

  // Header - Logo on left and School Info on right
  const logoX = margin;
  const logoY = currentY;
  const maxLogoHeight = 20; // Maximum height in mm
  let logoWidth = maxLogoHeight;
  let logoHeight = maxLogoHeight;

  // Get logo dimensions with aspect ratio
  if (schoolData.logoSekolah) {
    try {
      const dimensions = await getImageDimensionsWithAspectRatio(schoolData.logoSekolah, maxLogoHeight);
      logoWidth = dimensions.width;
      logoHeight = dimensions.height;
      
      // Determine image format
      let imageFormat: 'PNG' | 'JPEG' | 'JPG' = 'PNG';
      if (schoolData.logoSekolah.startsWith('data:image/jpeg') || schoolData.logoSekolah.startsWith('data:image/jpg')) {
        imageFormat = 'JPEG';
      }
      
      doc.addImage(schoolData.logoSekolah, imageFormat, logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Use default square size if error
      logoWidth = maxLogoHeight;
      logoHeight = maxLogoHeight;
    }
  }

  // School info on the right side of logo
  const infoX = logoX + logoWidth + 8;
  const infoWidth = contentWidth - logoWidth - 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const namaSekolahLines = doc.splitTextToSize(schoolData.namaSekolah || namaSekolah || 'Sekolah', infoWidth);
  doc.text(namaSekolahLines, infoX, logoY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const alamatY = logoY + 6 + (namaSekolahLines.length * 5);
  const alamatLines = doc.splitTextToSize(schoolData.alamat || 'Alamat belum dikonfigurasi', infoWidth);
  doc.text(alamatLines, infoX, alamatY);

  const contactY = alamatY + (alamatLines.length * 5) + 2;
  doc.setFontSize(8);
  doc.text(`Telp: ${schoolData.nomorTelepon || '-'} | Email: ${schoolData.email || '-'}`, infoX, contactY, { maxWidth: infoWidth });

  // Update currentY based on the tallest element (logo or text)
  const textBottom = contactY + 4;
  const logoBottom = logoY + logoHeight;
  currentY = Math.max(textBottom, logoBottom) + 8;

  // Separator line
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Title - REKAP ABSENSI GURU
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('REKAP ABSENSI GURU', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  // Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Bulan: ${monthNames[bulan - 1]} ${tahun}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  const daysInMonthDate = new Date(tahun, bulan, 0).getDate();
  const heads = ['No', 'Nama Guru', 'NIP'];
  for (let i = 1; i <= daysInMonthDate; i++) {
    heads.push(i.toString());
  }
  heads.push('H', 'I', 'S', 'A', 'B', 'D');

  const body = rekapData.map((data, idx) => {
    const row = [
      idx + 1,
      data.guru.name,
      data.guru.nip || '-'
    ];

    for (let i = 1; i <= daysInMonthDate; i++) {
      row.push(data.absensiPerTanggal[i] || '-');
    }

    row.push(
      data.totalHadir,
      data.totalIzin,
      data.totalSakit,
      data.totalAlfa,
      data.totalBolos,
      data.totalDispen
    );

    return row;
  });

  autoTable(doc, {
    head: [heads],
    body: body,
    startY: currentY,
    margin: { left: 5, right: 5, top: 5, bottom: 5 },
    styles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFontSize(10);
        doc.text(
          `${data.pageNumber}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }
    },
  });

  doc.setFontSize(9);
  const legend = [
    'H = Hadir',
    'I = Izin',
    'S = Sakit',
    'A = Alfa',
    'B = Bolos',
    'D = Dispen'
  ];

  let legendY = doc.internal.pageSize.getHeight() - 15;
  legend.forEach((item, idx) => {
    if (idx % 3 === 0 && idx > 0) legendY -= 5;
    doc.text(item, 10 + ((idx % 3) * 60), legendY);
  });

  doc.save(`Rekap_Absensi_Guru_${monthNames[bulan - 1]}_${tahun}.pdf`);
};

export const generateRekapAbsenGuruExcel = async (
  rekapData: RekapGuruData[],
  namaSekolah: string,
  bulan: number,
  tahun: number,
  language: DateLocaleLanguage = 'id'
) => {
  const monthNames = getMonthNames(language);
  const dateLocale = getDateLocale(language);
  const schoolData = await getSchoolDataFromDatabase();
  const daysInMonthDate = new Date(tahun, bulan, 0).getDate();
  const headers = ['No', 'Nama Guru', 'NIP'];

  for (let i = 1; i <= daysInMonthDate; i++) {
    headers.push(`${i}`);
  }

  headers.push('Hadir', 'Izin', 'Sakit', 'Alfa', 'Bolos', 'Dispen');

  const data = rekapData.map((item, idx) => {
    const row = [
      idx + 1,
      item.guru.name,
      item.guru.nip || '-'
    ];

    for (let i = 1; i <= daysInMonthDate; i++) {
      row.push(item.absensiPerTanggal[i] || '-');
    }

    row.push(
      item.totalHadir,
      item.totalIzin,
      item.totalSakit,
      item.totalAlfa,
      item.totalBolos,
      item.totalDispen
    );

    return row;
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [schoolData.namaSekolah || namaSekolah || 'Sekolah'],
    [schoolData.alamat || 'Alamat belum dikonfigurasi'],
    [`Telp: ${schoolData.nomorTelepon || '-'} | Email: ${schoolData.email || '-'}`],
    [],
    ['REKAP ABSENSI GURU'],
    [`Bulan: ${monthNames[bulan - 1]} ${tahun}`],
    [`Dicetak pada: ${new Date().toLocaleDateString(dateLocale)} ${new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`],
    [],
    headers,
    ...data
  ]);

  // Merge cells untuk header
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Nama sekolah
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Alamat
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }, // Telp/Email
    { s: { r: 4, c: 0 }, e: { r: 4, c: headers.length - 1 } }, // REKAP ABSENSI GURU
    { s: { r: 5, c: 0 }, e: { r: 5, c: headers.length - 1 } }, // Bulan
    { s: { r: 6, c: 0 }, e: { r: 6, c: headers.length - 1 } }, // Dicetak pada
  ];

  ws['!cols'] = Array(headers.length).fill({ wch: 12 });
  ws['!rows'] = [
    { hpt: 20 },
    { hpt: 15 },
    { hpt: 15 },
    { hpt: 10 },
    { hpt: 20 },
    { hpt: 15 },
    { hpt: 15 },
    { hpt: 10 },
    { hpt: 20 }
  ];

  // Style untuk header sekolah dan judul
  const headerCells = [
    { r: 0, c: 0 }, // Nama sekolah
    { r: 4, c: 0 }, // REKAP ABSENSI GURU
  ];

  headerCells.forEach(cell => {
    const cellRef = XLSX.utils.encode_cell(cell);
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
    ws[cellRef].s = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  });

  // Style untuk header tabel
  const headerRowIndex = 8;
  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1976D2' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');
  XLSX.writeFile(wb, `Rekap_Absensi_Guru_${monthNames[bulan - 1]}_${tahun}.xlsx`);
};
