import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { User, Nilai, Absensi, SesiAbsensi, NilaiTugas, JadwalPelajaran, TahunAjaran, KomponenNilai } from '../../../../../../types';
import {
  calculateKehadiran,
  calculateRataTugas,
  getGradeColor,
  calculateRataKomponen,
  getMaxTugasInfo,
  getMaxKomponenDinamisInfo
} from '../../../../../../utils/nilaiUtils';
import { useKomponenNilai } from '../../../../../../hooks/useKomponenNilai';

const DEFAULT_KOMPONEN_NILAI: KomponenNilai = {
  kehadiran: 20,
  tugas: 30,
  uts: 25,
  uas: 25,
};

interface DetailNilaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  selectedMapel: string;
  selectedKelas: string;
  nilai: Nilai[];
  absensi: Absensi[];
  sesiAbsensi: SesiAbsensi[];
  jadwalPelajaran: JadwalPelajaran[];
  activeTahunAjaran: TahunAjaran;
  guruId: string;
  onInputNilai: (murid: User, type: 'tugas' | 'uts' | 'uas') => void;
  onEditTugas: (murid: User, tugas: NilaiTugas) => void;
  onDeleteTugas: (murid: User, tugasId: string) => void;
  onEditKomponen?: (murid: User, komponen: any) => void;
  onDeleteKomponen?: (murid: User, komponenId: string) => void;
  getNilaiMurid: (muridId: string, mapelId: string, kelasId: string) => Nilai | undefined;
  getMapelName: (mapelId: string) => string;
  getKelasName: (kelasId: string) => string;
  isEditingLocked?: boolean;
}

