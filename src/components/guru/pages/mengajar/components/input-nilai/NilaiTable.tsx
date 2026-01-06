import React, { useState, useMemo } from 'react';
import { Plus,  Edit, Eye, Users, Search, X, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import Button from '../../../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { User, Nilai, Absensi, SesiAbsensi, TahunAjaran, JadwalPelajaran, KomponenNilai } from '../../../../../../types';
import { calculateKehadiran, calculateRataTugas, getGradeColor, getMaxTugasInfo, getMaxKomponenDinamisInfo, calculateRataKomponen, getSemuaKomponenNilai } from '../../../../../../utils/nilaiUtils';
import { useKomponenNilai } from '../../../../../../hooks/useKomponenNilai';
import { exportToPDF, exportToExcel } from '../../../../../../utils/exportUtils';

interface NilaiTableProps {
  muridList: User[];
  selectedMapel: string;
  selectedKelas: string;
  nilai: Nilai[];
  absensi: Absensi[];
  sesiAbsensi: SesiAbsensi[];
  activeTahunAjaran: TahunAjaran;
  jadwalPelajaran: JadwalPelajaran[];
  guruId: string;
  onInputNilai: (murid: User, type: string) => void;
  onEditKomponen?: (murid: User, komponen: any) => void;
  onViewDetail: (murid: User) => void;
  getNilaiMurid: (muridId: string, mapelId: string, kelasId: string) => Nilai | undefined;
  getMapelName: (mapelId: string) => string;
  getKelasName: (kelasId: string) => string;
  isEditingLocked?: boolean;
  isKomponenTunggal?: (komponenNama: string) => boolean;
}

const DEFAULT_KOMPONEN_NILAI: KomponenNilai = {
  kehadiran: 20,
  tugas: 30,
  uts: 25,
  uas: 25,
};

const NilaiTable: React.FC<NilaiTableProps> = ({
  muridList,
  selectedMapel,
  selectedKelas,
  nilai,
  absensi,
  sesiAbsensi,
  activeTahunAjaran,
  jadwalPelajaran,
  guruId,
  onInputNilai,
  onEditKomponen,
  onViewDetail,
  getNilaiMurid,
  getMapelName,
  getKelasName,
  isEditingLocked = false,
  isKomponenTunggal
}) => {
  const { komponenNilai: semuaKomponen } = useKomponenNilai();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Derive komponen from database data
  const komponen = useMemo(() => {
    if (!semuaKomponen || semuaKomponen.length === 0) return DEFAULT_KOMPONEN_NILAI;
    return {
      kehadiran: semuaKomponen.find(k => k.nama === 'Kehadiran')?.persentase ?? DEFAULT_KOMPONEN_NILAI.kehadiran,
      tugas: semuaKomponen.find(k => k.nama === 'Tugas')?.persentase ?? DEFAULT_KOMPONEN_NILAI.tugas,
      uts: semuaKomponen.find(k => k.nama === 'UTS')?.persentase ?? DEFAULT_KOMPONEN_NILAI.uts,
      uas: semuaKomponen.find(k => k.nama === 'UAS')?.persentase ?? DEFAULT_KOMPONEN_NILAI.uas,
    };
  }, [semuaKomponen]);

  const filteredMurid = useMemo(() => {
    if (!searchQuery.trim()) return muridList;

    const query = searchQuery.toLowerCase().trim();
    return muridList.filter(murid =>
      murid.name.toLowerCase().includes(query) ||
      (murid as any).nisn?.toLowerCase().includes(query)
    );
  }, [muridList, searchQuery]);

  const getDynamicKomponen = () => {
    return semuaKomponen.filter(k => !['Kehadiran', 'Tugas', 'UTS', 'UAS'].includes(k.nama));
  };

  // Export functions
  const handleExportPDF = () => {
    if (!selectedMapel || !selectedKelas || !activeTahunAjaran) {
      alert('Data tidak lengkap untuk export!');
      return;
    }

    const semuaKomponenNilai = getSemuaKomponenNilai();
    const komponenDinamisList = semuaKomponenNilai.filter(k => !['UTS', 'UAS', 'Tugas', 'Kehadiran'].includes(k.nama));

    const data = filteredMurid.map(m => {
      const nilaiMurid = getNilaiMurid(m.id, selectedMapel, selectedKelas);
      const kehadiran = calculateKehadiran(
        m.id,
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

      const rowData: any = {
        nisn: (m as any).nisn || '-',
        nama: m.name,
        kehadiran: `${kehadiran.toFixed(1)}%`,
        rataTugas: rataTugas.toFixed(1),
        jumlahTugas: nilaiMurid?.tugas.length || 0,
        uts: nilaiMurid?.uts != null ? nilaiMurid.uts : '-',
        uas: nilaiMurid?.uas != null ? nilaiMurid.uas : '-',
        nilaiAkhir: nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir.toFixed(1) : '-',
        grade: nilaiMurid?.grade || '-'
      };

      komponenDinamisList.forEach(komponen => {
        const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === komponen.nama) ?? [];
        const maxCount = maxKomponenDinamisInfo[komponen.nama] || null;
        const rataKomponen = komponenValues.length > 0
          ? calculateRataKomponen(komponenValues, maxCount)
          : null;
        rowData[komponen.nama] = rataKomponen != null ? rataKomponen.toFixed(1) : '-';
      });

      return rowData;
    });

    const baseColumns = [
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Nama Murid', dataKey: 'nama', width: 25 },
      { header: 'Kehadiran (%)', dataKey: 'kehadiran', width: 12 },
      { header: 'Rata-rata Tugas', dataKey: 'rataTugas', width: 15 },
      { header: 'Jumlah Tugas', dataKey: 'jumlahTugas', width: 12 },
      { header: 'UTS', dataKey: 'uts', width: 10 },
      { header: 'UAS', dataKey: 'uas', width: 10 }
    ];

    const komponenColumns = komponenDinamisList.map(komponen => ({
      header: komponen.nama,
      dataKey: komponen.nama,
      width: 12
    }));

    const columns = [
      ...baseColumns,
      ...komponenColumns,
      { header: 'Nilai Akhir', dataKey: 'nilaiAkhir', width: 12 },
      { header: 'Grade', dataKey: 'grade', width: 10 }
    ];

    const title = `DAFTAR NILAI MURID\nMata Pelajaran: ${getMapelName(selectedMapel)}\nKelas: ${getKelasName(selectedKelas)}\nPeriode: ${activeTahunAjaran.tahun} Semester ${activeTahunAjaran.semester}`;
    const filename = `nilai-${getMapelName(selectedMapel)}-${getKelasName(selectedKelas)}-${activeTahunAjaran.tahun}-S${activeTahunAjaran.semester}`;

    exportToPDF(data, columns, title, filename);
  };

  const handleExportExcel = () => {
    if (!selectedMapel || !selectedKelas || !activeTahunAjaran) {
      alert('Data tidak lengkap untuk export!');
      return;
    }

    const semuaKomponenNilai = getSemuaKomponenNilai();
    const komponenDinamisList = semuaKomponenNilai.filter(k => !['UTS', 'UAS', 'Tugas', 'Kehadiran'].includes(k.nama));

    const data = filteredMurid.map(m => {
      const nilaiMurid = getNilaiMurid(m.id, selectedMapel, selectedKelas);
      const kehadiran = calculateKehadiran(
        m.id,
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

      const rowData: any = {
        nisn: (m as any).nisn || '-',
        nama: m.name,
        kehadiran: `${kehadiran.toFixed(1)}%`,
        rataTugas: rataTugas.toFixed(1),
        jumlahTugas: nilaiMurid?.tugas.length || 0,
        uts: nilaiMurid?.uts != null ? nilaiMurid.uts : '-',
        uas: nilaiMurid?.uas != null ? nilaiMurid.uas : '-',
        nilaiAkhir: nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir.toFixed(1) : '-',
        grade: nilaiMurid?.grade || '-'
      };

      komponenDinamisList.forEach(komponen => {
        const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === komponen.nama) ?? [];
        const maxCount = maxKomponenDinamisInfo[komponen.nama] || null;
        const rataKomponen = komponenValues.length > 0
          ? calculateRataKomponen(komponenValues, maxCount)
          : null;
        rowData[komponen.nama] = rataKomponen != null ? rataKomponen.toFixed(1) : '-';
      });

      return rowData;
    });

    const baseColumns = [
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Nama Murid', dataKey: 'nama', width: 25 },
      { header: 'Kehadiran (%)', dataKey: 'kehadiran', width: 12 },
      { header: 'Rata-rata Tugas', dataKey: 'rataTugas', width: 15 },
      { header: 'Jumlah Tugas', dataKey: 'jumlahTugas', width: 12 },
      { header: 'UTS', dataKey: 'uts', width: 10 },
      { header: 'UAS', dataKey: 'uas', width: 10 }
    ];

    const komponenColumns = komponenDinamisList.map(komponen => ({
      header: komponen.nama,
      dataKey: komponen.nama,
      width: 12
    }));

    const columns = [
      ...baseColumns,
      ...komponenColumns,
      { header: 'Nilai Akhir', dataKey: 'nilaiAkhir', width: 12 },
      { header: 'Grade', dataKey: 'grade', width: 10 }
    ];

    const title = `DAFTAR NILAI MURID\nMata Pelajaran: ${getMapelName(selectedMapel)}\nKelas: ${getKelasName(selectedKelas)}\nPeriode: ${activeTahunAjaran.tahun} Semester ${activeTahunAjaran.semester}`;
    const filename = `nilai-${getMapelName(selectedMapel)}-${getKelasName(selectedKelas)}-${activeTahunAjaran.tahun}-S${activeTahunAjaran.semester}`;

    exportToExcel(data, columns, title, filename);
  };

  // Get all nilai for the same class and subject to calculate max counts
  const nilaiKelas = useMemo(() => {
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

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">
              Nilai {getMapelName(selectedMapel)} - {getKelasName(selectedKelas)}
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">Data penilaian seluruh murid</p>
          </div>
          {muridList.length > 0 && (
            <div className="flex-shrink-0">
              <div className="inline-flex px-3 sm:px-4 py-2 bg-white/20 rounded-lg text-white text-xs sm:text-sm font-semibold backdrop-blur-sm">
                {filteredMurid.length} / {muridList.length} murid
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        {muridList.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari nama murid atau NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {filteredMurid.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <FileText size={16} />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Excel</span>
                  </Button>
                </div>
              )}
            </div>

            {filteredMurid.length === 0 && searchQuery && (
              <div className="p-4 sm:p-6 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl text-center">
                <p className="text-xs sm:text-sm font-medium text-amber-900">Tidak ada murid yang sesuai dengan pencarian "{searchQuery}"</p>
              </div>
            )}

            {filteredMurid.length > 0 && (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell header>Nama Murid</TableCell>
                        <TableCell header>NISN</TableCell>
                        <TableCell header>Kehadiran</TableCell>
                        <TableCell header>Tugas</TableCell>
                        <TableCell header>UTS</TableCell>
                        <TableCell header>UAS</TableCell>
                        {getDynamicKomponen().map((k) => (
                          <TableCell key={k.id} header>{k.nama}</TableCell>
                        ))}
                        <TableCell header>Nilai Akhir</TableCell>
                        <TableCell header>Grade</TableCell>
                        <TableCell header>Aksi</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMurid.map((murid) => {
                        const nilaiMurid = getNilaiMurid(murid.id, selectedMapel, selectedKelas);
                        const kehadiran = calculateKehadiran(
                          murid.id,
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

                        return (
                          <TableRow key={murid.id}>
                            <TableCell>{murid.name}</TableCell>
                            <TableCell>{(murid as any).nisn || '-'}</TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-sm font-medium">{kehadiran.toFixed(1)}%</div>
                                <div className="text-xs text-slate-500">
                                  {((kehadiran / 100) * komponen.kehadiran).toFixed(1)} poin
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  Rata-rata: {rataTugas.toFixed(1)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {nilaiMurid?.tugas.length || 0} tugas
                                </div>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => onInputNilai(murid, 'tugas')}
                                  disabled={isEditingLocked}
                                  title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                  className="flex items-center"
                                >
                                  <Plus size={12} className="mr-1" />
                                  Tugas
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-sm font-medium">
                                  {nilaiMurid?.uts != null  ? nilaiMurid?.uts : '-'}
                                </div>
                                <Button
                                  size="sm"
                                  variant={nilaiMurid?.uts != null  ? 'secondary' : 'warning'}
                                  onClick={() => onInputNilai(murid, 'uts')}
                                  disabled={isEditingLocked}
                                  title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                  className="flex items-center justify-center"
                                >
                                  {nilaiMurid?.uts != null ? (
                                    <>
                                      <Edit size={12} className="mr-1" />
                                      Edit
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={12} className="mr-1" />
                                      Input
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-sm font-medium">
                                  {nilaiMurid?.uas != null ? nilaiMurid?.uas : '-'}
                                </div>
                                <Button
                                  size="sm"
                                  variant={nilaiMurid?.uas != null ? 'secondary' : 'warning'}
                                  onClick={() => onInputNilai(murid, 'uas')}
                                  disabled={isEditingLocked}
                                  title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                  className="flex items-center"
                                >
                                  {nilaiMurid?.uas != null ? (
                                    <>
                                      <Edit size={12} className="mr-1" />
                                      Edit
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={12} className="mr-1" />
                                      Input
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            {getDynamicKomponen().map((k) => {
                              const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === k.nama) ?? [];
                              const isTunggal = isKomponenTunggal && isKomponenTunggal(k.nama);

                              if (isTunggal) {
                                const komponenValue = komponenValues[0];
                                return (
                                  <TableCell key={k.id}>
                                    <div className="text-center">
                                      <div className="text-sm font-medium">
                                        {komponenValue?.nilai !== undefined ? komponenValue.nilai : '-'}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={komponenValue?.nilai !== undefined ? 'secondary' : 'warning'}
                                        onClick={() => {
                                          if (komponenValue && onEditKomponen) {
                                            onEditKomponen(murid, komponenValue);
                                          } else {
                                            onInputNilai(murid, k.nama);
                                          }
                                        }}
                                        disabled={isEditingLocked}
                                        title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                        className="flex items-center"
                                      >
                                        <Edit size={12} className="mr-1" />
                                        {komponenValue?.nilai !== undefined ? 'Edit' : 'Input'}
                                      </Button>
                                    </div>
                                  </TableCell>
                                );
                              } else {
                                const maxCount = maxKomponenDinamisInfo[k.nama] || null;
                                const rataKomponen = calculateRataKomponen(komponenValues, maxCount);

                                return (
                                  <TableCell key={k.id}>
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium">
                                        Rata-rata: {rataKomponen.toFixed(1)}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {komponenValues.length} item
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => onInputNilai(murid, k.nama)}
                                        disabled={isEditingLocked}
                                        title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                        className="flex items-center justify-center"
                                      >
                                        <Plus size={12} className="mr-1" />
                                        {k.nama}
                                      </Button>
                                    </div>
                                  </TableCell>
                                );
                              }
                            })}
                            <TableCell>
                              <div className="text-center font-medium">
                                {nilaiMurid?.nilaiAkhir !== null ? nilaiMurid?.nilaiAkhir?.toFixed(1) : '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {nilaiMurid?.grade ? (
                                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(nilaiMurid.grade)}`}>
                                  {nilaiMurid.grade}
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => onViewDetail(murid)}
                                className="flex items-center"
                              >
                                <Eye size={12} className="mr-1" />
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="sm:hidden space-y-3">
                  {filteredMurid.map((murid) => {
                    const nilaiMurid = getNilaiMurid(murid.id, selectedMapel, selectedKelas);
                    const kehadiran = calculateKehadiran(
                      murid.id,
                      selectedMapel,
                      selectedKelas,
                      guruId,
                      activeTahunAjaran.semester,
                      activeTahunAjaran.tahun,
                      absensi,
                      sesiAbsensi,
                      jadwalPelajaran
                    );
                    const rataTugas = nilaiMurid ? calculateRataTugas(nilaiMurid.tugas) : 0;
                    const isExpanded = expandedCardId === murid.id;

                    return (
                      <div
                        key={murid.id}
                        className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all duration-200"
                      >
                        {/* Collapsed Header */}
                        <div className="px-4 py-3">
                          <button
                            onClick={() => setExpandedCardId(isExpanded ? null : murid.id)}
                            className="w-full flex items-center justify-between mb-2 active:bg-slate-50 rounded-lg py-2 transition-colors"
                          >
                            <div className="flex-1 text-left">
                              <h4 className="text-sm font-bold text-slate-900">{murid.name}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">NISN: {(murid as any).nisn || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  {nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir.toFixed(1) : '-'}
                                </div>
                                <div className="text-xs text-slate-500">Nilai Akhir</div>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                          <Button
                            size="sm"
                            variant="primary"
                            className="w-full flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetail(murid);
                            }}
                          >
                            <Eye size={14} className="mr-1" />
                            Detail
                          </Button>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2 border-t border-slate-200 pt-3">
                            <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                              <div className="flex-1">
                                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block">Kehadiran</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <div className="text-base font-bold text-slate-900">{kehadiran.toFixed(1)}%</div>
                                  <div className="text-[10px] text-slate-500">{((kehadiran / 100) * komponen.kehadiran).toFixed(1)} poin</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                              <div className="flex-1">
                                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block">Tugas</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <div className="text-base font-bold text-slate-900">{rataTugas.toFixed(1)}</div>
                                  <div className="text-[10px] text-slate-500">{nilaiMurid?.tugas.length || 0} tugas</div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => onInputNilai(murid, 'tugas')}
                                disabled={isEditingLocked}
                                title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                className="flex items-center justify-center text-xs px-4 py-1.5 ml-2 flex-shrink-0 min-w-[80px]"
                              >
                                <Plus size={12} className="mr-1" />
                                Tugas
                              </Button>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                              <div className="flex-1">
                                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block">UTS</span>
                                <div className="text-base font-bold text-slate-900 mt-0.5">{nilaiMurid?.uts != null ? nilaiMurid?.uts : '-'}</div>
                              </div>
                              <Button
                                size="sm"
                                variant={nilaiMurid?.uts != null ? 'primary' : 'warning'}
                                onClick={() => onInputNilai(murid, 'uts')}
                                disabled={isEditingLocked}
                                title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                className="flex items-center justify-center text-xs px-4 py-1.5 ml-2 flex-shrink-0 min-w-[80px]"
                              >
                                {nilaiMurid?.uts != null ? (
                                  <>
                                    <Edit size={12} className="mr-1" />
                                    Edit
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} className="mr-1" />
                                    Input
                                  </>
                                )}
                              </Button>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                              <div className="flex-1">
                                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block">UAS</span>
                                <div className="text-base font-bold text-slate-900 mt-0.5">{nilaiMurid?.uas != null ? nilaiMurid?.uas : '-'}</div>
                              </div>
                              <Button
                                size="sm"
                                variant={nilaiMurid?.uas != null ? 'primary' : 'warning'}
                                onClick={() => onInputNilai(murid, 'uas')}
                                disabled={isEditingLocked}
                                title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                className="flex items-center justify-center text-xs px-4 py-1.5 ml-2 flex-shrink-0 min-w-[80px]"
                              >
                                {nilaiMurid?.uas != null ? (
                                  <>
                                    <Edit size={12} className="mr-1" />
                                    Edit
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} className="mr-1" />
                                    Input
                                  </>
                                )}
                              </Button>
                            </div>

                            {getDynamicKomponen().map((k) => {
                              const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === k.nama) ?? [];
                              const isTunggal = isKomponenTunggal && isKomponenTunggal(k.nama);

                              if (isTunggal) {
                                const komponenValue = komponenValues[0];
                                return (
                                  <div key={k.id} className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                                    <div className="flex-1">
                                      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block">{k.nama}</span>
                                      <div className="text-base font-bold text-slate-900 mt-0.5">{komponenValue?.nilai !== undefined ? komponenValue.nilai : '-'}</div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={komponenValue?.nilai !== undefined ? 'primary' : 'warning'}
                                      onClick={() => {
                                        if (komponenValue && onEditKomponen) {
                                          onEditKomponen(murid, komponenValue);
                                        } else {
                                          onInputNilai(murid, k.nama);
                                        }
                                      }}
                                      disabled={isEditingLocked}
                                      title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                      className="flex items-center justify-center text-xs px-4 py-1.5 ml-2 flex-shrink-0 min-w-[80px]"
                                    >
                                      {komponenValue?.nilai !== undefined ? (
                                        <>
                                          <Edit size={12} className="mr-1" />
                                          Edit
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={12} className="mr-1" />
                                          Input
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              } else {
                                const maxCount = maxKomponenDinamisInfo[k.nama] || null;
                                const rataKomponen = calculateRataKomponen(komponenValues, maxCount);

                                return (
                                  <div key={k.id} className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                                    <div className="flex-1">
                                      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block">{k.nama}</span>
                                      <div className="flex items-baseline gap-2 mt-0.5">
                                        <div className="text-base font-bold text-slate-900">Rata-rata: {rataKomponen.toFixed(1)}</div>
                                        <div className="text-[10px] text-slate-500">{komponenValues.length} item</div>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => onInputNilai(murid, k.nama)}
                                      disabled={isEditingLocked}
                                      title={isEditingLocked ? 'Input nilai dikunci - Raport sudah disebarkan' : ''}
                                      className="flex items-center justify-center text-xs px-4 py-1.5 ml-2 flex-shrink-0 min-w-[80px]"
                                    >
                                      <Plus size={12} className="mr-1" />
                                      {k.nama.length > 8 ? k.nama.substring(0, 8) + '...' : k.nama}
                                    </Button>
                                  </div>
                                );
                              }
                            })}

                            {nilaiMurid?.grade && (
                              <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                                <div className="flex-1">
                                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block">Grade</span>
                                  <div className="mt-0.5">
                                    <div className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getGradeColor(nilaiMurid.grade)}`}>
                                      {nilaiMurid.grade}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-600">Belum ada murid di kelas ini</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Tambahkan murid melalui manajemen murid</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NilaiTable;