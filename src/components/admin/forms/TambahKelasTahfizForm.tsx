import React, { useState, useEffect } from 'react';
import { useUstadz } from '../../../hooks/useUstadz';
import { TahfizClass } from '../../../hooks/useKelasTahfiz';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

interface TambahKelasTahfizFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: TahfizClass, mode: 'create' | 'edit') => void;
  mode: 'create' | 'edit';
  initialData?: TahfizClass | null;
}

const TambahKelasTahfizForm: React.FC<TambahKelasTahfizFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  initialData,
}) => {
  const { ustadz } = useUstadz();
  const [formData, setFormData] = useState<{ namaKelas: string; ruangan: string; ustadzId: string }>({
    namaKelas: '',
    ruangan: '',
    ustadzId: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          namaKelas: initialData.namaKelas,
          ruangan: initialData.ruangan,
          ustadzId: initialData.ustadzId,
        });
      } else {
        setFormData({
          namaKelas: '',
          ruangan: '',
          ustadzId: '',
        });
      }
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKelas.trim() || !formData.ruangan.trim() || !formData.ustadzId) {
      return;
    }

    if (mode === 'create') {
      const newClass: TahfizClass = {
        id: `tahfiz-class-${Date.now()}`,
        namaKelas: formData.namaKelas.trim(),
        ruangan: formData.ruangan.trim(),
        ustadzId: formData.ustadzId,
        santriIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSuccess(newClass, 'create');
    } else if (initialData) {
      const updatedClass: TahfizClass = {
        ...initialData,
        namaKelas: formData.namaKelas.trim(),
        ruangan: formData.ruangan.trim(),
        ustadzId: formData.ustadzId,
        updatedAt: new Date().toISOString(),
      };
      onSuccess(updatedClass, 'edit');
    }
  };

  const handleClose = () => {
    setFormData({
      namaKelas: '',
      ruangan: '',
      ustadzId: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Tambah Kelas Tahfiz' : 'Edit Kelas Tahfiz'}
      size="lg"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nama Kelas</label>
            <input
              type="text"
              value={formData.namaKelas}
              onChange={(e) => setFormData((prev) => ({ ...prev, namaKelas: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="Contoh: Kelas Tahfiz A"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ruangan</label>
            <input
              type="text"
              value={formData.ruangan}
              onChange={(e) => setFormData((prev) => ({ ...prev, ruangan: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="Contoh: Ruang 101"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nama Ustadz</label>
          <select
            value={formData.ustadzId}
            onChange={(e) => setFormData((prev) => ({ ...prev, ustadzId: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            required
          >
            <option value="">Pilih ustadz</option>
            {ustadz.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {ustadz.length === 0 && (
            <p className="text-xs text-amber-600">Belum ada data ustadz. Tambahkan ustadz terlebih dahulu.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit" className="bg-emerald-600">
            {mode === 'create' ? 'Simpan Kelas' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TambahKelasTahfizForm;

