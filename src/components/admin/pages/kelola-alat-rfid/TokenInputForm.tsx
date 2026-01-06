import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { apiService } from '../../../../services/apiService';
import { AlatRFID } from '../../../../types';

interface TokenInputFormProps {
  onTokenValid: (alat: AlatRFID, token: string) => void;
}

const TokenInputForm: React.FC<TokenInputFormProps> = ({ onTokenValid }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!token.trim()) {
      setError('Token tidak boleh kosong');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.getAlatRFIDByToken(token.trim());
      
      if (response.success && response.alatRfid) {
        const alat = response.alatRfid;
        
        if (alat.status === 'nonaktif') {
          setError('Alat RFID ini telah dinonaktifkan. Hubungi admin untuk aktivasi kembali.');
          setToken('');
        } else {
          // Token valid, kirim data alat ke parent
          onTokenValid(alat, token.trim());
        }
      } else {
        setError('Token tidak valid. Silakan coba lagi.');
        setToken('');
      }
    } catch (error: any) {
      console.error('Error validating token:', error);
      setError(error.message || 'Token tidak valid. Silakan coba lagi.');
      setToken('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <div className="p-6 sm:p-7 md:p-8">
          <div className="flex justify-center mb-5 sm:mb-6 md:mb-8">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3.5 sm:p-4 rounded-full shadow-md">
              <Lock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 mb-2 sm:mb-3">
            Dashboard Monitoring RFID
          </h1>
          <p className="text-center text-slate-600 text-sm sm:text-base mb-6 sm:mb-8">
            Masukkan token untuk mengakses dashboard scanning
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Token Akses
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Masukkan token alat RFID..."
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                }`}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3 animate-pulse">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-blue-700">
                Token ini adalah kode unik untuk perangkat RFID Anda. Periksa kembali di panel manajemen alat.
              </p>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={!token.trim() || isLoading}
              className="mt-6 sm:mt-7"
            >
              {isLoading ? 'Memverifikasi...' : 'Akses Dashboard'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => window.close()}
            >
              Tutup
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6 sm:mt-7 md:mt-8 font-medium">
            Halaman ini aman dan hanya dapat diakses dengan token yang benar
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TokenInputForm;

