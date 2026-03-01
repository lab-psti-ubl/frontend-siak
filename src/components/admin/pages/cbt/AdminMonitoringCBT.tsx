import React, { useEffect, useState, useMemo } from 'react';
import { Eye, Calendar, Clock, BookOpen, Users, FileText, Filter } from 'lucide-react';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useMurid } from '../../../../hooks/useMurid';
import { apiService } from '../../../../services/apiService';
import {
  CBTUjian,
  CBTUjianAttempt,
} from '../../../../types';
import {
  showErrorNotification,
} from '../../../../utils/notificationUtils';

const AdminMonitoringCBT: React.FC = () => {
  const { tahunAjaran } = useTahunAjaran();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { murid } = useMurid();

  const activeTahunAjaran = tahunAjaran.find((ta) => ta.isActive);

  const [ujianList, setUjianList] = useState<CBTUjian[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailUjian, setDetailUjian] = useState<CBTUjian | null>(null);
  const [attemptsMap, setAttemptsMap] = useState<
    Record<string, CBTUjianAttempt[]>
  >({});
  const [loadingAttemptsMap, setLoadingAttemptsMap] = useState(false);
  const [filterKelasId, setFilterKelasId] = useState<string>('');
  const [filterMapelId, setFilterMapelId] = useState<string>('');

  const getMapelName = (mapelId: string) =>
    mataPelajaran.find((m) => m.id === mapelId)?.name || 'Mata Pelajaran';

  const getKelasName = (kelasId: string) =>
    kelas.find((k) => k.id === kelasId)?.name || 'Kelas';

  const muridByKelas = useMemo(() => {
    const map = new Map<string, typeof murid>();
    kelas.forEach((kls) => {
      const list = murid.filter((m) => (m as any).kelasId === kls.id);
      map.set(kls.id, list);
    });
    return map;
  }, [kelas, murid]);

  // Hanya tampilkan UTS dan UAS yang berlangsung hari ini, dengan filter kelas dan mapel
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // UTS dan UAS saja, yang berlangsung hari ini
  const ujianUTSUASToday = useMemo(() => {
    return ujianList.filter((u) => {
      const kategori = (u.kategoriNama || '').toLowerCase().trim();
      if (kategori !== 'uts' && kategori !== 'uas') return false;
      const mulai = u.tanggalMulai || '';
      const selesai = u.tanggalSelesai || '';
      return todayStr >= mulai && todayStr <= selesai;
    });
  }, [ujianList, todayStr]);

  const kelasOpts = useMemo(() => {
    let list = ujianUTSUASToday;
    if (filterMapelId) list = list.filter((u) => u.mataPelajaranId === filterMapelId);
    const ids = new Set(list.map((u) => u.kelasId));
    return kelas.filter((k) => ids.has(k.id)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [kelas, ujianUTSUASToday, filterMapelId]);

  const mapelOpts = useMemo(() => {
    let list = ujianUTSUASToday;
    if (filterKelasId) list = list.filter((u) => u.kelasId === filterKelasId);
    const ids = new Set(list.map((u) => u.mataPelajaranId));
    return mataPelajaran.filter((m) => ids.has(m.id)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [mataPelajaran, ujianUTSUASToday, filterKelasId]);

  const filteredUjianList = useMemo(() => {
    return ujianUTSUASToday.filter((u) => {
      if (filterKelasId && u.kelasId !== filterKelasId) return false;
      if (filterMapelId && u.mataPelajaranId !== filterMapelId) return false;
      return true;
    });
  }, [ujianUTSUASToday, filterKelasId, filterMapelId]);

  useEffect(() => {
    const load = async () => {
      if (!activeTahunAjaran) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await apiService.getAllCBTUjian({
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        });
        if (response.success && response.data) {
          setUjianList(response.data as CBTUjian[]);
        } else {
          showErrorNotification(
            'Gagal',
            response.message || 'Gagal mengambil data ujian CBT.'
          );
        }
      } catch (error: any) {
        console.error(error);
        showErrorNotification(
          'Gagal',
          error.message || 'Terjadi kesalahan saat mengambil data ujian CBT.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeTahunAjaran]);

  useEffect(() => {
    const loadAllAttempts = async () => {
      if (ujianUTSUASToday.length === 0) {
        setAttemptsMap({});
        return;
      }

      setLoadingAttemptsMap(true);
      try {
        const entries = await Promise.all(
          ujianUTSUASToday.map(async (u) => {
            try {
              const res = await apiService.getAllCBTUjianAttempt({
                ujianId: u.id,
              });
              if (res.success && res.data) {
                return [u.id, res.data as CBTUjianAttempt[]] as const;
              }
            } catch (error) {
              console.error('Error loading attempts for ujian', u.id, error);
            }
            return [u.id, []] as const;
          })
        );

        const nextMap: Record<string, CBTUjianAttempt[]> = {};
        for (const [id, list] of entries) {
          nextMap[id] = Array.isArray(list) ? [...list] : [];
        }
        setAttemptsMap(nextMap);
      } finally {
        setLoadingAttemptsMap(false);
      }
    };

    loadAllAttempts();
  }, [ujianUTSUASToday]);

  const getStatusRingkas = (attempts: CBTUjianAttempt[], kelasId: string) => {
    const listMurid = muridByKelas.get(kelasId) || [];
    let belum = 0;
    let sedang = 0;
    let selesai = 0;

    listMurid.forEach((m) => {
      const at = attempts.find((a) => a.muridId === m.id);
      if (!at) {
        belum += 1;
      } else if (at.status === 'sedang') {
        sedang += 1;
      } else if (at.status === 'selesai') {
        selesai += 1;
      }
    });

    return { belum, sedang, selesai, total: listMurid.length };
  };

  const detailAttempts: CBTUjianAttempt[] = detailUjian
    ? attemptsMap[detailUjian.id] || []
    : [];

  const getKategoriBadgeClass = (nama: string) => {
    const n = (nama || '').toLowerCase();
    if (n.includes('uts')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (n.includes('uas')) return 'bg-violet-50 text-violet-700 border-violet-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (!activeTahunAjaran) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <p className="text-slate-700 font-medium">
            Tidak ada tahun ajaran aktif. Hubungi admin untuk mengaktifkan tahun ajaran.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
      {/* HEADER – Bar biru gelap */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 bg-blue-800 text-white rounded-xl">
        <div>
          <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Monitoring Ujian CBT</div>
          <div className="text-lg font-bold mt-0.5">UTS & UAS Hari Ini</div>
        </div>
        <div>
          <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Tahun Ajaran</div>
          <div className="text-sm font-semibold mt-0.5">
            {activeTahunAjaran.tahun} · Semester {activeTahunAjaran.semester}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Tanggal</div>
          <div className="text-sm font-semibold mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-200" />
            {todayStr}
          </div>
        </div>
      </div>

      {/* Section – Daftar Ujian */}
      <section className="rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Daftar Ujian UTS & UAS
            </h3>
          </div>
          {ujianUTSUASToday.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={filterKelasId}
                  onChange={(e) => setFilterKelasId(e.target.value)}
                >
                  <option value="">Semua Kelas</option>
                  {kelasOpts.map((k) => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[160px]"
                value={filterMapelId}
                onChange={(e) => setFilterMapelId(e.target.value)}
              >
                <option value="">Semua Mapel</option>
                {mapelOpts.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-500">Memuat data ujian CBT...</p>
            </div>
          ) : ujianUTSUASToday.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Belum ada ujian UTS/UAS</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Tidak ada ujian UTS atau UAS yang berlangsung hari ini.
              </p>
            </div>
          ) : filteredUjianList.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">
                Tidak ada ujian yang sesuai dengan filter yang dipilih.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUjianList.map((ujian) => {
                const attemptsForUjian = attemptsMap[ujian.id] || [];
                const ringkas = getStatusRingkas(attemptsForUjian, ujian.kelasId);

                return (
                  <div
                    key={ujian.id}
                    className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">
                              {ujian.judulUjian}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getKategoriBadgeClass(ujian.kategoriNama)}`}
                            >
                              {ujian.kategoriNama}
                              {ujian.kategoriHasNilai && ujian.kategoriKe != null && ` Ke-${ujian.kategoriKe}`}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-slate-400 shrink-0" />
                              {getKelasName(ujian.kelasId)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                              {getMapelName(ujian.mataPelajaranId)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              {ujian.tanggalMulai} {ujian.jamMulai} – {ujian.tanggalSelesai} {ujian.jamSelesai}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:min-w-[320px]">
                          {loadingAttemptsMap ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                              Memuat status...
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                                <div className="text-lg font-bold text-slate-700">{ringkas.total}</div>
                                <div className="text-[10px] font-medium text-slate-500 uppercase">Total</div>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-center">
                                <div className="text-lg font-bold text-slate-600">{ringkas.belum}</div>
                                <div className="text-[10px] font-medium text-slate-500 uppercase">Belum</div>
                              </div>
                              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center">
                                <div className="text-lg font-bold text-blue-700">{ringkas.sedang}</div>
                                <div className="text-[10px] font-medium text-blue-600 uppercase">Sedang</div>
                              </div>
                              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
                                <div className="text-lg font-bold text-emerald-700">{ringkas.selesai}</div>
                                <div className="text-[10px] font-medium text-emerald-600 uppercase">Selesai</div>
                              </div>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="primary"
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={() => setDetailUjian(ujian)}
                          >
                            <Eye className="w-4 h-4" />
                            Detail
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={!!detailUjian}
        onClose={() => setDetailUjian(null)}
        title="Detail Monitoring Ujian CBT"
        size="full"
      >
        {!detailUjian ? null : (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
            {/* Header – Bar biru gelap */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 bg-blue-800 text-white rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Judul Ujian</div>
                <div className="text-lg font-bold mt-0.5 truncate">{detailUjian.judulUjian}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Kelas & Mapel</div>
                <div className="text-sm font-semibold mt-0.5">
                  {getKelasName(detailUjian.kelasId)} · {getMapelName(detailUjian.mataPelajaranId)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Waktu</div>
                <div className="text-sm font-semibold mt-0.5">
                  {detailUjian.tanggalMulai} {detailUjian.jamMulai} – {detailUjian.tanggalSelesai} {detailUjian.jamSelesai}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Durasi</div>
                <div className="text-sm font-semibold mt-0.5">{detailUjian.durasiMenit} menit</div>
              </div>
            </div>

            {/* Info Ujian */}
            <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Pengaturan Ujian</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase mb-1">Acak Soal</div>
                  <div className="font-medium text-slate-900">{detailUjian.acakSoal ? 'Ya, diacak' : 'Tidak diacak'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase mb-1">Tampilkan Nilai</div>
                  <div className="font-medium text-slate-900">
                    {detailUjian.tunjukanHasilNilai ? 'Ditampilkan ke murid' : 'Tidak langsung ditampilkan'}
                  </div>
                </div>
              </div>
            </section>

            {/* Tabel Monitoring Murid */}
            <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                  Monitoring Pengerjaan Murid
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold text-slate-700">Nama Murid</th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-700">Status Ujian</th>
                      <th className="px-5 py-4 text-center font-semibold text-slate-700">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(muridByKelas.get(detailUjian.kelasId) || []).map((m) => {
                      const attempt = detailAttempts.find((a) => a.muridId === m.id);
                      const statusKey = !attempt ? 'belum' : attempt.status === 'sedang' ? 'sedang' : attempt.status === 'selesai' ? 'selesai' : 'belum';
                      const statusConfig = {
                        belum: { label: 'Belum memulai', className: 'bg-slate-100 text-slate-700 border-slate-200' },
                        sedang: { label: 'Sedang mengerjakan', className: 'bg-blue-50 text-blue-700 border-blue-200' },
                        selesai: { label: 'Selesai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      };
                      const sc = statusConfig[statusKey as keyof typeof statusConfig] ?? statusConfig.belum;
                      const nilai = attempt?.skorTotal ?? attempt?.skorAuto ?? '–';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">{m.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">NISN: {(m as any).nisn || '–'}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${sc.className}`}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center font-semibold text-slate-800">{nilai}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminMonitoringCBT;

