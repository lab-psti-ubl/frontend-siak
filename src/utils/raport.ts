import {
  User,
  Guru,
  Kelas,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi,
  Jurusan,
  ProfilSekolah,
  DataKepsek,
  StatusBagiRaport,
} from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { exportToExcel, formatDateID } from './exportUtils';
import { shouldShowJurusan, shouldShowJurusanSync, formatTingkatKelas, getMaxTingkat } from './jenjangPendidikanUtils';
import {
  calculateKehadiran,
  calculateKehadiranFromDailyAttendance,
  calculateRataTugas,
  getGradeColor,
  KOMPONEN_NILAI,
  getNilaiMinimalSettings,
  getSemuaKomponenNilai
} from './nilaiUtils';
import { getVerificationUrl } from './verificationPageUtils';

// Cache untuk data sekolah dan kepala sekolah (diset dari hooks)
let profilSekolahCache: ProfilSekolah | null = null;
let dataKepsekCache: DataKepsek | null = null;

// Fungsi untuk set cache profil sekolah dari hooks
export const setProfilSekolahCache = (data: ProfilSekolah | null) => {
  profilSekolahCache = data;
};

// Fungsi untuk set cache data kepsek dari hooks
export const setDataKepsekCache = (data: DataKepsek | null) => {
  dataKepsekCache = data;
};

// Utility untuk mendapatkan data sekolah dari cache
const getSchoolDataFromStorage = (): ProfilSekolah | null => {
  return profilSekolahCache;
};

// Utility untuk mendapatkan data kepala sekolah dari cache
const getHeadmasterDataFromStorage = (): DataKepsek | null => {
  return dataKepsekCache;
};

// Default school data jika tidak ada di localStorage
const DEFAULT_SCHOOL_DATA = {
  namaSekolah: 'SMA NEGERI 1 JAKARTA',
  alamat: 'Jl. Pendidikan No. 123, Jakarta Pusat 10110',
  nomorTelepon: '(021) 123-4567',
  email: 'info@sman1jakarta.sch.id',
  website: 'www.sman1jakarta.sch.id',
  kota: 'Jakarta'
};

export interface RaportData {
  student: User;
  kelas: Kelas;
  jurusan: Jurusan | null; // null untuk SD/SMP yang tidak memiliki jurusan
  tahunAjaran: TahunAjaran;
  semester: number;
  subjects: SubjectGrade[];
  overallGrade: number;
  attendanceRate: number;
  isNaikKelas: boolean;
  showKenaikanKelas: boolean;
  waliKelas?: {
    id: string;
    name: string;
    nip?: string;
    tahunAjaran: string;
    semester: number;
  };
}

export interface SubjectGrade {
  mapelId: string;
  mapelName: string;
  mapelCode: string;
  guruName: string;
  kehadiran: number;
  rataTugas: number;
  jumlahTugas: number;
  uts: number | null;
  uas: number | null;
  nilaiAkhir: number | null;
  grade: string | null;
  komponenDinamis?: Array<{ komponenNama: string; rataValues: number }>;
}

