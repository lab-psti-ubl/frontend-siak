import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, LogIn } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useTahunAjaran } from '../hooks/useTahunAjaran';
import { apiService } from '../services/apiService';
import { CBTUjian } from '../types';

function isUjianDapatDiikutiSekarang(ujian: CBTUjian): boolean {
  const now = new Date();
  const start = new Date(`${ujian.tanggalMulai}T${ujian.jamMulai || '00:00'}:00`);
  const end = new Date(`${ujian.tanggalSelesai}T${ujian.jamSelesai || '23:59'}:59`);
  const autoPublishThreshold = new Date(start.getTime() - 5 * 60 * 1000);
  const isEffectivelyPublished = ujian.isPublished || now >= autoPublishThreshold;

  return isEffectivelyPublished && now >= start && now <= end;
}

const UjianCBTAksesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { nisnMurid } = useParams<{ nisnMurid?: string }>();
  const { user, login, isLoading } = useAuth();
  const { tahunAjaran } = useTahunAjaran();
  const activeTahunAjaran = useMemo(() => tahunAjaran.find((ta) => ta.isActive), [tahunAjaran]);

  const [nisnInput, setNisnInput] = useState(nisnMurid || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resolvingExam, setResolvingExam] = useState(false);
  const [nowText, setNowText] = useState('');
  const [hasPassedCbtLogin, setHasPassedCbtLogin] = useState(false);

  const currentMurid = user && user.role === 'murid' ? (user as any) : null;
  const hasNisnRoute = Boolean(nisnMurid);
  const isSessionMatched = !hasNisnRoute || (currentMurid?.nisn === nisnMurid);

  useEffect(() => {
    if (!nisnMurid) return;
    setNisnInput(nisnMurid);
  }, [nisnMurid]);

  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      setNowText(
        now.toLocaleString('id-ID', {
          weekday: 'long',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateNow();
    const id = setInterval(updateNow, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const resolveActiveExam = async () => {
      if (!hasPassedCbtLogin || !currentMurid || !activeTahunAjaran) {
        return;
      }

      try {
        setResolvingExam(true);
        setError('');

        const preferredUjianId = searchParams.get('ujianId');
        let selectedExam: CBTUjian | null = null;

        if (preferredUjianId) {
          const ujianById = await apiService.getCBTUjianById(preferredUjianId);
          if (ujianById.success && ujianById.data) {
            const exam = ujianById.data as CBTUjian;
            if (exam.kelasId === currentMurid.kelasId && isUjianDapatDiikutiSekarang(exam)) {
              selectedExam = exam;
            }
          }
        }

        if (!selectedExam) {
          const listRes = await apiService.getAllCBTUjian({
            kelasId: currentMurid.kelasId,
            tahunAjaran: activeTahunAjaran.tahun,
            semester: activeTahunAjaran.semester,
          });

          if (!listRes.success || !listRes.data) {
            throw new Error(listRes.message || 'Data ujian CBT tidak dapat dimuat.');
          }

          const availableNow = (listRes.data as CBTUjian[])
            .filter(isUjianDapatDiikutiSekarang)
            .sort((a, b) => {
              const aStart = new Date(`${a.tanggalMulai}T${a.jamMulai || '00:00'}:00`).getTime();
              const bStart = new Date(`${b.tanggalMulai}T${b.jamMulai || '00:00'}:00`).getTime();
              return bStart - aStart;
            });

          selectedExam = availableNow[0] || null;
        }

        if (!selectedExam) {
          throw new Error('Belum ada ujian CBT yang aktif pada jam ini.');
        }

        const targetNisn = currentMurid.nisn || nisnMurid;
        if (!targetNisn) {
          throw new Error('Data NISN murid tidak ditemukan.');
        }

        navigate(
          `/ujian-cbt/${encodeURIComponent(targetNisn)}/kerjakan/${encodeURIComponent(selectedExam.id)}`,
          { replace: true }
        );
      } catch (err: any) {
        setError(err?.message || 'Terjadi kesalahan saat memproses akses ujian.');
      } finally {
        setResolvingExam(false);
      }
    };

    resolveActiveExam();
  }, [activeTahunAjaran, currentMurid, hasPassedCbtLogin, navigate, nisnMurid, searchParams]);

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nisnInput.trim() || !password.trim()) {
      setError('NISN dan password wajib diisi.');
      return;
    }

    const result = await login(nisnInput.trim(), password);
    if (!result.success) {
      setError(result.message || 'NISN atau password salah.');
      return;
    }

    try {
      const storedUser = localStorage.getItem('currentUser');
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      if (!parsed || parsed.role !== 'murid' || !parsed.nisn) {
        setError('Akun ini bukan akun murid.');
        return;
      }
      try {
        sessionStorage.setItem('cbt_lock', '1');
      } catch {
        // ignore storage errors
      }
      setHasPassedCbtLogin(true);
    } catch {
      setError('Terjadi kesalahan saat membaca sesi login.');
    }
  };

  const shouldShowLogin = !hasPassedCbtLogin;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {shouldShowLogin ? (
          <Card className="p-6 sm:p-8 shadow-xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Akses Ujian CBT</h1>
              <p className="text-sm text-slate-600 mt-1">
                Masukkan NISN dan password murid untuk memulai ujian CBT pada jam yang sudah dijadwalkan.
              </p>
              {nowText && (
                <p className="text-xs text-slate-500 mt-2">
                  Waktu saat ini: <span className="font-semibold">{nowText}</span>
                </p>
              )}
            </div>

            {hasNisnRoute && !isSessionMatched && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm px-4 py-3">
                Anda harus login terlebih dahulu menggunakan akun murid yang sesuai untuk mengakses ujian CBT.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">NISN</label>
                <input
                  type="text"
                  value={nisnInput}
                  onChange={(e) => setNisnInput(e.target.value)}
                  readOnly={hasNisnRoute}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                  placeholder="Masukkan NISN"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan password"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                className="w-full h-11 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Mulai Ujian
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="p-8 sm:p-10 text-center shadow-xl">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900">Memproses Akses Ujian</h2>
            <p className="text-sm text-slate-600 mt-2">
              {resolvingExam
                ? 'Mencari ujian CBT yang aktif pada jam saat ini...'
                : 'Menyiapkan halaman ujian...'}
            </p>

            {error && (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm px-4 py-3 inline-flex items-start gap-3 text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    {error.includes('Belum ada ujian CBT yang aktif')
                      ? 'Saat ini belum ada ujian CBT yang bisa diikuti.'
                      : 'Tidak dapat membuka halaman ujian.'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {error.includes('Belum ada ujian CBT yang aktif')
                      ? 'Silakan cek kembali pada jam ujian yang sudah ditentukan oleh guru. Jika merasa seharusnya sudah ada ujian, hubungi wali kelas atau guru mata pelajaran.'
                      : error}
                  </p>
                  {nowText && (
                    <p className="text-xs text-slate-500">
                      Waktu saat ini: <span className="font-semibold">{nowText}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default UjianCBTAksesPage;
