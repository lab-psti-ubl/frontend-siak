import React from 'react';
import { Download } from 'lucide-react';
import Button from '../../../ui/Button';
import { User as UserType } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';

interface QRCodeTabProps {
  user: UserType | null;
  qrCodeURL: string;
  onDownload: () => void;
}

const QRCodeTab: React.FC<QRCodeTabProps> = ({ user, qrCodeURL, onDownload }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">{t('dashboardGuru.qrCodeTab.title')}</h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">{t('dashboardGuru.qrCodeTab.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col items-center gap-5 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-sm">
              {qrCodeURL ? (
                <img
                  src={qrCodeURL}
                  alt="My QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                />
              ) : (
                <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <Button
              onClick={onDownload}
              variant="secondary"
              className="flex items-center justify-center gap-2 w-full text-sm sm:text-base py-2.5 sm:py-3"
            >
              <Download size={18} />
              {t('dashboardGuru.qrCodeTab.downloadQRCodeButton')}
            </Button>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 uppercase tracking-wide">{t('dashboardGuru.qrCodeTab.informasiQRCode')}</h4>
            </div>
            <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{t('dashboardGuru.qrCodeTab.nama')}</p>
                <p className="text-sm sm:text-base font-medium text-slate-900">{user?.name}</p>
              </div>
              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{t('dashboardGuru.qrCodeTab.nip')}</p>
                <p className="text-sm sm:text-base font-medium text-slate-900 font-mono">{user?.nip}</p>
              </div>
              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{t('dashboardGuru.qrCodeTab.role')}</p>
                <p className="text-sm sm:text-base font-medium text-slate-900">{t('dashboardGuru.qrCodeTab.guru')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl sm:rounded-2xl p-5 sm:p-6">
            <h4 className="font-semibold text-amber-900 mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              {t('dashboardGuru.qrCodeTab.caraPenggunaan')}
            </h4>
            <ul className="text-xs sm:text-sm text-amber-800 space-y-2 sm:space-y-2.5">
              <li className="flex gap-2">
                <span className="font-bold text-amber-600 flex-shrink-0">•</span>
                <span>{t('dashboardGuru.qrCodeTab.tunjukkanQRCode')}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber-600 flex-shrink-0">•</span>
                <span>{t('dashboardGuru.qrCodeTab.adminScanQRCode')}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber-600 flex-shrink-0">•</span>
                <span>{t('dashboardGuru.qrCodeTab.qrCodeBerlaku')}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber-600 flex-shrink-0">•</span>
                <span>{t('dashboardGuru.qrCodeTab.downloadQRCode')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeTab;