export const generateRaportData = (
  studentId: string,
  semester: number,
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaranList: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[],
  statusBagiRaportList?: StatusBagiRaport[]
): RaportData | null => {
  const student = users.find(u => u.id === studentId);
  if (!student) {
    return null;
  }

  // Use the first tahun ajaran from the filtered list, or find active one as fallback
  const targetTahunAjaran = tahunAjaranList.length > 0 ? tahunAjaranList[0] : null;
  if (!targetTahunAjaran) {
    return null;
  }

  const isGuruUser = (user: User): user is Guru => user.role === 'guru';
  const guruUsers = users.filter(isGuruUser);

  // Use provided statusBagiRaportList or empty array as fallback
  const statusBagiRaportData = statusBagiRaportList || [];

  const findHistoricalWaliKelas = (kelasId: string | null | undefined): Guru | undefined => {
    if (!kelasId) return undefined;

    const statusMatch = statusBagiRaportData.find(status =>
      status.kelasId === kelasId &&
      status.tahunAjaran === targetTahunAjaran.tahun &&
      status.semester === semester &&
      status.publishedBy
    );
    if (statusMatch?.publishedBy) {
      const guru = guruUsers.find(g => g.id === statusMatch.publishedBy);
      if (guru) {
        return guru;
      }
    }

    const statusSameYearMatch = statusBagiRaportData.find(status =>
      status.kelasId === kelasId &&
      status.tahunAjaran === targetTahunAjaran.tahun &&
      status.publishedBy
    );
    if (statusSameYearMatch?.publishedBy) {
      const guru = guruUsers.find(g => g.id === statusSameYearMatch.publishedBy);
      if (guru) {
        return guru;
      }
    }

    const historyMatch = guruUsers.find(guru =>
      guru.riwayatKelasWali?.some(riwayat =>
        riwayat.kelasId === kelasId &&
        riwayat.tahunAjaran === targetTahunAjaran.tahun &&
        riwayat.semester === semester
      )
    );
    if (historyMatch) {
      return historyMatch;
    }

    const sameYearMatch = guruUsers.find(guru =>
      guru.riwayatKelasWali?.some(riwayat =>
        riwayat.kelasId === kelasId &&
        riwayat.tahunAjaran === targetTahunAjaran.tahun
      )
    );
    if (sameYearMatch) {
      return sameYearMatch;
    }

    const currentAssignmentMatch = guruUsers.find(guru => guru.kelasWali === kelasId);
    if (currentAssignmentMatch) {
      return currentAssignmentMatch;
    }

    const kelasData = kelas.find(k => k.id === kelasId);
    if (kelasData?.waliKelasId) {
      return guruUsers.find(guru => guru.id === kelasData.waliKelasId);
    }

    return undefined;
  };

  // Cari kelas berdasarkan data nilai untuk periode tahun ajaran yang dipilih
  const nilaiPeriod = nilai.filter(n =>
    n.muridId === studentId &&
    n.tahunAjaran === targetTahunAjaran.tahun &&
    n.semester === semester
  );

  let kelasIdFromNilai: string | null = null;

  if (nilaiPeriod.length > 0) {
    kelasIdFromNilai = nilaiPeriod[0].kelasId;
  } else {
    // Jika tidak ada nilai untuk semester yang dipilih, coba cari dari semester lain di tahun ajaran yang sama
    const nilaiOtherSemester = nilai.find(n =>
      n.muridId === studentId &&
      n.tahunAjaran === targetTahunAjaran.tahun
    );

    if (nilaiOtherSemester) {
      kelasIdFromNilai = nilaiOtherSemester.kelasId;
    }
  }

  if (!kelasIdFromNilai) {
    // Fallback ke kelas saat ini jika tidak ada nilai sama sekali
    const studentKelas = kelas.find(k => k.id === student.kelasId);
    if (!studentKelas) {
      return null;
    }

    // Untuk SMA/SMK, cari jurusan. Untuk SD/SMP, jurusan adalah null
    const requiresJurusan = shouldShowJurusanSync();
    const studentJurusan = requiresJurusan 
      ? jurusan.find(j => j.id === studentKelas.jurusanId) 
      : null;
    
    if (requiresJurusan && !studentJurusan) {
      return null;
    }

    const waliKelasGuru = findHistoricalWaliKelas(studentKelas.id);

    // Calculate attendance rate from daily attendance even when there are no grades
    const attendanceRate = calculateKehadiranFromDailyAttendance(
      studentId,
      studentKelas.id,
      targetTahunAjaran.id,
      semester,
      absensi
    );

    return {
      student,
      kelas: studentKelas,
      jurusan: studentJurusan,
      tahunAjaran: targetTahunAjaran,
      semester,
      subjects: [],
      overallGrade: 0,
      attendanceRate,
      isNaikKelas: false,
      showKenaikanKelas: semester === 2,
      waliKelas: waliKelasGuru ? {
        id: waliKelasGuru.id,
        name: waliKelasGuru.name,
        nip: waliKelasGuru.nip,
        tahunAjaran: targetTahunAjaran.tahun,
        semester,
      } : undefined,
    };
  }

  // Gunakan kelasId dari nilai
  const studentKelas = kelas.find(k => k.id === kelasIdFromNilai);
  if (!studentKelas) {
    return null;
  }

  const requiresJurusan = shouldShowJurusanSync();
  const studentJurusan = requiresJurusan ? jurusan.find(j => j.id === studentKelas.jurusanId) : null;
  if (requiresJurusan && !studentJurusan) {
    return null;
  }

  const waliKelasGuru = findHistoricalWaliKelas(kelasIdFromNilai);

  // Get all subjects for the class
  const jadwalKelas = jadwalPelajaran.filter(j =>
    j.kelasId === kelasIdFromNilai &&
    j.tahunAjaran === targetTahunAjaran.tahun &&
    j.semester === semester
  );
  
  const uniqueMapel = [...new Set(jadwalKelas.map(j => j.mataPelajaranId))];

  // Generate subject grades
  const subjects: SubjectGrade[] = uniqueMapel.map(mapelId => {
    const mapel = mataPelajaran.find(m => m.id === mapelId);
    const jadwal = jadwalKelas.find(j => j.mataPelajaranId === mapelId);
    const guru = users.find(u => u.id === jadwal?.guruId);
    
    // Cari nilai murid - sama persis dengan cara NilaiKelasUtils
    const nilaiMurid = nilai.find(n =>
      n.muridId === studentId &&
      n.mataPelajaranId === mapelId &&
      n.kelasId === kelasIdFromNilai &&
      n.semester === semester &&
      n.tahunAjaran === targetTahunAjaran.tahun
    );

    // Gunakan calculateKehadiran dari nilaiUtils (sama dengan NilaiKelas)
    const kehadiran = calculateKehadiran(
      studentId,
      mapelId,
      kelasIdFromNilai!,
      jadwal?.guruId || '',
      semester,
      targetTahunAjaran.tahun,
      absensi,
      sesiAbsensi,
      jadwalPelajaran
    );
    const rataTugas = nilaiMurid ? calculateRataTugas(nilaiMurid.tugas) : 0;

    // Calculate average for dynamic components - only for active components
    // Ambil semua komponen yang aktif dari database, kecuali yang sudah ditampilkan di kolom terpisah
    const activeKomponen = getSemuaKomponenNilai();
    const dinamicKomponenNames = activeKomponen
      .filter(k => !['Kehadiran', 'Tugas', 'UTS', 'UAS'].includes(k.nama))
      .map(k => k.nama);

    // Group and calculate rata-rata untuk setiap komponen dinamis
    const komponenDinamis: Array<{ komponenNama: string; rataValues: number }> = [];
    
    if (nilaiMurid?.komponenDinamis && nilaiMurid.komponenDinamis.length > 0) {
      // Group by komponenNama
      const grouped: Record<string, number[]> = {};
      nilaiMurid.komponenDinamis.forEach(kd => {
        if (dinamicKomponenNames.includes(kd.komponenNama)) {
          if (!grouped[kd.komponenNama]) {
            grouped[kd.komponenNama] = [];
          }
          grouped[kd.komponenNama].push(kd.nilai);
        }
      });
      
      // Calculate average for each komponen
      Object.entries(grouped).forEach(([nama, values]) => {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        komponenDinamis.push({ komponenNama: nama, rataValues: avg });
      });
    }

    return {
      mapelId,
      mapelName: mapel?.name || 'Unknown',
      mapelCode: mapel?.code || 'Unknown',
      guruName: guru?.name || 'Unknown',
      kehadiran,
      rataTugas,
      jumlahTugas: nilaiMurid?.tugas?.length || 0,
      uts: nilaiMurid?.uts !== undefined ? nilaiMurid.uts : null,
      uas: nilaiMurid?.uas !== undefined ? nilaiMurid.uas : null,
      nilaiAkhir: nilaiMurid?.nilaiAkhir !== undefined ? nilaiMurid.nilaiAkhir : null,
      grade: nilaiMurid?.grade || null,
      komponenDinamis: komponenDinamis.length > 0 ? komponenDinamis : undefined,
    };
  });

  // Calculate overall grade
  const validGrades = subjects.filter(s => s.nilaiAkhir !== null);
  const overallGrade = validGrades.length > 0 
    ? validGrades.reduce((sum, s) => sum + (s.nilaiAkhir || 0), 0) / validGrades.length
    : 0;

  // Calculate overall attendance rate from daily attendance (absen kehadiran) for graduation/promotion requirements
  const attendanceRate = calculateKehadiranFromDailyAttendance(
    studentId,
    kelasIdFromNilai!,
    targetTahunAjaran.id,
    semester,
    absensi
  );

  // Determine if student passes to next grade (only for semester genap)
  const minimalSettings = getNilaiMinimalSettings();
  const isNaikKelas = semester === 2 && overallGrade >= minimalSettings.nilaiAkhirMinimal && attendanceRate >= minimalSettings.tingkatKehadiranMinimal;
  const showKenaikanKelas = semester === 2;

  return {
    student,
    kelas: studentKelas,
    jurusan: studentJurusan,
    tahunAjaran: targetTahunAjaran,
    semester,
    subjects,
    overallGrade,
    attendanceRate,
    isNaikKelas,
    showKenaikanKelas,
    waliKelas: waliKelasGuru ? {
      id: waliKelasGuru.id,
      name: waliKelasGuru.name,
      nip: waliKelasGuru.nip,
      tahunAjaran: targetTahunAjaran.tahun,
      semester,
    } : undefined,
  };
};

