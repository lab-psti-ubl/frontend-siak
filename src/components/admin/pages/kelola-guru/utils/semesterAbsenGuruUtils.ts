import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { User, AbsensiGuru, IzinGuru, TahunAjaran, PengaturanAbsen, ProfilSekolah } from '../../../../../types';
import { getGuruAbsensiStatus, getKeteranganAbsensi, getGuruAbsensiForDate, getGuruIzinForDate, isTanggalExistsInDatabase } from './absenGuruDataHelpers';
import { apiService } from '../../../../../services/apiService';

interface RekapGuruSemesterData {
  guru: User;
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

export const getSemestersForTahunAjaran = (tahunAjaran: string, tahunAjaranData: TahunAjaran[]): number[] => {
  const semesters = tahunAjaranData
    .filter(ta => ta.tahun === tahunAjaran)
    .map(ta => ta.semester)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b);

  return semesters.length > 0 ? semesters : [1, 2];
};

export const getSemesterDateRange = (tahunAjaran: string, semester: number, tahunAjaranData?: TahunAjaran[]) => {
  if (!tahunAjaranData || tahunAjaranData.length === 0) {
    const startDate = new Date(new Date().getFullYear(), semester === 1 ? 6 : 0, 1);
    const endDate = new Date(new Date().getFullYear() + 1, semester === 1 ? 11 : 5, 31);
    return { startDate, endDate };
  }

  const taData = tahunAjaranData.find(ta => ta.tahun === tahunAjaran && ta.semester === semester);
  const startDate = taData?.tanggalMulai ? new Date(taData.tanggalMulai) : new Date();
  const endDate = taData?.tanggalSelesai ? new Date(taData.tanggalSelesai) : new Date();

  return { startDate, endDate };
};

export const getRekapSemesterGuruData = (
  gurus: User[],
  absensiGuru: AbsensiGuru[],
  izinGuru: IzinGuru[],
  tahunAjaran: string,
  semester: number,
  tahunAjaranData?: TahunAjaran[],
  pengaturanAbsen?: PengaturanAbsen[]
): RekapGuruSemesterData[] => {
  const { startDate, endDate } = getSemesterDateRange(tahunAjaran, semester, tahunAjaranData);
  const tahunAjaranId = tahunAjaranData?.find(ta => ta.tahun === tahunAjaran && ta.semester === semester)?.id;

  // Generate all dates in the semester range
  const allDatesInRange: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    allDatesInRange.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return gurus.map((guru) => {
    let totalHadir = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlfa = 0;
    let totalBolos = 0;
    let totalDispen = 0;

    // Helper functions with tahunAjaranId filter
    const getGuruAbsensiForDateFiltered = (tanggal: string): AbsensiGuru | undefined => {
      return getGuruAbsensiForDate(absensiGuru, guru.id, tanggal, tahunAjaranId);
    };

    const getGuruIzinForDateFiltered = (tanggal: string): IzinGuru | undefined => {
      return getGuruIzinForDate(izinGuru, guru.id, tanggal, tahunAjaranId);
    };

    // Process all dates in the semester range
    allDatesInRange.forEach(tanggal => {
      // Cek apakah tanggal ada di database dengan filter tahunAjaranId dan semester
      const tanggalExists = isTanggalExistsInDatabase(absensiGuru, tanggal, tahunAjaranId, semester);
      
      // Jika tanggal tidak ada di database, skip (tidak dihitung)
      if (!tanggalExists) {
        return;
      }

      // Get absensi and izin for this date
      const absen = getGuruAbsensiForDateFiltered(tanggal);
      const izin = getGuruIzinForDateFiltered(tanggal);

      // Use getKeteranganAbsensi to get the correct keterangan based on logic
      const keterangan = getKeteranganAbsensi(absen || undefined, izin, tanggalExists);

      // Skip '-' karena tidak dihitung dalam rekap
      if (keterangan === "Hadir") {
        totalHadir++;
      } else if (keterangan === "Izin") {
        totalIzin++;
      } else if (keterangan === "Sakit") {
        totalSakit++;
      } else if (keterangan === "Alfa") {
        totalAlfa++;
      } else if (keterangan === "Bolos") {
        totalBolos++;
      } else if (keterangan === "Dispen") {
        totalDispen++;
      }
      // If keterangan === '-', skip (tidak dihitung)
    });

    return {
      guru,
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlfa,
      totalBolos,
      totalDispen,
    };
  });
};

