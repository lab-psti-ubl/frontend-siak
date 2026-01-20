import React, { useState, useEffect } from 'react';
import { QrCode, Download, Copy, RefreshCw, User, School, Printer as Print } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useKelas } from '../../hooks/useKelas';
import { useSantri } from '../../hooks/useSantri';
import { useKelasTahfiz } from '../../hooks/useKelasTahfiz';
import { generateQRCodeData, generateQRCodeURL, downloadQRCode } from '../../utils/qrCodeGenerator';

const QRCodeMurid: React.FC = () => {
  const { user } = useAuth();
  const { kelas } = useKelas();
  const { santri } = useSantri();
  const { kelasTahfiz } = useKelasTahfiz();
  const [copied, setCopied] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Check if user is a santri that is NOT from murid collection
  const santriUser = user?.id ? santri.find(s => s.id === user.id) : null;
  const isSantriNotFromMurid = santriUser && (santriUser as any).isFromMurid === false;
  
  // Get tahfiz classes for this santri
  const myTahfizClasses = isSantriNotFromMurid && user?.id
    ? kelasTahfiz.filter(cls => cls.santriIds.includes(user.id))
    : [];

  const myKelas = kelas.find(k => k.id === user?.kelasId);
  
  // For santri not from murid, show tahfiz classes; otherwise show regular class
  const displayKelasName = isSantriNotFromMurid && myTahfizClasses.length > 0
    ? myTahfizClasses.map(c => c.namaKelas).join(', ')
    : myKelas?.name || 'Tidak ada';

  useEffect(() => {
    const generateQR = async () => {
      if (user) {
        setLoading(true);
        try {
          // For santri not from murid, use empty string or first tahfiz class ID as kelasId
          const kelasIdForQR = isSantriNotFromMurid 
            ? (myTahfizClasses.length > 0 ? myTahfizClasses[0].id : '')
            : (user.kelasId || '');
          const qrData = generateQRCodeData(user.id, user.nisn || '', user.name, kelasIdForQR);
          const url = await generateQRCodeURL(qrData, 400);
          setQrCodeURL(url);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
        setLoading(false);
      }
    };

    generateQR();
  }, [user, isSantriNotFromMurid, myTahfizClasses]);

  const handleCopyQRData = () => {
    if (user) {
      const kelasIdForQR = isSantriNotFromMurid 
        ? (myTahfizClasses.length > 0 ? myTahfizClasses[0].id : '')
        : (user.kelasId || '');
      const qrData = generateQRCodeData(user.id, user.nisn || '', user.name, kelasIdForQR);
      navigator.clipboard.writeText(qrData).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy QR data:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = qrData;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
        }
        document.body.removeChild(textArea);
      });
    }
  };

  const handleDownloadQR = async () => {
    if (user) {
      try {
        const kelasIdForQR = isSantriNotFromMurid 
          ? (myTahfizClasses.length > 0 ? myTahfizClasses[0].id : '')
          : (user.kelasId || '');
        const qrData = generateQRCodeData(user.id, user.nisn || '', user.name, kelasIdForQR);
        await downloadQRCode(qrData, `qr-code-${user.name.replace(/\s+/g, '-')}`);
      } catch (error) {
        console.error('Error downloading QR code:', error);
      }
    }
  };

  const handlePrintQR = () => {
    if (!qrCodeURL || !user) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${user.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .print-container {
              text-align: center;
              max-width: 600px;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 30px;
              background: white;
            }
            .student-info {
              margin-bottom: 30px;
            }
            .student-info h2 {
              color: #333;
              margin-bottom: 15px;
              font-size: 24px;
              font-weight: bold;
            }
            .student-info p {
              margin: 8px 0;
              font-size: 16px;
              color: #333;
            }
            .student-info strong {
              font-weight: bold;
            }
            .qr-code {
              margin: 30px 0;
            }
            .qr-code img {
              max-width: 350px;
              width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              font-size: 14px;
              color: #666;
            }
            .footer p {
              margin: 5px 0;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="qr-container">
              <div class="student-info">
                <h2>QR Code Absensi</h2>
                <p><strong>Nama:</strong> ${user.name}</p>
                <p><strong>NISN:</strong> ${user.nisn}</p>
                <p><strong>Kelas:</strong> ${displayKelasName}</p>
              </div>
              <div class="qr-code">
                <img src="${qrCodeURL}" alt="QR Code" />
              </div>
              <div class="footer">
                <p>Sistem Absensi Sekolah</p>
                <p>Generated: ${new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      }, 250);
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 -m-6 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* QR Code Card - Larger on desktop */}
          <div className="xl:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="text-center space-y-6 p-6 sm:p-8">
                {/* Title */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800">QR Code Absensi</h3>
                  <p className="text-slate-600 text-sm">Scan untuk mencatat kehadiran Anda</p>
                </div>

                {/* QR Code Display with Decorative Elements */}
                <div className="relative inline-block">
                  {/* Decorative corners */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-lg"></div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-lg"></div>
                  <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-lg"></div>
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-lg"></div>

                  <div className="bg-gradient-to-br from-white to-slate-50 p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-slate-200">
                    {loading ? (
                      <div className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
                          <QrCode className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600 animate-pulse" />
                        </div>
                      </div>
                    ) : qrCodeURL ? (
                      <img
                        src={qrCodeURL}
                        alt="QR Code"
                        className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center text-slate-400">
                        <QrCode size={96} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleDownloadQR}
                      variant="secondary"
                      fullWidth
                      disabled={!qrCodeURL}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={18} />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">DL</span>
                    </Button>
                    <Button
                      onClick={handlePrintQR}
                      variant="secondary"
                      fullWidth
                      disabled={!qrCodeURL}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Print size={18} />
                      <span>Print</span>
                    </Button>
                  </div>

                  <Button
                    onClick={handleCopyQRData}
                    variant="secondary"
                    fullWidth
                    className={`flex items-center justify-center gap-2 border-2 transition-all duration-300 ${
                      copied
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 shadow-lg'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <Copy size={18} />
                    <span>{copied ? 'Tersalin!' : 'Copy QR Data'}</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Info Card */}
          <div className="xl:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl h-full">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">Informasi Identitas</h3>
                </div>

                <div className="space-y-3">
                  <div className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-700 mb-1">Nama Lengkap</p>
                        <p className="font-semibold text-blue-900 truncate">{user?.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <QrCode className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-emerald-700 mb-1">NISN</p>
                        <p className="font-semibold text-emerald-900 truncate">{user?.nisn}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <School className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-amber-700 mb-1">Kelas</p>
                        <p className="font-semibold text-amber-900 truncate">{displayKelasName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <RefreshCw className={`w-5 h-5 text-white ${!qrCodeURL ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 mb-1">Status QR Code</p>
                        <p className="font-semibold text-slate-900">
                          <span className={`inline-flex items-center gap-2 ${qrCodeURL ? 'text-green-600' : 'text-amber-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${qrCodeURL ? 'bg-green-600 animate-pulse' : 'bg-amber-600'}`}></span>
                            {qrCodeURL ? 'Aktif' : 'Generating...'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Guide */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                  <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    Cara Menggunakan
                  </h4>
                  <ul className="text-xs sm:text-sm text-amber-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">1.</span>
                      <span>Tunjukkan QR Code saat guru membuka sesi absensi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">2.</span>
                      <span>Pastikan QR Code dalam kondisi jelas dan tidak rusak</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">3.</span>
                      <span>QR Code hanya berlaku saat sesi absensi dibuka</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">4.</span>
                      <span>Jangan berbagi QR Code dengan orang lain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">5.</span>
                      <span>Download atau print QR Code untuk backup</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>


      </div>
    </div>
  );
};

export default QRCodeMurid;