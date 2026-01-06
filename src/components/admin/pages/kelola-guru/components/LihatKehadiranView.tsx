import React, { useState, useMemo } from 'react';
import { Download, Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText, Eye } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import Modal from '../../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User as UserType, AbsensiGuru, PengaturanAbsen, IzinGuru } from '../../../../../types';
import { exportToExcel, exportToPDF, formatDateID } from '../../../../../utils/exportUtils';
import { formatTimeDisplay } from '../../../../../utils/absensiUtils';
import { getKeteranganAbsensi, isTanggalExistsInDatabase } from '../utils/absenGuruDataHelpers';

interface LihatKehadiranViewProps {
  guru: UserType;
  absensiGuru: AbsensiGuru[];
  pengaturanAbsen: PengaturanAbsen[];
  izinGuru: IzinGuru[];
}

const LihatKehadiranView: React.FC<LihatKehadiranViewProps> = ({
  guru,
  absensiGuru,
  pengaturanAbsen,
  izinGuru
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIzin, setSelectedIzin] = useState<IzinGuru | null>(null);
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [selectedDateDetail, setSelectedDateDetail] = useState<{
    tanggal: string;
    absensi: AbsensiGuru | null;
    izin: IzinGuru | undefined;
  } | null>(null);
  const [showDateDetailModal, setShowDateDetailModal] = useState(false);
  const itemsPerPage = 10;

  const activePengaturan = pengaturanAbsen.find(p => p.isActive);

  const getGuruAbsensi = () => {
    return absensiGuru.filter(a => {
      const absenDate = new Date(a.tanggal);
      return (
        a.guruId === guru.id &&
        absenDate.getMonth() + 1 === selectedMonth &&
        absenDate.getFullYear() === selectedYear
      );
    }).sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  };

  // Format date to string manually to avoid timezone issues
  const formatDateToString = (year: number, month: number, day: number): string => {
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  // Generate all dates from start of month until today for desktop table
  const getAllDatesUntilToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dates: Array<{
      tanggal: string;
      absensi: AbsensiGuru | null;
      izin: IzinGuru | undefined;
    }> = [];

    const absensiMap = new Map<string, AbsensiGuru>();
    getGuruAbsensi().forEach(a => {
      const dateKey = a.tanggal.split('T')[0];
      absensiMap.set(dateKey, a);
    });

    // Generate dates from day 1 to last day of selected month, but only until today
    for (let day = 1; day <= daysInMonth; day++) {
      // Use manual formatting to avoid timezone issues
      const dateStr = formatDateToString(selectedYear, selectedMonth, day);
      
      // Create date object to compare with today
      const dateObj = new Date(selectedYear, selectedMonth - 1, day);
      dateObj.setHours(0, 0, 0, 0);
      
      // Only include dates up to today
      if (dateObj > today) break;
      
      const absensi = absensiMap.get(dateStr) || null;
      // Always check for izin, regardless of absensi
      const izin = getGuruIzinForDate(dateStr);
      
      dates.push({ tanggal: dateStr, absensi, izin });
    }

    return dates.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  };

  const getGuruIzinForDate = (tanggal: string) => {
    return izinGuru.find(i =>
      i.guruId === guru.id &&
      i.status === 'diterima' &&
      i.tanggalMulai <= tanggal &&
      i.tanggalSelesai >= tanggal
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tepat_waktu':
        return <Badge variant="success">Tepat Waktu</Badge>;
      case 'terlambat':
        return <Badge variant="warning">Terlambat</Badge>;
      case 'pulang_awal':
        return <Badge variant="warning">Pulang Awal</Badge>;
      case 'tidak_masuk':
        return <Badge variant="danger">Tidak Masuk</Badge>;
      case 'tidak_keluar':
        return <Badge variant="danger">Tidak Keluar</Badge>;
      case 'izin':
        return <Badge variant="info">Izin</Badge>;
      case 'sakit':
        return <Badge variant="secondary">Sakit</Badge>;
      case 'alfa':
        return <Badge variant="danger">Alfa</Badge>;
      default:
        return <Badge variant="default">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  const getKeteranganText = (absensi: AbsensiGuru | null, izin: IzinGuru | undefined, tanggal: string): string => {
    // Cek apakah tanggal ada di database
    const tanggalExists = isTanggalExistsInDatabase(absensiGuru, tanggal);
    return getKeteranganAbsensi(absensi || undefined, izin, tanggalExists);
  };

  const allDatesData = getAllDatesUntilToday(); // For desktop table
  const totalPages = Math.ceil(allDatesData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = allDatesData.slice(startIndex, endIndex);

  // Hitung statistik berdasarkan semua tanggal dengan menggunakan getKeteranganText
  const stats = useMemo(() => {
    let total = 0;
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let tidakHadir = 0;

    allDatesData.forEach((dateData) => {
      // Cek apakah tanggal ada di database
      const tanggalExists = isTanggalExistsInDatabase(absensiGuru, dateData.tanggal);
      const keterangan = getKeteranganAbsensi(dateData.absensi || undefined, dateData.izin, tanggalExists);
      
      // Skip tanggal yang tidak ada di database (keterangan === '-')
      if (keterangan === '-') {
        return;
      }

      total++;
      
      if (keterangan === 'Hadir') {
        hadir++;
        // Cek apakah terlambat (jika ada absensi dengan statusMasuk 'terlambat')
        if (dateData.absensi?.statusMasuk === 'terlambat') {
          terlambat++;
        }
      } else if (keterangan === 'Izin') {
        izin++;
      } else {
        // Alfa, Bolos, Dispen, Sakit dihitung sebagai tidak hadir
        tidakHadir++;
      }
    });

    return {
      total,
      hadir,
      terlambat,
      izin,
      tidakHadir
    };
  }, [allDatesData, absensiGuru, izinGuru]);

  const getStatusMasukLabel = (izin: IzinGuru | undefined, absensi: AbsensiGuru | null): string => {
    // Masuk tetap sesuai absen meskipun ada izin/sakit
    return absensi?.statusMasuk || (izin ? (izin.jenis === 'sakit' ? 'sakit' : 'izin') : '-');
  };
  const getStatusKeluarLabel = (izin: IzinGuru | undefined, absensi: AbsensiGuru | null): string => {
    // Keluar menjadi izin/sakit jika ada izin aktif
    if (izin) return izin.jenis === 'sakit' ? 'sakit' : 'izin';
    return absensi?.statusKeluar || '-';
  };

  const exportData = () => {
    const data = allDatesData.map((dateData, idx) => {
      const date = new Date(dateData.tanggal);
      const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
      const absensi = dateData.absensi;
      const izin = dateData.izin;

      const jamMasuk = izin ? '-' : (absensi?.jamMasuk ? formatTimeDisplay(absensi.jamMasuk) : '-');
      const jamKeluar = izin ? '-' : (absensi?.jamKeluar ? formatTimeDisplay(absensi.jamKeluar) : '-');
      const statusMasuk = getStatusMasukLabel(izin, absensi || null);
      const statusKeluar = getStatusKeluarLabel(izin, absensi || null);
      const keterangan = getKeteranganText(absensi || null, izin, dateData.tanggal);

      return {
        no: idx + 1,
        hari,
        tanggal: formatDateID(dateData.tanggal),
        jamMasuk,
        statusMasuk,
        jamKeluar,
        statusKeluar,
        keterangan
      };
    });

    const columns = [
      { header: 'No', dataKey: 'no', width: 10 },
      { header: 'Hari', dataKey: 'hari', width: 15 },
      { header: 'Tanggal', dataKey: 'tanggal', width: 20 },
      { header: 'Jam Masuk', dataKey: 'jamMasuk', width: 15 },
      { header: 'Status Masuk', dataKey: 'statusMasuk', width: 15 },
      { header: 'Jam Keluar', dataKey: 'jamKeluar', width: 15 },
      { header: 'Status Keluar', dataKey: 'statusKeluar', width: 15 },
      { header: 'Keterangan', dataKey: 'keterangan', width: 20 }
    ];

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const title = `LAPORAN KEHADIRAN GURU\nNama: ${guru.name}\nNIP: ${(guru as any).nip || '-'}\nBulan: ${monthNames[selectedMonth - 1]} ${selectedYear}`;
    const filename = `kehadiran-${guru.name.replace(/\s/g, '-')}-${selectedYear}-${selectedMonth}`;

    exportToExcel(data, columns, title, filename);
  };

  const exportDataPDF = () => {
    const data = allDatesData.map((dateData, idx) => {
      const date = new Date(dateData.tanggal);
      const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
      const absensi = dateData.absensi;
      const izin = dateData.izin;

      const jamMasuk = izin ? '-' : (absensi?.jamMasuk ? formatTimeDisplay(absensi.jamMasuk) : '-');
      const jamKeluar = izin ? '-' : (absensi?.jamKeluar ? formatTimeDisplay(absensi.jamKeluar) : '-');
      const statusMasuk = getStatusMasukLabel(izin, absensi || null);
      const statusKeluar = getStatusKeluarLabel(izin, absensi || null);
      const keterangan = getKeteranganText(absensi || null, izin, dateData.tanggal);

      return {
        no: idx + 1,
        hari,
        tanggal: formatDateID(dateData.tanggal),
        jamMasuk,
        statusMasuk,
        jamKeluar,
        statusKeluar,
        keterangan
      };
    });

    const columns = [
      { header: 'No', dataKey: 'no', width: 10 },
      { header: 'Hari', dataKey: 'hari', width: 20 },
      { header: 'Tanggal', dataKey: 'tanggal', width: 25 },
      { header: 'Jam Masuk', dataKey: 'jamMasuk', width: 20 },
      { header: 'Status Masuk', dataKey: 'statusMasuk', width: 25 },
      { header: 'Jam Keluar', dataKey: 'jamKeluar', width: 20 },
      { header: 'Status Keluar', dataKey: 'statusKeluar', width: 25 },
      { header: 'Keterangan', dataKey: 'keterangan', width: 25 }
    ];

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const title = `LAPORAN KEHADIRAN GURU\nNama: ${guru.name}\nNIP: ${(guru as any).nip || '-'}\nBulan: ${monthNames[selectedMonth - 1]} ${selectedYear}`;
    const filename = `kehadiran-${guru.name.replace(/\s/g, '-')}-${selectedYear}-${selectedMonth}`;

    exportToPDF(data, columns, title, filename);
  };

  const getDayFromDate = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.getDate();
  };

  const getStatusShorthand = (absensi: AbsensiGuru | null, izin: IzinGuru | undefined, tanggal?: string): string => {
    // For future dates, always return '-'
    if (tanggal) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const date = new Date(tanggal);
      date.setHours(0, 0, 0, 0);
      if (date > today) {
        return '-';
      }
    }

    if (!tanggal) {
      return '-';
    }

    const ket = getKeteranganText(absensi, izin, tanggal);
    if (ket === 'Hadir') return 'H';
    if (ket === 'Dispen') return 'D';
    if (ket === 'Bolos' || ket === 'Bolos Kerja') return 'B';
    if (ket === 'Izin') return 'I';
    if (ket === 'Sakit') return 'S';
    if (ket === 'Alfa') return 'A';
    return '-';
  };

  const getStatusColor = (shorthand: string): string => {
    switch (shorthand) {
      case 'H': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'S': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'I': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'A': return 'bg-red-100 text-red-700 border-red-300';
      case 'B': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'D': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDayAbsensi = (dayNum: number) => {
    // Use manual formatting to avoid timezone issues
    const dateStr = formatDateToString(selectedYear, selectedMonth, dayNum);
    // Always check for absensi using the date string directly
    const absensi = absensiGuru.find(a => 
      a.guruId === guru.id && 
      a.tanggal.split('T')[0] === dateStr
    ) || null;
    // Always check for izin, regardless of absensi
    const izin = getGuruIzinForDate(dateStr);
    return { absensi, izin };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-50 border-l-4 border-l-blue-500">
  <div className="flex flex-row items-center gap-3 sm:gap-4">
    
    {/* Avatar Inisial */}
    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full 
                    flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
      {guru.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
    </div>

    {/* Data Guru di Kanan */}
    <div className="flex flex-col flex-1">
      <h3 className="text-base sm:text-2xl font-bold text-gray-900">{guru.name}</h3>
      <p className="text-xs sm:text-sm text-blue-600 font-medium">NIP: {guru.nip}</p>
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">{guru.email}</p>
    </div>

  </div>
</Card>

      <Card className="p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1">Data Kehadiran</h3>
            <p className="text-xs sm:text-sm text-gray-600">Riwayat kehadiran masuk dan keluar guru</p>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Bulan:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Tahun:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            
            
              <Button onClick={exportData} variant="success" className="flex items-center justify-center text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                <Download size={14} className="mr-1 sm:mr-2" />
                <span>Excel</span>
              </Button>
              <Button onClick={exportDataPDF} variant="secondary" className="flex items-center justify-center text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                <Download size={14} className="mr-1 sm:mr-2" />
                <span>PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {activePengaturan && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-900">
              <strong>Jam Kerja:</strong> {activePengaturan.jamMasuk} - {activePengaturan.jamPulang}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="p-2 sm:p-4 text-center border-l-4 border-l-blue-500">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600">Total Hari</p>
          </Card>
          <Card className="p-2 sm:p-4 text-center border-l-4 border-l-emerald-500">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.hadir}</p>
            <p className="text-xs text-gray-600">Hadir</p>
          </Card>
          <Card className="p-2 sm:p-4 text-center border-l-4 border-l-orange-500">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.terlambat}</p>
            <p className="text-xs text-gray-600">Terlambat</p>
          </Card>
          <Card className="p-2 sm:p-4 text-center border-l-4 border-l-blue-400">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.izin}</p>
            <p className="text-xs text-gray-600">Izin</p>
          </Card>
          <Card className="p-2 sm:p-4 text-center border-l-4 border-l-red-500 col-span-2 md:col-span-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.tidakHadir}</p>
            <p className="text-xs text-gray-600">Tidak Hadir</p>
          </Card>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>No</TableCell>
                <TableCell header>Hari</TableCell>
                <TableCell header>Tanggal</TableCell>
                <TableCell header>Jam Masuk</TableCell>
                <TableCell header>Status Masuk</TableCell>
                <TableCell header>Jam Keluar</TableCell>
                <TableCell header>Status Keluar</TableCell>
                <TableCell header>Keterangan</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((dateData, idx) => {
                const date = new Date(dateData.tanggal);
                const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
                const absensi = dateData.absensi;
                const izin = dateData.izin;

                return (
                  <TableRow key={dateData.tanggal || idx} className="hover:bg-gray-50">
                    <TableCell>{startIndex + idx + 1}</TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900">{hari}</span>
                    </TableCell>
                    <TableCell>
                      {formatDateID(dateData.tanggal)}
                    </TableCell>
                    <TableCell>
                      {absensi?.jamMasuk ? (
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="font-mono text-sm font-medium">{formatTimeDisplay(absensi.jamMasuk)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {absensi?.statusMasuk ? (
                        getStatusBadge(absensi.statusMasuk)
                      ) : (
                        <Badge variant="danger">Tidak Masuk</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {absensi?.jamKeluar ? (
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="font-mono text-sm font-medium">{formatTimeDisplay(absensi.jamKeluar)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {izin ? (
                        getStatusBadge(izin.jenis === 'sakit' ? 'sakit' : 'izin')
                      ) : absensi?.statusKeluar ? (
                        getStatusBadge(absensi.statusKeluar)
                      ) : absensi?.jamMasuk ? (
                        <Badge variant="danger">Belum Keluar</Badge>
                      ) : (
                        <Badge variant="default">-</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          (() => {
                            const ket = getKeteranganText(absensi, izin, dateData.tanggal);
                            if (ket === 'Hadir') return 'success';
                            if (ket === 'Dispen') return 'info';
                            if (ket === 'Bolos' || ket === 'Bolos Kerja' || ket === 'Alfa' || ket === 'Tidak Hadir') return 'danger';
                            if (ket === 'Izin') return 'info';
                            if (ket === 'Sakit') return 'secondary';
                            return 'default';
                          })()
                        }>
                          {getKeteranganText(absensi, izin, dateData.tanggal)}
                        </Badge>
                        {izin && (izin.jenis === 'izin' || izin.jenis === 'sakit') && (
                          <Button
                            onClick={() => {
                              setSelectedIzin(izin);
                              setShowIzinModal(true);
                            }}
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Eye size={14} />
                            Lihat
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Calendar View */}
        <div className="md:hidden">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Keterangan Status:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded border border-emerald-300 bg-emerald-100"></div>
                <span className="text-xs text-gray-700"><span className="font-semibold">H</span> = Hadir</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded border border-orange-300 bg-orange-100"></div>
                <span className="text-xs text-gray-700"><span className="font-semibold">S</span> = Sakit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded border border-blue-300 bg-blue-100"></div>
                <span className="text-xs text-gray-700"><span className="font-semibold">I</span> = Izin</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded border border-red-300 bg-red-100"></div>
                <span className="text-xs text-gray-700"><span className="font-semibold">A</span> = Alfa</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded border border-yellow-300 bg-yellow-100"></div>
                <span className="text-xs text-gray-700"><span className="font-semibold">B</span> = Bolos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded border border-purple-300 bg-purple-100"></div>
                <span className="text-xs text-gray-700"><span className="font-semibold">D</span> = Dispen</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-0 bg-gray-100 border-b border-gray-200">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, idx) => {
                const isWeekend = idx === 0 || idx === 6;
                return (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center border-r border-gray-200 last:border-r-0 ${
                      isWeekend ? 'bg-blue-50' : 'bg-gray-100'
                    }`}
                  >
                    <p className={`text-xs font-bold ${isWeekend ? 'text-blue-700' : 'text-gray-700'}`}>
                      {day}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0">
              {getCalendarDays().map((day, idx) => {
                if (!day) {
                  const isWeekendColumn = idx % 7 === 0 || idx % 7 === 6;
                  return (
                    <div
                      key={`empty-${idx}`}
                      className={`aspect-square border-r border-b border-gray-200 last:border-r-0 ${
                        isWeekendColumn ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    ></div>
                  );
                }

                // Use manual formatting to avoid timezone issues
                const dateStr = formatDateToString(selectedYear, selectedMonth, day);
                const { absensi, izin } = getDayAbsensi(day);
                const status = getStatusShorthand(absensi || null, izin, dateStr);
                const statusColor = getStatusColor(status);
                const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={day}
                    className={`aspect-square border-r border-b border-gray-200 last:border-r-0 hover:shadow-md transition-all cursor-pointer p-1 flex flex-col items-center justify-center relative ${
                      isWeekend ? 'bg-blue-50' : 'bg-white'
                    }`}
                    onClick={() => {
                      // Show detail modal when date is clicked
                      setSelectedDateDetail({ tanggal: dateStr, absensi, izin });
                      setShowDateDetailModal(true);
                    }}
                  >
                    <p className={`text-xs font-medium mb-0.5 ${isWeekend ? 'text-blue-700' : 'text-gray-600'}`}>
                      {day}
                    </p>
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded border flex items-center justify-center ${statusColor}`}>
                      <span className="text-xs sm:text-sm font-bold">{status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {allDatesData.length === 0 && (
          <div className="hidden md:block text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data</h3>
            <p className="text-gray-600">Belum ada data kehadiran untuk periode ini</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 order-2 sm:order-1">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, allDatesData.length)} dari {allDatesData.length} data
            </p>
            <div className="flex items-center justify-center sm:justify-end gap-2 order-1 sm:order-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
                className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
              >
                Prev
              </Button>
              <span className="text-xs md:text-sm text-gray-600 px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
                className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Detail Absensi per Tanggal (Mobile) */}
      {showDateDetailModal && selectedDateDetail && (
        <Modal
          isOpen={showDateDetailModal}
          onClose={() => {
            setShowDateDetailModal(false);
            setSelectedDateDetail(null);
          }}
          title={`Detail Absensi`}
        >
          <div className="space-y-5">
            {/* Header - Tanggal */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">Tanggal</p>
                  <p className="text-base font-bold text-gray-900">
                    {formatDateID(selectedDateDetail.tanggal)}
                  </p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    {new Date(selectedDateDetail.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })}
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </div>

            {/* Informasi Masuk */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-gray-500" />
                Informasi Masuk
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Jam Masuk</label>
                  {selectedDateDetail.absensi?.jamMasuk ? (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="font-mono text-base font-semibold text-gray-900">
                        {formatTimeDisplay(selectedDateDetail.absensi.jamMasuk)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 font-medium">-</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Status Masuk</label>
                  <div>
                    {selectedDateDetail.absensi?.statusMasuk ? (
                      getStatusBadge(selectedDateDetail.absensi.statusMasuk)
                    ) : (
                      <Badge variant="danger">Tidak Masuk</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Keluar */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <XCircle size={16} className="text-gray-500" />
                Informasi Keluar
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Jam Keluar</label>
                  {selectedDateDetail.absensi?.jamKeluar ? (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="font-mono text-base font-semibold text-gray-900">
                        {formatTimeDisplay(selectedDateDetail.absensi.jamKeluar)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 font-medium">-</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Status Keluar</label>
                  <div>
                    {selectedDateDetail.izin ? (
                      getStatusBadge(selectedDateDetail.izin.jenis === 'sakit' ? 'sakit' : 'izin')
                    ) : selectedDateDetail.absensi?.statusKeluar ? (
                      getStatusBadge(selectedDateDetail.absensi.statusKeluar)
                    ) : selectedDateDetail.absensi?.jamMasuk ? (
                      <Badge variant="danger">Belum Keluar</Badge>
                    ) : (
                      <Badge variant="default">-</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Keterangan */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-xs text-gray-500 mb-2 font-medium">Keterangan</label>
              <div>
                <Badge variant={
                  (() => {
                    const ket = getKeteranganText(selectedDateDetail.absensi, selectedDateDetail.izin, selectedDateDetail.tanggal);
                    if (ket === 'Hadir') return 'success';
                    if (ket === 'Dispen') return 'info';
                    if (ket === 'Bolos' || ket === 'Bolos Kerja' || ket === 'Alfa' || ket === 'Tidak Hadir') return 'danger';
                    if (ket === 'Izin') return 'info';
                    if (ket === 'Sakit') return 'secondary';
                    return 'default';
                  })()
                }>
                  {getKeteranganText(selectedDateDetail.absensi, selectedDateDetail.izin, selectedDateDetail.tanggal)}
                </Badge>
              </div>
            </div>

            {/* Tombol Lihat Detail Izin/Sakit */}
            {selectedDateDetail.izin && (selectedDateDetail.izin.jenis === 'izin' || selectedDateDetail.izin.jenis === 'sakit') && (
              <div className="pt-2">
                <Button
                  onClick={() => {
                    setShowDateDetailModal(false);
                    setSelectedIzin(selectedDateDetail.izin!);
                    setShowIzinModal(true);
                  }}
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2 py-2.5"
                >
                  <Eye size={18} />
                  <span>Lihat Detail Izin/Sakit</span>
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showIzinModal && selectedIzin && (
        <Modal
          isOpen={showIzinModal}
          onClose={() => {
            setShowIzinModal(false);
            setSelectedIzin(null);
          }}
          title={`Detail ${selectedIzin.jenis === 'izin' ? 'Izin' : 'Sakit'}`}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Jenis</label>
              <p className="mt-1 text-gray-900 capitalize">
                {selectedIzin.jenis === 'izin' ? 'Izin' : selectedIzin.jenis === 'sakit' ? 'Sakit' : selectedIzin.jenis}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Alasan</label>
              <p className="mt-1 text-gray-900">{selectedIzin.alasan}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                <p className="mt-1 text-gray-900">{formatDateID(selectedIzin.tanggalMulai)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tanggal Selesai</label>
                <p className="mt-1 text-gray-900">{formatDateID(selectedIzin.tanggalSelesai)}</p>
              </div>
            </div>
            {selectedIzin.jamMulai && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Jam Mulai</label>
                  <p className="mt-1 text-gray-900">{selectedIzin.jamMulai}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Jam Selesai</label>
                  <p className="mt-1 text-gray-900">{selectedIzin.jamSelesai || '-'}</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <Badge variant={selectedIzin.status === 'diterima' ? 'success' : selectedIzin.status === 'menunggu' ? 'warning' : 'danger'}>
                  {selectedIzin.status === 'diterima' ? 'Diterima' : selectedIzin.status === 'menunggu' ? 'Menunggu' : 'Ditolak'}
                </Badge>
              </div>
            </div>
            {selectedIzin.keterangan && (
              <div>
                <label className="text-sm font-medium text-gray-700">Keterangan</label>
                <p className="mt-1 text-gray-900">{selectedIzin.keterangan}</p>
              </div>
            )}
            {selectedIzin.bukti && (
              <div>
                <label className="text-sm font-medium text-gray-700">Bukti</label>
                <div className="mt-2">
                  <img
                    src={selectedIzin.bukti}
                    alt="Bukti"
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LihatKehadiranView;
