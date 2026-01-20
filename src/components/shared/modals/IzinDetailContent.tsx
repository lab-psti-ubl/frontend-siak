import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Eye, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import Badge from '../../ui/Badge';
import BuktiPendukungModal from './BuktiPendukungModal';
import { IzinGuru, User, JadwalPelajaran, MataPelajaran } from '../../../types';
import { getGuruNameById, getHariFromDate } from '../../guru/pages/izin-guru/utils/izinGuruUtils';
import { openVerificationPage, getVerificationUrl } from '../../../utils/verificationPageUtils';
import { printIzinGuru } from '../../../utils/printSuratIzinUtils';
import { getJenjangShortLabelSync } from '../../../utils/jenjangPendidikanUtils';
import { useProfilSekolah } from '../../../hooks/useProfilSekolah';
import { useJadwalPelajaran } from '../../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../../hooks/useMataPelajaran';
import { useGurus } from '../../../hooks/useGurus';
import { useLanguage } from '../../../context/LanguageContext';

interface IzinDetailContentProps {
  izin: IzinGuru;
  user: User | null;
  showVerificationStatus?: boolean;
}

const VerificationQRCode: React.FC<{ izinId: string; verificationUrl: string; ref?: React.Ref<HTMLCanvasElement> }> = React.forwardRef(({ izinId, verificationUrl }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = (ref && 'current' in ref) ? ref.current : canvasRef.current;
    if (canvas) {
      QRCode.toCanvas(canvas, verificationUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 150,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    }
  }, [verificationUrl, ref]);

  return <canvas ref={ref || canvasRef} className="w-auto h-auto" />;
});