const generateQRCode = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 150,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    return '';
  }
};

export const generateRaportPDFAsync = async (raportData: RaportData): Promise<jsPDF> => {
  const {
    student,
    kelas,
    jurusan,
    tahunAjaran,
    semester,
    subjects,
    overallGrade,
    attendanceRate,
    isNaikKelas,
    showKenaikanKelas
  } = raportData;

  const schoolData = getSchoolDataFromStorage() || DEFAULT_SCHOOL_DATA;
  const headmasterData = getHeadmasterDataFromStorage();

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let currentY = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Header - School Logo on left and Info on right
  const logoX = margin + 5;
  const logoY = currentY + 5;
  const logoSize = 18;

  // Logo - use school logo if available, otherwise use default circle
  if (schoolData.logoSekolah) {
    try {
      doc.addImage(schoolData.logoSekolah, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      // Fallback to circle if image fails to load
      doc.setFillColor(30, 64, 175);
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SMA', logoX + logoSize / 2, logoY + logoSize / 2 + 1, { align: 'center' });
    }
  } else {
    // Default blue circle logo
    doc.setFillColor(30, 64, 175);
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SMA', logoX + logoSize / 2, logoY + logoSize / 2 + 1, { align: 'center' });
  }

  // School info on the right side of logo
  const infoX = logoX + logoSize + 10;
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolData.namaSekolah, infoX, logoY + 5, { align: 'left' });

  doc.setTextColor(102, 102, 102);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolData.alamat, infoX, logoY + 11, { align: 'left' });

  doc.setFontSize(8);
  doc.text(`Telp: ${schoolData.nomorTelepon} | Email: ${schoolData.email}`, infoX, logoY + 16, { align: 'left' });

  doc.text(`Website: ${schoolData.website || 'www.sman1jakarta.sch.id'}`, infoX, logoY + 20, { align: 'left' });

  currentY += 35;

  // Line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 10;
  
  // Title
  doc.setFillColor(30, 64, 175);
  doc.rect(margin, currentY, contentWidth, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN HASIL BELAJAR SISWA', pageWidth / 2, currentY + 8, { align: 'center' });
  
  currentY += 20;
  
  // Student Information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTITAS SISWA', margin, currentY);
  
  currentY += 8;
  
  // Student info in two columns
  const leftColumnX = margin;
  const rightColumnX = pageWidth / 2 + 10;
  const labelWidth = 35;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Left column
  doc.text('Nama Siswa', leftColumnX, currentY);
  doc.text(': ' + student.name, leftColumnX + labelWidth, currentY);

  doc.text('NISN', leftColumnX, currentY + 6);
  doc.text(': ' + (student.nisn || '-'), leftColumnX + labelWidth, currentY + 6);

  doc.text('Kelas', leftColumnX, currentY + 12);
  doc.text(': ' + kelas.name, leftColumnX + labelWidth, currentY + 12);

  if (shouldShowJurusan() && jurusan) {
    doc.text('Jurusan', leftColumnX, currentY + 18);
    doc.text(': ' + jurusan.name, leftColumnX + labelWidth, currentY + 18);
  }

  // Right column
  doc.text('Tahun Ajaran', rightColumnX, currentY);
  doc.text(': ' + tahunAjaran.tahun, rightColumnX + labelWidth, currentY);

  doc.text('Semester', rightColumnX, currentY + 6);
  doc.text(': ' + semester + ' (' + (semester === 1 ? 'Ganjil' : 'Genap') + ')', rightColumnX + labelWidth, currentY + 6);

  doc.text('Wali Kelas', rightColumnX, currentY + 12);
  doc.text(': ' + (raportData.waliKelas?.name || '-'), rightColumnX + labelWidth, currentY + 12);

  doc.text('NIP', rightColumnX, currentY + 18);
  doc.text(': ' + (raportData.waliKelas?.nip || '-'), rightColumnX + labelWidth, currentY + 18);

  currentY += 28;
  
  // Grades Table
  checkPageBreak(60);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CAPAIAN HASIL BELAJAR', margin, currentY);
  
  currentY += 4;
  
  // Get all unique dynamic components from subjects
  const allKomponenNames = new Set<string>();
  subjects.forEach(subject => {
    subject.komponenDinamis?.forEach(kd => {
      allKomponenNames.add(kd.komponenNama);
    });
  });
  const komponenNamaList = Array.from(allKomponenNames).sort();

  // Capitalize first letter of component names
  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const komponenNamaCapitalized = komponenNamaList.map(capitalizeFirst);

  // Prepare table data - gunakan header yang lebih pendek
  const baseHeaders = ['No', 'Mata Pelajaran', 'Guru', 'Hadir', 'Tugas', 'UTS', 'UAS', 'NA', 'Grade'];
  const tableHeaders = [
    [...baseHeaders.slice(0, 7), ...komponenNamaCapitalized, ...baseHeaders.slice(7)]
  ];

  const tableData = subjects.map((subject, index) => {
    const baseRow = [
      (index + 1).toString(),
      subject.mapelName,
      subject.guruName,
      subject.kehadiran.toFixed(0),
      subject.rataTugas.toFixed(0),
      subject.uts !== null ? subject.uts.toString() : '-',
      subject.uas !== null ? subject.uas.toString() : '-',
    ];

    const komponenValues = komponenNamaList.map(komponenNama => {
      const komponen = subject.komponenDinamis?.find(kd => kd.komponenNama === komponenNama);
      return komponen ? komponen.rataValues.toFixed(0) : '-';
    });

    return [
      ...baseRow,
      ...komponenValues,
      subject.nilaiAkhir !== null ? subject.nilaiAkhir.toFixed(1) : '-',
      subject.grade || '-'
    ];
  });
  
  // Hitung jumlah total kolom
  const totalColumns = 9 + komponenNamaList.length;
  
  // Gunakan auto width agar kolom otomatis menyesuaikan
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: currentY,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 8 },   // No
      1: { cellWidth: 'auto', halign: 'left' }, // Mata Pelajaran
      2: { cellWidth: 'auto', halign: 'left' }, // Guru
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: 'auto',
    didDrawPage: (data) => {
      currentY = data.cursor?.y || currentY;
    }
  });
  
  currentY += 15;
  checkPageBreak(40);
  
  // Summary Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('RINGKASAN PRESTASI', margin, currentY);
  
  currentY += 10;
  
  // Summary boxes
  const boxWidth = (contentWidth - 10) / 2;
  const boxHeight = 25;
  
  // Left box - Rata-rata Nilai
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, boxWidth, boxHeight);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Rata-rata Nilai', margin + boxWidth/2, currentY + 8, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(overallGrade.toFixed(1), margin + boxWidth/2, currentY + 18, { align: 'center' });
  
  // Right box - Tingkat Kehadiran
  doc.setTextColor(0, 0, 0);
  doc.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Tingkat Kehadiran', margin + boxWidth + 10 + boxWidth/2, currentY + 8, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(attendanceRate.toFixed(1) + '%', margin + boxWidth + 10 + boxWidth/2, currentY + 18, { align: 'center' });
  
  currentY += boxHeight + 15;
  
  // Teacher's Note
  checkPageBreak(30);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Catatan Wali Kelas:', margin, currentY);
  
  currentY += 8;
  
  const teacherNote = generateTeacherNote(overallGrade, attendanceRate, student.name);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  
  const noteLines = doc.splitTextToSize(teacherNote, contentWidth - 10);
  doc.text(noteLines, margin + 5, currentY);
  currentY += noteLines.length * 4 + 10;
  
  // Keputusan Kenaikan Kelas (only for semester genap)
  if (showKenaikanKelas) {
    checkPageBreak(35);
    
    const decisionColor = isNaikKelas ? [16, 185, 129] : [239, 68, 68]; // emerald-500 or red-500
    const bgColor = isNaikKelas ? [236, 253, 245] : [254, 242, 242]; // emerald-50 or red-50
    
    // Background rectangle
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(margin, currentY, contentWidth, 25, 'F');
    
    // Border
    doc.setDrawColor(decisionColor[0], decisionColor[1], decisionColor[2]);
    doc.setLineWidth(1);
    doc.rect(margin, currentY, contentWidth, 25);
    
    // Title
    doc.setTextColor(decisionColor[0], decisionColor[1], decisionColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const maxTingkat = getMaxTingkat();
    const decisionTitle = kelas.tingkat === maxTingkat ? 'KEPUTUSAN KELULUSAN' : 'KEPUTUSAN KENAIKAN KELAS';
    doc.text(decisionTitle, pageWidth / 2, currentY + 8, { align: 'center' });

    // Decision
    doc.setFontSize(14);
    const nextTingkat = formatTingkatKelas(kelas.tingkat + 1);
    const decisionText = isNaikKelas ?
      (kelas.tingkat === maxTingkat ? 'LULUS' : `NAIK KE KELAS ${nextTingkat}`) :
      (kelas.tingkat === maxTingkat ? 'TIDAK LULUS' : 'TIDAK NAIK KELAS');
    doc.text(decisionText, pageWidth / 2, currentY + 16, { align: 'center' });

    // Explanation
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const minimalSettings = getNilaiMinimalSettings();
    const explanationText = isNaikKelas ?
      (kelas.tingkat === maxTingkat ? `Memenuhi syarat kelulusan (nilai ≥ ${minimalSettings.nilaiAkhirMinimal} dan kehadiran ≥ ${minimalSettings.tingkatKehadiranMinimal}%)` : `Memenuhi syarat kenaikan kelas (nilai ≥ ${minimalSettings.nilaiAkhirMinimal} dan kehadiran ≥ ${minimalSettings.tingkatKehadiranMinimal}%)`) :
      (kelas.tingkat === maxTingkat ? `Belum memenuhi syarat kelulusan (nilai < ${minimalSettings.nilaiAkhirMinimal} atau kehadiran < ${minimalSettings.tingkatKehadiranMinimal}%)` : `Belum memenuhi syarat kenaikan kelas (nilai < ${minimalSettings.nilaiAkhirMinimal} atau kehadiran < ${minimalSettings.tingkatKehadiranMinimal}%)`);
    doc.text(explanationText, pageWidth / 2, currentY + 21, { align: 'center' });
    
    currentY += 35;
  }
  
  // Signatures
  checkPageBreak(70);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Generate verification URL and QR code
  const verificationUrl = getVerificationUrl(student.nisn, {
    name: student.name,
    nisn: student.nisn,
    kelas: kelas.name
  }, 'raport');
  const qrCodeDataUrl = await generateQRCode(verificationUrl);

  // Left signature - Kepala Sekolah
  const leftSigX = margin + 10;
  const centerSigX = pageWidth / 2;
  const rightSigX = pageWidth - margin - 55;
  const sigColWidth = (pageWidth - margin * 2) / 3;

  doc.text('Mengetahui,', leftSigX+20, currentY, { align: 'center' });
  doc.text('Kepala Sekolah', leftSigX+20, currentY + 6, { align: 'center' });

  // Signature line
  doc.line(leftSigX-5, currentY + 35, leftSigX + 45, currentY + 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(headmasterData?.nama || 'Belum ditentukan', leftSigX+20, currentY + 40, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('NIP: ' + (headmasterData?.nip || '-'), leftSigX+20, currentY + 45, { align: 'center' });

  // Center - QR Code (Digital Signature)
  if (qrCodeDataUrl) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Tanda Tangan Digital', centerSigX, currentY, { align: 'center' });

    // QR code border
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(1);
    doc.rect(centerSigX - 17, currentY + 4, 34, 34);

    // Add QR code image
    const qrSize = 30;
    doc.addImage(qrCodeDataUrl, 'PNG', centerSigX - qrSize / 2, currentY + 6, qrSize, qrSize);

    // Verified status
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('SAH & TERVERIFIKASI', centerSigX, currentY + 44, { align: 'center' });
  }

  // Right signature - Wali Kelas
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Get current date formatted in Indonesian
  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.text(`${schoolData.kota}, ${dateStr}`, rightSigX+30, currentY, { align: 'center' });
  doc.text('Wali Kelas', rightSigX+30, currentY + 6, { align: 'center' });

  // Signature line
  doc.line(rightSigX, currentY + 35, rightSigX + 55, currentY + 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(raportData.waliKelas?.name || 'Belum ditentukan', rightSigX+30, currentY + 40, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('NIP: ' + (raportData.waliKelas?.nip || '-'), rightSigX+30, currentY + 45, { align: 'center' });

  currentY += 65;
  
  // Print date footer
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  const printDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text('Dicetak pada: ' + printDate, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  return doc;
};

export const printRaport = async (raportData: RaportData) => {
  const doc = await generateRaportPDFAsync(raportData);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

export const exportRaportData = (raportData: RaportData) => {
  // Get all unique dynamic components from subjects
  const allKomponenNames = new Set<string>();
  raportData.subjects.forEach(subject => {
    subject.komponenDinamis?.forEach(kd => {
      allKomponenNames.add(kd.komponenNama);
    });
  });
  const komponenNamaList = Array.from(allKomponenNames).sort();

  // Capitalize first letter of component names
  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const komponenNamaCapitalized = komponenNamaList.map(capitalizeFirst);

  const data = raportData.subjects.map((subject, index) => {
    const baseObj = {
      no: index + 1,
      mataPelajaran: subject.mapelName,
      guru: subject.guruName,
      kehadiran: `${subject.kehadiran.toFixed(1)}`,
      rataTugas: subject.rataTugas.toFixed(1),
      jumlahTugas: subject.jumlahTugas,
      uts: subject.uts || '-',
      uas: subject.uas || '-',
    };

    // Add dynamic components
    const komponenObj: any = {};
    komponenNamaCapitalized.forEach((komponenNamaCapitalized, index) => {
      const komponen = subject.komponenDinamis?.find(kd => kd.komponenNama === komponenNamaList[index]);
      komponenObj[komponenNamaCapitalized] = komponen ? komponen.rataValues.toFixed(1) : '-';
    });

    return {
      ...baseObj,
      ...komponenObj,
      nilaiAkhir: subject.nilaiAkhir?.toFixed(1) || '-',
      grade: subject.grade || '-'
    };
  });

  // Add summary row
  const summaryRow: any = {
    no: '',
    mataPelajaran: 'RATA-RATA KESELURUHAN',
    guru: '',
    kehadiran: '',
    rataTugas: '',
    jumlahTugas: '',
    uts: '',
    uas: '',
  };

  // Add empty dynamic components in summary
  komponenNamaCapitalized.forEach(komponenNama => {
    summaryRow[komponenNama] = '';
  });

  summaryRow.nilaiAkhir = raportData.overallGrade.toFixed(1);
  summaryRow.grade = '';

  data.push(summaryRow);

  // Build columns array
  const columns = [
    { header: 'No', dataKey: 'no', width: 5 },
    { header: 'Mata Pelajaran', dataKey: 'mataPelajaran', width: 25 },
    { header: 'Guru', dataKey: 'guru', width: 20 },
    { header: 'Kehadiran', dataKey: 'kehadiran', width: 12 },
    { header: 'Rata Tugas', dataKey: 'rataTugas', width: 12 },
    { header: 'Jml Tugas', dataKey: 'jumlahTugas', width: 10 },
    { header: 'UTS', dataKey: 'uts', width: 8 },
    { header: 'UAS', dataKey: 'uas', width: 8 },
  ];

  // Add dynamic component columns
  komponenNamaCapitalized.forEach(komponenNama => {
    columns.push({
      header: komponenNama,
      dataKey: komponenNama,
      width: 12
    });
  });

  // Add final columns
  columns.push(
    { header: 'Nilai Akhir', dataKey: 'nilaiAkhir', width: 12 },
    { header: 'Grade', dataKey: 'grade', width: 8 }
  );

  const title = `LAPORAN HASIL BELAJAR SISWA\nNama: ${raportData.student.name}\nNISN: ${raportData.student.nisn}\nKelas: ${raportData.kelas.name}\nTahun Ajaran: ${raportData.tahunAjaran.tahun} Semester ${raportData.semester}\nRata-rata Nilai: ${raportData.overallGrade.toFixed(1)}\nTingkat Kehadiran: ${raportData.attendanceRate.toFixed(1)}%`;
  const filename = `laporan-hasil-belajar-${raportData.student.name.replace(/\s+/g, '-')}-${raportData.tahunAjaran.tahun.replace('/', '-')}-S${raportData.semester}`;

  exportToExcel(data, columns, title, filename);
};

export const downloadRaportPDF = async (raportData: RaportData) => {
  const doc = await generateRaportPDFAsync(raportData);
  const filename = `laporan-hasil-belajar-${raportData.student.name.replace(/\s+/g, '-')}-${raportData.tahunAjaran.tahun.replace('/', '-')}-S${raportData.semester}.pdf`;
  doc.save(filename);
};

export const generateTeacherNote = (overallGrade: number, attendanceRate: number, studentName: string): string => {
  const nilaiMinimalSettings = getNilaiMinimalSettings();
  const nilaiMinimal = nilaiMinimalSettings.nilaiAkhirMinimal;

  let academicNote = '';
  const scoreThresholdHigh = Math.min(nilaiMinimal + 10, 100);
  const scoreThresholdMid = nilaiMinimal + 5;

  if (overallGrade >= scoreThresholdHigh) {
    academicNote = `${studentName} menunjukkan prestasi akademik yang sangat baik dengan rata-rata nilai ${overallGrade.toFixed(1)}.`;
  } else if (overallGrade >= scoreThresholdMid) {
    academicNote = `${studentName} menunjukkan prestasi akademik yang baik dengan rata-rata nilai ${overallGrade.toFixed(1)}.`;
  } else if (overallGrade >= nilaiMinimal) {
    academicNote = `${studentName} menunjukkan prestasi akademik yang cukup dengan rata-rata nilai ${overallGrade.toFixed(1)}.`;
  } else {
    academicNote = `${studentName} perlu meningkatkan prestasi akademik dengan rata-rata nilai ${overallGrade.toFixed(1)}.`;
  }

  const kehadiranMinimal = nilaiMinimalSettings.tingkatKehadiranMinimal;
  let attendanceNote = '';
  const attendanceThresholdHigh = Math.min(kehadiranMinimal + 15, 100);
  const attendanceThresholdMid = kehadiranMinimal + 5;

  if (attendanceRate >= attendanceThresholdHigh) {
    attendanceNote = ' Tingkat kehadiran sangat baik dan konsisten.';
  } else if (attendanceRate >= attendanceThresholdMid) {
    attendanceNote = ' Tingkat kehadiran baik, namun masih bisa ditingkatkan.';
  } else if (attendanceRate >= kehadiranMinimal) {
    attendanceNote = ' Tingkat kehadiran cukup, perlu lebih konsisten dalam menghadiri pelajaran.';
  } else {
    attendanceNote = ' Perlu meningkatkan kehadiran untuk mendukung prestasi akademik.';
  }

  return academicNote + attendanceNote + ' Terus semangat belajar dan pertahankan prestasi yang baik!';
};

export const getGradeDistribution = (subjects: SubjectGrade[]): Record<string, number> => {
  return subjects.reduce((acc, subject) => {
    const grade = subject.grade || 'E';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const getClassStatistics = (
  kelasId: string,
  semester: number,
  nilai: Nilai[],
  tahunAjaranList: TahunAjaran[]
): { rata: number; tertinggi: number; terendah: number; gradeDistribution: Record<string, number> } => {
  const targetTahunAjaran = tahunAjaranList.length > 0 ? tahunAjaranList[0] : tahunAjaranList.find(ta => ta.isActive);
  if (!targetTahunAjaran) return { rata: 0, tertinggi: 0, terendah: 0, gradeDistribution: {} };

  const nilaiKelas = nilai.filter(n => 
    n.kelasId === kelasId &&
    n.semester === semester &&
    n.tahunAjaran === targetTahunAjaran.tahun &&
    n.nilaiAkhir !== null
  );

  if (nilaiKelas.length === 0) return { rata: 0, tertinggi: 0, terendah: 0, gradeDistribution: {} };

  const nilaiAkhirList = nilaiKelas.map(n => n.nilaiAkhir!);
  const rata = nilaiAkhirList.reduce((sum, n) => sum + n, 0) / nilaiAkhirList.length;
  const tertinggi = Math.max(...nilaiAkhirList);
  const terendah = Math.min(...nilaiAkhirList);

  const gradeDistribution = nilaiKelas.reduce((acc, n) => {
    const grade = n.grade || 'E';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { rata, tertinggi, terendah, gradeDistribution };
};
