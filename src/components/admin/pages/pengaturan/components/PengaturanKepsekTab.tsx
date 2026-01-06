import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff, AlertCircle, CheckCircle, User } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { DataKepsek } from '../../../../../types';
import { apiService } from '../../../../../services/apiService';

interface PengaturanKepsekTabProps {
  dataKepsekList: DataKepsek[];
  setDataKepsekList: (data: DataKepsek[]) => void;
}

const PengaturanKepsekTab: React.FC<PengaturanKepsekTabProps> = ({
  dataKepsekList,
  setDataKepsekList,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DataKepsek>>({
    nama: '',
    email: '',
    password: '',
    nip: '',
    noHP: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      nama: '',
      email: '',
      password: '',
      nip: '',
      noHP: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (kepsek: DataKepsek) => {
    setEditingId(kepsek.id);
    setFormData({
      nama: kepsek.nama,
      email: kepsek.email,
      password: kepsek.password,
      nip: kepsek.nip,
      noHP: kepsek.noHP,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nama || !formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Nama, Email, dan Password wajib diisi' });
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const response = await apiService.updateDataKepsek(editingId, {
          nama: formData.nama!,
          email: formData.email!,
          password: formData.password!,
          nip: formData.nip || '',
          noHP: formData.noHP || '',
        });

        if (response.success) {
          // Refresh data
          const allResponse = await apiService.getAllDataKepsek();
          if (allResponse.success && allResponse.dataKepsek) {
            setDataKepsekList(allResponse.dataKepsek);
          }
          setMessage({ type: 'success', text: 'Data Kepala Sekolah berhasil diperbarui' });
        } else {
          setMessage({ type: 'error', text: response.message || 'Gagal memperbarui data kepala sekolah' });
        }
      } else {
        // Create new
        const response = await apiService.createDataKepsek({
          nama: formData.nama!,
          email: formData.email!,
          password: formData.password!,
          nip: formData.nip || '',
          noHP: formData.noHP || '',
        });

        if (response.success) {
          // Refresh data
          const allResponse = await apiService.getAllDataKepsek();
          if (allResponse.success && allResponse.dataKepsek) {
            setDataKepsekList(allResponse.dataKepsek);
          }
          setMessage({ type: 'success', text: 'Data Kepala Sekolah berhasil ditambahkan' });
        } else {
          setMessage({ type: 'error', text: response.message || 'Gagal menambahkan data kepala sekolah' });
        }
      }

      setIsFormOpen(false);
      setFormData({
        nama: '',
        email: '',
        password: '',
        nip: '',
        noHP: '',
      });
    } catch (error: any) {
      console.error('Error saving data kepsek:', error);
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menyimpan data kepala sekolah' });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data Kepala Sekolah ini?')) {
      try {
        const response = await apiService.deleteDataKepsek(id);
        
        if (response.success) {
          // Refresh data
          const allResponse = await apiService.getAllDataKepsek();
          if (allResponse.success && allResponse.dataKepsek) {
            setDataKepsekList(allResponse.dataKepsek);
          }
          setMessage({ type: 'success', text: 'Data Kepala Sekolah berhasil dihapus' });
        } else {
          setMessage({ type: 'error', text: response.message || 'Gagal menghapus data kepala sekolah' });
        }
      } catch (error: any) {
        console.error('Error deleting data kepsek:', error);
        setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menghapus data kepala sekolah' });
      }
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {message.text && (
        <div
          className={`p-3 sm:p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={18} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm">{message.text}</span>
        </div>
      )}

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900">Data Kepala Sekolah</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Kelola data dan akun Kepala Sekolah</p>
          </div>
          {!isFormOpen && (
            <Button
              onClick={handleAddNew}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2 sm:py-3 px-4 sm:px-5 rounded-lg flex-shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Tambah Data Kepsek</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          )}
        </div>

        {isFormOpen && (
          <div className="mb-6 p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-5">
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-4">Isi Data Kepala Sekolah</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Nama Kepala Sekolah *
                  </label>
                  <input
                    type="text"
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
                    placeholder="Nama Kepala Sekolah"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
                    placeholder="Email"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 sm:top-3 text-slate-500 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    NIP
                  </label>
                  <input
                    type="text"
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
                    placeholder="NIP"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    No. HP
                  </label>
                  <input
                    type="text"
                    value={formData.noHP || ''}
                    onChange={(e) => setFormData({ ...formData, noHP: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
                    placeholder="No. HP"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-slate-200">
              <Button
                onClick={() => setIsFormOpen(false)}
                className="flex items-center justify-center gap-2 bg-slate-400 hover:bg-slate-500 text-white text-xs sm:text-sm py-2 sm:py-3 rounded-lg flex-1 sm:flex-initial"
              >
                <X size={16} />
                <span>Batal</span>
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm py-2 sm:py-3 rounded-lg flex-1 sm:flex-initial"
              >
                <Save size={16} />
                <span>Simpan</span>
              </Button>
            </div>
          </div>
        )}

        {dataKepsekList.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-slate-500">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base font-medium">Belum ada data Kepala Sekolah</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Klik tombol Tambah untuk menambahkan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dataKepsekList.map((kepsek) => (
              <div key={kepsek.id} className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900 truncate">{kepsek.nama}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 truncate">{kepsek.email}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(kepsek)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs sm:text-sm"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(kepsek.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition text-xs sm:text-sm"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded p-2 border border-slate-100">
                      <p className="text-slate-600">NIP</p>
                      <p className="text-slate-900 font-medium">{kepsek.nip || '-'}</p>
                    </div>
                    <div className="bg-white rounded p-2 border border-slate-100">
                      <p className="text-slate-600">No. HP</p>
                      <p className="text-slate-900 font-medium">{kepsek.noHP || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PengaturanKepsekTab;
