import React, { useState, useMemo, useEffect } from 'react';
import { Camera, QrCode, Eye, MessageCircle, CreditCard as Edit, CheckCircle2, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { SesiAbsensi, User, JadwalPelajaran, AbsensiPelajaran, SuratIzin, MataPelajaran } from '../../../../../../types';

interface AbsensiManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSesi: SesiAbsensi | null;
  getJadwalInfo: (jadwalId: string) => { kelas: string; mapel: string };
  onScanQR: () => void;
  onShowSubjectQR: (sesi: SesiAbsensi) => void;
  jadwalPelajaran: JadwalPelajaran[];
  getMuridsByKelas: (kelasId: string) => User[];
  getAttendanceStatus: (muridId: string, sesiId: string) => AbsensiPelajaran | undefined;
  getSuratIzinForMurid: (muridId: string, jadwalId?: string) => SuratIzin | undefined;
  handleViewSuratDetail: (surat: SuratIzin) => void;
  handleMarkWithSurat: (muridId: string, surat: SuratIzin) => void;
  markAttendance: (muridId: string, status: 'hadir' | 'izin' | 'sakit' | 'alfa', keterangan?: string) => void;
  sendWhatsAppNotification: (murid: User, status: string, mataPelajaran: string) => void;
  openInputKeteranganModal: (murid: User) => void;
  refreshKey: number;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  mataPelajaran: MataPelajaran[];
  markAllPresent: () => void;
  loadingMuridIds?: Set<string>;
  isBulkLoading: boolean;
}

