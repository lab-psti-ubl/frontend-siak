import React from 'react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import type { CBTQuestionType } from '../../../../../types';

type Kategori = { id: string; nama: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bankJudul: string;
  setBankJudul: (v: string) => void;
  selectedKategoriId: string;
  setSelectedKategoriId: (v: string) => void;
  selectedJenisSoal: CBTQuestionType;
  setSelectedJenisSoal: (v: CBTQuestionType) => void;
  komponenNilaiForBank: Kategori[];
  onCreate: () => void;
};

const AddBankModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bankJudul,
  setBankJudul,
  selectedKategoriId,
  setSelectedKategoriId,
  selectedJenisSoal,
  setSelectedJenisSoal,
  komponenNilaiForBank,
  onCreate,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Bank Soal" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Judul Bank Soal
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Misal: Ulangan Harian 1, UTS, UAS..."
            value={bankJudul}
            onChange={(e) => setBankJudul(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Kategori Nilai
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedKategoriId}
            onChange={(e) => setSelectedKategoriId(e.target.value)}
          >
            <option value="">Pilih kategori nilai (diatur admin)</option>
            {komponenNilaiForBank.map((k) => (
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
            onChange={(e) => setSelectedJenisSoal(e.target.value as CBTQuestionType)}
          >
            <option value="pilihan_ganda">Pilihan Ganda</option>
            <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks (multi jawaban)</option>
            <option value="benar_salah">Benar / Salah</option>
            <option value="menjodohkan">Menjodohkan</option>
            <option value="essay">Essay</option>
          </select>
        </div>

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

export default AddBankModal;
