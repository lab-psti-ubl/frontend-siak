import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, QrCode, CreditCard, ArrowLeft, LogOut } from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useKelas } from '../../hooks/useKelas';
import { useJurusan } from '../../hooks/useJurusan';
import { useBackgroundKTA } from '../../hooks/useBackgroundKTA';
import { User as UserType, Kelas } from '../../types';
import { generateTeacherAttendanceQRCode, generateQRCodeURL, downloadQRCode } from '../../utils/qrCodeGenerator';
import { generateGuruKartuPegawai } from '../../utils/kartuPegawaiUtils';
import { apiService } from '../../services/apiService';
import { showSuccessToast, showErrorToast } from '../ui/ToastContainer';
import AccountTab from './pages/profil/AccountTab';
import QRCodeTab from './pages/profil/QRCodeTab';
import KartuPegawaiTab from './pages/profil/KartuPegawaiTab';
import PasswordTab from './pages/profil/PasswordTab';

const ProfilGuru: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const { kelas } = useKelas();
  const { jurusan } = useJurusan();
  const { backgroundKTA } = useBackgroundKTA();
  const [activeTab, setActiveTab] = useState('akun');
  const [showTabContent, setShowTabContent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [myQRCodeURL, setMyQRCodeURL] = useState<string>('');
  const [isGeneratingKartu, setIsGeneratingKartu] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentUser, setCurrentUser] = useState<UserType | null>(authUser);

  // Sync with authUser
  useEffect(() => {
    setCurrentUser(authUser);
  }, [authUser]);

  // Detect mobile breakpoint (sm: 640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const user = currentUser;
  


