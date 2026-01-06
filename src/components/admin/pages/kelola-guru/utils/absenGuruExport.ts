import { User, AbsensiGuru, JadwalPelajaran, IzinGuru, ProfilSekolah } from '../../../../../types';
import { formatDateID } from '../../../../../utils/exportUtils';
import { getGuruAbsensiForDate, getGuruIzinForDate, getJadwalGuruForDate, getKeteranganAbsensi } from './absenGuruDataHelpers';
import { formatTimeDisplay } from '../../../../../utils/absensiUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { apiService } from '../../../../../services/apiService';

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

export const exportAbsensiReport = async (
  gurus: User[],
  absensiGuru: AbsensiGuru[],
  izinGuru: IzinGuru[],
  jadwalPelajaran: JadwalPelajaran[],
  selectedDate: string,
  activeTahunAjaran: any
) => {
  const data = gurus.map(guru => {
    const absensi = getGuruAbsensiForDate(absensiGuru, guru.id, selectedDate, activeTahunAjaran?.id);
    const izinAktif = getGuruIzinForDate(izinGuru, guru.id, selectedDate, activeTahunAjaran?.id);
    const jadwalHariIni = getJadwalGuruForDate(jadwalPelajaran, guru.id, selectedDate, activeTahunAjaran);
    const keterangan = getKeteranganAbsensi(absensi, izinAktif);

    return {
      nip: guru.nip,
      nama: guru.name,
      email: guru.email,
      jadwalHariIni: jadwalHariIni.length,
      jamMasuk: izinAktif ? '-' : (absensi?.jamMasuk ? formatTimeDisplay(absensi.jamMasuk) : '-'),
      statusMasuk: izinAktif ? izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1) : (absensi?.statusMasuk || 'Tidak Masuk'),
      jamKeluar: izinAktif ? '-' : (absensi?.jamKeluar ? formatTimeDisplay(absensi.jamKeluar) : '-'),
      statusKeluar: izinAktif ? izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1) : (absensi?.statusKeluar || 'Tidak Keluar'),
      keterangan: keterangan
    };
  });

  const columns = [
    { header: 'NIP', dataKey: 'nip', width: 20 },
    { header: 'Nama Guru', dataKey: 'nama', width: 25 },
    { header: 'Email', dataKey: 'email', width: 25 },
    { header: 'Jadwal Hari Ini', dataKey: 'jadwalHariIni', width: 15 },
    { header: 'Jam Masuk', dataKey: 'jamMasuk', width: 12 },
    { header: 'Status Masuk', dataKey: 'statusMasuk', width: 15 },
    { header: 'Jam Keluar', dataKey: 'jamKeluar', width: 12 },
    { header: 'Status Keluar', dataKey: 'statusKeluar', width: 15 },
    { header: 'Keterangan', dataKey: 'keterangan', width: 20 }
  ];

  const schoolData = await getSchoolDataFromDatabase();
  const filename = `absensi-guru-${selectedDate}`;

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Prepare worksheet data
  const worksheetData = [
    // Header sekolah - merged cells
    [schoolData.namaSekolah || 'Sekolah'],
    [schoolData.alamat || 'Alamat belum dikonfigurasi'],
    [`Telp: ${schoolData.nomorTelepon || '-'} | Email: ${schoolData.email || '-'}`],
    [], // Baris kosong
    ['LAPORAN ABSENSI GURU'],
    [`Tanggal: ${formatDateID(selectedDate)}`],
    [`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`],
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

  // Merge cells untuk header
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }, // Nama sekolah
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }, // Alamat
    { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } }, // Telp/Email
    { s: { r: 4, c: 0 }, e: { r: 4, c: columns.length - 1 } }, // LAPORAN ABSENSI GURU
    { s: { r: 5, c: 0 }, e: { r: 5, c: columns.length - 1 } }, // Tanggal
    { s: { r: 6, c: 0 }, e: { r: 6, c: columns.length - 1 } }, // Dicetak pada
  ];

  // Style untuk header tabel
  const headerRowIndex = 8;
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

  // Style untuk header sekolah dan judul
  const headerCells = [
    { r: 0, c: 0 }, // Nama sekolah
    { r: 4, c: 0 }, // LAPORAN ABSENSI GURU
  ];

  headerCells.forEach(cell => {
    const cellRef = XLSX.utils.encode_cell(cell);
    if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' };
    worksheet[cellRef].s = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportAbsensiReportPDF = async (
  gurus: User[],
  absensiGuru: AbsensiGuru[],
  izinGuru: IzinGuru[],
  jadwalPelajaran: JadwalPelajaran[],
  selectedDate: string,
  activeTahunAjaran: any
) => {
  const data = gurus.map(guru => {
    const absensi = getGuruAbsensiForDate(absensiGuru, guru.id, selectedDate, activeTahunAjaran?.id);
    const izinAktif = getGuruIzinForDate(izinGuru, guru.id, selectedDate, activeTahunAjaran?.id);
    const jadwalHariIni = getJadwalGuruForDate(jadwalPelajaran, guru.id, selectedDate, activeTahunAjaran);
    const keterangan = getKeteranganAbsensi(absensi, izinAktif);

    return {
      nip: guru.nip,
      nama: guru.name,
      jamMasuk: izinAktif ? '-' : (absensi?.jamMasuk ? formatTimeDisplay(absensi.jamMasuk) : '-'),
      statusMasuk: izinAktif ? izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1) : (absensi?.statusMasuk || 'Tidak Masuk'),
      jamKeluar: izinAktif ? '-' : (absensi?.jamKeluar ? formatTimeDisplay(absensi.jamKeluar) : '-'),
      statusKeluar: izinAktif ? izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1) : (absensi?.statusKeluar || 'Tidak Keluar'),
      keterangan: keterangan
    };
  });

  const columns = [
    { header: 'NIP', dataKey: 'nip', width: 30 },
    { header: 'Nama Guru', dataKey: 'nama', width: 30 },
    { header: 'Masuk', dataKey: 'jamMasuk', width: 15 },
    { header: 'Status Masuk', dataKey: 'statusMasuk', width: 25 },
    { header: 'Keluar', dataKey: 'jamKeluar', width: 15 },
    { header: 'Status Keluar', dataKey: 'statusKeluar', width: 25 },
    { header: 'Keterangan', dataKey: 'keterangan', width: 30 }
  ];

  const schoolData = await getSchoolDataFromDatabase();
  const filename = `absensi-guru-${selectedDate}`;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let currentY = margin;

  // Header - Logo on left and School Info on right
  const logoX = margin;
  const logoY = currentY;
  const maxLogoHeight = 18; // Maximum height in mm
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
  const namaSekolahLines = doc.splitTextToSize(schoolData.namaSekolah || 'Sekolah', infoWidth);
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
  currentY += 10;

  // Title - LAPORAN ABSENSI GURU
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('LAPORAN ABSENSI GURU', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Tanggal: ${formatDateID(selectedDate)}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Print date
  doc.setFontSize(9);
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
  const printTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.text(`Dicetak pada: ${printDate} ${printTime}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Table data
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '-')),
    startY: currentY,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue-500
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Gray-50
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as any),
    margin: { top: currentY, left: margin, right: margin },
  });

  // Footer - Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`${filename}.pdf`);
};
