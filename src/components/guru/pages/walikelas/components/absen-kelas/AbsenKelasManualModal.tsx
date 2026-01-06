import React, { useRef, useEffect, useState, useMemo } from 'react';
import { CheckCircle, Clock, UserCheck, Camera, MessageCircle, Edit2, Search, X } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { User, Absensi, SesiAbsensi, PengaturanAbsen } from '../../../../../../types';
import Modal from '../../../../../ui/Modal';
import { getDisplayStatusAbsen } from '../../../../../../utils/absenValidationUtils';
import { determineAbsenStatusForMurid, getAbsenStatusBadgeVariant } from './absenKelasStatusHelper';
import { usePengaturanAbsen } from '../../../../../../hooks/usePengaturanAbsen';

interface AbsenKelasManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: 'masuk' | 'pulang' | null;
  session: SesiAbsensi | undefined;
  myKelas: any;
  selectedDate: string;
  isToday: boolean;
  muridKelas: User[];
  refreshKey: number;
  scrollPositionRef: React.MutableRefObject<number>;
  getAttendanceStatus: (muridId: string, sessionType: 'masuk' | 'pulang') => Absensi | null;
  openKeteranganModal: (murid: User, status: 'hadir' | 'izin' | 'sakit' | 'alfa') => void;
  markAttendance: (muridId: string, status: 'hadir' | 'izin' | 'sakit' | 'alfa', keterangan?: string, scrollPosition?: number) => void;
  markAttendanceBatch?: (muridIds: string[], status: 'hadir' | 'izin' | 'sakit' | 'alfa', keterangan?: string) => void;
  sendWhatsAppNotification: (murid: User, status: string, sessionType: string) => void;
}

