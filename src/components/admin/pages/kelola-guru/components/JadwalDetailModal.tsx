import React, { useState, useMemo } from 'react';
import { AlertCircle, Camera, BookOpen, Calendar, Clock, Users, ChevronDown, ChevronUp, User as UserIcon, ZoomIn, Download } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import Button from '../../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { JadwalPelajaran, User, AbsensiPelajaran, FotoMengajar } from '../../../../../types';
import JurnalMengajarCard from './JurnalMengajarCard';
import { useMurid } from '../../../../../hooks/useMurid';
import { useSesiAbsensi } from '../../../../../hooks/useSesiAbsensi';
import { useAbsensiGuru } from '../../../../../hooks/useAbsensiGuru';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../../hooks/useKelas';
import { useJurnal } from '../../../../../hooks/useJurnal';

interface JadwalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJadwal: JadwalPelajaran | null;
  selectedGuru: User | null;
  selectedJadwalDate: string;
  onViewFile: (file: any) => void;
}

const JadwalDetailModal: React.FC<JadwalDetailModalProps> = ({
  isOpen,
  onClose,
  selectedJadwal,
  selectedGuru,
  selectedJadwalDate,
  onViewFile
}) => {
  const [expandedMuridId, setExpandedMuridId] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FotoMengajar | null>(null);

  // Hooks with cache - must be before early return (Rules of Hooks)
  const { murid: allMurid } = useMurid();
  const { sesiAbsensi } = useSesiAbsensi();
  const { absensiGuru } = useAbsensiGuru();
  const { mataPelajaran } = useMataPelajaran();
  const { kelas } = useKelas();
  
  // Fetch jurnal from jurnal collection
  const { jurnal: allJurnal } = useJurnal();

  // Helper functions using cache data
  const getMapelName = (mapelId: string): string => {
    const mapel = mataPelajaran.find(m => m.id === mapelId);
    return mapel?.name || mapelId;
  };

  const getKelasName = (kelasId: string): string => {
    const kelasData = kelas.find(k => k.id === kelasId);
    return kelasData?.name || kelasId;
  };

  // Get students by kelasId from cache
  const muridKelas = useMemo(() => {
    if (!selectedJadwal || !allMurid || !Array.isArray(allMurid)) return [];
    return allMurid
      .filter(u => 
        u.role === 'murid' && 
        (u as any).kelasId === selectedJadwal.kelasId &&
        (u as any).isActive !== false
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMurid, selectedJadwal]);

  // Get jurnal from jurnal collection - must be before early return (Rules of Hooks)
  const jurnal = useMemo(() => {
    if (!selectedJadwal || !selectedJadwalDate) return undefined;
    
    // Find jurnal document for this jadwalId and kelasId
    const jurnalDoc = allJurnal.find(j =>
      j.jadwalId === selectedJadwal.id &&
      j.kelasId === selectedJadwal.kelasId
    );
    
    if (!jurnalDoc) return undefined;
    
    // Check if jurnalDoc has pertemuan array (new structure)
    if (jurnalDoc.pertemuan && Array.isArray(jurnalDoc.pertemuan)) {
      // Find pertemuan with matching tanggal
      const pertemuan = jurnalDoc.pertemuan.find((p: any) => p.tanggal === selectedJadwalDate);
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
    if (jurnalDoc.tanggal === selectedJadwalDate) {
      return jurnalDoc;
    }
    
    return undefined;
  }, [allJurnal, selectedJadwal, selectedJadwalDate]);

  if (!selectedJadwal || !selectedGuru) return null;

  const sesiDibuka = sesiAbsensi.find(s =>
    s.jadwalId === selectedJadwal.id &&
    s.tanggal === selectedJadwalDate &&
    s.createdBy === selectedGuru.id
  );

  const absensiHariIni = absensiGuru.find(a =>
    a.guruId === selectedGuru.id &&
    a.tanggal === selectedJadwalDate
  );

  const fotoMengajar = absensiHariIni?.fotoMengajar?.find(f => f.jadwalId === selectedJadwal.id);

  // Get attendance status helper
  const getAttendanceStatus = (muridId: string): AbsensiPelajaran | undefined => {
    if (!sesiDibuka?.dataAbsensi) return undefined;
    return sesiDibuka.dataAbsensi.find(a => a.muridId === muridId);
  };

  // Badge variant helper
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'hadir': return 'success';
      case 'izin': return 'warning';
      case 'sakit': return 'info';
      case 'alfa': return 'danger';
      case 'terlambat': return 'warning';
      case 'pulang_cepat': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'hadir': return 'Hadir';
      case 'izin': return 'Izin';
      case 'sakit': return 'Sakit';
      case 'alfa': return 'Alfa';
      case 'terlambat': return 'Terlambat';
      case 'pulang_cepat': return 'Pulang Cepat';
      default: return status.toUpperCase();
    }
  };

  const handlePhotoClick = (photo: FotoMengajar) => {
    setSelectedPhoto(photo);
    setShowPhotoPreview(true);
  };

  const handleDownloadPhoto = () => {
    if (!selectedPhoto?.fotoBase64) return;

    const link = document.createElement('a');
    link.href = selectedPhoto.fotoBase64;
    link.download = `bukti-mengajar-${selectedJadwalDate}-${selectedJadwal?.id}.jpg`;
    link.click();
  };


  if (!sesiDibuka) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Detail Jadwal Mengajar"
        size="xl"
      >
        <div className="text-center py-12 sm:py-16">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Sesi Belum Dibuka
          </h3>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
            Guru belum membuka sesi untuk jadwal mengajar ini pada tanggal yang dipilih
          </p>
        </div>
      </Modal>
    );
  }

  const formattedDate = new Date(selectedJadwalDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const shortDate = new Date(selectedJadwalDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Jadwal Mengajar"
      size="xl"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section - Jadwal Info */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border-2 border-blue-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <BookOpen size={24} className="text-white sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                {getMapelName(selectedJadwal.mataPelajaranId)}
              </h3>
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Users size={16} className="text-blue-600 flex-shrink-0" />
                    <span className="font-semibold">{getKelasName(selectedJadwal.kelasId)}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Calendar size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-medium">{shortDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm sm:text-base text-gray-700">
                  <Clock size={16} className="text-purple-600 flex-shrink-0" />
                  <span className="font-medium">
                    {selectedJadwal.jamMulai} - {selectedJadwal.jamSelesai}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Foto Mengajar dan Jurnal Mengajar Section - 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Foto Mengajar Section */}
          {fotoMengajar ? (
            <Card className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                  <Camera size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h5 className="text-sm sm:text-base font-bold text-gray-900">Foto Bukti Mengajar</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Diambil: {new Date(fotoMengajar.waktuFoto).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div 
                className="relative group text-center bg-white rounded-lg p-3 sm:p-4 border-2 border-blue-100 cursor-pointer hover:border-blue-300 transition-all duration-200"
                onClick={() => handlePhotoClick(fotoMengajar)}
              >
                <img
                  src={fotoMengajar.fotoBase64}
                  alt="Bukti Mengajar"
                  className="max-w-full max-h-48 sm:max-h-64 object-contain rounded-lg mx-auto shadow-sm group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center rounded-lg">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-white bg-opacity-90 rounded-full shadow-lg">
                    <ZoomIn size={24} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 group-hover:text-blue-600 transition-colors">
                  Klik untuk melihat preview
                </p>
              </div>
            </Card>
          ) : (
            <div className="hidden lg:block" />
          )}

          {/* Jurnal Mengajar Section */}
          <JurnalMengajarCard
            jurnal={jurnal}
            onViewFile={onViewFile}
          />
        </div>

        {/* Tabel Absensi Pelajaran Murid */}
        <Card className="p-4 sm:p-5 bg-white border-2 border-gray-200 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Users size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h5 className="text-sm sm:text-base font-bold text-gray-900">Absensi Pelajaran Murid</h5>
              <p className="text-xs text-gray-600 mt-0.5">
                {muridKelas.length} murid di kelas {getKelasName(selectedJadwal.kelasId)}
              </p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header className="text-xs sm:text-sm">No</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Nama Murid</TableCell>
                  <TableCell header className="text-xs sm:text-sm">NISN</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Status</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Waktu</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Metode</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {muridKelas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada data murid
                    </TableCell>
                  </TableRow>
                ) : (
                  muridKelas.map((murid, index) => {
                    const attendance = getAttendanceStatus(murid.id);

                    return (
                      <TableRow key={murid.id}>
                        <TableCell className="text-xs sm:text-sm">{index + 1}</TableCell>
                        <TableCell className="text-xs sm:text-sm font-medium">{murid.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-700">
                            {(murid as any).nisn || '-'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {attendance ? (
                            <Badge variant={getStatusBadgeVariant(attendance.status)}>
                              {getStatusLabel(attendance.status)}
                            </Badge>
                          ) : (
                            <Badge variant="default">Belum Absen</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {attendance 
                            ? new Date(attendance.waktu).toLocaleTimeString('id-ID', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                              })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {attendance ? (
                            <Badge variant={attendance.method === 'qr' ? 'info' : 'secondary'} size="sm">
                              {attendance.method === 'qr' ? 'QR Code' : attendance.method === 'manual' ? 'Manual' : 'Admin QR'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {muridKelas.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500 font-medium">Tidak ada data murid</p>
              </div>
            ) : (
              muridKelas.map((murid) => {
                const attendance = getAttendanceStatus(murid.id);
                const isExpanded = expandedMuridId === murid.id;

                return (
                  <div
                    key={murid.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setExpandedMuridId(isExpanded ? null : murid.id)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {murid.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold text-gray-900 truncate">{murid.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            NISN: {(murid as any).nisn || '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {attendance && (
                          <Badge variant={getStatusBadgeVariant(attendance.status)} size="sm">
                            {getStatusLabel(attendance.status)}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-white border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</p>
                            {attendance ? (
                              <Badge variant={getStatusBadgeVariant(attendance.status)}>
                                {getStatusLabel(attendance.status)}
                              </Badge>
                            ) : (
                              <Badge variant="default">Belum Absen</Badge>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Metode</p>
                            {attendance ? (
                              <Badge variant={attendance.method === 'qr' ? 'info' : 'secondary'} size="sm">
                                {attendance.method === 'qr' ? 'QR Code' : attendance.method === 'manual' ? 'Manual' : 'Admin QR'}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Waktu</p>
                            <p className="text-sm text-gray-900">
                              {attendance 
                                ? new Date(attendance.waktu).toLocaleTimeString('id-ID', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })
                                : '-'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
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
                  {new Date(selectedPhoto.waktuFoto).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
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
              {selectedJadwal && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Mata Pelajaran:</span>
                  <span className="font-medium text-slate-900">
                    {getMapelName(selectedJadwal.mataPelajaranId)}
                  </span>
                </div>
              )}
              {selectedJadwal && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Kelas:</span>
                  <span className="font-medium text-slate-900">
                    {getKelasName(selectedJadwal.kelasId)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              
              <Button
                onClick={handleDownloadPhoto}
                className="flex-1 flex items-center justify-center"
              >
                <Download size={18} className="mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default JadwalDetailModal;
