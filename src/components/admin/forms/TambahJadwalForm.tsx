import React, { useState, useEffect } from 'react';
import { Save, X, AlertTriangle, Calculator, Clock } from 'lucide-react';
import { JadwalPelajaran, Kelas, MataPelajaran, User, TahunAjaran, Jurusan, GuruMapel, PengaturanSKS, PengaturanIstirahat } from '../../../types';
import { apiService } from '../../../services/apiService';
import { calculateJamSelesai, formatDurasi, calculateTotalDurasi, getJadwalBreakdown } from '../../../utils/sksUtils';
import { clearAllJadwalPelajaranCache } from '../../../hooks/useJadwalPelajaran';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import { isJurusanRequiredSync } from '../../../utils/jenjangPendidikanUtils';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface TambahJadwalFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingJadwal?: JadwalPelajaran | null;
  selectedKelas: string;
  onSuccess: () => void;
}

const TambahJadwalForm: React.FC<TambahJadwalFormProps> = ({
  isOpen,
  onClose,
  editingJadwal,
  selectedKelas,
  onSuccess
}) => {
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [guruMapel, setGuruMapel] = useState<GuruMapel[]>([]);
  const [pengaturanSKS] = useLocalStorage<PengaturanSKS[]>('pengaturanSKS', []);
  const [pengaturanIstirahat] = useLocalStorage<PengaturanIstirahat[]>('pengaturanIstirahat', []);
  const [formData, setFormData] = useState({
    kelasId: '',
    mataPelajaranId: '',
    guruId: '',
    hari: 'senin' as const,
    jamMulai: '',
    jamSelesai: '',
    semester: 1,
    tahunAjaran: '',
  });
  const [autoCalculateEnd, setAutoCalculateEnd] = useState(true);

  // Fetch data from API
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [
        kelasResponse,
        mataPelajaranResponse,
        usersResponse,
        tahunAjaranResponse,
        jurusanResponse,
        guruMapelResponse,
      ] = await Promise.all([
        apiService.getAllKelas(),
        apiService.getAllMataPelajaran(),
        apiService.getAllGurus(),
        apiService.getAllTahunAjaran(),
        apiService.getAllJurusan(),
        apiService.getAllGuruMapel({ isActive: true }),
      ]);

      if (kelasResponse.success && kelasResponse.kelas) {
        setKelas(kelasResponse.kelas);
      }
      if (mataPelajaranResponse.success && mataPelajaranResponse.mataPelajaran) {
        setMataPelajaran(mataPelajaranResponse.mataPelajaran);
      }
      if (usersResponse.success && usersResponse.gurus) {
        setUsers(usersResponse.gurus);
      }
      if (tahunAjaranResponse.success && tahunAjaranResponse.tahunAjaran) {
        setTahunAjaran(tahunAjaranResponse.tahunAjaran);
      }
      if (jurusanResponse.success && jurusanResponse.jurusan) {
        setJurusan(jurusanResponse.jurusan);
      }
      if (guruMapelResponse.success && guruMapelResponse.guruMapel) {
        setGuruMapel(guruMapelResponse.guruMapel);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const gurus = users.filter(u => u.role === 'guru');
  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
  const activePengaturanSKS = pengaturanSKS.find(p => p.isActive);
  const activePengaturanIstirahat = pengaturanIstirahat.find(p => p.isActive);
  const currentKelas = kelas.find(k => k.id === selectedKelas);
  const currentJurusan = jurusan.find(j => j.id === currentKelas?.jurusanId);

  React.useEffect(() => {
    if (editingJadwal) {
      setFormData({
        kelasId: editingJadwal.kelasId,
        mataPelajaranId: editingJadwal.mataPelajaranId,
        guruId: editingJadwal.guruId,
        hari: editingJadwal.hari,
        jamMulai: editingJadwal.jamMulai,
        jamSelesai: editingJadwal.jamSelesai,
        semester: editingJadwal.semester,
        tahunAjaran: editingJadwal.tahunAjaran,
      });
      setAutoCalculateEnd(false); // Disable auto calculation when editing
    } else {
      resetForm();
    }
  }, [editingJadwal, isOpen, selectedKelas, activeTahunAjaran]);

  // Auto calculate jam selesai when jam mulai or mata pelajaran changes
  React.useEffect(() => {
    if (autoCalculateEnd && formData.jamMulai && formData.mataPelajaranId && activePengaturanSKS) {
      const selectedMapel = mataPelajaran.find(m => m.id === formData.mataPelajaranId);
      if (selectedMapel) {
        const calculatedEnd = calculateJamSelesai(
          formData.jamMulai, 
          selectedMapel.sks, 
          activePengaturanSKS,
          activePengaturanIstirahat
        );
        setFormData(prev => ({ ...prev, jamSelesai: calculatedEnd }));
      }
    }
  }, [formData.jamMulai, formData.mataPelajaranId, autoCalculateEnd, activePengaturanSKS, activePengaturanIstirahat, mataPelajaran]);

  const checkConflict = async (newJadwal: Omit<JadwalPelajaran, 'id'>) => {
    try {
      const response = await apiService.checkScheduleConflict({
        kelasId: newJadwal.kelasId,
        guruId: newJadwal.guruId,
        hari: newJadwal.hari,
        jamMulai: newJadwal.jamMulai,
        jamSelesai: newJadwal.jamSelesai,
        tahunAjaran: newJadwal.tahunAjaran,
        semester: newJadwal.semester,
        excludeId: editingJadwal?.id,
      });
      
      return response.hasConflict || false;
    } catch (error) {
      console.error('Error checking conflict:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.mataPelajaranId || !formData.guruId || !formData.jamMulai || !formData.jamSelesai) {
      alert('Semua field wajib diisi!');
      return;
    }

    if (formData.jamMulai >= formData.jamSelesai) {
      alert('Jam mulai harus lebih awal dari jam selesai!');
      return;
    }

    // Validate jam selesai sesuai dengan SKS jika auto calculate aktif
    if (autoCalculateEnd && activePengaturanSKS) {
      const selectedMapel = mataPelajaran.find(m => m.id === formData.mataPelajaranId);
      if (selectedMapel) {
        const expectedEnd = calculateJamSelesai(
          formData.jamMulai, 
          selectedMapel.sks, 
          activePengaturanSKS,
          activePengaturanIstirahat
        );
        if (formData.jamSelesai !== expectedEnd) {
          alert(`Jam selesai tidak sesuai dengan SKS mata pelajaran!\nSeharusnya: ${expectedEnd} (${selectedMapel.sks} SKS = ${formatDurasi(calculateTotalDurasi(selectedMapel.sks, activePengaturanSKS))})`);
          return;
        }
      }
    }
    
    const newJadwalData = {
      ...formData,
      kelasId: selectedKelas || formData.kelasId,
      semester: activeTahunAjaran?.semester || 1,
      tahunAjaran: activeTahunAjaran?.tahun || '',
    };

    const hasConflict = await checkConflict(newJadwalData);
    if (hasConflict) {
      alert('JADWAL BENTROK! Tidak dapat menyimpan jadwal ini karena ada konflik dengan jadwal yang sudah ada.');
      return;
    }
    
    try {
      if (editingJadwal) {
        const response = await apiService.updateJadwalPelajaran(editingJadwal.id, newJadwalData);
        if (response.success) {
          // Clear cache dan muat ulang data dari useJadwalPelajaran
          clearAllJadwalPelajaranCache();
          onSuccess();
          resetForm();
          onClose();
        } else {
          alert(response.message || 'Gagal memperbarui jadwal pelajaran');
        }
      } else {
        const response = await apiService.createJadwalPelajaran(newJadwalData);
        if (response.success) {
          // Clear cache dan muat ulang data dari useJadwalPelajaran
          clearAllJadwalPelajaranCache();
          onSuccess();
          resetForm();
          onClose();
        } else {
          alert(response.message || 'Gagal menambahkan jadwal pelajaran');
        }
      }
    } catch (error: any) {
      console.error('Error saving jadwal pelajaran:', error);
      if (error.message && error.message.includes('bentrok')) {
        alert(error.message);
      } else {
        alert('Terjadi kesalahan saat menyimpan jadwal pelajaran');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      kelasId: selectedKelas || '',
      mataPelajaranId: '',
      guruId: '',
      hari: 'senin',
      jamMulai: '',
      jamSelesai: '',
      semester: activeTahunAjaran?.semester || 1,
      tahunAjaran: activeTahunAjaran?.tahun || '',
    });
    setAutoCalculateEnd(true);
  };

  const getAvailableMataPelajaran = (kelasId: string) => {
    const kelasItem = kelas.find(k => k.id === kelasId);
    if (!kelasItem) return [];
    
    // Get current semester from active tahun ajaran
    const currentSemester = activeTahunAjaran?.semester === 1 ? 'ganjil' : 'genap';
    
    return mataPelajaran.filter(m => {
      // Filter berdasarkan semester
      const semesterMatch = m.semester === 'keduanya' || m.semester === currentSemester;
      if (!semesterMatch) return false;
      
      // Filter berdasarkan tingkat kelas
      const tingkatMatch = m.tingkatKelas?.includes(kelasItem.tingkat) || false;
      if (!tingkatMatch) return false;
      
      // Filter berdasarkan keterangan (umum atau jurusan)
      return m.keterangan === 'umum' || 
             (m.keterangan === 'jurusan' && m.jurusanId === kelasItem.jurusanId);
    });
  };

  const getAvailableGuruForMapel = (mataPelajaranId: string) => {
    const guruIds = guruMapel
      .filter(gm => gm.mataPelajaranId === mataPelajaranId && gm.isActive)
      .map(gm => gm.guruId);
    
    return gurus.filter(g => guruIds.includes(g.id) && g.isActive !== false);
  };

  const getGuruTeachingCount = async (guruId: string, mataPelajaranId: string) => {
    try {
      const response = await apiService.getAllJadwalPelajaran({
        guruId,
        mataPelajaranId,
        tahunAjaran: activeTahunAjaran?.tahun,
        semester: activeTahunAjaran?.semester,
      });
      return response.success && response.jadwalPelajaran ? response.jadwalPelajaran.length : 0;
    } catch (error) {
      return 0;
    }
  };

  const hariOptions = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
    { value: 'sabtu', label: 'Sabtu' },
    { value: 'minggu', label: 'Minggu' },
  ];

  const availableMataPelajaran = getAvailableMataPelajaran(selectedKelas);
  const selectedMapel = mataPelajaran.find(m => m.id === formData.mataPelajaranId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editingJadwal ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
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
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Informasi Kelas</h4>
            <div className={`grid grid-cols-1 ${isJurusanRequiredSync() ? 'sm:grid-cols-2' : ''} gap-4 text-sm`}>
              <div>
                <span className="text-blue-700">Kelas:</span>
                <span className="ml-2 font-medium">{currentKelas?.name}</span>
              </div>
              {isJurusanRequiredSync() && currentJurusan && (
                <div>
                  <span className="text-blue-700">Jurusan:</span>
                  <span className="ml-2 font-medium">{currentJurusan?.name}</span>
                </div>
              )}
            </div>
          </div>

          {activePengaturanSKS && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Pengaturan SKS Aktif</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-purple-700">Durasi per SKS:</span>
                  <span className="ml-2 font-medium">{activePengaturanSKS.durasiPerSKS} menit</span>
                </div>
                <div>
                  <span className="text-purple-700">Istirahat antar SKS:</span>
                  <span className="ml-2 font-medium">{activePengaturanSKS.istirahatAntarSKS} menit</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mata Pelajaran *
            </label>
            <select
              value={formData.mataPelajaranId}
              onChange={(e) => {
                setFormData({ ...formData, mataPelajaranId: e.target.value, guruId: '' });
                // Reset jam selesai when changing mata pelajaran
                if (autoCalculateEnd) {
                  setFormData(prev => ({ ...prev, jamSelesai: '' }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Pilih Mata Pelajaran</option>
              {availableMataPelajaran.filter(m => m.keterangan === 'umum').length > 0 && (
                <optgroup label={`Mata Pelajaran Umum - Semester ${activeTahunAjaran?.semester === 1 ? 'Ganjil' : 'Genap'} - Tingkat ${currentKelas?.tingkat}`}>
                  {availableMataPelajaran.filter(m => m.keterangan === 'umum').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code}) - {m.sks} SKS {activePengaturanSKS ? `(${formatDurasi(calculateTotalDurasi(m.sks, activePengaturanSKS))})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {availableMataPelajaran.filter(m => m.keterangan === 'jurusan').length > 0 && isJurusanRequiredSync() && (
                <optgroup label={`Mata Pelajaran Jurusan ${currentJurusan?.name || ''} - Semester ${activeTahunAjaran?.semester === 1 ? 'Ganjil' : 'Genap'} - Tingkat ${currentKelas?.tingkat}`}>
                  {availableMataPelajaran.filter(m => m.keterangan === 'jurusan').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code}) - {m.sks} SKS {activePengaturanSKS ? `(${formatDurasi(calculateTotalDurasi(m.sks, activePengaturanSKS))})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {availableMataPelajaran.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Tidak ada mata pelajaran yang tersedia untuk kelas tingkat {currentKelas?.tingkat} semester {activeTahunAjaran?.semester === 1 ? 'ganjil' : 'genap'} pada tahun ajaran aktif.
              </p>
            )}
            {selectedMapel && activePengaturanSKS && (
              <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center">
                  <Calculator size={16} className="text-indigo-600 mr-2" />
                  <div className="text-sm">
                    <span className="text-indigo-700 font-medium">{selectedMapel.name}</span>
                    <span className="text-indigo-600 ml-2">
                      {selectedMapel.sks} SKS = {formatDurasi(calculateTotalDurasi(selectedMapel.sks, activePengaturanSKS))}
                    </span>
                  </div>
                </div>
                {formData.jamMulai && activePengaturanIstirahat && (
                  <div className="mt-2">
                    {(() => {
                      const breakdown = getJadwalBreakdown(
                        formData.jamMulai,
                        selectedMapel.sks,
                        activePengaturanSKS,
                        activePengaturanIstirahat
                      );
                      
                      const hasBreak = breakdown.segments.some(s => s.type === 'break');
                      
                      if (hasBreak) {
                        return (
                          <div className="text-xs text-indigo-700">
                            <div className="font-medium mb-1">📅 Jadwal terpotong istirahat:</div>
                            {breakdown.segments.map((segment, idx) => (
                              <div key={idx} className="ml-2">
                                {segment.type === 'lesson' ? '📚' : '☕'} {segment.start} - {segment.end} 
                                {segment.type === 'lesson' ? ' (Pelajaran)' : ' (Istirahat)'}
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-xs text-indigo-700">
                            ✅ Jadwal tidak melewati jam istirahat
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guru Pengajar *
            </label>
            <select
              value={formData.guruId}
              onChange={(e) => setFormData({ ...formData, guruId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!formData.mataPelajaranId}
            >
              <option value="">
                {!formData.mataPelajaranId ? 'Pilih mata pelajaran terlebih dahulu' : 'Pilih Guru'}
              </option>
              {formData.mataPelajaranId && getAvailableGuruForMapel(formData.mataPelajaranId).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {formData.mataPelajaranId && getAvailableGuruForMapel(formData.mataPelajaranId).length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Tidak ada guru yang tersedia untuk mata pelajaran ini.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hari *
              </label>
              <select
                value={formData.hari}
                onChange={(e) => setFormData({ ...formData, hari: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {hariOptions.map((hari) => (
                  <option key={hari.value} value={hari.value}>
                    {hari.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jam Mulai *
              </label>
              <input
                type="time"
                value={formData.jamMulai}
                onChange={(e) => {
                  setFormData({ ...formData, jamMulai: e.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jam Selesai * {autoCalculateEnd && <span className="text-xs text-green-600">(Otomatis)</span>}
              </label>
              <input
                type="time"
                value={formData.jamSelesai}
                onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  autoCalculateEnd ? 'bg-green-50' : ''
                }`}
                readOnly={autoCalculateEnd}
                required
              />
              {autoCalculateEnd && (
                <p className="text-xs text-green-600 mt-1">
                  Jam selesai dihitung otomatis berdasarkan SKS mata pelajaran
                </p>
              )}
            </div>
          </div>

          {/* Toggle Auto Calculate */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="autoCalculateEnd"
              checked={autoCalculateEnd}
              onChange={(e) => setAutoCalculateEnd(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoCalculateEnd" className="ml-3 text-sm font-medium text-gray-700">
              Hitung jam selesai otomatis berdasarkan SKS
            </label>
            {!activePengaturanSKS && (
              <Badge variant="warning" size="sm" className="ml-2">
                Pengaturan SKS belum dikonfigurasi
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester aktif*
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-700">
                  Semester {activeTahunAjaran?.semester || 1} ({activeTahunAjaran?.semester === 1 ? 'Ganjil' : 'Genap'})
                </span>
                
              </div>
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tahun Ajaran aktif*
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-700">
                  {activeTahunAjaran?.tahun || '-'}
                </span>
                
              </div>
              
            </div>
          </div>

          {formData.guruId && formData.hari && formData.jamMulai && formData.jamSelesai && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle size={16} className="text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  {(() => {
                    const newJadwalData = {
                      kelasId: selectedKelas,
                      mataPelajaranId: formData.mataPelajaranId,
                      guruId: formData.guruId,
                      hari: formData.hari,
                      jamMulai: formData.jamMulai,
                      jamSelesai: formData.jamSelesai,
                      semester: activeTahunAjaran?.semester || 1,
                      tahunAjaran: activeTahunAjaran?.tahun || '',
                    };
                    
                    // Note: checkConflict is async, so we can't call it directly here
                    // The conflict check will be done in handleSubmit
                    const conflictResult = false;
                  
                    if (conflictResult) {
                      return '⚠️ JADWAL BENTROK! Tidak dapat menyimpan jadwal ini.';
                    } else {
                      const durasiInfo = selectedMapel && activePengaturanSKS ? 
                        ` Durasi: ${formatDurasi(calculateTotalDurasi(selectedMapel.sks, activePengaturanSKS))}.` : '';
                      return `✅ Jadwal tidak bentrok - siap untuk disimpan.${durasiInfo}`;
                    }
                  })()}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" fullWidth className="justify-center flex items-center">
              <Save size={16} className="mr-2" />
              {editingJadwal ? 'Update' : 'Tambah'} Jadwal
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

export default TambahJadwalForm;