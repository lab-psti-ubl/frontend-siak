import { SuratIzin, User, Kelas, ProfilSekolah } from '../../../../types';
import { showErrorNotification, showSuccessNotification } from '../../../../utils/notificationUtils';

const DEFAULT_SCHOOL_DATA = {
  namaSekolah: 'Sekolah',
  alamat: 'Alamat Sekolah',
  nomorTelepon: '-',
  email: '-',
};

export const generateSuratPDF = async (
  surat: SuratIzin,
  users: User[],
  kelas: Kelas[],
  profilSekolah?: ProfilSekolah | null
) => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const schoolData = profilSekolah || DEFAULT_SCHOOL_DATA;
    const muridUser = users.find(u => u.id === surat.muridId);
    const kelasData = muridUser?.kelasId ? kelas.find(k => k.id === muridUser.kelasId) : null;
    const waliKelasId = kelasData?.waliKelasId;
    const waliKelas = waliKelasId && users.find(u => u.id === waliKelasId);
    const waliKelasName = waliKelas?.name || '-';

    const muridName = muridUser?.name || 'Tidak diketahui';
    const kelasName = kelasData?.name || 'Tidak diketahui';
    const nisn = muridUser?.nisn || 'Tidak diketahui';

    doc.setFontSize(14);
    doc.text(schoolData.namaSekolah, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(schoolData.alamat, 105, 21, { align: 'center' });
    doc.text(`Telp: ${schoolData.nomorTelepon} | Email: ${schoolData.email}`, 105, 26, { align: 'center' });

    doc.line(15, 30, 195, 30);

    doc.setFontSize(12);
    doc.text(`SURAT ${surat.jenis.toUpperCase()}`, 105, 38, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Nomor: ${surat.id.toUpperCase()}/SISWA/${new Date(surat.createdAt).getFullYear()}`, 105, 44, { align: 'center' });

    doc.setFontSize(10);
    let yPos = 52;

    doc.text('Yang bertanda tangan di bawah ini:', 15, yPos);
    yPos += 6;

    doc.text(`Nama              : ${muridName}`, 20, yPos);
    yPos += 6;
    doc.text(`Kelas              : ${kelasName}`, 20, yPos);
    yPos += 6;
    doc.text(`NISN               : ${nisn}`, 20, yPos);
    yPos += 10;

    const tanggalMulai = new Date(surat.tanggalMulai).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let suratText = `Dengan ini mengajukan permohonan ${surat.jenis} untuk tidak mengikuti kegiatan pembelajaran pada tanggal ${tanggalMulai}`;

    if (surat.tanggalMulai !== surat.tanggalSelesai) {
      const tanggalSelesai = new Date(surat.tanggalSelesai).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      suratText += ` sampai dengan ${tanggalSelesai}`;
    }
    suratText += '.';

    const textLines = doc.splitTextToSize(suratText, 170);
    doc.text(textLines, 15, yPos);
    yPos += textLines.length * 5 + 5;

    if (surat.jenis === 'izin_dispen' && (surat.jamMulai || surat.jamSelesai)) {
      doc.setFillColor(220, 240, 255);
      doc.rect(15, yPos - 2, 170, 12, 'F');
      doc.text('Jam Izin Dispen:', 18, yPos + 3);
      doc.text(`Jam Mulai: ${surat.jamMulai || '-'} | Jam Selesai: ${surat.jamSelesai || '-'}`, 18, yPos + 8);
      yPos += 15;
    }

    doc.text('Alasan ' + surat.jenis + ':', 15, yPos);
    yPos += 5;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPos - 2, 170, 12, 'F');
    const alasanLines = doc.splitTextToSize(`"${surat.alasan}"`, 165);
    doc.text(alasanLines, 18, yPos + 2);
    yPos += alasanLines.length * 4 + 8;

    if (surat.bukti) {
      doc.text(`Bukti pendukung: ${surat.bukti}`, 15, yPos);
      yPos += 6;
    }

    yPos += 5;
    const closingLines = doc.splitTextToSize(`Demikian surat ${surat.jenis} ini saya buat dengan sebenar-benarnya. Atas perhatian dan kebijaksanaan Bapak/Ibu, saya ucapkan terima kasih.`, 170);
    doc.text(closingLines, 15, yPos);
    yPos += closingLines.length * 5 + 15;

    const signatureY = yPos;

    doc.text('Diajukan pada:', 15, signatureY);
    doc.text(new Date(surat.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 15, signatureY + 5);

    doc.text('Diketahui,', 70, signatureY, { align: 'center' });
    doc.text('Hormat saya,', 155, signatureY, { align: 'center' });

    doc.line(65, signatureY + 12, 85, signatureY + 12);
    doc.line(150, signatureY + 12, 170, signatureY + 12);

    doc.text(waliKelasName, 70, signatureY + 15, { align: 'center' });
    doc.text('Wali Kelas', 70, signatureY + 19, { align: 'center', fontSize: 8 });

    doc.text(muridName, 155, signatureY + 15, { align: 'center' });

    const fileName = `Surat_${surat.jenis}_${muridName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    showSuccessNotification('Berhasil Diunduh', `Surat berhasil diunduh sebagai ${fileName}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    showErrorNotification('Gagal Mengunduh', 'Terjadi kesalahan saat mengunduh surat.');
  }
};

export const getStatusBadgeVariant = (status: string): 'warning' | 'info' | 'default' | 'success' | 'danger' => {
  switch (status) {
    case 'menunggu':
      return 'warning';
    case 'diterima':
      return 'success';
    case 'ditolak':
      return 'danger';
    default:
      return 'default';
  }
};

export const getJenisBadgeVariant = (jenis: string): 'warning' | 'info' | 'default' | 'success' | 'danger' => {
  if (jenis === 'izin') {
    return 'warning';
  } else if (jenis === 'sakit') {
    return 'info';
  } else if (jenis === 'izin_dispen') {
    return 'default';
  }
  return 'info';
};

export const getJenisLabel = (jenis: string): string => {
  if (jenis === 'izin_dispen') {
    return 'IZIN DISPEN';
  }
  return jenis.toUpperCase();
};

export const getDisabledDates = (suratIzin: SuratIzin[], userId: string): string[] => {
  return suratIzin
    .filter(s => s.muridId === userId && s.status === 'menunggu' && s.jenis !== 'izin_dispen')
    .reduce((acc, s) => {
      const dates: string[] = [];
      let current = new Date(s.tanggalMulai);
      const end = new Date(s.tanggalSelesai);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
      return [...acc, ...dates];
    }, []);
};

export const getActiveIzinRanges = (suratIzin: SuratIzin[], userId: string) => {
  return suratIzin
    .filter(s => s.muridId === userId && s.status === 'diterima' && s.jenis !== 'izin_dispen')
    .map(s => ({
      start: s.tanggalMulai,
      end: s.tanggalSelesai
    }));
};
