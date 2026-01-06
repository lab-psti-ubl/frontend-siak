import React from 'react';
import { Home, Calendar, ClipboardList, FileText, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQRScanner } from '../../context/QRScannerContext';

const GuruBottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isQRScannerOpen, isCameraCaptureOpen } = useQRScanner();

  const getCurrentPage = () => {
    const path = location.pathname.replace('/dashboard/', '') || 'dashboard';
    return path === 'dashboard' ? 'dashboard' : path;
  };

  const currentPage = getCurrentPage();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, color: 'text-blue-600' },
    { id: 'jadwal-saya', label: 'Jadwal', icon: Calendar, color: 'text-purple-600' },
    { id: 'absen-guru', label: 'Absen', icon: ClipboardList, color: 'text-orange-600' },
    { id: 'izin-guru', label: 'Izin', icon: FileText, color: 'text-red-600' },
    { id: 'profil', label: 'Profil', icon: User, color: 'text-pink-600' },
  ];

  const handleNavigation = (pageId: string) => {
    if (pageId === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${pageId}`);
    }
  };

  // Hide bottom navigation when QRScanner or CameraCapture is open
  if (isQRScannerOpen || isCameraCaptureOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg md:hidden z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 sm:h-20">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50'
                  : 'hover:bg-slate-50'
              }`}
            >
              <Icon
                size={24}
                className={`${isActive ? 'text-blue-600' : 'text-slate-500'} transition-colors duration-200`}
              />
              <span
                className={`text-xs font-semibold ${
                  isActive ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GuruBottomNavigation;
