import React from 'react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';

type MataPelajaran = { id: string; name: string };
type TahunAjaran = { tahun: string; semester: number };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tingkatYangDiajar: number[];
  mapelUntukTingkat: (tingkat: number) => MataPelajaran[];
  selectedTingkat: number | '';
  selectedMapelId: string;
  setSelectedTingkat: (v: number | '') => void;
  setSelectedMapelId: (v: string) => void;
  activeTahunAjaran: TahunAjaran | undefined;
  tingkatLabel: (tingkat: number) => string;
  onCreate: () => void;
};

const AddKelasModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tingkatYangDiajar,
  mapelUntukTingkat,
  selectedTingkat,
  selectedMapelId,
  setSelectedTingkat,
  setSelectedMapelId,
  activeTahunAjaran,
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
            value={selectedTingkat}
            onChange={(e) => {
              setSelectedTingkat(e.target.value ? Number(e.target.value) : '');
              setSelectedMapelId('');
            }}
          >
            <option value="">Pilih tingkat kelas</option>
            {tingkatYangDiajar.map((t) => (
              <option key={t} value={t}>
                {tingkatLabel(t)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Hanya tingkat kelas yang memiliki jadwal mengajar Anda yang ditampilkan.
          </p>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
            Mata Pelajaran
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedMapelId}
            onChange={(e) => setSelectedMapelId(e.target.value)}
            disabled={!selectedTingkat}
          >
            <option value="">Pilih mata pelajaran</option>
            {selectedTingkat &&
              mapelUntukTingkat(selectedTingkat).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Mata pelajaran difilter berdasarkan jadwal mengajar Anda di tingkat kelas yang dipilih.
          </p>
        </div>

        {activeTahunAjaran && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                disabled
                value={activeTahunAjaran.tahun}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Semester
              </label>
              <input
                type="text"
                disabled
                value={activeTahunAjaran.semester}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="px-3 py-2 text-sm">
            Batal
          </Button>
          <Button
            onClick={onCreate}
            disabled={!selectedTingkat || !selectedMapelId}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddKelasModal;
