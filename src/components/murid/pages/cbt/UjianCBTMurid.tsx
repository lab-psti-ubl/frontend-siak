import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock, BookOpen, FileText, Calendar } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { useAuth } from '../../../../context/AuthContext';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../hooks/useKelas';
import { apiService } from '../../../../services/apiService';
import { CBTUjian, CBTUjianAttempt } from '../../../../types';
import { getTodayIndonesia } from '../../../../utils/absensiUtils';
import { useLanguage } from '../../../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const UjianCBTMurid: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { tahunAjaran } = useTahunAjaran();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();

  const activeTahunAjaran = tahunAjaran.find((ta) => ta.isActive);

  const { jadwalPelajaran } = useJadwalPelajaran(
    user?.kelasId && activeTahunAjaran
      ? {
          kelasId: user.kelasId,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [ujianList, setUjianList] = useState<CBTUjian[]>([]);
  const [attempts, setAttempts] = useState<CBTUjianAttempt[]>([]);

  const dateLocale = language === 'ms' ? 'ms-MY' : 'id-ID';

  const myKelas = useMemo(
    () => kelas.find((k) => k.id === user?.kelasId) || null,
    [kelas, user?.kelasId]
  );

  const myMapelIds = useMemo(
    () => Array.from(new Set(jadwalPelajaran.map((j) => j.mataPelajaranId))),
    [jadwalPelajaran]
  );

  const getMapelName = (mapelId: string) =>
    mataPelajaran.find((m) => m.id === mapelId)?.name || 'Unknown';

  const formatDateTime = (date: string, time?: string) => {
    if (!date) return '';
    try {
      const iso = `${date}T${time || '00:00'}:00`;
      const d = new Date(iso);
      return d.toLocaleString(dateLocale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return `${date} ${time || ''}`.trim();
    }
  };

  const getUjianStatus = (ujian: CBTUjian): { label: string; color: string } => {
    const start = new Date(`${ujian.tanggalMulai}T${ujian.jamMulai || '00:00'}:00`);
    const end = new Date(
      `${ujian.tanggalSelesai}T${ujian.jamSelesai || '23:59'}:59`
    );
    const now = new Date();

    const autoPublishThreshold = new Date(start.getTime() - 5 * 60 * 1000);
    const isEffectivelyPublished =
      ujian.isPublished || now >= autoPublishThreshold;

    if (!isEffectivelyPublished) {
      if (now < autoPublishThreshold) {
        return { label: 'Draft (menunggu jadwal)', color: 'text-slate-600' };
      }
      return { label: 'Segera dibuka', color: 'text-amber-600' };
    }

    if (now < start) {
      return { label: 'Belum dimulai', color: 'text-slate-600' };
    }
    if (now <= end) {
      return { label: 'Dapat diikuti', color: 'text-emerald-600' };
    }
    return { label: 'Selesai', color: 'text-slate-500' };
  };

  useEffect(() => {
    if (!user || !activeTahunAjaran || !user.kelasId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await apiService.getAllCBTUjian({
          kelasId: user.kelasId,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        });
        if (response.success && response.data) {
          const today = getTodayIndonesia();
          const list = (response.data as CBTUjian[]).filter((u) =>
            myMapelIds.includes(u.mataPelajaranId) &&
            u.tanggalMulai === today
          );
          setUjianList(list);
        } else {
          setUjianList([]);
        }

        // Ambil semua attempt untuk murid ini
        const attemptRes = await apiService.getAllCBTUjianAttempt({
          muridId: user.id,
        });
        if (attemptRes.success && attemptRes.data) {
          setAttempts(attemptRes.data as CBTUjianAttempt[]);
        } else {
          setAttempts([]);
        }
      } catch (error) {
        console.error(error);
        setUjianList([]);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, activeTahunAjaran, myMapelIds]);

  if (!activeTahunAjaran) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tidak Ada Tahun Ajaran Aktif
        </h3>
        <p className="text-gray-600">
          Tidak ada tahun ajaran aktif yang tersedia. Hubungi wali kelas atau
          admin untuk informasi lebih lanjut.
        </p>
      </Card>
    );
  }

  if (!user || user.role !== 'murid') {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Hanya murid yang dapat mengakses modul ini
        </h3>
        <p className="text-gray-600">
          Silakan login sebagai murid untuk melihat jadwal ujian CBT.
        </p>
      </Card>
    );
  }

  const getKategoriBadgeClass = (nama: string) => {
    const n = (nama || '').toLowerCase();
    if (n.includes('uts')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (n.includes('uas')) return 'bg-violet-50 text-violet-700 border-violet-200';
    if (n.includes('tugas')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
      {/* HEADER – Bar biru gelap seperti KerjakanUjianCBT */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 bg-blue-800 text-white rounded-xl">
        <div>
          <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Ujian CBT Saya</div>
          <div className="text-lg font-bold mt-0.5">Jadwal Ujian Hari Ini</div>
        </div>
        <div>
          <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Kelas</div>
          <div className="text-sm font-semibold mt-0.5">{myKelas?.name || '–'}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Tahun Ajaran</div>
          <div className="text-sm font-semibold mt-0.5">
            {activeTahunAjaran.tahun} · Semester {activeTahunAjaran.semester}
          </div>
        </div>
      </div>

      {/* Section – Daftar Ujian */}
      <section className="rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            Ujian CBT Hari Ini
          </h3>
          <span className="text-xs text-slate-500 ml-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Hanya menampilkan ujian yang dijadwalkan hari ini
          </span>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-500">Memuat data ujian CBT...</p>
            </div>
          ) : ujianList.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Belum ada ujian CBT</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Tidak ada ujian CBT yang dijadwalkan untuk Anda hari ini.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ujianList.map((ujian) => {
                const status = getUjianStatus(ujian);
                const myAttempt = attempts.find((a) => a.ujianId === ujian.id);
                const hasFinished = myAttempt?.status === 'selesai';
                const isInProgress = myAttempt?.status === 'sedang';
                const isBelumMulaiUlang = myAttempt?.status === 'belum_mulai';
                const canStart = status.label === 'Dapat diikuti' && !hasFinished;
                const isMissed = status.label === 'Selesai' && !hasFinished;
                const shouldShowScore =
                  ujian.tunjukanHasilNilai &&
                  hasFinished &&
                  myAttempt?.skorTotal != null;
                const nisn = (user as any)?.nisn;

                const statusBadgeClass = status.color.includes('emerald')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : status.color.includes('amber')
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <div
                    key={ujian.id}
                    className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                              {getMapelName(ujian.mataPelajaranId)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              {ujian.durasiMenit} menit
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                              {formatDateTime(ujian.tanggalMulai, ujian.jamMulai)} – {formatDateTime(ujian.tanggalSelesai, ujian.jamSelesai)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-3 min-w-[160px]">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusBadgeClass}`}
                            >
                              {status.label}
                            </span>
                            {hasFinished && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                                Selesai
                              </span>
                            )}
                            {shouldShowScore && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                                Nilai: {myAttempt?.skorTotal}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant={canStart ? 'primary' : 'secondary'}
                            disabled={!canStart}
                            className="w-full sm:w-auto"
                            onClick={() => {
                              if (!canStart || !nisn) return;
                              navigate(`/ujian-cbt/${encodeURIComponent(nisn)}?ujianId=${encodeURIComponent(ujian.id)}`);
                            }}
                          >
                            {canStart
                              ? isInProgress
                                ? 'Lanjut mengerjakan ujian'
                                : isBelumMulaiUlang
                                  ? 'Mulai Ujian Ulang'
                                  : 'Mulai Ujian'
                              : hasFinished
                                ? 'Sudah selesai'
                                : isMissed
                                  ? 'Terlewatkan'
                                  : 'Belum dapat diakses'}
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
    </div>
  );
};

export default UjianCBTMurid;

