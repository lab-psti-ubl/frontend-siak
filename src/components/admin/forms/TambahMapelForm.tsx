import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { MataPelajaran, Jurusan } from '../../../types';
import { apiService } from '../../../services/apiService';
import { useMataPelajaran } from '../../../hooks/useMataPelajaran';
import Button from '../../ui/Button';
import { shouldShowJurusanSync, getTingkatKelasOptionsSync } from '../../../utils/jenjangPendidikanUtils';

interface TambahMapelFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingMapel?: MataPelajaran | null;
  onSuccess: () => void;
}

const TambahMapelForm: React.FC<TambahMapelFormProps> = ({
  isOpen,
  onClose,
  editingMapel,
  onSuccess
}) => {
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const showJurusan = shouldShowJurusanSync();
  const tingkatOptions = useMemo(() => getTingkatKelasOptionsSync(), []);
  const { refreshMataPelajaran } = useMataPelajaran();

  // Fetch data from API
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [mapelResponse, jurusanResponse] = await Promise.all([
        apiService.getAllMataPelajaran(),
        apiService.getAllJurusan(),
      ]);
      
      if (mapelResponse.success && mapelResponse.mataPelajaran) {
        setMataPelajaran(mapelResponse.mataPelajaran);
      }
      
      if (jurusanResponse.success && jurusanResponse.jurusan) {
        setJurusan(jurusanResponse.jurusan);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sks: 2,
    keterangan: 'umum' as 'umum' | 'jurusan',
    jurusanId: '',
    semester: 'keduanya' as 'ganjil' | 'genap' | 'keduanya',
    tingkatKelas: tingkatOptions as number[],
  });

  // Define resetForm before useEffect
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      code: '',
      sks: 2,
      keterangan: 'umum',
      jurusanId: '',
      semester: 'keduanya',
      tingkatKelas: tingkatOptions as number[],
    });
  }, [tingkatOptions]);

  React.useEffect(() => {
    if (editingMapel) {
      setFormData({
        name: editingMapel.name,
        code: editingMapel.code,
        sks: editingMapel.sks,
        keterangan: editingMapel.keterangan,
        jurusanId: editingMapel.jurusanId || '',
        semester: editingMapel.semester || 'keduanya',
        tingkatKelas: editingMapel.tingkatKelas || tingkatOptions,
      });
    } else if (isOpen && !editingMapel) {
      resetForm();
    }
  }, [editingMapel, isOpen, tingkatOptions, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Nama dan kode mata pelajaran wajib diisi!');
      return;
    }

    if (formData.keterangan === 'jurusan' && !formData.jurusanId) {
      alert('Jurusan wajib dipilih untuk mata pelajaran jurusan!');
      return;
    }
    
    const mapelData = {
      ...formData,
      jurusanId: formData.keterangan === 'jurusan' ? formData.jurusanId : undefined,
    };
    
    try {
      if (editingMapel) {
        const response = await apiService.updateMataPelajaran(editingMapel.id, mapelData);
        if (response.success) {
          // Clear cache dan muat ulang data dari useMataPelajaran
          await refreshMataPelajaran();
          onSuccess();
          resetForm();
          onClose();
        } else {
          alert(response.message || 'Gagal memperbarui mata pelajaran');
        }
      } else {
        const response = await apiService.createMataPelajaran(mapelData);
        if (response.success) {
          // Clear cache dan muat ulang data dari useMataPelajaran
          await refreshMataPelajaran();
          onSuccess();
          resetForm();
          onClose();
        } else {
          alert(response.message || 'Gagal menambahkan mata pelajaran');
        }
      }
    } catch (error) {
      console.error('Error saving mata pelajaran:', error);
      alert('Terjadi kesalahan saat menyimpan mata pelajaran');
    }
  };

  const handleTingkatKelasChange = (tingkat: number) => {
    setFormData(prev => ({
      ...prev,
      tingkatKelas: prev.tingkatKelas.includes(tingkat)
        ? prev.tingkatKelas.filter(t => t !== tingkat)
        : [...prev.tingkatKelas, tingkat].sort()
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Mata Pelajaran *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Matematika"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Mata Pelajaran *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: MTK"
              maxLength={5}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JP (Jam Pelajaran) *
            </label>
            <select
              value={formData.sks}
              onChange={(e) => setFormData({ ...formData, sks: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value={1}>1 JP</option>
              <option value={2}>2 JP</option>
              <option value={3}>3 JP</option>
              <option value={4}>4 JP</option>
              <option value={5}>5 JP</option>
              <option value={6}>6 JP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan *
            </label>
            <select
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value as 'umum' | 'jurusan', jurusanId: '', tingkatKelas: tingkatOptions as number[] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!showJurusan}
            >
              <option value="umum">Umum{showJurusan ? ' (Semua Jurusan)' : ''}</option>
              {showJurusan && <option value="jurusan">Khusus Jurusan</option>}
            </select>
            {!showJurusan && (
              <p className="text-xs text-slate-500 mt-1">
                Jenjang pendidikan ini tidak menggunakan jurusan
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester *
            </label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value as 'ganjil' | 'genap' | 'keduanya' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="keduanya">Semester Ganjil & Genap</option>
              <option value="ganjil">Semester Ganjil Saja</option>
              <option value="genap">Semester Genap Saja</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tingkat Kelas *
            </label>
            <div className={`flex ${tingkatOptions.length > 3 ? 'flex-wrap gap-2' : 'space-x-4'}`}>
              {tingkatOptions.map(tingkat => (
                <label key={tingkat} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.tingkatKelas.includes(tingkat)}
                    onChange={() => handleTingkatKelasChange(tingkat)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Kelas {tingkat}
                  </span>
                </label>
              ))}
            </div>
            {formData.tingkatKelas.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Pilih minimal satu tingkat kelas
              </p>
            )}
          </div>

          {formData.keterangan === 'jurusan' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jurusan *
              </label>
              <select
                value={formData.jurusanId}
                onChange={(e) => setFormData({ ...formData, jurusanId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={formData.keterangan === 'jurusan'}
              >
                <option value="">Pilih Jurusan</option>
                {jurusan.filter(j => j.isActive).map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" fullWidth className="justify-center flex items-center">
              <Save size={16} className="mr-2" />
              {editingMapel ? 'Update' : 'Tambah'} Mata Pelajaran
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={onClose} className="justify-center flex items-center">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TambahMapelForm;