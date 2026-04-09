import React, { useEffect, useState } from 'react';
import { apiService } from '../../../../services/apiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle,
  Clock,
  FileX,
  Users,
  X,
  BarChart3,
} from 'lucide-react';

interface SpmbStats {
  zonasi: number;
  prestasi: number;
  afirmasi: number;
  perpindahan: number;
  total: number;
}

interface StatsByTahun {
  tahunAjaran: string;
  total: number;
  belumLengkap: number;
  pending: number;
  diterima: number;
  ditolak: number;
  zonasi: number;
  prestasi: number;
  afirmasi: number;
  perpindahan: number;
}

const COLORS = {
  total: '#3b82f6',
  belumLengkap: '#64748b',
  pending: '#f59e0b',
  diterima: '#10b981',
  ditolak: '#ef4444',
  zonasi: '#8b5cf6',
  prestasi: '#06b6d4',
  afirmasi: '#f97316',
  perpindahan: '#ec4899',
};

const AdminSpmbDashboard: React.FC = () => {
  const [latestTahunAjaran, setLatestTahunAjaran] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    belumLengkap: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [kategoriStats, setKategoriStats] = useState<SpmbStats | null>(null);
  const [statsByTahun, setStatsByTahun] = useState<StatsByTahun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [openingsRes, statsByTahunRes] = await Promise.all([
          apiService.getSpmbOpenings(),
          apiService.getSpmbStatsByTahunAjaran(),
        ]);

        const openings = openingsRes.success && openingsRes.openings?.length
          ? openingsRes.openings as Array<{ tahunAjaran: string; tanggalMulai?: string; createdAt?: string }>
          : [];
        const sorted = [...openings].sort((a, b) => {
          const dateA = a.tanggalMulai || a.createdAt || '';
          const dateB = b.tanggalMulai || b.createdAt || '';
          return dateB.localeCompare(dateA);
        });
        const tahun = sorted[0]?.tahunAjaran || null;
        setLatestTahunAjaran(tahun);

        if (statsByTahunRes.success && statsByTahunRes.stats?.length) {
          setStatsByTahun(statsByTahunRes.stats);
        } else {
          setStatsByTahun([]);
        }

        if (tahun) {
          const [regRes, catRes] = await Promise.all([
            apiService.getSpmbRegistrations({ tahunAjaran: tahun }),
            apiService.getSpmbApplicantStats({ tahunAjaran: tahun }),
          ]);
          const regs = (regRes.success && regRes.registrations) ? regRes.registrations : [];
          setStats({
            total: regs.length,
            belumLengkap: regs.filter((r: any) => r.status === 'belum_lengkap').length,
            pending: regs.filter((r: any) => r.status === 'pending').length,
            accepted: regs.filter((r: any) => r.status === 'diterima').length,
            rejected: regs.filter((r: any) => r.status === 'ditolak').length,
          });
          if (catRes.success && catRes.stats) {
            setKategoriStats(catRes.stats);
          } else {
            setKategoriStats({
              zonasi: 0,
              prestasi: 0,
              afirmasi: 0,
              perpindahan: 0,
              total: 0,
            });
          }
        } else {
          setStats({ total: 0, belumLengkap: 0, pending: 0, accepted: 0, rejected: 0 });
          setKategoriStats({
            zonasi: 0,
            prestasi: 0,
            afirmasi: 0,
            perpindahan: 0,
            total: 0,
          });
        }
      } catch (err) {
        setStats({ total: 0, belumLengkap: 0, pending: 0, accepted: 0, rejected: 0 });
        setKategoriStats(null);
        setStatsByTahun([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartDataTotal = statsByTahun.map((s) => ({
    name: s.tahunAjaran,
    Total: s.total,
    'Belum Lengkap': s.belumLengkap,
    Menunggu: s.pending,
    Diterima: s.diterima,
    Ditolak: s.ditolak,
  }));

  const chartDataKategori = statsByTahun.map((s) => ({
    name: s.tahunAjaran,
    Zonasi: s.zonasi,
    Prestasi: s.prestasi,
    Afirmasi: s.afirmasi,
    Perpindahan: s.perpindahan,
  }));

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-6">
      {/* Header Section - sama gaya Data Pendaftar SPMB */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                  Dashboard SPMB
                </h1>
                <p className="text-xs sm:text-sm text-blue-100">
                  {latestTahunAjaran
                    ? `Statistik pendaftar Tahun Ajaran ${latestTahunAjaran}`
                    : 'Belum ada pembukaan SPMB. Statistik mengikuti tahun ajaran pembukaan terbaru.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - sama dengan halaman Data Pendaftar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Total Pendaftar</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
                  {loading ? '-' : stats.total}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-blue-100 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Belum Lengkap</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
                  {loading ? '-' : stats.belumLengkap}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-slate-100 group-hover:scale-110 transition-transform">
                <FileX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Menunggu</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
                  {loading ? '-' : stats.pending}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-amber-100 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Diterima</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
                  {loading ? '-' : stats.accepted}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-emerald-100 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Ditolak</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
                  {loading ? '-' : stats.rejected}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-red-100 group-hover:scale-110 transition-transform">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats kategori pendaftar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <p className="text-xs sm:text-sm text-slate-600">Zonasi</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
              {loading ? '-' : kategoriStats?.zonasi ?? 0}
            </p>
          </div>
        </div>
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <p className="text-xs sm:text-sm text-slate-600">Prestasi</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
              {loading ? '-' : kategoriStats?.prestasi ?? 0}
            </p>
          </div>
        </div>
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <p className="text-xs sm:text-sm text-slate-600">Afirmasi</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
              {loading ? '-' : kategoriStats?.afirmasi ?? 0}
            </p>
          </div>
        </div>
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <p className="text-xs sm:text-sm text-slate-600">Perpindahan</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
              {loading ? '-' : kategoriStats?.perpindahan ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Grafik Statistik per Tahun Ajaran */}
      {statsByTahun.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Grafik Statistik per Tahun Ajaran
            </h2>
          </div>

          {/* Grafik Total & Status */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-medium text-slate-900">
                Jumlah Pendaftar & Status per Tahun Ajaran
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan total pendaftar dan breakdown status (Belum Lengkap, Menunggu, Diterima, Ditolak)
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="h-72 sm:h-80 lg:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartDataTotal}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [value, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: 16 }} />
                    <Bar dataKey="Total" fill={COLORS.total} radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="Belum Lengkap" fill={COLORS.belumLengkap} radius={[4, 4, 0, 0]} name="Belum Lengkap" />
                    <Bar dataKey="Menunggu" fill={COLORS.pending} radius={[4, 4, 0, 0]} name="Menunggu" />
                    <Bar dataKey="Diterima" fill={COLORS.diterima} radius={[4, 4, 0, 0]} name="Diterima" />
                    <Bar dataKey="Ditolak" fill={COLORS.ditolak} radius={[4, 4, 0, 0]} name="Ditolak" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Grafik Kategori Pendaftar */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-medium text-slate-900">
                Kategori Pendaftar per Tahun Ajaran
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Zonasi, Prestasi, Afirmasi, dan Perpindahan
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="h-72 sm:h-80 lg:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartDataKategori}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [value, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: 16 }} />
                    <Bar dataKey="Zonasi" fill={COLORS.zonasi} radius={[4, 4, 0, 0]} name="Zonasi" />
                    <Bar dataKey="Prestasi" fill={COLORS.prestasi} radius={[4, 4, 0, 0]} name="Prestasi" />
                    <Bar dataKey="Afirmasi" fill={COLORS.afirmasi} radius={[4, 4, 0, 0]} name="Afirmasi" />
                    <Bar dataKey="Perpindahan" fill={COLORS.perpindahan} radius={[4, 4, 0, 0]} name="Perpindahan" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpmbDashboard;
