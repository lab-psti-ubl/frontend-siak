import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Camera, Edit, FileIcon, Download, Eye, X, ChevronDown, ChevronUp, ZoomIn, Pencil, Trash2, RefreshCw } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { SesiAbsensi, User, JadwalPelajaran, AbsensiPelajaran, AbsensiGuru, FotoMengajar } from '../../../../../../types';
import CameraCapture from '../../../../../ui/CameraCapture';
import { apiService } from '../../../../../../services/apiService';
import { useJurnal } from '../../../../../../hooks/useJurnal';

interface DetailAbsensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSesi: SesiAbsensi | null;
  getJadwalInfo: (jadwalId: string) => { kelas: string; mapel: string };
  absensiGuru: AbsensiGuru[];
  userId: string | undefined;
  jadwalPelajaran: JadwalPelajaran[];
  getMuridsByKelas: (kelasId: string) => User[];
  getAttendanceStatus: (muridId: string, sesiId: string) => AbsensiPelajaran | undefined;
  onEditAbsensi: (absensi: AbsensiPelajaran) => void;
  users: User[];
  refreshAbsensiGuru: () => Promise<void>;
  loadingMuridIds?: Set<string>;
}

const DetailAbsensiModal: React.FC<DetailAbsensiModalProps> = ({
  isOpen,
  onClose,
  selectedSesi,
  getJadwalInfo,
  absensiGuru,
  userId,
  jadwalPelajaran,
  getMuridsByKelas,
  getAttendanceStatus,
  onEditAbsensi,
  users,
  refreshAbsensiGuru,
  loadingMuridIds = new Set(),
}) => {
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FotoMengajar | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMuridId, setExpandedMuridId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isReplacingPhoto, setIsReplacingPhoto] = useState(false);

  // Fetch jurnal from jurnal collection
  const { jurnal: jurnalList } = useJurnal(
    selectedSesi
      ? {
          tanggal: selectedSesi.tanggal,
          jadwalId: selectedSesi.jadwalId,
          kelasId: jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId)?.kelasId,
        }
      : undefined
  );

  const jurnal = useMemo(() => {
    if (!selectedSesi) return undefined;
    const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId);
    if (!jadwal) return undefined;
    
    // Find jurnal document for this jadwalId and kelasId
    const jurnalDoc = jurnalList.find(
      j => j.jadwalId === selectedSesi.jadwalId && j.kelasId === jadwal.kelasId
    );
    
    if (!jurnalDoc) return undefined;
    
    // Check if jurnalDoc has pertemuan array (new structure)
    if (jurnalDoc.pertemuan && Array.isArray(jurnalDoc.pertemuan)) {
      // Find pertemuan with matching tanggal
      const pertemuan = jurnalDoc.pertemuan.find((p: any) => p.tanggal === selectedSesi.tanggal);
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
    if (jurnalDoc.tanggal === selectedSesi.tanggal) {
      return jurnalDoc;
    }
    
    return undefined;
  }, [jurnalList, selectedSesi, jadwalPelajaran]);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const getFileIcon = (type: string | undefined) => {
    if (!type) return '📁';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('pdf')) return '📄';
    if (typeLower.includes('word') || typeLower.includes('doc')) return '📝';
    if (typeLower.includes('presentation') || typeLower.includes('ppt') || typeLower.includes('pptx')) return '📊';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'hadir': return 'success';
      case 'izin': return 'warning';
      case 'sakit': return 'info';
      case 'alfa': return 'danger';
      default: return 'default';
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto || !selectedSesi || !userId) return;

    if (!window.confirm('Apakah Anda yakin ingin menghapus foto bukti mengajar ini?')) {
      return;
    }

    try {
      const todayAbsensi = absensiGuru.find(a => a.guruId === userId && a.tanggal === selectedSesi.tanggal);
      if (!todayAbsensi) {
        alert('Data absensi tidak ditemukan');
        return;
      }

      // Filter out the photo to be deleted
      const updatedFotoMengajar = (todayAbsensi.fotoMengajar || []).filter(f => f.id !== selectedPhoto.id);

      // Update absensi guru
      const response = await apiService.submitAbsensiGuruUpdateWithFallback(todayAbsensi.id, {
        fotoMengajar: updatedFotoMengajar,
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
    if (!selectedPhoto || !selectedSesi || !userId) return;

    try {
      const todayAbsensi = absensiGuru.find(a => a.guruId === userId && a.tanggal === selectedSesi.tanggal);
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
      const response = await apiService.submitAbsensiGuruUpdateWithFallback(todayAbsensi.id, {
        fotoMengajar: updatedFotoMengajar,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Absensi"
      size="xl"
    >
      {selectedSesi && (
        <div className="space-y-4 sm:space-y-6 pb-12 mb-4 sm:pb-2 sm:mb-2">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg sm:rounded-xl text-white shadow-sm">
            <h4 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">
              {getJadwalInfo(selectedSesi.jadwalId).mapel}
            </h4>
            <p className="text-sm sm:text-base text-white/90 mb-1">
              {getJadwalInfo(selectedSesi.jadwalId).kelas}
            </p>
            <p className="text-xs sm:text-sm text-white/80">
              {new Date(selectedSesi.tanggal).toLocaleDateString('id-ID')} • Sesi: {selectedSesi.jamBuka} - {selectedSesi.jamTutup || 'Aktif'}
            </p>
          </div>

          {jurnal && (
            <div className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-200">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="bg-green-100 rounded-lg p-2 mr-2 sm:mr-3">
                  <BookOpen size={18} className="text-green-600" />
                </div>
                <h5 className="text-sm sm:text-base font-semibold text-green-900">Jurnal Mengajar</h5>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-green-800 uppercase tracking-wide mb-1.5">Judul Materi</p>
                  <p className="text-sm sm:text-base text-slate-900">{jurnal.judul}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-green-800 uppercase tracking-wide mb-1.5">Deskripsi</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{jurnal.deskripsi}</p>
                </div>
                <div className="border border-green-300 rounded-lg p-3 sm:p-4 bg-white">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2.5">File Lampiran</p>
                  {jurnal.file && jurnal.file.name && jurnal.file.data && jurnal.file.size ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className="text-xl sm:text-2xl">{getFileIcon(jurnal.file?.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                            {jurnal.file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(jurnal.file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setShowFilePreview(true)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={jurnal.file.data}
                          download={jurnal.file.name}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-2">Tidak ada file materi</p>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Diinput: {jurnal.waktuInput ? new Date(jurnal.waktuInput).toLocaleString('id-ID') : '-'}
                </p>
              </div>
            </div>
          )}

          {(() => {
            const todayAbsensi = absensiGuru.find(a => a.guruId === userId && a.tanggal === selectedSesi.tanggal);
            const foto = todayAbsensi?.fotoMengajar?.find(f => f.jadwalId === selectedSesi.jadwalId);

            if (foto) {
              return (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-lg p-2 mr-2 sm:mr-3">
                        <Camera size={18} className="text-blue-600" />
                      </div>
                      <h5 className="text-sm sm:text-base font-semibold text-blue-900">Bukti Foto Mengajar</h5>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPhoto(foto);
                        setShowPhotoPreview(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Lihat Preview"
                    >
                      <ZoomIn size={18} />
                    </button>
                  </div>
                  <div className="text-center">
                    <img
                      src={foto.fotoBase64}
                      alt="Bukti Mengajar"
                      className="max-w-full max-h-48 sm:max-h-64 object-contain rounded-lg border border-slate-200 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setSelectedPhoto(foto);
                        setShowPhotoPreview(true);
                      }}
                    />
                    <p className="text-xs text-slate-600 mt-2 sm:mt-3">
                      Diambil: {new Date(foto.waktuFoto).toLocaleString('id-ID')}
                    </p>
                    {foto.keterangan && (
                      <p className="text-xs text-slate-600 mt-1">
                        {foto.keterangan}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="space-y-3">
            <h5 className="text-sm sm:text-base font-semibold text-slate-900">Data Kehadiran Murid</h5>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto rounded-lg sm:rounded-xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header className="text-xs sm:text-sm">Nama Murid</TableCell>
                    <TableCell header className="text-xs sm:text-sm">NISN</TableCell>
                    <TableCell header className="text-xs sm:text-sm">Status</TableCell>
                    <TableCell header className="text-xs sm:text-sm">Waktu</TableCell>
                    <TableCell header className="text-xs sm:text-sm">Metode</TableCell>
                    <TableCell header className="text-xs sm:text-sm">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId);
                    const muridList = jadwal ? getMuridsByKelas(jadwal.kelasId) : [];

                    return muridList.map((murid) => {
                      const attendance = getAttendanceStatus(murid.id, selectedSesi.id);

                      return (
                        <TableRow key={murid.id}>
                          <TableCell className="text-xs sm:text-sm">{murid.name}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{murid.nisn}</TableCell>
                          <TableCell>
                            {attendance ? (
                              <Badge variant={getStatusBadgeVariant(attendance.status)}>
                                {attendance.status.toUpperCase()}
                              </Badge>
                            ) : (
                              <Badge variant="default">Belum Absen</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {attendance ? new Date(attendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </TableCell>
                          <TableCell>
                            {attendance ? (
                              <Badge variant={attendance.method === 'qr' ? 'info' : 'default'} className="text-xs">
                                {attendance.method === 'qr' ? 'QR Code' : 'Manual'}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {loadingMuridIds.has(murid.id) ? (
                              <div className="flex items-center justify-center gap-2 text-blue-600">
                                <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs">Menyimpan...</span>
                              </div>
                            ) : (
                              attendance && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => onEditAbsensi(attendance)}
                                  className="text-xs py-1 px-2 justify-center flex items-center"
                                >
                                  <Edit size={12} className="mr-0.5" />
                                  Edit
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {(() => {
                const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId);
                const muridList = jadwal ? getMuridsByKelas(jadwal.kelasId) : [];

                return muridList.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600">Tidak ada data murid</p>
                  </div>
                ) : (
                  muridList.map((murid) => {
                    const attendance = getAttendanceStatus(murid.id, selectedSesi.id);
                    const isExpanded = expandedMuridId === murid.id;

                    return (
                      <div
                        key={murid.id}
                        className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
                      >
                        <button
                          onClick={() => setExpandedMuridId(isExpanded ? null : murid.id)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{murid.name[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-semibold text-slate-900 truncate">{murid.name}</p>
                              <p className="text-xs text-slate-500 truncate">{murid.nisn}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {attendance && (
                              <Badge variant={getStatusBadgeVariant(attendance.status)} className="text-xs">
                                {attendance.status.toUpperCase()}
                              </Badge>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 space-y-3 bg-white border-t border-slate-200">
                            

                            {attendance && (
                              <>
                                <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-200">
                                  <div>
                                    <span className="text-xs font-semibold text-slate-600 uppercase block mb-1">Waktu</span>
                                    <p className="text-sm text-slate-900 font-mono">
                                      {new Date(attendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-semibold text-slate-600 uppercase block mb-1">Metode</span>
                                    <Badge variant={attendance.method === 'qr' ? 'info' : 'default'} className="text-xs">
                                      {attendance.method === 'qr' ? 'QR Code' : 'Manual'}
                                    </Badge>
                                  </div>
                                </div>

                                {loadingMuridIds.has(murid.id) ? (
                                  <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
                                    <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs">Menyimpan...</span>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onEditAbsensi(attendance)}
                                    className="w-full text-xs py-2 justify-center flex items-center"
                                  >
                                    <Edit size={14} className="mr-2" />
                                    Edit Absensi
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showFilePreview && jurnal?.file && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <FileIcon className="text-blue-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">Preview File</h3>
                  <p className="text-sm text-gray-600">{jurnal?.file.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilePreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {jurnal?.file.type === 'application/pdf' ? (
                <iframe
                  src={jurnal.file.data}
                  className="w-full h-full min-h-[600px] border rounded"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                  <span className="text-6xl">{getFileIcon(jurnal?.file.type || '')}</span>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{jurnal?.file.name}</p>
                    <p className="text-sm text-gray-600 mt-1">Ukuran: {formatFileSize(jurnal?.file.size || 0)}</p>
                    <p className="text-sm text-gray-500 mt-3">
                      Preview tidak tersedia untuk file Word/PowerPoint.
                      Silakan download file untuk melihat isinya.
                    </p>
                  </div>
                  <a
                    href={jurnal?.file.data}
                    download={jurnal?.file.name}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} className="mr-2" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        title={selectedPhoto && selectedSesi ? `Ganti Foto Bukti Mengajar - ${getJadwalInfo(selectedPhoto.jadwalId).mapel}` : 'Ambil Foto'}
      />
    </Modal>
  );
};

export default DetailAbsensiModal;
