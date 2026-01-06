import React, { useState, useMemo, useEffect } from 'react';
import { Play, Square, UserCheck, Clock, Users, Camera, CheckCircle, FileText, Eye, CreditCard as Edit, ZoomIn, ChevronDown, ChevronUp, Trash2, RefreshCw, Download, X } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import Badge from '../../../../../ui/Badge';
import { JadwalPelajaran, SesiAbsensi, AbsensiGuru, FotoMengajar, AbsensiPelajaran } from '../../../../../../types';
import CameraCapture from '../../../../../ui/CameraCapture';
import { apiService } from '../../../../../../services/apiService';
import { useJurnal, Jurnal } from '../../../../../../hooks/useJurnal';

interface JadwalCardProps {
  jadwal: JadwalPelajaran;
  session: SesiAbsensi | undefined;
  kelasName: string;
  mapelName: string;
  muridCount: number;
  attendanceCount: number;
  canOpenSession: boolean;
  isSessionExpired: boolean;
  isFinished: boolean;
  hasPhoto: boolean;
  absensiGuru?: AbsensiGuru[];
  userId?: string;
  today?: string;
  onOpenSession: (jadwalId: string) => void;
  onManualAttendance: (session: SesiAbsensi) => void;
  onCloseSession: (sessionId: string) => void;
  onOpenDetailAbsensi: (session: SesiAbsensi) => void;
  onTakePhoto: (jadwal: JadwalPelajaran) => void;
  onOpenJurnalModal: (session: SesiAbsensi) => void;
  refreshAbsensiGuru: () => Promise<void>;
  getJadwalInfo: (jadwalId: string) => { kelas: string; mapel: string };
}

