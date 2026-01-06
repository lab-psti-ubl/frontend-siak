import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User as UserType, Kelas } from '../../../../types';
import { normalizeTeacherQRCode } from '../../../../utils/qrCodeGenerator';
import { DEFAULT_PROFILE_ICON } from '../../../../utils/profilePlaceholder';

interface KartuPegawaiPreviewFrontProps {
  user: UserType | null;
  myKelas?: Kelas;
  backgroundImage?: string;
  orientation?: 'potrait' | 'landscape';
}

const KartuPegawaiPreviewFront: React.FC<KartuPegawaiPreviewFrontProps> = ({ user, myKelas, backgroundImage, orientation = 'potrait' }) => {
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

  const normalizedQRCode = normalizeTeacherQRCode(user?.qrCode, user?.nip);

  const getResponsiveValues = (): any => {
    if (orientation === 'landscape') {
      if (scale >= 1.2) {
        return { photoSize: 120, textSize: 'text-xs', padding: 20, gap: 'gap-2' };
      } else if (scale >= 0.9) {
        return { photoSize: 100, textSize: 'text-[9px]', padding: 14, gap: 'gap-1' };
      } else {
        return { photoSize: 70, textSize: 'text-[8px]', padding: 10, gap: 'gap-0.5' };
      }
    } else {
      if (scale >= 1.2) {
        return { qrSize: 150, nameSize: 'text-lg', textSize: 'text-xs', padding: 24 };
      } else if (scale >= 0.9) {
        return { qrSize: 120, nameSize: 'text-base', textSize: 'text-[9px]', padding: 18 };
      } else {
        return { qrSize: 90, nameSize: 'text-sm', textSize: 'text-[8px]', padding: 12 };
      }
    }
  };

  const values = getResponsiveValues();
  const cardWidth = orientation === 'potrait' ? 285 * scale : 420 * scale;
  const cardHeight = orientation === 'potrait' ? 420 * scale : 285 * scale;

  // Landscape layout (currently used for back)
  if (orientation === 'landscape') {
    return (
      <div className="text-center">
        <h4 className="font-semibold text-gray-900 mb-4">Sisi Depan</h4>
        <div className="flex justify-center overflow-x-auto pl-12 sm:pl-0 pb-2">
          <div
            className="rounded-xl text-white relative overflow-hidden shadow-xl flex items-center justify-between flex-shrink-0"
            style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              padding: `${values.padding}px`,
              background: backgroundImage
                ? `url(${backgroundImage}) center / cover no-repeat`
                : 'linear-gradient(135deg, #059669 0%, #10B981 30%, #34D399 70%, #6EE7B7 100%)',
              aspectRatio: '16/9',
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="grid gap-1 h-full w-full" style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(20px, 1fr))`,
              }}>
                {Array.from({ length: 40 }, (_, i) => (
                  <div key={i} className="bg-white w-1 h-1"></div>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex-shrink-0">
              <div className="bg-white p-1 rounded-lg overflow-hidden" style={{
                width: `${values.photoSize}px`,
                height: `${values.photoSize}px`,
              }}>
                <img
                  src={user?.profileImage || DEFAULT_PROFILE_ICON}
                  alt={user?.name || 'Profil'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="relative z-10 flex-1 text-left text-black" style={{
              marginLeft: `${values.padding * 1.5}px`,
              marginRight: `${values.padding}px`,
            }}>
              <div className={`${values.gap}`} style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto 1fr',
                columnGap: '4px',
                rowGap: '2px',
                fontSize: values.textSize === 'text-xs' ? '16px' : values.textSize === 'text-[9px]' ? '9px' : '8px',
                lineHeight: 1.4,
              }}>
                <span className="font-medium">Nama</span>
                <span>:</span>
                <span className="truncate">{user?.name || '-'}</span>

                <span className="font-medium">NIP</span>
                <span>:</span>
                <span className="truncate">{user?.nip || '-'}</span>

                <span className="font-medium">Jabatan</span>
                <span>:</span>
                <span className="truncate">{user?.subject || 'Staff'}{user?.isWaliKelas ? ' / Wali Kelas' : ''}</span>

                <span className="font-medium">Telp.</span>
                <span>:</span>
                <span className="truncate">{user?.phone || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Potrait layout (default)
  return (
    <div className="text-center">
      <h4 className="font-semibold text-gray-900 mb-4">Sisi Depan</h4>
      <div className="flex justify-center overflow-x-auto pb-2">
        <div
          className="rounded-xl text-white relative overflow-hidden shadow-xl flex flex-col items-center justify-center flex-shrink-0"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            padding: `${values.padding}px`,
            background: backgroundImage
              ? `url(${backgroundImage}) center / cover no-repeat`
              : 'linear-gradient(135deg, #059669 0%, #10B981 30%, #34D399 70%, #6EE7B7 100%)',
            aspectRatio: '9/16',
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="grid gap-1 h-full w-full" style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(20px, 1fr))`,
            }}>
              {Array.from({ length: 50 }, (_, i) => (
                <div key={i} className="bg-white rounded-full w-1 h-1"></div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex justify-center mb-3 flex-shrink-0">
            <div className="bg-white p-2 rounded-lg">
              <QRCodeSVG
                value={normalizedQRCode || ''}
                size={values.qrSize as number}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="relative z-10 text-center flex-shrink-0 w-full px-2 text-black">
            <h3 className={`font-bold mb-1 ${values.nameSize as string} truncate mb-5`} style={{
              lineHeight: 1.2,
            }}>{user?.name}</h3>

            <div className={`space-y-0.5 text-left ${values.textSize as string}`} style={{
              lineHeight: 1.2,
              display: 'grid',
              gridTemplateColumns: 'auto auto 1fr',
              columnGap: '4px',
              rowGap: '2px',
              fontSize: (values.textSize as string) === 'text-xs' ? '16px' : (values.textSize as string) === 'text-[9px]' ? '11px' : '8px',
              maxWidth: '100%',
            }}>
              <span className="font-medium">NIP</span>
              <span>:</span>
              <span className="truncate">{user?.nip || '-'}</span>

              <span className="font-medium">Jabatan</span>
              <span>:</span>
              <span className="truncate">{user?.subject || 'Staff'}{user?.isWaliKelas ? ' / Wali Kelas' : ''}</span>

              <span className="font-medium">Bergabung</span>
              <span>:</span>
              <span>{new Date(user?.createdAt || '').getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KartuPegawaiPreviewFront;
