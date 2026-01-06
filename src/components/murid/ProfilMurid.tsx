import React, { useState, useEffect } from 'react';
import { User, Lock, CreditCard, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { User as UserType } from '../../types';
import { usePasswordChange } from '../../hooks/usePasswordChange';
import { useKelas } from '../../hooks/useKelas';
import { useJurusan } from '../../hooks/useJurusan';
import AccountTab from './pages/profil/AccountTab';
import KartuPelajarTab from './pages/profil/KartuPelajarTab';
import PasswordTab from './pages/profil/PasswordTab';

const ProfilMurid: React.FC = () => {
  const { user: authUser } = useAuth();
  const { kelas } = useKelas();
  const { jurusan } = useJurusan();
  const [activeTab, setActiveTab] = useState('akun');
  const [currentUser, setCurrentUser] = useState<UserType | null>(authUser);
  const [isMobile, setIsMobile] = useState(false);
  const [showTabContent, setShowTabContent] = useState(false);

  useEffect(() => {
    setCurrentUser(authUser);
  }, [authUser]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const user = currentUser;
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const myKelas = kelas.find(k => k.id === user?.kelasId);
  const myJurusan = jurusan.find(j => j.id === myKelas?.jurusanId);

  const { message, handlePasswordChange } = usePasswordChange({
    user,
  });

  const tabs = [
    { id: 'akun', label: 'Akun', icon: User, description: 'Kelola data pribadi Anda' },
    { id: 'kartu', label: 'Kartu Pelajar', icon: CreditCard, description: 'Lihat dan unduh kartu pelajar' },
    { id: 'password', label: 'Ubah Password', icon: Lock, description: 'Perbarui kata sandi akun Anda' },
  ];

  if (isMobile) {
    if (!showTabContent) {
      return (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 sm:px-6 py-6 sm:py-8">
              <h1 className="text-2xl font-bold text-white mb-1">Profil Saya</h1>
              <p className="text-sm text-blue-100">Kelola informasi akun dan keamanan Anda</p>
            </div>
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
                      <p className="text-xs text-slate-500">{tab.description}</p>
                      
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
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTabContent(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft size={20} className="text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
              <p className="text-sm text-slate-600">
                {tabs.find(t => t.id === activeTab)?.label}
              </p>
            </div>
          </div>

          <Card>
            <div className="p-5 sm:p-6">
              {activeTab === 'akun' && <AccountTab user={user} myKelas={myKelas} />}
              {activeTab === 'kartu' && (
                <KartuPelajarTab user={user} myKelas={myKelas} myJurusan={myJurusan} />
              )}
              {activeTab === 'password' && (
                <PasswordTab onPasswordChange={handlePasswordChange} message={message} />
              )}
            </div>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Profil Saya
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Kelola informasi akun dan keamanan Anda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab, index) => {
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

        <div className="p-5 sm:p-6 lg:p-8">
          {activeTab === 'akun' && <AccountTab user={user} myKelas={myKelas} />}
          {activeTab === 'kartu' && (
            <KartuPelajarTab user={user} myKelas={myKelas} myJurusan={myJurusan} />
          )}
          {activeTab === 'password' && (
            <PasswordTab onPasswordChange={handlePasswordChange} message={message} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilMurid;