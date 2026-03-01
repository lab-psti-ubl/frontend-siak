import jsPDF from 'jspdf';
import { SuratIzin, User, Kelas, ProfilSekolah } from '../types';
import { apiService } from '../services/apiService';

export const printSuratIzin = async (
  surat: SuratIzin,
  muridName: string,
  kelasName: string,
  waliKelasDisplayName: string,
  waliKelas: User | undefined,
  muridUser: User | undefined,
  verificationQRDataUrl?: string,
  showVerificationSection: boolean = true,
  currentUserName?: string,
  language: string = 'id'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Get school data from database
  const schoolData = await getSchoolDataFromDatabase();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  let yPosition = margin;

  const isMalay = language === 'ms';
  const dateLocale = isMalay ? 'ms-MY' : 'id-ID';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const addText = (text: string, x: number = margin, size: number = 10, isBold: boolean = false) => {
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(size);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(text, x, yPosition);
    yPosition += 7;
  };

  const addTextMultiline = (text: string, x: number = margin, maxWidth: number = contentWidth, size: number = 10, isBold: boolean = false) => {
    if (yPosition > pageHeight - margin - 15) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(size);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPosition);
    yPosition += lines.length * 6 + 2;
  };

  const addLine = () => {
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;
  };

  // Header Section - Logo and School Info
  const logoSize = 18; // Ukuran logo
  const logoX = margin;
  const logoY = yPosition;
  const textX = margin + logoSize + 4; // Jarak antara logo dan teks
  const textWidth = contentWidth - logoSize - 4;

  // Add logo
  if (schoolData.logoSekolah) {
    try {
      doc.addImage(schoolData.logoSekolah, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // Calculate text start position to align with logo center
  const logoCenterY = logoY + (logoSize / 1.6);
  const lineHeight = 5;
  const textStartY = logoCenterY - (lineHeight * 1.5); // Center align dengan logo

  // Nama Sekolah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const namaSekolahLines = doc.splitTextToSize(schoolData.namaSekolah, textWidth);
  doc.text(namaSekolahLines, textX, textStartY);
  
  // Alamat
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const alamatY = textStartY + (namaSekolahLines.length * lineHeight) + 2;
  const alamatLines = doc.splitTextToSize(schoolData.alamat || 'Alamat Sekolah', textWidth);
  doc.text(alamatLines, textX, alamatY);
  
  // Telp dan Email
  const contactY = alamatY + (alamatLines.length * lineHeight) + 2;
  const telLabel = isMalay ? 'Tel' : 'Telp';
  const emailLabel = isMalay ? 'Email' : 'Email';
  doc.text(`${telLabel}: ${schoolData.nomorTelepon || '-'} | ${emailLabel}: ${schoolData.email || '-'}`, textX, contactY, { maxWidth: textWidth });

  // Update yPosition untuk elemen berikutnya
  yPosition = contactY + lineHeight + 4;

  // Add separator line
  addLine();
  yPosition += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`SURAT ${surat.jenis.toUpperCase()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const nomorLabel = isMalay ? 'Nombor' : 'Nomor';
  doc.text(`${nomorLabel}: ${surat.id.toUpperCase()}/SISWA/${new Date(surat.createdAt).getFullYear()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  addText(isMalay ? 'Yang bertandatangan di bawah ini:' : 'Yang bertanda tangan di bawah ini:');
  yPosition += 2;

  const infoLines = [
    `Nama                  : ${muridName}`,
    `Kelas                 : ${kelasName}`,
    `NISN                  : ${muridUser?.nisn || 'Tidak diketahui'}`
  ];

  infoLines.forEach(line => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(line, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 3;

  const dateFormatted = new Date(surat.tanggalMulai).toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let mainParagraph = '';
  const jenisText = surat.jenis === 'izin_dispen' ? 'izin dispen' : surat.jenis;
  if (isMalay) {
    mainParagraph = `Dengan ini memohon ${jenisText} untuk tidak mengikuti aktiviti pembelajaran pada tarikh ${dateFormatted}`;
  } else {
    mainParagraph = `Dengan ini mengajukan permohonan ${jenisText} untuk tidak mengikuti kegiatan pembelajaran pada tanggal ${dateFormatted}`;
  }

  if (surat.tanggalMulai !== surat.tanggalSelesai) {
    const endDateFormatted = new Date(surat.tanggalSelesai).toLocaleDateString(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    mainParagraph += isMalay ? ` sehingga ${endDateFormatted}` : ` sampai dengan ${endDateFormatted}`;
  }
  mainParagraph += '.';

  addTextMultiline(mainParagraph, margin, contentWidth, 9);
  yPosition += 2;

  if (surat.jenis === 'izin_dispen' && (surat.jamMulai || surat.jamSelesai)) {
    yPosition += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(isMalay ? 'Jam Izin Dispen:' : 'Jam Izin Dispen:', margin + 5, yPosition);
    yPosition += 5;

    doc.setFont('helvetica', 'normal');
    doc.text(`Jam Mulai    : ${surat.jamMulai || '-'}`, margin + 8, yPosition);
    yPosition += 4;
    doc.text(`Jam Selesai  : ${surat.jamSelesai || '-'}`, margin + 8, yPosition);
    yPosition += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${isMalay ? 'Alasan' : 'Alasan'} ${surat.jenis}:`, margin, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setDrawColor(200);
  doc.setLineWidth(0.1);
  doc.rect(margin + 2, yPosition - 3, contentWidth - 4, 12, 'S');
  addTextMultiline(surat.alasan, margin + 4, contentWidth - 8, 9);

  yPosition += 5;

  const demikianText = isMalay
    ? `Demikian surat ${surat.jenis} ini saya buat dengan sebenar-benarnya. Atas perhatian dan kebijaksanaan Bapa/Ibu, saya ucapkan terima kasih.`
    : `Demikian surat ${surat.jenis} ini saya buat dengan sebenar-benarnya. Atas perhatian dan kebijaksanaan Bapak/Ibu, saya ucapkan terima kasih.`;
  addTextMultiline(demikianText, margin, contentWidth, 9);

  yPosition += 5;

  const createdDateFormatted = new Date(surat.createdAt).toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(isMalay ? 'Diajukan pada:' : 'Diajukan pada:', margin, yPosition);
  doc.text(createdDateFormatted, margin + 24, yPosition);
  yPosition += 10;

  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(isMalay ? 'Hormat Saya.' : 'Hormat Saya.', margin, yPosition, { align: 'left' });
  doc.text(isMalay ? 'Diketahui,' : 'Diketahui,', pageWidth / 2 + 40, yPosition, { align: 'left' });
  yPosition += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(isMalay ? 'Murid' : 'Murid', margin, yPosition, { align: 'left' });
  doc.text(isMalay ? 'Guru Kelas' : 'Wali Kelas', pageWidth / 2 + 40, yPosition, { align: 'left' });
  yPosition += 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(muridName, margin, yPosition, { align: 'left' });
  doc.text(waliKelasDisplayName, pageWidth / 2 + 40,yPosition, { align: 'left' });
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NISN: ${muridUser?.nisn || '-'}`, margin, yPosition, { align: 'left' });
  if (waliKelas?.nip) {
    doc.text(`NIP: ${waliKelas.nip}`, pageWidth / 2 + 40,yPosition, { align: 'left' });
  }

  if (surat.status === 'diterima' && verificationQRDataUrl) {
    yPosition += 10;
    yPosition += 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(isMalay ? 'Tanda Tangan Digital' : 'Tanda Tangan Digital', pageWidth / 2 + 5, yPosition, { align: 'center' });
    yPosition += 4;

    try {
      doc.addImage(verificationQRDataUrl, 'PNG', pageWidth / 2 + 5 - 10, yPosition, 20, 20);
      yPosition += 22;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(isMalay ? 'Sah & Terverifikasi Guru Kelas' : 'Sah & Terverifikasi Walikelas', pageWidth / 2 + 5, yPosition, { align: 'center' });
    } catch (error) {
      console.error('Error adding QR code:', error);
    }
  }

  if (showVerificationSection && surat.status !== 'menunggu' && currentUserName) {
    yPosition += 20;

    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(isMalay ? 'STATUS PENGESAHAN GURU KELAS' : 'STATUS VERIFIKASI WALI KELAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setLineWidth(0.3);
    doc.rect(margin + 2, yPosition - 5, contentWidth - 4, 35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Status:', margin + 8, yPosition);
    doc.text(isMalay ? 'Tarikh Pengesahan:' : 'Tanggal Verifikasi:', pageWidth / 2 + 5, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const statusText = surat.status === 'diterima'
      ? (isMalay ? 'DILULUSKAN' : 'DISETUJUI')
      : (isMalay ? 'DITOLAK' : 'DITOLAK');
    doc.text(statusText, margin + 8, yPosition);
    const verifyDateFormatted = surat.verifiedAt
      ? new Date(surat.verifiedAt).toLocaleDateString(dateLocale)
      : '-';
    doc.text(verifyDateFormatted, pageWidth / 2 + 5, yPosition);
    yPosition += 8;

    if (surat.keterangan) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(isMalay ? 'Keterangan Guru Kelas:' : 'Keterangan Wali Kelas:', margin + 8, yPosition);
      yPosition += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      addTextMultiline(surat.keterangan, margin + 12, contentWidth - 15, 8);
    }

    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Wali Kelas', pageWidth / 2, yPosition + 3, { align: 'center' });
    yPosition += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(currentUserName, pageWidth / 2, yPosition, { align: 'center' });
  }

  const fileName = `Surat-${surat.jenis}-${muridName}-${new Date(surat.createdAt).toLocaleDateString('id-ID').replace(/\//g, '-')}`;
  doc.save(`${fileName}.pdf`);
};

export const printIzinGuru = async (
  izin: any,
  user: User | null,
  verificationQRDataUrl?: string,
  showVerificationStatus: boolean = true,
  language: string = 'id'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Get school data from database
  const schoolData = await getSchoolDataFromDatabase();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  let yPosition = margin;

  const isMalay = language === 'ms';
  const dateLocale = isMalay ? 'ms-MY' : 'id-ID';

  const addText = (text: string, x: number = margin, size: number = 10, isBold: boolean = false) => {
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(size);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(text, x, yPosition);
    yPosition += 7;
  };

  const addTextMultiline = (text: string, x: number = margin, maxWidth: number = contentWidth, size: number = 10, isBold: boolean = false) => {
    if (yPosition > pageHeight - margin - 15) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(size);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPosition);
    yPosition += lines.length * 6 + 2;
  };

  const addLine = () => {
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;
  };

  // Header Section - Logo and School Info
  const logoSize = 18; // Ukuran logo
  const logoX = margin;
  const logoY = yPosition;
  const textX = margin + logoSize + 4; // Jarak antara logo dan teks
  const textWidth = contentWidth - logoSize - 4;

  // Add logo
  if (schoolData.logoSekolah) {
    try {
      doc.addImage(schoolData.logoSekolah, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // Calculate text start position to align with logo center
  const logoCenterY = logoY + (logoSize / 2);
  const lineHeight = 5;
  const textStartY = logoCenterY - (lineHeight * 1.5); // Center align dengan logo

  // Nama Sekolah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const namaSekolahLines = doc.splitTextToSize(schoolData.namaSekolah, textWidth);
  doc.text(namaSekolahLines, textX, textStartY);
  
  // Alamat
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const alamatY = textStartY + (namaSekolahLines.length * lineHeight) + 2;
  const alamatLines = doc.splitTextToSize(schoolData.alamat || 'Alamat Sekolah', textWidth);
  doc.text(alamatLines, textX, alamatY);
  
  // Telp dan Email
  const contactY = alamatY + (alamatLines.length * lineHeight) + 2;
  const telLabelGuru = isMalay ? 'Tel' : 'Telp';
  const emailLabelGuru = isMalay ? 'Emel' : 'Email';
  doc.text(`${telLabelGuru}: ${schoolData.nomorTelepon || '-'} | ${emailLabelGuru}: ${schoolData.email || '-'}`, textX, contactY, { maxWidth: textWidth });

  // Update yPosition untuk elemen berikutnya
  yPosition = contactY + lineHeight + 4;

  // Add separator line
  addLine();
  yPosition += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const suratPengajuanLabel = isMalay ? 'SURAT PERMOHONAN' : 'SURAT PENGAJUAN';
  doc.text(
    `${suratPengajuanLabel} ${izin.jenis === 'izin_dispen' ? (isMalay ? 'IZIN DISPEN' : 'IZIN DISPEN') : izin.jenis.toUpperCase()}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const nomorLabelGuru = isMalay ? 'Nombor' : 'Nomor';
  doc.text(
    `${nomorLabelGuru}: ${izin.id.toUpperCase()}/GURU/${new Date(izin.createdAt).getFullYear()}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  yPosition += 8;

  addText(isMalay ? 'Yang bertandatangan di bawah ini:' : 'Yang bertanda tangan di bawah ini:');
  yPosition += 2;

  const jabatanLabel = isMalay ? 'Jawatan' : 'Jabatan';
  const waliKelasLabel = isMalay ? 'Guru Kelas' : 'Wali Kelas';
  const infoLines = [
    `Nama                  : ${user?.name || 'Tidak diketahui'}`,
    `NIP                   : ${user?.nip || 'Tidak diketahui'}`,
    `${jabatanLabel}               : Guru${user?.isWaliKelas ? ` / ${waliKelasLabel}` : ''}`
  ];

  infoLines.forEach(line => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(line, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 3;

  const dateFormatted = new Date(izin.tanggalMulai).toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const jenisGuruText = izin.jenis === 'izin_dispen' ? 'izin dispen' : izin.jenis;
  let mainParagraph = '';
  if (isMalay) {
    mainParagraph = `Dengan ini memohon ${jenisGuruText} untuk tidak melaksanakan tugas mengajar pada tarikh ${dateFormatted}`;
  } else {
    mainParagraph = `Dengan ini mengajukan permohonan ${jenisGuruText} untuk tidak melaksanakan tugas mengajar pada tanggal ${dateFormatted}`;
  }

  if (izin.jenis === 'izin_dispen' && izin.jamMulai && izin.jamSelesai) {
    mainParagraph += isMalay
      ? ` dari pukul ${izin.jamMulai} sehingga pukul ${izin.jamSelesai}`
      : ` dari pukul ${izin.jamMulai} sampai dengan pukul ${izin.jamSelesai}`;
  } else if (izin.jenis !== 'izin_dispen' && izin.tanggalMulai !== izin.tanggalSelesai) {
    const endDateFormatted = new Date(izin.tanggalSelesai).toLocaleDateString(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    mainParagraph += isMalay ? ` sehingga ${endDateFormatted}` : ` sampai dengan ${endDateFormatted}`;
  }
  mainParagraph += '.';

  addTextMultiline(mainParagraph, margin, contentWidth, 9);
  yPosition += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${isMalay ? 'Alasan' : 'Alasan'} ${izin.jenis}:`, margin, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setDrawColor(200);
  doc.setLineWidth(0.1);
  doc.rect(margin + 2, yPosition - 3, contentWidth - 4, 12, 'S');
  addTextMultiline(izin.alasan, margin + 4, contentWidth - 8, 9);

  yPosition += 5;

  if (izin.guruPenggantiList && izin.guruPenggantiList.length > 0) {
    yPosition += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(isMalay ? 'Guru Pengganti per Jadual:' : 'Guru Pengganti per Jadwal:', margin, yPosition);
    yPosition += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const groupedByDate = izin.guruPenggantiList.reduce((acc: any, item: any) => {
      const tanggal = item.tanggal.charAt(0).toUpperCase() + item.tanggal.slice(1);
      if (!acc[tanggal]) acc[tanggal] = [];
      acc[tanggal].push(item);
      return acc;
    }, {});

    for (const [tanggal, items] of Object.entries(groupedByDate)) {
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${tanggal}:`, margin + 3, yPosition);
      yPosition += 4;

      (items as any[]).forEach((item: any) => {
        const guruName = getGuruNameById(item.guruPenggantiId);
        const jadwalInfo = getJadwalInfo(item.jadwalId);
        const text = jadwalInfo
          ? `${guruName} - ${jadwalInfo.mapelName} | ${jadwalInfo.jadwal.jamMulai} - ${jadwalInfo.jadwal.jamSelesai}`
          : guruName;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(text, margin + 6, yPosition);
        yPosition += 4;
      });

      yPosition += 2;
    }
  }

  yPosition += 3;

  const demikianText = isMalay
    ? `Demikian surat permohonan ${izin.jenis} ini saya buat dengan sebenar-benarnya. Atas perhatian dan kebijaksanaan Bapa/Ibu, saya ucapkan terima kasih.`
    : `Demikian surat pengajuan ${izin.jenis} ini saya buat dengan sebenar-benarnya. Atas perhatian dan kebijaksanaan Bapak/Ibu, saya ucapkan terima kasih.`;
  addTextMultiline(demikianText, margin, contentWidth, 9);

  yPosition += 5;

  const createdDateFormatted = new Date(izin.createdAt).toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(isMalay ? 'Diajukan pada:' : 'Diajukan pada:', margin, yPosition);
  doc.text(createdDateFormatted, pageWidth - margin - 50, yPosition);
  yPosition += 10;

  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(isMalay ? 'Hormat saya,' : 'Hormat saya,', pageWidth - margin - 40, yPosition, { align: 'left' });
  yPosition += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(user?.name || 'Tidak diketahui', pageWidth - margin - 40, yPosition, { align: 'left' });
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP: ${user?.nip || '-'}`, pageWidth - margin - 40, yPosition, { align: 'left' });

  if (showVerificationStatus && izin.status !== 'menunggu') {
    yPosition += 20;

    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(isMalay ? 'STATUS PENGESAHAN ADMIN' : 'STATUS VERIFIKASI ADMIN', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setLineWidth(0.3);
    doc.rect(margin + 2, yPosition - 5, contentWidth - 4, 35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Status:', margin + 8, yPosition);
    doc.text(isMalay ? 'Tarikh Pengesahan:' : 'Tanggal Verifikasi:', pageWidth / 2 + 5, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const statusText = izin.status === 'diterima'
      ? (isMalay ? 'DILULUSKAN' : 'DISETUJUI')
      : (isMalay ? 'DITOLAK' : 'DITOLAK');
    doc.text(statusText, margin + 8, yPosition);
    const verifyDateFormatted = izin.verifiedAt
      ? new Date(izin.verifiedAt).toLocaleDateString(dateLocale)
      : '-';
    doc.text(verifyDateFormatted, pageWidth / 2 + 5, yPosition);
    yPosition += 8;

    if (izin.keterangan) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(isMalay ? 'Keterangan Admin:' : 'Keterangan:', margin + 8, yPosition);
      yPosition += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      addTextMultiline(izin.keterangan, margin + 12, contentWidth - 15, 8);
    }

    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(isMalay ? 'Administrator' : 'Administrator', pageWidth / 2, yPosition + 3, { align: 'center' });
    yPosition += 12;

    if (izin.status === 'diterima' && verificationQRDataUrl) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(isMalay ? 'Tanda Tangan Digital' : 'Tanda Tangan Digital', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;

      try {
        doc.addImage(verificationQRDataUrl, 'PNG', pageWidth / 2 - 10, yPosition, 20, 20);
        yPosition += 22;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(isMalay ? 'Sah & Terverifikasi Admin' : 'Sah & Terverifikasi Admin', pageWidth / 2, yPosition, { align: 'center' });
      } catch (error) {
        console.error('Error adding QR code:', error);
      }
    }

    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(isMalay ? 'Admin Sekolah' : 'Admin Sekolah', pageWidth / 2, yPosition, { align: 'center' });
  }

  const fileName = `Surat-Izin-Guru-${user?.name}-${new Date(izin.createdAt).toLocaleDateString('id-ID').replace(/\//g, '-')}`;
  doc.save(`${fileName}.pdf`);
};

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
    alamat: 'Alamat Sekolah',
    nomorTelepon: '-',
    email: '-',
    logoSekolah: undefined,
    createdAt: new Date().toISOString()
  };
}

function getJadwalInfo(jadwalId: string) {
  try {
    const jadwals = JSON.parse(localStorage.getItem('jadwalPelajaran') || '[]');
    const mapels = JSON.parse(localStorage.getItem('mataPelajaran') || '[]');

    const jadwal = jadwals.find((j: any) => j.id === jadwalId);
    if (!jadwal) return null;

    const mapel = mapels.find((m: any) => m.id === jadwal.mataPelajaranId);

    return {
      jadwal,
      mapelName: mapel?.name || jadwal.mataPelajaranId
    };
  } catch (error) {
    console.error('Error getting jadwal info:', error);
    return null;
  }
}

function getGuruNameById(guruId: string) {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const guru = users.find((u: any) => u.id === guruId);
    return guru?.name || guruId;
  } catch (error) {
    console.error('Error getting guru name:', error);
    return guruId;
  }
}
