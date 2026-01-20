import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import Button from '../../../ui/Button';
import KartuPegawaiPreviewFront from './KartuPegawaiPreviewFront';
import KartuPegawaiPreviewBack from './KartuPegawaiPreviewBack';
import { User as UserType, Kelas } from '../../../../types';
import { useBackgroundKTA } from '../../../../hooks/useBackgroundKTA';
import { useLanguage } from '../../../../context/LanguageContext';

interface KartuPegawaiTabProps {
  user: UserType | null;
  myKelas?: Kelas;
  isGenerating: boolean;
  onDownload: (orientation: 'potrait' | 'landscape') => void;
}

const KartuPegawaiTab: React.FC<KartuPegawaiTabProps> = ({
  user,
  myKelas,
  isGenerating,
  onDownload
}) => {
  const [orientation, setOrientation] = useState<'potrait' | 'landscape'>('potrait');
  const { backgroundKTA } = useBackgroundKTA();
  const { t } = useLanguage();

  const backgroundDepanGuru = useMemo(() => {
    return backgroundKTA?.backgroundDepanGuruBase64 || undefined;
  }, [backgroundKTA]);

  const backgroundBelakangGuru = useMemo(() => {
    return backgroundKTA?.backgroundBelakangGuruBase64 || undefined;
  }, [backgroundKTA]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">{t('dashboardGuru.kartuPegawaiTab.title')}</h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">{t('dashboardGuru.kartuPegawaiTab.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-slate-50">
          <h4 className="text-sm sm:text-base font-semibold text-slate-900 uppercase tracking-wide">{t('dashboardGuru.kartuPegawaiTab.informasiKartu')}</h4>
        </div>
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{t('dashboardGuru.kartuPegawaiTab.nama')}</p>
              <p className="text-sm sm:text-base font-medium text-blue-900">{user?.name}</p>
            </div>
            <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{t('dashboardGuru.kartuPegawaiTab.nip')}</p>
              <p className="text-sm sm:text-base font-medium text-blue-900 font-mono">{user?.nip}</p>
            </div>
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">{t('dashboardGuru.kartuPegawaiTab.jabatan')}</p>
              <p className="text-sm sm:text-base font-medium text-emerald-900">
                {user?.subject || t('dashboardGuru.kartuPegawaiTab.staff')}{user?.isWaliKelas ? ` / ${t('dashboardGuru.kartuPegawaiTab.waliKelas')}` : ''}
              </p>
            </div>
            {user?.isWaliKelas && myKelas && (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">{t('dashboardGuru.kartuPegawaiTab.waliKelas')}</p>
                <p className="text-sm sm:text-base font-medium text-emerald-900">{myKelas.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orientation Selector */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
          {t('dashboardGuru.kartuPegawaiTab.pilihOrientasiKTA')}
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="orientation"
              value="potrait"
              checked={orientation === 'potrait'}
              onChange={(e) => setOrientation(e.target.value as 'potrait' | 'landscape')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-2 text-sm sm:text-base text-slate-700 font-medium">{t('dashboardGuru.kartuPegawaiTab.potrait')}</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="orientation"
              value="landscape"
              checked={orientation === 'landscape'}
              onChange={(e) => setOrientation(e.target.value as 'potrait' | 'landscape')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-2 text-sm sm:text-base text-slate-700 font-medium">{t('dashboardGuru.kartuPegawaiTab.landscape')}</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {orientation === 'potrait' 
            ? t('dashboardGuru.kartuPegawaiTab.ktaDepanPotrait')
            : t('dashboardGuru.kartuPegawaiTab.ktaDepanLandscape')}
        </p>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">{t('dashboardGuru.kartuPegawaiTab.depanKartu')}</p>
              <KartuPegawaiPreviewFront 
                user={user} 
                myKelas={myKelas} 
                backgroundImage={orientation === 'potrait' ? backgroundDepanGuru : backgroundBelakangGuru}
                orientation={orientation}
              />
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">{t('dashboardGuru.kartuPegawaiTab.belakangKartu')}</p>
              <KartuPegawaiPreviewBack 
                user={user} 
                backgroundImage={orientation === 'potrait' ? backgroundBelakangGuru : backgroundDepanGuru}
                orientation={orientation}
              />
            </div>
          </div>
      
     

      <div className="flex justify-center">
        <Button
          onClick={() => onDownload(orientation)}
          disabled={isGenerating}
          size="lg"
          className="flex items-center justify-center gap-2 text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{t('dashboardGuru.kartuPegawaiTab.membuatKartu')}</span>
            </>
          ) : (
            <>
              <Download size={20} />
              <span>{t('dashboardGuru.kartuPegawaiTab.downloadKartuPegawai')}</span>
            </>
          )}
        </Button>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl sm:rounded-2xl p-5 sm:p-6">
        <h4 className="font-semibold text-amber-900 mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          {t('dashboardGuru.kartuPegawaiTab.informasiKartuPegawai')}
        </h4>
        <ul className="text-xs sm:text-sm text-amber-800 space-y-2 sm:space-y-2.5">
          <li className="flex gap-2">
            <span className="font-bold text-amber-600 flex-shrink-0">•</span>
            <span>{t('dashboardGuru.kartuPegawaiTab.kartuBerisiQRCode')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-amber-600 flex-shrink-0">•</span>
            <span>{t('dashboardGuru.kartuPegawaiTab.wajibDibawa')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-amber-600 flex-shrink-0">•</span>
            <span>{t('dashboardGuru.kartuPegawaiTab.janganMeminjamkan')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-amber-600 flex-shrink-0">•</span>
            <span>{t('dashboardGuru.kartuPegawaiTab.laporkanHilang')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-amber-600 flex-shrink-0">•</span>
            <span>{t('dashboardGuru.kartuPegawaiTab.downloadFormatZIP')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-amber-600 flex-shrink-0">•</span>
            <span>{t('dashboardGuru.kartuPegawaiTab.printUkuranStandar')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-amber-600 flex-shrink-0">•</span>
            <span>{t('dashboardGuru.kartuPegawaiTab.kartuBerisiKodeEtik')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default KartuPegawaiTab;
