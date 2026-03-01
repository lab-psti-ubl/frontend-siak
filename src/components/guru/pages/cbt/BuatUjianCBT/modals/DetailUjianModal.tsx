import React, { useState } from 'react';
import { AlertCircle, Clock, BookOpen, FileText, FileSpreadsheet, Download, BookMarked } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import { exportToExcel, exportToPDF } from '../../../../../../utils/exportUtils';
import type { CBTUjian, CBTUjianAttempt, Nilai, NilaiTugas, NilaiKomponen } from '../../../../../types';
import { useAuth } from '../../../../../../context/AuthContext';
import { useNilai } from '../../../../../../hooks/useNilai';
import { useAbsensi } from '../../../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../../../hooks/useSesiAbsensi';
import { useJadwalPelajaran } from '../../../../../../hooks/useJadwalPelajaran';
import { apiService } from '../../../../../../services/apiService';
import { updateNilaiAkhir } from '../../../../../../utils/nilaiUtils';
import { showSuccessNotification, showErrorNotification } from '../../../../../../utils/notificationUtils';

type Murid = { id: string; name: string; nisn?: string; kelasId?: string };

type Props = {
  detailUjian: CBTUjian | null;
  onClose: () => void;
  detailAttempts: CBTUjianAttempt[];
  muridInKelas: Murid[];
  getKelasName: (id: string) => string;
  getMapelName: (id: string) => string;
  onLihatUjian: (ujian: CBTUjian, m: Murid) => void;
  onReset: (ujian: CBTUjian, muridId: string) => void;
  onIzinkanEdit: (ujian: CBTUjian, muridId: string) => void;
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-2 first:pt-0 last:pb-0">
    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

const StatusBadge: React.FC<{ status: 'belum' | 'belum_ulang' | 'sedang' | 'selesai' | string }> = ({ status }) => {
  const config = {
    belum: { label: 'Belum memulai', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    belum_ulang: { label: 'Belum mengerjakan ulang', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    sedang: { label: 'Sedang mengerjakan', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    selesai: { label: 'Selesai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };
  const c = config[status as keyof typeof config] ?? { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${c.className}`}>
      {c.label}
    </span>
  );
};

const DetailUjianModal: React.FC<Props> = ({
  detailUjian,
  onClose,
  detailAttempts,
  muridInKelas,
  getKelasName,
  getMapelName,
  onLihatUjian,
  onReset,
  onIzinkanEdit,
}) => {
  const { user } = useAuth();
  const { bulkUpsertNilai, refreshNilai } = useNilai();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const [exportingNilai, setExportingNilai] = useState(false);

  if (!detailUjian) return null;

  const ujianEnd = new Date(`${detailUjian.tanggalSelesai}T${detailUjian.jamSelesai || '23:59'}:59`);
  const ujianSudahLewat = Date.now() > ujianEnd.getTime();

  /** Status tampilan: belum (no attempt), belum_ulang (attempt belum_mulai), sedang (sedang), selesai */
  const getDisplayStatus = (attempt: CBTUjianAttempt | undefined) => {
    if (!attempt) return 'belum';
    if (attempt.status === 'selesai') return 'selesai';
    if (attempt.status === 'sedang') return ujianSudahLewat ? 'selesai' : 'sedang';
    return 'belum_ulang'; // attempt.status === 'belum_mulai' → setelah reset atau belum mulai ulang
  };

  const selesaiCount = muridInKelas.filter((m) => {
    const a = detailAttempts.find((x) => x.muridId === m.id);
    return getDisplayStatus(a) === 'selesai';
  }).length;

  const statusConfig: Record<string, string> = {
    belum: 'Belum memulai',
    belum_ulang: 'Belum mengerjakan ulang',
    sedang: 'Sedang mengerjakan',
    selesai: 'Selesai',
  };

  const handleExportExcel = () => {
    const exportData = muridInKelas.map((m) => {
      const attempt = detailAttempts.find((a) => a.muridId === m.id);
      const statusKey = getDisplayStatus(attempt);
      const nilai = !attempt ? '–' : attempt.skorTotal != null ? String(attempt.skorTotal) : attempt.skorAuto != null ? String(attempt.skorAuto) : '–';
      return {
        nama: m.name,
        nisn: m.nisn || '–',
        status: statusConfig[statusKey] ?? statusKey,
        nilai,
      };
    });
    const columns = [
      { header: 'No', dataKey: 'no', width: 5 },
      { header: 'Nama Murid', dataKey: 'nama', width: 35 },
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Status Ujian', dataKey: 'status', width: 25 },
      { header: 'Nilai', dataKey: 'nilai', width: 10 },
    ];
    const dataWithNo = exportData.map((r, i) => ({ ...r, no: i + 1 }));
    const title = `Detail Ujian CBT - ${detailUjian.judulUjian}\n${getKelasName(detailUjian.kelasId)} · ${getMapelName(detailUjian.mataPelajaranId)}\n${detailUjian.tanggalMulai} ${detailUjian.jamMulai} – ${detailUjian.tanggalSelesai} ${detailUjian.jamSelesai}`;
    const safeName = detailUjian.judulUjian.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    exportToExcel(dataWithNo, columns, title, `Detail-Ujian-CBT-${safeName}`);
  };

  const handleExportPDF = () => {
    const exportData = muridInKelas.map((m) => {
      const attempt = detailAttempts.find((a) => a.muridId === m.id);
      const statusKey = getDisplayStatus(attempt);
      const nilai = !attempt ? '–' : attempt.skorTotal != null ? String(attempt.skorTotal) : attempt.skorAuto != null ? String(attempt.skorAuto) : '–';
      return {
        no: 0,
        nama: m.name,
        nisn: m.nisn || '–',
        status: statusConfig[statusKey] ?? statusKey,
        nilai,
      };
    });
    const dataWithNo = exportData.map((r, i) => ({ ...r, no: i + 1 }));
    const columns = [
      { header: 'No', dataKey: 'no', width: 5 },
      { header: 'Nama Murid', dataKey: 'nama', width: 35 },
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Status Ujian', dataKey: 'status', width: 25 },
      { header: 'Nilai', dataKey: 'nilai', width: 10 },
    ];
    const title = `Detail Ujian CBT - ${detailUjian.judulUjian}\n${getKelasName(detailUjian.kelasId)} · ${getMapelName(detailUjian.mataPelajaranId)}\n${detailUjian.tanggalMulai} ${detailUjian.jamMulai} – ${detailUjian.tanggalSelesai} ${detailUjian.jamSelesai}`;
    const safeName = detailUjian.judulUjian.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    exportToPDF(dataWithNo, columns, title, `Detail-Ujian-CBT-${safeName}`);
  };

  const handleExportNilai = async () => {
    if (!detailUjian || !user) return;
    setExportingNilai(true);
    try {
      const { kelasId, mataPelajaranId, semester, tahunAjaran, kategoriId, kategoriNama, kategoriHasNilai, kategoriKe } = detailUjian;
      const res = await apiService.getAllNilai({ kelasId, mataPelajaranId, semester, tahunAjaran });
      const existingList: Nilai[] = res.nilai ?? [];
      const toUpsert: Nilai[] = [];
      const today = new Date().toISOString().split('T')[0];

      for (const m of muridInKelas) {
        const attempt = detailAttempts.find((a) => a.muridId === m.id);
        const statusKey = getDisplayStatus(attempt);
        if (statusKey !== 'selesai' || !attempt) continue;
        const skor = attempt.skorTotal != null ? attempt.skorTotal : attempt.skorAuto;
        if (skor == null) continue;

        const existingNilai = existingList.find((n) => n.muridId === m.id);
        const kategoriLower = (kategoriNama || '').toLowerCase();

        let merged: Nilai;
        if (existingNilai) {
          merged = { ...existingNilai, updatedAt: new Date().toISOString() };
        } else {
          merged = {
            id: `nilai-${m.id}-${mataPelajaranId}-${kelasId}-${Date.now()}`,
            muridId: m.id,
            mataPelajaranId,
            kelasId,
            guruId: user.id,
            semester,
            tahunAjaran,
            tugas: [],
            uts: null,
            uas: null,
            nilaiAkhir: null,
            grade: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        if (kategoriLower === 'uts') {
          merged.uts = skor;
        } else if (kategoriLower === 'uas') {
          merged.uas = skor;
        } else if (kategoriLower === 'tugas') {
          const ke = kategoriHasNilai && kategoriKe != null ? kategoriKe : 1;
          const tugas = [...(merged.tugas || [])];
          const nama = `Tugas ${ke}`;
          const idx = tugas.findIndex((t) => t.nama === nama);
          const newTugas: NilaiTugas = {
            id: idx >= 0 ? tugas[idx].id : `tugas-${Date.now()}-${m.id}`,
            nama,
            nilai: skor,
            tanggal: today,
            keterangan: `CBT: ${detailUjian.judulUjian}`,
          };
          if (idx >= 0) tugas[idx] = newTugas;
          else tugas.push(newTugas);
          merged.tugas = tugas;
        } else {
          const komponenNamaDisplay = kategoriHasNilai && kategoriKe != null ? `${kategoriNama} ${kategoriKe}` : kategoriNama;
          const komponenDinamis = [...(merged.komponenDinamis || [])];
          const idx = komponenDinamis.findIndex((k) => k.komponenNama === komponenNamaDisplay);
          const newKomponen: NilaiKomponen = {
            id: idx >= 0 ? komponenDinamis[idx].id : `komponen-${Date.now()}-${m.id}`,
            komponenId: kategoriId,
            komponenNama: komponenNamaDisplay,
            nilai: skor,
            tanggal: today,
            keterangan: `CBT: ${detailUjian.judulUjian}`,
          };
          if (idx >= 0) komponenDinamis[idx] = newKomponen;
          else komponenDinamis.push(newKomponen);
          merged.komponenDinamis = komponenDinamis;
        }

        const finalNilai = updateNilaiAkhir(merged, absensi, sesiAbsensi, jadwalPelajaran);
        toUpsert.push(finalNilai);
      }

      if (toUpsert.length === 0) {
        showErrorNotification('Export Nilai', 'Tidak ada nilai ujian yang selesai untuk disimpan ke data nilai.');
        return;
      }
      await bulkUpsertNilai(toUpsert);
      await refreshNilai();
      showSuccessNotification('Export Nilai Berhasil', `${toUpsert.length} nilai ujian CBT telah disimpan ke data nilai murid (${getKelasName(kelasId)} · ${getMapelName(mataPelajaranId)}).`);
    } catch (err: unknown) {
      showErrorNotification('Export Nilai Gagal', (err as Error)?.message || 'Terjadi kesalahan saat menyimpan nilai ke data nilai.');
    } finally {
      setExportingNilai(false);
    }
  };

  return (
    <Modal isOpen={!!detailUjian} onClose={onClose} title="Detail Ujian CBT" size="full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
        {/* HEADER – Bar biru gelap (seperti Lihat Ujian) */}
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
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-200" />
            <div>
              <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Waktu</div>
              <div className="text-sm font-semibold mt-0.5">
                {detailUjian.tanggalMulai} {detailUjian.jamMulai} – {detailUjian.tanggalSelesai} {detailUjian.jamSelesai}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Progress</div>
            <div className="text-sm font-semibold mt-0.5">
              {selesaiCount} / {muridInKelas.length} selesai
            </div>
          </div>
        </div>

        {/* Section 1 — Informasi Ujian (card) */}
        <section className="rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                Informasi Ujian
              </h3>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="flex items-center gap-1.5 !bg-violet-600 !border-violet-600 !text-white hover:!bg-violet-700 hover:!border-violet-700 opacity-100"
              onClick={handleExportNilai}
              disabled={exportingNilai}
            >
              <BookMarked className="w-4 h-4" />
              {exportingNilai ? 'Menyimpan...' : 'Kirim Nilai Ujian Ke Nilai Murid'}
            </Button>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-0 divide-y divide-slate-100">
              <InfoRow
                label="Kelas & Mata Pelajaran"
                value={
                  <>
                    <span className="block">{getKelasName(detailUjian.kelasId)}</span>
                    <span className="text-slate-600 font-normal">{getMapelName(detailUjian.mataPelajaranId)}</span>
                  </>
                }
              />
              <InfoRow label="Bank Soal" value={detailUjian.bankSoalJudul} />
              <InfoRow
                label="Kategori Nilai"
                value={
                  <>
                    <span className="block">{detailUjian.kategoriNama}</span>
                    {detailUjian.kategoriHasNilai && detailUjian.kategoriKe && (
                      <span className="text-slate-600 font-normal">Ke-{detailUjian.kategoriKe}</span>
                    )}
                  </>
                }
              />
            </div>
            <div className="space-y-0 divide-y divide-slate-100">
              <InfoRow label="Durasi Ujian" value={`${detailUjian.durasiMenit} menit`} />
              <InfoRow
                label="Waktu Mulai"
                value={`${detailUjian.tanggalMulai} ${detailUjian.jamMulai}`}
              />
              <InfoRow
                label="Waktu Selesai"
                value={`${detailUjian.tanggalSelesai} ${detailUjian.jamSelesai}`}
              />
              <InfoRow
                label="Pengaturan Ujian"
                value={
                  <span className="font-normal text-slate-700">
                    Acak soal: {detailUjian.acakSoal ? 'Ya' : 'Tidak'} ·{' '}
                    Tampilkan nilai: {detailUjian.tunjukanHasilNilai ? 'Ya' : 'Tidak'}
                  </span>
                }
              />
            </div>
          </div>
        </section>

        {/* Section 2 — Monitoring Pengerjaan Murid */}
        <section className="rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                Monitoring Pengerjaan Murid
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="flex items-center gap-1.5 !bg-emerald-50 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100"
                onClick={handleExportExcel}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex items-center gap-1.5 !bg-red-50 !border-red-200 !text-red-700 hover:!bg-red-100"
                onClick={handleExportPDF}
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {/* Desktop: table */}
            <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-slate-700">Nama Murid</th>
                    <th className="px-5 py-4 text-left font-semibold text-slate-700">Status Ujian</th>
                    <th className="px-5 py-4 text-center font-semibold text-slate-700">Nilai</th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {muridInKelas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">
                        Belum ada data murid untuk kelas ini.
                      </td>
                    </tr>
                  ) : muridInKelas.map((m) => {
                    const attempt = detailAttempts.find((a) => a.muridId === m.id);
                    const statusKey = getDisplayStatus(attempt);
                    const nilaiText = !attempt
                      ? '–'
                      : attempt.skorTotal != null
                        ? String(attempt.skorTotal)
                        : attempt.skorAuto != null
                          ? String(attempt.skorAuto)
                          : '–';

                    const isSelesai = statusKey === 'selesai';
                    const canResetDanIzinkanEdit = isSelesai && !ujianSudahLewat;
                    const resetIzinkanTooltip = !isSelesai
                      ? 'Hanya tersedia setelah murid selesai mengerjakan'
                      : ujianSudahLewat
                        ? 'Tidak tersedia setelah waktu ujian berakhir'
                        : undefined;

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900">{m.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">NISN: {m.nisn || '–'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={statusKey} />
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-slate-800">
                          {nilaiText}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => onLihatUjian(detailUjian, m)}
                            >
                              Lihat Ujian
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!canResetDanIzinkanEdit}
                              title={resetIzinkanTooltip}
                              onClick={() => onReset(detailUjian, m.id)}
                            >
                              Reset Ujian
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="!bg-transparent border border-slate-300 text-slate-700 hover:!bg-slate-50"
                              disabled={!canResetDanIzinkanEdit}
                              title={resetIzinkanTooltip}
                              onClick={() => onIzinkanEdit(detailUjian, m.id)}
                            >
                              Izinkan Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
              {muridInKelas.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
                  Belum ada data murid untuk kelas ini.
                </div>
              ) : muridInKelas.map((m) => {
                const attempt = detailAttempts.find((a) => a.muridId === m.id);
                const statusKey = getDisplayStatus(attempt);
                const nilaiText = !attempt
                  ? '–'
                  : attempt.skorTotal != null
                    ? String(attempt.skorTotal)
                    : attempt.skorAuto != null
                      ? String(attempt.skorAuto)
                      : '–';

                const isSelesai = statusKey === 'selesai';
                const canResetDanIzinkanEdit = isSelesai && !ujianSudahLewat;
                const resetIzinkanTooltip = !isSelesai
                  ? 'Hanya tersedia setelah murid selesai mengerjakan'
                  : ujianSudahLewat
                    ? 'Tidak tersedia setelah waktu ujian berakhir'
                    : undefined;

                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 truncate">{m.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">NISN: {m.nisn || '–'}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={statusKey} />
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">{nilaiText}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        className="flex-1 min-w-0 sm:flex-none"
                        onClick={() => onLihatUjian(detailUjian, m)}
                      >
                        Lihat Ujian
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!canResetDanIzinkanEdit}
                        title={resetIzinkanTooltip}
                        onClick={() => onReset(detailUjian, m.id)}
                      >
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="!bg-transparent border border-slate-300 text-slate-700 hover:!bg-slate-50"
                        disabled={!canResetDanIzinkanEdit}
                        title={resetIzinkanTooltip}
                        onClick={() => onIzinkanEdit(detailUjian, m.id)}
                      >
                        Izinkan Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 flex gap-2 items-start text-sm text-slate-500">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                Status per murid, nilai ujian, dan tampilan jawaban detail murid akan otomatis terisi setelah modul pengerjaan ujian CBT digunakan oleh murid.
              </span>
            </p>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default DetailUjianModal;
