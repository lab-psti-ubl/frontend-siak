import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Settings, Globe, Trash2 } from 'lucide-react';
import Card from '../../../../ui/Card';
import { usePengaturanSistem } from '../../../../../hooks/usePengaturanSistem';
import { useLanguage } from '../../../../../context/LanguageContext';
import SystemTypePasswordModal from './SystemTypePasswordModal';
import ResetDatabaseModal from './ResetDatabaseModal';
import { apiService } from '../../../../../services/apiService';

const PengaturanSistemTab: React.FC = () => {
  const { enableEarlyDeparture, systemType, loading, error, updateEnableEarlyDeparture, updateSystemType, refreshPengaturanSistem } = usePengaturanSistem();
  const { language, setLanguage, t, isLoading: languageLoading } = useLanguage();
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentSystemType, setCurrentSystemType] = useState<string>('sekolah_umum_tahfiz');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isSavingSystemType, setIsSavingSystemType] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [languageMessage, setLanguageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [systemTypeMessage, setSystemTypeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingSystemType, setPendingSystemType] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setIsEnabled(enableEarlyDeparture);
    setCurrentSystemType(systemType);
  }, [enableEarlyDeparture, systemType]);

  const handleToggle = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    setIsSaving(true);
    setMessage(null);

    try {
      await updateEnableEarlyDeparture(newValue);
      setMessage({
        type: 'success',
        text: t('system.earlyDepartureUpdated'),
      });
      // Refresh to ensure consistency
      await refreshPengaturanSistem();
    } catch (err: any) {
      // Revert on error
      setIsEnabled(!newValue);
      setMessage({
        type: 'error',
        text: err.message || t('system.earlyDepartureUpdateFailed'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (newLanguage: 'id' | 'ms') => {
    if (newLanguage === language) return;
    
    setIsSavingLanguage(true);
    setLanguageMessage(null);

    try {
      await setLanguage(newLanguage);
      setLanguageMessage({
        type: 'success',
        text: t('settings.languageUpdated'),
      });
      // Clear message after 3 seconds
      setTimeout(() => setLanguageMessage(null), 3000);
    } catch (err: any) {
      setLanguageMessage({
        type: 'error',
        text: err.message || t('settings.languageUpdateFailed'),
      });
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleSystemTypeChange = (newSystemType: string) => {
    if (newSystemType === currentSystemType) return;
    
    // Show password modal first
    setPendingSystemType(newSystemType);
    setShowPasswordModal(true);
  };

  const handleConfirmPassword = async (password: string) => {
    if (!pendingSystemType) return;
    
    setIsSavingSystemType(true);
    setSystemTypeMessage(null);

    try {
      await updateSystemType(pendingSystemType, password);
      setCurrentSystemType(pendingSystemType);
      setSystemTypeMessage({
        type: 'success',
        text: t('system.systemTypeUpdated'),
      });
      // Refresh to ensure consistency
      await refreshPengaturanSistem();
      // Clear message after 3 seconds
      setTimeout(() => setSystemTypeMessage(null), 3000);
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setSystemTypeMessage({
        type: 'error',
        text: err.message || t('system.systemTypeUpdateFailed'),
      });
      throw err; // Re-throw to let modal handle the error
    } finally {
      setIsSavingSystemType(false);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPendingSystemType(null);
  };

  const handleResetDatabase = async (password: string) => {
    setIsResetting(true);
    setResetMessage(null);

    try {
      const response = await apiService.resetDatabase(password);
      if (response.success) {
        setResetMessage({
          type: 'success',
          text: response.message || t('system.resetDatabaseSuccess') || 'Database berhasil direset',
        });
        
        // Clear all caches to ensure fresh start
        const { clearAllCaches } = await import('../../../../../utils/clearAllCaches');
        const { clearPengaturanCache } = await import('../../../../../hooks/usePengaturanSistem');
        clearAllCaches();
        clearPengaturanCache();
        
        // Clear localStorage flags to ensure app returns to initial setup flow
        localStorage.removeItem('systemTypeWasSet');
        localStorage.removeItem('pengaturanJenjangPendidikan');
        
        // Clear auth token and user data to force logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
        sessionStorage.removeItem('app_session_active');
        sessionStorage.removeItem('gst_modal_shown');
        
        // Reload page after 2 seconds to restart the system
        // Redirect to root to trigger initial setup flow
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error(response.message || t('system.resetDatabaseFailed') || 'Gagal mereset database');
      }
    } catch (err: any) {
      setResetMessage({
        type: 'error',
        text: err.message || t('system.resetDatabaseFailed') || 'Gagal mereset database',
      });
      throw err;
    } finally {
      setIsResetting(false);
    }
  };

  const handleCloseResetModal = () => {
    if (!isResetting) {
      setShowResetModal(false);
      setResetMessage(null);
    }
  };

  if (loading || languageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('system.loadingSystemSettings')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900">{t('system.title')}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">{t('system.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* System Type Selection */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-50/50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                    {t('system.systemType')}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {t('system.systemTypeDesc')}
                  </p>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <button
                  type="button"
                  onClick={() => handleSystemTypeChange('sekolah_umum')}
                  disabled={isSavingSystemType}
                  className={`
                    w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base text-left
                    ${currentSystemType === 'sekolah_umum'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${isSavingSystemType ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t('system.systemTypeSekolahUmum')}</div>
                      <div className="text-xs mt-1 opacity-90">{t('system.systemTypeSekolahUmumDesc')}</div>
                    </div>
                    {currentSystemType === 'sekolah_umum' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSystemTypeChange('sekolah_umum_tahfiz')}
                  disabled={isSavingSystemType}
                  className={`
                    w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base text-left
                    ${currentSystemType === 'sekolah_umum_tahfiz'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${isSavingSystemType ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t('system.systemTypeSekolahUmumTahfiz')}</div>
                      <div className="text-xs mt-1 opacity-90">{t('system.systemTypeSekolahUmumTahfizDesc')}</div>
                    </div>
                    {currentSystemType === 'sekolah_umum_tahfiz' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSystemTypeChange('tahfiz')}
                  disabled={isSavingSystemType}
                  className={`
                    w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base text-left
                    ${currentSystemType === 'tahfiz'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${isSavingSystemType ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t('system.systemTypeTahfiz')}</div>
                      <div className="text-xs mt-1 opacity-90">{t('system.systemTypeTahfizDesc')}</div>
                    </div>
                    {currentSystemType === 'tahfiz' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                  </div>
                </button>
              </div>
              {systemTypeMessage && (
                <div
                  className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    systemTypeMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {systemTypeMessage.type === 'success' ? (
                    <CheckCircle size={18} className="flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">{systemTypeMessage.text}</span>
                </div>
              )}
            </div>

            {/* Language Selection */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                    {t('settings.bahasa')}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {t('settings.selectLanguage')}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('id')}
                  disabled={isSavingLanguage}
                  className={`
                    flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base
                    ${language === 'id'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${isSavingLanguage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {t('settings.indonesia')}
                  {language === 'id' && <CheckCircle className="inline-block ml-2 w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ms')}
                  disabled={isSavingLanguage}
                  className={`
                    flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base
                    ${language === 'ms'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${isSavingLanguage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {t('settings.malaysia')}
                  {language === 'ms' && <CheckCircle className="inline-block ml-2 w-4 h-4" />}
                </button>
              </div>
              {languageMessage && (
                <div
                  className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    languageMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {languageMessage.type === 'success' ? (
                    <CheckCircle size={18} className="flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">{languageMessage.text}</span>
                </div>
              )}
            </div>

            {/* Pulang Cepat Switch */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    {t('system.earlyDeparture')}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {t('system.earlyDepartureDesc')}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isSaving}
                    className={`
                      relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isEnabled 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                      }
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    role="switch"
                    aria-checked={isEnabled}
                    aria-label={t('system.toggleEarlyDeparture')}
                  >
                    <span
                      className={`
                        inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
                        ${isEnabled ? 'translate-x-8 sm:translate-x-10' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 sm:p-4 rounded-lg flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={18} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">{message.text}</span>
              </div>
            )}

            {error && (
              <div className="p-3 sm:p-4 rounded-lg flex items-center gap-2 bg-red-50 text-red-800 border border-red-200">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span className="text-xs sm:text-sm">{error}</span>
              </div>
            )}

            {/* Reset Database Section */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-red-50 to-red-50/50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                    {t('system.resetDatabase') || 'Reset Database'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {t('system.resetDatabaseDesc') || 'Hapus semua data dan reset sistem ke kondisi awal'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                disabled={isResetting}
                className={`
                  w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base
                  bg-white text-red-700 border-red-300 hover:border-red-500 hover:bg-red-50
                  ${isResetting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  flex items-center justify-center gap-2
                `}
              >
                <Trash2 size={18} />
                {t('system.resetDatabaseButton') || 'Reset Database'}
              </button>
              {resetMessage && (
                <div
                  className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    resetMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {resetMessage.type === 'success' ? (
                    <CheckCircle size={18} className="flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">{resetMessage.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">{t('system.status')}</h3>
            <p className="text-xs sm:text-sm text-slate-600">{t('system.statusInfo')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-100">
              <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">{t('system.earlyDeparture')}</h4>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                <span className="text-xs sm:text-sm font-medium text-blue-700">
                  {isEnabled ? t('common.active') : t('common.inactive')}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-lg border border-purple-100">
              <h4 className="text-xs sm:text-sm font-semibold text-purple-900 mb-2">{t('settings.language')}</h4>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full"></span>
                <span className="text-xs sm:text-sm font-medium text-purple-700">
                  {language === 'id' ? t('settings.indonesia') : t('settings.malaysia')}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-50/50 rounded-lg border border-green-100">
              <h4 className="text-xs sm:text-sm font-semibold text-green-900 mb-2">{t('system.systemType')}</h4>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-xs sm:text-sm font-medium text-green-700">
                  {currentSystemType === 'sekolah_umum' ? t('system.systemTypeSekolahUmum') :
                   currentSystemType === 'sekolah_umum_tahfiz' ? t('system.systemTypeSekolahUmumTahfiz') :
                   t('system.systemTypeTahfiz')}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2">{t('system.systemStatus')}</h4>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-xs sm:text-sm text-slate-600">{t('system.systemReady')}</span>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-3">{t('system.featureInfo')}</h4>
            <ul className="text-xs text-slate-700 space-y-1.5">
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>
                  <strong>{t('system.earlyDeparture')}:</strong> {t('system.earlyDepartureInfo')}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>
                  {t('system.globalSetting')}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>
                  {t('system.immediateEffect')}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Password Modal for System Type Change */}
      <SystemTypePasswordModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        onConfirm={handleConfirmPassword}
        targetSystemType={pendingSystemType || ''}
      />

      {/* Reset Database Modal */}
      <ResetDatabaseModal
        isOpen={showResetModal}
        onClose={handleCloseResetModal}
        onConfirm={handleResetDatabase}
      />
    </div>
  );
};

export default PengaturanSistemTab;

