import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProfilSekolah } from '../../../../../../types';

const DEFAULT_SCHOOL_DATA: ProfilSekolah = {
  id: 'default',
  namaSekolah: 'Sekolah',
  alamat: 'Alamat belum dikonfigurasi',
  nomorTelepon: '-',
  email: '-',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export interface MateriExportData {
  nomor: number;
  pertemuan: string;
  tanggal: string;
  judulMateri: string;
  deskripsi: string;
}

interface GuruInfo {
  nama: string;
  nip: string;
  mataPelajaran: string;
  kelas: string;
  jadwal: string;
}

export const exportMateriToExcel = (
  data: MateriExportData[],
  guruInfo: GuruInfo,
  filename: string,
  profilSekolah?: ProfilSekolah | null
) => {
  const schoolData = profilSekolah || DEFAULT_SCHOOL_DATA;

  const worksheetData = [
    [schoolData.namaSekolah],
    [schoolData.alamat],
    [`Telp: ${schoolData.nomorTelepon} | Email: ${schoolData.email}`],
    [],
    ['DAFTAR MATERI PEMBELAJARAN'],
    [],
    ['Nama Guru', guruInfo.nama],
    ['NIP', guruInfo.nip],
    ['Mata Pelajaran', guruInfo.mataPelajaran],
    ['Kelas', guruInfo.kelas],
    ['Jadwal', guruInfo.jadwal],
    [],
    ['No', 'Pertemuan', 'Tanggal', 'Judul Materi', 'Deskripsi Materi'],
    ...data.map(row => [row.nomor, row.pertemuan, row.tanggal, row.judulMateri, row.deskripsi])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const colWidths = [
    { wch: 8 },
    { wch: 12 },
    { wch: 15 },
    { wch: 25 },
    { wch: 40 }
  ];
  worksheet['!cols'] = colWidths;

  worksheet['!merges'] = [
    { s: { r: 0,  c: 0 }, e: { r: 0,  c: 4 } },
    { s: { r: 1,  c: 0 }, e: { r: 1,  c: 4 } },
    { s: { r: 2,  c: 0 }, e: { r: 2,  c: 4 } },
    { s: { r: 4,  c: 0 }, e: { r: 4,  c: 4 } },
    { s: { r: 6,  c: 0 }, e: { r: 6,  c: 0 } },
    { s: { r: 7,  c: 0 }, e: { r: 7,  c: 0 } },
    { s: { r: 8,  c: 0 }, e: { r: 8,  c: 0 } },
    { s: { r: 9,  c: 0 }, e: { r: 9,  c: 0 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 0 } }
  ];

  const headerRowIndex = 12;

  for (let i = 0; i < 5; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
    worksheet[cellRef] = worksheet[cellRef] || { t: 's', v: '' };
    worksheet[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top:    { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left:   { style: 'thin', color: { rgb: '000000' } },
        right:  { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }

  for (let r = headerRowIndex + 1; r < worksheetData.length; r++) {
    for (let c = 0; c < 5; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      worksheet[cellRef] = worksheet[cellRef] || { t: 's', v: '' };
      worksheet[cellRef].s = {
        border: {
          top:    { style: 'thin', color: { rgb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
          left:   { style: 'thin', color: { rgb: 'CCCCCC' } },
          right:  { style: 'thin', color: { rgb: 'CCCCCC' } }
        },
        alignment: { vertical: 'center', wrapText: true }
      };

      if ((r - headerRowIndex) % 2 === 0) {
        worksheet[cellRef].s.fill = { fgColor: { rgb: 'F8FAFC' } };
      }
    }
  }

  const schoolHeaderCells = [
    { r: 0, c: 0 },
    { r: 4, c: 0 }
  ];

  schoolHeaderCells.forEach(cell => {
    const cellRef = XLSX.utils.encode_cell(cell);
    worksheet[cellRef] = worksheet[cellRef] || { t: 's', v: '' };
    worksheet[cellRef].s = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Materi');

  XLSX.writeFile(workbook, `${filename}.xlsx`, { cellStyles: true });
};



/* ---------------------------------------------------------
   PDF (AUTO TABLE FIX)
----------------------------------------------------------*/

export const exportMateriToPDF = (
  data: MateriExportData[],
  guruInfo: GuruInfo,
  filename: string,
  profilSekolah?: ProfilSekolah | null
) => {

  const doc = new jsPDF('p', 'mm', 'a4');
  const schoolData = profilSekolah || DEFAULT_SCHOOL_DATA;
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;

  let currentY = 12;

  if (schoolData.logoSekolah) {
    try {
      doc.addImage(schoolData.logoSekolah, 'PNG', marginLeft, 8, 12, 12);
      currentY = 22;
    } catch {}
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolData.namaSekolah, pageWidth / 2, currentY, { align: 'center' });

  currentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolData.alamat, pageWidth / 2, currentY, { align: 'center' });

  currentY += 4;
  doc.setFontSize(8);
  doc.text(`Telp: ${schoolData.nomorTelepon} | Email: ${schoolData.email}`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 5;
  doc.line(15, currentY, pageWidth - 15, currentY);

  currentY += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DAFTAR MATERI PEMBELAJARAN', pageWidth / 2, currentY, { align: 'center' });

  currentY += 8;

  const infoLines = [
    `Nama Guru: ${guruInfo.nama}`,
    `NIP: ${guruInfo.nip}`,
    `Mata Pelajaran: ${guruInfo.mataPelajaran}`,
    `Kelas: ${guruInfo.kelas}`,
    `Jadwal: ${guruInfo.jadwal}`
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  infoLines.forEach(line => {
    doc.text(line, marginLeft, currentY);
    currentY += 4;
  });

  currentY += 3;

  /* ---- FIX TABLE HEADER + TABEL FULL OTOMATIS ---- */

  autoTable(doc, {
    startY: currentY,
    head: [[
      'No',
      'Pertemuan',
      'Tanggal',
      'Judul Materi',
      'Deskripsi Materi'
    ]],
    body: data.map(row => [
      row.nomor,
      row.pertemuan,
      row.tanggal,
      row.judulMateri,
      row.deskripsi
    ]),

    theme: 'grid',

    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [59, 130, 246], // biru
      textColor: [255, 255, 255],
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.1,
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },

    margin: { left: 15, right: 15 },

    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 28 },
      2: { halign: 'center', cellWidth: 35 },
      3: { cellWidth: 55 },
      4: { cellWidth: 55 }
    }
  });

  doc.save(`${filename}.pdf`);
};
