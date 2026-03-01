import React from 'react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import type { UjianFormState } from '../types';

type Kategori = { id: string; nama: string };
type BankSoal = { id: string; judul: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  form: UjianFormState;
  onChange: (field: keyof UjianFormState, value: string | boolean) => void;
  saving: boolean;
  uniqueMapelIds: string[];
  uniqueKelasIds: string[];
  matchingCBTKelasId: string | null;
  loadingBankSoal: boolean;
  availableBankSoal: BankSoal[];
  komponenNilai: Kategori[];
  kategoriIsGanda: boolean;
  getMapelName: (id: string) => string;
  getKelasName: (id: string) => string;
  onCreate: () => void;
};

const AddUjianModal: React.FC<Props> = ({
  isOpen,
  onClose,
  form,
  onChange,
  saving,
  uniqueMapelIds,
  uniqueKelasIds,
  matchingCBTKelasId,
  loadingBankSoal,
  availableBankSoal,
  komponenNilai,
  kategoriIsGanda,
  getMapelName,
  getKelasName,
  onCreate,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Ujian CBT" size="xl">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Mata Pelajaran</label>
            <select
              value={form.mapelId}
              onChange={(e) => onChange('mapelId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Pilih Mata Pelajaran</option>
              {uniqueMapelIds.map((id) => (
                <option key={id} value={id}>{getMapelName(id)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Kelas</label>
            <select
              value={form.kelasId}
              onChange={(e) => onChange('kelasId', e.target.value)}
              disabled={!form.mapelId}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">{!form.mapelId ? 'Pilih mata pelajaran terlebih dahulu' : 'Pilih Kelas'}</option>
              {uniqueKelasIds.map((id) => (
                <option key={id} value={id}>{getKelasName(id)}</option>
              ))}
            </select>
            {form.mapelId && form.kelasId && !matchingCBTKelasId && (
              <p className="mt-1 text-[11px] text-amber-600">
                Belum ada Kelas CBT untuk kombinasi tingkat dan mata pelajaran ini. Tambahkan dulu melalui menu Bank Soal CBT.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Kategori Nilai</label>
            <select
              value={form.kategoriId}
              onChange={(e) => onChange('kategoriId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Pilih Kategori Nilai</option>
              {komponenNilai
                .filter((k) => k.nama.toLowerCase() !== 'kehadiran')
                .map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
            </select>
          </div>
          {kategoriIsGanda && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Ke-</label>
              <input
                type="number"
                min={1}
                value={form.kategoriKe}
                onChange={(e) => onChange('kategoriKe', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Contoh: 1 (untuk Tugas ke-1)"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Judul Bank Soal</label>
          <select
            value={form.bankSoalId}
            onChange={(e) => onChange('bankSoalId', e.target.value)}
            disabled={!matchingCBTKelasId || !form.kategoriId || loadingBankSoal}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {!matchingCBTKelasId
                ? 'Pilih mata pelajaran & kelas (dan pastikan Kelas CBT sudah dibuat)'
                : !form.kategoriId
                  ? 'Pilih kategori nilai terlebih dahulu'
                  : loadingBankSoal
                    ? 'Memuat bank soal...'
                    : availableBankSoal.length === 0
                      ? 'Belum ada bank soal untuk kategori ini'
                      : 'Pilih Bank Soal'}
            </option>
            {availableBankSoal.map((b) => (
              <option key={b.id} value={b.id}>{b.judul}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Judul Ujian CBT</label>
          <input
            type="text"
            value={form.judulUjian}
            onChange={(e) => onChange('judulUjian', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Contoh: UTS CBT - Bab 1-3"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Tanggal & Jam Mulai</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.tanggalMulai}
                onChange={(e) => onChange('tanggalMulai', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="time"
                value={form.jamMulai}
                onChange={(e) => onChange('jamMulai', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Jika ujian belum dipublish secara manual, sistem akan otomatis mem-publish ujian ini 5 menit sebelum waktu mulai.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Tanggal & Jam Selesai (Batas Akses)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.tanggalSelesai}
                onChange={(e) => onChange('tanggalSelesai', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="time"
                value={form.jamSelesai}
                onChange={(e) => onChange('jamSelesai', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Setelah melewati tanggal dan jam selesai, ujian tidak dapat lagi diakses murid.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Durasi Ujian (menit)</label>
            <input
              type="number"
              min={1}
              value={form.durasiMenit}
              onChange={(e) => onChange('durasiMenit', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Contoh: 90"
            />
            <p className="mt-1 text-[11px] text-slate-500">Durasi dihitung sejak murid memulai ujian sampai waktu habis.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Pengaturan Tampilan Ujian</label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.acakSoal}
                onChange={(e) => onChange('acakSoal', e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Acak urutan soal untuk setiap murid</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.tunjukanHasilNilai}
                onChange={(e) => onChange('tunjukanHasilNilai', e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Tampilkan hasil nilai ujian ke murid setelah selesai</span>
            </label>
            <p className="mt-1 text-[11px] text-slate-500">
              Untuk soal essay, penilaian tetap dilakukan manual oleh guru sebelum nilai akhir dihitung.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>Batal</Button>
          <Button variant="primary" size="sm" onClick={onCreate} loading={saving}>Simpan Ujian</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddUjianModal;
