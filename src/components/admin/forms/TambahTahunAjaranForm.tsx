import React, { useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { TahunAjaran } from '../../../types';
import { apiService } from '../../../services/apiService';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { useTahunAjaran } from '../../../hooks/useTahunAjaran';
import { usePengumumanKelulusan } from '../../../hooks/usePengumumanKelulusan';
import { useStatusKenaikanKelas } from '../../../hooks/useStatusKenaikanKelas';

interface TambahTahunAjaranFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTahunAjaran?: TahunAjaran | null;
  onSuccess: () => void;
}

const TambahTahunAjaranForm: React.FC<TambahTahunAjaranFormProps> = ({
  isOpen,
  onClose,
  editingTahunAjaran,
  onSuccess
}) => {
  // Hooks untuk validasi
  const { activeTahunAjaran, tahunAjaran } = useTahunAjaran();
  const { pengumumanKelulusan } = usePengumumanKelulusan();
  const { statusKenaikanKelas } = useStatusKenaikanKelas();

  const [formData, setFormData] = useState({
    tahun: '',
    semester: 1,
    isActive: false,
    tanggalMulai: '',
    tanggalSelesai: '',
  });

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  React.useEffect(() => {
    if (editingTahunAjaran) {
      setFormData({
        tahun: editingTahunAjaran.tahun,
        semester: editingTahunAjaran.semester,
        isActive: editingTahunAjaran.isActive,
        tanggalMulai: editingTahunAjaran.tanggalMulai,
        tanggalSelesai: editingTahunAjaran.tanggalSelesai,
      });
    } else {
      resetForm();
    }
  }, [editingTahunAjaran, isOpen]);

  const checkValidation = (): boolean => {
    // Jika sedang edit, tidak perlu validasi
    if (editingTahunAjaran) {
      return true;
    }

    // Jika tidak ada tahun ajaran aktif, berarti ini tahun ajaran pertama (boleh)
    if (!activeTahunAjaran) {
      return true;
    }

    // Jika tahun ajaran aktif bukan semester genap, tidak perlu validasi
    if (activeTahunAjaran.semester !== 2) {
      return true;
    }

    // Cek apakah sudah ada pengumuman kelulusan untuk tahun ajaran aktif
    const activePengumumanKelulusan = pengumumanKelulusan.find(p =>
      p.tahunAjaran === activeTahunAjaran.tahun && p.isPublished
    );

    if (!activePengumumanKelulusan) {
      setValidationMessage(
        `Anda belum membuat pengumuman kelulusan untuk tahun ajaran ${activeTahunAjaran.tahun} semester genap.\n\n` +
        `Silakan selesaikan proses berikut terlebih dahulu:\n` +
        `1. Buat pengumuman kelulusan di menu "Info & Pengumuman > Beri Info" atau "Info & Pengumuman > Pengumuman Kelulusan"\n` +
        `2. Beri info kenaikan kelas\n` +
        `3. Proses kenaikan kelas & kelulusan\n\n` +
        `Setelah semua proses selesai, Anda dapat menambahkan tahun ajaran baru.`
      );
      return false;
    }

    // Cek apakah sudah ada StatusKenaikanKelas untuk tahun ajaran aktif semester genap
    const activeStatusKenaikanKelas = statusKenaikanKelas.find(s =>
      s.tahunAjaran === activeTahunAjaran.tahun &&
      s.semester === activeTahunAjaran.semester
    );

    if (!activeStatusKenaikanKelas) {
      setValidationMessage(
        `Anda belum memberikan info kenaikan kelas untuk tahun ajaran ${activeTahunAjaran.tahun} semester genap.\n\n` +
        `Silakan selesaikan proses berikut terlebih dahulu:\n` +
        `1. Beri info kenaikan kelas di menu "Info & Pengumuman > Beri Info" atau "Info & Pengumuman > Pengumuman Kelulusan"\n` +
        `2. Proses kenaikan kelas & kelulusan\n\n` +
        `Setelah semua proses selesai, Anda dapat menambahkan tahun ajaran baru.`
      );
      return false;
    }

    // Cek apakah pengumuman kelulusan sudah diproses (isProcessed = true)
    if (!activePengumumanKelulusan.isProcessed) {
      setValidationMessage(
        `Anda belum memproses kenaikan kelas & kelulusan untuk tahun ajaran ${activeTahunAjaran.tahun} semester genap.\n\n` +
        `Silakan selesaikan proses berikut terlebih dahulu:\n` +
        `1. Proses kenaikan kelas & kelulusan di menu "Info & Pengumuman > Pengumuman Kelulusan"\n\n` +
        `Setelah proses selesai, Anda dapat menambahkan tahun ajaran baru.`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tahun.trim()) {
      alert('Tahun ajaran wajib diisi!');
      return;
    }

    if (!formData.tanggalMulai) {
      alert('Tanggal mulai wajib diisi!');
      return;
    }

    if (!formData.tanggalSelesai) {
      alert('Tanggal selesai wajib diisi!');
      return;
    }

    if (formData.tanggalMulai >= formData.tanggalSelesai) {
      alert('Tanggal selesai harus lebih besar dari tanggal mulai!');
      return;
    }

    // Validasi proses kelulusan dan kenaikan kelas
    if (!checkValidation()) {
      setShowValidationModal(true);
      return;
    }
    
    try {
      if (editingTahunAjaran) {
        const response = await apiService.updateTahunAjaran(editingTahunAjaran.id, formData);
        if (response.success) {
          onSuccess();
          resetForm();
          onClose();
        } else {
          alert(response.message || 'Gagal memperbarui tahun ajaran');
        }
      } else {
        const response = await apiService.createTahunAjaran(formData);
        if (response.success) {
          onSuccess();
          resetForm();
          onClose();
        } else {
          alert(response.message || 'Gagal menambahkan tahun ajaran');
        }
      }
    } catch (error) {
      console.error('Error saving tahun ajaran:', error);
      alert('Terjadi kesalahan saat menyimpan tahun ajaran');
    }
  };

  const resetForm = () => {
    setFormData({
      tahun: '',
      semester: 1,
      isActive: false,
      tanggalMulai: '',
      tanggalSelesai: '',
    });
  };

  const generateTahunOptions = () => {
    const currentYear = new Date().getFullYear();
    const BASE_YEAR = 2025; // Tahun dasar untuk memulai tahun ajaran
    
    // Kelompokkan tahun ajaran yang sudah ada berdasarkan tahun
    const tahunAjaranMap = new Map<string, { semester1: boolean; semester2: boolean }>();
    
    tahunAjaran.forEach(ta => {
      const existing = tahunAjaranMap.get(ta.tahun) || { semester1: false, semester2: false };
      if (ta.semester === 1) existing.semester1 = true;
      if (ta.semester === 2) existing.semester2 = true;
      tahunAjaranMap.set(ta.tahun, existing);
    });
    
    // Cari tahun ajaran yang sudah lengkap (memiliki semester 1 dan 2)
    const tahunAjaranLengkap = new Set<string>();
    tahunAjaranMap.forEach((value, tahun) => {
      if (value.semester1 && value.semester2) {
        tahunAjaranLengkap.add(tahun);
      }
    });
    
    // Hitung berapa banyak tahun ajaran lengkap yang ada
    const jumlahTahunAjaranLengkap = tahunAjaranLengkap.size;
    
    // Tentukan tahun minimum untuk dropdown
    let minYear = BASE_YEAR; // Default: mulai dari 2024
    
    // Hanya ubah minYear jika sudah ada minimal 2 tahun ajaran lengkap di database
    if (jumlahTahunAjaranLengkap >= 2 && tahunAjaran.length > 0) {
      // Cari tahun ajaran terbaru yang ada di database
      const tahunAjaranTerbaru = tahunAjaran
        .map(ta => parseInt(ta.tahun.split('/')[0]))
        .sort((a, b) => b - a)[0];
      
      const tahunAjaranTerbaruStr = `${tahunAjaranTerbaru}/${tahunAjaranTerbaru + 1}`;
      const isTahunAjaranTerbaruLengkap = tahunAjaranLengkap.has(tahunAjaranTerbaruStr);
      
      // Jika tahun ajaran terbaru sudah lengkap, mulai dari tahun setelahnya
      if (isTahunAjaranTerbaruLengkap) {
        minYear = tahunAjaranTerbaru + 1;
      } else {
        // Jika tahun ajaran terbaru belum lengkap, mulai dari tahun tersebut
        minYear = tahunAjaranTerbaru;
      }
      
      // Jika sudah masuk tahun baru (currentYear > tahun terbaru), 
      // maka mulai dari tahun sekarang (karena tahun ajaran lama sudah lewat)
      if (currentYear > tahunAjaranTerbaru) {
        minYear = currentYear;
      }
    }
    
    // Generate semua kemungkinan tahun ajaran (dari minYear sampai 10 tahun ke depan)
    const allPossibleYears: string[] = [];
    for (let year = minYear; year <= currentYear + 10; year++) {
      allPossibleYears.push(`${year}/${year + 1}`);
    }
    
    // Filter tahun ajaran yang sudah lengkap
    const filteredYears = allPossibleYears.filter(tahun => !tahunAjaranLengkap.has(tahun));
    
    // Pastikan selalu ada minimal 2 tahun ajaran baru
    // Cari tahun ajaran terbaru yang belum ada
    let tahunBaruCount = 0;
    const tahunBaru: string[] = [];
    
    for (let year = minYear; year <= currentYear + 10; year++) {
      const tahunStr = `${year}/${year + 1}`;
      
      // Jika tahun ajaran ini belum ada sama sekali di database
      if (!tahunAjaranMap.has(tahunStr)) {
        tahunBaru.push(tahunStr);
        tahunBaruCount++;
        if (tahunBaruCount >= 2) break;
      }
    }
    
    // Gabungkan tahun ajaran yang belum lengkap dengan minimal 2 tahun baru
    const result = new Set<string>();
    
    // Tambahkan tahun ajaran yang belum lengkap (yang >= minYear)
    filteredYears.forEach(tahun => {
      const tahunYear = parseInt(tahun.split('/')[0]);
      if (tahunYear >= minYear) {
        result.add(tahun);
      }
    });
    
    // Pastikan minimal 2 tahun baru selalu ada
    tahunBaru.forEach(tahun => result.add(tahun));
    
    // Urutkan hasil
    return Array.from(result).sort((a, b) => {
      const yearA = parseInt(a.split('/')[0]);
      const yearB = parseInt(b.split('/')[0]);
      return yearA - yearB;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editingTahunAjaran ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
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
              Tahun Ajaran *
            </label>
            <select
              value={formData.tahun}
              onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Pilih Tahun Ajaran</option>
              {generateTahunOptions().map((tahun) => (
                <option key={tahun} value={tahun}>
                  {tahun}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester *
            </label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value={1}>Semester 1 (Ganjil)</option>
              <option value={2}>Semester 2 (Genap)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai Semester *
            </label>
            <input
              type="date"
              value={formData.tanggalMulai}
              onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Selesai Semester *
            </label>
            <input
              type="date"
              value={formData.tanggalSelesai}
              onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
              Jadikan sebagai tahun ajaran aktif
            </label>
          </div>

          {formData.isActive && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Perhatian:</strong> Mengaktifkan tahun ajaran ini akan menonaktifkan tahun ajaran lainnya.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" fullWidth className="justify-center flex items-center">
              <Save size={16} className="mr-2" />
              {editingTahunAjaran ? 'Update' : 'Tambah'} Tahun Ajaran
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={onClose} className="justify-center flex items-center">
              Batal
            </Button>
          </div>
        </form>
      </div>

      {/* Modal Validasi */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Proses Belum Selesai"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-900 whitespace-pre-line leading-relaxed">
                {validationMessage}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowValidationModal(false)}>
              Mengerti
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TambahTahunAjaranForm;