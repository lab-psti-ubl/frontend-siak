import { JadwalPelajaran, SesiAbsensi, Absensi, User, TahunAjaran, Murid, RiwayatKelasMurid, MataPelajaran, Guru, RiwayatWaliKelas } from '../../../../types';
import { getMuridByKelasAndTahunAjaran } from '../../../../utils/riwayatKelasMuridUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface MapelMeetingInfo {
  mapelId: string;
  mapelCode: string;
  mapelName: string;
  pertemuanKe: number;
  tanggal: string;
}

export interface RekapAbsenMuridData {
  muridInfo: {
    name: string;
    nisn: string;
    kelas: string;
    waliKelas: string;
  };
  tahunAjaran: string;
  semester: number;
  mapelMeetings: MapelMeetingInfo[];
  attendanceMatrix: {
    [key: string]: 'H' | 'A' | 'I' | 'S' | '-';
  };
}

const hariNames: Record<string, string> = {
  'senin': 'Senin',
  'selasa': 'Selasa',
  'rabu': 'Rabu',
  'kamis': 'Kamis',
  'jumat': 'Jumat',
  'sabtu': 'Sabtu',
  'minggu': 'Minggu',
};

const hariToDay: Record<string, number> = {
  'minggu': 0,
  'senin': 1,
  'selasa': 2,
  'rabu': 3,
  'kamis': 4,
  'jumat': 5,
  'sabtu': 6,
};

// Helper function to find wali kelas based on kelasId, tahun ajaran, and semester
const findWaliKelasByTahunAjaran = (
  kelasId: string,
  tahunAjaranStr: string,
  semester: number,
  users: User[],
  kelas: any,
  riwayatWaliKelas?: RiwayatWaliKelas[]
): User | undefined => {
  const guruUsers = users.filter(u => u.role === 'guru') as Guru[];

  // Prioritas 1: Cari dari riwayat wali kelas di field guru.riwayatKelasWali
  const guruFromRiwayat = guruUsers.find(guru =>
    guru.riwayatKelasWali?.some(riwayat =>
      riwayat.kelasId === kelasId &&
      riwayat.tahunAjaran === tahunAjaranStr &&
      riwayat.semester === semester
    )
  );
  if (guruFromRiwayat) {
    return guruFromRiwayat;
  }

  // Prioritas 2: Cari dari riwayat wali kelas di field guru.riwayatKelasWali (tahun ajaran sama, semester berbeda)
  const guruFromRiwayatSameYear = guruUsers.find(guru =>
    guru.riwayatKelasWali?.some(riwayat =>
      riwayat.kelasId === kelasId &&
      riwayat.tahunAjaran === tahunAjaranStr
    )
  );
  if (guruFromRiwayatSameYear) {
    return guruFromRiwayatSameYear;
  }

  // Prioritas 3: Cari dari tabel RiwayatWaliKelas (data kelulusan)
  if (riwayatWaliKelas && riwayatWaliKelas.length > 0) {
    const riwayatMatch = riwayatWaliKelas.find(
      r => r.kelasId === kelasId && r.tahunAjaran === tahunAjaranStr
    );
    if (riwayatMatch?.guruId) {
      const guru = guruUsers.find(g => g.id === riwayatMatch.guruId);
      if (guru) {
        return guru;
      }
    }
  }

  // Prioritas 4: Cari dari kelas.waliKelasId (current assignment)
  if (kelas?.waliKelasId) {
    const guru = guruUsers.find(g => g.id === kelas.waliKelasId);
    if (guru) {
      return guru;
    }
  }

  // Prioritas 5: Cari dari guru.kelasWali (current assignment)
  const guruFromKelasWali = guruUsers.find(guru => guru.kelasWali === kelasId);
  if (guruFromKelasWali) {
    return guruFromKelasWali;
  }

  return undefined;
};

