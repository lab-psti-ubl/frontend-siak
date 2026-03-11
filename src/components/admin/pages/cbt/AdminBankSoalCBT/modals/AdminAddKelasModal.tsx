import React from 'react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';

type MataPelajaran = { id: string; name: string };
type Jurusan = { id: string; nama: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tingkatList: number[];
  mataPelajaran: MataPelajaran[];
  jurusanRequired?: boolean;
  jurusan?: Jurusan[];
  addKelasTingkat: number | '';
  addKelasMapelId: string;
  addKelasJurusanId?: string;
  setAddKelasTingkat: (v: number | '') => void;
  setAddKelasMapelId: (v: string) => void;
  setAddKelasJurusanId?: (v: string) => void;
  tingkatLabel: (tingkat: number) => string;
  onCreate: () => void;
};

const AdminAddKelasModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tingkatList,
  mataPelajaran,
  jurusanRequired = false,
  jurusan = [],
  addKelasTingkat,
  addKelasMapelId,
  addKelasJurusanId = '',
  setAddKelasTingkat,
  setAddKelasMapelId,
  setAddKelasJurusanId,
  tingkatLabel,
  onCreate,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Kelas CBT" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Tingkat Kelas
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={addKelasTingkat}
            onChange={(e) => {
              const val = e.target.value;
              setAddKelasTingkat(val ? Number(val) : '');
              setAddKelasMapelId('');
            }}
          >
            <option value="">Pilih tingkat kelas</option>
            {tingkatList.map((t) => (
              <option key={t} value={t}>
                {tingkatLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Mata Pelajaran
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={addKelasMapelId}
            onChange={(e) => setAddKelasMapelId(e.target.value)}
            disabled={!addKelasTingkat}
          >
            <option value="">Pilih mata pelajaran</option>
            {mataPelajaran.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {jurusanRequired && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Jurusan
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={addKelasJurusanId}
              onChange={(e) => setAddKelasJurusanId?.(e.target.value)}
            >
              <option value="">Semua Jurusan</option>
              {jurusan
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
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={onCreate}
            disabled={!addKelasTingkat || !addKelasMapelId}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdminAddKelasModal;
