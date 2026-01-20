import React from 'react';
import { Home, Calendar, ClipboardList, FileText, User, BookOpen, QrCode, BookMarked } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlumni } from '../../hooks/useAlumni';
import { useSantri } from '../../hooks/useSantri';
import { useKelasTahfiz } from '../../hooks/useKelasTahfiz';
import { isMuridAlumni } from '../../utils/alumniStatusUtils';
import { useQRScanner } from '../../context/QRScannerContext';

const MuridBottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { alumni } = useAlumni();
  const { santri } = useSantri();
  const { kelasTahfiz } = useKelasTahfiz();
  const { isQRScannerOpen, isCameraCaptureOpen } = useQRScanner();

  const isAlumni = isMuridAlumni(user, alumni);
  
  // Check if user is a santri that is NOT from murid collection
  const santriUser = user?.id ? santri.find(s => s.id === user.id) : null;
  const isSantriNotFromMurid = santriUser && (santriUser as any).isFromMurid === false;
  
  // Get tahfiz classes for this santri
  const myTahfizClasses = isSantriNotFromMurid && user?.id
    ? kelasTahfiz.filter(cls => cls.santriIds.includes(user.id))
    : [];
  
  const hasTahfizClass = myTahfizClasses.length > 0;

  const getCurrentPage = () => {
    const path = location.pathname.replace('/dashboard/', '') || 'dashboard';
    const cleanPath = path === 'dashboard' ? 'dashboard' : path;
    
    // Handle active state untuk route yang spesifik
    if (cleanPath.startsWith('jadwal-tahfiz-murid')) return 'jadwal-tahfiz-murid';
    if (cleanPath.startsWith('absensi-santri-tahfiz')) return 'absensi-santri-tahfiz';
    if (cleanPath.startsWith('progress-hapalan-murid')) return 'progress-hapalan-murid';
    if (cleanPath.startsWith('surat-izin')) return 'surat-izin';
    
    return cleanPath;
  };

  const currentPage = getCurrentPage();

  // Menu khusus untuk santri yang bukan dari murid (sesuai menu cards)
  const santriNotFromMuridNavItems = (() => {
    const items: Array<{ id: string; label: string; icon: any; color: string }> = [
      { id: 'dashboard', label: 'Home', icon: Home, color: 'text-emerald-600' },
  
    ];

    // Tambahkan menu tahfiz jika memiliki kelas tahfiz
    if (hasTahfizClass) {
      items.push(
        { id: 'jadwal-tahfiz-murid', label: 'Jadwal', icon: Calendar, color: 'text-emerald-600' },
        { id: 'absensi-santri-tahfiz', label: 'Absen', icon: ClipboardList, color: 'text-teal-600' },
        { id: 'progress-hapalan-murid', label: 'Progress', icon: BookMarked, color: 'text-cyan-600' }
      );
    } else {
      // Jika tidak ada kelas tahfiz, tambahkan menu izin saja (total 4 item: Home, QR Code, Izin, Profil)
      items.push(
        { id: 'surat-izin', label: 'Izin', icon: FileText, color: 'text-red-600' }
      );
    }

    // Tambahkan profil di akhir
    items.push({ id: 'profil', label: 'Profil', icon: User, color: 'text-amber-600' });

    return items;
  })();

  // Menu untuk alumni
  const alumniNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home, color: 'text-blue-600' },
    { id: 'raport-saya', label: 'Laporan', icon: BookOpen, color: 'text-pink-600' },
    { id: 'qr-code', label: 'QR Code', icon: QrCode, color: 'text-green-600' },
    { id: 'nilai-saya', label: 'Nilai', icon: FileText, color: 'text-teal-600' },
    { id: 'profil', label: 'Profil', icon: User, color: 'text-amber-600' },
  ];

  // Menu untuk murid aktif
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, color: 'text-blue-600' },
    { id: 'jadwal', label: 'Jadwal', icon: Calendar, color: 'text-purple-600' },
    { id: 'absensi-saya', label: 'Absen', icon: ClipboardList, color: 'text-orange-600' },
    { id: 'nilai-saya', label: 'Nilai', icon: FileText, color: 'text-green-600' },
    { id: 'profil', label: 'Profil', icon: User, color: 'text-pink-600' },
  ];

  const displayItems = isSantriNotFromMurid 
    ? santriNotFromMuridNavItems
    : (isAlumni ? alumniNavItems : navItems);

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
        {displayItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          // Gunakan warna tema yang sesuai untuk santri
          const activeBgColor = isSantriNotFromMurid ? 'bg-emerald-50' : 'bg-blue-50';

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 ${
                isActive
                  ? activeBgColor
                  : 'hover:bg-slate-50'
              }`}
            >
              <Icon
                size={24}
                className={`${isActive ? item.color : 'text-slate-500'} transition-colors duration-200`}
              />
              <span
                className={`text-xs font-semibold ${
                  isActive ? item.color : 'text-slate-600'
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

export default MuridBottomNavigation;