const IzinDetailContent: React.FC<IzinDetailContentProps> = ({ izin, user, showVerificationStatus = true }) => {
  const { t, language } = useLanguage();
  const { profilSekolah } = useProfilSekolah();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { mataPelajaran } = useMataPelajaran();
  const { gurus } = useGurus();
  
  const [buktiModalOpen, setBuktiModalOpen] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const dateLocale = language === 'ms' ? 'ms-MY' : 'id-ID';

  const buktiInfo = useMemo(() => {
    if (!izin.bukti) return { base64: undefined, mimeType: undefined, fileName: undefined };
    
    // Try to parse as JSON (new format from database)
    try {
      const buktiData = JSON.parse(izin.bukti);
      if (buktiData.base64 && buktiData.fileName) {
        return {
          base64: buktiData.base64,
          mimeType: buktiData.mimeType || 'image/jpeg',
          fileName: buktiData.fileName
        };
      }
    } catch {
      // Old format: bukti is just a uniqueId, skip
    }
    
    return { base64: undefined, mimeType: undefined, fileName: undefined };
  }, [izin.bukti]);

  const schoolData = useMemo(() => {
    if (profilSekolah) {
      return {
        namaSekolah: profilSekolah.namaSekolah || t('izinGuru.preview.sekolah'),
        alamat: profilSekolah.alamat || t('izinGuru.preview.alamatSekolah'),
        nomorTelepon: profilSekolah.nomorTelepon || '-',
        email: profilSekolah.email || '-',
        logoSekolah: profilSekolah.logoSekolah || ''
      };
    }
    return {
      namaSekolah: t('izinGuru.preview.sekolah'),
      alamat: t('izinGuru.preview.alamatSekolah'),
      nomorTelepon: '-',
      email: '-',
      logoSekolah: ''
    };
  }, [profilSekolah, t]);

  const getJadwalInfo = (jadwalId: string) => {
    const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
    if (!jadwal) return null;

    const mapel = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId);

    return {
      jadwal,
      mapelName: mapel?.name || jadwal.mataPelajaranId
    };
  };

  const generateVerificationUrl = (izinId: string) => {
    const jenisTipe = `surat_izin_${izin.jenis}` as any;
    return getVerificationUrl(izinId, {
      name: user?.name,
      nip: user?.nip
    }, jenisTipe);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      let qrDataUrl: string | undefined;

      if (izin.status === 'diterima' && qrCanvasRef.current) {
        qrDataUrl = qrCanvasRef.current.toDataURL('image/png');
      }

      await printIzinGuru(
        izin,
        user,
        qrDataUrl,
        showVerificationStatus
      );
    } catch (error) {
      console.error('Error printing izin:', error);
      alert(t('izinGuru.preview.gagalMencetakSurat'));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="bg-white pb-12 sm:pb-0">
      <div className="flex justify-end mb-4 pr-4">
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
        >
          <Printer className="w-4 h-4" />
          <span>{isPrinting ? t('izinGuru.memproses') : t('izinGuru.preview.printSurat')}</span>
        </button>
      </div>

      {/* Header Surat */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center justify-start pl-4 mb-2">
          <div className="w-16 h-16 mr-4 flex-shrink-0 flex items-center justify-center">
            {schoolData.logoSekolah ? (
              <img
                src={schoolData.logoSekolah}
                alt={t('izinGuru.preview.logoSekolah')}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">{getJenjangShortLabelSync()}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-gray-900">{schoolData.namaSekolah}</h1>
            <p className="text-sm text-gray-600">{schoolData.alamat}</p>
            <p className="text-sm text-gray-600">{t('izinGuru.preview.telp')}: {schoolData.nomorTelepon} | {t('izinGuru.preview.email')}: {schoolData.email}</p>
          </div>
        </div>
      </div>

      {/* Judul Surat */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-gray-900 underline">
          {t('izinGuru.preview.suratPengajuan')} {izin.jenis === 'izin_dispen' ? t('izinGuru.izinDispen').toUpperCase() : t(`izinGuru.jenis.${izin.jenis}`).toUpperCase()}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {t('izinGuru.preview.nomor')}: {izin.id.toUpperCase()}/GURU/{new Date(izin.createdAt).getFullYear()}
        </p>
      </div>

      {/* Isi Surat */}
      <div className="space-y-4 text-sm leading-relaxed">
        <p>{t('izinGuru.preview.yangBertandaTangan')}</p>

        <div className="ml-8 space-y-1">
          <div className="flex">
            <span className="w-24 inline-block">{t('izinGuru.preview.nama')}</span>
            <span className="mr-2">:</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex">
            <span className="w-24 inline-block">{t('izinGuru.preview.nip')}</span>
            <span className="mr-2">:</span>
            <span>{user?.nip}</span>
          </div>
          <div className="flex">
            <span className="w-24 inline-block">{t('izinGuru.preview.jabatan')}</span>
            <span className="mr-2">:</span>
            <span>{t('izinGuru.preview.guru')} {user?.isWaliKelas ? ` / ${t('izinGuru.preview.waliKelas')}` : ''}</span>
          </div>
        </div>

        <p className="mt-4">
          {t('izinGuru.preview.denganIniMengajukan', { jenis: izin.jenis === 'izin_dispen' ? t('izinGuru.izinDispen') : t(`izinGuru.jenis.${izin.jenis}`) })}
          {t('izinGuru.preview.untukTidakMelaksanakan')}
          {t('izinGuru.preview.padaTanggal')} <strong>{new Date(izin.tanggalMulai).toLocaleDateString(dateLocale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</strong>
          {izin.jenis === 'izin_dispen' && izin.jamMulai && izin.jamSelesai && (
            <span> {t('izinGuru.preview.dariPukul')} <strong>{izin.jamMulai}</strong> {t('izinGuru.preview.sampaiDenganPukul')} <strong>{izin.jamSelesai}</strong></span>
          )}
          {izin.jenis !== 'izin_dispen' && izin.tanggalMulai !== izin.tanggalSelesai && (
            <span> {t('izinGuru.preview.sampaiDengan')} <strong>{new Date(izin.tanggalSelesai).toLocaleDateString(dateLocale, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</strong></span>
          )}.
        </p>

        <div className="mt-4">
          <p className="mb-2">{t('izinGuru.preview.alasan')} {izin.jenis === 'izin_dispen' ? t('izinGuru.izinDispen') : t(`izinGuru.jenis.${izin.jenis}`)}:</p>
          <div className="ml-4 p-3 bg-gray-50 border-l-4 border-blue-500 italic">
            "{izin.alasan}"
          </div>
        </div>

        {izin.guruPenggantiList && izin.guruPenggantiList.length > 0 && (
          <div className="mt-4">
            <p className="mb-2">{t('izinGuru.preview.guruPenggantiPerJadwal')}:</p>
            <div className="ml-4 space-y-3">
              {Object.entries(
                izin.guruPenggantiList.reduce((acc, item) => {
                  const hari = getHariFromDate(item.tanggal);
                  const hariCapitalized = hari.charAt(0).toUpperCase() + hari.slice(1);
                  if (!acc[hariCapitalized]) {
                    acc[hariCapitalized] = [];
                  }
                  acc[hariCapitalized].push(item);
                  return acc;
                }, {} as Record<string, typeof izin.guruPenggantiList>)
              ).map(([hari, items]) => (
                <div key={hari} className="p-3 bg-blue-50 border-l-4 border-blue-500">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{hari}</p>
                  <div className="space-y-1">
                    {items.map((item, index) => {
                      const jadwalInfo = getJadwalInfo(item.jadwalId);
                      return (
                        <div key={index} className="text-sm text-gray-800">
                          <span className="font-medium">{getGuruNameById(item.guruPenggantiId, gurus)}</span>
                          {jadwalInfo && (
                            <span className="text-gray-700 ml-1">
                              - {jadwalInfo.mapelName} | {jadwalInfo.jadwal.jamMulai} - {jadwalInfo.jadwal.jamSelesai}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {izin.bukti && (
          <div className="mt-4">
            <p className="mb-2">{t('izinGuru.preview.buktiPendukung')}:</p>
            <button
              onClick={() => setBuktiModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              <span className="truncate max-w-xs">{buktiInfo.fileName || t('izinGuru.preview.buktiPendukung')}</span>
            </button>
          </div>
        )}

        <p className="mt-6">
          {t('izinGuru.preview.demikianSurat', { jenis: izin.jenis === 'izin_dispen' ? t('izinGuru.izinDispen') : t(`izinGuru.jenis.${izin.jenis}`) })}
          {t('izinGuru.preview.atasPerhatian')}
        </p>
      </div>

      {/* Tanggal dan Tanda Tangan */}
      <div className="mt-8 flex justify-between">
        <div className="text-sm">
          <p>{t('izinGuru.preview.diajukanPada')}:</p>
          <p className="font-medium">
            {new Date(izin.createdAt).toLocaleDateString(dateLocale, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="text-sm text-center">
          <p>{t('izinGuru.preview.hormatSaya')},</p>
          <div className="mt-12 border-t border-gray-400 pt-1">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500">{t('izinGuru.preview.nip')}: {user?.nip}</p>
          </div>
        </div>
      </div>

      {/* Status Verifikasi Admin */}
      {showVerificationStatus && izin.status !== 'menunggu' && (
        <div className="mt-8 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
          <h3 className="font-bold text-center mb-4">{t('izinGuru.preview.statusVerifikasiAdmin')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-center">
            <div>
              <p><strong>{t('izinGuru.preview.status')}:</strong></p>
              <Badge variant={izin.status === 'diterima' ? 'success' : 'danger'} className="mt-1">
                {izin.status === 'diterima' ? t('izinGuru.preview.disetujui') : t('izinGuru.preview.ditolak')}
              </Badge>
            </div>
            <div>
              <p><strong>{t('izinGuru.preview.tanggalVerifikasi')}:</strong></p>
              <p>{izin.verifiedAt ? new Date(izin.verifiedAt).toLocaleDateString(dateLocale) : '-'}</p>
            </div>
          </div>
          {izin.keterangan && (
            <div className="mt-3">
              <p><strong>{t('izinGuru.preview.keteranganAdmin')}:</strong></p>
              <p className="mt-1 p-2 bg-white border rounded italic">"{izin.keterangan}"</p>
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-sm">{t('izinGuru.preview.administrator')}</p>
            {izin.status === 'diterima' && (
              <div className="mt-6 flex flex-col items-center">
                <p className="text-xs font-medium text-gray-700 mb-2">{t('izinGuru.preview.tandaTanganDigital')}</p>
                <div className="bg-white p-3 border-2 border-green-400 rounded inline-block">
                  <VerificationQRCode
                    ref={qrCanvasRef}
                    izinId={izin.id}
                    verificationUrl={generateVerificationUrl(izin.id)}
                  />
                </div>
                <button
                  onClick={() => openVerificationPage(
                    izin.id,
                    t('izinGuru.preview.telahDitandaTangani'),
                    `surat_izin_${izin.jenis}` as any,
                    {
                      name: user?.name,
                      nip: user?.nip,
                      signatureTitle: t('izinGuru.preview.adminSekolah')
                    }
                  )}
                  className="text-xs text-green-600 font-medium mt-2 hover:text-green-700 cursor-pointer transition-colors duration-200 underline hover:no-underline"
                >
                  {t('izinGuru.preview.sahTerverifikasiAdmin')}
                </button>
              </div>
            )}
            <div className="mt-8 border-t border-gray-400 pt-1 inline-block">
              <p className="font-medium">{t('izinGuru.preview.adminSekolah')}</p>
            </div>
          </div>
        </div>
      )}

      <BuktiPendukungModal
        isOpen={buktiModalOpen}
        onClose={() => setBuktiModalOpen(false)}
        buktiName={buktiInfo.fileName || izin.bukti || ''}
        buktiData={buktiInfo.base64}
        buktiId={izin.bukti}
        mimeType={buktiInfo.mimeType}
      />
    </div>
  );
};

export default IzinDetailContent;
