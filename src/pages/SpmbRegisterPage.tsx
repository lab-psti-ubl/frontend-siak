import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { apiService } from '../services/apiService';
import { SpmbOpening } from '../types';
import { showErrorToast, showSuccessToast } from '../components/ui/ToastContainer';

const SpmbRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    namaLengkap: '',
    nisn: '',
    jenisKelamin: '' as '' | 'L' | 'P',
    asalSekolah: '',
    tempatLahir: '',
    tanggalLahir: '',
    kategoriPendaftar: '' as '' | 'zonasi' | 'prestasi' | 'afirmasi' | 'perpindahan',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState<SpmbOpening | null>(null);
  const [loadingOpening, setLoadingOpening] = useState(true);

  useEffect(() => {
    const loadOpening = async () => {
      try {
        setLoadingOpening(true);
        const res = await apiService.getActiveSpmbOpeningPublic();
        if (res.success && res.opening) {
          setOpening(res.opening as SpmbOpening);
        } else {
          setOpening(null);
        }
      } catch (err) {
        console.error('Gagal memuat informasi pembukaan SPMB:', err);
        setOpening(null);
      } finally {
        setLoadingOpening(false);
      }
    };
    loadOpening();
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.namaLengkap || !form.nisn || !form.jenisKelamin || !form.asalSekolah ||
        !form.tempatLahir || !form.tanggalLahir || !form.kategoriPendaftar ||
        !form.email || !form.password) {
      showErrorToast('Error', 'Semua field wajib diisi.');
      return;
    }

    if (form.password.length < 6) {
      showErrorToast('Error', 'Password minimal 6 karakter');
      return;
    }
    if (form.password !== form.confirmPassword) {
      showErrorToast('Error', 'Konfirmasi password tidak sama');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.spmbRegister({
        namaLengkap: form.namaLengkap,
        nisn: form.nisn,
        jenisKelamin: form.jenisKelamin as 'L' | 'P',
        asalSekolah: form.asalSekolah,
        tempatLahir: form.tempatLahir,
        tanggalLahir: form.tanggalLahir,
        kategoriPendaftar: form.kategoriPendaftar as any,
        email: form.email,
        password: form.password,
      });

      if (!res.success || !res.token || !res.user) {
        showErrorToast('Error', res.message || 'Gagal registrasi akun SPMB');
        return;
      }

      localStorage.setItem('spmbToken', res.token);
      localStorage.setItem('spmbUser', JSON.stringify(res.user));
      showSuccessToast('Berhasil', 'Akun SPMB berhasil dibuat');
      navigate('/spmb/dashboard', { replace: true });
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOpening) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-xl p-6 text-center">
          <p className="text-sm text-gray-600">Memuat informasi pembukaan SPMB...</p>
        </Card>
      </div>
    );
  }

  if (!opening) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-xl p-6 space-y-3 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Pendaftaran SPMB Belum Dibuka</h1>
          <p className="text-sm text-gray-600">
            Saat ini belum ada pembukaan SPMB yang aktif. Silakan cek kembali sesuai informasi resmi
            dari sekolah sebelum melakukan registrasi akun.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">Registrasi Peserta SPMB</h1>
          <p className="text-sm text-gray-600">
            Buat akun untuk mengisi formulir SPMB dan melihat status pendaftaran.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.namaLengkap}
                onChange={e => handleChange('namaLengkap', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.nisn}
                onChange={e => handleChange('nisn', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.jenisKelamin}
                onChange={e => handleChange('jenisKelamin', e.target.value)}
                required
              >
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.asalSekolah}
                onChange={e => handleChange('asalSekolah', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.tempatLahir}
                onChange={e => handleChange('tempatLahir', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.tanggalLahir}
                onChange={e => handleChange('tanggalLahir', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Pendaftar</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.kategoriPendaftar}
                onChange={e => handleChange('kategoriPendaftar', e.target.value)}
                required
              >
                <option value="">Pilih</option>
                <option value="zonasi">Zonasi</option>
                <option value="prestasi">Prestasi</option>
                <option value="afirmasi">Afirmasi</option>
                <option value="perpindahan">Perpindahan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.confirmPassword}
                onChange={e => handleChange('confirmPassword', e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            className="justify-center"
          >
            {loading ? 'Mendaftar...' : 'Daftar'}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-600">
          Sudah punya akun?{' '}
          <Link to="/spmb" className="text-blue-600 font-medium">
            Masuk di sini
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default SpmbRegisterPage;

