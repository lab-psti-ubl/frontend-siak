import React, { useState, useEffect } from 'react';
import { Bell, X, Calendar, GraduationCap, FileText, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInfoSekolah } from '../../hooks/useInfoSekolah';
import { usePengumumanKelulusan } from '../../hooks/usePengumumanKelulusan';
import { useStatusKenaikanKelas } from '../../hooks/useStatusKenaikanKelas';
import { useStatusBagiRaport } from '../../hooks/useStatusBagiRaport';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { useReadNotifications } from '../../hooks/useReadNotifications';
import Badge from './Badge';
import Button from './Button';
import Modal from './Modal';
import { isMaxTingkat, getMaxTingkat } from '../../utils/jenjangPendidikanUtils';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  fullContent?: string;
  type: 'umum' | 'kelulusan' | 'kenaikan_kelas' | 'bagi_raport';
  icon: any;
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  gambar?: string; // Gambar poster dari InfoSekolah
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { infoSekolah } = useInfoSekolah();
  const { pengumumanKelulusan } = usePengumumanKelulusan();
  const { statusKenaikanKelas } = useStatusKenaikanKelas();
  const { statusBagiRaport } = useStatusBagiRaport();
  const { kelas } = useKelas();
  const { tahunAjaran, activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { readNotifications, markAsRead: markNotificationAsRead, markMultipleAsRead: markMultipleNotificationsAsRead } = useReadNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [hasAutoOpenedModal, setHasAutoOpenedModal] = useState(false);

  // Generate notifications based on user role and available info
  useEffect(() => {
    if (!user) return;

    const newNotifications: NotificationItem[] = [];
    const activeTahunAjaran = activeTahunAjaranFromHook || tahunAjaran.find(ta => ta.isActive);

    // 1. Info Sekolah (Informasi Umum)
    const relevantInfoSekolah = infoSekolah.filter(info => {
      if (!info.isActive) return false;
      
      // Filter berdasarkan target
      if (info.target === 'semua') return true;
      if (info.target === 'guru' && user.role === 'guru') return true;
      if (info.target === 'murid' && user.role === 'murid') return true;
      if (info.target === 'kelas_12' && user.role === 'murid') {
        const myKelas = kelas.find(k => k.id === user.kelasId);
        return myKelas ? isMaxTingkat(myKelas.tingkat) : false;
      }
      
      return false;
    });

    relevantInfoSekolah.forEach(info => {
      newNotifications.push({
        id: `info-${info.id}`,
        title: info.judul,
        message: info.konten.substring(0, 100) + (info.konten.length > 100 ? '...' : ''),
        fullContent: info.konten,
        type: info.jenis,
        icon: getIconForType(info.jenis),
        timestamp: info.publishedAt || info.createdAt,
        isRead: readNotifications.includes(`info-${info.id}`),
        priority: getPriorityForType(info.jenis),
        gambar: info.gambar
      });
    });

    // 2. Pengumuman Kelulusan (untuk murid tingkat akhir dan guru wali kelas tingkat akhir)
    const activeKelulusan = pengumumanKelulusan.find(p =>
      p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun
    );
    if (activeKelulusan && activeTahunAjaran?.semester === 2) {
      if (user.role === 'murid') {
        const myKelas = kelas.find(k => k.id === user.kelasId);
        if (myKelas && isMaxTingkat(myKelas.tingkat)) {
          newNotifications.push({
            id: `kelulusan-${activeKelulusan.id}`,
            title: 'Pengumuman Kelulusan',
            message: `Pengumuman kelulusan tahun ajaran ${activeKelulusan.tahunAjaran} telah dipublikasikan. Lihat status kelulusan Anda di menu Info Kelulusan.`,
            fullContent: `Pengumuman kelulusan tahun ajaran ${activeKelulusan.tahunAjaran} telah dipublikasikan. Lihat status kelulusan Anda di menu Info Kelulusan.`,
            type: 'kelulusan',
            icon: GraduationCap,
            timestamp: activeKelulusan.publishedAt || activeKelulusan.createdAt,
            isRead: readNotifications.includes(`kelulusan-${activeKelulusan.id}`),
            priority: 'high'
          });
        }
      } else if (user.role === 'guru' && user.isWaliKelas) {
        const myKelas = kelas.find(k => k.id === user.kelasWali);
        if (myKelas && isMaxTingkat(myKelas.tingkat)) {
          newNotifications.push({
            id: `kelulusan-guru-${activeKelulusan.id}`,
            title: 'Pengumuman Kelulusan Aktif',
            message: `Pengumuman kelulusan untuk kelas ${myKelas.name} telah dipublikasikan. Lihat data kelulusan murid di menu Info Kelulusan.`,
            fullContent: `Pengumuman kelulusan untuk kelas ${myKelas.name} telah dipublikasikan. Lihat data kelulusan murid di menu Info Kelulusan.`,
            type: 'kelulusan',
            icon: GraduationCap,
            timestamp: activeKelulusan.publishedAt || activeKelulusan.createdAt,
            isRead: readNotifications.includes(`kelulusan-guru-${activeKelulusan.id}`),
            priority: 'high'
          });
        }
      }
    }

    // 3. Status Kenaikan Kelas (untuk guru wali kelas selain tingkat akhir)
    if (user.role === 'guru' && user.isWaliKelas && activeTahunAjaran?.semester === 2) {
      const myKelas = kelas.find(k => k.id === user.kelasWali);
      if (myKelas && !isMaxTingkat(myKelas.tingkat)) {
        const statusKenaikan = statusKenaikanKelas.find(s => 
          s.kelasIds.includes(myKelas.id) && 
          s.tahunAjaran === activeTahunAjaran.tahun &&
          s.semester === activeTahunAjaran.semester &&
          !s.isPublished
        );

        if (statusKenaikan) {
          newNotifications.push({
            id: `kenaikan-${statusKenaikan.id}`,
            title: 'Siap Sebarkan Raport Kenaikan Kelas',
            message: `Admin telah mengaktifkan distribusi raport kenaikan kelas untuk ${myKelas.name}. Silakan sebarkan raport kepada murid di menu Raport Murid.`,
            fullContent: `Admin telah mengaktifkan distribusi raport kenaikan kelas untuk ${myKelas.name}. Silakan sebarkan raport kepada murid di menu Raport Murid.`,
            type: 'kenaikan_kelas',
            icon: Users,
            timestamp: statusKenaikan.createdAt,
            isRead: readNotifications.includes(`kenaikan-${statusKenaikan.id}`),
            priority: 'high'
          });
        }
      }
    }

    // 4. Status Bagi Raport (untuk semua guru wali kelas pada semester ganjil)
    if (user.role === 'guru' && user.isWaliKelas && activeTahunAjaran?.semester === 1) {
      const myKelas = kelas.find(k => k.id === user.kelasWali);
      if (myKelas) {
        const statusBagiRaportData = statusBagiRaport.find(s => 
          s.kelasId === myKelas.id && 
          s.tahunAjaran === activeTahunAjaran.tahun &&
          s.semester === activeTahunAjaran.semester &&
          !s.isPublished
        );

        if (statusBagiRaportData) {
          newNotifications.push({
            id: `bagi-raport-${statusBagiRaportData.id}`,
            title: 'Siap Sebarkan Raport Semester Ganjil',
            message: `Admin telah mengaktifkan distribusi raport semester ganjil untuk ${myKelas.name}. Silakan sebarkan raport kepada murid di menu Raport Murid.`,
            fullContent: `Admin telah mengaktifkan distribusi raport semester ganjil untuk ${myKelas.name}. Silakan sebarkan raport kepada murid di menu Raport Murid.`,
            type: 'bagi_raport',
            icon: FileText,
            timestamp: statusBagiRaportData.createdAt,
            isRead: readNotifications.includes(`bagi-raport-${statusBagiRaportData.id}`),
            priority: 'high'
          });
        }
      }
    }

    // 5. Notifikasi untuk murid tentang raport yang sudah disebarkan
    if (user.role === 'murid') {
      const myKelas = kelas.find(k => k.id === user.kelasId);
      if (myKelas && activeTahunAjaran) {
        // Check kenaikan kelas (semester genap)
        if (activeTahunAjaran.semester === 2 && !isMaxTingkat(myKelas.tingkat)) {
          const statusKenaikan = statusKenaikanKelas.find(s => 
            s.kelasIds.includes(myKelas.id) && 
            s.tahunAjaran === activeTahunAjaran.tahun &&
            s.semester === activeTahunAjaran.semester &&
            s.publishedKelasIds?.includes(myKelas.id)
          );

          if (statusKenaikan) {
            newNotifications.push({
              id: `raport-kenaikan-${statusKenaikan.id}`,
              title: 'Raport Kenaikan Kelas Tersedia',
              message: `Raport semester genap untuk ${myKelas.name} telah disebarkan oleh wali kelas. Lihat raport dan status kenaikan kelas Anda di menu Raport Saya.`,
              fullContent: `Raport semester genap untuk ${myKelas.name} telah disebarkan oleh wali kelas. Lihat raport dan status kenaikan kelas Anda di menu Raport Saya.`,
              type: 'kenaikan_kelas',
              icon: Users,
              timestamp: statusKenaikan.publishedAt || statusKenaikan.createdAt,
              isRead: readNotifications.includes(`raport-kenaikan-${statusKenaikan.id}`),
              priority: 'high'
            });
          }
        }

        // Check bagi raport (semester ganjil)
        if (activeTahunAjaran.semester === 1) {
          const statusBagiRaportData = statusBagiRaport.find(s => 
            s.kelasId === myKelas.id && 
            s.tahunAjaran === activeTahunAjaran.tahun &&
            s.semester === activeTahunAjaran.semester &&
            s.isPublished
          );

          if (statusBagiRaportData) {
            newNotifications.push({
              id: `raport-ganjil-${statusBagiRaportData.id}`,
              title: 'Raport Semester Ganjil Tersedia',
              message: `Raport semester ganjil untuk ${myKelas.name} telah disebarkan oleh wali kelas. Lihat raport Anda di menu Raport Saya.`,
              fullContent: `Raport semester ganjil untuk ${myKelas.name} telah disebarkan oleh wali kelas. Lihat raport Anda di menu Raport Saya.`,
              type: 'bagi_raport',
              icon: FileText,
              timestamp: statusBagiRaportData.publishedAt || statusBagiRaportData.createdAt,
              isRead: readNotifications.includes(`raport-ganjil-${statusBagiRaportData.id}`),
              priority: 'high'
            });
          }
        }
      }
    }

    // Sort notifications by timestamp: newest first (terbaru di atas, paling lama di bawah)
    const sortedNotifications = newNotifications.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Positive if b is newer (b comes first)
    });

    setNotifications(sortedNotifications);
  }, [user, infoSekolah, pengumumanKelulusan, statusKenaikanKelas, statusBagiRaport, kelas, tahunAjaran, activeTahunAjaranFromHook, readNotifications]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'umum': return FileText;
      case 'kelulusan': return GraduationCap;
      case 'kenaikan_kelas': return Users;
      case 'bagi_raport': return FileText;
      default: return Bell;
    }
  };

  const getPriorityForType = (type: string): 'high' | 'medium' | 'low' => {
    switch (type) {
      case 'kelulusan': return 'high';
      case 'kenaikan_kelas': return 'high';
      case 'bagi_raport': return 'high';
      case 'umum': return 'medium';
      default: return 'low';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'umum': return 'text-blue-600 bg-blue-100';
      case 'kelulusan': return 'text-purple-600 bg-purple-100';
      case 'kenaikan_kelas': return 'text-emerald-600 bg-emerald-100';
      case 'bagi_raport': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'umum': return <Badge variant="info" size="sm">Umum</Badge>;
      case 'kelulusan': return <Badge variant="success" size="sm">Kelulusan</Badge>;
      case 'kenaikan_kelas': return <Badge variant="warning" size="sm">Kenaikan Kelas</Badge>;
      case 'bagi_raport': return <Badge variant="secondary" size="sm">Bagi Raport</Badge>;
      default: return <Badge variant="default" size="sm">{type}</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasHighPriorityUnread = notifications.some(n => !n.isRead && n.priority === 'high');

  const handleMarkAsRead = (notificationId: string) => {
    if (!readNotifications.includes(notificationId)) {
      markNotificationAsRead(notificationId);
    }
  };

  // Auto-open modal for newest unread notification (only for guru and murid)
  useEffect(() => {
    if (!user || !notifications.length || hasAutoOpenedModal) return;
    
    // Only auto-open for guru and murid roles
    if (user.role !== 'guru' && user.role !== 'murid') return;
    
    // Sort all notifications by timestamp (newest first) to find the newest one
    const sortedByTimestamp = [...notifications].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Newest first
    });
    
    // Get the newest notification
    const newestNotification = sortedByTimestamp[0];
    
    // Only show modal if:
    // 1. The newest notification exists
    // 2. It is unread
    // 3. It hasn't been auto-opened in this session (desktop)
    // 4. It is not older than 7 days
    if (newestNotification && !newestNotification.isRead) {
      // Check if notification is older than 7 days
      const notificationDate = new Date(newestNotification.timestamp);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Skip auto-open if notification is older than 7 days
      if (diffInDays > 7) {
        return;
      }
      
      // Check if this notification has already been auto-opened in this session (desktop)
      const autoOpenedNotifications = sessionStorage.getItem('autoOpenedNotificationsDesktop');
      const openedIds = autoOpenedNotifications ? JSON.parse(autoOpenedNotifications) : [];
      
      if (!openedIds.includes(newestNotification.id)) {
        // Mark as auto-opened for desktop
        openedIds.push(newestNotification.id);
        sessionStorage.setItem('autoOpenedNotificationsDesktop', JSON.stringify(openedIds));
        
        // Automatically mark as read first, then open modal
        if (!readNotifications.includes(newestNotification.id)) {
          markNotificationAsRead(newestNotification.id).then(() => {
            // Auto-open modal after marking as read
            setSelectedNotification(newestNotification);
            setIsDetailModalOpen(true);
            setHasAutoOpenedModal(true);
          }).catch(() => {
            // Even if marking fails, still open modal
            setSelectedNotification(newestNotification);
            setIsDetailModalOpen(true);
            setHasAutoOpenedModal(true);
          });
        } else {
          // Already read, just open modal
          setSelectedNotification(newestNotification);
          setIsDetailModalOpen(true);
          setHasAutoOpenedModal(true);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, user, hasAutoOpenedModal, readNotifications]);

  const markAllAsRead = () => {
    const allNotificationIds = notifications.map(n => n.id);
    const unreadIds = allNotificationIds.filter(id => !readNotifications.includes(id));
    if (unreadIds.length > 0) {
      markMultipleNotificationsAsRead(unreadIds);
    }
  };

  const clearNotification = (notificationId: string) => {
    handleMarkAsRead(notificationId);
  };

  const handleViewDetail = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setIsDetailModalOpen(true);
    handleMarkAsRead(notification.id);
  };

  const formatTimestampFull = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} jam yang lalu`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Kemarin';
      if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative notification-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          hasHighPriorityUnread 
            ? 'text-red-600 hover:text-red-700 hover:bg-red-50 animate-pulse' 
            : unreadCount > 0
            ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 text-xs font-bold text-white rounded-full flex items-center justify-center ${
            hasHighPriorityUnread ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Tandai Semua Dibaca
                    </Button>
                  )}
                  <Badge variant={unreadCount > 0 ? 'warning' : 'success'} size="sm">
                    {unreadCount} baru
                  </Badge>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 10).map((notification) => {
                    const Icon = notification.icon;
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleViewDetail(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <p className={`text-xs leading-relaxed ${
                              !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              {getTypeBadge(notification.type)}
                              <span className="text-xs text-gray-400">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                            {!notification.isRead && (
                              <div className="flex items-center mt-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                <span className="text-xs text-blue-600 font-medium">Belum dibaca</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <h4 className="font-medium text-gray-900 mb-1">Tidak Ada Notifikasi</h4>
                  <p className="text-sm">Semua notifikasi akan muncul di sini</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 10 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                <span className="text-xs text-gray-500">
                  Menampilkan 10 dari {notifications.length} notifikasi
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          // Ensure notification is marked as read when modal is closed
          if (selectedNotification && !readNotifications.includes(selectedNotification.id)) {
            markNotificationAsRead(selectedNotification.id);
          }
          setIsDetailModalOpen(false);
          setSelectedNotification(null);
        }}
        title={selectedNotification?.title || ''}
        size="lg"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {getTypeBadge(selectedNotification.type)}
              <span className="text-sm text-gray-500">
                {formatTimestampFull(selectedNotification.timestamp)}
              </span>
            </div>
            
            {selectedNotification.gambar && (
              <div className="mb-4">
                <img
                  src={selectedNotification.gambar}
                  alt={selectedNotification.title}
                  className="w-full h-auto rounded-lg border border-gray-200 object-cover max-h-96"
                />
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.fullContent || selectedNotification.message}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${getTypeColor(selectedNotification.type)}`}>
                  <selectedNotification.icon size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedNotification.type === 'umum' ? 'Informasi Umum' :
                   selectedNotification.type === 'kelulusan' ? 'Pengumuman Kelulusan' :
                   selectedNotification.type === 'kenaikan_kelas' ? 'Pengumuman Kenaikan Kelas' :
                   'Bagi Raport'}
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedNotification(null);
                }}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationBell;