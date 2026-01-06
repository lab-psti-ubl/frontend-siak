import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw } from 'lucide-react';


interface UnregisteredRfid {
  uid: string;
  mac: string;
  time: string;
  deviceName?: string;
  deviceLocation?: string;
}

interface RfidGuidFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

const RfidGuidField: React.FC<RfidGuidFieldProps> = ({ value, onChange, disabled = false, error }) => {
  const [unregisteredCards, setUnregisteredCards] = useState<UnregisteredRfid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchUnregisteredCards = async () => {
    setIsLoading(true);
    try {
      // Check if rabbitmqAPI is available
      if (typeof (window as any).rabbitmqAPI !== 'undefined') {
        const response = await (window as any).rabbitmqAPI.getMessages(20);
        if (response.success && response.data) {
          const unregistered = response.data.filter((msg: any) =>
            !msg.employee?.isRegistered && msg.device !== null
          ).map((msg: any) => ({
            uid: msg.uid,
            mac: msg.mac,
            time: msg.time,
            deviceName: msg.device?.name,
            deviceLocation: msg.device?.location
          }));

          const uniqueCards = Array.from(
            new Map(unregistered.map((card: UnregisteredRfid) => [card.uid, card])).values()
          );

          setUnregisteredCards(uniqueCards);
        }
      } else {
        // Fallback: if rabbitmqAPI is not available, just set empty array
        setUnregisteredCards([]);
      }
    } catch (error) {
      console.error('Error fetching unregistered cards:', error);
      // Silently fail - this is optional functionality
      setUnregisteredCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnregisteredCards();
    const interval = setInterval(fetchUnregisteredCards, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCard = (uid: string) => {
    onChange(uid);
    setShowDropdown(false);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    fetchUnregisteredCards();
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-medium text-gray-700">
        RFID GUID (Opsional)
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[40px] sm:min-h-[44px] ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          }`}
          placeholder="Tap kartu RFID atau masukkan manual (contoh: 5a2a0a)"
        />

        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 min-h-[40px] sm:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wifi className="w-4 h-4" />
          <span className="hidden sm:inline">Pilih Kartu</span>
        </button>
      </div>

      {showDropdown && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
              Kartu RFID yang Belum Terdaftar
            </h4>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading && unregisteredCards.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Memuat kartu RFID...</p>
            </div>
          ) : unregisteredCards.length > 0 ? (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {unregisteredCards.map((card, index) => (
                <button
                  key={`${card.uid}-${index}`}
                  type="button"
                  onClick={() => handleSelectCard(card.uid)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-mono font-semibold text-gray-900 text-sm">
                        {card.uid}
                      </div>
                      {card.deviceName && (
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Alat:</span> {card.deviceName}
                        </div>
                      )}
                      {card.deviceLocation && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Lokasi:</span> {card.deviceLocation}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {new Date(card.time).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wifi className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">Belum ada kartu RFID yang di-tap</p>
              <p className="text-xs text-gray-500">
                Tap kartu RFID pada alat yang terdaftar untuk menampilkan GUID di sini
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 border-t pt-2 mt-2">
            GUID kartu RFID akan muncul di daftar ketika kartu ditap pada alat yang terdaftar
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium">
          {error}
        </p>
      )}

      {!error && (
        <p className="text-xs text-gray-500">
          Tap kartu RFID atau pilih dari daftar kartu yang terdeteksi
        </p>
      )}
    </div>
  );
};

export default RfidGuidField;
