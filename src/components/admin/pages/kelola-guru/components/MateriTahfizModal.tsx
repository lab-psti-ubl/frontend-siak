import React, { useState, useMemo } from 'react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Eye, Download, X, FileText, BookOpen, Calendar, Clock } from 'lucide-react';
import { SesiAbsensiTahfiz, TahfizSchedule } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import { useJurnalTahfiz } from '../../../../../hooks/useJurnalTahfiz';
import { showSuccessToast, showErrorToast } from '../../../../../components/ui/ToastContainer';
import { exportToExcel, exportToPDF } from '../../../../../utils/exportUtils';

interface MateriTahfizModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJadwal: TahfizSchedule;
  kelas: TahfizClass;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  selectedYear: string;
  onViewJurnalFile: (file: any) => void;
  isAdminView?: boolean;
}

const MateriTahfizModal: React.FC<MateriTahfizModalProps> = ({
  isOpen,
  onClose,
  selectedJadwal,
  kelas,
  sesiAbsensiTahfiz,
  selectedYear,
  onViewJurnalFile,
  isAdminView = false
}) => {
  const [selectedMateri, setSelectedMateri] = useState<{ jurnal: any; tanggal: string; jadwalId: string } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Fetch jurnal tahfiz for this jadwal
  const { jurnalTahfiz } = useJurnalTahfiz({ 
    jadwalId: selectedJadwal.id,
    kelasId: kelas.id,
    tahun: selectedYear
  });

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

  // Generate all meetings for this jadwal
  const generateAllMeetings = () => {
    const meetings: Array<{
      pertemuanKe: number;
      tanggal: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      jadwalId: string;
      sesi?: SesiAbsensiTahfiz;
      jurnal?: any;
      hasMateri: boolean;
    }> = [];

    const startDate = new Date(`${selectedYear}-01-01`);
    const endDate = new Date(`${selectedYear}-12-31`);
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const actualEndDate = endDate < today ? endDate : today;

    const targetDay = hariToDay[selectedJadwal.hari];
    let currentDate = new Date(startDate);

    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let pertemuanCounter = 1;
    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const session = sesiAbsensiTahfiz.find(s =>
        s.jadwalId === selectedJadwal.id &&
        s.tanggal === dateStr &&
        s.tahun === selectedYear &&
        s.status === 'ditutup'
      );

      // Get jurnal tahfiz pertemuan for this date
      const jurnalDoc = jurnalTahfiz.find(j => j.jadwalId === selectedJadwal.id && j.kelasId === kelas.id);
      const pertemuan = jurnalDoc?.pertemuan?.find(p => p.tanggal === dateStr);
      const jurnal = pertemuan ? {
        judul: pertemuan.judul,
        deskripsi: pertemuan.deskripsi,
        waktuInput: pertemuan.waktuInput,
        file: pertemuan.file
      } : undefined;

      meetings.push({
        pertemuanKe: pertemuanCounter,
        tanggal: dateStr,
        hari: hariNames[selectedJadwal.hari],
        jamMulai: selectedJadwal.jamMulai,
        jamSelesai: selectedJadwal.jamSelesai,
        jadwalId: selectedJadwal.id,
        sesi: session,
        jurnal: jurnal,
        hasMateri: !!jurnal,
      });

      pertemuanCounter++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return meetings;
  };

  const sesiWithMateri = generateAllMeetings();

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleViewDetail = (meeting: typeof sesiWithMateri[0]) => {
    if (!meeting.jurnal) return;
    setSelectedMateri({
      jurnal: meeting.jurnal,
      tanggal: meeting.tanggal,
      jadwalId: meeting.jadwalId
    });
    setIsDetailOpen(true);
  };

  const handleDownload = (jurnal: any) => {
    if (!jurnal.file) return;

    const link = document.createElement('a');
    link.href = jurnal.file.data;
    link.download = jurnal.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (type: string | undefined) => {
    if (!type) return '📎';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📈';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    return '📎';
  };

  const handleExportMateriToExcel = () => {
    try {
      const exportData = sesiWithMateri.map((meeting, index) => ({
        nomor: index + 1,
        pertemuan: `Pertemuan ${meeting.pertemuanKe}`,
        tanggal: formatTanggal(meeting.tanggal),
        judulMateri: meeting.jurnal?.judul || '-',
        deskripsi: meeting.jurnal?.deskripsi || '-'
      }));

      const columns = [
        { header: 'No', dataKey: 'nomor', width: 8 },
        { header: 'Pertemuan', dataKey: 'pertemuan', width: 15 },
        { header: 'Tanggal', dataKey: 'tanggal', width: 20 },
        { header: 'Judul Materi', dataKey: 'judulMateri', width: 30 },
        { header: 'Deskripsi', dataKey: 'deskripsi', width: 40 }
      ];

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Materi_Tahfiz_${kelas.namaKelas}_${timestamp}`;

      exportToExcel(exportData, columns, `Daftar Materi Tahfiz - ${kelas.namaKelas}`, filename);
      showSuccessToast('Berhasil', `Data materi berhasil diexport ke Excel`);
    } catch (error) {
      showErrorToast('Gagal', 'Gagal mengexport data ke Excel');
      console.error('Export Excel error:', error);
    }
  };

  const handleExportMateriToPDF = () => {
    try {
      const exportData = sesiWithMateri.map((meeting, index) => ({
        nomor: index + 1,
        pertemuan: `Pertemuan ${meeting.pertemuanKe}`,
        tanggal: formatTanggal(meeting.tanggal),
        judulMateri: meeting.jurnal?.judul || '-',
        deskripsi: meeting.jurnal?.deskripsi || '-'
      }));

      const columns = [
        { header: 'No', dataKey: 'nomor', width: 8 },
        { header: 'Pertemuan', dataKey: 'pertemuan', width: 15 },
        { header: 'Tanggal', dataKey: 'tanggal', width: 20 },
        { header: 'Judul Materi', dataKey: 'judulMateri', width: 30 },
        { header: 'Deskripsi', dataKey: 'deskripsi', width: 40 }
      ];

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Materi_Tahfiz_${kelas.namaKelas}_${timestamp}`;

      exportToPDF(exportData, columns, `Daftar Materi Tahfiz - ${kelas.namaKelas}`, filename);
      showSuccessToast('Berhasil', `Data materi berhasil diexport ke PDF`);
    } catch (error) {
      showErrorToast('Gagal', 'Gagal mengexport data ke PDF');
      console.error('Export PDF error:', error);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Daftar Materi Tahfiz"
        size="2xl"
      >
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Button
              onClick={handleExportMateriToExcel}
              variant="primary"
              className="flex items-center justify-center gap-2 text-sm flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700"
            >
              <FileText size={16} />
              Export Excel
            </Button>
            <Button
              onClick={handleExportMateriToPDF}
              variant="primary"
              className="flex items-center justify-center gap-2 text-sm flex-1 sm:flex-initial bg-red-600 hover:bg-red-700"
            >
              <Download size={16} />
              Export PDF
            </Button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Tahfiz Qur'an
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white bg-opacity-50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs font-medium text-slate-600">Kelas</p>
                    <p className="text-xs sm:text-sm text-slate-900 font-semibold mt-1">{kelas.namaKelas}</p>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs font-medium text-slate-600">Jadwal</p>
                    <p className="text-xs sm:text-sm text-slate-900 font-semibold mt-1 truncate">
                      {hariNames[selectedJadwal.hari]} {selectedJadwal.jamMulai}-{selectedJadwal.jamSelesai}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs font-medium text-slate-600">Pertemuan</p>
                    <p className="text-xs sm:text-sm text-slate-900 font-semibold mt-1">{sesiWithMateri.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {sesiWithMateri.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
              <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-1 sm:mb-2">
                Belum Ada Pertemuan
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Belum ada pertemuan yang telah dilaksanakan untuk jadwal tahfiz ini.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop/Tablet Table View */}
              <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-blue-50 to-slate-50 border-b-2 border-blue-200">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Pertemuan</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tanggal</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hari</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jam</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Judul Materi</th>
                        <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {sesiWithMateri.map((meeting, index) => (
                        <tr key={`${meeting.tanggal}-${index}`} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 h-7 w-7 bg-blue-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-900">Pertemuan {meeting.pertemuanKe}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex items-center text-xs sm:text-sm text-slate-700 gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatTanggal(meeting.tanggal)}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-700">{meeting.hari}</td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex items-center text-xs sm:text-sm text-slate-700 gap-1 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {meeting.jamMulai} - {meeting.jamSelesai}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            {meeting.sesi ? (
                              <Badge variant="success" size="sm">Mengajar</Badge>
                            ) : (
                              <Badge variant="secondary" size="sm">Tidak Mengajar</Badge>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm max-w-xs">
                            {meeting.jurnal ? (
                              <>
                                <p className="font-medium truncate text-slate-900">
                                  {meeting.jurnal.judul}
                                </p>
                                {meeting.jurnal.file && (
                                  <div className="flex items-center mt-1 gap-1">
                                    <span className="text-xs">{getFileIcon(meeting.jurnal.file.type)}</span>
                                    <span className="text-xs text-slate-500 truncate">{meeting.jurnal.file.name}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-slate-400 italic font-medium">-</p>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {meeting.jurnal ? (
                                <Button size="sm" variant="secondary" onClick={() => handleViewDetail(meeting)} className="text-xs px-2 py-1 flex items-center">
                                  <Eye size={12} className="mr-2" />
                                  Lihat
                                </Button>
                              ) : (
                                <Badge variant="secondary" size="sm">Belum</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {sesiWithMateri.map((meeting, index) => (
                  <div key={`${meeting.tanggal}-${index}`} className="bg-white rounded-lg border border-slate-200 p-3 space-y-3 hover:shadow-md transition-shadow duration-150">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-600">Pertemuan {meeting.pertemuanKe}</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">{meeting.jurnal?.judul || 'Jurnal Belum Ada'}</p>
                        </div>
                      </div>
                      <Badge variant="info" size="sm" className="flex-shrink-0 whitespace-nowrap">P{meeting.pertemuanKe}</Badge>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatTanggal(meeting.tanggal)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{meeting.hari} • {meeting.jamMulai} - {meeting.jamSelesai}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {meeting.sesi ? (
                        <Badge variant="success" size="sm" className="flex-1">Guru Mengajar</Badge>
                      ) : (
                        <Badge variant="secondary" size="sm" className="flex-1">Guru Tidak Mengajar</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      {meeting.jurnal ? (
                        <Button size="sm" variant="secondary" onClick={() => handleViewDetail(meeting)} className="text-xs flex-1 flex items-center justify-center">
                          <Eye size={12} className="mr-1" />
                          Lihat
                        </Button>
                      ) : (
                        <Badge variant="secondary" size="sm" className="w-full text-center">Belum Ada Materi</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose} className="flex items-center justify-center">
              <X size={16} className="mr-1" />
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {selectedMateri && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedMateri(null);
          }}
          title="Detail Materi Tahfiz"
          size="lg"
        >
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 truncate">
                      {selectedMateri.jurnal.judul}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">Tahfiz Qur'an</p>
                  </div>
                </div>
                <Badge variant="info" className="ml-3 whitespace-nowrap">
                  {formatTanggal(selectedMateri.tanggal)}
                </Badge>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-600" />
                Deskripsi Materi
              </h5>
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200">
                {selectedMateri.jurnal.deskripsi}
              </div>
            </div>

            {selectedMateri.jurnal.file && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Download className="w-4 h-4 mr-2 text-gray-600" />
                  File Materi
                </h5>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                        <span className="text-2xl">
                          {getFileIcon(selectedMateri.jurnal.file.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {selectedMateri.jurnal.file.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatFileSize(selectedMateri.jurnal.file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleDownload(selectedMateri.jurnal)}
                      className="ml-3 whitespace-nowrap flex items-center justify-center"
                    >
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                {selectedMateri.jurnal.file.type === 'application/pdf' && (
                  <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
                    <iframe
                      src={selectedMateri.jurnal.file.data}
                      className="w-full h-96"
                      title="Preview PDF"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              {selectedMateri.jurnal.file && (
                <Button
                  variant="primary"
                  onClick={() => handleDownload(selectedMateri.jurnal)}
                  className="flex items-center justify-center"
                >
                  <Download size={16} className="mr-1" />
                  Download Materi
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedMateri(null);
                }}
                className="flex items-center justify-center"
              >
                <X size={16} className="mr-1" />
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default MateriTahfizModal;