// Tambahkan fungsi handler:
const handleLogout = () => {
  logout();
  navigate('/login', { replace: true });
};


  const myKelas = user?.isWaliKelas ? kelas.find(k => k.id === user.kelasWali) : undefined;
  const myJurusan = myKelas ? jurusan.find(j => j.id === myKelas.jurusanId) : undefined;

  useEffect(() => {
    const generateMyQR = async () => {
      if (user) {
        const qrData = generateTeacherAttendanceQRCode(user.id, user.name, user.kelasWali, user.nip);
        const url = await generateQRCodeURL(qrData, 400);
        setMyQRCodeURL(url);
      }
    };
    generateMyQR();
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!user) return;

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }

    try {
      const response = await apiService.changePasswordGuru({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Password berhasil diubah. Anda akan logout otomatis dalam 3 detik...' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        setTimeout(() => {
          logout();
          navigate('/login', { replace: true });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Gagal mengubah password' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat mengubah password' });
    }
  };

  const handleDownloadKartuPegawai = async (orientation: 'potrait' | 'landscape') => {
    if (!user) {
      alert('Data tidak lengkap untuk membuat kartu pegawai');
      return;
    }

    setIsGeneratingKartu(true);
    try {
      const backgroundDepan = backgroundKTA?.backgroundDepanGuruBase64;
      const backgroundBelakang = backgroundKTA?.backgroundBelakangGuruBase64;
      await generateGuruKartuPegawai(user, myKelas, myJurusan, backgroundDepan, backgroundBelakang, orientation);
      alert('Kartu pegawai berhasil diunduh!');
    } catch (error) {
      console.error('Error generating kartu pegawai:', error);
      alert('Terjadi kesalahan saat membuat kartu pegawai. Silakan coba lagi.');
    } finally {
      setIsGeneratingKartu(false);
    }
  };

  const downloadMyQR = async () => {
    if (user) {
      const qrData = generateTeacherAttendanceQRCode(user.id, user.name, user.kelasWali, user.nip);
      await downloadQRCode(qrData, `guru-qr-${user.name.replace(/\s+/g, '-')}`);
    }
  };

  const handlePasswordFormChange = (field: string, value: string) => {
    setPasswordForm({ ...passwordForm, [field]: value });
  };

  const tabs = [
    { id: 'akun', label: 'Akun', icon: User },
    { id: 'qrcode', label: 'QR Code', icon: QrCode },
    { id: 'kartu', label: 'Kartu Pegawai', icon: CreditCard },
    { id: 'password', label: 'Ubah Password', icon: Lock },
  ];

  if (isMobile) {
    // Mobile view with list menu and page transition
    if (!showTabContent) {
      // Mobile menu list view
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profil</h2>
            <p className="text-gray-600">Kelola informasi akun dan keamanan Anda</p>
          </div>

          <Card>
            <div className="space-y-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowTabContent(true);
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border border-slate-200 hover:border-slate-300"
                  >
                    <Icon size={24} className="text-blue-600 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-slate-900">{tab.label}</p>
                      <p className="text-xs text-slate-500">
                        {tab.id === 'akun' && 'Kelola data pribadi Anda'}
                        {tab.id === 'qrcode' && 'Kode identifikasi untuk absensi'}
                        {tab.id === 'kartu' && 'Unduh kartu identitas Anda'}
                        {tab.id === 'password' && 'Perbarui kata sandi akun Anda'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
          <button
  onClick={handleLogout}
  className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-lg 
             bg-red-600 hover:bg-red-700 text-white font-semibold 
             transition-colors duration-200 shadow-md hover:shadow-lg"
>
  <LogOut
    size={22}
    className="text-white"
  />
  Logout
</button>

        </div>
      );
    } else {
      // Mobile tab content view with back button
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTabContent(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft size={20} className="text-slate-700" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Profil</h2>
              <p className="text-sm text-gray-600">
                {tabs.find(t => t.id === activeTab)?.label}
              </p>
            </div>
          </div>

          <Card>
            <div className="p-1">
              {activeTab === 'akun' && <AccountTab user={user} kelasWali={myKelas} />}

              {activeTab === 'qrcode' && (
                <QRCodeTab
                  user={user}
                  qrCodeURL={myQRCodeURL}
                  onDownload={downloadMyQR}
                />
              )}

              {activeTab === 'kartu' && (
                <KartuPegawaiTab
                  user={user}
                  myKelas={myKelas}
                  isGenerating={isGeneratingKartu}
                  onDownload={handleDownloadKartuPegawai}
                />
              )}

              {activeTab === 'password' && (
                <PasswordTab
                  passwordForm={passwordForm}
                  showCurrentPassword={showCurrentPassword}
                  showNewPassword={showNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  message={message}
                  onPasswordFormChange={handlePasswordFormChange}
                  onToggleCurrentPassword={() => setShowCurrentPassword(!showCurrentPassword)}
                  onToggleNewPassword={() => setShowNewPassword(!showNewPassword)}
                  onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  onSubmit={handlePasswordChange}
                />
              )}
            </div>
          </Card>
          
        </div>
      );
    }
  }

  // Desktop view - original horizontal tabs
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Profil</h2>
        <p className="text-gray-600">Kelola informasi akun dan keamanan Anda</p>
      </div>

      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto whitespace-nowrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-6 py-4 sm:py-5 font-medium text-sm sm:text-base flex items-center gap-2 sm:gap-3 whitespace-nowrap transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'akun' && <AccountTab user={user} kelasWali={myKelas} />}

          {activeTab === 'qrcode' && (
            <QRCodeTab
              user={user}
              qrCodeURL={myQRCodeURL}
              onDownload={downloadMyQR}
            />
          )}

          {activeTab === 'kartu' && (
            <KartuPegawaiTab
              user={user}
              myKelas={myKelas}
              isGenerating={isGeneratingKartu}
              onDownload={handleDownloadKartuPegawai}
            />
          )}

          {activeTab === 'password' && (
            <PasswordTab
              passwordForm={passwordForm}
              showCurrentPassword={showCurrentPassword}
              showNewPassword={showNewPassword}
              showConfirmPassword={showConfirmPassword}
              message={message}
              onPasswordFormChange={handlePasswordFormChange}
              onToggleCurrentPassword={() => setShowCurrentPassword(!showCurrentPassword)}
              onToggleNewPassword={() => setShowNewPassword(!showNewPassword)}
              onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
              onSubmit={handlePasswordChange}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfilGuru;
