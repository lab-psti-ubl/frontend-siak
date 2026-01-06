import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Eye, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import Badge from '../../ui/Badge';
import BuktiPendukungModal from './BuktiPendukungModal';
import { useProfilSekolah } from '../../../hooks/useProfilSekolah';
import { useDataKepsek } from '../../../hooks/useDataKepsek';
import { useGurus } from '../../../hooks/useGurus';
import { SuratIzin, User, Kelas, Guru, Murid } from '../../../types';
import { getBuktiFromLocalStorage } from '../../../utils/fileUploadUtils';
import { openVerificationPage, getVerificationUrl } from '../../../utils/verificationPageUtils';
import { printSuratIzin } from '../../../utils/printSuratIzinUtils';
import { getJenjangShortLabelSync } from '../../../utils/jenjangPendidikanUtils';

interface SuratIzinDisplayProps {
  surat: SuratIzin;
  users: User[];
  kelas: Kelas[];
  getMuridName?: (muridId: string) => string;
  currentUserName?: string;
  showVerificationSection?: boolean;
  waliKelasName?: string;
}

const VerificationQRCode: React.FC<{ suratId: string; verificationUrl: string; ref?: React.Ref<HTMLCanvasElement> }> = React.forwardRef(({ suratId, verificationUrl }, ref) => {
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

const SuratIzinDisplay: React.FC<SuratIzinDisplayProps> = ({
  surat,
  users,
  kelas,
  getMuridName,
  currentUserName,
  showVerificationSection = true,
  waliKelasName
}) => {
  const { profilSekolah } = useProfilSekolah();
  const { dataKepsek } = useDataKepsek();
  const { gurus } = useGurus();
  const [buktiModalOpen, setBuktiModalOpen] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const buktiInfo = useMemo(() => {
    if (!surat.bukti) return { base64: undefined, mimeType: undefined, fileName: undefined };
    
    try {
      // Coba parse sebagai JSON (format baru dari database)
      const parsed = JSON.parse(surat.bukti);
      if (parsed.base64 && parsed.fileName) {
        return {
          base64: parsed.base64,
          mimeType: parsed.mimeType || 'image/jpeg',
          fileName: parsed.fileName
        };
      }
    } catch {
      // Jika bukan JSON, coba cari di localStorage (backward compatibility)
      const bukti = getBuktiFromLocalStorage(surat.bukti);
      if (bukti) {
        return {
          base64: bukti.base64,
          mimeType: bukti.mimeType,
          fileName: bukti.fileName
        };
      }
    }
    
    return { base64: undefined, mimeType: undefined, fileName: undefined };
  }, [surat.bukti]);

  const muridUser = users.find(u => u.id === surat.muridId) as Murid | undefined;
  const muridName = getMuridName ? getMuridName(surat.muridId) : muridUser?.name || 'Tidak diketahui';
  const kelasData = muridUser?.kelasId
    ? kelas.find(k => k.id === muridUser.kelasId)
    : null;
  const kelasName = kelasData?.name || 'Tidak diketahui';
  const waliKelasId = kelasData?.waliKelasId;
  
  // Cari wali kelas dengan prioritas:
  // 1. Dari gurus hook (yang memiliki NIP lengkap)
  // 2. Dari users array (jika ada)
  // 3. Cari guru yang memiliki kelasWali sama dengan kelasId
  let waliKelas: Guru | undefined = undefined;
  
  if (waliKelasId) {
    // Prioritas 1: Cari dari gurus hook
    waliKelas = gurus.find(g => g.id === waliKelasId) as Guru | undefined;
    
    // Prioritas 2: Jika tidak ditemukan, cari dari users array
    if (!waliKelas) {
      const userWaliKelas = users.find(u => u.id === waliKelasId && u.role === 'guru');
      if (userWaliKelas && userWaliKelas.role === 'guru') {
        waliKelas = userWaliKelas as Guru;
      }
    }
  }
  
  // Prioritas 3: Jika masih tidak ditemukan dan ada kelasData, cari dari kelasWali di guru
  if (!waliKelas && kelasData) {
    waliKelas = gurus.find(g => g.kelasWali === kelasData.id) as Guru | undefined;
  }
  
  const waliKelasDisplayName = waliKelasName || waliKelas?.name || '-';

  const generateVerificationUrl = (suratId: string) => {
    const jenisTipe = `surat_izin_${surat.jenis}` as any;
    return getVerificationUrl(suratId, {
      name: muridName,
      nisn: muridUser?.nisn,
      kelas: kelasName
    }, jenisTipe);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      let qrDataUrl: string | undefined;

      if (surat.status === 'diterima' && qrCanvasRef.current) {
        qrDataUrl = qrCanvasRef.current.toDataURL('image/png');
      }

      await printSuratIzin(
        surat,
        muridName,
        kelasName,
        waliKelasDisplayName,
        waliKelas || undefined,
        muridUser,
        qrDataUrl,
        showVerificationSection,
        currentUserName
      );
    } catch (error) {
      console.error('Error printing surat:', error);
      alert('Gagal mencetak surat. Silakan coba lagi.');
    } finally {
      setIsPrinting(false);
    }
  };

  const schoolData = useMemo(() => {
    if (profilSekolah) {
      return {
        namaSekolah: profilSekolah.namaSekolah || 'Sekolah',
        alamat: profilSekolah.alamat || 'Alamat Sekolah',
        nomorTelepon: profilSekolah.nomorTelepon || '-',
        email: profilSekolah.email || '-',
        logoSekolah: profilSekolah.logoSekolah
      };
    }
    return {
      namaSekolah: 'Sekolah',
      alamat: 'Alamat Sekolah',
      nomorTelepon: '-',
      email: '-',
      logoSekolah: undefined
    };
  }, [profilSekolah]);

  const headmasterData = useMemo(() => {
    if (dataKepsek && dataKepsek.length > 0) {
      return dataKepsek[0];
    }
    return null;
  }, [dataKepsek]);

  return (
    <div className="bg-white pb-12 sm:pb-0">
      <div className="flex justify-end mb-4 pr-4">
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
        >
          <Printer className="w-4 h-4" />
          <span>{isPrinting ? 'Memproses...' : 'Print Surat'}</span>
        </button>
      </div>

      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center justify-start mb-2 pl-4">
          {schoolData.logoSekolah ? (
            <img
              src={schoolData.logoSekolah}
              alt="Logo Sekolah"
              className="w-16 h-16 object-contain mr-4 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <span className="text-white font-bold text-xl">{getJenjangShortLabelSync()}</span>
            </div>
          )}
          <div className="text-left">
            <h1 className="text-xl font-bold text-gray-900">{schoolData.namaSekolah}</h1>
            <p className="text-sm text-gray-600">{schoolData.alamat}</p>
            <p className="text-sm text-gray-600">Telp: {schoolData.nomorTelepon} | Email: {schoolData.email}</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-gray-900 underline">
          SURAT {surat.jenis.toUpperCase()}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Nomor: {surat.id.toUpperCase()}/SISWA/{new Date(surat.createdAt).getFullYear()}
        </p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed">
        <p>Yang bertanda tangan di bawah ini:</p>

        <div className="ml-8 space-y-1">
          <div className="flex">
            <span className="w-24 inline-block">Nama</span>
            <span className="mr-2">:</span>
            <span className="font-medium">{muridName}</span>
          </div>
          <div className="flex">
            <span className="w-24 inline-block">Kelas</span>
            <span className="mr-2">:</span>
            <span>{kelasName}</span>
          </div>
          <div className="flex">
            <span className="w-24 inline-block">NISN</span>
            <span className="mr-2">:</span>
            <span>{muridUser?.nisn || 'Tidak diketahui'}</span>
          </div>
        </div>

        <p className="mt-4">
          Dengan ini mengajukan permohonan {surat.jenis} untuk tidak mengikuti kegiatan pembelajaran
          pada tanggal <strong>{new Date(surat.tanggalMulai).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</strong>
          {surat.tanggalMulai !== surat.tanggalSelesai && (
            <span> sampai dengan <strong>{new Date(surat.tanggalSelesai).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</strong></span>
          )}.
        </p>

        {surat.jenis === 'izin_dispen' && (surat.jamMulai || surat.jamSelesai) && (
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500">
            <p className="font-medium mb-2">Jam Izin Dispen:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Jam Mulai: </span>
                <span className="font-medium">{surat.jamMulai || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">Jam Selesai: </span>
                <span className="font-medium">{surat.jamSelesai || '-'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2">Alasan {surat.jenis}:</p>
          <div className="ml-4 p-3 bg-gray-50 border-l-4 border-blue-500 italic">
            "{surat.alasan}"
          </div>
        </div>

        {surat.bukti && (
          <div className="mt-4">
            <p className="mb-2">Bukti pendukung:</p>
            <button
              onClick={() => setBuktiModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              <span className="truncate max-w-xs">{buktiInfo.fileName || 'Bukti Pendukung'}</span>
            </button>
          </div>
        )}

        <p className="mt-6">
          Demikian surat {surat.jenis} ini saya buat dengan sebenar-benarnya.
          Atas perhatian dan kebijaksanaan Bapak/Ibu, saya ucapkan terima kasih.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="text-sm">
          <p>Diajukan pada:</p>
          <p className="font-medium">
            {new Date(surat.createdAt).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
       
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="text-sm text-center">
          <p>Hormat Saya.</p>
        <p className="text-xs text-gray-600 mt-1">Murid</p>
          <div className="mt-12 border-t border-gray-400 pt-1">
            <p className="font-medium">{muridName}</p>
          </div>
        </div>
        <div className="text-sm text-center">
          <p>Diketahui,</p>
          <p className="text-xs text-gray-600 mt-1">Wali Kelas</p>
          <div className="mt-12 border-t border-gray-400 pt-1">
            <p className="font-medium text-sm">{waliKelasDisplayName}</p>
            <p className="text-xs text-gray-600">NIP: {waliKelas?.nip || '-'}</p>
          </div>
          {surat.status === 'diterima' && (
            <div className="mt-6 flex flex-col items-center">
              <p className="text-xs font-medium text-gray-700 mb-2">Tanda Tangan Digital</p>
              <div className="bg-white p-3 border-2 border-green-400 rounded inline-block">
                <VerificationQRCode
                  ref={qrCanvasRef}
                  suratId={surat.id}
                  verificationUrl={generateVerificationUrl(surat.id)}
                />
              </div>
              <button
                onClick={() => openVerificationPage(
                  surat.id,
                  'Telah ditanda tangani oleh sistem secara digital dan dinyatakan sah',
                  `surat_izin_${surat.jenis}` as any,
                  {
                    name: muridName,
                    nisn: muridUser?.nisn,
                    kelas: kelasName,
                    signatureTitle: 'Wali Kelas'
                  }
                )}
                className="text-xs text-green-600 font-medium mt-2 hover:text-green-700 cursor-pointer transition-colors duration-200 underline hover:no-underline"
              >
                Sah & Terverifikasi Walikelas
              </button>
            </div>
          )}
        </div>
      </div>

      {showVerificationSection && surat.status !== 'menunggu' && (
        <div className="mt-8 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
          <h3 className="font-bold text-center mb-4">STATUS VERIFIKASI WALI KELAS</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-center">
            <div>
              <p><strong>Status:</strong></p>
              <div className="mt-1">
                <Badge variant={surat.status === 'diterima' ? 'success' : 'danger'}>
                  {surat.status === 'diterima' ? 'DISETUJUI' : 'DITOLAK'}
                </Badge>
              </div>
            </div>
            <div>
              <p><strong>Tanggal Verifikasi:</strong></p>
              <p>{surat.verifiedAt ? new Date(surat.verifiedAt).toLocaleDateString('id-ID') : '-'}</p>
            </div>
          </div>
          {surat.keterangan && (
            <div className="mt-3">
              <p><strong>Keterangan Wali Kelas:</strong></p>
              <p className="mt-1 p-2 bg-white border rounded italic">"{surat.keterangan}"</p>
            </div>
          )}
          {currentUserName && (
            <div className="mt-4 text-center">
              <p className="text-sm">Wali Kelas</p>
              <div className="mt-8 border-t border-gray-400 pt-1 inline-block">
                <p className="font-medium">{currentUserName}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <BuktiPendukungModal
        isOpen={buktiModalOpen}
        onClose={() => setBuktiModalOpen(false)}
        buktiName={buktiInfo.fileName || surat.bukti || 'Bukti Pendukung'}
        buktiData={buktiInfo.base64}
        buktiId={surat.bukti}
        mimeType={buktiInfo.mimeType}
      />
    </div>
  );
};

export default SuratIzinDisplay;
