import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { apiService } from '../services/apiService';
import { SpmbOpening } from '../types';
import { showErrorToast, showSuccessToast } from '../components/ui/ToastContainer';

const SpmbLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiService.spmbLogin({ email, password });
      if (!res.success || !res.token || !res.user) {
        showErrorToast('Error', res.message || 'Email atau password salah');
        return;
      }
      localStorage.setItem('spmbToken', res.token);
      localStorage.setItem('spmbUser', JSON.stringify(res.user));
      showSuccessToast('Berhasil', 'Login SPMB berhasil');
      navigate('/spmb/dashboard', { replace: true });
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOpening) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md p-6 text-center">
          <p className="text-sm text-gray-600">Memuat informasi pembukaan SPMB...</p>
        </Card>
      </div>
    );
  }

  if (!opening) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md p-6 space-y-3 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Pendaftaran SPMB Belum Dibuka</h1>
          <p className="text-sm text-gray-600">
            Saat ini belum ada pembukaan SPMB yang aktif. Silakan cek kembali sesuai informasi resmi
            dari sekolah.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">Login Peserta SPMB</h1>
          <p className="text-sm text-gray-600">
            Masuk menggunakan email dan password akun pendaftar SPMB Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            className="justify-center"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-600">
          Belum punya akun?{' '}
          <Link to="/spmb/register" className="text-blue-600 font-medium">
            Daftar di sini
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default SpmbLoginPage;