export const generateRekapAbsenMuridData = (
  muridId: string,
  kelasId: string,
  tahunAjaranStr: string,
  semester: number,
  sesiAbsensi: SesiAbsensi[],
  absensi: Absensi[],
  users: User[],
  jadwalPelajaran: JadwalPelajaran[],
  tahunAjaran: TahunAjaran[],
  mataPelajaran: MataPelajaran[],
  kelas: any,
  riwayatKelasMurid: RiwayatKelasMurid[] = [],
  riwayatWaliKelas?: RiwayatWaliKelas[]
): RekapAbsenMuridData => {
  const murid = users.find(u => u.id === muridId) as Murid;
  const waliKelas = findWaliKelasByTahunAjaran(
    kelasId,
    tahunAjaranStr,
    semester,
    users,
    kelas,
    riwayatWaliKelas
  );

  const activeTahunAjaran = tahunAjaran.find(
    ta => ta.tahun === tahunAjaranStr && ta.semester === semester
  );

  if (!activeTahunAjaran || !murid) {
    return {
      muridInfo: {
        name: '',
        nisn: '',
        kelas: '',
        waliKelas: '',
      },
      tahunAjaran: '',
      semester: 0,
      mapelMeetings: [],
      attendanceMatrix: {},
    };
  }

  const mySchedules = jadwalPelajaran.filter(j =>
    j.kelasId === kelasId &&
    j.tahunAjaran === tahunAjaranStr &&
    j.semester === semester
  );

  const mapelMeetings: MapelMeetingInfo[] = [];
  const attendanceMatrix: { [key: string]: 'H' | 'A' | 'I' | 'S' | '-' } = {};

  const startDate = new Date(activeTahunAjaran.tanggalMulai);
  const endDate = new Date(activeTahunAjaran.tanggalSelesai);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  // Hanya sampai hari ini, tidak lebih dari tanggal selesai tahun ajaran
  const actualEndDate = endDate < today ? endDate : today;

  // Kelompokkan jadwal berdasarkan mata pelajaran
  const jadwalByMapel: { [mapelId: string]: JadwalPelajaran[] } = {};
  mySchedules.forEach(jadwal => {
    const mapelId = jadwal.mataPelajaranId;
    if (!jadwalByMapel[mapelId]) {
      jadwalByMapel[mapelId] = [];
    }
    jadwalByMapel[mapelId].push(jadwal);
  });

  // Untuk setiap mata pelajaran, gabungkan semua pertemuan dari semua jadwal
  Object.entries(jadwalByMapel).forEach(([mapelId, jadwalList]) => {
    const mapel = mataPelajaran.find(m => m.id === mapelId);
    if (!mapel) return;

    // Urutkan jadwal berdasarkan hari dalam seminggu (senin=1, selasa=2, dst)
    jadwalList.sort((a, b) => {
      const dayA = hariToDay[a.hari] || 0;
      const dayB = hariToDay[b.hari] || 0;
      return dayA - dayB;
    });

    // Kumpulkan semua tanggal dari semua jadwal untuk mata pelajaran ini
    interface MeetingDate {
      dateStr: string;
      date: Date;
      jadwal: JadwalPelajaran;
    }

    const allMeetingDates: MeetingDate[] = [];

    jadwalList.forEach(jadwal => {
      const targetDay = hariToDay[jadwal.hari];
      // eslint-disable-next-line prefer-const
      let currentDate = new Date(startDate);

      // Cari hari pertama yang sesuai dengan jadwal
      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Kumpulkan semua tanggal untuk jadwal ini, hanya sampai hari ini
      while (currentDate <= actualEndDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        allMeetingDates.push({
          dateStr,
          date: new Date(currentDate),
          jadwal,
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    });

    // Urutkan semua tanggal secara kronologis
    allMeetingDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Hitung pertemuan secara berurutan
    allMeetingDates.forEach((meetingDate, index) => {
      const pertemuanKe = index + 1;
      const meetingKey = `${mapel.code}-${pertemuanKe}`;

      mapelMeetings.push({
        mapelId: mapel.id,
        mapelCode: mapel.code,
        mapelName: mapel.name,
        pertemuanKe,
        tanggal: meetingDate.dateStr,
      });

      if (meetingDate.date <= today) {
        const virtualSesiId = `virtual-${meetingDate.jadwal.id}-${meetingDate.dateStr}`;
        const session = sesiAbsensi.find(s =>
          (s.jadwalId === meetingDate.jadwal.id &&
          s.tanggal === meetingDate.dateStr &&
          s.status === 'ditutup') || s.id === virtualSesiId
        );

        const sesiIdToCheck = session?.id || virtualSesiId;
        
        // First, try to get from sesi.dataAbsensi (absensi pelajaran) - PRIMARY SOURCE
        let attendance = null;
        if (session?.dataAbsensi) {
          const absensiPelajaran = session.dataAbsensi.find(a => a.muridId === muridId);
          if (absensiPelajaran) {
            attendance = {
              status: absensiPelajaran.status,
              muridId: absensiPelajaran.muridId,
            };
          }
        }
        
        // Fallback to Absensi collection if not found in sesi.dataAbsensi
        if (!attendance) {
          const absensiFromCollection = absensi.find(
            a => a.muridId === muridId && a.sesiId === sesiIdToCheck
          );
          if (absensiFromCollection) {
            attendance = absensiFromCollection;
          }
        }

        if (attendance) {
          switch (attendance.status) {
            case 'hadir':
              attendanceMatrix[meetingKey] = 'H';
              break;
            case 'alfa':
              attendanceMatrix[meetingKey] = 'A';
              break;
            case 'izin':
              attendanceMatrix[meetingKey] = 'I';
              break;
            case 'sakit':
              attendanceMatrix[meetingKey] = 'S';
              break;
            default:
              attendanceMatrix[meetingKey] = '-';
          }
        } else {
          attendanceMatrix[meetingKey] = '-';
        }
      } else {
        attendanceMatrix[meetingKey] = '-';
      }
    });
  });

  return {
    muridInfo: {
      name: murid.name,
      nisn: murid.nisn,
      kelas: kelas?.name || '',
      waliKelas: waliKelas?.name || '',
    },
    tahunAjaran: tahunAjaranStr,
    semester,
    mapelMeetings,
    attendanceMatrix,
  };
};

export const exportRekapAbsenMuridToExcel = async (
  rekapData: RekapAbsenMuridData
): Promise<void> => {
  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const groupedByMapel: { [mapelId: string]: MapelMeetingInfo[] } = {};
  rekapData.mapelMeetings.forEach(meeting => {
    if (!groupedByMapel[meeting.mapelId]) {
      groupedByMapel[meeting.mapelId] = [];
    }
    groupedByMapel[meeting.mapelId].push(meeting);
  });

  // Urutkan pertemuan untuk setiap mata pelajaran berdasarkan pertemuanKe
  Object.keys(groupedByMapel).forEach(mapelId => {
    groupedByMapel[mapelId].sort((a, b) => a.pertemuanKe - b.pertemuanKe);
  });

  const headers = ['No', 'Kode Mapel', 'Nama Mapel'];

  // Hitung maxPertemuan berdasarkan pertemuanKe maksimum yang sebenarnya ada
  const maxPertemuan = Math.max(
    ...Object.values(groupedByMapel).map(meetings => {
      // Ambil pertemuanKe maksimum dari meetings yang ada
      return Math.max(...meetings.map(m => m.pertemuanKe), 0);
    }),
    0
  );

  for (let i = 1; i <= maxPertemuan; i++) {
    headers.push(`${i}`);
  }

  const data: any[] = [];
  let rowNum = 1;

  Object.entries(groupedByMapel).forEach(([mapelId, meetings]) => {
    const row: any[] = [
      rowNum,
      meetings[0].mapelCode,
      meetings[0].mapelName,
    ];

    for (let i = 1; i <= maxPertemuan; i++) {
      const meeting = meetings.find(m => m.pertemuanKe === i);
      if (meeting) {
        const meetingKey = `${meeting.mapelCode}-${meeting.pertemuanKe}`;
        const status = rekapData.attendanceMatrix[meetingKey] || '-';
        row.push(status);
      } else {
        row.push('-');
      }
    }

    data.push(row);
    rowNum++;
  });

  const wsData = [
    [`REKAP ABSENSI MURID`],
    [`Nama: ${rekapData.muridInfo.name}`],
    [`NISN: ${rekapData.muridInfo.nisn}`],
    [`Kelas: ${rekapData.muridInfo.kelas}`],
    [`Wali Kelas: ${rekapData.muridInfo.waliKelas}`],
    [`Tahun Ajaran: ${rekapData.tahunAjaran}`],
    [`Semester: ${rekapData.semester === 1 ? 'Ganjil (1)' : 'Genap (2)'}`],
    [],
    headers,
    ...data,
    [],
    ['Keterangan:'],
    ['H = Hadir', 'A = Alfa', 'I = Izin', 'S = Sakit', '- = Tidak Ada Absen'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 30 },
    ...Array(maxPertemuan).fill({ wch: 5 }),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');

  XLSX.writeFile(wb, `Rekap_Absensi_${rekapData.muridInfo.name}_${rekapData.tahunAjaran}_Sem${rekapData.semester}.xlsx`);
};

export const printRekapAbsenMurid = (
  rekapData: RekapAbsenMuridData
): void => {
  const groupedByMapel: { [mapelId: string]: MapelMeetingInfo[] } = {};
  rekapData.mapelMeetings.forEach(meeting => {
    if (!groupedByMapel[meeting.mapelId]) {
      groupedByMapel[meeting.mapelId] = [];
    }
    groupedByMapel[meeting.mapelId].push(meeting);
  });

  // Urutkan pertemuan untuk setiap mata pelajaran berdasarkan pertemuanKe
  Object.keys(groupedByMapel).forEach(mapelId => {
    groupedByMapel[mapelId].sort((a, b) => a.pertemuanKe - b.pertemuanKe);
  });

  // Hitung maxPertemuan berdasarkan pertemuanKe maksimum yang sebenarnya ada
  const maxPertemuan = Math.max(
    ...Object.values(groupedByMapel).map(meetings => {
      // Ambil pertemuanKe maksimum dari meetings yang ada
      return Math.max(...meetings.map(m => m.pertemuanKe), 0);
    }),
    0
  );

  const doc = new jsPDF({
    orientation: maxPertemuan > 8 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAP ABSENSI MURID', doc.internal.pageSize.getWidth() / 2, 15, {
    align: 'center',
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama: ${rekapData.muridInfo.name}`, 14, 25);
  doc.text(`NISN: ${rekapData.muridInfo.nisn}`, 14, 30);
  doc.text(`Kelas: ${rekapData.muridInfo.kelas}`, 14, 35);
  doc.text(`Wali Kelas: ${rekapData.muridInfo.waliKelas}`, 14, 40);
  doc.text(`Tahun Ajaran: ${rekapData.tahunAjaran}`, 14, 45);
  doc.text(`Semester: ${rekapData.semester === 1 ? 'Ganjil (1)' : 'Genap (2)'}`, 14, 50);

  const headers = [
    ['No', 'Kode Mapel', 'Nama Mapel', ...Array.from({ length: maxPertemuan }, (_, i) => `${i + 1}`)],
  ];

  const data: any[] = [];
  let rowNum = 1;

  Object.entries(groupedByMapel).forEach(([mapelId, meetings]) => {
    const row = [
      rowNum.toString(),
      meetings[0].mapelCode,
      meetings[0].mapelName,
    ];

    for (let i = 1; i <= maxPertemuan; i++) {
      const meeting = meetings.find(m => m.pertemuanKe === i);
      if (meeting) {
        const meetingKey = `${meeting.mapelCode}-${meeting.pertemuanKe}`;
        const status = rekapData.attendanceMatrix[meetingKey] || '-';
        row.push(status);
      } else {
        row.push('-');
      }
    }

    data.push(row);
    rowNum++;
  });

  autoTable(doc, {
    head: headers,
    body: data,
    startY: 55,
    theme: 'grid',
    styles: {
      fontSize: maxPertemuan > 10 ? 7 : 8,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: maxPertemuan > 8 ? 20 : 25, halign: 'center' },
      2: { cellWidth: maxPertemuan > 8 ? 40 : 60, halign: 'left' },
    },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Halaman ${data.pageNumber}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 55;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Keterangan:', 14, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.text('H = Hadir', 14, finalY + 15);
  doc.text('A = Alfa', 14, finalY + 20);
  doc.text('I = Izin', 14, finalY + 25);
  doc.text('S = Sakit', 14, finalY + 30);
  doc.text('- = Tidak Ada Absen', 14, finalY + 35);

  doc.save(`Rekap_Absensi_${rekapData.muridInfo.name}_${rekapData.tahunAjaran}_Sem${rekapData.semester}.pdf`);
};
