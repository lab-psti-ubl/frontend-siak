import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Eye, Download, X, FileText, BookOpen, Calendar, Clock, Edit, Plus, Upload, Trash2, FileJson } from 'lucide-react';
import { SesiAbsensiTahfiz, TahfizSchedule, JurnalMengajar } from '../../../../../../types';
import { TahfizClass } from '../../../../../../hooks/useKelasTahfiz';
import { useJurnal, Jurnal } from '../../../../../../hooks/useJurnal';
import { showErrorToast, showSuccessToast } from '../../../../../../components/ui/ToastContainer';
import { apiService } from '../../../../../../services/apiService';

interface MateriTahfizModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasId: string;
  jadwalId: string;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  jadwalTahfiz: TahfizSchedule[];
  kelasTahfiz: TahfizClass[];
  selectedTahun: string;
  onUpdateJurnal: (jadwalId: string, kelasId: string, tanggal: string, jurnal: JurnalMengajar) => Promise<void>;
}

const MateriTahfizModal: React.FC<MateriTahfizModalProps> = ({
  isOpen,
  onClose,
  kelasId,
  jadwalId,
  sesiAbsensiTahfiz,
  jadwalTahfiz,
  kelasTahfiz,
  selectedTahun,
  onUpdateJurnal,
}) => {
  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
  const kelasData = kelasTahfiz.find(k => k.id === kelasId);

  // Fetch all jurnal for the selected jadwal
  const { jurnal: allJurnal, refreshJurnal } = useJurnal();

  const [selectedMateri, setSelectedMateri] = useState<{ jurnal: Jurnal; tanggal: string; jadwalId: string } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<{ jadwalId: string; kelasId: string; tanggal: string; jurnal?: Jurnal } | null>(null);

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    file: null as { name: string; type: string; data: string; size: number } | null
  });

  // Get closed sessions for this jadwal
  const closedSessions = sesiAbsensiTahfiz
    .filter(sesi => sesi.jadwalId === jadwalId && sesi.status === 'ditutup' && sesi.tahun === selectedTahun)
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  // Get jurnal for selected jadwal
  const jurnalMap = useMemo(() => {
    const map = new Map<string, Jurnal>();
    allJurnal.forEach(j => {
      if (j.jadwalId === jadwalId) {
        // Check if jurnal has pertemuan array (new structure)
        if (j.pertemuan && Array.isArray(j.pertemuan)) {
          // Add each pertemuan to the map
          j.pertemuan.forEach((pertemuan: { tanggal: string; judul: string; deskripsi: string; waktuInput: string; file?: { name: string; type: string; data: string; size: number } }) => {
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
  }, [allJurnal, jadwalId]);

  const generateAllMeetings = () => {
    if (!jadwal) return [];

    const meetings: Array<{
      pertemuanKe: number;
      tanggal: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      jadwalId: string;
      kelasId: string;
      sesi?: SesiAbsensiTahfiz;
      jurnal?: Jurnal;
      hasMateri: boolean;
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

    // Start from beginning of selected year
    const startDate = new Date(`${selectedTahun}-01-01`);
    // End at end of selected year
    const endDate = new Date(`${selectedTahun}-12-31`);
    endDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const actualEndDate = endDate < today ? endDate : today;

    const targetDay = hariToDay[jadwal.hari];
    let currentDate = new Date(startDate);

    // Find first occurrence of target day
    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let pertemuanCounter = 1;
    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const session = closedSessions.find(s =>
        s.jadwalId === jadwal.id &&
        s.tanggal === dateStr &&
        s.status === 'ditutup'
      );

      // Get jurnal from jurnal collection
      const jurnalKey = `${jadwal.id}-${dateStr}`;
      const jurnal = jurnalMap.get(jurnalKey);

      meetings.push({
        pertemuanKe: pertemuanCounter,
        tanggal: dateStr,
        hari: hariNames[jadwal.hari],
        jamMulai: jadwal.jamMulai,
        jamSelesai: jadwal.jamSelesai,
        jadwalId: jadwal.id,
        kelasId: kelasId,
        sesi: session,
        jurnal: jurnal,
        hasMateri: !!jurnal,
      });

      pertemuanCounter++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return meetings.sort((a, b) =>
      new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
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

  const handleDownload = (jurnal: Jurnal) => {
    if (!jurnal.file) return;

    const link = document.createElement('a');
    link.href = jurnal.file.data;
    link.download = jurnal.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditMateri = (meeting: typeof sesiWithMateri[0]) => {
    setEditingMeeting({
      jadwalId: meeting.jadwalId,
      kelasId: meeting.kelasId,
      tanggal: meeting.tanggal,
      jurnal: meeting.jurnal
    });
    setFormData({
      judul: meeting.jurnal?.judul || '',
      deskripsi: meeting.jurnal?.deskripsi || '',
      file: meeting.jurnal?.file || null
    });
    setIsEditOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showErrorToast('Gagal Upload', 'Ukuran file maksimal 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        file: {
          name: file.name,
          type: file.type,
          data: reader.result as string,
          size: file.size
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
  };

  const handleSaveJurnal = async () => {
    if (!editingMeeting) return;

    if (!formData.judul.trim()) {
      showErrorToast('Validasi Gagal', 'Judul materi wajib diisi');
      return;
    }

    if (!formData.deskripsi.trim()) {
      showErrorToast('Validasi Gagal', 'Deskripsi materi wajib diisi');
      return;
    }

    const jurnal: JurnalMengajar = {
      judul: formData.judul,
      deskripsi: formData.deskripsi,
      waktuInput: new Date().toISOString(),
      file: formData.file || undefined
    };

    try {
      await onUpdateJurnal(editingMeeting.jadwalId, editingMeeting.kelasId, editingMeeting.tanggal, jurnal);
      await refreshJurnal();
      showSuccessToast(
        'Berhasil',
        editingMeeting.jurnal ? 'Jurnal materi berhasil diperbarui' : 'Jurnal materi berhasil ditambahkan'
      );

      setIsEditOpen(false);
      setEditingMeeting(null);
      setFormData({ judul: '', deskripsi: '', file: null });
    } catch (error) {
      console.error('Error saving jurnal:', error);
      showErrorToast('Gagal', 'Gagal menyimpan jurnal materi');
    }
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

  if (!jadwal || !kelasData) {
    return null;
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Daftar Materi Pembelajaran Tahfiz"
        size="2xl"
      >
        <div className="space-y-5 sm:space-y-6">
          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {kelasData.namaKelas}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white bg-opacity-50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs font-medium text-slate-600">Kelas</p>
                    <p className="text-xs sm:text-sm text-slate-900 font-semibold mt-1">{kelasData.namaKelas}</p>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs font-medium text-slate-600">Jadwal</p>
                    <p className="text-xs sm:text-sm text-slate-900 font-semibold mt-1">{jadwal.hari.charAt(0).toUpperCase() + jadwal.hari.slice(1)}</p>
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
                Belum ada pertemuan yang telah dilaksanakan untuk kelas tahfiz ini.
              </p>
            </div>
          ) : (
            <>
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
                              <Badge variant="success" className="text-xs">Mengajar</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Tidak Mengajar</Badge>
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
                            <div className="flex items-center justify-center gap-1 ">
                              {meeting.jurnal ? (
                                <>
                                  <Button size="sm" variant="secondary" onClick={() => handleViewDetail(meeting)} className="text-xs px-2 py-1 flex items-center">
                                    <Eye size={12} className="mr-2" />
                                    Lihat
                                  </Button>
                                  <Button size="sm" variant="primary" onClick={() => handleEditMateri(meeting)} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 flex items-center">
                                    <Edit size={12} className="mr-2" />
                                    Edit
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="primary" onClick={() => handleEditMateri(meeting)} className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center">
                                  <Plus size={12} className="mr-2" />
                                  Tambah
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

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
                      <Badge variant="info" className="text-xs flex-shrink-0 whitespace-nowrap">P{meeting.pertemuanKe}</Badge>
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
                        <Badge variant="success" className="text-xs flex-1">Guru Mengajar</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs flex-1">Guru Tidak Mengajar</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      {meeting.jurnal ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => handleViewDetail(meeting)} className="text-xs flex-1 flex items-center justify-center">
                            <Eye size={12} className="mr-1" />
                            Lihat
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => handleEditMateri(meeting)} className="text-xs flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center">
                            <Edit size={12} className="mr-1" />
                            Edit
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="primary" onClick={() => handleEditMateri(meeting)} className="text-xs w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center ">
                          <Plus size={12} className="mr-1" />
                          Tambah Materi
                        </Button>
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
                    <p className="text-sm text-gray-700 mt-1">{kelasData.namaKelas}</p>
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

      {editingMeeting && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingMeeting(null);
            setFormData({ judul: '', deskripsi: '', file: null });
          }}
          title={editingMeeting.jurnal ? 'Edit Jurnal Materi' : 'Tambah Jurnal Materi'}
          size="lg"
        >
          <div className="space-y-5 mb-12 pb-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <Calendar className="w-4 h-4 mr-2 text-blue-700" />
                      <span className="text-sm font-bold text-gray-900">
                        {formatTanggal(editingMeeting.tanggal)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{kelasData.namaKelas}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Judul Materi <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.judul}
                onChange={(e) => setFormData(prev => ({ ...prev, judul: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Masukkan judul materi"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deskripsi Materi <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                placeholder="Masukkan deskripsi materi pembelajaran"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                File Materi (Opsional)
              </label>
              {formData.file ? (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                        <span className="text-2xl">
                          {getFileIcon(formData.file.type)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formData.file.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatFileSize(formData.file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:bg-red-50 flex items-center justify-center" 
                    >
                      <Trash2 size={14} className="mr-1" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                  <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                      Klik untuk memilih file
                    </span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*,video/*"
                    />
                  </label>
                  <p className="text-xs text-gray-600 mt-3">
                    Format: PDF, Word, PowerPoint, Excel, Gambar, atau Video
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ukuran maksimal: 10MB
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingMeeting(null);
                  setFormData({ judul: '', deskripsi: '', file: null });
                }}
                className="flex items-center justify-center"
              >
                <X size={16} className="mr-1" />
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveJurnal}
                 className="flex items-center justify-center"
              >
                {editingMeeting.jurnal ? (
                  <>
                    <Edit size={16} className="mr-1" />
                    Perbarui Materi
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-1" />
                    Tambah Materi
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default MateriTahfizModal;

