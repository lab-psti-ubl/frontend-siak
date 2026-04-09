import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, FileText, Info, CheckCircle, School } from 'lucide-react';
import { apiService } from '../../services/apiService';
import SpmbRegistrationPage from '../SpmbRegistrationPage';
import { useProfilSekolahPublic } from '../../hooks/useProfilSekolahPublic';

const SpmbDashboardHome: React.FC = () => {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('spmbUser');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUserName(parsed.namaLengkap || parsed.name || '');
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard Peserta SPMB</h1>
      {userName && <p className="text-gray-700 text-sm">Selamat datang, {userName}.</p>}
      <p className="text-gray-600 text-sm">
        Silakan lengkapi formulir pendaftaran pada menu <strong>Form Pendaftaran</strong> dan
        pantau hasil seleksi di menu <strong>Pengumuman</strong>.
      </p>
    </div>
  );
};

const SpmbDetailPendaftaran: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any | null>(null);
  const { profilSekolah } = useProfilSekolahPublic();

  useEffect(() => {
    const load = async () => {
      try {
        const [regRes, userRes] = await Promise.all([
          apiService.getMySpmbRegistration(),
          apiService.getSpmbCurrentUser(),
        ]);

        if (!regRes.success) {
          setError(regRes.message || 'Gagal mengambil data pendaftaran.');
        }
        setRegistration(regRes.registration || null);

        if (userRes.success && userRes.user) {
          setAccountData(userRes.user);
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data pendaftaran.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="text-gray-600 text-sm">Memuat detail pendaftaran...</div>;
  }

  if (!registration) {
    return (
      <div className="space-y-2">
        <p className="text-gray-600 text-sm">
          {error ||
            'Belum ada data pendaftaran yang tersimpan. Silakan isi Form Pendaftaran terlebih dahulu.'}
        </p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  // Fallback: jika beberapa field kosong di registration, pakai data dari akun SPMB
  const tempatLahir =
    registration.tempatLahir || accountData?.tempatLahir || '';
  const tanggalLahir =
    registration.tanggalLahir || accountData?.tanggalLahir || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Detail Formulir Pendaftaran</h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            Periksa kembali data pendaftaran Anda. Anda dapat mengunduh / mencetak formulir ini.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          Download / Cetak Formulir
        </button>
      </div>

      {/* Formulir versi cetak – struktur mirip Form Pendaftaran */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-sm space-y-6">
        {/* Header sekolah & judul (sama gaya dengan form pendaftaran) */}
        <div className="flex items-center space-x-4 border-b border-gray-200 pb-4 mb-2">
          {profilSekolah?.logoSekolah ? (
            <img
              src={profilSekolah.logoSekolah}
              alt={profilSekolah.namaSekolah || 'Logo sekolah'}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
            />
          ) : (
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500">
              <School className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1">
            {profilSekolah?.namaSekolah && (
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-blue-700 mb-0.5">
                {profilSekolah.namaSekolah}
              </p>
            )}
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Formulir Pendaftaran SPMB
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Sistem Penerimaan Murid Baru (SPMB)
              {registration.tahunAjaran ? ` • Tahun Ajaran ${registration.tahunAjaran}` : ''}
            </p>
          </div>
        </div>

        {/* 1. Data Calon Murid */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">A. Data Calon Murid</h3>
          <table className="w-full text-xs border border-gray-200">
            <tbody>
              <tr>
                <td className="w-1/3 border border-gray-200 px-2 py-1.5 align-top">Nama Lengkap</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.namaLengkap || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">NISN</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.nisn || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">Jenis Kelamin</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.jenisKelamin === 'L'
                    ? 'Laki-laki'
                    : registration.jenisKelamin === 'P'
                      ? 'Perempuan'
                      : '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">Tempat, Tanggal Lahir</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {(tempatLahir || '-') + ', ' + (tanggalLahir || '-')}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">Asal Sekolah</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.asalSekolah || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">Alamat Lengkap</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top whitespace-pre-line">
                  {registration.alamat || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">Kategori Pendaftar</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.kategoriPendaftar
                    ? registration.kategoriPendaftar.charAt(0).toUpperCase() +
                      registration.kategoriPendaftar.slice(1)
                    : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Data Orang Tua / Wali */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">B. Data Orang Tua / Wali</h3>
          <table className="w-full text-xs border border-gray-200">
            <tbody>
              <tr>
                <td className="w-1/3 border border-gray-200 px-2 py-1.5 align-top">
                  Nama Orang Tua / Wali
                </td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.namaOrangTua || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">NIK Orang Tua / Wali</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.nikOrangTua || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">Pekerjaan</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.pekerjaanOrangTua || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  No. WhatsApp Orang Tua / Wali
                </td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.noWhatsappOrtu || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">No. HP Tambahan</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.noHpOrangTua || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1.5 align-top">Email</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  {registration.email || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Dokumen Pendukung dengan checkbox */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">C. Dokumen Pendukung</h3>
          <table className="w-full text-xs border border-gray-200">
            <tbody>
              {[
                ['Kartu Keluarga (KK)', registration.dokumenKk],
                ['Akta Kelahiran', registration.dokumenAktaKelahiran],
                ['KTP Orang Tua / Wali', registration.dokumenKtpOrangTua],
                ['Kartu Imunisasi', registration.dokumenKartuImunisasi],
                ['Pas Foto', registration.dokumenPasFoto],
                ['Ijazah / SKL', registration.dokumenIjazahAtauSkL],
                ['Rapor', registration.dokumenRapor],
                ['Kartu Indonesia Pintar (KIP)', registration.dokumenKip],
                ['Sertifikat Prestasi', registration.dokumenSertifikatPrestasi],
                ['Surat Keterangan Sehat', registration.dokumenSuratKeteranganSehat],
              ].map(([label, value]) => (
                <tr key={label as string}>
                  <td className="w-2/3 border border-gray-200 px-2 py-1.5 align-middle">
                    {label}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 align-middle text-center">
                    <input type="checkbox" checked={!!value} readOnly className="w-3 h-3" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-500">
            Catatan: Checkbox tercentang menandakan dokumen sudah diunggah melalui sistem.
          </p>
        </div>
      </div>
    </div>
  );
};

const SpmbPengumuman: React.FC = () => {
  const [status, setStatus] = useState<'pending' | 'diterima' | 'ditolak' | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getMySpmbRegistration();
        if (!res.success) {
          setMessage(res.message || 'Gagal mengambil status pendaftaran.');
          return;
        }
        if (res.registration) {
          setStatus(res.registration.status as 'pending' | 'diterima' | 'ditolak');
        } else {
          setMessage('Belum ada pendaftaran yang tersimpan.');
        }
      } catch (err: any) {
        setMessage(err.message || 'Terjadi kesalahan saat mengambil status pendaftaran.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-gray-900">Pengumuman SPMB</h1>
      {loading && <p className="text-gray-600 text-sm">Memuat status pendaftaran...</p>}
      {!loading && message && (
        <p className="text-gray-600 text-sm">
          {message}
        </p>
      )}
      {!loading && !message && status === null && (
        <p className="text-gray-600 text-sm">
          Status pengumuman belum tersedia. Silakan cek kembali setelah proses seleksi selesai.
        </p>
      )}
      {status === 'pending' && (
        <p className="text-gray-600 text-sm">
          Pendaftaran Anda masih dalam proses verifikasi. Silakan menunggu pengumuman resmi.
        </p>
      )}
      {status === 'diterima' && (
        <div className="flex items-start gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
          <CheckCircle className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-semibold">Selamat!</p>
            <p>Anda dinyatakan <strong>DITERIMA</strong> melalui jalur SPMB.</p>
          </div>
        </div>
      )}
      {status === 'ditolak' && (
        <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
          <Info className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-semibold">Mohon maaf,</p>
            <p>Anda dinyatakan <strong>TIDAK DITERIMA</strong> pada seleksi SPMB kali ini.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const SpmbDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('spmbToken') : null;

  useEffect(() => {
    if (!token) {
      navigate('/spmb', { replace: true });
    }
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/spmb" replace />;
  }

  const currentPath = location.pathname.replace('/spmb/dashboard', '') || '/';

  return (
    <div className="flex bg-gray-50 min-h-screen print:bg-white">
      {/* Sidebar gaya mirip dashboard utama */}
      <div
        className={`
        w-96 max-w-[28rem] bg-white shadow-lg h-screen fixed left 0 top-0 z-30
        flex flex-col print:hidden
      `}
      >
        <div className="flex items-start justify-between p-3 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-md sm:text-lg font-bold text-gray-800 leading-snug">
              Portal Peserta SPMB
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Dashboard • Formulir • Pengumuman
            </p>
          </div>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto min-h-0">
          <ul className="space-y-2 text-sm">
            <li>
              <button
                onClick={() => navigate('/spmb/dashboard')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  currentPath === '/'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Home size={20} />
                  <span className="font-medium">Dashboard</span>
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/spmb/dashboard/form')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  currentPath.startsWith('/form')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText size={20} />
                  <span className="font-medium">Form Pendaftaran</span>
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/spmb/dashboard/detail')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  currentPath.startsWith('/detail')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Info size={20} />
                  <span className="font-medium">Detail Pendaftaran</span>
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/spmb/dashboard/pengumuman')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  currentPath.startsWith('/pengumuman')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle size={20} />
                  <span className="font-medium">Pengumuman</span>
                </div>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 mt-auto flex-shrink-0">
          <button
            onClick={() => {
              localStorage.removeItem('spmbToken');
              localStorage.removeItem('spmbUser');
              navigate('/spmb', { replace: true });
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content mengikuti offset sidebar seperti dashboard lain */}
      <div className="flex-1 flex flex-col lg:ml-96 min-w-0 h-screen main-content-scroll print:ml-0">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-4">
          <Routes>
            <Route path="/" element={<SpmbDashboardHome />} />
            <Route path="/form" element={<SpmbRegistrationPage />} />
            <Route path="/detail" element={<SpmbDetailPendaftaran />} />
            <Route path="/pengumuman" element={<SpmbPengumuman />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default SpmbDashboardLayout;

