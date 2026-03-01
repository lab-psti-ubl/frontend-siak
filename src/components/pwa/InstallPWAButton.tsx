import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showOtherBrowserModal, setShowOtherBrowserModal] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInStandalone = (window.navigator as any).standalone === true;
    const alreadyInstalled = isStandalone || isInStandalone;

    if (alreadyInstalled) {
      setIsInstallable(false);
      return;
    }

    // Check if device is iOS
    const checkIsIOS = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    };

    const ios = checkIsIOS();
    setIsIOS(ios);

    // Show button in all browsers when not installed (iOS shows immediately, others may get beforeinstallprompt later)
    setIsInstallable(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } else {
      // Firefox, Safari desktop, atau browser lain tanpa beforeinstallprompt
      setShowOtherBrowserModal(true);
    }
  };

  // Show whenever app is installable (Android, iOS, tablet, desktop)
  if (!isInstallable) {
    return null;
  }

  // Sembunyikan tombol di halaman SPMB (form pendaftaran publik)
  const pathname = window.location.pathname || '';
  if (pathname.startsWith('/spmb')) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-16 right-4 z-50">
        <Button
          onClick={handleInstallClick}
          variant="primary"
          className="flex items-center gap-2 shadow-lg rounded-xl px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
        >
          <Download size={18} />
          <span>{t('pwa.installApp') || 'Install App'}</span>
        </Button>
      </div>

      {/* iOS Installation Instructions Modal */}
      {isIOS && (
        <Modal
          isOpen={showIOSModal}
          onClose={() => setShowIOSModal(false)}
          title={t('pwa.installInstructions') || 'Cara Install Aplikasi'}
        >
          <div className="p-4 space-y-4">
            <p className="text-gray-700 mb-4">
              {t('pwa.iosInstructions') || 'Untuk menginstall aplikasi di iPhone/iPad:'}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('pwa.step1') || 'Tap tombol Share'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('pwa.step1Desc') || 'Tap ikon Share di bagian bawah browser Safari'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('pwa.step2') || 'Pilih "Add to Home Screen"'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('pwa.step2Desc') || 'Scroll ke bawah dan pilih "Add to Home Screen"'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('pwa.step3') || 'Tap "Add"'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('pwa.step3Desc') || 'Konfirmasi dengan tap "Add" di pojok kanan atas'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={() => setShowIOSModal(false)}
                variant="primary"
                fullWidth
                className="flex items-center justify-center gap-2"
              >
                <X size={18} />
                {t('common.close') || 'Tutup'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal untuk browser lain (Firefox, Safari desktop, dll.) */}
      <Modal
        isOpen={showOtherBrowserModal}
        onClose={() => setShowOtherBrowserModal(false)}
        title={t('pwa.installInstructions') || 'Cara Install Aplikasi'}
      >
        <div className="p-4 space-y-4">
          <p className="text-gray-700 mb-4">
            {t('pwa.otherBrowserInstructions') || 'Untuk menginstall aplikasi di browser ini:'}
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
            <li>{t('pwa.otherBrowserStep1') || 'Buka menu browser (ikon ⋮ atau ≡ di pojok kanan atas)'}</li>
            <li>{t('pwa.otherBrowserStep2') || 'Cari opsi "Install app", "Install", atau "Add to Home Screen"'}</li>
            <li>{t('pwa.otherBrowserStep3') || 'Klik opsi tersebut dan ikuti petunjuk di layar'}</li>
          </ul>
          <p className="text-gray-500 text-sm">
            {t('pwa.otherBrowserNote') || 'Lokasi menu dapat berbeda tergantung browser (Chrome, Firefox, Edge, Safari, dll.).'}
          </p>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowOtherBrowserModal(false)}
              variant="primary"
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              <X size={18} />
              {t('common.close') || 'Tutup'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InstallPWAButton;

