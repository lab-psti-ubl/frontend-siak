import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldOff, KeyRound, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import Button from '../components/ui/Button';
import { showConfirmation } from '../utils/confirmationUtils';
import { clearPengaturanCache } from '../hooks/usePengaturanSistem';

interface ActivationInfo {
  id: string;
  isSystemActive: boolean;
  activationCodeMasked?: string;
  activatedAt?: string;
  activatedBy?: string;
  createdAt?: string;
}

const AktivasiIscholaPage: React.FC = () => {
  const navigate = useNavigate();
  const [activation, setActivation] = useState<ActivationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [codeForm, setCodeForm] = useState({ currentCode: '', newCode: '', confirmNewCode: '' });
  const [updatingCode, setUpdatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [footerCompanyName, setFooterCompanyName] = useState<string>('iSchola - Garnusa Studio Technologi');
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerMessage, setFooterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cbtEnabled, setCbtEnabled] = useState<boolean>(true);
  const [spmbEnabled, setSpmbEnabled] = useState<boolean>(true);
  const [cbtSaving, setCbtSaving] = useState(false);
  const [spmbSaving, setSpmbSaving] = useState(false);
  const [cbtMessage, setCbtMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [spmbMessage, setSpmbMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchActivation = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getSystemActivationPublic();
      if (res.success && res.activation) {
        setActivation(res.activation);
      } else {
        setError(res.message || 'Gagal memuat status aktivasi');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivation();
    // Ambil pengaturan footer secara publik (tanpa login)
    (async () => {
      try {
        const res = await apiService.getFooterSettingsPublic();
        if (res.success && res.footerCompanyName) {
          setFooterCompanyName(res.footerCompanyName);
        }
      } catch {
        // Abaikan error, gunakan default
      }
      // Ambil pengaturan CBT & SPMB secara publik (tanpa login, seperti footer)
      try {
        const res = await apiService.getCbtSpmbSettingsPublic();
        if (res.success) {
          setCbtEnabled(res.cbtEnabled ?? true);
          setSpmbEnabled(res.spmbEnabled ?? true);
        }
      } catch {
        // Abaikan error, gunakan default (true)
      }
    })();
  }, []);

  const handleDeactivate = () => {
    showConfirmation(
      'Nonaktifkan Sistem',
      'Sistem akan dinonaktifkan. Hanya admin yang dapat login hingga sistem diaktifkan kembali dengan kode aktivasi. Lanjutkan?',
      async () => {
        setDeactivating(true);
        setError('');
        setSuccessMsg('');
        try {
          const res = await apiService.deactivateSystem();
          if (res.success) {
            setSuccessMsg('Sistem berhasil dinonaktifkan.');
            if (res.activation) setActivation(res.activation);
          } else {
            setError(res.message || 'Gagal menonaktifkan sistem');
          }
        } catch (err: any) {
          setError(err.message || 'Terjadi kesalahan');
        } finally {
          setDeactivating(false);
        }
      },
      { type: 'warning', confirmText: 'Nonaktifkan', cancelText: 'Batal' }
    );
  };

  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    if (codeForm.newCode !== codeForm.confirmNewCode) {
      setCodeError('Kode baru dan konfirmasi tidak sama');
      return;
    }
    if (codeForm.newCode.length < 3) {
      setCodeError('Kode aktivasi baru minimal 3 karakter');
      return;
    }
    setUpdatingCode(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiService.updateActivationCode(codeForm.currentCode, codeForm.newCode);
      if (res.success) {
        setSuccessMsg('Kode aktivasi berhasil diubah.');
        setCodeForm({ currentCode: '', newCode: '', confirmNewCode: '' });
        if (res.activation) setActivation(res.activation);
      } else {
        setCodeError(res.message || 'Gagal mengubah kode');
      }
    } catch (err: any) {
      setCodeError(err.message || 'Terjadi kesalahan');
    } finally {
      setUpdatingCode(false);
    }
  };

  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setFooterMessage(null);

    const trimmed = footerCompanyName.trim();
    if (!trimmed) {
      setFooterMessage({
        type: 'error',
        text: 'Nama perusahaan footer tidak boleh kosong',
      });
      return;
    }

    setFooterSaving(true);
    try {
      const res = await apiService.updateFooterSettingsPublic(trimmed);
      if (res.success) {
        setFooterMessage({
          type: 'success',
          text: 'Nama perusahaan di footer berhasil disimpan.',
        });
        if (res.footerCompanyName) {
          setFooterCompanyName(res.footerCompanyName);
        }
      } else {
        setFooterMessage({
          type: 'error',
          text: res.message || 'Gagal menyimpan pengaturan footer.',
        });
      }
    } catch (err: any) {
      setFooterMessage({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan saat menyimpan pengaturan footer.',
      });
    } finally {
      setFooterSaving(false);
    }
  };

  const handleToggleCbt = async () => {
    setCbtMessage(null);
    setCbtSaving(true);
    try {
      const newValue = !cbtEnabled;
      const res = await apiService.updateCbtSpmbSettingsPublic({ cbtEnabled: newValue });
      if (!res.success) {
        throw new Error(res.message || 'Gagal menyimpan pengaturan CBT');
      }
      setCbtEnabled(newValue);
      clearPengaturanCache();
      setCbtMessage({
        type: 'success',
        text: newValue
          ? 'Modul CBT diaktifkan. Menu CBT akan tampil di sidebar dan kartu menu.'
          : 'Modul CBT dinonaktifkan. Semua menu CBT akan disembunyikan.',
      });
    } catch (err: any) {
      setCbtMessage({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan saat menyimpan pengaturan CBT.',
      });
    } finally {
      setCbtSaving(false);
    }
  };

  const handleToggleSpmb = async () => {
    setSpmbMessage(null);
    setSpmbSaving(true);
    try {
      const newValue = !spmbEnabled;
      const res = await apiService.updateCbtSpmbSettingsPublic({ spmbEnabled: newValue });
      if (!res.success) {
        throw new Error(res.message || 'Gagal menyimpan pengaturan SPMB');
      }
      setSpmbEnabled(newValue);
      clearPengaturanCache();
      setSpmbMessage({
        type: 'success',
        text: newValue
          ? 'Modul SPMB diaktifkan. Menu SPMB akan tampil di sidebar dan kartu menu.'
          : 'Modul SPMB dinonaktifkan. Semua menu SPMB akan disembunyikan.',
      });
    } catch (err: any) {
      setSpmbMessage({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan saat menyimpan pengaturan SPMB.',
      });
    } finally {
      setSpmbSaving(false);
    }
  };

  const formatDate = (str?: string) => {
    if (!str) return '-';
    try {
      const d = new Date(str);
      return d.toLocaleString('id-ID');
    } catch {
      return str;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              Aktivasi iSchola
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola status aktivasi sistem dan kode aktivasi
            </p>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                    <p className="text-sm text-emerald-800">{successMsg}</p>
                  </div>
                )}

                {/* Status aktivasi */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">Status Aktivasi</h2>
                  <div className="flex items-center gap-3 mb-3">
                    {activation?.isSystemActive ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Sistem Aktif</p>
                          <p className="text-sm text-gray-500">
                            Diaktifkan pada {formatDate(activation?.activatedAt)} oleh {activation?.activatedBy || '-'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <ShieldOff className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Sistem Tidak Aktif</p>
                          <p className="text-sm text-gray-500">
                            Masukkan kode aktivasi saat login admin untuk mengaktifkan
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {activation?.activationCodeMasked && (
                    <p className="text-sm text-gray-500">
                      Kode aktivasi saat ini: <span className="font-mono font-medium text-gray-700">{activation.activationCodeMasked}</span>
                    </p>
                  )}
                </div>

                {/* Tombol nonaktifkan */}
                {activation?.isSystemActive && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Nonaktifkan Sistem</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Menonaktifkan sistem akan mengunci akses admin hingga diaktifkan kembali dengan kode aktivasi.
                    </p>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDeactivate}
                      loading={deactivating}
                      disabled={deactivating}
                    >
                      Nonaktifkan Aktivasi
                    </Button>
                  </div>
                )}

                {/* Ubah kode aktivasi */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Ubah Kode Aktivasi
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Masukkan kode saat ini dan kode baru. Kode baru minimal 3 karakter.
                  </p>
                  <form onSubmit={handleUpdateCode} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kode aktivasi saat ini</label>
                      <input
                        type="password"
                        value={codeForm.currentCode}
                        onChange={(e) => setCodeForm((f) => ({ ...f, currentCode: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan kode saat ini"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kode aktivasi baru</label>
                      <input
                        type="password"
                        value={codeForm.newCode}
                        onChange={(e) => setCodeForm((f) => ({ ...f, newCode: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Min. 3 karakter"
                        minLength={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi kode baru</label>
                      <input
                        type="password"
                        value={codeForm.confirmNewCode}
                        onChange={(e) => setCodeForm((f) => ({ ...f, confirmNewCode: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ulangi kode baru"
                        minLength={3}
                        required
                      />
                    </div>
                    {codeError && (
                      <p className="text-sm text-red-600">{codeError}</p>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      loading={updatingCode}
                      disabled={updatingCode}
                    >
                      Simpan Kode Baru
                    </Button>
                  </form>
                </div>

                {/* Pengaturan footer aplikasi */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">
                    Pengaturan Footer Aplikasi
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Atur nama perusahaan yang ditampilkan pada footer aplikasi. Pengubahan dapat dilakukan tanpa login.
                  </p>
                  <form onSubmit={handleSaveFooter} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama perusahaan di footer
                      </label>
                      <input
                        type="text"
                        value={footerCompanyName}
                        onChange={(e) => setFooterCompanyName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Mis. iSchola - Garnusa Studio Technologi"
                      />
                    </div>
                    {footerMessage && (
                      <p
                        className={`text-sm ${
                          footerMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {footerMessage.text}
                      </p>
                    )}
                    <Button
                      type="submit"
                      variant="secondary"
                      loading={footerSaving}
                      disabled={footerSaving}
                    >
                      Simpan Footer
                    </Button>
                  </form>
                </div>

                {/* Pengaturan modul CBT & SPMB */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">
                    Pengaturan Modul CBT &amp; SPMB
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Atur apakah menu CBT (admin, guru, murid) dan menu SPMB (admin) ditampilkan di sidebar dan kartu menu.
                  </p>

                  {/* CBT */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Tampilkan semua menu CBT
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Mengatur visibilitas seluruh menu CBT di halaman admin, guru, dan murid.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleCbt}
                      disabled={cbtSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        cbtEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                      } ${cbtSaving ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          cbtEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {cbtMessage && (
                    <p
                      className={`mb-4 text-sm ${
                        cbtMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {cbtMessage.text}
                    </p>
                  )}

                  {/* SPMB */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Tampilkan semua menu SPMB
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Mengatur visibilitas seluruh menu SPMB di halaman admin.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSpmb}
                      disabled={spmbSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        spmbEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                      } ${spmbSaving ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          spmbEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {spmbMessage && (
                    <p
                      className={`mt-3 text-sm ${
                        spmbMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {spmbMessage.text}
                    </p>
                  )}
                </div>

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AktivasiIscholaPage;
