import React, { useState, useMemo } from 'react';
import { CreditCard, Download } from 'lucide-react';
import Button from '../../../ui/Button';
import { User as UserType, Kelas, Jurusan } from '../../../../types';
import { generateMuridKartuPelajar } from '../../../../utils/kartuPelajarUtils';
import { useBackgroundKTA } from '../../../../hooks/useBackgroundKTA';
import KartuPreviewFront from './KartuPreviewFront';
import KartuPreviewBack from './KartuPreviewBack';
import { shouldShowJurusanSync } from '../../../../utils/jenjangPendidikanUtils';

interface KartuPelajarTabProps {
  user: UserType | null;
  myKelas: Kelas | undefined;
  myJurusan: Jurusan | undefined;
}

const KartuPelajarTab: React.FC<KartuPelajarTabProps> = ({ user, myKelas, myJurusan }) => {
  const [isGeneratingKartu, setIsGeneratingKartu] = useState(false);
  const [orientation, setOrientation] = useState<'potrait' | 'landscape'>('potrait');
  const { backgroundKTA } = useBackgroundKTA();
  const showJurusan = shouldShowJurusanSync();

  const backgroundDepanMurid = useMemo(() => {
    return backgroundKTA?.backgroundDepanMuridBase64 || undefined;
  }, [backgroundKTA]);

  const backgroundBelakangMurid = useMemo(() => {
    return backgroundKTA?.backgroundBelakangMuridBase64 || undefined;
  }, [backgroundKTA]);

  const handleDownloadKartuPelajar = async () => {
    if (!user || !myKelas) {
      alert('Data tidak lengkap untuk membuat kartu pelajar');
      return;
    }

    if (showJurusan && !myJurusan) {
      alert('Data jurusan tidak tersedia');
      return;
    }

    setIsGeneratingKartu(true);
    try {
      await generateMuridKartuPelajar(user, myKelas, myJurusan, backgroundDepanMurid, backgroundBelakangMurid, orientation);
      alert('Kartu pelajar berhasil diunduh!');
    } catch (error) {
      console.error('Error generating kartu pelajar:', error);
      alert('Terjadi kesalahan saat membuat kartu pelajar. Silakan coba lagi.');
    } finally {
      setIsGeneratingKartu(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 sm:pb-6 border-b border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Kartu Pelajar</h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">Pratinjau dan unduh kartu pelajar digital Anda</p>
      </div>

      {myKelas && user && (!showJurusan || myJurusan) ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-200">
              <p className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Nama Lengkap</p>
              <p className="text-base sm:text-lg font-bold text-blue-900 truncate">{user.name}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-emerald-200">
              <p className="text-xs sm:text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">NISN</p>
              <p className="text-base sm:text-lg font-bold text-emerald-900 truncate">{user.nisn}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-amber-200">
              <p className="text-xs sm:text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">Kelas</p>
              <p className="text-base sm:text-lg font-bold text-amber-900 truncate">{myKelas.name}</p>
            </div>
            {showJurusan && myJurusan && (
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-violet-200">
                <p className="text-xs sm:text-sm font-semibold text-violet-700 uppercase tracking-wide mb-2">Jurusan</p>
                <p className="text-base sm:text-lg font-bold text-violet-900 truncate">{myJurusan.name}</p>
              </div>
            )}
          </div>

          {/* Orientation Selector */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
              Pilih Orientasi KTA
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
                <span className="ml-2 text-sm sm:text-base text-slate-700 font-medium">Potrait</span>
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
                <span className="ml-2 text-sm sm:text-base text-slate-700 font-medium">Landscape</span>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {orientation === 'potrait' 
                ? 'KTA depan potrait dengan informasi sekolah di belakang' 
                : 'KTA depan landscape dengan informasi sekolah di belakang'}
            </p>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Depan Kartu</p>
              <KartuPreviewFront 
                user={user} 
                myKelas={myKelas} 
                myJurusan={myJurusan} 
                backgroundImage={orientation === 'potrait' ? backgroundDepanMurid : backgroundBelakangMurid}
                orientation={orientation}
              />
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Belakang Kartu</p>
              <KartuPreviewBack 
                user={user} 
                myKelas={myKelas} 
                myJurusan={myJurusan} 
                backgroundImage={orientation === 'potrait' ? backgroundDepanMurid : backgroundBelakangMurid}
                orientation={orientation}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleDownloadKartuPelajar}
              disabled={isGeneratingKartu}
              size="lg"
              className="w-full sm:w-auto flex justify-center items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isGeneratingKartu ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                  <span className="text-sm sm:text-base font-medium">Membuat Kartu...</span>
                </>
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  <span className="text-sm sm:text-base font-medium">Download Kartu Pelajar</span>
                </>
              )}
            </Button>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex gap-3 mb-4">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs sm:text-sm font-bold">!</span>
              </div>
              <h4 className="font-bold text-amber-900 text-base sm:text-lg">Informasi Penting</h4>
            </div>
            <ul className="text-xs sm:text-sm text-amber-800 space-y-2 ml-9">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Kartu pelajar berisi QR Code untuk absensi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Wajib dibawa setiap hari ke sekolah</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Jangan meminjamkan kartu kepada orang lain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Laporkan segera jika kartu hilang</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Download dalam format ZIP (depan & belakang)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Print dengan ukuran kartu standar (85.6 x 53.98 mm)</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Data Tidak Lengkap</h4>
          <p className="text-sm sm:text-base text-slate-600">
            Tidak dapat membuat kartu pelajar karena data kelas{showJurusan ? ' atau jurusan' : ''} tidak tersedia.
          </p>
        </div>
      )}
    </div>
  );
};

export default KartuPelajarTab;
