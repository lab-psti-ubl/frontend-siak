import React, { useState, useMemo, useCallback } from 'react';
import { Save, X } from 'lucide-react';
import { Kelas, User, Jurusan } from '../../../types';
import { useJurusan } from '../../../hooks/useJurusan';
import { useKelas } from '../../../hooks/useKelas';
import { useGurus } from '../../../hooks/useGurus';
import { apiService } from '../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../ui/ToastContainer';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import { getTingkatKelasOptionsSync, formatTingkatKelasSync, shouldShowJurusanSync } from '../../../utils/jenjangPendidikanUtils';
import { useTahunAjaran } from '../../../hooks/useTahunAjaran';

interface TambahKelasFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingKelas?: Kelas | null;
  selectedJurusan: string;
  onSuccess: () => void;
}

const TambahKelasForm: React.FC<TambahKelasFormProps> = ({
  isOpen,
  onClose,
  editingKelas,
  selectedJurusan,
  onSuccess
}) => {
  const { jurusan } = useJurusan();
  const { kelas } = useKelas();
  const { gurus } = useGurus();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const tingkatOptions = useMemo(() => getTingkatKelasOptionsSync(), []);
  const showJurusan = shouldShowJurusanSync();

  const [formData, setFormData] = useState({
    name: '',
    tingkat: tingkatOptions[0],
    jurusanId: '',
    waliKelasId: '',
  });

  const currentJurusan = jurusan.find(j => j.id === selectedJurusan);

  // Define resetForm before useEffect
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      tingkat: tingkatOptions[0],
      jurusanId: selectedJurusan || '',
      waliKelasId: '',
    });
  }, [tingkatOptions, selectedJurusan]);

  React.useEffect(() => {
    if (editingKelas) {
      // Extract nama kelas tanpa tingkat untuk editing
      const namaKelasWithoutTingkat = editingKelas.name.replace(/^(X|XI|XII|VII|VIII|IX|\d+)\s+/, '');
      setFormData({
        name: namaKelasWithoutTingkat,
        tingkat: editingKelas.tingkat,
        jurusanId: editingKelas.jurusanId || '',
        waliKelasId: editingKelas.waliKelasId || '',
      });
    } else if (isOpen && !editingKelas) {
      resetForm();
    }
  }, [editingKelas, isOpen, selectedJurusan, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showErrorToast('Error', 'Nama kelas wajib diisi!');
      return;
    }

    const tingkatLabel = formatTingkatKelasSync(formData.tingkat);
    const fullClassName = `${tingkatLabel} ${formData.name}`;

    try {
      const hasAnyTahunAjaran = tahunAjaran && tahunAjaran.length > 0;

      // Validasi: tidak boleh menetapkan wali kelas jika belum ada tahun ajaran
      if (formData.waliKelasId) {
        if (!hasAnyTahunAjaran) {
          showErrorToast(
            'Error',
            'Tidak dapat menetapkan wali kelas karena belum ada tahun ajaran.\nSilakan tambahkan tahun ajaran terlebih dahulu di menu "Tahun Ajaran".'
          );
          return;
        }

        if (!activeTahunAjaran) {
          showErrorToast(
            'Error',
            'Tidak dapat menetapkan wali kelas karena belum ada tahun ajaran aktif.\nSilakan aktifkan salah satu tahun ajaran terlebih dahulu di menu "Tahun Ajaran".'
          );
          return;
        }
      }

      const kelasData: any = {
        name: fullClassName,
        tingkat: formData.tingkat,
        waliKelasId: formData.waliKelasId || undefined,
      };

      // Only add jurusanId if jenjang requires it (SMA/SMK)
      if (showJurusan) {
        kelasData.jurusanId = selectedJurusan || formData.jurusanId;
      }
      
      let response;
      if (editingKelas) {
        response = await apiService.updateKelas(editingKelas.id, kelasData);
      } else {
        response = await apiService.createKelas(kelasData);
      }

      if (response.success) {
        showSuccessToast('Berhasil', editingKelas ? 'Kelas berhasil diperbarui' : 'Kelas berhasil ditambahkan');
        onSuccess();
        resetForm();
        onClose();
      } else {
        showErrorToast('Error', response.message || 'Gagal menyimpan data kelas');
      }
    } catch (error: any) {
      if (error.message?.includes('Nama kelas sudah terdaftar')) {
        showErrorToast('Error', 'Nama kelas sudah terdaftar');
      } else {
        showErrorToast('Error', error.message || 'Terjadi kesalahan saat menyimpan data kelas');
      }
    }
  };

  const getAvailableWaliKelas = () => {
    return gurus.filter(guru => {
      // Filter out inactive gurus
      if (guru.isActive === false || !guru.id) return false;
      
      const guruId = guru.id.toString().trim();
      
      // If editing a kelas, allow the current wali kelas to remain selected
      if (editingKelas && editingKelas.waliKelasId) {
        const currentWaliKelasId = editingKelas.waliKelasId.toString().trim();
        if (guruId === currentWaliKelasId) {
          return true;
        }
      }
      
      // Check if this guru is already a wali kelas for another kelas
      // Exclude the current kelas being edited from the check
      const isAlreadyWaliKelas = kelas.some(k => {
        // Only check if waliKelasId is not empty/null/undefined
        if (!k.waliKelasId || !k.waliKelasId.toString().trim()) return false;
        // Exclude the current kelas being edited
        if (editingKelas && k.id === editingKelas.id) return false;
        // Check if this kelas has this guru as wali kelas
        const kelasWaliKelasId = k.waliKelasId.toString().trim();
        return kelasWaliKelasId === guruId;
      });
      
      return !isAlreadyWaliKelas;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editingKelas ? 'Edit Kelas' : 'Tambah Kelas Baru'}
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
          {showJurusan && currentJurusan && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Informasi Jurusan</h4>
              <div className="text-sm">
                <span className="text-purple-700">Jurusan:</span>
                <span className="ml-2 font-medium">{currentJurusan?.name} ({currentJurusan?.code})</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Kelas *
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Tingkat:</span>
                <select
                  value={formData.tingkat}
                  onChange={(e) => setFormData({ ...formData, tingkat: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-20"
                  required
                >
                  {tingkatOptions.map(tingkat => (
                    <option key={tingkat} value={tingkat}>{formatTingkatKelasSync(tingkat)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Nama:</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={showJurusan ? "Contoh: IPA 1" : "Contoh: A"}
                    required
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Hasil: {formatTingkatKelasSync(formData.tingkat)} {formData.name || '[Nama Kelas]'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wali Kelas
            </label>
            <select
              value={formData.waliKelasId}
              onChange={(e) => setFormData({ ...formData, waliKelasId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!tahunAjaran || tahunAjaran.length === 0}
            >
              <option value="">Pilih Wali Kelas</option>
              {getAvailableWaliKelas().map((guru) => (
                <option key={guru.id} value={guru.id}>
                  {guru.name} - NIP: {guru.nip}
                </option>
              ))}
            </select>
            {(!tahunAjaran || tahunAjaran.length === 0) ? (
              <p className="text-xs text-red-500 mt-1">
                Tambahkan tahun ajaran terlebih dahulu di menu <span className="font-semibold">Tahun Ajaran</span> sebelum menetapkan wali kelas.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Hanya menampilkan guru yang belum menjadi wali kelas
              </p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" fullWidth className="justify-center flex items-center">
              <Save size={16} className="mr-2" />
              {editingKelas ? 'Update' : 'Tambah'} Kelas
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

export default TambahKelasForm;