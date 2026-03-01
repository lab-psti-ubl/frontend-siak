import React from 'react';
import {
  PlayCircle,
  Eye,
  BookOpen,
  Users,
  Clock,
  FileText,
  Send,
  Inbox,
  Filter,
} from 'lucide-react';
import Button from '../../../../ui/Button';
import type { CBTUjian } from '../../../../../types';

type TahunAjaran = { tahun: string; semester: number };

type FilterOpts = {
  kelasIds: string[];
  mapelIds: string[];
  kategoriNamas: string[];
};

type Props = {
  loading: boolean;
  ujianList: CBTUjian[];
  allUjianCount?: number;
  activeTahunAjaran: TahunAjaran | undefined;
  getMapelName: (id: string) => string;
  getKelasName: (id: string) => string;
  getUjianStatus: (ujian: CBTUjian) => string;
  onPublish: (ujian: CBTUjian) => void;
  onDetail: (ujian: CBTUjian) => void;
  filterKelasId?: string;
  filterMapelId?: string;
  filterStatus?: string;
  filterKategori?: string;
  onFilterKelasChange?: (v: string) => void;
  onFilterMapelChange?: (v: string) => void;
  onFilterStatusChange?: (v: string) => void;
  onFilterKategoriChange?: (v: string) => void;
  filterOpts?: FilterOpts;
};

const UjianListCard: React.FC<Props> = ({
  loading,
  ujianList,
  allUjianCount = 0,
  activeTahunAjaran,
  getMapelName,
  getKelasName,
  getUjianStatus,
  onPublish,
  onDetail,
  filterKelasId = '',
  filterMapelId = '',
  filterStatus = '',
  filterKategori = '',
  onFilterKelasChange,
  onFilterMapelChange,
  onFilterStatusChange,
  onFilterKategoriChange,
  filterOpts = { kelasIds: [], mapelIds: [], kategoriNamas: [] },
}) => {
  const hasFilters = !!(onFilterKelasChange || onFilterMapelChange || onFilterStatusChange || onFilterKategoriChange);
  const getStatusBadge = (ujian: CBTUjian) => {
    const status = getUjianStatus(ujian);
    if (status === 'Sedang berlangsung') {
      return { label: 'Sedang berlangsung', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (status === 'Selesai') {
      return { label: 'Selesai', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    return { label: 'Belum mulai', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  const getKategoriBadgeClass = (nama: string) => {
    const n = (nama || '').toLowerCase();
    if (n.includes('uts')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (n.includes('uas')) return 'bg-violet-50 text-violet-700 border-violet-200';
    if (n.includes('tugas')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const canPublish = (ujian: CBTUjian) => {
    const status = getUjianStatus(ujian);
    const start = new Date(`${ujian.tanggalMulai}T${ujian.jamMulai || '00:00'}:00`);
    const now = new Date();
    const autoPublishThreshold = new Date(start.getTime() - 5 * 60 * 1000);
    const isEffectivelyPublished = ujian.isPublished || now >= autoPublishThreshold;
    return status !== 'Selesai' && !isEffectivelyPublished;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center">
        <div className="inline-block w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500">Memuat data ujian CBT...</p>
      </div>
    );
  }

  if (ujianList.length === 0) {
    const isFilteredEmpty = allUjianCount > 0;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center">
        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          {isFilteredEmpty ? 'Tidak ada ujian yang sesuai filter' : 'Belum ada ujian CBT'}
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          {isFilteredEmpty
            ? 'Coba ubah atau hapus filter untuk menampilkan ujian.'
            : 'Klik tombol Tambah Ujian CBT di atas untuk membuat ujian baru.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Daftar Ujian CBT</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeTahunAjaran?.tahun} · Semester {activeTahunAjaran?.semester}
          </p>
        </div>
        {hasFilters && (filterOpts.kelasIds.length > 0 || filterOpts.mapelIds.length > 0 || filterOpts.kategoriNamas.length > 0) && (
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
            {filterOpts.kelasIds.length > 0 && onFilterKelasChange && (
              <select
                className="w-full sm:w-auto sm:min-w-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filterKelasId}
                onChange={(e) => onFilterKelasChange(e.target.value)}
              >
                <option value="">Semua Kelas</option>
                {filterOpts.kelasIds.map((id) => (
                  <option key={id} value={id}>{getKelasName(id)}</option>
                ))}
              </select>
            )}
            {filterOpts.mapelIds.length > 0 && onFilterMapelChange && (
              <select
                className="w-full sm:w-auto sm:min-w-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filterMapelId}
                onChange={(e) => onFilterMapelChange(e.target.value)}
              >
                <option value="">Semua Mapel</option>
                {filterOpts.mapelIds.map((id) => (
                  <option key={id} value={id}>{getMapelName(id)}</option>
                ))}
              </select>
            )}
            {onFilterStatusChange && (
              <select
                className="w-full sm:w-auto sm:min-w-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Sedang berlangsung">Sedang berlangsung</option>
                <option value="Selesai">Selesai</option>
              </select>
            )}
            {filterOpts.kategoriNamas.length > 0 && onFilterKategoriChange && (
              <select
                className="w-full sm:w-auto sm:min-w-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filterKategori}
                onChange={(e) => onFilterKategoriChange(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {filterOpts.kategoriNamas.map((nama) => (
                  <option key={nama} value={nama}>{nama}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {ujianList.map((ujian) => {
          const statusBadge = getStatusBadge(ujian);
          const publishDisabled = !canPublish(ujian);
          const isEffectivelyPublished = (() => {
            const start = new Date(`${ujian.tanggalMulai}T${ujian.jamMulai || '00:00'}:00`);
            const now = new Date();
            const autoPublishThreshold = new Date(start.getTime() - 5 * 60 * 1000);
            return ujian.isPublished || now >= autoPublishThreshold;
          })();

          return (
            <div
              key={ujian.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
            >
              <div className="p-5 sm:p-6">
                {/* Baris atas: Nama + kategori badge + status badge */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {ujian.judulUjian}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getKategoriBadgeClass(ujian.kategoriNama)}`}
                    >
                      {ujian.kategoriNama}
                      {ujian.kategoriHasNilai && ujian.kategoriKe != null && ` Ke-${ujian.kategoriKe}`}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {/* Baris tengah: Info grid dengan ikon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-900">{getKelasName(ujian.kelasId)}</div>
                      <div className="text-slate-500 text-xs">{getMapelName(ujian.mataPelajaranId)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-slate-900 truncate" title={ujian.bankSoalJudul}>
                        {ujian.bankSoalJudul}
                      </div>
                      <div className="text-slate-500 text-xs">Bank soal</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-900">{ujian.durasiMenit} menit</div>
                      <div className="text-slate-500 text-xs">Durasi</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-900">
                        {ujian.tanggalMulai} {ujian.jamMulai}
                      </div>
                      <div className="text-slate-500 text-xs">
                        s/d {ujian.tanggalSelesai} {ujian.jamSelesai}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Baris bawah: Publish badge + tombol aksi */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div>
                    {isEffectivelyPublished ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Send className="w-3.5 h-3.5" />
                        Sudah dipublish
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <Inbox className="w-3.5 h-3.5" />
                        Belum dipublish
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex items-center gap-1.5"
                      onClick={() => onDetail(ujian)}
                    >
                      <Eye className="w-4 h-4" />
                      Detail
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={publishDisabled}
                      onClick={() => onPublish(ujian)}
                      className="flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {publishDisabled ? 'Sudah dipublish' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UjianListCard;
