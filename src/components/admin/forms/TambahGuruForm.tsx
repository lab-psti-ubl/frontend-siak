import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { User, Guru } from '../../../types';
import { useKelas } from '../../../hooks/useKelas';
import { useTahunAjaran } from '../../../hooks/useTahunAjaran';
import { apiService } from '../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../ui/ToastContainer';
import Button from '../../ui/Button';

interface TambahGuruFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingGuru?: User | null;
  onSuccess: () => void;
}

const TambahGuruForm: React.FC<TambahGuruFormProps> = ({
  isOpen,
  onClose,
  editingGuru,
  onSuccess
}) => {
  const { tahunAjaran: tahunAjaranData, activeTahunAjaran, loading: tahunAjaranLoading } = useTahunAjaran();
  const { kelas, refreshKelas } = useKelas();
  
  // Gunakan data dari database (hook) saja, tidak pakai localStorage
  // Pastikan tahunAjaranData adalah array dan memiliki data
  const hasAnyTahunAjaran = Array.isArray(tahunAjaranData) && tahunAjaranData.length > 0;
  const [rfidError, setRfidError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nip: '',
    password: '',
    subject: '',
    isWaliKelas: false,
    kelasWali: '',
    isActive: true,
    rfidGuid: '',
  });

  React.useEffect(() => {
    if (editingGuru) {
      const guru = editingGuru as any;
      setFormData({
        name: editingGuru.name,
        email: editingGuru.email,
        phone: editingGuru.phone || '',
        nip: guru.nip || '',
        password: '',
        subject: guru.subject || '',
        isWaliKelas: guru.isWaliKelas || false,
        kelasWali: guru.kelasWali || '',
        isActive: guru.isActive !== false,
        rfidGuid: guru.rfidGuid || '',
      });
    } else {
      resetForm();
    }
    setRfidError('');
  }, [editingGuru, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRfidError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.nip.trim()) {
      showErrorToast('Error', 'Nama, email, dan NIP wajib diisi!');
      return;
    }

    try {
      // Validasi: tidak boleh menetapkan wali kelas jika belum ada tahun ajaran
      if (formData.isWaliKelas) {
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

        // Validasi: jika menetapkan sebagai wali kelas, kelas harus dipilih
        if (!formData.kelasWali) {
          showErrorToast('Error', 'Silakan pilih kelas untuk wali kelas');
          return;
        }
      }
      let updatedRiwayat: any[] = [];

      // Prepare riwayat kelas wali if editing
      const activeTahunAjaranForRiwayat = tahunAjaranData.find(ta => ta.isActive);
      if (editingGuru && formData.isWaliKelas && formData.kelasWali && activeTahunAjaranForRiwayat) {
        const guru = editingGuru as Guru;
        updatedRiwayat = guru.riwayatKelasWali || [];
        
        const existingIndex = updatedRiwayat.findIndex(
          r => r.tahunAjaran === activeTahunAjaranForRiwayat.tahun &&
               r.semester === activeTahunAjaranForRiwayat.semester
        );

        if (existingIndex >= 0) {
          updatedRiwayat = updatedRiwayat.map((r, idx) =>
            idx === existingIndex
              ? { ...r, kelasId: formData.kelasWali }
              : r
          );
        } else {
          updatedRiwayat = [
            ...updatedRiwayat,
            {
              kelasId: formData.kelasWali,
              tahunAjaran: activeTahunAjaranForRiwayat.tahun,
              semester: activeTahunAjaranForRiwayat.semester
            }
          ];
        }
      }

      const guruData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        nip: formData.nip,
        password: formData.password || undefined,
        subject: formData.subject || undefined,
        isWaliKelas: formData.isWaliKelas,
        kelasWali: formData.isWaliKelas ? formData.kelasWali : undefined,
        isActive: formData.isActive,
        // Jika sedang edit dan rfidGuid kosong, kirim null untuk menghapus. Jika ada value, kirim value yang sudah di-trim. Jika tidak edit dan kosong, tidak perlu kirim.
        rfidGuid: editingGuru 
          ? (formData.rfidGuid.trim() === '' ? null : formData.rfidGuid.trim())
          : (formData.rfidGuid.trim() || undefined),
        profileImage: undefined, // Add if needed
        ...(editingGuru && updatedRiwayat.length > 0 ? { riwayatKelasWali: updatedRiwayat } : {}),
      };

      let response;
      if (editingGuru) {
        response = await apiService.updateGuru(editingGuru.id, guruData);
      } else {
        response = await apiService.createGuru(guruData);
      }

      if (response.success) {
        showSuccessToast('Berhasil', editingGuru ? 'Guru berhasil diperbarui' : 'Guru berhasil ditambahkan');
        refreshKelas();
        onSuccess();
        resetForm();
        onClose();
      } else {
        showErrorToast('Error', response.message || 'Gagal menyimpan data guru');
      }
    } catch (error: any) {
      if (error.message?.includes('Email sudah terdaftar')) {
        showErrorToast('Error', 'Email sudah terdaftar');
      } else if (error.message?.includes('NIP sudah terdaftar')) {
        showErrorToast('Error', 'NIP sudah terdaftar');
      } else if (error.message?.includes('GUID/RFID')) {
        setRfidError('GUID/RFID sudah terdaftar ke guru/murid lain');
      } else {
        showErrorToast('Error', error.message || 'Terjadi kesalahan saat menyimpan data guru');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      nip: '',
      password: '',
      subject: '',
      isWaliKelas: false,
      kelasWali: '',
      isActive: true,
      rfidGuid: '',
    });
    setRfidError('');
  };

  const getAvailableKelasForWali = () => {
    return kelas.filter(kelasItem => {
      // Jangan tampilkan kelas Alumni (tingkat 99 atau name === 'Alumni')
      if (kelasItem.name === 'Alumni' || kelasItem.tingkat === 99) {
        return false;
      }
      
      // Jika sedang edit guru dan kelas ini adalah kelas wali yang sudah ada, tetap tampilkan
      if (editingGuru && kelasItem.id === (editingGuru as any).kelasWali) {
        return true;
      }
      
      // Tampilkan kelas yang belum memiliki wali kelas
      return !kelasItem.waliKelasId;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editingGuru ? 'Edit Data Guru' : 'Tambah Guru Baru'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Namaa Lengkap *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="contoh@sekolah.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="08xxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 08xxxxxxxxxx atau +62xxxxxxxxxx
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIP *
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nomor Induk Pegawai"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posisi / Jabatan
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Contoh: Guru, TU, Staff, Magang"
              />
              <p className="text-xs text-gray-500 mt-1">
                Opsional - masukkan posisi atau jabatan guru
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFID GUID (Opsional)
              </label>
              <input
                type="text"
                value={formData.rfidGuid}
                onChange={(e) => {
                  setFormData({ ...formData, rfidGuid: e.target.value });
                  setRfidError('');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  rfidError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan RFID GUID (contoh: 5a2a0a)"
              />
              {rfidError && (
                <p className="text-xs text-red-500 font-medium mt-1">
                  {rfidError}
                </p>
              )}
              {!rfidError && (
                <p className="text-xs text-gray-500 mt-1">
                  Masukkan RFID GUID secara manual
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isWaliKelas"
                  checked={formData.isWaliKelas}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Validasi saat user mencoba mencentang checkbox
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
                    setFormData({
                      ...formData,
                      isWaliKelas: e.target.checked,
                      kelasWali: e.target.checked ? formData.kelasWali : ''
                    });
                  }}
                  disabled={!hasAnyTahunAjaran}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="isWaliKelas" className={`ml-3 text-sm font-medium ${!hasAnyTahunAjaran ? 'text-gray-400' : 'text-gray-700'}`}>
                  Jadikan sebagai Wali Kelas
                </label>
              </div>

              {/* Informasi Visual Status Tahun Ajaran */}
              {tahunAjaranLoading ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-600">Memuat data tahun ajaran...</p>
                  </div>
                </div>
              ) : !hasAnyTahunAjaran ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-red-900 mb-1">
                        Tahun Ajaran Belum Tersedia
                      </p>
                      <p className="text-xs text-red-700">
                        Untuk menetapkan wali kelas, Anda harus menambahkan tahun ajaran terlebih dahulu di menu <span className="font-semibold">"Tahun Ajaran"</span>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : !activeTahunAjaran ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-900 mb-1">
                        Tahun Ajaran Belum Aktif
                      </p>
                      <p className="text-xs text-amber-700">
                        Ada {tahunAjaranData && tahunAjaranData.length ? tahunAjaranData.length : 0} tahun ajaran yang tersedia, namun belum ada yang aktif. Silakan aktifkan salah satu tahun ajaran di menu <span className="font-semibold">"Tahun Ajaran"</span> sebelum menetapkan wali kelas.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-900 mb-1">
                        Tahun Ajaran Aktif Tersedia
                      </p>
                      <p className="text-xs text-green-700">
                        Tahun ajaran aktif: <span className="font-semibold">{activeTahunAjaran.tahun} - Semester {activeTahunAjaran.semester}</span>. Anda dapat menetapkan wali kelas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formData.isWaliKelas && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Kelas
                </label>
                <select
                  value={formData.kelasWali}
                  onChange={(e) => setFormData({ ...formData, kelasWali: e.target.value })}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !hasAnyTahunAjaran ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                  }`}
                  required={formData.isWaliKelas}
                  disabled={!hasAnyTahunAjaran}
                >
                  <option value="">Pilih Kelas</option>
                  {getAvailableKelasForWali().map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
                {!hasAnyTahunAjaran ? (
                  <p className="text-xs text-red-500 mt-1">
                    Tambahkan tahun ajaran terlebih dahulu di menu <span className="font-semibold">Tahun Ajaran</span> sebelum memilih kelas.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Hanya menampilkan kelas yang belum memiliki wali kelas
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
                Status Aktif
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <Button type="submit" fullWidth className="justify-center flex items-center">
              <Save size={16} className="mr-2" />
              {editingGuru ? 'Perbarui Data' : 'Tambah Guru'}
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

export default TambahGuruForm;