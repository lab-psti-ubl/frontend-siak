import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, ChevronLeft, ChevronRight, FileCheck, FileX, Filter, GraduationCap, Hash, Heart, MapPin, Phone, School, Search, User, Users, X } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { apiService } from '../../../../services/apiService';
import { Kelas, SpmbRegistration } from '../../../../types';
import { showErrorToast, showSuccessToast } from '../../../ui/ToastContainer';
import { useJurusan } from '../../../../hooks/useJurusan';
import { shouldShowJurusanSync } from '../../../../utils/jenjangPendidikanUtils';
import { useKelas } from '../../../../hooks/useKelas';
import { exportSpmbRegistrationsToExcel } from '../../../../utils/spmbExportUtils';

const DataDiterimaSpmb: React.FC = () => {
  const [registrations, setRegistrations] = useState<SpmbRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState<string>('semua');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegistration, setSelectedRegistration] = useState<SpmbRegistration | null>(null);
  const [selectedJurusanId, setSelectedJurusanId] = useState<string>('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStep, setAssignStep] = useState<1 | 2>(1);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedToAssign, setSelectedToAssign] = useState<Set<string>>(new Set());
  const [maxAssignCount, setMaxAssignCount] = useState<number>(0);
  const [assignGenderFilter, setAssignGenderFilter] = useState<'all' | 'L' | 'P'>('all');
  const [assignPage, setAssignPage] = useState(1);
  const ASSIGN_PER_PAGE = 15;
  const showJurusan = shouldShowJurusanSync();
  const { jurusan, loading: jurusanLoading } = useJurusan();
  const { kelas } = useKelas();

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const res = await apiService.getSpmbRegistrations({ status: 'diterima' });
      if (res.success && res.registrations) {
        setRegistrations(res.registrations as SpmbRegistration[]);
      } else {
        showErrorToast('Error', res.message || 'Gagal memuat data murid diterima SPMB');
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat memuat data murid diterima SPMB');
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
      return true;
    });
  }, [registrations, filterTahunAjaran]);

  const registrationsByJurusan = useMemo(() => {
    if (!showJurusan) return baseFilteredRegistrations;
    if (!selectedJurusanId) return baseFilteredRegistrations;
    return baseFilteredRegistrations.filter(r => r.pilihanJurusan === selectedJurusanId);
  }, [baseFilteredRegistrations, showJurusan, selectedJurusanId]);

  const filteredRegistrations = useMemo(() => {
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

  const kelasAwalOptions: Kelas[] = useMemo(() => {
    if (!kelas || kelas.length === 0) return [];
    const minTingkat = Math.min(...kelas.map(k => k.tingkat));
    return kelas.filter(k => k.tingkat === minTingkat);
  }, [kelas]);

  const availableRegistrations = useMemo(
    () => filteredRegistrations.filter(r => !r.assignedToClass),
    [filteredRegistrations]
  );

  const genderFilteredAvailableRegistrations = useMemo(() => {
    if (assignGenderFilter === 'all') return availableRegistrations;
    return availableRegistrations.filter(r => r.jenisKelamin === assignGenderFilter);
  }, [availableRegistrations, assignGenderFilter]);

  const assignTotalPages = Math.max(1, Math.ceil(genderFilteredAvailableRegistrations.length / ASSIGN_PER_PAGE));
  const paginatedAssignRegistrations = useMemo(() => {
    const start = (assignPage - 1) * ASSIGN_PER_PAGE;
    return genderFilteredAvailableRegistrations.slice(start, start + ASSIGN_PER_PAGE);
  }, [genderFilteredAvailableRegistrations, assignPage]);

  const toggleAssignSelection = (id: string) => {
    setSelectedToAssign(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (maxAssignCount > 0 && next.size >= maxAssignCount) {
          showErrorToast(
            'Batas tercapai',
            `Maksimal ${maxAssignCount} murid dapat dimasukkan ke kelas ini.`
          );
          return next;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenAssignModal = () => {
    const availableCount = availableRegistrations.length;
    setSelectedToAssign(new Set());
    setMaxAssignCount(availableCount > 0 ? availableCount : 0);
    setAssignPage(1);
    if (!selectedKelasId && kelasAwalOptions[0]) {
      setSelectedKelasId(kelasAwalOptions[0].id);
    }
    setAssignStep(1);
    setIsAssignModalOpen(true);
  };

  const handleSubmitAssign = async () => {
    if (!selectedKelasId || selectedToAssign.size === 0) {
      showErrorToast('Error', 'Pilih kelas tujuan dan minimal satu murid.');
      return;
    }
    try {
      setLoading(true);
      const res = await apiService.assignSpmbRegistrationsToClass({
        kelasId: selectedKelasId,
        registrationIds: Array.from(selectedToAssign),
      });
      if (res.success) {
        showSuccessToast(
          'Berhasil',
          `Berhasil memasukkan ${res.createdCount || 0} murid ke kelas.`
        );
        setIsAssignModalOpen(false);
        setSelectedToAssign(new Set());
        setAssignStep(1);
        await loadRegistrations();
      } else {
        showErrorToast('Error', res.message || 'Gagal memasukkan murid ke kelas.');
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat memasukkan murid ke kelas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
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
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                  {showJurusan && selectedJurusanId
                    ? `Diterima Jurusan ${jurusanMap.get(selectedJurusanId)?.name || selectedJurusanId}`
                    : 'Data Diterima SPMB'}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100">
                  {showJurusan && !selectedJurusanId
                    ? 'Pilih jurusan terlebih dahulu untuk melihat murid diterima.'
                    : 'Daftar calon murid baru yang telah dinyatakan diterima melalui proses SPMB.'}
                </p>
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
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-colors"
              >
                <option value="semua">Semua Tahun Ajaran</option>
                {tahunAjaranOptions.map(tahun => (
                  <option key={tahun} value={tahun}>
                    {tahun}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    if (!filteredRegistrations.length) {
                      showErrorToast(
                        'Tidak ada data',
                        'Tidak ada murid diterima yang sesuai dengan filter saat ini.'
                      );
                      return;
                    }
                    const tahun =
                      filterTahunAjaran !== 'semua'
                        ? filterTahunAjaran.replace(/\s+/g, '-')
                        : 'semua-tahun';
                    exportSpmbRegistrationsToExcel(
                      `data-diterima-spmb-${tahun}.xlsx`,
                      filteredRegistrations
                    );
                  }}
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
                dari <span className="font-semibold text-slate-900">{registrations.length}</span> murid diterima
              </>
            )}
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && registrations.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-500 text-sm">
            Memuat data murid diterima...
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
                          <div className="p-2.5 rounded-lg bg-emerald-100 flex-shrink-0 group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-slate-900 text-sm truncate">{j.name}</h3>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Kode: {j.code}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-600">Jumlah diterima</span>
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
            Belum ada murid yang diterima untuk filter yang dipilih.
          </div>
        ) : (
          <>
            {/* Desktop / Tablet: Tabel */}
            <div className="hidden md:block">
              <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                  Daftar Murid Diterima
                </h3>
                {availableRegistrations.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleOpenAssignModal}
                    disabled={loading}
                  >
                    Masukkan ke Kelas
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Nama</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Tahun Ajaran</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Asal Sekolah</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Kontak</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Status</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRegistrations.map(reg => (
                      <tr key={reg.id} className="bg-emerald-50/40">
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-slate-900">{reg.namaLengkap}</div>
                          {reg.nisn && (
                            <div className="text-xs text-slate-500">NISN: {reg.nisn}</div>
                          )}
                          {reg.pilihanJurusan && (
                            <div className="text-xs text-slate-500">
                            Jurusan: {jurusanMap.get(reg.pilihanJurusan)?.name || reg.pilihanJurusan}
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
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 w-max">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Diterima
                            </span>
                            {reg.assignedToClass && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 w-max">
                                Sudah dimasukkan ke kelas
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedRegistration(reg)}
                            disabled={loading}
                          >
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Card list */}
            <div className="md:hidden p-4 space-y-3">
              {availableRegistrations.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  className="w-full mb-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleOpenAssignModal}
                  disabled={loading}
                >
                  Masukkan ke Kelas
                </Button>
              )}
              {filteredRegistrations.map(reg => (
                <Card
                  key={reg.id}
                  className="p-3 border border-emerald-200 bg-emerald-50/70"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {reg.namaLengkap}
                        </p>
                        <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Diterima
                        </span>
                      </div>
                      {reg.assignedToClass && (
                        <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 inline-flex items-center gap-1 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Sudah dimasukkan ke kelas
                        </p>
                      )}
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
                      className="w-full justify-center"
                      onClick={() => setSelectedRegistration(reg)}
                      disabled={loading}
                    >
                      Detail
                    </Button>
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
            <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 px-5 sm:px-6 py-5 sm:py-6">
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
                    <span className="text-xs text-emerald-100">TA {selectedRegistration.tahunAjaran}</span>
                    <span className="text-emerald-300">·</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/20 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Diterima
                    </span>
                    {selectedRegistration.assignedToClass && (
                      <>
                        <span className="text-emerald-300">·</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/20 text-white">
                          Sudah di kelas
                        </span>
                      </>
                    )}
                  </div>
                  {selectedRegistration.nisn && (
                    <p className="text-xs text-emerald-200 mt-1">NISN: {selectedRegistration.nisn}</p>
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
                  <div className="p-1.5 rounded-lg bg-emerald-100">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Data Calon Murid</h4>
                </div>
                <div className="bg-slate-50/70 rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {[
                    ['Nama Lengkap', selectedRegistration.namaLengkap],
                    selectedRegistration.nikAnak ? ['NIK Anak', selectedRegistration.nikAnak] : null,
                    selectedRegistration.nomorKk ? ['Nomor KK', selectedRegistration.nomorKk] : null,
                    selectedRegistration.tempatLahir ? ['Tempat Lahir', selectedRegistration.tempatLahir] : null,
                    selectedRegistration.tanggalLahir ? ['Tanggal Lahir', selectedRegistration.tanggalLahir] : null,
                    ['Asal Sekolah', selectedRegistration.asalSekolah],
                  ].filter((item): item is [string, string] => item !== null).map(([label, value]) => (
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
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <Heart className="w-4 h-4 text-teal-600" />
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
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
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
      {/* Assign to class modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-5 sm:px-6 py-5">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setAssignStep(1);
                  setSelectedToAssign(new Set());
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <School className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Masukkan Murid ke Kelas</h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {availableRegistrations.length} murid tersedia untuk dimasukkan
                  </p>
                </div>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                    assignStep >= 1 ? 'bg-white text-blue-700' : 'bg-white/20 text-white/60'
                  }`}>
                    1
                  </div>
                  <span className={`text-xs font-medium truncate ${assignStep >= 1 ? 'text-white' : 'text-white/50'}`}>
                    Atur Kelas
                  </span>
                </div>
                <div className={`flex-shrink-0 w-8 h-px ${assignStep >= 2 ? 'bg-white' : 'bg-white/25'}`} />
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                    assignStep >= 2 ? 'bg-white text-blue-700' : 'bg-white/20 text-white/60'
                  }`}>
                    2
                  </div>
                  <span className={`text-xs font-medium truncate ${assignStep >= 2 ? 'text-white' : 'text-white/50'}`}>
                    Pilih Murid
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
              {assignStep === 1 && (
                <div className="space-y-5">
                  {/* Info banner */}
                  <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3.5 border border-blue-100">
                    <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Tentukan jumlah murid dan kelas tujuan. Murid yang sudah pernah dimasukkan ke kelas tidak akan tampil.
                    </p>
                  </div>

                  {/* Jumlah Murid */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-md bg-slate-100">
                        <Hash className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <label className="text-sm font-semibold text-slate-800">Jumlah Murid</label>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={availableRegistrations.length || 0}
                      value={maxAssignCount || ''}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (Number.isNaN(val)) {
                          setMaxAssignCount(0);
                          setSelectedToAssign(new Set());
                          return;
                        }
                        const clamped = Math.max(1, Math.min(val, availableRegistrations.length || 0));
                        setMaxAssignCount(clamped);
                        setSelectedToAssign(prev => {
                          if (prev.size <= clamped) return prev;
                          return new Set();
                        });
                      }}
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-sm"
                      placeholder={`Maks. ${availableRegistrations.length} murid`}
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Tersedia {availableRegistrations.length} murid yang belum masuk kelas
                    </p>
                  </div>

                  {/* Kelas Tujuan */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-md bg-slate-100">
                        <School className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <label className="text-sm font-semibold text-slate-800">Kelas Tujuan</label>
                    </div>
                    <select
                      value={selectedKelasId}
                      onChange={e => setSelectedKelasId(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-sm appearance-none"
                    >
                      <option value="">Pilih kelas awal...</option>
                      {kelasAwalOptions.map(k => (
                        <option key={k.id} value={k.id}>
                          {k.name}
                        </option>
                      ))}
                    </select>
                    {kelasAwalOptions.length === 0 && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Belum ada kelas awal yang tersedia.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {assignStep === 2 && (
                <div className="space-y-4">
                  {/* Selection header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Pilih Murid</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {genderFilteredAvailableRegistrations.length} murid tersedia
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={assignGenderFilter}
                        onChange={e => {
                        setAssignGenderFilter(e.target.value as 'all' | 'L' | 'P');
                        setSelectedToAssign(new Set());
                        setAssignPage(1);
                        }}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="all">Semua Gender</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  {/* Selected counter badge */}
                  {selectedToAssign.size > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3.5 py-2.5 border border-emerald-100">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">
                        {selectedToAssign.size} dari {maxAssignCount} murid dipilih
                      </span>
                      <div className="flex-1" />
                      <div className="h-1.5 w-20 bg-emerald-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (selectedToAssign.size / maxAssignCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Student list */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    {genderFilteredAvailableRegistrations.length === 0 ? (
                      <div className="py-10 text-center">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">Tidak ada murid yang tersedia</p>
                      </div>
                    ) : (
                      paginatedAssignRegistrations.map((reg, idx) => {
                        const isSelected = selectedToAssign.has(reg.id);
                        return (
                          <label
                            key={reg.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              idx !== 0 ? 'border-t border-slate-100' : ''
                            } ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                              isSelected
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {reg.namaLengkap.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                {reg.namaLengkap}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {reg.nisn && (
                                  <span className="text-[11px] text-slate-400">NISN: {reg.nisn}</span>
                                )}
                                {reg.jenisKelamin && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-[11px] text-slate-400">
                                      {reg.jenisKelamin === 'L' ? 'L' : 'P'}
                                    </span>
                                  </>
                                )}
                                <span className="text-slate-300">·</span>
                                <span className="text-[11px] text-slate-400 truncate">{reg.asalSekolah}</span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => toggleAssignSelection(reg.id)}
                            />
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination */}
                  {assignTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Hal. {assignPage}/{assignTotalPages} &middot; {genderFilteredAvailableRegistrations.length} murid
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAssignPage(p => Math.max(1, p - 1))}
                          disabled={assignPage <= 1}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        {Array.from({ length: assignTotalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === assignTotalPages || Math.abs(p - assignPage) <= 1)
                          .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('dots');
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((item, i) =>
                            item === 'dots' ? (
                              <span key={`dots-${i}`} className="px-1 text-[11px] text-slate-300">...</span>
                            ) : (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setAssignPage(item)}
                                className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
                                  assignPage === item
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {item}
                              </button>
                            )
                          )}
                        <button
                          type="button"
                          onClick={() => setAssignPage(p => Math.min(assignTotalPages, p + 1))}
                          disabled={assignPage >= assignTotalPages}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (assignStep === 2) {
                    setAssignStep(1);
                  } else {
                    setIsAssignModalOpen(false);
                    setSelectedToAssign(new Set());
                  }
                }}
              >
                {assignStep === 2 ? (
                  <>Kembali</>
                ) : (
                  'Batal'
                )}
              </Button>
              <div className="flex gap-2">
                {assignStep === 1 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAssignStep(2)}
                    disabled={
                      !selectedKelasId ||
                      availableRegistrations.length === 0 ||
                      !maxAssignCount ||
                      maxAssignCount < 1
                    }
                    className="flex items-center justify-centerbg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Lanjut Pilih Murid
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                )}
                {assignStep === 2 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmitAssign}
                    disabled={selectedToAssign.size === 0 || !selectedKelasId || loading}
                    className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? (
                      'Mengirim...'
                    ) : (
                      <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Kirim {selectedToAssign.size} Murid ke Kelas</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDiterimaSpmb;

