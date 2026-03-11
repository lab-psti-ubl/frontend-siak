import React from 'react';
import { Trash2, UserCheck } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { useAdminPilihGuruCBT } from './useAdminPilihGuruCBT';

const AdminPilihGuruCBT: React.FC = () => {
  const api = useAdminPilihGuruCBT();

  if (!api.isAdmin) {
    return (
      <Card className="py-10 text-center">
        <p className="text-gray-700 font-medium">Halaman ini hanya dapat diakses oleh admin.</p>
      </Card>
    );
  }

  if (!api.activeTahunAjaran) {
    return (
      <Card className="py-10 text-center">
        <p className="text-gray-700 font-medium">
          Tidak ada tahun ajaran aktif. Hubungi admin untuk mengaktifkan tahun ajaran.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-800 via-blue-800 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Pilih Guru CBT (UTS/UAS)
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Admin menunjuk guru sebagai penginput bank soal global UTS/UAS untuk semester aktif.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-white/10 text-white border border-white/20">
                Tahun Ajaran {api.activeTahunAjaran.tahun} • Semester {api.activeTahunAjaran.semester}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-blue-700" />
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            Form Penunjukan Guru Penginput
          </h2>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${api.jurusanRequired ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Guru</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              value={api.selectedGuruId}
              onChange={(e) => api.setSelectedGuruId(e.target.value)}
            >
              <option value="">Pilih Guru</option>
              {api.gurus
                .slice()
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              value={api.selectedKategoriId}
              onChange={(e) => api.setSelectedKategoriId(e.target.value)}
            >
              <option value="">Pilih UTS/UAS</option>
              {api.kategoriUTSUAS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mata Pelajaran</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              value={api.selectedMapelId}
              onChange={(e) => api.setSelectedMapelId(e.target.value)}
            >
              <option value="">Pilih Mapel</option>
              {api.mataPelajaran
                .slice()
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>

          {api.jurusanRequired && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jurusan</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                value={api.selectedJurusanId}
                onChange={(e) => api.setSelectedJurusanId(e.target.value)}
              >
                <option value="">Semua Jurusan</option>
                {api.jurusan
                  .slice()
                  .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''))
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat Kelas</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              value={api.selectedTingkat}
              onChange={(e) => api.setSelectedTingkat(e.target.value ? parseInt(e.target.value, 10) : '')}
            >
              <option value="">Pilih Tingkat</option>
              {api.tingkatList.map((t) => (
                <option key={t} value={t}>
                  Kelas {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={api.handleCreate}
            >
              Simpan Penunjukan
            </Button>
          </div>
        </div>
      </Card>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Daftar Guru Penginput UTS/UAS (Semester Aktif)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Kombinasi kategori + mapel + tingkat hanya bisa punya satu guru penginput.
            </p>
          </div>
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            Total: {api.assignments.length}
          </Badge>
        </div>

        {api.loading ? (
          <div className="py-10 text-center text-sm text-slate-600">Memuat data...</div>
        ) : api.assignments.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-600">
            Belum ada penunjukan guru penginput UTS/UAS untuk semester aktif.
          </div>
        ) : (
          <div className="p-3 sm:p-4 overflow-x-auto">
            <Table className="text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableCell header className="w-12">No</TableCell>
                  <TableCell header className="min-w-[180px]">Guru</TableCell>
                  <TableCell header className="w-24">Kategori</TableCell>
                  <TableCell header className="min-w-[200px]">Mata Pelajaran</TableCell>
                  {api.jurusanRequired && (
                    <TableCell header className="min-w-[160px]">Jurusan</TableCell>
                  )}
                  <TableCell header className="w-28">Tingkat</TableCell>
                  <TableCell header className="w-48">Semester</TableCell>
                  <TableCell header className="w-24">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {api.assignments.map((a, idx) => (
                  <TableRow key={a.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{api.getGuruName(a.guruId)}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                        {a.kategoriNama}
                      </span>
                    </TableCell>
                    <TableCell>{api.getMapelName(a.mataPelajaranId)}</TableCell>
                    {api.jurusanRequired && (
                      <TableCell>{api.getJurusanName(a.jurusanId)}</TableCell>
                    )}
                    <TableCell>Kelas {a.tingkat}</TableCell>
                    <TableCell>
                      {a.tahunAjaran} • Semester {a.semester}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => api.handleDelete(a)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPilihGuruCBT;

