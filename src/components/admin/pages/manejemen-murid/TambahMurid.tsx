import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, User as UserIcon } from 'lucide-react';
import { useKelas } from '../../../../hooks/useKelas';
import { useJurusan } from '../../../../hooks/useJurusan';
import { clearMuridCache } from '../../../../hooks/useMurid';
import { apiService } from '../../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { shouldShowJurusanSync, getTingkatKelasOptionsSync } from '../../../../utils/jenjangPendidikanUtils';

interface TambahMuridProps {
  onBack?: () => void;
  selectedKelasId?: string;
  onSuccess?: () => void;
}

const TambahMurid: React.FC<TambahMuridProps> = ({ onBack, selectedKelasId, onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { kelas } = useKelas();
  const { jurusan } = useJurusan();
  const showJurusan = shouldShowJurusanSync();
  const tingkatOptions = getTingkatKelasOptionsSync();
  
  // Filter out alumni classes (tingkat 99 or name contains 'Alumni')
  const activeKelas = kelas.filter(k => {
    const isAlumniClass = k.tingkat === 99 || k.name.toLowerCase().includes('alumni');
    const isValidTingkat = tingkatOptions.includes(k.tingkat);
    return !isAlumniClass && isValidTingkat;
  });
  
  // Get kelas ID from props, location state, or sessionStorage
  const getInitialKelasId = () => {
    // Priority: props > location state > sessionStorage
    if (selectedKelasId) return selectedKelasId;
    if (location.state?.selectedKelasId) return location.state.selectedKelasId;
    return sessionStorage.getItem('selectedKelasId') || '';
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nisn: '',
    password: '',
    kelasId: getInitialKelasId(),
    whatsappOrtu: '',
    rfidGuid: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rfidError, setRfidError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setRfidError('');

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.nisn.trim() || !formData.kelasId) {
      setMessage({ type: 'error', text: 'Semua field wajib harus diisi!' });
      showErrorToast('Error', 'Semua field wajib harus diisi!');
      return;
    }

    try {
      const muridData = {
        name: formData.name,
        email: formData.email,
        nisn: formData.nisn,
        password: formData.password || undefined,
        kelasId: formData.kelasId,
        whatsappOrtu: formData.whatsappOrtu || undefined,
        rfidGuid: formData.rfidGuid || undefined,
      };

      const response = await apiService.createMurid(muridData);

      if (response.success) {
        setMessage({ type: 'success', text: `Murid ${formData.name} berhasil ditambahkan! Form siap untuk menambahkan murid berikutnya.` });
        showSuccessToast('Berhasil', `Murid ${formData.name} berhasil ditambahkan!`);
        
        // Clear all murid cache to ensure all views get updated data
        clearMuridCache();
        
        // Set flag to refresh murid data when navigating back
        sessionStorage.setItem('shouldRefreshMurid', 'true');
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Reset form but keep the selected class and keep form open
        setFormData({
          name: '',
          email: '',
          nisn: '',
          password: '',
          kelasId: getInitialKelasId(),
          whatsappOrtu: '',
          rfidGuid: '',
        });
        setRfidError('');

        // Clear message after 5 seconds but keep form open
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 5000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Gagal menambahkan murid' });
        showErrorToast('Error', response.message || 'Gagal menambahkan murid');
      }
    } catch (error: any) {
      if (error.message?.includes('NISN sudah terdaftar')) {
        setMessage({ type: 'error', text: 'NISN sudah terdaftar!' });
        showErrorToast('Error', 'NISN sudah terdaftar!');
      } else if (error.message?.includes('Email sudah terdaftar')) {
        setMessage({ type: 'error', text: 'Email sudah terdaftar!' });
        showErrorToast('Error', 'Email sudah terdaftar!');
      } else if (error.message?.includes('GUID/RFID')) {
        setRfidError('GUID/RFID sudah terdaftar ke guru/murid lain');
        showErrorToast('Error', 'GUID/RFID sudah terdaftar ke guru/murid lain');
      } else {
        setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menambahkan murid' });
        showErrorToast('Error', error.message || 'Terjadi kesalahan saat menambahkan murid');
      }
    }
  };

  const getJurusanName = (kelasId: string) => {
    if (!showJurusan) return '';
    const kelasItem = kelas.find(k => k.id === kelasId);
    if (!kelasItem || !kelasItem.jurusanId) return '';
    const jurusanItem = jurusan.find(j => j.id === kelasItem.jurusanId);
    return jurusanItem?.name || '';
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard/kelola-data-murid');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-lg bg-blue-500">
          <UserIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tambah Murid Baru</h2>
          <p className="text-gray-600">Tambahkan data murid baru ke sistem</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handleBack} className="justify-center flex items-center">
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Button>
        {selectedKelasId && (
          <div className="text-sm text-gray-600">
            <span>
              Menambahkan ke kelas: <strong>{kelas.find(k => k.id === getInitialKelasId())?.name}</strong>
            </span>
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contoh@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NISN *
              </label>
              <input
                type="text"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nomor Induk Siswa Nasional"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                NISN akan digunakan sebagai password default
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Orang Tua
              </label>
              <input
                type="tel"
                value={formData.whatsappOrtu}
                onChange={(e) => setFormData({ ...formData, whatsappOrtu: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nomor WhatsApp orang tua untuk notifikasi absensi
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas *
              </label>
              <select
                value={formData.kelasId}
                onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Kelas</option>
                {activeKelas.map((k) => {
                  const jurusanName = getJurusanName(k.id);
                  const displayName = jurusanName ? `${k.name} - ${jurusanName}` : k.name;
                  return (
                    <option key={k.id} value={k.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
              {getInitialKelasId() && (
                <p className="text-xs text-blue-600 mt-1">
                  Kelas sudah dipilih otomatis sesuai navigasi
                </p>
              )}
            </div>

            <div className="md:col-span-2">
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
          </div>

          {message.text && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex space-x-3">
            <Button type="submit" className="flex-1 justify-center flex items-center">
              <Save size={16} className="mr-2" />
              Simpan Murid
            </Button>
            
          </div>
        </form>
      </Card>
      
      {/* Info Panel */}
      <Card className="p-4 bg-blue-50 border-l-4 border-l-blue-500">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
          <div>
            <h4 className="font-medium text-blue-900">Tips Penggunaan</h4>
            <p className="text-sm text-blue-700 mt-1">
              • Form akan tetap terbuka setelah berhasil menyimpan murid untuk memudahkan penambahan murid berikutnya
            </p>
            <p className="text-sm text-blue-700">
              • Kelas yang dipilih akan tetap tersimpan untuk murid berikutnya
            </p>
            <p className="text-sm text-blue-700">
              • Klik "Selesai & Kembali" jika sudah selesai menambahkan semua murid
            </p>
            <p className="text-sm text-blue-700">
              • Password default sama dengan NISN, bisa diubah di menu profil murid
            </p>
          </div>
        </div>
      </Card>
      
      {/* Success Counter */}
      {message.type === 'success' && (
        <Card className="p-4 bg-emerald-50 border-l-4 border-l-emerald-500">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
            <div>
              <h4 className="font-medium text-emerald-900">Status Penambahan</h4>
              <p className="text-sm text-emerald-700 mt-1">
                ✅ Murid berhasil ditambahkan ke kelas {kelas.find(k => k.id === getInitialKelasId())?.name}
              </p>
              <p className="text-sm text-emerald-700">
                📝 Form sudah direset dan siap untuk menambahkan murid berikutnya
              </p>
              <p className="text-sm text-emerald-700">
                🔄 Kelas tetap terpilih: {kelas.find(k => k.id === getInitialKelasId())?.name}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TambahMurid;