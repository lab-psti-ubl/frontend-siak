import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { AlatRFID, AbsensiGuru, Absensi, PengaturanAbsen, Kelas, ProfilSekolah } from '../../../../types';
import { showToast } from '../../../ui/ToastContainer';
import RFIDTokenAuth from './RFIDTokenAuth';
import TokenInputForm from './TokenInputForm';
import { apiService } from '../../../../services/apiService';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { useProfilSekolah } from '../../../../hooks/useProfilSekolah';
import { useIzinGuru } from '../../../../hooks/useIzinGuru';
import ScanningArea from './components/ScanningArea';
import ScanHistoryLog from './components/ScanHistoryLog';
import ScanResultModal from './components/ScanResultModal';
import {
  ScanResult,
  ScanLogEntry,
  generateSpeechMessage,
} from './utils/rfidMonitoringUtils';
import { processScan } from './utils/scanProcessing';

interface RFIDMonitoringDashboardProps {
  alatId?: string;
  token?: string;
  onClose?: () => void;
}

const RFIDMonitoringDashboard: React.FC<RFIDMonitoringDashboardProps> = ({ alatId: propAlatId, token: propToken, onClose }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { pengaturanAbsen, activePengaturanAbsen: activePengaturanAbsenFromHook } = usePengaturanAbsen();
  const { profilSekolah } = useProfilSekolah();
  const { izinGuru } = useIzinGuru();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alatRfid, setAlatRfid] = useState<AlatRFID[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [absensiGuru, setAbsensiGuru] = useState<AbsensiGuru[]>([]);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);
  const [lastScannedData, setLastScannedData] = useState('');
  const [currentAlat, setCurrentAlat] = useState<AlatRFID | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const alatId = propAlatId || searchParams.get('alatId');
  const token = propToken || searchParams.get('token');

  useEffect(() => {
    const fetchAlatRFID = async () => {
      try {
        const response = await apiService.getAllAlatRFID();
        if (response.success && response.alatRfid) {
          setAlatRfid(response.alatRfid);
        }
      } catch (error) {
        console.error('Error fetching alat RFID:', error);
      }
    };

    fetchAlatRFID();
  }, []);

  useEffect(() => {
    fetchAbsensiGuru();
    fetchAbsensi();
  }, []);

  const fetchAbsensiGuru = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiService.getAbsensiGuruByTanggal(today);
      if (response.success && response.absensiGuru) {
        setAbsensiGuru(response.absensiGuru);
      }
    } catch (error) {
      console.error('Error fetching absensi guru:', error);
    }
  };

  const fetchAbsensi = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiService.getAllAbsensi({ tanggal: today });
      if (response.success && response.absensi) {
        setAbsensi(response.absensi);
      }
    } catch (error) {
      console.error('Error fetching absensi:', error);
    }
  };

  // Combine gurus and murid into users array
  useEffect(() => {
    setUsers([...gurus, ...murid]);
  }, [gurus, murid]);

  useEffect(() => {
    if (alatId) {
      const alat = alatRfid.find(a => a.id === alatId);
      setCurrentAlat(alat || null);
    } else if (token) {
      // If we have token but no alatId, try to find alat by token
      const alat = alatRfid.find(a => a.token === token);
      if (alat) {
        setCurrentAlat(alat);
        // Update URL with alatId
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('alatId', alat.id);
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [alatId, token, alatRfid, searchParams, setSearchParams]);

  // Handle token validation from TokenInputForm
  const handleTokenValid = (alat: AlatRFID, validatedToken: string) => {
    // Add alat to alatRfid state if not already present
    setAlatRfid(prev => {
      const exists = prev.find(a => a.id === alat.id);
      if (!exists) {
        return [...prev, alat];
      }
      return prev;
    });
    setCurrentAlat(alat);
    // Update URL with alatId and token
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('alatId', alat.id);
    newSearchParams.set('token', validatedToken);
    setSearchParams(newSearchParams, { replace: true });
    showToast('success', 'Token Valid', 'Mengarahkan ke dashboard monitoring...');
  };

  const handleAuthenticate = (isValid: boolean) => {
    setIsAuthenticated(isValid);
    if (isValid) {
      showToast('success', 'Autentikasi Berhasil', 'Siap melakukan scanning');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLastScannedData('');
    setScanLog([]);
    if (onClose) {
      onClose();
    } else {
      window.close();
    }
  };

  const speakMessage = (namaUser: string, status: string, tipeAbsen: string, errorType?: 'not_registered' | 'absen_failed' | 'early_departure', izinInfo?: { jenis: 'izin' | 'sakit' | 'cuti' } | null) => {
    const message = generateSpeechMessage(namaUser, status, tipeAbsen, errorType, izinInfo);

    if (message) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        utterance.onend = () => {
          setTimeout(() => {
            setShowModal(false);
            setScanResult(null);
          }, 500);
        };
        utterance.onerror = () => {
          // If speech fails, close modal after timeout
          setTimeout(() => {
            setShowModal(false);
            setScanResult(null);
          }, 2000);
        };
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        // Fallback: auto close modal if speech synthesis fails
        setTimeout(() => {
          setShowModal(false);
          setScanResult(null);
        }, 2000);
      }
    } else {
      // Fallback: auto close modal if no speech message
      setTimeout(() => {
        setShowModal(false);
        setScanResult(null);
      }, 2000);
    }
  };

  const handleProcessScan = async (scannedData: string) => {
    if (showModal || !currentAlat) {
      return;
    }

    try {
      const result = await processScan(
        {
          scannedData,
          currentAlat,
          absensiGuru,
          absensi,
          users,
          kelas,
          pengaturanAbsen,
          izinGuru,
        },
        setAbsensiGuru,
        setAbsensi
      );

      if (result) {
        const { logEntry, scanResult } = result;
        setScanLog(prev => [logEntry, ...prev.slice(0, 19)]);
        setScanResult(scanResult);
        setShowModal(true);
        speakMessage(scanResult.user?.name || '', scanResult.status, scanResult.tipeAbsen, scanResult.errorType, scanResult.izinInfo);
        
        // Refresh absensi data after successful scan
        if (scanResult.status !== 'gagal' && scanResult.status !== 'sudah_terpenuhi') {
          if (scanResult.role === 'guru') {
            await fetchAbsensiGuru();
          } else if (scanResult.role === 'murid') {
            await fetchAbsensi();
          }
        }
      } else if (currentAlat?.status === 'nonaktif') {
        const logEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          namaUser: 'Alat Nonaktif',
          tipeUser: '-',
          tipeAbsen: '-',
          timestamp: new Date().toLocaleTimeString('id-ID'),
          status: 'gagal',
        };
        setScanLog(prev => [logEntry, ...prev.slice(0, 19)]);
        showToast('error', 'Alat Nonaktif', 'Alat RFID ini telah dinonaktifkan');
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      const logEntry: ScanLogEntry = {
        id: `scan-${Date.now()}`,
        namaUser: 'Error',
        tipeUser: '-',
        tipeAbsen: '-',
        timestamp: new Date().toLocaleTimeString('id-ID'),
        status: 'gagal',
      };
      setScanLog(prev => [logEntry, ...prev.slice(0, 19)]);
      showToast('error', 'Error', 'Terjadi kesalahan saat memproses scan');
    }
  };

  useEffect(() => {
    if (!isAuthenticated || showModal) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (lastScannedData.trim()) {
          handleProcessScan(lastScannedData);
          setLastScannedData('');
        }
      } else if (e.key.match(/^[a-zA-Z0-9-]$/)) {
        setLastScannedData(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAuthenticated, lastScannedData, showModal]);

  // If no alatId and no token, show token input form
  if (!alatId && !token) {
    return <TokenInputForm onTokenValid={handleTokenValid} />;
  }

  // If we have token/alatId but alat not found yet, wait for it to load
  if ((alatId || token) && alatRfid.length > 0 && !currentAlat) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <Card className="w-full max-w-md">
          <div className="p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Alat Tidak Ditemukan</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Perangkat RFID yang Anda akses tidak valid atau telah dihapus.</p>
            <Button
              variant="secondary"
              onClick={() => {
                // Clear URL params and show token form again
                navigate('/rfid-monitoring', { replace: true });
              }}
              className="w-full sm:w-auto"
            >
              Kembali ke Input Token
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If alat is still loading, show loading state
  if ((alatId || token) && alatRfid.length === 0) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <Card className="w-full max-w-md">
          <div className="p-6 sm:p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">Memuat data alat RFID...</p>
          </div>
        </Card>
      </div>
    );
  }

  // If we have currentAlat but not authenticated, show token auth
  if (currentAlat && !isAuthenticated) {
    return <RFIDTokenAuth onAuthenticate={handleAuthenticate} expectedToken={token || currentAlat.token || ''} currentAlat={currentAlat} />;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 overflow-hidden flex flex-col">
      <div className="w-full h-full flex flex-col p-2 sm:p-3 md:p-4 lg:p-5">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 sm:p-3 md:p-4 lg:p-5 mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 md:gap-4 w-full sm:flex-1 min-w-0">
              {profilSekolah?.logoSekolah && (
                <img
                  src={profilSekolah.logoSekolah}
                  alt="Logo Sekolah"
                  className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 line-clamp-2">
                  {profilSekolah?.namaSekolah || 'Dashboard Monitoring RFID'}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 sm:mt-1 line-clamp-1">
                  <span className="font-semibold text-slate-700">{currentAlat?.namaAlat}</span>
                  <span className="text-slate-500"> • {currentAlat?.lokasi}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
          {/* Scanning Area */}
          <div className="lg:col-span-2 order-1 min-h-0 flex">
            <ScanningArea lastScannedGuid={lastScannedData} />
          </div>

          {/* Scan Log */}
          <div className="lg:col-span-1 order-2 min-h-0 flex">
            <ScanHistoryLog scanLog={scanLog} />
          </div>
        </div>

        {/* Scan Result Modal */}
        <ScanResultModal
          scanResult={scanResult}
          showModal={showModal}
          onClose={() => setShowModal(false)}
        />
      </div>
    </div>
  );
};

export default RFIDMonitoringDashboard;
