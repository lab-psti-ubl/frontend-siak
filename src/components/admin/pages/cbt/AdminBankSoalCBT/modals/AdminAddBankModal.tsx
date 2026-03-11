import React from 'react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import type { CBTConcreteQuestionType, CBTQuestionType } from '../../../../../types';

type Kategori = { id: string; nama: string };

const CUSTOM_TYPES: Array<{ key: CBTConcreteQuestionType; label: string }> = [
  { key: 'pilihan_ganda', label: 'Pilihan Ganda' },
  { key: 'pilihan_ganda_kompleks', label: 'Pilihan Ganda Kompleks' },
  { key: 'essay', label: 'Essay' },
  { key: 'benar_salah', label: 'Benar / Salah' },
  { key: 'menjodohkan', label: 'Menjodohkan' },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bankJudul: string;
  setBankJudul: (v: string) => void;
  selectedKategoriId: string;
  setSelectedKategoriId: (v: string) => void;
  selectedJenisSoal: CBTQuestionType;
  setSelectedJenisSoal: (v: CBTQuestionType) => void;
  totalSoal: number | '';
  setTotalSoal: React.Dispatch<React.SetStateAction<number | ''>>;
  customKuota: Partial<Record<CBTConcreteQuestionType, number>>;
  setCustomKuota: React.Dispatch<
    React.SetStateAction<Partial<Record<CBTConcreteQuestionType, number>>>
  >;
  kategoriUTSUAS: Kategori[];
  onCreate: () => void;
};

const AdminAddBankModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bankJudul,
  setBankJudul,
  selectedKategoriId,
  setSelectedKategoriId,
  selectedJenisSoal,
  setSelectedJenisSoal,
  totalSoal,
  setTotalSoal,
  customKuota,
  setCustomKuota,
  kategoriUTSUAS,
  onCreate,
}) => {
  const totalKuotaCustom = CUSTOM_TYPES.reduce((acc, t) => acc + (customKuota?.[t.key] || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Bank Soal CBT (UTS/UAS)"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Judul Bank Soal
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Misal: UTS Semester 1"
            value={bankJudul}
            onChange={(e) => setBankJudul(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Kategori Nilai (hanya UTS/UAS)
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedKategoriId}
            onChange={(e) => setSelectedKategoriId(e.target.value)}
          >
            <option value="">Pilih kategori nilai</option>
            {kategoriUTSUAS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Jenis Soal
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedJenisSoal}
            onChange={(e) => {
              const next = e.target.value as CBTQuestionType;
              setSelectedJenisSoal(next);
              if (next !== 'custom') setCustomKuota({});
            }}
          >
            <option value="pilihan_ganda">Pilihan Ganda</option>
            <option value="pilihan_ganda_kompleks">
              Pilihan Ganda Kompleks (multi jawaban)
            </option>
            <option value="benar_salah">Benar / Salah</option>
            <option value="menjodohkan">Menjodohkan</option>
            <option value="essay">Essay</option>
            <option value="custom">Custom (gabungan beberapa jenis)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Total Soal (Maksimal)
          </label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Misal: 40"
            value={totalSoal}
            onChange={(e) => {
              const v = e.target.value;
              setTotalSoal(v === '' ? '' : Math.max(1, parseInt(v, 10) || 1));
            }}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Total soal menentukan batas maksimal jumlah soal yang bisa ditambahkan ke bank ini.
          </p>
        </div>

        {selectedJenisSoal === 'custom' && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
            <p className="text-xs sm:text-sm font-medium text-slate-700">Custom: pilih jenis soal & kuota</p>
            <div className="space-y-2">
              {CUSTOM_TYPES.map((t) => {
                const checked = customKuota?.[t.key] !== undefined;
                return (
                  <div key={t.key} className="flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setCustomKuota((prev) => {
                            const next = { ...(prev || {}) };
                            if (isChecked) next[t.key] = next[t.key] ?? 0;
                            else delete next[t.key];
                            return next;
                          });
                        }}
                      />
                      {t.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={!checked}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                      value={checked ? customKuota?.[t.key] ?? 0 : ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const n = raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                        setCustomKuota((prev) => ({ ...(prev || {}), [t.key]: n }));
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-600">
              Total kuota custom: <span className="font-semibold">{totalKuotaCustom}</span>
              {totalSoal !== '' ? (
                <>
                  {' '}dari <span className="font-semibold">{totalSoal}</span> (maks)
                </>
              ) : null}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="px-3 py-2 text-sm">
            Batal
          </Button>
          <Button
            onClick={onCreate}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdminAddBankModal;
