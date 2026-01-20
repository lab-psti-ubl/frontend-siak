import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import Button from '../../../../ui/Button';

interface AudioPlayerProps {
  surahNumber: number;
  ayatNumber: number;
  reciter?: string; // Default: 'alafasy' (Mishary Alafasy)
  className?: string;
}

// Global storage for active audio instances to stop them when new one plays
const activeAudioInstances = new Set<HTMLAudioElement>();

// Helper function to stop all active audio instances
const stopAllActiveAudio = (exclude?: HTMLAudioElement) => {
  activeAudioInstances.forEach(audio => {
    if (audio !== exclude && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  surahNumber,
  ayatNumber,
  reciter = 'alafasy',
  className = '',
}) => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresPermission, setRequiresPermission] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriedFallbackRef = useRef<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        activeAudioInstances.delete(audioRef.current);
        audioRef.current = null;
      }
      if (pendingAudio) {
        pendingAudio.pause();
        activeAudioInstances.delete(pendingAudio);
        setPendingAudio(null);
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        activeAudioInstances.delete(currentAudioRef.current);
        currentAudioRef.current = null;
      }
      hasTriedFallbackRef.current = false;
    };
  }, [pendingAudio]);

  const getAudioUrl = (surah: number, ayat: number, reciterName: string): string => {
    const surahPadded = surah.toString().padStart(3, '0');
    const ayatPadded = ayat.toString().padStart(3, '0');
    
    // Map reciter names to EveryAyah format
    const reciterMap: { [key: string]: string } = {
      'alafasy': 'Alafasy_128kbps',
      'abdul_basit': 'Abdul_Basit_Murattal_192kbps',
      'saad_al_ghamdi': 'Saad_Al_Ghamdi_128kbps',
      'abdurrahmaan_as_sudais': 'Abdurrahmaan_As_Sudais_192kbps',
      'maher_al_muaiqly': 'Maher_Al_Muaiqly_128kbps',
    };
    
    const reciterFolder = reciterMap[reciterName] || 'Alafasy_128kbps';
    
    // Primary: EveryAyah CDN (most reliable for direct MP3)
    return `https://everyayah.com/data/${reciterFolder}/${surahPadded}_${ayatPadded}.mp3`;
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      setIsLoading(true);
      setError(null);
      
      // Stop any currently playing audio from other AudioPlayer instances
      stopAllActiveAudio();

      try {
        const audioUrl = getAudioUrl(surahNumber, ayatNumber, reciter);
        const audio = new Audio(audioUrl);
        
        // Reset fallback flag for new audio attempt
        hasTriedFallbackRef.current = false;
        
        // Add to active instances set
        activeAudioInstances.add(audio);
        
        // Set up event listeners
        audio.addEventListener('loadstart', () => {
          setIsLoading(true);
          setError(null);
        });
        
        audio.addEventListener('canplay', () => {
          setIsLoading(false);
        });
        
        audio.addEventListener('loadeddata', () => {
          setIsLoading(false);
        });
        
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setRequiresPermission(false);
          activeAudioInstances.delete(audio);
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
          if (pendingAudio === audio) {
            setPendingAudio(null);
          }
        });
        
        audio.addEventListener('pause', () => {
          setIsPlaying(false);
        });
        
        audio.addEventListener('play', () => {
          setIsPlaying(true);
          setIsLoading(false);
          setRequiresPermission(false);
          setError(null);
          // Clear pending audio if this is the one playing
          if (pendingAudio === audio) {
            setPendingAudio(null);
          }
          // Clear current audio ref once playing successfully
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
        });

        // Store reference to current audio for error handling
        currentAudioRef.current = audio;
        hasTriedFallbackRef.current = false;
        
        // Use a flag to track if error has been handled for this audio instance
        let errorHandled = false;
        
        audio.addEventListener('error', (e) => {
          const audioElement = e.target as HTMLAudioElement;
          
          // Prevent multiple error handling for the same audio instance
          if (errorHandled || audioElement !== audio) {
            return;
          }
          
          // Only handle error for the current audio we're trying to load
          if (audioElement !== currentAudioRef.current && audioElement !== audio) {
            return;
          }
          
          errorHandled = true;
          
          const errorCode = audioElement.error;
          
          // Get error details
          let errorMessage = 'Gagal memuat audio ayat';
          if (errorCode) {
            // MediaError code constants
            const MEDIA_ERR_ABORTED = 1;
            const MEDIA_ERR_NETWORK = 2;
            const MEDIA_ERR_DECODE = 3;
            const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
            
            switch (errorCode.code) {
              case MEDIA_ERR_ABORTED:
                errorMessage = 'Pemutaran audio dibatalkan';
                break;
              case MEDIA_ERR_NETWORK:
                errorMessage = 'Error jaringan saat memuat audio. Periksa koneksi internet Anda.';
                break;
              case MEDIA_ERR_DECODE:
                errorMessage = 'Error dekode audio. Format mungkin tidak didukung.';
                break;
              case MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Format audio tidak didukung atau URL tidak valid';
                break;
              default:
                errorMessage = 'Gagal memuat audio ayat. Silakan coba lagi.';
            }
          }
          
          // Only log error details if it's for the current audio we're trying to load
          if (audioElement === currentAudioRef.current || audioElement === audio) {
            console.warn('Audio loading error:', {
              code: errorCode?.code,
              message: errorMessage,
              src: audioElement.src.substring(0, 100) + '...', // Truncate long URLs
            });
          }
          
          setIsLoading(false);
          activeAudioInstances.delete(audioElement);
          
          // Only try fallback once, and only if this audio hasn't been set as current/pending
          if (!hasTriedFallbackRef.current && !audioRef.current && !pendingAudio) {
            hasTriedFallbackRef.current = true;
            
            // Try fallback to Al-Quran Cloud API
            setIsLoading(true);
            getFallbackAudioUrl(surahNumber, ayatNumber, reciter)
              .then(fallbackUrl => {
                if (fallbackUrl) {
                  // Create new audio instance for fallback (don't reuse the failed one)
                  const fallbackAudio = new Audio(fallbackUrl);
                  currentAudioRef.current = fallbackAudio;
                  activeAudioInstances.add(fallbackAudio);
                  
                  // Set up basic event listeners for fallback
                  fallbackAudio.addEventListener('error', () => {
                    setIsLoading(false);
                    activeAudioInstances.delete(fallbackAudio);
                    setError('Audio tidak tersedia untuk ayat ini. Silakan coba lagi nanti.');
                    currentAudioRef.current = null;
                  });
                  
                  fallbackAudio.addEventListener('canplay', () => {
                    setIsLoading(false);
                  });
                  
                  fallbackAudio.addEventListener('loadeddata', () => {
                    setIsLoading(false);
                  });
                  
                  fallbackAudio.addEventListener('play', () => {
                    setIsPlaying(true);
                    setRequiresPermission(false);
                    setError(null);
                    if (pendingAudio === fallbackAudio) {
                      setPendingAudio(null);
                    }
                  });
                  
                  fallbackAudio.addEventListener('pause', () => {
                    setIsPlaying(false);
                  });
                  
                  fallbackAudio.addEventListener('ended', () => {
                    setIsPlaying(false);
                    setRequiresPermission(false);
                    activeAudioInstances.delete(fallbackAudio);
                    if (audioRef.current === fallbackAudio) {
                      audioRef.current = null;
                    }
                    if (pendingAudio === fallbackAudio) {
                      setPendingAudio(null);
                    }
                    currentAudioRef.current = null;
                  });
                  
                  // Try to play fallback audio
                  fallbackAudio.play().then(() => {
                    audioRef.current = fallbackAudio;
                    setPendingAudio(null);
                    setRequiresPermission(false);
                    setIsLoading(false);
                    setIsPlaying(true);
                    setError(null);
                  }).catch((playErr: any) => {
                    setIsLoading(false);
                    
                    // Check if fallback also requires permission
                    if (
                      playErr.name === 'NotAllowedError' ||
                      playErr.name === 'NotSupportedError' ||
                      (playErr.message && (
                        playErr.message.includes('play') ||
                        playErr.message.includes('user gesture')
                      ))
                    ) {
                      setPendingAudio(fallbackAudio);
                      setRequiresPermission(true);
                      setError(null);
                    } else {
                      activeAudioInstances.delete(fallbackAudio);
                      setError('Audio tidak tersedia untuk ayat ini. Silakan coba lagi nanti.');
                      currentAudioRef.current = null;
                    }
                  });
                } else {
                  setIsLoading(false);
                  setError('Audio tidak tersedia untuk ayat ini. Silakan coba lagi nanti.');
                  currentAudioRef.current = null;
                }
              })
              .catch(() => {
                setIsLoading(false);
                setError('Gagal memuat audio. Silakan coba lagi nanti.');
                currentAudioRef.current = null;
              });
          } else if (!requiresPermission) {
            // Only show error if we're not waiting for permission
            setError(errorMessage);
            currentAudioRef.current = null;
          }
        });

        // Try to play - this will work if user has already interacted with page
        try {
          // Wait a bit for audio to load, but check for errors first
          await new Promise((resolve, reject) => {
            // Check if audio already has an error
            if (audio.error) {
              reject(new Error('Audio failed to load'));
              return;
            }
            
            if (audio.readyState >= 2) {
              resolve(void 0);
              return;
            }
            
            const timeout = setTimeout(() => {
              resolve(void 0);
            }, 5000);
            
            audio.addEventListener('canplay', () => {
              clearTimeout(timeout);
              resolve(void 0);
            }, { once: true });
            
            // If error occurs while waiting, reject
            const errorHandler = () => {
              clearTimeout(timeout);
              reject(new Error('Audio error during loading'));
            };
            audio.addEventListener('error', errorHandler, { once: true });
          });
          
          // Double-check for errors before playing
          if (audio.error) {
            throw new Error('Audio failed to load');
          }
          
          await audio.play();
          audioRef.current = audio;
          setPendingAudio(null);
          setRequiresPermission(false);
          setIsLoading(false);
          setIsPlaying(true);
          setError(null);
          currentAudioRef.current = null; // Clear current audio ref on success
        } catch (playError: any) {
          // Only log if it's not a permission error (those are expected)
          if (!playError.message?.includes('Audio failed') && !playError.message?.includes('Audio error')) {
            console.log('Play attempt failed:', playError.name || playError.message);
          }
          
          setIsLoading(false);
          
          // Check if error is due to autoplay policy (permission required)
          if (
            playError.name === 'NotAllowedError' ||
            playError.name === 'NotSupportedError' ||
            (playError.message && (
              playError.message.includes('play') ||
              playError.message.includes('user gesture') ||
              playError.message.includes('interaction') ||
              playError.message.includes('not allowed')
            ))
          ) {
            // Audio needs user permission - store it for later playback
            setPendingAudio(audio);
            setRequiresPermission(true);
            setError(null); // Clear error to show permission request
          } else if (audio.error) {
            // Audio has error, let the error event handler deal with it
            // Don't set error here as error handler will handle it
          } else {
            // Other error - show error message
            activeAudioInstances.delete(audio);
            setError('Gagal memutar audio. Silakan coba lagi atau refresh halaman.');
            currentAudioRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error loading audio:', err);
        setIsLoading(false);
        setError('Gagal memuat audio ayat');
      }
    } else {
      // Toggle play/pause
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          // Stop other audio before playing this one
          stopAllActiveAudio(audioRef.current);
          await audioRef.current.play();
          setIsPlaying(true);
          setRequiresPermission(false);
          setError(null);
        } catch (err: any) {
          console.error('Error playing audio:', err);
          
          // Check if error is due to autoplay policy
          if (
            err.name === 'NotAllowedError' ||
            err.name === 'NotSupportedError' ||
            err.message?.includes('play') ||
            err.message?.includes('user gesture')
          ) {
            setRequiresPermission(true);
            setError(null);
          } else {
            setError('Gagal memutar audio');
          }
        }
      }
    }
  };

  const handleRequestPermission = async () => {
    if (pendingAudio) {
      try {
        setIsLoading(true);
        setRequiresPermission(false);
        setError(null);
        
        // Stop other audio before playing this one
        stopAllActiveAudio(pendingAudio);
        
        // This is now a user-initiated action, should work
        await pendingAudio.play();
        audioRef.current = pendingAudio;
        setPendingAudio(null);
        setIsLoading(false);
        setIsPlaying(true);
      } catch (err: any) {
        console.error('Error after permission granted:', err);
        setIsLoading(false);
        setPendingAudio(null);
        activeAudioInstances.delete(pendingAudio);
        
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'NotSupportedError'
        ) {
          setError('Browser tidak mengizinkan pemutaran audio. Silakan periksa pengaturan browser.');
        } else {
          setError('Gagal memutar audio setelah izin diberikan.');
        }
      }
    } else if (audioRef.current && audioRef.current.paused) {
      // Try to resume existing audio that was paused
      try {
        setIsLoading(true);
        stopAllActiveAudio(audioRef.current);
        await audioRef.current.play();
        setIsLoading(false);
        setIsPlaying(true);
        setRequiresPermission(false);
        setError(null);
      } catch (err: any) {
        console.error('Error resuming audio:', err);
        setIsLoading(false);
        
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'NotSupportedError'
        ) {
          setRequiresPermission(true);
          setError(null);
        } else {
          setError('Gagal memutar audio');
        }
      }
    }
  };

  const getFallbackAudioUrl = async (surah: number, ayat: number, reciterName: string): Promise<string | null> => {
    // Fallback: Try Al-Quran Cloud API
    try {
      const apiUrl = `https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/ar.${reciterName}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.data && data.data.audio) {
        return data.data.audio;
      }
    } catch (err) {
      console.log('Fallback API also failed');
    }
    return null;
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      activeAudioInstances.delete(audioRef.current);
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Permission Request Banner */}
      {requiresPermission && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-3 shadow-md mb-2 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-amber-900 font-semibold mb-1">
                {t('tahfiz.muridTahfiz.audioPlayer.izinDiperlukan')}
              </p>
              <p className="text-xs text-amber-700 mb-3 leading-relaxed">
                {t('tahfiz.muridTahfiz.audioPlayer.browserMemerlukanInteraksi')}
              </p>
              <Button
                onClick={handleRequestPermission}
                variant="warning"
                size="sm"
                disabled={isLoading}
                className="!px-4 !py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md transition-all hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    {t('tahfiz.muridTahfiz.audioPlayer.memuat')}
                  </>
                ) : (
                  <>
                    <Play size={14} className="mr-1.5" />
                    {t('tahfiz.muridTahfiz.audioPlayer.izinkanPutarAudio')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handlePlayPause}
          variant="primary"
          size="sm"
          disabled={isLoading || requiresPermission}
          className="flex items-center justify-center gap-1.5 sm:gap-2 !px-2 sm:!px-3 !py-1.5 sm:!py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={requiresPermission ? t('tahfiz.muridTahfiz.audioPlayer.klikTombolIzinkan') : isPlaying ? t('tahfiz.muridTahfiz.audioPlayer.jeda') : t('tahfiz.muridTahfiz.audioPlayer.putarAudio')}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" />
              <span className="text-xs hidden sm:inline">{t('tahfiz.muridTahfiz.audioPlayer.memuat')}</span>
              <span className="text-xs sm:hidden">...</span>
            </>
          ) : isPlaying ? (
            <>
              <Pause size={14} className="sm:w-4 sm:h-4" />
              <span className="text-xs hidden sm:inline">{t('tahfiz.muridTahfiz.audioPlayer.jeda')}</span>
            </>
          ) : (
            <>
              <Play size={14} className="sm:w-4 sm:h-4" />
              <span className="text-xs hidden sm:inline">{t('tahfiz.muridTahfiz.audioPlayer.putar')}</span>
            </>
          )}
        </Button>
        
        {isPlaying && (
          <button
            onClick={handleStop}
            className="p-1.5 sm:p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title={t('tahfiz.muridTahfiz.audioPlayer.stop')}
          >
            <Volume2 size={14} className="sm:w-4 sm:h-4" />
          </button>
        )}
        
        {error && !requiresPermission && (
          <span className="text-xs text-red-600 max-w-[150px] sm:max-w-none truncate">{error}</span>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;

