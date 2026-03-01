import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import Button from './ui/Button';

const AUTO_RELOAD_SECONDS = 60;

const ServerUnavailablePage: React.FC = () => {
  const [countdown, setCountdown] = useState(AUTO_RELOAD_SECONDS);
  const [isRetrying, setIsRetrying] = useState(false);

  const doReload = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      doReload();
      return;
    }
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown, doReload]);

  const handleRetry = () => {
    setIsRetrying(true);
    doReload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card with glass effect */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Icon with pulse animation */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-400/40 mb-6 animate-bounce-slow">
            <WifiOff className="w-12 h-12 text-amber-400" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Server Sedang Tidak Tersedia
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Saat ini server sedang mati atau tidak dapat dihubungi. Silakan lakukan reload secara berkala atau tunggu beberapa menit lagi.
          </p>

          {/* Countdown ring */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-600"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-400 transition-all duration-1000 ease-linear"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${(countdown / AUTO_RELOAD_SECONDS) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xl font-bold text-white tabular-nums">
              {countdown}
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-6">
            Halaman akan otomatis memuat ulang dalam <strong className="text-amber-400">{countdown}</strong> detik
          </p>

          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Memuat ulang...' : 'Coba Sekarang'}
          </Button>
        </div>

        <p className="text-slate-500 text-xs text-center mt-4">
          Jika masalah berlanjut, periksa koneksi internet atau hubungi administrator.
        </p>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in.fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .slide-in-from-bottom-4 {
          --tw-enter-translate-y: 1rem;
        }
      `}</style>
    </div>
  );
};

export default ServerUnavailablePage;
