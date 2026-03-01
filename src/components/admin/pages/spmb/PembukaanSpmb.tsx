import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, Save } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { apiService } from '../../../../services/apiService';
import { SpmbOpening } from '../../../../types';
import { showErrorToast, showSuccessToast } from '../../../ui/ToastContainer';

const generateDefaultTahunAjaran = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  // Jika sudah masuk pertengahan tahun, default ke tahun ajaran berikutnya
  if (month >= 7) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

const generateNext10TahunAjaran = (): string[] => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  // Tahun ajaran umumnya dimulai sekitar Juli
  const startYear = month >= 7 ? year : year - 1;
  return Array.from({ length: 10 }, (_, i) => `${startYear + i}/${startYear + i + 1}`);
};

const PembukaanSpmb: React.FC = () => {
  const [openings, setOpenings] = useState<SpmbOpening[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState<string>('semua');
  const [deactivatingId, setDeactivatingId] = useState<string>('');
  const [tahunAjaranDropdown] = useState<string[]>(() => generateNext10TahunAjaran());
  const [formData, setFormData] = useState({
    tahunAjaran: generateDefaultTahunAjaran(),
    judul: 'Penerimaan Peserta Didik Baru',
    tanggalMulai: '',
    tanggalSelesai: '',
  });

  const loadOpenings = async () => {
    try {
      setLoading(true);
      const res = await apiService.getSpmbOpenings();
      if (res.success && res.openings) {
        setOpenings(res.openings as SpmbOpening[]);
      } else {
        showErrorToast('Error', res.message || 'Gagal memuat pembukaan SPMB');
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat memuat pembukaan SPMB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpenings();
  }, []);

  const handleDeactivateOpening = async (opening: SpmbOpening) => {
    const ok = window.confirm(
      `Matikan pembukaan SPMB ini?\n\nJudul: ${opening.judul}\nTahun ajaran: ${opening.tahunAjaran}\nPeriode: ${opening.tanggalMulai} s/d ${opening.tanggalSelesai}\n\nJika dimatikan, form pendaftaran tidak akan menerima pendaftaran selama pembukaan ini tidak aktif.`
    );
    if (!ok) return;

    try {
      setDeactivatingId(opening.id);
      const res = await apiService.updateSpmbOpening(opening.id, { isActive: false });
      if (res.success) {
        showSuccessToast('Berhasil', res.message || 'Pembukaan SPMB berhasil dimatikan');
        await loadOpenings();
      } else {
        showErrorToast('Error', res.message || 'Gagal mematikan pembukaan SPMB');
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat mematikan pembukaan SPMB');
    } finally {
      setDeactivatingId('');
    }
  };

  const tahunAjaranOptions = useMemo(() => {
    const set = new Set<string>();
    openings.forEach(o => set.add(o.tahunAjaran));
    const list = Array.from(set).sort().reverse();
    if (!list.includes(formData.tahunAjaran)) {
      list.unshift(formData.tahunAjaran);
    }
    tahunAjaranDropdown.forEach(t => set.add(t));
    const merged = Array.from(set).sort().reverse();
    if (!merged.includes(formData.tahunAjaran)) {
      merged.unshift(formData.tahunAjaran);
    }
    return merged;
  }, [openings, formData.tahunAjaran, tahunAjaranDropdown]);

  const filteredOpenings = useMemo(() => {
    if (filterTahunAjaran === 'semua') return openings;
    return openings.filter(o => o.tahunAjaran === filterTahunAjaran);
  }, [openings, filterTahunAjaran]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tahunAjaran || !formData.judul || !formData.tanggalMulai || !formData.tanggalSelesai) {
      showErrorToast('Error', 'Semua field wajib harus diisi');
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.createSpmbOpening({
        tahunAjaran: formData.tahunAjaran,
        judul: formData.judul,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai,
      });

      if (res.success) {
        showSuccessToast('Berhasil', res.message || 'Pembukaan SPMB berhasil ditambahkan');
        setFormData(prev => ({
          ...prev,
          judul: prev.judul,
          tanggalMulai: '',
          tanggalSelesai: '',
        }));
        await loadOpenings();
      } else {
        showErrorToast('Error', res.message || 'Gagal menambahkan pembukaan SPMB');
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat menyimpan pembukaan SPMB');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-lg bg-blue-500">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Pembukaan SPMB</h2>
          <p className="text-gray-600">
            Atur jadwal dan tahun ajaran pembukaan Sistem Penerimaan Murid Baru
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tahun Ajaran *
              </label>
              <select
                value={formData.tahunAjaran}
                onChange={e => setFormData({ ...formData, tahunAjaran: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {tahunAjaranOptions.map(tahun => (
                  <option key={tahun} value={tahun}>
                    {tahun}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Pilih tahun ajaran untuk pembukaan SPMB (dibuat otomatis 10 tahun ke depan).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Judul Pembukaan *
              </label>
              <input
                type="text"
                value={formData.judul}
                onChange={e => setFormData({ ...formData, judul: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Judul pengumuman SPMB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai Pendaftaran *
              </label>
              <input
                type="date"
                value={formData.tanggalMulai}
                onChange={e => setFormData({ ...formData, tanggalMulai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Selesai Pendaftaran *
              </label>
              <input
                type="date"
                value={formData.tanggalSelesai}
                onChange={e => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="submit"
              className="flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Simpan Pembukaan
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Daftar Pembukaan SPMB</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Filter Tahun Ajaran:</label>
            <select
              value={filterTahunAjaran}
              onChange={e => setFilterTahunAjaran(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="semua">Semua</option>
              {tahunAjaranOptions.map(tahun => (
                <option key={tahun} value={tahun}>
                  {tahun}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && openings.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Memuat data...</div>
        ) : filteredOpenings.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Belum ada data pembukaan SPMB.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Tahun Ajaran</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Judul</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Periode</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOpenings.map(opening => {
                  const today = new Date().toISOString().split('T')[0];
                  const isInPeriod =
                    opening.tanggalMulai <= today && opening.tanggalSelesai >= today;
                  const isNow = opening.isActive && isInPeriod;

                  return (
                    <tr key={opening.id}>
                      <td className="px-4 py-2 whitespace-nowrap">{opening.tahunAjaran}</td>
                      <td className="px-4 py-2">{opening.judul}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {opening.tanggalMulai} s/d {opening.tanggalSelesai}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            !opening.isActive
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isNow
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {!opening.isActive ? 'Dimatikan' : isNow ? 'Sedang dibuka' : 'Di luar periode'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {opening.isActive ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="!bg-red-50 !text-red-700 hover:!bg-red-100"
                            onClick={() => handleDeactivateOpening(opening)}
                            disabled={loading || deactivatingId === opening.id}
                          >
                            {deactivatingId === opening.id ? 'Mematikan...' : 'Matikan'}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-4 bg-blue-50 border-l-4 border-l-blue-500">
        <div className="flex">
          <div className="mr-3 mt-1">
            <Plus className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Catatan Alur SPMB</h4>
            <ul className="mt-1 text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Pendaftar baru hanya bisa mengisi formulir jika terdapat pembukaan SPMB aktif pada tanggal hari ini.</li>
              <li>Jika pembukaan dimatikan, form pendaftaran akan ditutup dan tidak menerima pendaftaran.</li>
              <li>Tahun ajaran pada pembukaan SPMB akan otomatis digunakan pada data pendaftar.</li>
              <li>Gunakan filter tahun ajaran di menu ini dan menu data pendaftar/diterima untuk melihat data per angkatan.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PembukaanSpmb;

