import React, { useEffect, useMemo, useState } from 'react';
import { HariTahfiz, TahfizSchedule, User } from '../../../types';
import { TahfizClass } from '../../../hooks/useKelasTahfiz';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

type JadwalTahfizPayload = Pick<TahfizSchedule, 'id' | 'kelasId' | 'hari' | 'jamMulai' | 'jamSelesai'>;

interface TambahJadwalTahfizFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payload: JadwalTahfizPayload, mode: 'create' | 'edit') => void;
  mode: 'create' | 'edit';
  initialData?: TahfizSchedule | null;
  kelasTahfiz: TahfizClass[];
  ustadz: User[];
}

const dayOptions: { value: HariTahfiz; label: string }[] = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: "Jum'at" },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'minggu', label: 'Minggu' },
];

const defaultFormState = {
  kelasId: '',
  hari: 'senin' as HariTahfiz,
  jamMulai: '07:00',
  jamSelesai: '08:00',
};

const TambahJadwalTahfizForm: React.FC<TambahJadwalTahfizFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  initialData,
  kelasTahfiz,
  ustadz,
}) => {
  const [formData, setFormData] = useState(defaultFormState);

  const ustadzMap = useMemo(() => {
    const map = new Map<string, User>();
    ustadz.forEach((u) => map.set(u.id, u));
    return map;
  }, [ustadz]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          kelasId: initialData.kelasId,
          hari: initialData.hari,
          jamMulai: initialData.jamMulai,
          jamSelesai: initialData.jamSelesai,
        });
      } else {
        setFormData(defaultFormState);
      }
    }
  }, [isOpen, mode, initialData]);

  const handleClose = () => {
    setFormData(defaultFormState);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelasId) return;
    if (formData.jamMulai >= formData.jamSelesai) return;

    const payload: JadwalTahfizPayload = {
      ...(mode === 'edit' && initialData?.id ? { id: initialData.id } : {}),
      kelasId: formData.kelasId,
      hari: formData.hari,
      jamMulai: formData.jamMulai,
      jamSelesai: formData.jamSelesai,
    };

    onSuccess(payload, mode);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Tambah Jadwal Tahfiz' : 'Edit Jadwal Tahfiz'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">Pilih Kelas</label>
          <select
            value={formData.kelasId}
            onChange={(e) => setFormData((prev) => ({ ...prev, kelasId: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            required
          >
            <option value="">-- Pilih kelas tahfiz --</option>
            {kelasTahfiz.map((kelas) => {
              const ustadzName = ustadzMap.get(kelas.ustadzId)?.name || 'Belum diatur';
              return (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.namaKelas} | Ruangan {kelas.ruangan} | Ustadz {ustadzName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">Hari</label>
          <select
            value={formData.hari}
            onChange={(e) => setFormData((prev) => ({ ...prev, hari: e.target.value as HariTahfiz }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            required
          >
            {dayOptions.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">Jam Mulai</label>
            <input
              type="time"
              value={formData.jamMulai}
              onChange={(e) => setFormData((prev) => ({ ...prev, jamMulai: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">Jam Selesai</label>
            <input
              type="time"
              value={formData.jamSelesai}
              onChange={(e) => setFormData((prev) => ({ ...prev, jamSelesai: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="min-w-[100px]"
          >
            Batal
          </Button>
          <Button type="submit" className="min-w-[120px]">
            {mode === 'create' ? 'Simpan Jadwal' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export type { JadwalTahfizPayload };
export default TambahJadwalTahfizForm;

