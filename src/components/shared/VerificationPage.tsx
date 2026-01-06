import React, { useMemo, useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle, Download, Printer } from 'lucide-react';
import { getDocumentTypeLabel, getDocumentTypeDetailLabel, DocumentType } from '../../utils/verificationPageUtils';

interface VerificationPageProps {
  suratId: string;
  message: string;
  documentType: DocumentType;
  userName?: string;
  userNIP?: string;
  userNISN?: string;
  userKelas?: string;
  signatureTitle?: string;
  timestamp: string;
  documentContent?: React.ReactNode;
}

const VerificationPage: React.FC<VerificationPageProps> = ({
  suratId,
  message,
  documentType,
  userName,
  userNIP,
  userNISN,
  userKelas,
  signatureTitle,
  timestamp,
  documentContent
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const docTypeLabel = getDocumentTypeLabel(documentType);
  const docTypeDetailLabel = getDocumentTypeDetailLabel(documentType);

  const schoolData = useMemo(() => {
    try {
      const data = localStorage.getItem('profilSekolah');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading school data:', error);
    }
    return {
      namaSekolah: 'Sekolah',
      alamat: 'Alamat Sekolah',
      nomorTelepon: '-',
      email: '-'
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('verification-content');
    if (element) {
      const htmlContent = element.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>${docTypeLabel} - Verifikasi</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 12px; max-width: 1200px; margin: 0 auto; }
              @media print { body { background: white; padding: 0; } }
            </style>
          </head>
          <body>
            <div class="container">${htmlContent}</div>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Verifikasi Dokumen Resmi</h1>
              <p className="text-xs sm:text-sm text-slate-600">Sistem Validasi Digital {schoolData.namaSekolah}</p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Verification Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24 max-h-[calc(100vh-150px)] overflow-y-auto">
              {/* Status Header */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-b-2 border-green-200 p-6">
                <div className="flex justify-center mb-4">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse opacity-20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
                  Verifikasi Berhasil
                </h2>
                <p className="text-center text-sm text-slate-700">
                  {docTypeDetailLabel} - Telah ditanda tangani oleh sistem secara digital dan dinyatakan sah
                </p>
              </div>

              {/* Verification Details */}
              <div className="p-6">
                <div className="space-y-1 mb-6">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    Detail Verifikasi
                  </h3>
                  <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                </div>

                <div className="space-y-4">
                  {/* Document Type */}
                  <div className="flex items-start justify-between py-3 border-b border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Jenis Dokumen</span>
                    <span className="text-sm font-semibold text-slate-900 text-right">{docTypeLabel}</span>
                  </div>

                  {/* Document ID */}
                  <div className="flex items-start justify-between py-3 border-b border-slate-200">
                    <span className="text-sm font-medium text-slate-600">ID {docTypeLabel}</span>
                    <span className="text-xs font-mono text-slate-900 text-right break-words ml-2">{suratId}</span>
                  </div>

                  {/* Name */}
                  {userName && (
                    <div className="flex items-start justify-between py-3 border-b border-slate-200">
                      <span className="text-sm font-medium text-slate-600">Nama</span>
                      <span className="text-sm font-semibold text-slate-900 text-right max-w-[60%]">{userName}</span>
                    </div>
                  )}

                  {/* NIP/NISN */}
                  {userNIP && (
                    <div className="flex items-start justify-between py-3 border-b border-slate-200">
                      <span className="text-sm font-medium text-slate-600">NIP</span>
                      <span className="text-xs font-mono text-slate-900 text-right">{userNIP}</span>
                    </div>
                  )}

                  {userNISN && (
                    <div className="flex items-start justify-between py-3 border-b border-slate-200">
                      <span className="text-sm font-medium text-slate-600">NISN</span>
                      <span className="text-xs font-mono text-slate-900 text-right">{userNISN}</span>
                    </div>
                  )}

                  {/* Class */}
                  {userKelas && (
                    <div className="flex items-start justify-between py-3 border-b border-slate-200">
                      <span className="text-sm font-medium text-slate-600">Kelas</span>
                      <span className="text-sm font-semibold text-slate-900 text-right">{userKelas}</span>
                    </div>
                  )}

                  {/* Verification Timestamp */}
                  <div className="flex items-start justify-between py-3 border-b border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Waktu Verifikasi</span>
                    <span className="text-sm font-semibold text-slate-900 text-right">{timestamp}</span>
                  </div>

                  {/* Verification Method */}
                  <div className="flex items-start justify-between py-3 border-b border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Metode Verifikasi</span>
                    <span className="text-sm font-semibold text-slate-900 text-right">QR Code / Digital</span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between py-3 bg-green-50 rounded-lg px-3 border border-green-200">
                    <span className="text-sm font-medium text-slate-600">Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
                      <span className="text-sm font-bold text-green-700">SAH & TERVERIFIKASI</span>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                  <p className="text-xs text-blue-900 leading-relaxed">
                    <strong>Informasi:</strong> Dokumen ini telah diverifikasi dan disahkan oleh sistem secara digital.
                    Nomor verifikasi unik dapat digunakan untuk referensi di masa mendatang.
                  </p>
                </div>

                {/* Signature Title */}
                {signatureTitle && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <p className="text-xs text-amber-900">Ditandatangani oleh</p>
                    <p className="text-sm font-bold text-amber-900 mt-1">{signatureTitle}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-200 p-6 bg-slate-50 space-y-3">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Halaman</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              </div>

              {/* Footer */}
              <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 text-center">
                <p className="text-xs text-slate-600">
                  Dokumen ini telah ditanda tangani secara digital{signatureTitle ? ` oleh ${signatureTitle}` : ' oleh sistem'}
                  dan dinyatakan sah sesuai dengan peraturan yang berlaku.
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  © {new Date().getFullYear()} Sistem Manajemen Sekolah
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Document Content */}
          <div className="lg:col-span-2">
            <div id="verification-content" className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {documentContent ? (
                <div className="p-4 sm:p-6 lg:p-8 max-h-[calc(100vh-150px)] overflow-y-auto">
                  {documentContent}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                  <div className="text-slate-400 mb-4">
                    <FileText className="w-16 h-16 mx-auto opacity-20" />
                  </div>
                  <p className="text-slate-600 font-medium">Konten Dokumen</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Konten dokumen akan ditampilkan di sini
                  </p>
                </div>
              )}
            </div>

            {/* Info Section - Mobile */}
            {isMobile && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-3">Informasi Verifikasi</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>Status: <strong className="text-green-600">SAH & TERVERIFIKASI</strong></p>
                  <p>Jenis: <strong>{docTypeLabel}</strong></p>
                  <p>ID: <strong className="font-mono text-xs break-all">{suratId}</strong></p>
                  <p>Waktu: <strong>{timestamp}</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .sticky { position: static; }
          #verification-content { box-shadow: none; }
          @page { margin: 0; }
        }
      `}</style>
    </div>
  );
};

// Icon component
const FileText = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default VerificationPage;
