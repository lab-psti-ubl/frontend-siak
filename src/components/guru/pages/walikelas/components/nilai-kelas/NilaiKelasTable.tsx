import React from 'react';
import { Eye, Users } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import {
  User,
  Nilai,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi
} from '../../../../../../types';
import {
  calculateKehadiran,
  calculateRataTugas,
  getGradeColor,
  getKomponenDinamisByKomponen,
  getMaxTugasInfo,
  getMaxKomponenDinamisInfo,
  calculateRataKomponen
} from '../../../../../../utils/nilaiUtils';
import { useKomponenNilai } from '../../../../../../hooks/useKomponenNilai';

interface NilaiKelasTableProps {
  muridKelas: User[];
  selectedMapel: string;
  kelasWali: string;
  mapelName: string;
  guruName: string;
  activeTahunAjaran: { tahun: string; semester: number };
  getNilaiMurid: (muridId: string, mapelId: string) => Nilai | undefined;
  jadwalKelas: JadwalPelajaran[];
  absensi: Absensi[];
  sesiAbsensi: SesiAbsensi[];
  jadwalPelajaran: JadwalPelajaran[];
  onViewDetail: (murid: User) => void;
  nilai?: Nilai[]; // All nilai for max count calculation
}

const NilaiKelasTable: React.FC<NilaiKelasTableProps> = ({
  muridKelas,
  selectedMapel,
  kelasWali,
  mapelName,
  guruName,
  activeTahunAjaran,
  getNilaiMurid,
  jadwalKelas,
  absensi,
  sesiAbsensi,
  jadwalPelajaran,
  onViewDetail,
  nilai = []
}) => {
  const { komponenNilai: semuaKomponen } = useKomponenNilai();

  // Get all nilai for the same class and subject to calculate max counts
  const nilaiKelas = React.useMemo(() => {
    if (!selectedMapel || !kelasWali || !activeTahunAjaran || !nilai || nilai.length === 0) return [];
    return nilai.filter(n => 
      n.mataPelajaranId === selectedMapel && 
      n.kelasId === kelasWali &&
      n.semester === activeTahunAjaran.semester &&
      n.tahunAjaran === activeTahunAjaran.tahun
    );
  }, [nilai, selectedMapel, kelasWali, activeTahunAjaran]);

  // Get max tugas info
  const { maxCount: maxTugasCount, uniqueTugasNames } = React.useMemo(() => 
    getMaxTugasInfo(nilaiKelas), 
    [nilaiKelas]
  );

  // Get max komponen dinamis info
  const maxKomponenDinamisInfo = React.useMemo(() => 
    getMaxKomponenDinamisInfo(nilaiKelas), 
    [nilaiKelas]
  );

  // Default values
  const defaultKomponen = {
    kehadiran: 20,
    tugas: 30,
    uts: 25,
    uas: 25
  };

  // Get komponen values dari data API
  const KOMPONEN_NILAI = {
    kehadiran: semuaKomponen.find(k => k.nama === 'Kehadiran')?.persentase ?? defaultKomponen.kehadiran,
    tugas: semuaKomponen.find(k => k.nama === 'Tugas')?.persentase ?? defaultKomponen.tugas,
    uts: semuaKomponen.find(k => k.nama === 'UTS')?.persentase ?? defaultKomponen.uts,
    uas: semuaKomponen.find(k => k.nama === 'UAS')?.persentase ?? defaultKomponen.uas,
  };

  const getDynamicKomponen = () => {
    return semuaKomponen.filter(k => !['Kehadiran', 'Tugas', 'UTS', 'UAS'].includes(k.nama));
  };

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">
                Daftar Nilai - {mapelName}
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Guru: {guruName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          {muridKelas.length > 0 ? (
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
                    {muridKelas.map((murid) => {
                      const nilaiMurid = getNilaiMurid(murid.id, selectedMapel);
                      const jadwalMapel = jadwalKelas.find(j => j.mataPelajaranId === selectedMapel);
                      const kehadiran = calculateKehadiran(
                        murid.id,
                        selectedMapel,
                        kelasWali,
                        jadwalMapel?.guruId || '',
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
                          <TableCell>{murid.nisn}</TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="text-sm font-medium">{kehadiran.toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">
                                {((kehadiran / 100) * KOMPONEN_NILAI.kehadiran).toFixed(1)} poin
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="text-sm font-medium">{rataTugas.toFixed(1)}</div>
                              
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center font-medium">
                              {nilaiMurid?.uts != null ? nilaiMurid.uts : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center font-medium">
                              {nilaiMurid?.uas != null ? nilaiMurid.uas : '-'}
                            </div>
                          </TableCell>
                          {getDynamicKomponen().map((k) => {
                            const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === k.nama) ?? [];
                            const maxCount = maxKomponenDinamisInfo[k.nama] || null;
                            const rataKomponen = komponenValues.length > 0
                              ? calculateRataKomponen(komponenValues, maxCount)
                              : null;
                            return (
                              <TableCell key={k.id}>
                                <div className="text-center font-medium">
                                  {rataKomponen != null ? rataKomponen.toFixed(1) : '-'}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <div className="text-center font-bold text-blue-600">
                              {nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir.toFixed(1) : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {nilaiMurid?.grade ? (
                              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(nilaiMurid.grade)}`}>
                                {nilaiMurid.grade}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onViewDetail(murid)}
                              className="flex items-center"
                            >
                              <Eye size={14} className="mr-1" />
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
                {muridKelas.map((murid) => {
                  const nilaiMurid = getNilaiMurid(murid.id, selectedMapel);
                  const jadwalMapel = jadwalKelas.find(j => j.mataPelajaranId === selectedMapel);
                  const kehadiran = calculateKehadiran(
                    murid.id,
                    selectedMapel,
                    kelasWali,
                    jadwalMapel?.guruId || '',
                    activeTahunAjaran.semester,
                    activeTahunAjaran.tahun,
                    absensi,
                    sesiAbsensi,
                    jadwalPelajaran
                  );
                  const rataTugas = nilaiMurid ? calculateRataTugas(nilaiMurid.tugas) : 0;

                  return (
                    <div
                      key={murid.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 hover:border-slate-300 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{murid.name}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{murid.nisn}</p>
                        </div>
                        {nilaiMurid?.grade && (
                          <Badge variant={
                            nilaiMurid.grade === 'A' ? 'success' :
                            nilaiMurid.grade === 'B' ? 'info' :
                            nilaiMurid.grade === 'C' ? 'warning' :
                            'danger'
                          }>
                            {nilaiMurid.grade}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Kehadiran</span>
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-bold text-blue-600">{kehadiran.toFixed(1)}%</div>
                            <p className="text-xs text-blue-700 mt-0.5">
                              {((kehadiran / 100) * KOMPONEN_NILAI.kehadiran).toFixed(1)} poin
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Tugas</span>
                          <div className="bg-emerald-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-bold text-emerald-600">{rataTugas.toFixed(1)}</div>
                            <p className="text-xs text-emerald-700 mt-0.5">
                              {nilaiMurid?.tugas.length || 0} tugas
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">UTS</span>
                          <div className="bg-orange-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-bold text-orange-600">
                              {nilaiMurid?.uts != null ? nilaiMurid.uts : '-'}
                            </div>
                            <p className="text-xs text-orange-700 mt-0.5">
                              {nilaiMurid?.uts != null ? ((nilaiMurid.uts / 100) * KOMPONEN_NILAI.uts).toFixed(1) : '0'} poin
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">UAS</span>
                          <div className="bg-rose-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-bold text-rose-600">
                              {nilaiMurid?.uas != null ? nilaiMurid.uas : '-'}
                            </div>
                            <p className="text-xs text-rose-700 mt-0.5">
                              {nilaiMurid?.uas != null ? ((nilaiMurid.uas / 100) * KOMPONEN_NILAI.uas).toFixed(1) : '0'} poin
                            </p>
                          </div>
                        </div>
                      </div>

                      {getDynamicKomponen().length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {getDynamicKomponen().map((k) => {
                            const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === k.nama) ?? [];
                            const maxCount = maxKomponenDinamisInfo[k.nama] || null;
                            const rataKomponen = komponenValues.length > 0
                              ? calculateRataKomponen(komponenValues, maxCount)
                              : null;
                            return (
                              <div key={k.id}>
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">{k.nama}</span>
                                <div className="bg-slate-100 rounded-lg p-1.5 text-center">
                                  <div className="text-xs font-bold text-slate-700">
                                    {rataKomponen != null ? rataKomponen.toFixed(1) : '-'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200">
                        <div className="mb-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-600 mb-1">Nilai Akhir</p>
                          <p className="text-lg font-bold text-blue-600">
                            {nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir.toFixed(1) : '-'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onViewDetail(murid)}
                          className="w-full flex items-center justify-center gap-2 text-xs py-2"
                        >
                          <Eye size={14} />
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
              <p className="text-sm sm:text-base font-semibold text-slate-600">Belum ada murid di kelas ini</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Tambahkan murid untuk melihat nilai</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NilaiKelasTable;
