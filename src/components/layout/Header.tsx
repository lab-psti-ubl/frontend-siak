import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Button from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';
import MobileNotificationBell from '../ui/MobileNotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useProfilSekolah } from '../../hooks/useProfilSekolah';
import { showSuccessToast, showErrorToast } from '../ui/ToastContainer';
import { usePengaturanSistem } from '../../hooks/usePengaturanSistem';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { profilSekolah } = useProfilSekolah();
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Guru mengikuti logika murid
  const isStudent = user?.role === "murid" || user?.role === "guru";

  // Staff hanya admin
  const isStaff = user?.role === "admin";

  // Pengaturan sistem untuk pulang cepat toggle (admin only)
  const { enableEarlyDeparture, updateEnableEarlyDeparture, loading: isLoadingPengaturan } = usePengaturanSistem();
  const [isLoadingEarlyDeparture, setIsLoadingEarlyDeparture] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleEarlyDeparture = async () => {
    if (isLoadingEarlyDeparture || isLoadingPengaturan) return;
    
    const newState = !enableEarlyDeparture;
    setIsLoadingEarlyDeparture(true);

    try {
      await updateEnableEarlyDeparture(newState);
      showSuccessToast(
        'Berhasil',
        newState
          ? 'Pulang cepat diaktifkan - murid dapat absen pulang kapan saja'
          : 'Pulang cepat dinonaktifkan - murid hanya dapat absen pulang 15 menit sebelum jam pulang'
      );
    } catch (error: any) {
      console.error('Error updating early departure:', error);
      showErrorToast('Gagal', 'Gagal mengubah pengaturan pulang cepat');
    } finally {
      setIsLoadingEarlyDeparture(false);
    }
  };

  // Generate breadcrumb from current path
  const generateBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    if (pathSegments.length > 1) {
      breadcrumbs.push('Dashboard');
      
      if (pathSegments[1]) {
        const pageName = pathSegments[1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        breadcrumbs.push(pageName);
      }
    }
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumb();

  return (
    <header className="fixed md:sticky top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 md:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">

          {/* ======================================
              LOGO & NAMA SEKOLAH / TEXT "APLIKASI" → hanya untuk murid/guru mobile
             ====================================== */}
          {isStudent && isMobileView && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {profilSekolah?.logoSekolah ? (
                <>
                  <img
                    src={profilSekolah.logoSekolah}
                    alt="Logo Sekolah"
                    className="object-contain flex-shrink-0 h-10 w-10 sm:h-14 sm:w-14"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-semibold text-gray-900 leading-tight max-w-[180px] sm:max-w-[220px] line-clamp-2 break-words">
                      {profilSekolah.namaSekolah || 'Aplikasi'}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-base font-bold text-gray-900">
                  Aplikasi
                </span>
              )}
            </div>
          )}

          {/* =====================================================
              ICON BURGER
              - Admin → selalu tampil di mobile/tablet, hidden di desktop
              - Murid/Guru → hidden di mobile (<768px), tampil di tablet (>=768px), hidden di desktop
             ===================================================== */}
          {!(isStudent && isMobileView) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onMenuClick}
              className="p-1.5 !px-1.5 flex-shrink-0 lg:hidden"
            >
              <Menu size={18} />
            </Button>
          )}

          {/* Breadcrumb, Title, Subtitle - hidden untuk murid/guru di mobile */}
          {!(isStudent && isMobileView) && (
            <div className="min-w-0 flex-1">
              {/* BREADCRUMB */}
              {breadcrumbs.length > 1 && (
                <nav className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={index}>
                      {index > 0 && <span className="mx-1.5 sm:mx-2">/</span>}
                      <span
                        className={
                          index === breadcrumbs.length - 1
                            ? 'text-blue-600 font-medium'
                            : ''
                        }
                      >
                        {crumb}
                      </span>
                    </span>
                  ))}
                </nav>
              )}

              {/* TITLE */}
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                {title}
              </h1>

              {/* SUBTITLE */}
              {subtitle && (
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mobile View: Pulang Cepat Toggle + Notification Bell */}
        <div className="lg:hidden flex items-center gap-2 flex-shrink-0 ml-2">
          {isStaff && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-700 ">Pulang Cepat</span>
              <button
                onClick={handleToggleEarlyDeparture}
                disabled={isLoadingEarlyDeparture}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                  enableEarlyDeparture ? 'bg-emerald-500' : 'bg-gray-300'
                } ${isLoadingEarlyDeparture ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={enableEarlyDeparture ? 'Nonaktifkan untuk batasan 15 menit sebelum pulang' : 'Aktifkan untuk absen pulang tanpa batasan waktu'}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    enableEarlyDeparture ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
          <MobileNotificationBell />
        </div>

        {/* Desktop View: Pulang Cepat Toggle + Notification */}
        <div className="hidden lg:flex items-center space-x-4">
          {isStaff && (
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Pulang Cepat</span>
              <button
                onClick={handleToggleEarlyDeparture}
                disabled={isLoadingEarlyDeparture}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableEarlyDeparture ? 'bg-emerald-500' : 'bg-gray-300'
                } ${isLoadingEarlyDeparture ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={enableEarlyDeparture ? 'Nonaktifkan untuk batasan 15 menit sebelum pulang' : 'Aktifkan untuk absen pulang tanpa batasan waktu'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableEarlyDeparture ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              
            </div>
          )}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default Header;
