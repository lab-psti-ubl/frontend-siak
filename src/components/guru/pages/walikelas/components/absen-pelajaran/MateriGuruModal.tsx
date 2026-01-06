import React, { useState, useMemo } from 'react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Eye, Download, X, FileText, BookOpen, Calendar, Clock } from 'lucide-react';
import { SesiAbsensi, JadwalPelajaran, MataPelajaran, TahunAjaran, JurnalMengajar } from '../../../../../../types';
import { useTahunAjaran } from '../../../../../../hooks/useTahunAjaran';
import { useJurnal, Jurnal } from '../../../../../../hooks/useJurnal';

interface MateriGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchedules: JadwalPelajaran[];
  mataPelajaran: MataPelajaran | undefined;
  guruName: string;
  sesiAbsensi: SesiAbsensi[];
  onUpdateJurnal: (jadwalId: string, kelasId: string, tanggal: string, jurnal: JurnalMengajar) => Promise<void>;
  isWaliKelasView?: boolean;
}

const MateriGuruModal: React.FC<MateriGuruModalProps> = ({
  isOpen,
  onClose,
  selectedSchedules,
  mataPelajaran,
  guruName,
  sesiAbsensi,
  onUpdateJurnal: _onUpdateJurnal,
  isWaliKelasView: _isWaliKelasView = false
}) => {
  const { tahunAjaran: allTahunAjaran } = useTahunAjaran();
  const [selectedMateri, setSelectedMateri] = useState<{ jurnal: Jurnal; tanggal: string; jadwalId: string } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran | null>(null);

  // Fetch all jurnal for the selected schedules
  const jadwalIds = selectedSchedules.map(s => s.id);
  const { jurnal: allJurnal } = useJurnal();

  React.useEffect(() => {
    if (selectedSchedules.length > 0) {
      const currentTahunAjaran = allTahunAjaran.find(
        (ta: TahunAjaran) =>
          ta.tahun === selectedSchedules[0].tahunAjaran &&
          ta.semester === selectedSchedules[0].semester
      );
      setTahunAjaran(currentTahunAjaran || null);
    }
  }, [isOpen, selectedSchedules, allTahunAjaran]);

  const closedSessions = sesiAbsensi
    .filter(sesi => jadwalIds.includes(sesi.jadwalId) && sesi.status === 'ditutup')
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  // Get jurnal for selected schedules
  const jurnalMap = useMemo(() => {
    const map = new Map<string, Jurnal>();
    allJurnal.forEach(j => {
      if (jadwalIds.includes(j.jadwalId)) {
        // Check if jurnal has pertemuan array (new structure)
        if (j.pertemuan && Array.isArray(j.pertemuan)) {
          // Add each pertemuan to the map
          j.pertemuan.forEach((pertemuan: any) => {
            const key = `${j.jadwalId}-${pertemuan.tanggal}`;
            map.set(key, {
              id: j.id,
              jadwalId: j.jadwalId,
              kelasId: j.kelasId,
              tanggal: pertemuan.tanggal,
              judul: pertemuan.judul,
              deskripsi: pertemuan.deskripsi,
              waktuInput: pertemuan.waktuInput,
              file: pertemuan.file,
              tahunAjaranId: j.tahunAjaranId,
              semester: j.semester,
              createdAt: j.createdAt,
              updatedAt: j.updatedAt,
            });
          });
        } else if (j.tanggal) {
          // Old structure (backward compatibility)
          const key = `${j.jadwalId}-${j.tanggal}`;
          map.set(key, j);
        }
      }
    });
    return map;
  }, [allJurnal, jadwalIds]);

  const generateAllMeetings = () => {
    if (!tahunAjaran || selectedSchedules.length === 0) return [];

    const meetings: Array<{
      pertemuanKe: number;
      tanggal: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      jadwalId: string;
      kelasId: string;
      sesi?: SesiAbsensi;
      jurnal?: Jurnal;
      hasMateri: boolean;
      isVirtual: boolean;
    }> = [];

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

    const startDate = new Date(tahunAjaran.tanggalMulai);
    const endDate = new Date(tahunAjaran.tanggalSelesai);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const actualEndDate = endDate < today ? endDate : today;

    selectedSchedules.forEach(schedule => {
      const targetDay = hariToDay[schedule.hari];
      let currentDate = new Date(startDate);

      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      let pertemuanCounter = 1;
      while (currentDate <= actualEndDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        const session = closedSessions.find(s =>
          s.jadwalId === schedule.id &&
          s.tanggal === dateStr
        );

        const isVirtual = session ? session.id.startsWith('virtual-') : false;
        
        // Get jurnal from jurnal collection
        const jurnalKey = `${schedule.id}-${dateStr}`;
        const jurnal = jurnalMap.get(jurnalKey);

        meetings.push({
          pertemuanKe: pertemuanCounter,
          tanggal: dateStr,
          hari: hariNames[schedule.hari],
          jamMulai: schedule.jamMulai,
          jamSelesai: schedule.jamSelesai,
          jadwalId: schedule.id,
          kelasId: schedule.kelasId,
          sesi: session,
          jurnal: jurnal,
          hasMateri: !!jurnal,
          isVirtual: isVirtual,
        });

        pertemuanCounter++;
        currentDate.setDate(currentDate.getDate() + 7);
      }
    });

    return meetings.sort((a, b) =>
      new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
  };

  const sesiWithMateri = generateAllMeetings();

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
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

  const handleDownload = (jurnal: Jurnal) => {
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

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📈';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    return '📎';
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Daftar Materi Pembelajaran"
        size="xl"
      >
        <div className="space-y-5 lg:space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {mataPelajaran?.name || 'Mata Pelajaran'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">Guru: {guruName}</p>
                  </div>
                </div>
                <Badge variant="info">
                  {mataPelajaran?.sks} SKS
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-blue-200">
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Kode Mapel</p>
                  <p className="text-sm font-semibold text-slate-900">{mataPelajaran?.code || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Total Pertemuan</p>
                  <p className="text-sm font-semibold text-slate-900">{sesiWithMateri.length}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-600 font-medium mb-1">Status</p>
                  <Badge variant="info">Ada Pertemuan</Badge>
                </div>
              </div>
            </div>
          </div>

          {sesiWithMateri.length === 0 ? (
            <div className="text-center py-10 sm:py-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
              <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">
                Belum Ada Pertemuan
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 px-4">
                Belum ada pertemuan yang telah dilaksanakan untuk mata pelajaran ini.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop/Tablet Table View */}
              <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Pertemuan</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tanggal</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hari</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jam</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Materi</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {sesiWithMateri.map((meeting, index) => (
                        <tr key={`${meeting.tanggal}-${index}`} className="hover:bg-slate-50 transition-colors duration-150">
                          <td className="px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900">
                            {index + 1}
                          </td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-900">
                                Pertemuan {meeting.pertemuanKe}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              {formatTanggal(meeting.tanggal)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-700">
                            {meeting.hari}
                          </td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="whitespace-nowrap">{meeting.jamMulai} - {meeting.jamSelesai}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">
                            {meeting.sesi ? (
                              meeting.isVirtual ? (
                                <Badge variant="warning">Virtual</Badge>
                              ) : (
                                <Badge variant="success">Mengajar</Badge>
                              )
                            ) : (
                              <Badge variant="secondary">Tidak Mengajar</Badge>
                            )}
                          </td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4 text-xs">
                            {meeting.jurnal ? (
                              <>
                                <p className="font-medium truncate text-slate-900">
                                  {meeting.jurnal.judul}
                                </p>
                                {meeting.jurnal.file && (
                                  <p className="text-slate-500 truncate">
                                    {getFileIcon(meeting.jurnal.file.type)} {meeting.jurnal.file.name}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-slate-400">-</p>
                            )}
                          </td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4 text-center">
                            {meeting.jurnal ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewDetail(meeting)}
                                className="text-xs px-2 py-1 flex items-center justify-center"
                              >
                                <Eye size={13} className="mr-0.5" />
                                Lihat
                              </Button>
                            ) : (
                              <Badge variant="secondary">
                                Belum Ada
                              </Badge>
                            )}
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
                  <div key={`${meeting.tanggal}-${index}`} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-500">Pertemuan {meeting.pertemuanKe}</span>
                            <p className="text-xs text-slate-500">#{index + 1}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{formatTanggal(meeting.tanggal)}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{meeting.hari}</p>
                        </div>
                      </div>

                      <div className="flex grid-cols-2 space-y-2.5 mb-3 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2 mr-10">
                          <Clock size={14} className="text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-600">Jam</p>
                            <p className="text-xs font-semibold text-slate-900">
                              {meeting.jamMulai} - {meeting.jamSelesai}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-600">Materi</p>
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {meeting.jurnal?.judul || 'Belum Ada'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {meeting.sesi ? (
                            meeting.isVirtual ? (
                              <Badge variant="warning">Virtual</Badge>
                            ) : (
                              <Badge variant="success">Mengajar</Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Tidak Mengajar</Badge>
                          )}
                        </div>
                      </div>

                      {meeting.jurnal ? (
                        <Button
                          onClick={() => handleViewDetail(meeting)}
                          variant="secondary"
                          className="w-full flex items-center justify-center text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                        >
                          <Eye size={14} className="mr-1.5" />
                          Lihat Detail
                        </Button>
                      ) : (
                        <Badge variant="secondary">
                          Belum Ada Materi
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="pb-10 sm:pb-0 flex justify-end pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={onClose} className="flex items-center justify-center text-xs sm:text-sm">
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
          title="Detail Materi Pembelajaran"
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
                    <p className="text-sm text-gray-700 mt-1">{mataPelajaran?.name}</p>
                  </div>
                </div>
                <Badge variant="info">
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
                      className="ml-3 whitespace-nowrap"
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

export default MateriGuruModal;