const AbsensiManualModal: React.FC<AbsensiManualModalProps> = ({
  isOpen,
  onClose,
  selectedSesi,
  getJadwalInfo,
  onScanQR,
  onShowSubjectQR,
  jadwalPelajaran,
  getMuridsByKelas,
  getAttendanceStatus,
  getSuratIzinForMurid,
  handleViewSuratDetail,
  handleMarkWithSurat,
  markAttendance,
  sendWhatsAppNotification,
  openInputKeteranganModal,
  refreshKey,
  scrollContainerRef,
  mataPelajaran,
  markAllPresent,
  loadingMuridIds,
  isBulkLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMuridId, setExpandedMuridId] = useState<string | null>(null);
  const [autoSavedSesiId, setAutoSavedSesiId] = useState<string | null>(null);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Auto-save absensi for murid with surat izin/sakit/izin_dispen
  useEffect(() => {
    if (!isOpen || !selectedSesi) {
      // Reset auto-saved sesi when modal closes
      if (!isOpen) {
        setAutoSavedSesiId(null);
      }
      return;
    }

    // Only auto-save once per sesi
    if (autoSavedSesiId === selectedSesi.id) return;

    const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId);
    if (!jadwal) return;

    const muridList = getMuridsByKelas(jadwal.kelasId);
    
    // Check each murid and auto-save if they have surat izin but no attendance yet
    let hasAutoSaved = false;
    muridList.forEach((murid) => {
      const suratAktif = getSuratIzinForMurid(murid.id, selectedSesi.jadwalId);
      const attendance = getAttendanceStatus(murid.id, selectedSesi.id);
      
      // If murid has surat izin but no attendance yet, auto-save
      if (suratAktif && !attendance) {
        // Use handleMarkWithSurat to automatically mark attendance based on surat
        handleMarkWithSurat(murid.id, suratAktif);
        hasAutoSaved = true;
      }
    });

    // Mark this sesi as auto-saved
    if (hasAutoSaved) {
      setAutoSavedSesiId(selectedSesi.id);
    }
  }, [isOpen, selectedSesi, jadwalPelajaran, getMuridsByKelas, getSuratIzinForMurid, getAttendanceStatus, handleMarkWithSurat, autoSavedSesiId]);

  const filteredMurid = useMemo(() => {
    if (!selectedSesi) return [];

    const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi.jadwalId);
    let muridList = jadwal ? getMuridsByKelas(jadwal.kelasId) : [];

    // Filter by search query if exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      muridList = muridList.filter(murid =>
        murid.name.toLowerCase().includes(query) ||
        murid.nisn.toLowerCase().includes(query)
      );
    }

    // Sort: murid dengan surat izin/sakit/izin_dispen di atas
    return muridList.sort((a, b) => {
      const suratA = getSuratIzinForMurid(a.id, selectedSesi.jadwalId);
      const suratB = getSuratIzinForMurid(b.id, selectedSesi.jadwalId);
      
      // Jika A punya surat dan B tidak, A di atas
      if (suratA && !suratB) return -1;
      // Jika B punya surat dan A tidak, B di atas
      if (!suratA && suratB) return 1;
      // Jika keduanya punya atau tidak punya, urutkan berdasarkan nama
      return a.name.localeCompare(b.name);
    });
  }, [selectedSesi, jadwalPelajaran, getMuridsByKelas, searchQuery, getSuratIzinForMurid]);

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'hadir': return 'success';
      case 'izin': return 'warning';
      case 'sakit': return 'info';
      case 'alfa': return 'danger';
      default: return 'default';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Absensi Manual"
      size="xl"
    >
      {selectedSesi && (
        <div className="space-y-4 sm:space-y-5 pb-12 mb-4 sm:pb-12 sm:mb-4">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg sm:rounded-xl text-white shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h4 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">
                  {getJadwalInfo(selectedSesi.jadwalId).mapel}
                </h4>
                <p className="text-sm sm:text-base text-white/90 mb-1">
                  {getJadwalInfo(selectedSesi.jadwalId).kelas}
                </p>
                <p className="text-xs sm:text-sm text-white/80">
                  Sesi: {selectedSesi.jamBuka} - {selectedSesi.jamTutup || 'Aktif'}
                </p>
              </div>
              <Badge variant={selectedSesi.status === 'dibuka' ? 'success' : 'info'} className="w-fit">
                {selectedSesi.status === 'dibuka' ? 'Sesi Aktif' : 'Sesi Ditutup'}
              </Badge>
            </div>
            {selectedSesi.status === 'ditutup' && (
              <div className="mt-3 p-2.5 sm:p-3 bg-white/20 rounded-lg border border-white/30">
                <p className="text-xs sm:text-sm text-white">
                  ℹ️ Mode edit - Sesi telah ditutup. Anda dapat mengedit data absensi.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {filteredMurid.length !== getMuridsByKelas(jadwalPelajaran.find(j => j.id === selectedSesi?.jadwalId)?.id || '')?.length && (
              <div className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                {filteredMurid.length} dari {getMuridsByKelas(jadwalPelajaran.find(j => j.id === selectedSesi?.jadwalId)?.id || '')?.length}
              </div>
            )}
          </div>

          <div className="flex flex-col-1 lg:flex-row gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={markAllPresent}
              disabled={isBulkLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm py-2 sm:py-2.5 flex-1 lg:flex-none flex items-center justify-center"
            >
              {isBulkLoading ? (
                <>
                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="mr-1.5" />
                  Hadir Semua
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onShowSubjectQR(selectedSesi)}
              disabled={selectedSesi.status !== 'dibuka'}
              className="text-xs sm:text-sm py-2 sm:py-2.5 flex-1 lg:flex-none  flex items-center justify-center"
            >
              <QrCode size={14} className="mr-1.5" />
              QR Mapel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={onScanQR}
              disabled={selectedSesi.status !== 'dibuka'}
              className="text-xs sm:text-sm py-2 sm:py-2.5 flex-1 lg:flex-none  flex items-center justify-center"
            >
              <Camera size={14} className="mr-1.5" />
              Scan QR
            </Button>
            
          </div>

          {filteredMurid.length === 0 && searchQuery && (
            <div className="p-4 sm:p-5 bg-slate-50 rounded-lg sm:rounded-xl text-center border border-slate-200">
              <p className="text-xs sm:text-sm text-slate-600">Tidak ada murid sesuai pencarian "{searchQuery}"</p>
            </div>
          )}

          {/* Desktop Table View */}
          <div ref={scrollContainerRef} className="hidden lg:block max-h-96 overflow-y-auto rounded-lg sm:rounded-xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header className="text-xs sm:text-sm">Nama Murid</TableCell>
                  <TableCell header className="text-xs sm:text-sm">NISN</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Status</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Aksi</TableCell>
                  <TableCell header className="text-xs sm:text-sm">Keterangan</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMurid.map((murid) => {
                  const attendance = getAttendanceStatus(murid.id, selectedSesi.id);
                  const suratAktif = getSuratIzinForMurid(murid.id, selectedSesi.jadwalId);

                  return (
                    <TableRow key={`${murid.id}-${refreshKey}`}>
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
                      <TableCell>
                        {loadingMuridIds?.has(murid.id) ? (
                          <div className="flex items-center justify-center gap-2 text-blue-600">
                            <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Menyimpan...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1">
                            {suratAktif ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleViewSuratDetail(suratAktif)}
                                  className="text-xs py-1 px-2"
                                >
                                  <Eye size={12} className="mr-0.5" />
                                  Lihat
                                </Button>
                                {!attendance ? (
                                  <Button
                                    size="sm"
                                    variant={suratAktif.jenis === 'izin' || suratAktif.jenis === 'izin_dispen' ? 'warning' : 'primary'}
                                    onClick={() => handleMarkWithSurat(murid.id, suratAktif)}
                                    disabled={selectedSesi.status !== 'dibuka'}
                                    className="text-xs py-1 px-2 col-span-3"
                                  >
                                    {suratAktif.jenis === 'izin_dispen' ? 'Dispen' : suratAktif.jenis === 'izin' ? 'Izin' : 'Sakit'}
                                  </Button>
                                ) : (
                                  <div className="col-span-3"></div>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => markAttendance(murid.id, 'hadir', 'Absen masuk manual oleh wali kelas - hadir')}
                                  disabled={loadingMuridIds?.has(murid.id)}
                                  className={`text-xs py-1 px-2 ${attendance?.status === 'hadir' ? 'ring-2 ring-green-400' : attendance && attendance.status !== 'alfa' ? 'opacity-50' : ''}`}
                                >
                                  Hadir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="warning"
                                  onClick={() => markAttendance(murid.id, 'izin', 'Absen masuk manual oleh wali kelas - izin')}
                                  disabled={loadingMuridIds?.has(murid.id)}
                                  className={`text-xs py-1 px-2 ${attendance?.status === 'izin' ? 'ring-2 ring-yellow-400' : attendance && attendance.status !== 'alfa' ? 'opacity-50' : ''}`}
                                >
                                  Izin
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => markAttendance(murid.id, 'sakit', 'Absen masuk manual oleh wali kelas - sakit')}
                                  disabled={loadingMuridIds?.has(murid.id)}
                                  className={`text-xs py-1 px-2 ${attendance?.status === 'sakit' ? 'ring-2 ring-blue-400' : attendance && attendance.status !== 'alfa' ? 'opacity-50' : ''}`}
                                >
                                  Sakit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => markAttendance(murid.id, 'alfa', 'Absen masuk manual oleh wali kelas - alfa')}
                                  disabled={loadingMuridIds?.has(murid.id)}
                                  className={`text-xs py-1 px-2 ${attendance?.status === 'alfa' ? 'ring-2 ring-red-400' : attendance && attendance.status !== 'alfa' ? 'opacity-50' : ''}`}
                                >
                                  Alfa
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openInputKeteranganModal(murid)}
                          disabled={!attendance}
                          className="text-xs py-1 px-2 flex items-center justify-center"
                        >
                          <Edit size={12} className="mr-0.5" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredMurid.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-600">Tidak ada murid</p>
              </div>
            ) : (
              filteredMurid.map((murid) => {
                const attendance = getAttendanceStatus(murid.id, selectedSesi.id);
                const suratAktif = getSuratIzinForMurid(murid.id, selectedSesi.jadwalId);
                const isExpanded = expandedMuridId === murid.id;

                return (
                  <div
                    key={`${murid.id}-${refreshKey}`}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => setExpandedMuridId(isExpanded ? null : murid.id)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          suratAktif 
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                            : 'bg-gradient-to-br from-blue-400 to-cyan-500'
                        }`}>
                          <span className="text-xs font-bold text-white">{murid.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate">{murid.name}</p>
                            
                          </div>
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
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <span className="text-xs font-semibold text-slate-600 uppercase">Status</span>
                          <div>
                            {attendance ? (
                              <Badge variant={getStatusBadgeVariant(attendance.status)}>
                                {attendance.status.toUpperCase()}
                              </Badge>
                            ) : (
                              <Badge variant="default">Belum Absen</Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Aksi</p>
                          {loadingMuridIds?.has(murid.id) ? (
                            <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
                              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs">Menyimpan...</span>
                            </div>
                          ) : (
                            suratAktif ? (
                              <div className="space-y-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleViewSuratDetail(suratAktif)}
                                  className="w-full text-xs py-2 flex items-center justify-center"
                                >
                                  <Eye size={14} className="mr-2" />
                                  Lihat Surat
                                </Button>
                                {!attendance && (
                                  <Button
                                    size="sm"
                                    variant={suratAktif.jenis === 'izin' || suratAktif.jenis === 'izin_dispen' ? 'warning' : 'info'}
                                    onClick={() => handleMarkWithSurat(murid.id, suratAktif)}
                                    disabled={selectedSesi.status !== 'dibuka'}
                                    className="w-full text-xs py-2"
                                  >
                                    {suratAktif.jenis === 'izin_dispen' ? 'Izin Dispen' : suratAktif.jenis === 'izin' ? 'Izin' : 'Sakit'}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => markAttendance(murid.id, 'hadir', 'Absen masuk manual oleh wali kelas - hadir')}
                                  disabled={loadingMuridIds?.has(murid.id)}
                                  className={`text-xs py-2 ${attendance?.status === 'hadir' ? 'ring-2 ring-green-400' : attendance && attendance.status !== 'alfa' ? 'opacity-50' : ''}`}
                                >
                                  Hadir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="warning"
                                  onClick={() => markAttendance(murid.id, 'izin', 'Absen masuk manual oleh wali kelas - izin')}
                                  disabled={loadingMuridIds?.has(murid.id)}
                                  className={`text-xs py-2 ${attendance?.status === 'izin' ? 'ring-2 ring-yellow-400' : attendance && attendance.status !== 'alfa' ? 'opacity-50' : ''}`}
                                >
                                  Izin
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => markAttendance(murid.id, 'sakit', 'Absen masuk manual oleh wali kelas - sakit')}
                                  disabled={loadingMuridIds?.has(murid.id)}
                                  className={`text-xs py-2 ${attendance?.status === 'sakit' ? 'ring-2 ring-blue-400' : attendance && attendance.status !== 'alfa' ? 'opacity-50' : ''}`}
                                >
                                  Sakit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => markAttendance(murid.id, 'alfa', 'Absen masuk manual oleh wali kelas - alfa')}
                                  disabled={loadingMuridIds?.has(murid.id)}
                                  className={`text-xs py-2 ${attendance?.status === 'alfa' ? 'ring-2 ring-red-400' : attendance && attendance.status !== 'alfa' ? 'opacity-50' : ''}`}
                                >
                                  Alfa
                                </Button>
                              </div>
                            )
                          )}
                        </div>

                        {attendance && (
                          <div className="pt-3 border-t border-slate-200">
                            <div className="grid grid-cols-2 gap-2">
                              
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openInputKeteranganModal(murid)}
                                className={`text-xs py-2 flex items-center justify-center ${!murid.whatsappOrtu ? 'col-span-2' : ''}`}
                              >
                                <Edit size={14} className="mr-2" />
                                Input Keterangan
                              </Button>
                              {murid.whatsappOrtu && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => {
                                    const jadwal = jadwalPelajaran.find(j => j.id === selectedSesi?.jadwalId);
                                    const mapel = mataPelajaran.find(m => m.id === jadwal?.mataPelajaranId);
                                    sendWhatsAppNotification(murid, attendance.status, mapel?.name || 'Unknown');
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-xs py-2 flex items-center justify-center"
                                >
                                  <MessageCircle size={14} className="mr-2" />
                                  Notifikasi WA Ortu
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AbsensiManualModal;