const DetailNilaiModal: React.FC<DetailNilaiModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  selectedMapel,
  selectedKelas,
  nilai,
  absensi,
  sesiAbsensi,
  jadwalPelajaran,
  activeTahunAjaran,
  guruId,
  onInputNilai,
  onEditTugas,
  onDeleteTugas,
  onEditKomponen,
  onDeleteKomponen,
  getNilaiMurid,
  getMapelName,
  getKelasName,
  isEditingLocked = false
}) => {
  const { komponenNilai: semuaKomponen } = useKomponenNilai();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Get all nilai for the same class and subject to calculate max counts
  // Must be before early return to maintain hook order
  const nilaiKelas = useMemo(() => {
    if (!selectedMapel || !selectedKelas || !activeTahunAjaran) return [];
    return nilai.filter(n => 
      n.mataPelajaranId === selectedMapel && 
      n.kelasId === selectedKelas &&
      n.semester === activeTahunAjaran.semester &&
      n.tahunAjaran === activeTahunAjaran.tahun
    );
  }, [nilai, selectedMapel, selectedKelas, activeTahunAjaran]);

  // Get max tugas info
  const { maxCount: maxTugasCount, uniqueTugasNames } = useMemo(() => 
    getMaxTugasInfo(nilaiKelas), 
    [nilaiKelas]
  );

  // Get max komponen dinamis info
  const maxKomponenDinamisInfo = useMemo(() => 
    getMaxKomponenDinamisInfo(nilaiKelas), 
    [nilaiKelas]
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  if (!selectedMurid) return null;

  const nilaiMurid = getNilaiMurid(selectedMurid.id, selectedMapel, selectedKelas);
  const kehadiran = calculateKehadiran(
    selectedMurid.id,
    selectedMapel,
    selectedKelas,
    guruId,
    activeTahunAjaran.semester,
    activeTahunAjaran.tahun,
    absensi,
    sesiAbsensi,
    jadwalPelajaran
  );

  const rataTugas = nilaiMurid ? calculateRataTugas(nilaiMurid.tugas, maxTugasCount, uniqueTugasNames) : 0;

  const getKomponenDisplay = (nama: string) => {
    if (nama === 'Kehadiran') return kehadiran;
    if (nama === 'Tugas') return rataTugas;
    if (nama === 'UTS') return nilaiMurid?.uts ?? null;
    if (nama === 'UAS') return nilaiMurid?.uas ?? null;
    const kompDinamis = nilaiMurid?.komponenDinamis?.filter(k => k.komponenNama === nama) ?? [];
    const maxCount = maxKomponenDinamisInfo[nama] || null;
    return kompDinamis.length > 0 ? calculateRataKomponen(kompDinamis, maxCount) : null;
  };

  const getKomponenColor = (index: number) => {
    const colors = [
      'bg-blue-50',
      'bg-emerald-50',
      'bg-orange-50',
      'bg-rose-50',
      'bg-amber-50',
      'bg-cyan-50',
      'bg-violet-50',
      'bg-lime-50'
    ];
    return colors[index % colors.length];
  };

  const getKomponenTextColor = (index: number) => {
    const colors = [
      'text-blue-600',
      'text-emerald-600',
      'text-orange-600',
      'text-rose-600',
      'text-amber-600',
      'text-cyan-600',
      'text-violet-600',
      'text-lime-600'
    ];
    return colors[index % colors.length];
  };

  const getKomponenBorderColor = (index: number) => {
    const colors = [
      'text-blue-700',
      'text-emerald-700',
      'text-orange-700',
      'text-rose-700',
      'text-amber-700',
      'text-cyan-700',
      'text-violet-700',
      'text-lime-700'
    ];
    return colors[index % colors.length];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Nilai - ${selectedMurid.name}`}
      size="xl"
    >
      <div className="space-y-4 md:space-y-6">
        {/* Student Info */}
        <div className="p-3 md:p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs sm:text-sm md:text-base">
            <div className="space-y-1">
              <p className="text-slate-600 font-medium">Nama Siswa</p>
              <p className="font-semibold text-slate-900">{selectedMurid.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-600 font-medium">NISN</p>
              <p className="font-semibold text-slate-900">{selectedMurid.nisn}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-600 font-medium">Mata Pelajaran</p>
              <p className="font-semibold text-slate-900">{getMapelName(selectedMapel)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-600 font-medium">Kelas</p>
              <p className="font-semibold text-slate-900">{getKelasName(selectedKelas)}</p>
            </div>
          </div>
        </div>

        {/* Komponen Nilai */}
        <div className="space-y-3">
          <h3 className="text-sm md:text-base font-semibold text-slate-900">Komponen Nilai</h3>
          <div className={`grid gap-2 md:gap-3 ${semuaKomponen.length <= 4 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : semuaKomponen.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
            {semuaKomponen.map((komp, index) => {
              const nilai = getKomponenDisplay(komp.nama);
              const isNumeric = nilai !== null && !isNaN(Number(nilai));
              const displayValue = isNumeric ? Number(nilai).toFixed(1) : '-';
              const skorNilai = isNumeric && komp.persentase ? ((Number(nilai) / 100) * komp.persentase).toFixed(1) : '0';

              return (
                <div key={komp.id} className={`p-2.5 md:p-3 ${getKomponenColor(index)} rounded-lg text-center border border-slate-200 shadow-xs hover:shadow-sm transition-shadow`}>
                  <div className={`text-base md:text-lg font-bold ${getKomponenTextColor(index)}`}>
                    {komp.nama === 'Kehadiran' ? `${displayValue}%` : displayValue}
                  </div>
                  <div className={`text-xs md:text-sm font-medium ${getKomponenBorderColor(index)}`}>{komp.nama}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {skorNilai} poin
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Grade */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 via-blue-50 to-slate-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="text-center space-y-2 md:space-y-3">
            <p className="text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wide">Nilai Akhir</p>
            <div className="text-3xl md:text-5xl font-bold text-blue-600">
              {nilaiMurid?.nilaiAkhir !== null ? nilaiMurid?.nilaiAkhir?.toFixed(1) : '-'}
            </div>
            {nilaiMurid?.grade && (
              <div className={`inline-block px-3 md:px-5 py-1.5 md:py-2 rounded-full text-sm md:text-base font-bold ${getGradeColor(nilaiMurid.grade)}`}>
                Grade {nilaiMurid.grade}
              </div>
            )}
          </div>
        </div>

        {/* Detail Tugas */}
        {nilaiMurid && nilaiMurid.tugas.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection('tugas')}
              className="w-full flex justify-between items-center p-3 md:p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h4 className="text-sm md:text-base font-semibold text-slate-900">Detail Tugas</h4>
                <Badge variant="default" className="text-xs">{nilaiMurid.tugas.length}</Badge>
              </div>
              {expandedSections['tugas'] ? (
                <ChevronUp size={20} className="text-slate-600" />
              ) : (
                <ChevronDown size={20} className="text-slate-600" />
              )}
            </button>
            {expandedSections['tugas'] && (
              <div className="border-t border-slate-200">
                <div className="flex justify-between items-center p-3 md:p-4 bg-white border-b border-slate-100">
                  <p className="text-xs md:text-sm text-slate-600 font-medium">Total: {nilaiMurid.tugas.length} tugas</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      onClose();
                      onInputNilai(selectedMurid, 'tugas');
                    }}
                    disabled={isEditingLocked}
                    title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                    className="flex items-center text-xs md:text-sm"
                  >
                    <Plus size={16} className="mr-1" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-0 divide-y divide-slate-100">
                  {nilaiMurid.tugas.map((tugas) => (
                    <div key={tugas.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-white hover:bg-slate-50 transition-colors gap-3 sm:gap-2">
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm md:text-base text-slate-900">{tugas.nama}</span>
                          <Badge variant="success" className="text-xs md:text-sm">{tugas.nilai}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(tugas.tanggal).toLocaleDateString('id-ID')}
                        </div>
                        {tugas.keterangan && (
                          <div className="text-xs text-slate-600 mt-1.5 italic">
                            &quot;{tugas.keterangan}&quot;
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            onClose();
                            onEditTugas(selectedMurid, tugas);
                          }}
                          className="flex-1 sm:flex-none p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title={isEditingLocked ? 'Edit nilai dikunci - Raport sudah disebarkan' : 'Edit Tugas'}
                          disabled={isEditingLocked}
                        >
                          <Edit className="mr-1" size={16} /> Edit
                        </button>
                        <button
                          onClick={() => onDeleteTugas(selectedMurid, tugas.id)}
                          className="flex-1 sm:flex-none p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title={isEditingLocked ? 'Hapus nilai dikunci - Raport sudah disebarkan' : 'Hapus Tugas'}
                          disabled={isEditingLocked}
                        >
                          <Trash2 className="mr-1" size={16} /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Komponen Nilai Dinamis */}
        {nilaiMurid && nilaiMurid.komponenDinamis && nilaiMurid.komponenDinamis.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection('komponen')}
              className="w-full flex justify-between items-center p-3 md:p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h4 className="text-sm md:text-base font-semibold text-slate-900">Komponen Nilai Tambahan</h4>
                <Badge variant="default" className="text-xs">
                  {semuaKomponen.filter(k => !['Tugas', 'Kehadiran', 'UTS', 'UAS'].includes(k.nama)).length}
                </Badge>
              </div>
              {expandedSections['komponen'] ? (
                <ChevronUp size={20} className="text-slate-600" />
              ) : (
                <ChevronDown size={20} className="text-slate-600" />
              )}
            </button>
            {expandedSections['komponen'] && (
              <div className="border-t border-slate-200 divide-y divide-slate-200">
                {semuaKomponen.filter(k => !['Tugas', 'Kehadiran', 'UTS', 'UAS'].includes(k.nama)).map((komp) => {
                  const kompValues = nilaiMurid.komponenDinamis?.filter(kd => kd.komponenNama === komp.nama) ?? [];
                  if (kompValues.length === 0) return null;

                  if (komp.hasNilai) {
                    return (
                      <div key={komp.id} className="p-3 md:p-4 bg-white">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <h5 className="font-semibold text-sm md:text-base text-slate-900">{komp.nama}</h5>
                          <Button
                            size="sm"
                            onClick={() => {
                              onClose();
                              onInputNilai(selectedMurid, komp.nama as 'tugas' | 'uts' | 'uas');
                            }}
                            disabled={isEditingLocked}
                            title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                            className="flex items-center text-xs md:text-sm whitespace-nowrap"
                          >
                            <Plus size={14} className="mr-1" />
                            Tambah
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {kompValues.map((val) => (
                            <div key={val.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors gap-2 sm:gap-1">
                              <div className="flex-1 min-w-0 w-full sm:w-auto">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-xs md:text-sm text-slate-900">{val.komponenNama}</span>
                                  <Badge variant="success" className="text-xs">{val.nilai}</Badge>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {new Date(val.tanggal).toLocaleDateString('id-ID')}
                                </div>
                                {val.keterangan && (
                                  <div className="text-xs text-slate-600 mt-1 italic">
                                    &quot;{val.keterangan}&quot;
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 w-full sm:w-auto">
                                <button
                                  onClick={() => {
                                    onClose();
                                    onEditKomponen?.(selectedMurid, val);
                                  }}
                                  className="flex-1 sm:flex-none p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                  title={isEditingLocked ? 'Edit nilai dikunci - Raport sudah disebarkan' : `Edit ${val.komponenNama}`}
                                  disabled={isEditingLocked}
                                >
                                  <Edit className="mr-1" size={14} /> Edit
                                </button>
                                <button
                                  onClick={() => onDeleteKomponen?.(selectedMurid, val.id)}
                                  className="flex-1 sm:flex-none p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                  title={isEditingLocked ? 'Hapus nilai dikunci - Raport sudah disebarkan' : `Hapus ${val.komponenNama}`}
                                  disabled={isEditingLocked}
                                >
                                  <Trash2 className="mr-1" size={14} /> Hapus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else {
                    const kompValue = kompValues[0];
                    return (
                      <div key={komp.id} className="p-3 md:p-4 bg-white">
                        <h5 className="font-semibold text-sm md:text-base text-slate-900 mb-3">{komp.nama}</h5>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors gap-2 sm:gap-1">
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-xs md:text-sm text-slate-900">{komp.nama}</span>
                              <Badge variant="success" className="text-xs">{kompValue?.nilai || '-'}</Badge>
                            </div>
                            {kompValue && (
                              <>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {new Date(kompValue.tanggal).toLocaleDateString('id-ID')}
                                </div>
                                {kompValue.keterangan && (
                                  <div className="text-xs text-slate-600 mt-1 italic">
                                    &quot;{kompValue.keterangan}&quot;
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {kompValue && (
                            <div className="flex gap-1 w-full sm:w-auto">
                              <button
                                onClick={() => {
                                  onClose();
                                  onEditKomponen?.(selectedMurid, kompValue);
                                }}
                                className="flex-1 sm:flex-none p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                title={isEditingLocked ? 'Edit nilai dikunci - Raport sudah disebarkan' : `Edit ${komp.nama}`}
                                disabled={isEditingLocked}
                              >
                                <Edit className="mr-1" size={14} />Edit
                              </button>
                              <button
                                onClick={() => onDeleteKomponen?.(selectedMurid, kompValue.id)}
                                className="flex-1 sm:flex-none p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                title={isEditingLocked ? 'Hapus nilai dikunci - Raport sudah disebarkan' : `Hapus ${komp.nama}`}
                                disabled={isEditingLocked}
                              >
                                <Trash2 className="mr-1" size={14} />Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="pb-14 sm:pb-0 grid grid-cols-2 gap-2 md:gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="warning"
            onClick={() => {
              onClose();
              onInputNilai(selectedMurid, 'uts');
            }}
            fullWidth
            disabled={isEditingLocked}
            title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
            className="flex items-center justify-center text-xs md:text-sm"
          >
            <Edit size={16} className="mr-1.5 md:mr-2" />
            {nilaiMurid?.uts != null ? 'Edit UTS' : 'Input UTS'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              onInputNilai(selectedMurid, 'uas');
            }}
            fullWidth
            disabled={isEditingLocked}
            title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
            className="flex items-center justify-center text-xs md:text-sm"
          >
            <Edit size={16} className="mr-1.5 md:mr-2" />
            {nilaiMurid?.uas != null ? 'Edit UAS' : 'Input UAS'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DetailNilaiModal;