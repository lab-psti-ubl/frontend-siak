import React, { useState, useEffect } from 'react';
import { User as UserType } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';

interface KartuPegawaiPreviewBackProps {
  user: UserType | null;
  backgroundImage?: string;
  orientation?: 'potrait' | 'landscape';
}

const KartuPegawaiPreviewBack: React.FC<KartuPegawaiPreviewBackProps> = ({ user, backgroundImage, orientation = 'potrait' }) => {
  const { t } = useLanguage();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setScale(1.2);
      } else if (width >= 768) {
        setScale(0.9);
      } else {
        setScale(orientation === 'potrait' ? 0.7 : 0.65);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [orientation]);

  if (!user) {
    return <div className="text-center text-gray-500">{t('dashboardGuru.kartuPegawaiTab.preview.dataTidakTersedia')}</div>;
  }

  const getResponsiveValues = () => {
    if (orientation === 'potrait') {
      if (scale >= 1.2) {
        return { textSize: 'text-xs', padding: 24, titleSize: 'text-lg' };
      } else if (scale >= 0.9) {
        return { textSize: 'text-[9px]', padding: 18, titleSize: 'text-base' };
      } else {
        return { textSize: 'text-[8px]', padding: 12, titleSize: 'text-sm' };
      }
    } else {
      if (scale >= 1.2) {
        return { textSize: 'text-xs', padding: 20, titleSize: 'text-lg' };
      } else if (scale >= 0.9) {
        return { textSize: 'text-[9px]', padding: 14, titleSize: 'text-base' };
      } else {
        return { textSize: 'text-[8px]', padding: 10, titleSize: 'text-sm' };
      }
    }
  };

  const values = getResponsiveValues();
  const cardWidth = orientation === 'potrait' ? 285 * scale : 420 * scale;
  const cardHeight = orientation === 'potrait' ? 420 * scale : 285 * scale;

  // Show rules and regulations on the back
  return (
    <div className="text-center">
      <h4 className="font-semibold text-gray-900 mb-4">{t('dashboardGuru.kartuPegawaiTab.preview.sisiBelakang')}</h4>
      <div className="flex justify-center overflow-x-auto pb-2">
        <div
          className="rounded-xl text-white relative overflow-hidden shadow-xl flex flex-col flex-shrink-0"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            padding: `${values.padding}px`,
            background: backgroundImage
              ? `url(${backgroundImage}) center / cover no-repeat`
              : 'linear-gradient(135deg, #0D9488 0%, #14B8A6 30%, #5EEAD4 70%, #99F6E4 100%)',
            aspectRatio: orientation === 'potrait' ? '9/16' : '16/9',
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="grid gap-1 h-full w-full" style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(20px, 1fr))`,
            }}>
              {Array.from({ length: orientation === 'potrait' ? 50 : 40 }, (_, i) => (
                <div key={i} className={`bg-white ${orientation === 'potrait' ? 'rounded-full' : ''} w-1 h-1`}></div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col h-full justify-center text-black">
            <div className="text-center mb-4">
              <h3 className={`font-bold ${values.titleSize as string} mb-2`} style={{
                fontSize: values.textSize === 'text-xs' ? '16px' : values.textSize === 'text-[9px]' ? '12px' : '10px',
              }}>
                {t('dashboardGuru.kartuPegawaiTab.preview.tataTertibKetentuan')}
              </h3>
            </div>

            <div className={`space-y-2 ${values.textSize as string} text-left`} style={{
              lineHeight: 1.6,
              fontSize: values.textSize === 'text-xs' ? '12px' : values.textSize === 'text-[9px]' ? '9px' : '8px',
            }}>
              <div>
                <span className="font-medium">1. </span>
                <span>{t('dashboardGuru.kartuPegawaiTab.preview.rule1')}</span>
              </div>

              <div>
                <span className="font-medium">2. </span>
                <span>{t('dashboardGuru.kartuPegawaiTab.preview.rule2')}</span>
              </div>

              <div>
                <span className="font-medium">3. </span>
                <span>{t('dashboardGuru.kartuPegawaiTab.preview.rule3')}</span>
              </div>

              <div>
                <span className="font-medium">4. </span>
                <span>{t('dashboardGuru.kartuPegawaiTab.preview.rule4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KartuPegawaiPreviewBack;
