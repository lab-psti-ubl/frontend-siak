import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, Clock, FileCheck, FileX, Filter, GraduationCap, Heart, MapPin, Phone, Search, User, Users, X } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { apiService } from '../../../../services/apiService';
import { SpmbRegistration } from '../../../../types';
import { showErrorToast, showSuccessToast } from '../../../ui/ToastContainer';
import { useJurusan } from '../../../../hooks/useJurusan';
import { shouldShowJurusanSync } from '../../../../utils/jenjangPendidikanUtils';
import { exportSpmbRegistrationsToExcel } from '../../../../utils/spmbExportUtils';

const DataPendaftarSpmb: React.FC = () => {
  const [registrations, setRegistrations] = useState<SpmbRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'pending' | 'diterima' | 'ditolak'>('semua');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegistration, setSelectedRegistration] = useState<SpmbRegistration | null>(null);
  const [selectedJurusanId, setSelectedJurusanId] = useState<string>('');
  const showJurusan = shouldShowJurusanSync();
  const { jurusan, loading: jurusanLoading } = useJurusan();

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const res = await apiService.getSpmbRegistrations();
      if (res.success && res.registrations) {
        setRegistrations(res.registrations as SpmbRegistration[]);
      } else {
        showErrorToast('Error', res.message || 'Gagal memuat data pendaftar SPMB');
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat memuat data pendaftar SPMB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const tahunAjaranOptions = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach(r => set.add(r.tahunAjaran));
    return Array.from(set).sort().reverse();
  }, [registrations]);

  const baseFilteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      if (filterTahunAjaran !== 'semua' && r.tahunAjaran !== filterTahunAjaran) {
        return false;
      }
      if (filterStatus !== 'semua' && r.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [registrations, filterTahunAjaran, filterStatus]);

  const registrationsByJurusan = useMemo(() => {
    if (!showJurusan) return baseFilteredRegistrations;
    if (!selectedJurusanId) return baseFilteredRegistrations;
    return baseFilteredRegistrations.filter(r => r.pilihanJurusan === selectedJurusanId);
  }, [baseFilteredRegistrations, showJurusan, selectedJurusanId]);

  const filteredRegistrations = useMemo(() => {
    // Search term berlaku untuk daftar pendaftar, bukan untuk daftar jurusan.
    if (showJurusan && !selectedJurusanId) return registrationsByJurusan;

    const term = searchTerm.toLowerCase().trim();
    if (!term) return registrationsByJurusan;

    return registrationsByJurusan.filter(r => {
      const combined = `${r.namaLengkap} ${r.nisn || ''} ${r.asalSekolah || ''} ${r.noWhatsappOrtu || ''} ${
        r.email || ''
      }`.toLowerCase();
      return combined.includes(term);
    });
  }, [registrationsByJurusan, searchTerm, showJurusan, selectedJurusanId]);

  const stats = useMemo(() => {
    const statsSource = showJurusan && !selectedJurusanId ? baseFilteredRegistrations : registrationsByJurusan;
    const total = statsSource.length;
    const pending = statsSource.filter(r => r.status === 'pending').length;
    const accepted = statsSource.filter(r => r.status === 'diterima').length;
    const rejected = statsSource.filter(r => r.status === 'ditolak').length;
    return { total, pending, accepted, rejected };
  }, [baseFilteredRegistrations, registrationsByJurusan, showJurusan, selectedJurusanId]);

  const activeJurusan = useMemo(() => jurusan.filter(j => j.isActive), [jurusan]);
  const jurusanMap = useMemo(() => {
    const map = new Map<string, (typeof jurusan)[number]>();
    jurusan.forEach(j => map.set(j.id, j));
    return map;
  }, [jurusan]);

  const jurusanCards = useMemo(() => {
    if (!showJurusan) return [];
    const counts = new Map<string, number>();
    baseFilteredRegistrations.forEach(r => {
      const jid = r.pilihanJurusan || '';
      if (!jid) return;
      counts.set(jid, (counts.get(jid) || 0) + 1);
    });
    return activeJurusan
      .map(j => ({
        ...j,
        count: counts.get(j.id) || 0,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [activeJurusan, baseFilteredRegistrations, showJurusan]);

  const handleExportExcel = () => {
    if (!filteredRegistrations.length) {
      showErrorToast('Tidak ada data', 'Tidak ada pendaftar yang sesuai dengan filter saat ini.');
      return;
    }
    const tahun =
      filterTahunAjaran !== 'semua'
        ? filterTahunAjaran.replace(/\s+/g, '-')
        : 'semua-tahun';
    exportSpmbRegistrationsToExcel(
      `data-pendaftar-spmb-${tahun}.xlsx`,
      filteredRegistrations
    );
  };

  const handleUpdateStatus = async (reg: SpmbRegistration, status: 'pending' | 'diterima' | 'ditolak') => {
    if (reg.status === status) return;
    try {
      setLoading(true);
      const res = await apiService.updateSpmbRegistrationStatus(reg.id, status);
      if (res.success) {
        showSuccessToast('Berhasil', 'Status pendaftar berhasil diperbarui');
        await loadRegistrations();
      } else {
        showErrorToast('Error', res.message || 'Gagal memperbarui status pendaftar');
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat memperbarui status pendaftar');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SpmbRegistration['status']) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
          Menunggu
        </span>
      );
    }
    if (status === 'diterima') {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Diterima
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        Ditolak
      </span>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {showJurusan && selectedJurusanId && (
                <button
                  onClick={() => setSelectedJurusanId('')}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  title="Kembali"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              )}
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                  {showJurusan && selectedJurusanId
                    ? `Pendaftar Jurusan ${jurusanMap.get(selectedJurusanId)?.name || selectedJurusanId}`
                    : 'Data Pendaftar SPMB'}
                </h1>
                <p className="text-xs sm:text-sm text-blue-100">
                  {showJurusan && !selectedJurusanId
                    ? 'Pilih jurusan terlebih dahulu untuk melihat data pendaftar.'
                    : 'Kelola pendaftar SPMB dan tetapkan status kelulusan dengan mudah.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Total Pendaftar</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
                  {stats.total}
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
                <p className="text-xs sm:text-sm text-slate-600">Menunggu</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
                  {stats.pending}
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
                  {stats.accepted}
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
                  {stats.rejected}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-red-100 group-hover:scale-110 transition-transform">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder={
                    showJurusan && !selectedJurusanId
                      ? 'Cari nama jurusan...'
                      : 'Cari nama, NISN, asal sekolah, atau WA orang tua...'
                  }
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700">Filter</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center justify-end">
              <select
                value={filterTahunAjaran}
                onChange={e => setFilterTahunAjaran(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="semua">Semua Tahun Ajaran</option>
                {tahunAjaranOptions.map(tahun => (
                  <option key={tahun} value={tahun}>
                    {tahun}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="semua">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="diterima">Diterima</option>
                <option value="ditolak">Ditolak</option>
              </select>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleExportExcel}
                  disabled={loading || filteredRegistrations.length === 0}
                >
                  Export Excel
                </Button>
              </div>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            Menampilkan{' '}
            <span className="font-semibold text-slate-900">
              {showJurusan && !selectedJurusanId ? jurusanCards.length : filteredRegistrations.length}
            </span>{' '}
            {showJurusan && !selectedJurusanId ? (
              <span>jurusan</span>
            ) : (
              <>
                dari <span className="font-semibold text-slate-900">{registrations.length}</span> pendaftar
              </>
            )}
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && registrations.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-500 text-sm">
            Memuat data pendaftar...
          </div>
        ) : showJurusan && !selectedJurusanId ? (
          <div className="p-4 sm:p-5 lg:p-6">
            {jurusanLoading ? (
              <div className="py-10 text-center text-slate-500 text-sm">Memuat jurusan...</div>
            ) : jurusanCards.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                Belum ada jurusan aktif. Silakan tambah jurusan terlebih dahulu.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {jurusanCards
                  .filter(j => {
                    const term = searchTerm.toLowerCase().trim();
                    if (!term) return true;
                    return `${j.name} ${j.code}`.toLowerCase().includes(term);
                  })
                  .map(j => (
                    <button
                      key={j.id}
                      onClick={() => setSelectedJurusanId(j.id)}
                      className="text-left group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-lg bg-blue-100 flex-shrink-0 group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-slate-900 text-sm truncate">{j.name}</h3>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Kode: {j.code}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-600">Jumlah pendaftar</span>
                          <span className="text-sm font-semibold text-slate-900">{j.count}</span>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-500 text-sm">
            Belum ada pendaftar SPMB untuk filter yang dipilih.
          </div>
        ) : (
          <>
            {/* Desktop / Tablet: Tabel */}
            <div className="hidden md:block">
              <div className="px-5 pt-5 pb-3 border-b border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Daftar Pendaftar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Nama</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Tahun Ajaran</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Asal Sekolah</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">WA Ortu</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Status</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRegistrations.map(reg => (
                      <tr
                        key={reg.id}
                        className={
                          reg.status === 'diterima'
                            ? 'bg-emerald-50/40'
                            : reg.status === 'ditolak'
                            ? 'bg-red-50/40'
                            : ''
                        }
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-slate-900">{reg.namaLengkap}</div>
                          {reg.nisn && (
                            <div className="text-xs text-slate-500">NISN: {reg.nisn}</div>
                          )}
                          {showJurusan && reg.pilihanJurusan && (
                            <div className="text-xs text-slate-500">
                              Jurusan: {jurusanMap.get(reg.pilihanJurusan)?.name || reg.pilihanJurusan}
                            </div>
                          )}
                          {!showJurusan && reg.pilihanJurusan && (
                            <div className="text-xs text-slate-500">
                              Pilihan jurusan: {reg.pilihanJurusan}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top">{reg.tahunAjaran}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="text-slate-900">{reg.asalSekolah}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{reg.alamat}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <div className="text-slate-900">{reg.noWhatsappOrtu}</div>
                          {reg.email && (
                            <div className="text-xs text-slate-500 line-clamp-1">{reg.email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">{getStatusBadge(reg.status)}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedRegistration(reg)}
                              disabled={loading}
                            >
                              Detail
                            </Button>
                            {reg.status === 'pending' && (
                              <>
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(reg, 'diterima')}
                                  disabled={loading}
                                >
                                  Terima
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="!bg-red-50 !text-red-700 hover:!bg-red-100"
                                  onClick={() => handleUpdateStatus(reg, 'ditolak')}
                                  disabled={loading}
                                >
                                  Tolak
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Card list */}
            <div className="md:hidden p-4 space-y-3">
              {filteredRegistrations.map(reg => (
                <Card
                  key={reg.id}
                  className={`p-3 border ${
                    reg.status === 'diterima'
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : reg.status === 'ditolak'
                      ? 'border-red-200 bg-red-50/60'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {reg.namaLengkap}
                        </p>
                        {getStatusBadge(reg.status)}
                      </div>
                      {reg.nisn && (
                        <p className="text-[11px] text-slate-500">NISN: {reg.nisn}</p>
                      )}
                      {showJurusan && reg.pilihanJurusan && (
                        <p className="text-[11px] text-slate-500">
                          Jurusan: <span className="font-medium">{jurusanMap.get(reg.pilihanJurusan)?.name || reg.pilihanJurusan}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        Tahun ajaran: <span className="font-medium">{reg.tahunAjaran}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Asal sekolah: <span className="font-medium">{reg.asalSekolah}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        Alamat: <span className="font-medium">{reg.alamat}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        WA Ortu: <span className="font-medium">{reg.noWhatsappOrtu}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center"
                      onClick={() => setSelectedRegistration(reg)}
                      disabled={loading}
                    >
                      Detail
                    </Button>
                    {reg.status === 'pending' && (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="flex-1 justify-center"
                          onClick={() => handleUpdateStatus(reg, 'diterima')}
                          disabled={loading}
                        >
                          Terima
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 justify-center !bg-red-50 !text-red-700 hover:!bg-red-100"
                          onClick={() => handleUpdateStatus(reg, 'ditolak')}
                          disabled={loading}
                        >
                          Tolak
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-5 sm:px-6 py-5 sm:py-6">
              <button
                onClick={() => setSelectedRegistration(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                    {selectedRegistration.namaLengkap}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs text-blue-100">TA {selectedRegistration.tahunAjaran}</span>
                    <span className="text-blue-300">·</span>
                    {getStatusBadge(selectedRegistration.status)}
                  </div>
                  {selectedRegistration.nisn && (
                    <p className="text-xs text-blue-200 mt-1">NISN: {selectedRegistration.nisn}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {selectedRegistration.jenisKelamin && (
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Jenis Kelamin</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {selectedRegistration.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>
                )}
                {typeof selectedRegistration.umur === 'number' && selectedRegistration.umur > 0 && (
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Umur</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedRegistration.umur} tahun</p>
                  </div>
                )}
                {selectedRegistration.ringkasanNilaiRapor != null && (
                  <div className="bg-amber-50 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-amber-500 font-medium">Rata-Rata Nilai</p>
                    <p className="text-sm font-bold text-amber-700 mt-0.5">{selectedRegistration.ringkasanNilaiRapor}</p>
                  </div>
                )}
                {selectedRegistration.pilihanJurusan && (
                  <div className="bg-indigo-50 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-medium">Jurusan</p>
                    <p className="text-sm font-semibold text-indigo-700 mt-0.5 truncate">
                      {jurusanMap.get(selectedRegistration.pilihanJurusan)?.name || selectedRegistration.pilihanJurusan}
                    </p>
                  </div>
                )}
              </div>

              {/* Section A: Data Calon Murid */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Data Calon Murid</h4>
                </div>
                <div className="bg-slate-50/70 rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {([
                    ['Nama Lengkap', selectedRegistration.namaLengkap],
                    selectedRegistration.nikAnak ? ['NIK Anak', selectedRegistration.nikAnak] : null,
                    selectedRegistration.nomorKk ? ['Nomor KK', selectedRegistration.nomorKk] : null,
                    selectedRegistration.tempatLahir ? ['Tempat Lahir', selectedRegistration.tempatLahir] : null,
                    selectedRegistration.tanggalLahir ? ['Tanggal Lahir', selectedRegistration.tanggalLahir] : null,
                    ['Asal Sekolah', selectedRegistration.asalSekolah],
                  ] as ([string, string] | null)[])
                    .filter((item): item is [string, string] => item !== null)
                    .map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs font-medium text-slate-900 text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                  <div className="px-4 py-2.5">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-700 whitespace-pre-line">{selectedRegistration.alamat}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section B: Data Orang Tua / Wali */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100">
                    <Heart className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Data Orang Tua / Wali</h4>
                </div>
                <div className="bg-slate-50/70 rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {[
                    ['Nama Orang Tua/Wali', selectedRegistration.namaOrangTua || '-'],
                    ['NIK Orang Tua/Wali', selectedRegistration.nikOrangTua || '-'],
                    ['Pekerjaan', selectedRegistration.pekerjaanOrangTua || '-'],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs font-medium text-slate-900 text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-slate-700">{selectedRegistration.noWhatsappOrtu}</span>
                      <span className="text-[10px] text-slate-400">(WA Utama)</span>
                    </div>
                    {selectedRegistration.noHpOrangTua && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-700">{selectedRegistration.noHpOrangTua}</span>
                        <span className="text-[10px] text-slate-400">(HP Tambahan)</span>
                      </div>
                    )}
                    {selectedRegistration.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 ml-5.5">Email: {selectedRegistration.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section C: Dokumen Pendukung */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-1.5 rounded-lg bg-violet-100">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Dokumen Pendukung</h4>
                </div>
                <div className="bg-slate-50/70 rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {[
                    ['Kartu Keluarga (KK)', selectedRegistration.dokumenKk],
                    ['Akta Kelahiran', selectedRegistration.dokumenAktaKelahiran],
                    ['KTP Orang Tua/Wali', selectedRegistration.dokumenKtpOrangTua],
                    ['Kartu Imunisasi', selectedRegistration.dokumenKartuImunisasi],
                    ['Pas Foto', selectedRegistration.dokumenPasFoto],
                    ['Ijazah / SKL', selectedRegistration.dokumenIjazahAtauSkL],
                    ['Rapor', selectedRegistration.dokumenRapor],
                    ['KIP', selectedRegistration.dokumenKip],
                    ['Sertifikat Prestasi', selectedRegistration.dokumenSertifikatPrestasi],
                    ['Surat Ket. Sehat', selectedRegistration.dokumenSuratKeteranganSehat],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-2">
                        {value ? (
                          <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <FileX className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span className={`text-xs ${value ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          value
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {value ? 'Tersedia' : 'Belum ada'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {selectedRegistration.status === 'pending' && (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedRegistration, 'diterima')}
                      disabled={loading}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Terima
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="!bg-red-50 !text-red-600 hover:!bg-red-100 !border-red-200"
                      onClick={() => handleUpdateStatus(selectedRegistration, 'ditolak')}
                      disabled={loading}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Tolak
                    </Button>
                  </>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedRegistration(null)}
                size="sm"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPendaftarSpmb;