const JadwalCard: React.FC<JadwalCardProps> = ({
  jadwal,
  session,
  kelasName,
  mapelName,
  muridCount,
  attendanceCount,
  canOpenSession,
  isSessionExpired,
  isFinished,
  hasPhoto,
  absensiGuru,
  userId,
  today,
  onOpenSession,
  onManualAttendance,
  onCloseSession,
  onOpenDetailAbsensi,
  onTakePhoto,
  onOpenJurnalModal,
  refreshAbsensiGuru,
  getJadwalInfo,
}) => {
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FotoMengajar | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isReplacingPhoto, setIsReplacingPhoto] = useState(false);
  const [isJurnalDetailOpen, setIsJurnalDetailOpen] = useState(false);
  const isSessionActive = session?.status === 'dibuka';
  
  // Fetch jurnal from jurnal collection
  const { jurnal: jurnalList, refreshJurnal } = useJurnal(
    today && jadwal.id
      ? {
          tanggal: today,
          jadwalId: jadwal.id,
          kelasId: jadwal.kelasId,
        }
      : undefined
  );
  
  // Refresh jurnal when modal is closed (to get latest data after save)
  useEffect(() => {
    const handleJurnalSaved = () => {
      refreshJurnal();
    };
    
    // Listen for custom event when jurnal is saved
    window.addEventListener('jurnal-saved', handleJurnalSaved);
    return () => {
      window.removeEventListener('jurnal-saved', handleJurnalSaved);
    };
  }, [refreshJurnal]);
  
  const jurnal = useMemo(() => {
    if (!today || !jadwal.id) return undefined;
    
    // Find jurnal document for this jadwalId and kelasId
    const jurnalDoc = jurnalList.find(
      j => j.jadwalId === jadwal.id && j.kelasId === jadwal.kelasId
    );
    
    if (!jurnalDoc) return undefined;
    
    // Check if jurnalDoc has pertemuan array (new structure)
    if (jurnalDoc.pertemuan && Array.isArray(jurnalDoc.pertemuan)) {
      // Find pertemuan with matching tanggal
      const pertemuan = jurnalDoc.pertemuan.find((p: any) => p.tanggal === today);
      if (!pertemuan) return undefined;
      
      // Return in old format for compatibility
      return {
        id: jurnalDoc.id,
        jadwalId: jurnalDoc.jadwalId,
        kelasId: jurnalDoc.kelasId,
        tanggal: pertemuan.tanggal,
        judul: pertemuan.judul,
        deskripsi: pertemuan.deskripsi,
        waktuInput: pertemuan.waktuInput,
        file: pertemuan.file,
        tahunAjaranId: jurnalDoc.tahunAjaranId,
        semester: jurnalDoc.semester,
        createdAt: jurnalDoc.createdAt,
        updatedAt: jurnalDoc.updatedAt,
      };
    }
    
    // Old structure (backward compatibility)
    if (jurnalDoc.tanggal === today) {
      return jurnalDoc;
    }
    
    return undefined;
  }, [jurnalList, jadwal.id, jadwal.kelasId, today]);
  
  // Check if session is completed (closed + has photo + has journal)
  const isSessionCompleted = session?.status === 'ditutup' && hasPhoto && jurnal;

  const getPhotoForJadwal = () => {
    if (!absensiGuru || !userId || !today) return null;
    const todayAbsensi = absensiGuru.find(a => a.guruId === userId && a.tanggal === today);
    return todayAbsensi?.fotoMengajar?.find(f => f.jadwalId === jadwal.id);
  };

  const foto = getPhotoForJadwal();

  const handleDeletePhoto = async () => {
    if (!selectedPhoto || !session || !userId || !today) return;

    if (!window.confirm('Apakah Anda yakin ingin menghapus foto bukti mengajar ini?')) {
      return;
    }

    try {
      const todayAbsensi = absensiGuru?.find(a => a.guruId === userId && a.tanggal === today);
      if (!todayAbsensi) {
        alert('Data absensi tidak ditemukan');
        return;
      }

      // Filter out the photo to be deleted
      const updatedFotoMengajar = (todayAbsensi.fotoMengajar || []).filter(f => f.id !== selectedPhoto.id);

      // Update absensi guru
      const response = await apiService.updateAbsensiGuru(todayAbsensi.id, {
        fotoMengajar: updatedFotoMengajar
      });

      if (response.success) {
        await refreshAbsensiGuru();
        setShowPhotoPreview(false);
        setSelectedPhoto(null);
        alert('Foto bukti mengajar berhasil dihapus');
      } else {
        throw new Error(response.message || 'Gagal menghapus foto');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Gagal menghapus foto bukti mengajar');
    }
  };

  const handleReplacePhoto = () => {
    setIsReplacingPhoto(true);
    setShowPhotoPreview(false);
    setIsCameraOpen(true);
  };

  const handlePhotoCapture = async (imageBase64: string) => {
    if (!selectedPhoto || !session || !userId || !today) return;

    try {
      const todayAbsensi = absensiGuru?.find(a => a.guruId === userId && a.tanggal === today);
      if (!todayAbsensi) {
        alert('Data absensi tidak ditemukan');
        return;
      }

      // Create new photo object
      const newFoto: FotoMengajar = {
        id: selectedPhoto.id, // Keep the same ID to replace
        jadwalId: selectedPhoto.jadwalId,
        mataPelajaranId: selectedPhoto.mataPelajaranId,
        kelasId: selectedPhoto.kelasId,
        fotoBase64: imageBase64,
        waktuFoto: new Date().toISOString(),
        keterangan: selectedPhoto.keterangan || `Foto bukti mengajar ${getJadwalInfo(selectedPhoto.jadwalId).mapel} di kelas ${getJadwalInfo(selectedPhoto.jadwalId).kelas}`
      };

      // Replace the photo in the array
      const updatedFotoMengajar = (todayAbsensi.fotoMengajar || []).map(f => 
        f.id === selectedPhoto.id ? newFoto : f
      );

      // Update absensi guru
      const response = await apiService.updateAbsensiGuru(todayAbsensi.id, {
        fotoMengajar: updatedFotoMengajar
      });

      if (response.success) {
        await refreshAbsensiGuru();
        setIsCameraOpen(false);
        setIsReplacingPhoto(false);
        setSelectedPhoto(null);
        alert('Foto bukti mengajar berhasil diganti');
      } else {
        throw new Error(response.message || 'Gagal mengganti foto');
      }
    } catch (error) {
      console.error('Error replacing photo:', error);
      alert('Gagal mengganti foto bukti mengajar');
    }
  };

  // Calculate attendance statistics by status
  const attendanceStats = useMemo(() => {
    if (!session?.dataAbsensi) {
      return {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alfa: 0,
        dispen: 0,
        total: 0
      };
    }

    const stats = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
      dispen: 0,
      total: session.dataAbsensi.length
    };

    session.dataAbsensi.forEach((absensi: AbsensiPelajaran) => {
      if (absensi.keteranganAbsensi === 'Dispen' || absensi.status === 'dispen') {
        stats.dispen++;
      } else if (absensi.status === 'hadir') {
        stats.hadir++;
      } else if (absensi.status === 'izin') {
        stats.izin++;
      } else if (absensi.status === 'sakit') {
        stats.sakit++;
      } else if (absensi.status === 'alfa') {
        stats.alfa++;
      }
    });

    return stats;
  }, [session?.dataAbsensi]);

  return (
    <div className="group bg-white border border-slate-200 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header Section */}
      <div className={`px-4 sm:px-5 lg:px-6 py-4 sm:py-5 border-b border-slate-200 ${
        isSessionActive ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50' : 'bg-gradient-to-r from-slate-50 to-slate-50/50'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 mb-2 line-clamp-2">
              {mapelName}
            </h4>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{kelasName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{jadwal.jamMulai}</span>
                <span className="text-slate-400">-</span>
                <span>{jadwal.jamSelesai}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {session ? (
              <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${
                isSessionActive
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {isSessionActive ? 'Sesi Aktif' : 'Sesi Ditutup'}
              </span>
            ) : isSessionExpired ? (
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
                Tidak Hadir
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                Belum Dibuka
              </span>
            )}
          </div>
        </div>

        {/* Attendance Counter */}
        {session && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-slate-600 font-medium">Kehadiran Murid:</span>
              <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">
                {attendanceCount}/{muridCount}
              </span>
            </div>
            {muridCount > 0 && (
              <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 sm:h-2 overflow-hidden flex">
                {/* Hadir - Hijau */}
                {attendanceStats.hadir > 0 && (
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(attendanceStats.hadir / muridCount) * 100}%` }}
                    title={`Hadir: ${attendanceStats.hadir}`}
                  />
                )}
                {/* Sakit - Biru */}
                {attendanceStats.sakit > 0 && (
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${(attendanceStats.sakit / muridCount) * 100}%` }}
                    title={`Sakit: ${attendanceStats.sakit}`}
                  />
                )}
                {/* Izin - Orange */}
                {attendanceStats.izin > 0 && (
                  <div
                    className="bg-orange-500 h-full transition-all duration-300"
                    style={{ width: `${(attendanceStats.izin / muridCount) * 100}%` }}
                    title={`Izin: ${attendanceStats.izin}`}
                  />
                )}
                {/* Alfa - Merah */}
                {attendanceStats.alfa > 0 && (
                  <div
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{ width: `${(attendanceStats.alfa / muridCount) * 100}%` }}
                    title={`Alfa: ${attendanceStats.alfa}`}
                  />
                )}
                {/* Dispen - Abu-abu */}
                {attendanceStats.dispen > 0 && (
                  <div
                    className="bg-slate-500 h-full transition-all duration-300"
                    style={{ width: `${(attendanceStats.dispen / muridCount) * 100}%` }}
                    title={`Dispen: ${attendanceStats.dispen}`}
                  />
                )}
              </div>
            )}
            {/* Legend */}
            {attendanceStats.total > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {attendanceStats.hadir > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    <span className="text-slate-600">Hadir: {attendanceStats.hadir}</span>
                  </div>
                )}
                {attendanceStats.sakit > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-slate-600">Sakit: {attendanceStats.sakit}</span>
                  </div>
                )}
                {attendanceStats.izin > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span className="text-slate-600">Izin: {attendanceStats.izin}</span>
                  </div>
                )}
                {attendanceStats.alfa > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-slate-600">Alfa: {attendanceStats.alfa}</span>
                  </div>
                )}
                {attendanceStats.dispen > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-slate-500"></div>
                    <span className="text-slate-600">Dispen: {attendanceStats.dispen}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Section */}
      <div className="px-4 sm:px-5 lg:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
        {session ? (
          <>
            {/* Collapsed View for Completed Session */}
            {isSessionCompleted && !isExpanded ? (
              <Button
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="w-full flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-slate-600 hover:bg-slate-700 text-white border-0"
              >
                <span>Lihat Lainnya</span>
                <ChevronDown size={16} className="ml-1.5 sm:ml-2" />
              </Button>
            ) : (
              <>
                {/* Primary Actions for Active Session */}
                {isSessionActive ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Button
                      size="sm"
                      onClick={() => onManualAttendance(session)}
                      className="flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-0"
                    >
                      <UserCheck size={16} className="mr-1.5 sm:mr-2" />
                      <span>Absen Siswa</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onCloseSession(session.id)}
                      className="flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white border-0"
                    >
                      <Square size={16} className="mr-1.5 sm:mr-2" />
                      <span>Tutup Sesi</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    {isSessionCompleted && (
                      <Button
                        size="sm"
                        onClick={() => setIsExpanded(false)}
                        className="w-full flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-slate-600 hover:bg-slate-700 text-white border-0 mb-3"
                      >
                        <span>Tutup</span>
                        <ChevronUp size={16} className="ml-1.5 sm:ml-2" />
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        size="sm"
                        onClick={() => onOpenDetailAbsensi(session)}
                        variant="secondary"
                        className="flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5"
                      >
                        <Eye size={16} className="mr-1.5 sm:mr-2" />
                        <span>Lihat Detail</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onManualAttendance(session)}
                        className="flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-0 flex items-center justify-center"
                      >
                        <Edit size={16} className="mr-1.5 sm:mr-2" />
                        <span>Edit Absen</span>
                      </Button>
                    </div>
                  </>
                )}

                {/* Photo and Journal Sections - Grid Layout for Desktop */}
                <div className="pt-3 sm:pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Photo Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Camera size={14} className="text-blue-600" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">Bukti Mengajar</span>
                      </div>
                      {hasPhoto && (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0 flex items-center justify-center">
                          <CheckCircle size={12} className="mr-1" />
                          Tersimpan
                        </span>
                      )}
                    </div>
                    {foto ? (
                      <div className="relative group">
                        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          <img
                            src={foto.fotoBase64}
                            alt="Bukti Mengajar"
                            className="w-full h-32 sm:h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedPhoto(foto);
                              setShowPhotoPreview(true);
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <button
                              onClick={() => {
                                setSelectedPhoto(foto);
                                setShowPhotoPreview(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
                              title="Lihat Preview"
                            >
                              <ZoomIn size={20} className="text-blue-600" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 text-center">
                          Klik untuk melihat preview
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 p-6 sm:p-8 flex flex-col items-center justify-center h-32 sm:h-40">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                          <Camera size={20} className="sm:w-6 sm:h-6 text-blue-500" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium text-center">
                          Belum ada foto
                        </p>
                        <p className="text-xs text-slate-400 text-center mt-1">
                          Foto belum diupload
                        </p>
                      </div>
                    )}
                    {!hasPhoto && (isFinished || session.status === 'ditutup') && (
                      <Button
                        size="sm"
                        onClick={() => onTakePhoto(jadwal)}
                        className="w-full flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white border-0"
                      >
                        <Camera size={16} className="mr-1.5 sm:mr-2" />
                        Ambil Foto
                      </Button>
                    )}
                    {!hasPhoto && !isFinished && session.status !== 'ditutup' && (
                      <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <p className="text-xs sm:text-sm text-amber-700 font-medium">
                          Selesaikan sesi untuk mengambil foto
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Journal Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-green-600" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">Jurnal Mengajar</span>
                      </div>
                      {jurnal && (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0">
                          <CheckCircle size={12} className="mr-1" />
                          Tersimpan
                        </span>
                      )}
                    </div>
                    {jurnal ? (
                      <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 sm:p-5">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Judul Materi</p>
                            <p className="text-sm text-slate-900 font-medium line-clamp-2">{jurnal.judul}</p>
                          </div>
                          {jurnal.deskripsi && (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Deskripsi</p>
                              <p className="text-xs text-slate-700 line-clamp-3">{jurnal.deskripsi}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[120px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                          <FileText size={20} className="sm:w-6 sm:h-6 text-green-500" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium text-center">
                          Belum ada jurnal
                        </p>
                        <p className="text-xs text-slate-400 text-center mt-1">
                          Jurnal belum diinput
                        </p>
                      </div>
                    )}
                    {jurnal ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setIsJurnalDetailOpen(true)}
                          variant="secondary"
                          className="flex-1 flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5"
                        >
                          <Eye size={16} className="mr-1.5 sm:mr-2" />
                          Lihat
                        </Button>
                        {session ? (
                          <Button
                            size="sm"
                            onClick={() => onOpenJurnalModal(session)}
                            variant="primary"
                            className="flex-1 flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700"
                          >
                            <FileText size={16} className="mr-1.5 sm:mr-2" />
                            Edit
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              // Create a temporary session object for jurnal modal
                              const tempSession: SesiAbsensi = {
                                id: `temp-${jadwal.id}-${today}`,
                                jadwalId: jadwal.id,
                                tanggal: today || '',
                                jamBuka: '',
                                status: 'ditutup',
                                createdBy: userId || '',
                                tahunAjaranId: '',
                                semester: 0,
                              };
                              onOpenJurnalModal(tempSession);
                            }}
                            variant="primary"
                            className="flex-1 flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700"
                          >
                            <FileText size={16} className="mr-1.5 sm:mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        {session && (isFinished || session.status === 'ditutup') && (
                          <Button
                            size="sm"
                            onClick={() => onOpenJurnalModal(session)}
                            className="w-full flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white border-0"
                          >
                            <FileText size={16} className="mr-1.5 sm:mr-2" />
                            Input Jurnal
                          </Button>
                        )}
                        {(!session || (!isFinished && session.status !== 'ditutup')) && (
                          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-center">
                            <p className="text-xs sm:text-sm text-amber-700 font-medium">
                              {session ? 'Selesaikan sesi untuk menginput jurnal' : 'Buka sesi terlebih dahulu untuk menginput jurnal'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {isSessionExpired ? (
              <div className="p-4 sm:p-5 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-xs sm:text-sm text-red-700 font-semibold mb-1">Waktu Mengajar Sudah Berlalu</p>
                <p className="text-xs text-red-600">Pukul {jadwal.jamSelesai}</p>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => onOpenSession(jadwal.id)}
                disabled={!canOpenSession}
                className={`w-full flex items-center justify-center text-xs sm:text-sm py-2.5 sm:py-3 ${
                  canOpenSession
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-0'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Play size={16} className="mr-1.5 sm:mr-2" />
                {canOpenSession ? 'Buka Sesi Absensi' : 'Waktu Belum Dimulai'}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Photo Preview Modal */}
      {showPhotoPreview && selectedPhoto && (
        <Modal
          isOpen={showPhotoPreview}
          onClose={() => {
            setShowPhotoPreview(false);
            setSelectedPhoto(null);
          }}
          title="Preview Foto Bukti Mengajar"
          size="lg"
        >
          <div className="space-y-4">
            <div className="text-center">
              <img
                src={selectedPhoto.fotoBase64}
                alt="Bukti Mengajar"
                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-slate-200 mx-auto"
              />
            </div>
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Waktu Foto:</span>
                <span className="font-medium text-slate-900">
                  {new Date(selectedPhoto.waktuFoto).toLocaleString('id-ID')}
                </span>
              </div>
              {selectedPhoto.keterangan && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-slate-600">Keterangan:</span>
                  <span className="font-medium text-slate-900 text-right max-w-[70%]">
                    {selectedPhoto.keterangan}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="danger"
                onClick={handleDeletePhoto}
                className="flex-1 flex items-center justify-center"
              >
                <Trash2 size={18} className="mr-2" />
                Hapus Foto
              </Button>
              <Button
                variant="secondary"
                onClick={handleReplacePhoto}
                className="flex-1 flex items-center justify-center"
              >
                <RefreshCw size={18} className="mr-2" />
                Ganti Foto
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Camera Capture Modal for replacing photo */}
      <CameraCapture
        isOpen={isCameraOpen && isReplacingPhoto}
        onClose={() => {
          setIsCameraOpen(false);
          setIsReplacingPhoto(false);
        }}
        onCapture={handlePhotoCapture}
        title={selectedPhoto && session ? `Ganti Foto Bukti Mengajar - ${getJadwalInfo(selectedPhoto.jadwalId).mapel}` : 'Ambil Foto'}
      />

      {/* Jurnal Detail Modal */}
      {jurnal && (
        <Modal
          isOpen={isJurnalDetailOpen}
          onClose={() => setIsJurnalDetailOpen(false)}
          title="Detail Jurnal Mengajar"
          size="lg"
        >
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 truncate">
                      {jurnal.judul}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">{mapelName}</p>
                    <p className="text-xs text-gray-600 mt-1">{kelasName}</p>
                  </div>
                </div>
                <Badge variant="info" className="ml-3 whitespace-nowrap">
                  {new Date(jurnal.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Badge>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-600" />
                Deskripsi Materi
              </h5>
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200">
                {jurnal.deskripsi}
              </div>
            </div>

            {jurnal.file && (
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
                          {jurnal.file.type.includes('pdf') ? '📄' : 
                           jurnal.file.type.includes('word') || jurnal.file.type.includes('document') ? '📝' :
                           jurnal.file.type.includes('powerpoint') || jurnal.file.type.includes('presentation') ? '📊' :
                           jurnal.file.type.includes('excel') || jurnal.file.type.includes('spreadsheet') ? '📈' :
                           jurnal.file.type.includes('image') ? '🖼️' :
                           jurnal.file.type.includes('video') ? '🎥' : '📎'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {jurnal.file.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {jurnal.file.size < 1024 ? jurnal.file.size + ' B' :
                           jurnal.file.size < 1024 * 1024 ? (jurnal.file.size / 1024).toFixed(2) + ' KB' :
                           (jurnal.file.size / (1024 * 1024)).toFixed(2) + ' MB'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = jurnal.file!.data;
                        link.download = jurnal.file!.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="ml-3 whitespace-nowrap flex items-center justify-center"
                    >
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                {jurnal.file.type === 'application/pdf' && (
                  <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
                    <iframe
                      src={jurnal.file.data}
                      className="w-full h-96"
                      title="Preview PDF"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Waktu Input:</span>{' '}
                {new Date(jurnal.waktuInput).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              {jurnal.file && (
                <Button
                  variant="primary"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = jurnal.file!.data;
                    link.download = jurnal.file!.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center justify-center"
                >
                  <Download size={16} className="mr-1" />
                  Download Materi
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setIsJurnalDetailOpen(false)}
                className="flex items-center justify-center"
              >
                <X size={16} className="mr-1" />
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default JadwalCard;
