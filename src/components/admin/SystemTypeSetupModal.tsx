import React, { useState, useEffect } from 'react';
import { School, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ProfilSekolah } from '../../types';

interface SystemTypeSetupModalProps {
  onSystemTypeSelected: (systemType: 'sekolah_umum' | 'sekolah_umum_tahfiz' | 'tahfiz') => void;
}

const SystemTypeSetupModal: React.FC<SystemTypeSetupModalProps> = ({
  onSystemTypeSelected
}) => {
  const [selectedSystemType, setSelectedSystemType] = useState<'sekolah_umum' | 'sekolah_umum_tahfiz' | 'tahfiz' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [profilSekolah, setProfilSekolah] = useState<ProfilSekolah | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('profilSekolah');
      if (stored) {
        setProfilSekolah(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading school profile:', e);
    }
  }, []);

  const systemTypeOptions = [
    {
      value: 'sekolah_umum' as const,
      icon: School,
      title: 'Sekolah Umum',
      description: 'Sistem untuk sekolah umum tanpa program tahfiz',
      features: [
        'Sistem absensi standar',
        'Manajemen kelas dan mata pelajaran',
        'Laporan akademik standar',
        'Tidak ada fitur tahfiz'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      value: 'sekolah_umum_tahfiz' as const,
      icon: BookOpen,
      title: 'Sekolah Umum + Tahfiz',
      description: 'Sistem untuk sekolah umum dengan program tahfiz',
      features: [
        'Semua fitur sekolah umum',
        'Manajemen program tahfiz',
        'Absensi tahfiz terpisah',
        'Progress hafalan santri',
        'Tes hafalan dan perbaikan'
      ],
      color: 'from-green-500 to-emerald-600'
    },
    {
      value: 'tahfiz' as const,
      icon: GraduationCap,
      title: 'Sekolah Tahfiz',
      description: 'Sistem khusus untuk sekolah tahfiz',
      features: [
        'Fokus pada program tahfiz',
        'Manajemen santri dan ustadz',
        'Absensi tahfiz',
        'Progress hafalan lengkap',
        'Jadwal tahfiz terintegrasi'
      ],
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const schoolName = profilSekolah?.namaSekolah || 'Sistem Absensi Sekolah';
  const schoolLogo = profilSekolah?.logoSekolah;

  const handleSelect = (systemType: 'sekolah_umum' | 'sekolah_umum_tahfiz' | 'tahfiz') => {
    setSelectedSystemType(systemType);
  };

  const handleConfirm = () => {
    if (!selectedSystemType) return;
    setIsConfirming(true);
  };

  const handleFinalConfirm = async () => {
    if (!selectedSystemType) return;

    try {
      const { apiService } = await import('../../services/apiService');
      const result = await apiService.updatePengaturanSistem({ 
        systemType: selectedSystemType,
        isInitialSetup: true // Flag untuk menandakan ini adalah setup awal
      });

      if (result.success) {
        onSystemTypeSelected(selectedSystemType);
      } else {
        console.error('Failed to save system type:', result.message);
        alert('Gagal menyimpan tipe sistem. Silakan coba lagi.');
        setIsConfirming(false);
      }
    } catch (error) {
      console.error('Error saving system type:', error);
      alert('Terjadi kesalahan saat menyimpan tipe sistem. Silakan coba lagi.');
      setIsConfirming(false);
    }
  };

  const handleBack = () => {
    setIsConfirming(false);
  };

  const selectedOption = systemTypeOptions.find(opt => opt.value === selectedSystemType);

  if (isConfirming && selectedOption) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
      >
        <Card className="w-full max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
          <div className="p-5 sm:p-8">
            <div className="text-center mb-8">
              <div
                className={`inline-flex p-4 rounded-full bg-gradient-to-br ${selectedOption.color} mb-4`}
              >
                <selectedOption.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>

              <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                Konfirmasi Pilihan Sistem Sekolah
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Pastikan pilihan Anda sudah benar sebelum melanjutkan
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                    <span className="text-white font-bold text-base">!</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-yellow-900 mb-2 text-sm sm:text-base">
                    PENTING - Mohon Dibaca!
                  </h3>
                  <ul className="text-xs sm:text-sm text-yellow-800 space-y-1">
                    <li>Tipe sistem yang Anda pilih akan menentukan fitur yang tersedia</li>
                    <li>Setelah memilih sistem, Anda akan diminta untuk memilih jenjang pendidikan</li>
                    <li>Pastikan Anda memilih sistem yang sesuai dengan sekolah Anda</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 text-sm sm:text-base">Sistem yang Dipilih:</h3>

              <div className={`bg-gradient-to-br ${selectedOption.color} rounded-lg p-4 sm:p-6 text-white mb-4`}>
                <h4 className="text-lg sm:text-xl font-bold mb-2">{selectedOption.title}</h4>
                <p className="text-white/90 mb-4 text-sm sm:text-base">{selectedOption.description}</p>

                <ul className="space-y-2">
                  {selectedOption.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                onClick={handleBack}
                fullWidth
                className="order-2 sm:order-1"
              >
                Kembali
              </Button>
              <Button
                onClick={handleFinalConfirm}
                fullWidth
                className="order-1 sm:order-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Ya, Saya Yakin - Lanjutkan
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* ================= MOBILE VIEW ================= */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4 md:hidden overflow-y-auto" style={{ zIndex: 9999 }}>
        <div className="w-full max-w-md py-8">
          <div className="mb-6 animate-fade-in">
            <Card className="overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 pt-8 pb-6 rounded-t-xl">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    {schoolLogo ? (
                      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20">
                        <img src={schoolLogo} className="w-16 h-16 object-contain" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/30 backdrop-blur-sm">
                        <School className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {schoolName}
                  </h1>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">
                    Sistem Informasi Absensi & Akademik
                  </p>
                </div>
              </div>

              <div className="px-6 py-8">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    Pilih Sistem Sekolah
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Pilihan ini akan menentukan fitur yang tersedia di sistem
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {systemTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedSystemType === option.value;

                    return (
                      <div
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${option.color} flex-shrink-0`}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-grow">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900">
                              {option.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                              {option.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={!selectedSystemType}
                  className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg font-medium text-sm sm:text-base"
                >
                  {selectedSystemType ? 'Lanjutkan' : 'Pilih Sistem Terlebih Dahulu'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ================= DESKTOP/TABLET VIEW ================= */}
      <div className="hidden md:flex fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 items-center justify-center p-6" style={{ zIndex: 9999 }}>
        <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
            {/* LEFT PANEL - GRADIENT BLUE */}
            <div className="lg:col-span-2 bg-gradient-to-b from-blue-600 to-blue-500 text-white 
                flex flex-col items-center justify-center p-8 lg:p-10">
              <div className="flex flex-col items-center text-center">
                {schoolLogo ? (
                  <div className="w-24 h-24 lg:w-28 lg:h-28 bg-white rounded-3xl flex items-center 
                      justify-center shadow-xl overflow-hidden mb-6">
                    <img
                      src={schoolLogo}
                      className="w-20 lg:w-24 h-20 lg:h-24 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 lg:w-28 lg:h-28 bg-white/20 rounded-3xl flex items-center 
                      justify-center backdrop-blur-md mb-6">
                    <School className="w-12 lg:w-14 h-12 lg:h-14 text-white" />
                  </div>
                )}

                <h1 className="text-xl lg:text-2xl font-bold mb-2 leading-tight">
                  {schoolName}
                </h1>
                <p className="text-blue-100 text-xs lg:text-sm">
                  Sistem Informasi Absensi & Akademik
                </p>
              </div>
            </div>

            {/* RIGHT PANEL - FORM & SYSTEM TYPE LIST */}
            <div className="lg:col-span-3 p-8 lg:p-12 overflow-y-auto max-h-screen lg:max-h-full">
              <div className="mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Pilih Sistem Sekolah
                </h2>
                <p className="text-sm lg:text-base text-gray-600">
                  Pilihan ini akan menentukan fitur yang tersedia di sistem
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {systemTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedSystemType === option.value;

                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${option.color} flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-sm font-bold text-gray-900">
                            {option.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!selectedSystemType}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg font-semibold text-base"
              >
                {selectedSystemType ? 'Lanjutkan' : 'Pilih Sistem Terlebih Dahulu'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SystemTypeSetupModal;