export const generateRekapSemesterGuruPDF = async (
  rekapData: RekapGuruSemesterData[],
  namaSekolah: string,
  tahunAjaran: string,
  semester: number,
  tanggalMulai?: string,
  tanggalSelesai?: string
) => {
  const schoolData = await getSchoolDataFromDatabase();
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

  // Semester info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap';
  doc.text(`Semester ${semesterLabel} ${tahunAjaran}`, pageWidth / 2, currentY, { align: 'center' });
  if (tanggalMulai && tanggalSelesai) {
    currentY += 5;
    doc.setFontSize(9);
    doc.text(`Periode: ${new Date(tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(tanggalSelesai).toLocaleDateString('id-ID')}`, pageWidth / 2, currentY, { align: 'center' });
  }
  currentY += 8;

  const heads = ['No', 'Nama Guru', 'NIP', 'H', 'I', 'S', 'A', 'B', 'D'];

  const body = rekapData.map((data, idx) => [
    idx + 1,
    data.guru.name,
    data.guru.nip || '-',
    data.totalHadir,
    data.totalIzin,
    data.totalSakit,
    data.totalAlfa,
    data.totalBolos,
    data.totalDispen,
  ]);

  autoTable(doc, {
    head: [heads],
    body: body,
    startY: currentY,
    margin: { left: 10, right: 10, top: 5, bottom: 10 },
    styles: {
      fontSize: 10,
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
      doc.setFontSize(9);
      doc.text(
        `${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
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

  doc.save(`Rekap_Absensi_Guru_Semester${semester}_${tahunAjaran.replace('/', '_')}.pdf`);
};

export const generateRekapSemesterGuruExcel = async (
  rekapData: RekapGuruSemesterData[],
  namaSekolah: string,
  tahunAjaran: string,
  semester: number,
  tanggalMulai?: string,
  tanggalSelesai?: string
) => {
  const schoolData = await getSchoolDataFromDatabase();
  const headers = ['No', 'Nama Guru', 'NIP', 'Hadir', 'Izin', 'Sakit', 'Alfa', 'Bolos', 'Dispen'];

  const data = rekapData.map((item, idx) => [
    idx + 1,
    item.guru.name,
    item.guru.nip || '-',
    item.totalHadir,
    item.totalIzin,
    item.totalSakit,
    item.totalAlfa,
    item.totalBolos,
    item.totalDispen,
  ]);

  const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap';
  const ws = XLSX.utils.aoa_to_sheet([
    [schoolData.namaSekolah || namaSekolah || 'Sekolah'],
    [schoolData.alamat || 'Alamat belum dikonfigurasi'],
    [`Telp: ${schoolData.nomorTelepon || '-'} | Email: ${schoolData.email || '-'}`],
    [],
    ['REKAP ABSENSI GURU'],
    [`Semester ${semesterLabel} ${tahunAjaran}`],
    tanggalMulai && tanggalSelesai
      ? [`Periode: ${new Date(tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(tanggalSelesai).toLocaleDateString('id-ID')}`]
      : [],
    [`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`],
    [],
    headers,
    ...data
  ]);

  // Merge cells untuk header
  const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Nama sekolah
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Alamat
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }, // Telp/Email
    { s: { r: 4, c: 0 }, e: { r: 4, c: headers.length - 1 } }, // REKAP ABSENSI GURU
    { s: { r: 5, c: 0 }, e: { r: 5, c: headers.length - 1 } }, // Semester
  ];
  
  if (tanggalMulai && tanggalSelesai) {
    merges.push({ s: { r: 6, c: 0 }, e: { r: 6, c: headers.length - 1 } }); // Periode
    merges.push({ s: { r: 7, c: 0 }, e: { r: 7, c: headers.length - 1 } }); // Dicetak pada
  } else {
    merges.push({ s: { r: 6, c: 0 }, e: { r: 6, c: headers.length - 1 } }); // Dicetak pada
  }
  
  ws['!merges'] = merges;

  ws['!cols'] = Array(headers.length).fill({ wch: 14 });
  
  // Set row heights based on whether periode exists
  if (tanggalMulai && tanggalSelesai) {
    ws['!rows'] = [
      { hpt: 20 },
      { hpt: 15 },
      { hpt: 15 },
      { hpt: 10 },
      { hpt: 20 },
      { hpt: 15 },
      { hpt: 15 },
      { hpt: 15 },
      { hpt: 10 },
      { hpt: 20 }
    ];
  } else {
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
  }

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
  const headerRowIndex = tanggalMulai && tanggalSelesai ? 9 : 8;
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
  XLSX.writeFile(wb, `Rekap_Absensi_Guru_Semester${semester}_${tahunAjaran.replace('/', '_')}.xlsx`);
};
