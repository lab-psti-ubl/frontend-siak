import React, { useEffect, useState } from 'react';
import { Calendar, Check, CheckCircle, School } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Jurusan, SpmbOpening } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { showErrorToast, showSuccessToast } from '../components/ui/ToastContainer';
import { getActiveJenjang, getActiveJenjangSync } from '../utils/jenjangPendidikanUtils';
import { useProfilSekolahPublic } from '../hooks/useProfilSekolahPublic';

const SpmbRegistrationPage: React.FC = () => {
  const [opening, setOpening] = useState<SpmbOpening | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [jenjang, setJenjang] = useState<'SD' | 'SMP' | 'SMA/SMK' | null>(() => getActiveJenjangSync());
  const [jurusanOptions, setJurusanOptions] = useState<Jurusan[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<0 | 1 | 2 | 3>(0);
  const [formData, setFormData] = useState({
    namaLengkap: '',
    jenisKelamin: '' as '' | 'L' | 'P',
    umur: '',
    nikAnak: '',
    nisn: '',
    kategoriPendaftar: '',
    email: '',
    noWhatsappOrtu: '',
    nomorKk: '',
    tempatLahir: '',
    tanggalLahir: '',
    asalSekolah: '',
    alamat: '',
    namaOrangTua: '',
    nikOrangTua: '',
    pekerjaanOrangTua: '',
    noHpOrangTua: '',
    ringkasanNilaiRapor: '',
    pilihanJurusan: '',
    dokumenKk: '',
    dokumenAktaKelahiran: '',
    dokumenKtpOrangTua: '',
    dokumenKartuImunisasi: '',
    dokumenPasFoto: '',
    dokumenIjazahAtauSkL: '',
    dokumenRapor: '',
    dokumenKip: '',
    dokumenSertifikatPrestasi: '',
    dokumenSuratKeteranganSehat: '',
  });

  const [isSpmbPortal, setIsSpmbPortal] = useState(false);

  const { profilSekolah } = useProfilSekolahPublic();

  const calculateAgeFromDate = (birthDateStr: string): string => {
    if (!birthDateStr) return '';
    const birthDate = new Date(birthDateStr);
    if (Number.isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? String(age) : '';
  };

  const canProceedCurrentStep = (): boolean => {
    if (currentStep === 1) {
      if (!formData.namaLengkap.trim()) {
        showErrorToast('Error', 'Nama lengkap calon murid wajib diisi');
        return false;
      }
      if (!formData.noWhatsappOrtu.trim()) {
        showErrorToast('Error', 'WhatsApp orang tua/wali wajib diisi');
        return false;
      }
      if (!formData.asalSekolah.trim()) {
        showErrorToast('Error', 'Asal sekolah wajib diisi');
        return false;
      }
      if (!formData.alamat.trim()) {
        showErrorToast('Error', 'Alamat lengkap rumah wajib diisi');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (!canProceedCurrentStep()) return;
    setCurrentStep(prev => {
      const next = prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev;
      setMaxCompletedStep(done => (done < prev ? (prev as 1 | 2 | 3) : done));
      return next;
    });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof formData,
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormData(prev => ({ ...prev, [field]: result }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const loadOpening = async () => {
      try {
        setLoading(true);
        const res = await apiService.getActiveSpmbOpeningPublic();
        if (res.success && res.opening) {
          setOpening(res.opening as SpmbOpening);
        } else {
          setOpening(null);
        }
      } catch (err) {
        console.error(err);
        setOpening(null);
      } finally {
        setLoading(false);
      }
    };

    loadOpening();
  }, []);

  // Jika diakses dari portal peserta SPMB (memiliki spmbToken), prefilling data dari akun dan kunci field utama
  useEffect(() => {
    const preloadFromSpmbAccount = async () => {
      try {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('spmbToken') : null;
        if (!token) return;

        const res = await apiService.getSpmbCurrentUser();
        if (res.success && res.user) {
          const u = res.user as any;
          setFormData(prev => ({
            ...prev,
            namaLengkap: u.namaLengkap || prev.namaLengkap,
            nisn: u.nisn || prev.nisn,
            jenisKelamin: (u.jenisKelamin as '' | 'L' | 'P') || prev.jenisKelamin,
            asalSekolah: u.asalSekolah || prev.asalSekolah,
            tempatLahir: u.tempatLahir || prev.tempatLahir,
            tanggalLahir: u.tanggalLahir || prev.tanggalLahir,
            kategoriPendaftar: u.kategoriPendaftar || prev.kategoriPendaftar,
            email: u.email || prev.email,
          }));
          setIsSpmbPortal(true);
        }
      } catch (err) {
        console.error('Gagal preload data dari akun SPMB:', err);
      }
    };

    preloadFromSpmbAccount();
  }, []);

  // Ambil jenjang pendidikan dari konfigurasi (menggunakan cache/localStorage)
  useEffect(() => {
    const loadJenjang = async () => {
      try {
        const activeJenjang = await getActiveJenjang();
        if (activeJenjang) {
          setJenjang(activeJenjang);
        }
      } catch (err) {
        console.error('Gagal memuat jenjang pendidikan untuk SPMB:', err);
      }
    };

    if (!jenjang) {
      loadJenjang();
    }
  }, [jenjang]);

  // Jika jenjang adalah SMA/SMK, ambil daftar jurusan dari server
  useEffect(() => {
    const loadJurusan = async () => {
      if (jenjang !== 'SMA/SMK') {
        setJurusanOptions([]);
        setFormData(prev => ({ ...prev, pilihanJurusan: '' }));
        return;
      }

      try {
        const res = await apiService.getAllJurusan();
        if (res.success && res.jurusan) {
          setJurusanOptions(res.jurusan as Jurusan[]);
        } else {
          setJurusanOptions([]);
        }
      } catch (err) {
        console.error('Gagal memuat jurusan untuk SPMB:', err);
        setJurusanOptions([]);
      }
    };

    loadJurusan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!opening) {
      showErrorToast('Error', 'Pendaftaran SPMB belum dibuka atau sudah ditutup');
      return;
    }

    if (!formData.namaLengkap || !formData.noWhatsappOrtu || !formData.asalSekolah || !formData.alamat) {
      showErrorToast('Error', 'Nama lengkap, WhatsApp orang tua, asal sekolah, dan alamat wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiService.submitSpmbRegistrationPublic({
        namaLengkap: formData.namaLengkap,
        jenisKelamin: formData.jenisKelamin || undefined,
        umur: formData.umur ? Number(formData.umur) : undefined,
        nikAnak: formData.nikAnak || undefined,
        nisn: formData.nisn || undefined,
        kategoriPendaftar: formData.kategoriPendaftar || undefined,
        email: formData.email || undefined,
        noWhatsappOrtu: formData.noWhatsappOrtu,
        nomorKk: formData.nomorKk || undefined,
        tempatLahir: formData.tempatLahir || undefined,
        tanggalLahir: formData.tanggalLahir || undefined,
        asalSekolah: formData.asalSekolah,
        alamat: formData.alamat,
        namaOrangTua: formData.namaOrangTua || undefined,
        nikOrangTua: formData.nikOrangTua || undefined,
        pekerjaanOrangTua: formData.pekerjaanOrangTua || undefined,
        noHpOrangTua: formData.noHpOrangTua || undefined,
        ringkasanNilaiRapor: formData.ringkasanNilaiRapor || undefined,
        pilihanJurusan: formData.pilihanJurusan || undefined,
        dokumenKk: formData.dokumenKk || undefined,
        dokumenAktaKelahiran: formData.dokumenAktaKelahiran || undefined,
        dokumenKtpOrangTua: formData.dokumenKtpOrangTua || undefined,
        dokumenKartuImunisasi: formData.dokumenKartuImunisasi || undefined,
        dokumenPasFoto: formData.dokumenPasFoto || undefined,
        dokumenIjazahAtauSkL: formData.dokumenIjazahAtauSkL || undefined,
        dokumenRapor: formData.dokumenRapor || undefined,
        dokumenKip: formData.dokumenKip || undefined,
        dokumenSertifikatPrestasi: formData.dokumenSertifikatPrestasi || undefined,
        dokumenSuratKeteranganSehat: formData.dokumenSuratKeteranganSehat || undefined,
      });

      if (res.success) {
        showSuccessToast('Berhasil', res.message || 'Pendaftaran SPMB berhasil dikirim');
        setSuccessMessage('Pendaftaran Anda berhasil dikirim. Silakan menunggu informasi selanjutnya dari sekolah.');
        setFormData({
          namaLengkap: '',
          jenisKelamin: '' as '' | 'L' | 'P',
          umur: '',
          nikAnak: '',
          nisn: '',
          kategoriPendaftar: '',
          email: '',
          noWhatsappOrtu: '',
          nomorKk: '',
          tempatLahir: '',
          tanggalLahir: '',
          asalSekolah: '',
          alamat: '',
          namaOrangTua: '',
          nikOrangTua: '',
          pekerjaanOrangTua: '',
          noHpOrangTua: '',
          ringkasanNilaiRapor: '',
          pilihanJurusan: '',
          dokumenKk: '',
          dokumenAktaKelahiran: '',
          dokumenKtpOrangTua: '',
          dokumenKartuImunisasi: '',
          dokumenPasFoto: '',
          dokumenIjazahAtauSkL: '',
          dokumenRapor: '',
          dokumenKip: '',
          dokumenSertifikatPrestasi: '',
          dokumenSuratKeteranganSehat: '',
        });
      } else {
        showErrorToast('Error', res.message || 'Gagal mengirim pendaftaran SPMB');
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error', err.message || 'Terjadi kesalahan saat mengirim pendaftaran SPMB');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat informasi SPMB...</p>
        </div>
      </div>
    );
  }

  if (!opening) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-xl w-full p-6 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-gray-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Pendaftaran SPMB Belum Dibuka
          </h1>
          <p className="text-gray-600">
            Saat ini belum ada pembukaan Sistem Penerimaan Murid Baru yang aktif. Silakan
            cek kembali sesuai informasi resmi dari sekolah.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center space-x-4">
            {profilSekolah?.logoSekolah ? (
              <img
                src={profilSekolah.logoSekolah}
                alt={profilSekolah.namaSekolah || 'Logo sekolah'}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500">
                <School className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="flex-1">
              {profilSekolah?.namaSekolah && (
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-blue-700 mb-0.5">
                  {profilSekolah.namaSekolah}
                </p>
              )}
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-0.5">
                Formulir Pendaftaran SPMB
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                {opening.judul} &mdash; Tahun Ajaran {opening.tahunAjaran}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Periode pendaftaran: {opening.tanggalMulai} s/d {opening.tanggalSelesai}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-6">
          {/* Step indicator */}
          <div className="hidden sm:flex items-center justify-between mb-2">
            {[
              'Data Calon Murid',
              'Data Orang Tua / Wali',
              'Dokumen Pendukung',
            ].map((label, index) => (
              (() => {
                const stepNumber = (index + 1) as 1 | 2 | 3;
                const isCompleted = maxCompletedStep >= stepNumber;
                const isCurrent = currentStep === stepNumber;
                return (
              <div key={label} className="flex-1 flex items-center">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-semibold shadow-sm ${
                      isCurrent
                        ? 'bg-blue-600'
                        : isCompleted
                          ? 'bg-emerald-600'
                          : 'bg-slate-300'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                  </div>
                  <span
                    className={`ml-2 text-xs font-medium ${
                      isCurrent
                        ? 'text-slate-900'
                        : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div className="flex-1 h-px mx-2 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />
                )}
              </div>
                );
              })()
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Data Calon Murid */}
            <div
              className={
                currentStep === 1
                  ? 'space-y-4 border border-blue-100 rounded-lg p-4 bg-blue-50/40'
                  : 'hidden'
              }
            >
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  1. Data Calon Murid
                </h3>
                <p className="text-xs text-gray-500">
                  Langkah 1 &mdash; Isi identitas lengkap calon murid sesuai dokumen resmi (KK / Akta Kelahiran).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap Calon Murid *
                  </label>
                  <input
                    type="text"
                    value={formData.namaLengkap}
                  onChange={e => setFormData({ ...formData, namaLengkap: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nama lengkap"
                  disabled={isSpmbPortal}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={e =>
                      setFormData({ ...formData, jenisKelamin: e.target.value as '' | 'L' | 'P' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSpmbPortal}
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NISN (jika ada)
                  </label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nomor Induk Siswa Nasional"
                  disabled={isSpmbPortal}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Calon Murid
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contoh@email.com"
                  disabled={isSpmbPortal}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Orang Tua/Wali *
                  </label>
                  <input
                    type="tel"
                    value={formData.noWhatsappOrtu}
                    onChange={e => setFormData({ ...formData, noWhatsappOrtu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asal Sekolah *
                  </label>
                  <input
                    type="text"
                    value={formData.asalSekolah}
                    onChange={e => setFormData({ ...formData, asalSekolah: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nama sekolah asal"
                  disabled={isSpmbPortal}
                  />
                </div>

                {/* NIK & KK untuk semua jenjang */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIK Anak
                  </label>
                  <input
                    type="text"
                    value={formData.nikAnak}
                    onChange={e => setFormData({ ...formData, nikAnak: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nomor Induk Kependudukan anak"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor KK
                  </label>
                  <input
                    type="text"
                    value={formData.nomorKk}
                    onChange={e => setFormData({ ...formData, nomorKk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nomor Kartu Keluarga"
                  />
                </div>

                {/* Tempat / Tanggal lahir & Umur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={e => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Kota/Kabupaten lahir"
                  disabled={isSpmbPortal}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        tanggalLahir: e.target.value,
                        umur: calculateAgeFromDate(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSpmbPortal}
                  />
                </div>

                {/* Kategori Pendaftar - otomatis terisi dari akun peserta dan tidak bisa diubah */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Pendaftar
                  </label>
                  <input
                    type="text"
                    value={
                      formData.kategoriPendaftar
                        ? formData.kategoriPendaftar.charAt(0).toUpperCase() +
                          formData.kategoriPendaftar.slice(1)
                        : ''
                    }
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    placeholder="Akan terisi otomatis dari akun SPMB"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kategori pendaftar mengikuti data saat membuat akun SPMB dan tidak dapat diubah di
                    formulir.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Umur (tahun)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={formData.umur}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    placeholder="Otomatis dari tanggal lahir"
                  />
                </div>

                {(jenjang === 'SMP' || jenjang === 'SMA/SMK') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ringkasan Nilai Rapor (opsional)
                    </label>
                    <textarea
                      value={formData.ringkasanNilaiRapor}
                      onChange={e => setFormData({ ...formData, ringkasanNilaiRapor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Contoh: Rata-rata rapor 88, atau informasi nilai penting lainnya."
                    />
                  </div>
                )}

                {jenjang === 'SMA/SMK' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pilihan Jurusan
                    </label>
                    <select
                      value={formData.pilihanJurusan}
                      onChange={e => setFormData({ ...formData, pilihanJurusan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih jurusan</option>
                      {jurusanOptions.map(j => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Pilih salah satu jurusan yang tersedia untuk jenjang SMA/SMK.
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Lengkap Rumah *
                  </label>
                  <textarea
                    value={formData.alamat}
                    onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Tuliskan alamat lengkap beserta kecamatan dan kota/kabupaten"
                  />
                </div>
              </div>
            </div>

            {/* 2. Data Orang Tua / Wali */}
            <div
              className={
                currentStep === 2
                  ? 'space-y-4 border border-emerald-100 rounded-lg p-4 bg-emerald-50/40'
                  : 'hidden'
              }
            >
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  2. Data Orang Tua / Wali
                </h3>
                <p className="text-xs text-gray-500">
                  Langkah 2 &mdash; Lengkapi informasi orang tua atau wali sebagai penanggung jawab calon murid.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Orang Tua/Wali
                </label>
                <input
                  type="text"
                  value={formData.namaOrangTua}
                  onChange={e => setFormData({ ...formData, namaOrangTua: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nama orang tua atau wali"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK Orang Tua/Wali
                </label>
                <input
                  type="text"
                  value={formData.nikOrangTua}
                  onChange={e => setFormData({ ...formData, nikOrangTua: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nomor Induk Kependudukan orang tua/wali"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pekerjaan Orang Tua/Wali
                </label>
                <input
                  type="text"
                  value={formData.pekerjaanOrangTua}
                  onChange={e => setFormData({ ...formData, pekerjaanOrangTua: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: PNS, Wirausaha, Karyawan Swasta, dll."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No HP Orang Tua (opsional)
                </label>
                <input
                  type="tel"
                  value={formData.noHpOrangTua}
                  onChange={e => setFormData({ ...formData, noHpOrangTua: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No HP lain selain WhatsApp jika ada"
                />
              </div>
              </div>
            </div>

            {/* 3. Dokumen Pendukung */}
            <div
              className={
                currentStep === 3
                  ? 'space-y-3 border border-indigo-100 rounded-lg p-4 bg-indigo-50/40'
                  : 'hidden'
              }
            >
              <h3 className="text-sm font-semibold text-gray-800">
                3. Dokumen Pendukung Pendaftaran (opsional)
              </h3>
              <p className="text-xs text-gray-500">
                Langkah 3 &mdash; Jika memungkinkan, unggah dokumen dalam bentuk foto atau scan yang jelas. Jika tidak,
                dokumen bisa diserahkan saat verifikasi berkas di sekolah.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* KK & Akta untuk semua jenjang */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kartu Keluarga (KK)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => handleFileChange(e, 'dokumenKk')}
                    className="block w-full text-xs text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Akta Kelahiran
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => handleFileChange(e, 'dokumenAktaKelahiran')}
                    className="block w-full text-xs text-gray-600"
                  />
                </div>

                {/* KTP orang tua & pas foto untuk semua jenjang */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    KTP Orang Tua/Wali
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => handleFileChange(e, 'dokumenKtpOrangTua')}
                    className="block w-full text-xs text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pas Foto Calon Murid
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileChange(e, 'dokumenPasFoto')}
                    className="block w-full text-xs text-gray-600"
                  />
                </div>

                {/* Khusus SD: kartu imunisasi */}
                {jenjang === 'SD' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Kartu Imunisasi (jika ada)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => handleFileChange(e, 'dokumenKartuImunisasi')}
                      className="block w-full text-xs text-gray-600"
                    />
                  </div>
                )}

                {/* SMP & SMA/SMK: ijazah/SKL & rapor */}
                {(jenjang === 'SMP' || jenjang === 'SMA/SMK') && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Ijazah / SKL
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => handleFileChange(e, 'dokumenIjazahAtauSkL')}
                        className="block w-full text-xs text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Rapor (scan ringkas)
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => handleFileChange(e, 'dokumenRapor')}
                        className="block w-full text-xs text-gray-600"
                      />
                    </div>
                  </>
                )}

                {/* KIP & sertifikat prestasi (SMP/SMA) */}
                {(jenjang === 'SMP' || jenjang === 'SMA/SMK') && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Kartu Indonesia Pintar (KIP) (jika ada)
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => handleFileChange(e, 'dokumenKip')}
                        className="block w-full text-xs text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sertifikat Prestasi (jika jalur prestasi)
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple={false}
                        onChange={e => handleFileChange(e, 'dokumenSertifikatPrestasi')}
                        className="block w-full text-xs text-gray-600"
                      />
                    </div>
                  </>
                )}

                {/* SMA/SMK: surat keterangan sehat (opsional, untuk SMK tertentu) */}
                {jenjang === 'SMA/SMK' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Surat Keterangan Sehat (jika diminta)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => handleFileChange(e, 'dokumenSuratKeteranganSehat')}
                      className="block w-full text-xs text-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {successMessage && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Pendaftaran berhasil</div>
                  <p>{successMessage}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setCurrentStep(prev => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))
                    }
                    disabled={submitting}
                  >
                    Kembali
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {currentStep < 3 && (
                  <Button
                    type="button"
                    className="flex items-center justify-center"
                    onClick={handleNextStep}
                    disabled={submitting}
                  >
                    Lanjut
                  </Button>
                )}
                {currentStep === 3 && (
                  <Button
                    type="submit"
                    className="flex items-center justify-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span>Mengirim...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Kirim Pendaftaran
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SpmbRegistrationPage;

