import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ERaport, User, ProfilSekolah } from '../types';
import { apiService } from '../services/apiService';

interface ERaportPdfData {
  eraport: ERaport;
  muridData: ERaport['muridData'][0];
  selectedMurid: User;
  profilSekolah?: ProfilSekolah | null;
}

// Helper function untuk format tanggal Indonesia
const formatTanggalIndonesia = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Jika tanggal tidak valid, gunakan tanggal sekarang
      const now = new Date();
      const bulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;
    }
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const tanggal = date.getDate();
    const bulanIndex = date.getMonth();
    const tahun = date.getFullYear();
    return `${tanggal} ${bulan[bulanIndex]} ${tahun}`;
  } catch (error) {
    // Fallback ke tanggal sekarang jika error
    const now = new Date();
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;
  }
};

// Generate PDF and return as blob URL for preview
export const generateERaportPDFBlob = async (data: ERaportPdfData): Promise<string> => {
  const { eraport, muridData, selectedMurid, profilSekolah } = data;
  
  // Get profil sekolah if not provided
  let sekolahData = profilSekolah;
  if (!sekolahData) {
    try {
      const response = await apiService.getProfilSekolah();
      if (response.success && response.profilSekolah) {
        sekolahData = response.profilSekolah;
      }
    } catch (error) {
      console.error('Error fetching profil sekolah:', error);
    }
  }
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20; // 20mm margin
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to check if new page is needed
  const checkNewPage = (requiredHeight: number): boolean => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 12,
    isBold: boolean = false,
    align: 'left' | 'center' | 'right' = 'left'
  ): number => {
    doc.setFontSize(fontSize);
    doc.setFont('times', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    
    let currentY = y;
    lines.forEach((line: string) => {
      if (currentY > pageHeight - margin - 5) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, x, currentY, { align });
      currentY += fontSize * 0.5;
    });
    
    return currentY;
  };

  // Header dengan Logo dan Data Sekolah
  const headerStartY = yPosition;
  const logoSize = 25; // Ukuran logo dalam mm
  const logoX = margin;
  const logoY = headerStartY;
  const infoX = logoX + logoSize + 5; // Posisi info sekolah (setelah logo + spacing lebih kecil)
  const infoWidth = contentWidth - logoSize - 5;

  // Draw logo jika ada
  if (sekolahData?.logoSekolah) {
    try {
      // Try different image formats
      let imageFormat: 'PNG' | 'JPEG' | 'JPG' = 'PNG';
      const logoData = sekolahData.logoSekolah;
      if (logoData.startsWith('data:image/jpeg') || logoData.startsWith('data:image/jpg')) {
        imageFormat = 'JPEG';
      }
      doc.addImage(logoData, imageFormat, logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error('Error adding logo:', error);
      // Continue without logo if there's an error
    }
  }

  // Data sekolah di kanan logo - sejajar dengan logo
  // Di jsPDF, posisi Y adalah baseline, jadi perlu offset untuk sejajar dengan top logo
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  // Offset untuk sejajar top text dengan top logo (font 16pt ≈ 5.6mm, ascender ≈ 60-70%)
  const textTopOffset = 8; // Offset dalam mm untuk alignment
  let infoY = headerStartY + textTopOffset; // Sejajar dengan bagian atas logo
  const namaSekolahLines = doc.splitTextToSize(eraport.sekolah.namaSekolah, infoWidth);
  namaSekolahLines.forEach((line: string) => {
    doc.text(line, infoX, infoY, { align: 'left' });
    infoY += 7;
  });

  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  infoY += 1;
  
  // Alamat
  const alamatHeaderLines = doc.splitTextToSize(eraport.sekolah.alamatSekolah, infoWidth);
  alamatHeaderLines.forEach((line: string) => {
    doc.text(line, infoX, infoY, { align: 'left' });
    infoY += 5;
  });

  // Info tambahan - sejajar ke samping (horizontal) dengan spacing lebih kecil
  infoY += 1;
  doc.setFontSize(9);
  const telpText = `Telp: ${sekolahData?.nomorTelepon || '-'}`;
  const emailText = `Email: ${sekolahData?.email || '-'}`;
  const websiteText = `Website: ${sekolahData?.website || '-'}`;
  
  // Hitung lebar setiap teks untuk spacing yang lebih rapat
  const telpWidth = doc.getTextWidth(telpText);
  const emailWidth = doc.getTextWidth(emailText);
  const spacing = 4; // Spacing antar item lebih kecil (4mm)
  
  doc.text(telpText, infoX, infoY, { align: 'left' });
  doc.text(emailText, infoX + telpWidth + spacing, infoY, { align: 'left' });
  doc.text(websiteText, infoX + telpWidth + emailWidth + (spacing * 2), infoY, { align: 'left' });
  infoY += 3;

  // Update yPosition berdasarkan yang tertinggi (logo atau info)
  yPosition = Math.max(headerStartY + logoSize, infoY) + 5;

  // Divider line
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  // Student Data Section - Two Columns Layout
  checkNewPage(40);
  const studentDataStartY = yPosition;
  const leftColX = margin;
  const rightColX = margin + contentWidth / 2 + 5;
  const labelWidth = 38; // Lebar label yang konsisten
  const colonX = leftColX + labelWidth; // Posisi ":" setelah label
  const valueX = colonX + 3; // Posisi value setelah ": "
  const rightColonX = rightColX + labelWidth;
  const rightValueX = rightColonX + 3;
  const lineHeight = 6; // Spacing konsisten untuk setiap baris

  doc.setFontSize(12);
  doc.setFont('times', 'normal');

  // Left column - dengan spacing yang konsisten
  let leftY = studentDataStartY;
  
  // Nama Murid
  doc.text('Nama Murid', leftColX, leftY);
  doc.text(':', colonX, leftY);
  const namaLines = doc.splitTextToSize(muridData.namaMurid, contentWidth / 2 - valueX + leftColX);
  namaLines.forEach((line: string, idx: number) => {
    doc.text(line, valueX, leftY + (idx * 5));
  });
  leftY += Math.max(lineHeight, namaLines.length * 5);

  // NISN
  doc.text('NISN', leftColX, leftY);
  doc.text(':', colonX, leftY);
  doc.text(muridData.nisn, valueX, leftY);
  leftY += lineHeight;

  // Sekolah
  doc.text('Sekolah', leftColX, leftY);
  doc.text(':', colonX, leftY);
  const sekolahLines = doc.splitTextToSize(eraport.sekolah.namaSekolah, contentWidth / 2 - valueX + leftColX);
  sekolahLines.forEach((line: string, idx: number) => {
    doc.text(line, valueX, leftY + (idx * 5));
  });
  leftY += Math.max(lineHeight, sekolahLines.length * 5);

  // Alamat
  doc.text('Alamat', leftColX, leftY);
  doc.text(':', colonX, leftY);
  const alamatLines = doc.splitTextToSize(eraport.sekolah.alamatSekolah, contentWidth / 2 - valueX + leftColX);
  alamatLines.forEach((line: string, idx: number) => {
    doc.text(line, valueX, leftY + (idx * 5));
  });
  leftY += Math.max(lineHeight, alamatLines.length * 5);

  // Right column - dengan spacing yang konsisten dan sejajar dengan kiri
  let rightY = studentDataStartY;
  
  // Kelas
  doc.text('Kelas', rightColX, rightY);
  doc.text(':', rightColonX, rightY);
  doc.text(muridData.kelas, rightValueX, rightY);
  rightY += lineHeight;

  // Fase
  doc.text('Fase', rightColX, rightY);
  doc.text(':', rightColonX, rightY);
  doc.text(muridData.fase, rightValueX, rightY);
  rightY += lineHeight;

  // Semester
  doc.text('Semester', rightColX, rightY);
  doc.text(':', rightColonX, rightY);
  doc.text(String(muridData.semester), rightValueX, rightY);
  rightY += lineHeight;

  // Tahun Ajaran
  doc.text('Tahun Ajaran', rightColX, rightY);
  doc.text(':', rightColonX, rightY);
  doc.text(muridData.tahunAjaran, rightValueX, rightY);
  rightY += lineHeight;

  yPosition = Math.max(leftY, rightY) ;

  // Divider line
  checkNewPage(5);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Title: LAPORAN HASIL BELAJAR
  checkNewPage(15);
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('LAPORAN HASIL BELAJAR', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Tabel Nilai Mata Pelajaran
  checkNewPage(20);
  const nilaiHeaders = ['No', 'Mata Pelajaran', 'Nilai Akhir', 'Capaian Pembelajaran'];
  const nilaiColumnWidths = [
    contentWidth * 0.05,  // No
    contentWidth * 0.35, // Mata Pelajaran
    contentWidth * 0.15, // Nilai Akhir
    contentWidth * 0.45  // Capaian Pembelajaran
  ];
  
  const nilaiRows = muridData.nilaiMataPelajaran.map((nilai, idx) => [
    String(idx + 1),
    nilai.mataPelajaran,
    String(nilai.nilaiAkhir),
    nilai.capaianPembelajaran || '-'
  ]);

  autoTable(doc, {
    head: [nilaiHeaders],
    body: nilaiRows,
    startY: yPosition,
    margin: { left: margin, right: margin },
    styles: {
      font: 'times',
      fontSize: 11,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: nilaiColumnWidths[0] },
      1: { halign: 'left', cellWidth: nilaiColumnWidths[1] },
      2: { halign: 'center', cellWidth: nilaiColumnWidths[2] },
      3: { halign: 'left', cellWidth: nilaiColumnWidths[3], fontSize: 10 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        // Wrap text for Capaian Pembelajaran column
        if (data.cell.text && Array.isArray(data.cell.text) && data.cell.text.length > 0) {
          const text = data.cell.text[0] as string;
          if (text && text.length > 0) {
            const wrapped = doc.splitTextToSize(text, nilaiColumnWidths[3] - 4);
            if (wrapped.length > 1) {
              data.cell.text = wrapped;
            }
          }
        }
      }
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Kokurikuler
  if (muridData.kokulikuler) {
    checkNewPage(30);
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('Kokurikuler', margin, yPosition);
    yPosition += 4;
    
    doc.setFont('times', 'normal');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    const kokurikulerBoxHeight = 20;
    doc.rect(margin, yPosition, contentWidth, kokurikulerBoxHeight, 'S');
    
    const kokurikulerLines = doc.splitTextToSize(muridData.kokulikuler, contentWidth - 4);
    kokurikulerLines.forEach((line: string, idx: number) => {
      if (yPosition + (idx * 5) + 5 > pageHeight - margin - 10) {
        doc.addPage();
        yPosition = margin;
        doc.rect(margin, yPosition, contentWidth, kokurikulerBoxHeight, 'S');
      }
      doc.text(line, margin + 2, yPosition + 5 + (idx * 5));
    });
    yPosition += kokurikulerBoxHeight + 10;
  }

  // Ekstrakurikuler
  if (muridData.nilaiEkstrakulikuler && muridData.nilaiEkstrakulikuler.length > 0) {
    checkNewPage(30);
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('Ekstrakurikuler', margin, yPosition);
    yPosition += 4;

    const ekstraHeaders = ['No', 'Nama Ekstrakurikuler', 'Predikat', 'Keterangan'];
    const ekstraColumnWidths = [
      contentWidth * 0.10,
      contentWidth * 0.30,
      contentWidth * 0.20,
      contentWidth * 0.40
    ];

    const ekstraRows = muridData.nilaiEkstrakulikuler.map((ekstra, idx) => [
      String(idx + 1),
      ekstra.namaEkstrakulikuler,
      ekstra.predikat,
      ekstra.keterangan || '-'
    ]);

    autoTable(doc, {
      head: [ekstraHeaders],
      body: ekstraRows,
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: {
        font: 'times',
        fontSize: 11,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: ekstraColumnWidths[0] },
        1: { halign: 'left', cellWidth: ekstraColumnWidths[1] },
        2: { halign: 'center', cellWidth: ekstraColumnWidths[2] },
        3: { halign: 'left', cellWidth: ekstraColumnWidths[3], fontSize: 10 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          // Wrap text for Keterangan column
          if (data.cell.text && Array.isArray(data.cell.text) && data.cell.text.length > 0) {
            const text = data.cell.text[0] as string;
            if (text && text.length > 0) {
              const wrapped = doc.splitTextToSize(text, ekstraColumnWidths[3] - 4);
              if (wrapped.length > 1) {
                data.cell.text = wrapped;
              }
            }
          }
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Kehadiran dan Catatan Wali Kelas - Side by Side
  checkNewPage(50);
  const sectionStartY = yPosition;
  const titleHeight = 6; // Tinggi untuk title "Ketidakhadiran" dan "Catatan Wali Kelas"
  
  // Kehadiran table (Left side)
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('Ketidakhadiran', margin, yPosition);
  const kehadiranTableStartY = yPosition + titleHeight;

  const kehadiranHeaders = ['Jenis', 'Jumlah'];
  const kehadiranColumnWidths = [(contentWidth / 2 - 5) * 0.6, (contentWidth / 2 - 5) * 0.4];
  const kehadiranRows = [
    ['Sakit', `${muridData.kehadiran.sakit} hari`],
    ['Izin', `${muridData.kehadiran.izin} hari`],
    ['Tanpa Keterangan', `${muridData.kehadiran.alfa} hari`]
  ];

  autoTable(doc, {
    head: [kehadiranHeaders],
    body: kehadiranRows,
    startY: kehadiranTableStartY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth / 2 - 5,
    styles: {
      font: 'times',
      fontSize: 11,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: kehadiranColumnWidths[0] },
      1: { halign: 'center', cellWidth: kehadiranColumnWidths[1] },
    },
  });

  const kehadiranEndY = (doc as any).lastAutoTable.finalY;
  const kehadiranTableHeight = kehadiranEndY - kehadiranTableStartY;

  // Catatan Wali Kelas (Right side) - dengan tinggi yang sama dengan tabel kehadiran
  const catatanX = margin + contentWidth / 2 + 5;
  const catatanBoxWidth = contentWidth / 2 - 5;
  const catatanBoxHeight = kehadiranTableHeight; // Gunakan tinggi tabel kehadiran
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('Catatan Wali Kelas', catatanX, sectionStartY);
  
  const catatanY = sectionStartY + titleHeight;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  doc.rect(catatanX, catatanY, catatanBoxWidth, catatanBoxHeight, 'S');
  
  const catatanLines = doc.splitTextToSize(muridData.catatanWaliKelas || '-', catatanBoxWidth - 4);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  catatanLines.forEach((line: string, idx: number) => {
    const lineY = catatanY + 4 + (idx * 5);
    if (lineY + 3 < catatanY + catatanBoxHeight) {
      doc.text(line, catatanX + 2, lineY);
    }
  });

  yPosition = Math.max(kehadiranEndY, catatanY + catatanBoxHeight) + 10;

  // Tanggapan Orang Tua
  checkNewPage(40);
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('Tanggapan Orang Tua/Wali Murid', margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  const tanggapanBoxHeight = 25;
  doc.rect(margin, yPosition, contentWidth, tanggapanBoxHeight, 'S');
  yPosition += tanggapanBoxHeight + 8;

  // Keterangan Kenaikan Kelas (only for semester genap)
  if (eraport.semester === 2 && muridData.keteranganKenaikanKelas) {
    checkNewPage(20);
    
    // Determine label based on whether it's kelulusan or kenaikan kelas
    const isKelulusan = muridData.keteranganKenaikanKelas === 'Lulus' || muridData.keteranganKenaikanKelas === 'Tidak Lulus';
    const label = isKelulusan ? 'Keterangan Kelulusan' : 'Keterangan Kenaikan Kelas';
    const keteranganText = `${label} : ${muridData.keteranganKenaikanKelas}`;
    
    // Create table box for keterangan
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    const keteranganBoxHeight = 10;
    doc.rect(margin, yPosition, contentWidth, keteranganBoxHeight, 'S');
    
    // Add text inside the box
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    const keteranganLines = doc.splitTextToSize(keteranganText, contentWidth - 4);
    keteranganLines.forEach((line: string, idx: number) => {
      doc.text(line, margin + 2, yPosition + 6 + (idx * 5));
    });
    
    yPosition += keteranganBoxHeight + 8;
  }

  // Kota dan Tanggal Generate Raport
  checkNewPage(20);
  const kotaTanggalY = yPosition;
  const kota = sekolahData?.kota || sekolahData?.alamat?.split(',')[0] || 'Semarang';
  const tanggalGenerate = eraport.updatedAt || eraport.createdAt;
  const tanggalFormatted = formatTanggalIndonesia(tanggalGenerate);
  const kotaTanggalText = `${kota}, ${tanggalFormatted}`;
  
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text(kotaTanggalText, pageWidth - margin, kotaTanggalY, { align: 'right' });
  yPosition = kotaTanggalY + 8;

  // Tanda Tangan
  checkNewPage(50);
  const tandaTanganY = yPosition;
  const signatureWidth = contentWidth / 3;
  const signatureX1 = margin;
  const signatureX2 = margin + signatureWidth;
  const signatureX3 = margin + (signatureWidth * 2);
  const titleToLineGap = 35; // Jarak dari title ke garis TTD
  const lineToTextGap = 8; // Jarak dari garis ke text di bawahnya
  const lineLength = signatureWidth - 10; // Panjang line (lebih pendek dari lebar kolom)
  const lineY = tandaTanganY + titleToLineGap; // Posisi Y untuk semua line (sama)

  // Orang Tua Murid
  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  doc.text('Orang Tua Murid', signatureX1 + signatureWidth / 2, tandaTanganY, { align: 'center' });
  doc.setLineWidth(0.5);
  // Line TTD terpisah di tengah kolom
  const lineX1Start = signatureX1 + (signatureWidth - lineLength) / 2;
  doc.line(lineX1Start, lineY, lineX1Start + lineLength, lineY);
  doc.text('(.................................)', signatureX1 + signatureWidth / 2, lineY + lineToTextGap, { align: 'center' });

  // Kepala Sekolah
  doc.text('Kepala Sekolah', signatureX2 + signatureWidth / 2, tandaTanganY, { align: 'center' });
  // Line TTD terpisah di tengah kolom
  const lineX2Start = signatureX2 + (signatureWidth - lineLength) / 2;
  doc.line(lineX2Start, lineY, lineX2Start + lineLength, lineY);
  doc.setFontSize(11);
  const kepalaSekolahLines = doc.splitTextToSize(eraport.kepalaSekolah.namaKepalaSekolah, signatureWidth - 4);
  kepalaSekolahLines.forEach((line: string, idx: number) => {
    doc.text(line, signatureX2 + signatureWidth / 2, lineY + lineToTextGap + (idx * 5), { align: 'center' });
  });
  doc.setFontSize(10);
  // Jarak antara nama dan NIP lebih rapat
  const kepalaSekolahNipY = lineY + lineToTextGap + (kepalaSekolahLines.length * 5) - 1;
  doc.text(`NIP: ${eraport.kepalaSekolah.nip || '-'}`, signatureX2 + signatureWidth / 2, kepalaSekolahNipY, { align: 'center' });

  // Wali Kelas
  doc.setFontSize(12);
  doc.text('Wali Kelas', signatureX3 + signatureWidth / 2, tandaTanganY, { align: 'center' });
  // Line TTD terpisah di tengah kolom
  const lineX3Start = signatureX3 + (signatureWidth - lineLength) / 2;
  doc.line(lineX3Start, lineY, lineX3Start + lineLength, lineY);
  doc.setFontSize(11);
  const waliKelasLines = doc.splitTextToSize(eraport.waliKelas.namaGuru, signatureWidth - 4);
  waliKelasLines.forEach((line: string, idx: number) => {
    doc.text(line, signatureX3 + signatureWidth / 2, lineY + lineToTextGap + (idx * 5), { align: 'center' });
  });
  doc.setFontSize(10);
  // Jarak antara nama dan NIP lebih rapat
  const waliKelasNipY = lineY + lineToTextGap + (waliKelasLines.length * 5) - 1;
  doc.text(`NIP: ${eraport.waliKelas.nip || '-'}`, signatureX3 + signatureWidth / 2, waliKelasNipY, { align: 'center' });

  // Generate PDF as blob
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  return pdfUrl;
};

// Generate PDF and return as blob (for ZIP)
export const generateERaportPDFBlobDirect = async (data: ERaportPdfData): Promise<Blob> => {
  // Reuse the same logic from generateERaportPDFBlob but return blob directly
  const pdfUrl = await generateERaportPDFBlob(data);
  const response = await fetch(pdfUrl);
  const blob = await response.blob();
  URL.revokeObjectURL(pdfUrl); // Clean up
  return blob;
};

export const downloadERaportPDF = async (data: ERaportPdfData): Promise<void> => {
  const { eraport, muridData, selectedMurid, profilSekolah } = data;
  
  // Get profil sekolah if not provided
  let sekolahData = profilSekolah;
  if (!sekolahData) {
    try {
      const response = await apiService.getProfilSekolah();
      if (response.success && response.profilSekolah) {
        sekolahData = response.profilSekolah;
      }
    } catch (error) {
      console.error('Error fetching profil sekolah:', error);
    }
  }
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20; // 20mm margin
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to check if new page is needed
  const checkNewPage = (requiredHeight: number): boolean => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 12,
    isBold: boolean = false,
    align: 'left' | 'center' | 'right' = 'left'
  ): number => {
    doc.setFontSize(fontSize);
    doc.setFont('times', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    
    let currentY = y;
    lines.forEach((line: string) => {
      if (currentY > pageHeight - margin - 5) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, x, currentY, { align });
      currentY += fontSize * 0.5;
    });
    
    return currentY;
  };

  // Header dengan Logo dan Data Sekolah
  const headerStartY = yPosition;
  const logoSize = 25; // Ukuran logo dalam mm
  const logoX = margin;
  const logoY = headerStartY;
  const infoX = logoX + logoSize + 5; // Posisi info sekolah (setelah logo + spacing lebih kecil)
  const infoWidth = contentWidth - logoSize - 5;

  // Draw logo jika ada
  if (sekolahData?.logoSekolah) {
    try {
      // Try different image formats
      let imageFormat: 'PNG' | 'JPEG' | 'JPG' = 'PNG';
      const logoData = sekolahData.logoSekolah;
      if (logoData.startsWith('data:image/jpeg') || logoData.startsWith('data:image/jpg')) {
        imageFormat = 'JPEG';
      }
      doc.addImage(logoData, imageFormat, logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error('Error adding logo:', error);
      // Continue without logo if there's an error
    }
  }

  // Data sekolah di kanan logo - sejajar dengan logo
  // Di jsPDF, posisi Y adalah baseline, jadi perlu offset untuk sejajar dengan top logo
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  // Offset untuk sejajar top text dengan top logo (font 16pt ≈ 5.6mm, ascender ≈ 60-70%)
  const textTopOffset = 8; // Offset dalam mm untuk alignment
  let infoY = headerStartY + textTopOffset; // Sejajar dengan bagian atas logo
  const namaSekolahLines = doc.splitTextToSize(eraport.sekolah.namaSekolah, infoWidth);
  namaSekolahLines.forEach((line: string) => {
    doc.text(line, infoX, infoY, { align: 'left' });
    infoY += 7;
  });

  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  infoY += 1;
  
  // Alamat
  const alamatHeaderLines = doc.splitTextToSize(eraport.sekolah.alamatSekolah, infoWidth);
  alamatHeaderLines.forEach((line: string) => {
    doc.text(line, infoX, infoY, { align: 'left' });
    infoY += 5;
  });

  // Info tambahan - sejajar ke samping (horizontal) dengan spacing lebih kecil
  infoY += 1;
  doc.setFontSize(9);
  const telpText = `Telp: ${sekolahData?.nomorTelepon || '-'}`;
  const emailText = `Email: ${sekolahData?.email || '-'}`;
  const websiteText = `Website: ${sekolahData?.website || '-'}`;
  
  // Hitung lebar setiap teks untuk spacing yang lebih rapat
  const telpWidth = doc.getTextWidth(telpText);
  const emailWidth = doc.getTextWidth(emailText);
  const spacing = 4; // Spacing antar item lebih kecil (4mm)
  
  doc.text(telpText, infoX, infoY, { align: 'left' });
  doc.text(emailText, infoX + telpWidth + spacing, infoY, { align: 'left' });
  doc.text(websiteText, infoX + telpWidth + emailWidth + (spacing * 2), infoY, { align: 'left' });
  infoY += 3;

  // Update yPosition berdasarkan yang tertinggi (logo atau info)
  yPosition = Math.max(headerStartY + logoSize, infoY) + 5;

  // Divider line
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  // Student Data Section - Two Columns Layout
  checkNewPage(40);
  const studentDataStartY = yPosition;
  const leftColX = margin;
  const rightColX = margin + contentWidth / 2 + 5;
  const labelWidth = 38; // Lebar label yang konsisten
  const colonX = leftColX + labelWidth; // Posisi ":" setelah label
  const valueX = colonX + 3; // Posisi value setelah ": "
  const rightColonX = rightColX + labelWidth;
  const rightValueX = rightColonX + 3;
  const lineHeight = 6; // Spacing konsisten untuk setiap baris

  doc.setFontSize(12);
  doc.setFont('times', 'normal');

  // Left column - dengan spacing yang konsisten
  let leftY = studentDataStartY;
  
  // Nama Murid
  doc.text('Nama Murid', leftColX, leftY);
  doc.text(':', colonX, leftY);
  const namaLines = doc.splitTextToSize(muridData.namaMurid, contentWidth / 2 - valueX + leftColX);
  namaLines.forEach((line: string, idx: number) => {
    doc.text(line, valueX, leftY + (idx * 5));
  });
  leftY += Math.max(lineHeight, namaLines.length * 5);

  // NISN
  doc.text('NISN', leftColX, leftY);
  doc.text(':', colonX, leftY);
  doc.text(muridData.nisn, valueX, leftY);
  leftY += lineHeight;

  // Sekolah
  doc.text('Sekolah', leftColX, leftY);
  doc.text(':', colonX, leftY);
  const sekolahLines = doc.splitTextToSize(eraport.sekolah.namaSekolah, contentWidth / 2 - valueX + leftColX);
  sekolahLines.forEach((line: string, idx: number) => {
    doc.text(line, valueX, leftY + (idx * 5));
  });
  leftY += Math.max(lineHeight, sekolahLines.length * 5);

  // Alamat
  doc.text('Alamat', leftColX, leftY);
  doc.text(':', colonX, leftY);
  const alamatLines = doc.splitTextToSize(eraport.sekolah.alamatSekolah, contentWidth / 2 - valueX + leftColX);
  alamatLines.forEach((line: string, idx: number) => {
    doc.text(line, valueX, leftY + (idx * 5));
  });
  leftY += Math.max(lineHeight, alamatLines.length * 5);

  // Right column - dengan spacing yang konsisten dan sejajar dengan kiri
  let rightY = studentDataStartY;
  
  // Kelas
  doc.text('Kelas', rightColX, rightY);
  doc.text(':', rightColonX, rightY);
  doc.text(muridData.kelas, rightValueX, rightY);
  rightY += lineHeight;

  // Fase
  doc.text('Fase', rightColX, rightY);
  doc.text(':', rightColonX, rightY);
  doc.text(muridData.fase, rightValueX, rightY);
  rightY += lineHeight;

  // Semester
  doc.text('Semester', rightColX, rightY);
  doc.text(':', rightColonX, rightY);
  doc.text(String(muridData.semester), rightValueX, rightY);
  rightY += lineHeight;

  // Tahun Ajaran
  doc.text('Tahun Ajaran', rightColX, rightY);
  doc.text(':', rightColonX, rightY);
  doc.text(muridData.tahunAjaran, rightValueX, rightY);
  rightY += lineHeight;

  yPosition = Math.max(leftY, rightY) ;

  // Divider line
  checkNewPage(5);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Title: LAPORAN HASIL BELAJAR
  checkNewPage(15);
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('LAPORAN HASIL BELAJAR', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Tabel Nilai Mata Pelajaran
  checkNewPage(20);
  const nilaiHeaders = ['No', 'Mata Pelajaran', 'Nilai Akhir', 'Capaian Pembelajaran'];
  const nilaiColumnWidths = [
    contentWidth * 0.05,  // No
    contentWidth * 0.35, // Mata Pelajaran
    contentWidth * 0.15, // Nilai Akhir
    contentWidth * 0.45  // Capaian Pembelajaran
  ];
  
  const nilaiRows = muridData.nilaiMataPelajaran.map((nilai, idx) => [
    String(idx + 1),
    nilai.mataPelajaran,
    String(nilai.nilaiAkhir),
    nilai.capaianPembelajaran || '-'
  ]);

  autoTable(doc, {
    head: [nilaiHeaders],
    body: nilaiRows,
    startY: yPosition,
    margin: { left: margin, right: margin },
    styles: {
      font: 'times',
      fontSize: 11,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: nilaiColumnWidths[0] },
      1: { halign: 'left', cellWidth: nilaiColumnWidths[1] },
      2: { halign: 'center', cellWidth: nilaiColumnWidths[2] },
      3: { halign: 'left', cellWidth: nilaiColumnWidths[3], fontSize: 10 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        // Wrap text for Capaian Pembelajaran column
        if (data.cell.text && Array.isArray(data.cell.text) && data.cell.text.length > 0) {
          const text = data.cell.text[0] as string;
          if (text && text.length > 0) {
            const wrapped = doc.splitTextToSize(text, nilaiColumnWidths[3] - 4);
            if (wrapped.length > 1) {
              data.cell.text = wrapped;
            }
          }
        }
      }
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Kokurikuler
  if (muridData.kokulikuler) {
    checkNewPage(30);
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('Kokurikuler', margin, yPosition);
    yPosition += 4;
    
    doc.setFont('times', 'normal');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    const kokurikulerBoxHeight = 20;
    doc.rect(margin, yPosition, contentWidth, kokurikulerBoxHeight, 'S');
    
    const kokurikulerLines = doc.splitTextToSize(muridData.kokulikuler, contentWidth - 4);
    kokurikulerLines.forEach((line: string, idx: number) => {
      if (yPosition + (idx * 5) + 5 > pageHeight - margin - 10) {
        doc.addPage();
        yPosition = margin;
        doc.rect(margin, yPosition, contentWidth, kokurikulerBoxHeight, 'S');
      }
      doc.text(line, margin + 2, yPosition + 5 + (idx * 5));
    });
    yPosition += kokurikulerBoxHeight + 10;
  }

  // Ekstrakurikuler
  if (muridData.nilaiEkstrakulikuler && muridData.nilaiEkstrakulikuler.length > 0) {
    checkNewPage(30);
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('Ekstrakurikuler', margin, yPosition);
    yPosition += 4;

    const ekstraHeaders = ['No', 'Nama Ekstrakurikuler', 'Predikat', 'Keterangan'];
    const ekstraColumnWidths = [
      contentWidth * 0.10,
      contentWidth * 0.30,
      contentWidth * 0.20,
      contentWidth * 0.40
    ];

    const ekstraRows = muridData.nilaiEkstrakulikuler.map((ekstra, idx) => [
      String(idx + 1),
      ekstra.namaEkstrakulikuler,
      ekstra.predikat,
      ekstra.keterangan || '-'
    ]);

    autoTable(doc, {
      head: [ekstraHeaders],
      body: ekstraRows,
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: {
        font: 'times',
        fontSize: 11,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: ekstraColumnWidths[0] },
        1: { halign: 'left', cellWidth: ekstraColumnWidths[1] },
        2: { halign: 'center', cellWidth: ekstraColumnWidths[2] },
        3: { halign: 'left', cellWidth: ekstraColumnWidths[3], fontSize: 10 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          // Wrap text for Keterangan column
          if (data.cell.text && Array.isArray(data.cell.text) && data.cell.text.length > 0) {
            const text = data.cell.text[0] as string;
            if (text && text.length > 0) {
              const wrapped = doc.splitTextToSize(text, ekstraColumnWidths[3] - 4);
              if (wrapped.length > 1) {
                data.cell.text = wrapped;
              }
            }
          }
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Kehadiran dan Catatan Wali Kelas - Side by Side
  checkNewPage(50);
  const sectionStartY = yPosition;
  const titleHeight = 6; // Tinggi untuk title "Ketidakhadiran" dan "Catatan Wali Kelas"
  
  // Kehadiran table (Left side)
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('Ketidakhadiran', margin, yPosition);
  const kehadiranTableStartY = yPosition + titleHeight;

  const kehadiranHeaders = ['Jenis', 'Jumlah'];
  const kehadiranColumnWidths = [(contentWidth / 2 - 5) * 0.6, (contentWidth / 2 - 5) * 0.4];
  const kehadiranRows = [
    ['Sakit', `${muridData.kehadiran.sakit} hari`],
    ['Izin', `${muridData.kehadiran.izin} hari`],
    ['Tanpa Keterangan', `${muridData.kehadiran.alfa} hari`]
  ];

  autoTable(doc, {
    head: [kehadiranHeaders],
    body: kehadiranRows,
    startY: kehadiranTableStartY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth / 2 - 5,
    styles: {
      font: 'times',
      fontSize: 11,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: kehadiranColumnWidths[0] },
      1: { halign: 'center', cellWidth: kehadiranColumnWidths[1] },
    },
  });

  const kehadiranEndY = (doc as any).lastAutoTable.finalY;
  const kehadiranTableHeight = kehadiranEndY - kehadiranTableStartY;

  // Catatan Wali Kelas (Right side) - dengan tinggi yang sama dengan tabel kehadiran
  const catatanX = margin + contentWidth / 2 + 5;
  const catatanBoxWidth = contentWidth / 2 - 5;
  const catatanBoxHeight = kehadiranTableHeight; // Gunakan tinggi tabel kehadiran
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('Catatan Wali Kelas', catatanX, sectionStartY);
  
  const catatanY = sectionStartY + titleHeight;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  doc.rect(catatanX, catatanY, catatanBoxWidth, catatanBoxHeight, 'S');
  
  const catatanLines = doc.splitTextToSize(muridData.catatanWaliKelas || '-', catatanBoxWidth - 4);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  catatanLines.forEach((line: string, idx: number) => {
    const lineY = catatanY + 4 + (idx * 5);
    if (lineY + 3 < catatanY + catatanBoxHeight) {
      doc.text(line, catatanX + 2, lineY);
    }
  });

  yPosition = Math.max(kehadiranEndY, catatanY + catatanBoxHeight) + 10;

  // Tanggapan Orang Tua
  checkNewPage(40);
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('Tanggapan Orang Tua/Wali Murid', margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  const tanggapanBoxHeight = 25;
  doc.rect(margin, yPosition, contentWidth, tanggapanBoxHeight, 'S');
  yPosition += tanggapanBoxHeight + 8;

  // Keterangan Kenaikan Kelas (only for semester genap)
  if (eraport.semester === 2 && muridData.keteranganKenaikanKelas) {
    checkNewPage(20);
    
    // Determine label based on whether it's kelulusan or kenaikan kelas
    const isKelulusan = muridData.keteranganKenaikanKelas === 'Lulus' || muridData.keteranganKenaikanKelas === 'Tidak Lulus';
    const label = isKelulusan ? 'Keterangan Kelulusan' : 'Keterangan Kenaikan Kelas';
    const keteranganText = `${label} : ${muridData.keteranganKenaikanKelas}`;
    
    // Create table box for keterangan
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    const keteranganBoxHeight = 10;
    doc.rect(margin, yPosition, contentWidth, keteranganBoxHeight, 'S');
    
    // Add text inside the box
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    const keteranganLines = doc.splitTextToSize(keteranganText, contentWidth - 4);
    keteranganLines.forEach((line: string, idx: number) => {
      doc.text(line, margin + 2, yPosition + 6 + (idx * 5));
    });
    
    yPosition += keteranganBoxHeight + 8;
  }

  // Kota dan Tanggal Generate Raport
  checkNewPage(20);
  const kotaTanggalY = yPosition;
  const kota = sekolahData?.kota || sekolahData?.alamat?.split(',')[0] || 'Semarang';
  const tanggalGenerate = eraport.updatedAt || eraport.createdAt;
  const tanggalFormatted = formatTanggalIndonesia(tanggalGenerate);
  const kotaTanggalText = `${kota}, ${tanggalFormatted}`;
  
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text(kotaTanggalText, pageWidth - margin, kotaTanggalY, { align: 'right' });
  yPosition = kotaTanggalY + 8;

  // Tanda Tangan
  checkNewPage(50);
  const tandaTanganY = yPosition;
  const signatureWidth = contentWidth / 3;
  const signatureX1 = margin;
  const signatureX2 = margin + signatureWidth;
  const signatureX3 = margin + (signatureWidth * 2);
  const titleToLineGap = 35; // Jarak dari title ke garis TTD
  const lineToTextGap = 8; // Jarak dari garis ke text di bawahnya
  const lineLength = signatureWidth - 10; // Panjang line (lebih pendek dari lebar kolom)
  const lineY = tandaTanganY + titleToLineGap; // Posisi Y untuk semua line (sama)

  // Orang Tua Murid
  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  doc.text('Orang Tua Murid', signatureX1 + signatureWidth / 2, tandaTanganY, { align: 'center' });
  doc.setLineWidth(0.5);
  // Line TTD terpisah di tengah kolom
  const lineX1Start = signatureX1 + (signatureWidth - lineLength) / 2;
  doc.line(lineX1Start, lineY, lineX1Start + lineLength, lineY);
  doc.text('(.................................)', signatureX1 + signatureWidth / 2, lineY + lineToTextGap, { align: 'center' });

  // Kepala Sekolah
  doc.text('Kepala Sekolah', signatureX2 + signatureWidth / 2, tandaTanganY, { align: 'center' });
  // Line TTD terpisah di tengah kolom
  const lineX2Start = signatureX2 + (signatureWidth - lineLength) / 2;
  doc.line(lineX2Start, lineY, lineX2Start + lineLength, lineY);
  doc.setFontSize(11);
  const kepalaSekolahLines = doc.splitTextToSize(eraport.kepalaSekolah.namaKepalaSekolah, signatureWidth - 4);
  kepalaSekolahLines.forEach((line: string, idx: number) => {
    doc.text(line, signatureX2 + signatureWidth / 2, lineY + lineToTextGap + (idx * 5), { align: 'center' });
  });
  doc.setFontSize(10);
  // Jarak antara nama dan NIP lebih rapat
  const kepalaSekolahNipY = lineY + lineToTextGap + (kepalaSekolahLines.length * 5) - 1;
  doc.text(`NIP: ${eraport.kepalaSekolah.nip || '-'}`, signatureX2 + signatureWidth / 2, kepalaSekolahNipY, { align: 'center' });

  // Wali Kelas
  doc.setFontSize(12);
  doc.text('Wali Kelas', signatureX3 + signatureWidth / 2, tandaTanganY, { align: 'center' });
  // Line TTD terpisah di tengah kolom
  const lineX3Start = signatureX3 + (signatureWidth - lineLength) / 2;
  doc.line(lineX3Start, lineY, lineX3Start + lineLength, lineY);
  doc.setFontSize(11);
  const waliKelasLines = doc.splitTextToSize(eraport.waliKelas.namaGuru, signatureWidth - 4);
  waliKelasLines.forEach((line: string, idx: number) => {
    doc.text(line, signatureX3 + signatureWidth / 2, lineY + lineToTextGap + (idx * 5), { align: 'center' });
  });
  doc.setFontSize(10);
  // Jarak antara nama dan NIP lebih rapat
  const waliKelasNipY = lineY + lineToTextGap + (waliKelasLines.length * 5) - 1;
  doc.text(`NIP: ${eraport.waliKelas.nip || '-'}`, signatureX3 + signatureWidth / 2, waliKelasNipY, { align: 'center' });

  // Generate filename
  const filename = `E-Raport_${muridData.namaMurid}_${muridData.tahunAjaran}_Semester_${muridData.semester}.pdf`;
  
  // Save PDF
  doc.save(filename);
};

// Download ZIP containing all E-Raport PDFs for a class
export const downloadERaportZip = async (
  eraport: ERaport,
  muridList: User[],
  profilSekolah?: ProfilSekolah | null
): Promise<void> => {
  // Import JSZip dynamically
  const JSZip = (await import('jszip')).default;
  
  const zip = new JSZip();
  let successCount = 0;
  let failCount = 0;

  // Get profil sekolah if not provided
  let sekolahData = profilSekolah;
  if (!sekolahData) {
    try {
      const response = await apiService.getProfilSekolah();
      if (response.success && response.profilSekolah) {
        sekolahData = response.profilSekolah;
      }
    } catch (error) {
      console.error('Error fetching profil sekolah:', error);
    }
  }

  // Generate PDF for each murid
  for (const murid of muridList) {
    try {
      const muridData = eraport.muridData.find(m => m.muridId === murid.id);
      if (!muridData) {
        console.warn(`No E-Raport data found for murid: ${murid.name}`);
        failCount++;
        continue;
      }

      // Generate PDF blob
      const pdfBlob = await generateERaportPDFBlobDirect({
        eraport,
        muridData,
        selectedMurid: murid,
        profilSekolah: sekolahData || null,
      });

      // Create safe filename
      const safeName = murid.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      const filename = `E-Raport_${safeName}_${muridData.tahunAjaran}_Semester_${muridData.semester}.pdf`;
      
      // Add to zip
      zip.file(filename, pdfBlob);
      successCount++;
    } catch (error) {
      console.error(`Error generating PDF for ${murid.name}:`, error);
      failCount++;
    }
  }

  if (successCount === 0) {
    alert('Tidak ada PDF yang berhasil di-generate. Silakan coba lagi.');
    return;
  }

  // Generate zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Create filename
  const kelasName = eraport.kelas.nama.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  const zipFilename = `E-Raport_${kelasName}_${eraport.tahunAjaran}_Semester_${eraport.semester}.zip`;
  
  // Download zip file
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Show summary
  if (failCount > 0) {
    alert(`Download selesai!\nBerhasil: ${successCount} file\nGagal: ${failCount} file`);
  } else {
    alert(`Download selesai! ${successCount} file PDF berhasil diunduh.`);
  }
};
