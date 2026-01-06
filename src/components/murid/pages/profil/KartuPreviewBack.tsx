import React, { useState, useEffect } from 'react';
import { User as UserType, Kelas, Jurusan } from '../../../../types';
import { shouldShowJurusanSync } from '../../../../utils/jenjangPendidikanUtils';

interface KartuPreviewBackProps {
  user: UserType;
  myKelas: Kelas;
  myJurusan?: Jurusan;
  backgroundImage?: string;
  orientation?: 'potrait' | 'landscape';
}

const KartuPreviewBack: React.FC<KartuPreviewBackProps> = ({ user, myKelas, myJurusan, backgroundImage, orientation = 'potrait' }) => {
  const [scale, setScale] = useState(1);
  const showJurusan = shouldShowJurusanSync();

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

  if (!user || (showJurusan && !myJurusan)) {
    return <div className="text-center text-gray-500">Data tidak tersedia</div>;
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

  // Show school information on the back
  return (
    <div className="text-center">
      <h4 className="font-semibold text-gray-900 mb-4">Sisi Belakang</h4>
      <div className="flex justify-center overflow-x-auto pb-2">
        <div
          className="rounded-xl text-white relative overflow-hidden shadow-xl flex flex-col flex-shrink-0"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            padding: `${values.padding}px`,
            background: backgroundImage
              ? `url(${backgroundImage}) center / cover no-repeat`
              : 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 30%, #3B82F6 70%, #1E40AF 100%)',
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
                TATA TERTIB & KETENTUAN PENGGUNAAN KARTU
              </h3>
            </div>

            <div className={`space-y-2 ${values.textSize as string} text-left`} style={{
              lineHeight: 1.6,
              fontSize: values.textSize === 'text-xs' ? '12px' : values.textSize === 'text-[9px]' ? '9px' : '8px',
            }}>
              <div>
                <span className="font-medium">1. </span>
                <span>Kartu ini adalah milik resmi sekolah dan hanya berlaku untuk siswa aktif.</span>
              </div>

              <div>
                <span className="font-medium">2. </span>
                <span>Siswa wajib membawa kartu ini setiap hari selama berada di lingkungan sekolah</span>
              </div>

              <div>
                <span className="font-medium">3. </span>
                <span>Kartu ini terintegrasi dengan sistem manajemen sekolah (iSchola)</span>
              </div>

              <div>
                <span className="font-medium">4. </span>
                <span>Apabila kartu ini hilang atau rusak, siswa wajib segera melapor ke bagian Tata Usaha (TU)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KartuPreviewBack;