const AbsenKelasManualModal: React.FC<AbsenKelasManualModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  session,
  myKelas,
  selectedDate,
  isToday,
  muridKelas,
  refreshKey,
  scrollPositionRef,
  getAttendanceStatus,
  openKeteranganModal,
  markAttendance,
  markAttendanceBatch,
  sendWhatsAppNotification
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [keteranganModalOpen, setKeteranganModalOpen] = useState(false);
  const [selectedMuridForKeterangan, setSelectedMuridForKeterangan] = useState<User | null>(null);
  const [customKeterangan, setCustomKeterangan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { activePengaturanAbsen } = usePengaturanAbsen();

  const isSessionClosed = session?.status === 'ditutup';
  const canEdit = isToday || isSessionClosed || !session;

  const filteredMurid = useMemo(() => {
    if (!searchQuery.trim()) return muridKelas;

    const query = searchQuery.toLowerCase().trim();
    return muridKelas.filter(murid =>
      murid.name.toLowerCase().includes(query) ||
      murid.nisn.toLowerCase().includes(query)
    );
  }, [muridKelas, searchQuery]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [refreshKey, scrollPositionRef]);

  const handleMarkAttendance = (muridId: string, status: 'hadir' | 'izin' | 'sakit' | 'alfa', keterangan?: string) => {
    const currentScrollPosition = scrollContainerRef.current?.scrollTop ?? 0;
    markAttendance(muridId, status, keterangan, currentScrollPosition);
  };

  const openCustomKeteranganModal = (murid: User) => {
    setSelectedMuridForKeterangan(murid);

    // Get existing attendance data to populate the form
    if (activeSession) {
      const attendance = getAttendanceStatus(murid.id, activeSession);
      if (attendance && attendance.keterangan) {
        setCustomKeterangan(attendance.keterangan);
      } else {
        setCustomKeterangan('');
      }
    } else {
      setCustomKeterangan('');
    }

    setKeteranganModalOpen(true);
  };

  const closeCustomKeteranganModal = () => {
    setKeteranganModalOpen(false);
    setSelectedMuridForKeterangan(null);
    setCustomKeterangan('');
  };

  const handleSaveKeterangan = () => {
    if (!selectedMuridForKeterangan || !activeSession) return;

    const attendance = getAttendanceStatus(selectedMuridForKeterangan.id, activeSession);
    const currentScrollPosition = scrollContainerRef.current?.scrollTop ?? 0;

    // Jika belum ada record, buat sebagai 'hadir' dengan keterangan
    if (!attendance) {
      markAttendance(
        selectedMuridForKeterangan.id,
        'hadir',
        customKeterangan || `Absen ${activeSession} manual oleh wali kelas - hadir`,
        currentScrollPosition
      );
    } else {
      // Update existing record
      markAttendance(
        selectedMuridForKeterangan.id,
        attendance.status,
        customKeterangan || attendance.keterangan,
        currentScrollPosition
      );
    }
    closeCustomKeteranganModal();
  };

  const handleMarkAllPresent = () => {
    if (!activeSession) return;

    const muridToMarkPresent = muridKelas.filter(murid => {
      const attendance = getAttendanceStatus(murid.id, activeSession);

      // For pulang session, check if student has izin/sakit/alfa from masuk session
      if (activeSession === 'pulang') {
        const masukAttendance = getAttendanceStatus(murid.id, 'masuk');
        // If student has izin/sakit/alfa status at masuk, skip them
        if (masukAttendance && ['izin', 'sakit', 'alfa'].includes(masukAttendance.status)) {
          return false;
        }
      }

      // Only mark as present if they don't have izin/sakit/alfa status in current session
      if (!attendance) return true; // No attendance record yet
      // If has attendance, only mark if status is hadir (allow re-confirmation)
      return attendance.status === 'hadir';
    });

    if (muridToMarkPresent.length === 0) {
      return; // No changes needed
    }

    // Use batch operation if available, otherwise fallback to individual operations
    if (markAttendanceBatch) {
      const muridIds = muridToMarkPresent.map(m => m.id);
      markAttendanceBatch(
        muridIds,
        'hadir',
        `Absen ${activeSession} manual oleh wali kelas - hadir semua`
      );
    } else {
      // Fallback: mark each one individually (less efficient but still works)
      const currentScrollPosition = scrollContainerRef.current?.scrollTop ?? 0;
      muridToMarkPresent.forEach((murid, index) => {
        // Pass scroll position only on the last call
        const isLastCall = index === muridToMarkPresent.length - 1;
        markAttendance(
          murid.id,
          'hadir',
          `Absen ${activeSession} manual oleh wali kelas - hadir semua`,
          isLastCall ? currentScrollPosition : undefined
        );
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Absen Manual - ${activeSession ? activeSession.charAt(0).toUpperCase() + activeSession.slice(1) : ''}`}
      size="xl"
    >
      {activeSession && (
        <div className="space-y-4 sm:space-y-5 pb-12 mb-4">
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div>
                <h4 className="font-semibold text-blue-900 text-sm sm:text-base">
                  Absen {activeSession.charAt(0).toUpperCase() + activeSession.slice(1)} - {myKelas?.name}
                </h4>
                <p className="text-xs sm:text-sm text-blue-700 mt-1">
                  {new Date(selectedDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {!isToday && (
                <div className="inline-flex px-2 sm:px-3 py-1 bg-amber-100 border border-amber-300 rounded text-xs sm:text-sm text-amber-800 font-medium whitespace-nowrap">
                  Riwayat
                </div>
              )}
              {isSessionClosed && (
                <div className="inline-flex px-2 sm:px-3 py-1 bg-blue-100 border border-blue-300 rounded text-xs sm:text-sm text-blue-800 font-medium whitespace-nowrap">
                  Mode Edit
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari murid atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs sm:text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Bersihkan pencarian"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <Button
              variant="success"
              onClick={handleMarkAllPresent}
              className="whitespace-nowrap flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5"
            >
              <CheckCircle size={16} className="mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Hadir Semua</span>
              <span className="sm:hidden">Hadir Semua</span>
            </Button>
          </div>

          {filteredMurid.length !== muridKelas.length && (
            <div className="px-3 sm:px-4 py-2 bg-slate-50 rounded-lg">
              <p className="text-xs sm:text-sm text-slate-600">
                Menampilkan <span className="font-semibold">{filteredMurid.length}</span> dari <span className="font-semibold">{muridKelas.length}</span> murid
              </p>
            </div>
          )}

          {filteredMurid.length === 0 && searchQuery && (
            <div className="p-4 sm:p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-center">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-400" />
              <p className="text-sm sm:text-base font-semibold text-slate-600">Tidak ada hasil</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Tidak ada murid yang sesuai dengan "{searchQuery}"</p>
            </div>
          )}

          

          <div ref={scrollContainerRef} className="max-h-[65vh] overflow-y-auto -mx-4 sm:mx-0">
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Nama</TableCell>
                    <TableCell header>NISN</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Aksi</TableCell>
                    <TableCell header>Ket.</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMurid.map((murid) => {
                    const attendance = getAttendanceStatus(murid.id, activeSession);

                    let displayAttendance = attendance;
                    if (activeSession === 'pulang' && !attendance) {
                      const masukAttendance = getAttendanceStatus(murid.id, 'masuk');
                      if (masukAttendance && ['izin', 'sakit', 'alfa'].includes(masukAttendance.status)) {
                        displayAttendance = masukAttendance;
                      }
                    }

                    return (
                      <TableRow key={`${murid.id}-${refreshKey}`}>
                        <TableCell className="font-semibold text-sm">{murid.name}</TableCell>
                        <TableCell className="text-xs">{murid.nisn}</TableCell>
                        <TableCell>
                          {displayAttendance ? (
                            <>
                              {(() => {
                                const statusInfo = determineAbsenStatusForMurid(displayAttendance, activeSession || 'masuk', activePengaturanAbsen);
                                return (
                                  <Badge variant={getAbsenStatusBadgeVariant(statusInfo.statusAbsen)}>
                                    {statusInfo.displayStatus}
                                  </Badge>
                                );
                              })()}
                            </>
                          ) : (
                            <Badge variant="default">-</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleMarkAttendance(murid.id, 'hadir', `Absen ${activeSession} manual oleh wali kelas - hadir`)}
                              className={`text-xs py-1 ${displayAttendance?.status === 'hadir' ? 'ring-2 ring-offset-1 ring-green-400' : ''}`}
                            >
                              H
                            </Button>
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => handleMarkAttendance(murid.id, 'izin', `Absen ${activeSession} manual oleh wali kelas - izin`)}
                              className={`text-xs py-1 ${displayAttendance?.status === 'izin' ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}
                            >
                              I
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleMarkAttendance(murid.id, 'sakit', `Absen ${activeSession} manual oleh wali kelas - sakit`)}
                              className={`text-xs py-1 ${displayAttendance?.status === 'sakit' ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                            >
                              S
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleMarkAttendance(murid.id, 'alfa', `Absen ${activeSession} manual oleh wali kelas - alfa`)}
                              className={`text-xs py-1 ${displayAttendance?.status === 'alfa' ? 'ring-2 ring-offset-1 ring-red-400' : ''}`}
                            >
                              A
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {attendance && murid.whatsappOrtu && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => sendWhatsAppNotification(murid, attendance.status, activeSession)}
                                className="!p-1 text-xs"
                                title="Kirim WA"
                              >
                                <MessageCircle size={14} />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openCustomKeteranganModal(murid)}
                              className="!p-1 text-xs"
                              title="Keterangan"
                            >
                              <Edit2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="sm:hidden space-y-3 px-4">
              {filteredMurid.map((murid) => {
                const attendance = getAttendanceStatus(murid.id, activeSession);

                let displayAttendance = attendance;
                if (activeSession === 'pulang' && !attendance) {
                  const masukAttendance = getAttendanceStatus(murid.id, 'masuk');
                  if (masukAttendance && ['izin', 'sakit', 'alfa'].includes(masukAttendance.status)) {
                    displayAttendance = masukAttendance;
                  }
                }

                return (
                  <div key={`${murid.id}-${refreshKey}`} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{murid.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{murid.nisn}</p>
                      </div>
                      {displayAttendance ? (
                        <>
                          {(() => {
                            const statusInfo = determineAbsenStatusForMurid(displayAttendance, activeSession || 'masuk', activePengaturanAbsen);
                            return (
                              <Badge variant={getAbsenStatusBadgeVariant(statusInfo.statusAbsen)}>
                                {statusInfo.displayStatus}
                              </Badge>
                            );
                          })()}
                        </>
                      ) : (
                        <Badge variant="default">-</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleMarkAttendance(murid.id, 'hadir', `Absen ${activeSession} manual oleh wali kelas - hadir`)}
                        className={`text-xs py-1.5 ${displayAttendance?.status === 'hadir' ? 'ring-2 ring-green-400' : ''}`}
                      >
                        Hadir
                      </Button>
                      <Button
                        size="sm"
                        variant="warning"
                        onClick={() => handleMarkAttendance(murid.id, 'izin', `Absen ${activeSession} manual oleh wali kelas - izin`)}
                        className={`text-xs py-1.5 ${displayAttendance?.status === 'izin' ? 'ring-2 ring-yellow-400' : ''}`}
                      >
                        Izin
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMarkAttendance(murid.id, 'sakit', `Absen ${activeSession} manual oleh wali kelas - sakit`)}
                        className={`text-xs py-1.5 ${displayAttendance?.status === 'sakit' ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        Sakit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleMarkAttendance(murid.id, 'alfa', `Absen ${activeSession} manual oleh wali kelas - alfa`)}
                        className={`text-xs py-1.5 ${displayAttendance?.status === 'alfa' ? 'ring-2 ring-red-400' : ''}`}
                      >
                        Alfa
                      </Button>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex gap-1">
                      {attendance && murid.whatsappOrtu && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => sendWhatsAppNotification(murid, attendance.status, activeSession)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5"
                        >
                          <MessageCircle size={14} />
                          WA
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openCustomKeteranganModal(murid)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5"
                      >
                        <Edit2 size={14} />
                        Ket.
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {keteranganModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity"
            onClick={closeCustomKeteranganModal}
          ></div>
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 z-50 space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Tambah Keterangan</h3>
              <button
                onClick={closeCustomKeteranganModal}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                title="Tutup"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {selectedMuridForKeterangan && (
              <div className="space-y-4 sm:space-y-5">
                <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">Nama Murid</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900">{selectedMuridForKeterangan.name}</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2">NISN: <span className="font-mono font-semibold">{selectedMuridForKeterangan.nisn}</span></p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Keterangan <span className="text-slate-500 font-normal">(opsional)</span>
                  </label>
                  <textarea
                    value={customKeterangan}
                    onChange={(e) => setCustomKeterangan(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs sm:text-sm resize-none"
                    rows={3}
                    placeholder="Masukkan keterangan tambahan..."
                  />
                  <p className="text-xs text-slate-500 mt-1.5">{customKeterangan.length}/200</p>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-2 border-t border-slate-200">
                  <Button
                    variant="secondary"
                    onClick={closeCustomKeteranganModal}
                    fullWidth
                    className="text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveKeterangan}
                    fullWidth
                    className="text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    Simpan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AbsenKelasManualModal;