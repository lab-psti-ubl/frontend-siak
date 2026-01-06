import React, { useState, useEffect } from 'react';
import { Settings, Clock, BookOpen, Calendar, BarChart3, User, Building, Image, ChevronRight, ArrowLeft, GraduationCap } from 'lucide-react';
import Card from '../../../ui/Card';
import { PengaturanAbsen, PengaturanSKS, PengaturanIstirahat, DataKepsek, ProfilSekolah, BackgroundKTA, PengaturanJenjangPendidikan } from '../../../../types';
import { apiService } from '../../../../services/apiService';
import PengaturanAbsenTab from './components/PengaturanAbsenTab';
import PengaturanSKSTab from './components/PengaturanSKSTab';
import PengaturanIstirahatTab from './components/PengaturanIstirahatTab';
import PengaturanNilaiTab from './components/PengaturanNilaiTab';
import PengaturanKepsekTab from './components/PengaturanKepsekTab';
import PengaturanProfilSekolahTab from './components/PengaturanProfilSekolahTab';
import PengaturanBackgroundKTATab from './components/PengaturanBackgroundKTATab';
import PengaturanJenjangPendidikanTab from './components/PengaturanJenjangPendidikanTab';
import PengaturanSettingsSummary from './components/PengaturanSettingsSummary';
import PengaturanInfoSection from './components/PengaturanInfoSection';

const PengaturanAbsenComponent: React.FC = () => {
  const [pengaturanAbsen, setPengaturanAbsen] = useState<PengaturanAbsen[]>([]);
  const [pengaturanSKS, setPengaturanSKS] = useState<PengaturanSKS[]>([]);
  const [pengaturanIstirahat, setPengaturanIstirahat] = useState<PengaturanIstirahat[]>([]);
  const [dataKepsekList, setDataKepsekList] = useState<DataKepsek[]>([]);
  const [profilSekolah, setProfilSekolah] = useState<ProfilSekolah | null>(null);
  const [backgroundKTA, setBackgroundKTA] = useState<BackgroundKTA | null>(null);
  const [pengaturanJenjang, setPengaturanJenjang] = useState<PengaturanJenjangPendidikan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    jamMasuk: '08:00',
    toleransiMasuk: 15,
    jamPulang: '16:00',
    toleransiPulang: 15,
    hariSekolah: [1, 2, 3, 4, 5], // Senin-Jumat default
    hariKerja: [1, 2, 3, 4, 5], // Senin-Jumat default
  });
  const [sksFormData, setSksFormData] = useState({
    durasiPerSKS: 45,
    istirahatAntarSKS: 0,
  });
  const [istirahatFormData, setIstirahatFormData] = useState({
    jamMulai: '12:00',
    jamSelesai: '13:00',
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [sksMessage, setSksMessage] = useState({ type: '', text: '' });
  const [istirahatMessage, setIstirahatMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState<'absen' | 'sks' | 'istirahat' | 'nilai' | 'kepsek' | 'profil_sekolah' | 'background_kta' | 'jenjang_pendidikan'>('absen');
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  const activePengaturan = pengaturanAbsen.find(p => p.isActive);
  const activePengaturanSKS = pengaturanSKS.find(p => p.isActive);
  const activePengaturanIstirahat = pengaturanIstirahat.find(p => p.isActive);

  // Fetch all data from API
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all pengaturan data
        const [absenRes, sksRes, istirahatRes, kepsekRes, profilRes, backgroundRes, jenjangRes] = await Promise.all([
          apiService.getAllPengaturanAbsen(),
          apiService.getAllPengaturanSKS(),
          apiService.getAllPengaturanIstirahat(),
          apiService.getAllDataKepsek(),
          apiService.getProfilSekolah(),
          apiService.getBackgroundKTA(),
          apiService.getAllJenjang(),
        ]);

        if (absenRes.success && absenRes.pengaturanAbsen) {
          setPengaturanAbsen(absenRes.pengaturanAbsen);
        }
        if (sksRes.success && sksRes.pengaturanSKS) {
          setPengaturanSKS(sksRes.pengaturanSKS);
        }
        if (istirahatRes.success && istirahatRes.pengaturanIstirahat) {
          setPengaturanIstirahat(istirahatRes.pengaturanIstirahat);
        }
        if (kepsekRes.success && kepsekRes.dataKepsek) {
          setDataKepsekList(kepsekRes.dataKepsek);
        }
        if (profilRes.success && profilRes.profilSekolah) {
          setProfilSekolah(profilRes.profilSekolah);
        }
        if (backgroundRes.success && backgroundRes.backgroundKTA) {
          setBackgroundKTA(backgroundRes.backgroundKTA);
        }
        if (jenjangRes.success && jenjangRes.jenjangList) {
          setPengaturanJenjang(jenjangRes.jenjangList);
        }
      } catch (error) {
        console.error('Error fetching pengaturan data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  React.useEffect(() => {
    if (activePengaturan) {
      setFormData({
        jamMasuk: activePengaturan.jamMasuk,
        toleransiMasuk: activePengaturan.toleransiMasuk,
        jamPulang: activePengaturan.jamPulang,
        toleransiPulang: activePengaturan.toleransiPulang,
        hariSekolah: activePengaturan.hariSekolah || [], // Load from database, empty if not set
        hariKerja: activePengaturan.hariKerja || [], // Load from database, empty if not set
      });
    } else {
      // If no active pengaturan, initialize with empty arrays (user must select)
      setFormData({
        jamMasuk: '08:00',
        toleransiMasuk: 15,
        jamPulang: '16:00',
        toleransiPulang: 15,
        hariSekolah: [], // Empty - user must select
        hariKerja: [], // Empty - user must select
      });
    }
  }, [activePengaturan]);

  React.useEffect(() => {
    if (activePengaturanSKS) {
      setSksFormData({
        durasiPerSKS: activePengaturanSKS.durasiPerSKS,
        istirahatAntarSKS: activePengaturanSKS.istirahatAntarSKS,
      });
    }
  }, [activePengaturanSKS]);

  React.useEffect(() => {
    if (activePengaturanIstirahat) {
      setIstirahatFormData({
        jamMulai: activePengaturanIstirahat.jamMulai,
        jamSelesai: activePengaturanIstirahat.jamSelesai,
      });
    }
  }, [activePengaturanIstirahat]);

  const tabs = [
    { id: 'absen', label: 'Pengaturan Absen', icon: Clock },
    { id: 'sks', label: 'Pengaturan SKS', icon: BookOpen },
    { id: 'istirahat', label: 'Jam Istirahat', icon: Calendar },
    { id: 'nilai', label: 'Pengaturan Nilai', icon: BarChart3 },
    { id: 'kepsek', label: 'Data Kepsek', icon: User },
    { id: 'profil_sekolah', label: 'Profil Sekolah', icon: Building },
    { id: 'background_kta', label: 'Background KTA', icon: Image },
    { id: 'jenjang_pendidikan', label: 'Pengaturan Jenjang Pendidikan', icon: GraduationCap },
  ];

  const getTabLabel = (tabId: string) => {
    return tabs.find(tab => tab.id === tabId)?.label || '';
  };

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId as typeof activeTab);
    setIsMobileDetailView(true);
  };

  const handleBackClick = () => {
    setIsMobileDetailView(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-white rounded-lg">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Pengaturan</h1>
            </div>
            <p className="text-xs sm:text-sm text-blue-100">Kelola pengaturan sistem, absensi, durasi pelajaran, dan data sekolah</p>
          </div>
        </div>
      </div>

      {/* Mobile Menu View */}
      {!isMobileDetailView && (
        <div className="lg:hidden">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Pilih Menu</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleMenuClick(tab.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left transition-all duration-200 hover:bg-blue-50 active:bg-blue-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-slate-900">
                        {tab.label}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop + Mobile Detail View */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 ${isMobileDetailView ? 'block lg:grid' : 'hidden lg:grid'}`}>
        <div className="lg:col-span-1 space-y-3 hidden lg:block">
          <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Menu</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'absen' | 'sks' | 'istirahat' | 'nilai' | 'kepsek' | 'profil_sekolah' | 'background_kta' | 'jenjang_pendidikan')}
                    className={`w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`} />
                      <span className={`text-xs sm:text-sm font-medium truncate ${
                        isActive ? 'text-blue-700' : 'text-slate-600'
                      }`}>
                        {tab.label}
                      </span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Detail View Header */}
        {isMobileDetailView && (
          <div className="lg:hidden mb-4">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Kembali</span>
            </button>
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white">{getTabLabel(activeTab)}</h2>
            </div>
          </div>
        )}

        <div className={`lg:col-span-2 space-y-5 sm:space-y-6 ${isMobileDetailView ? 'block' : 'hidden lg:block'}`}>
          {activeTab === 'absen' && (
            <PengaturanAbsenTab
              formData={formData}
              setFormData={setFormData}
              message={message}
              setMessage={setMessage}
              activePengaturan={activePengaturan}
              pengaturanAbsen={pengaturanAbsen}
              setPengaturanAbsen={setPengaturanAbsen}
            />
          )}

          {activeTab === 'sks' && (
            <PengaturanSKSTab
              sksFormData={sksFormData}
              setSksFormData={setSksFormData}
              sksMessage={sksMessage}
              setSksMessage={setSksMessage}
              activePengaturanSKS={activePengaturanSKS}
              pengaturanSKS={pengaturanSKS}
              setPengaturanSKS={setPengaturanSKS}
              istirahatFormData={istirahatFormData}
            />
          )}

          {activeTab === 'istirahat' && (
            <PengaturanIstirahatTab
              istirahatFormData={istirahatFormData}
              setIstirahatFormData={setIstirahatFormData}
              istirahatMessage={istirahatMessage}
              setIstirahatMessage={setIstirahatMessage}
              activePengaturanIstirahat={activePengaturanIstirahat}
              pengaturanIstirahat={pengaturanIstirahat}
              setPengaturanIstirahat={setPengaturanIstirahat}
            />
          )}

          {activeTab === 'nilai' && (
            <PengaturanNilaiTab />
          )}

          {activeTab === 'kepsek' && (
            <PengaturanKepsekTab
              dataKepsekList={dataKepsekList}
              setDataKepsekList={setDataKepsekList}
            />
          )}

          {activeTab === 'profil_sekolah' && (
            <PengaturanProfilSekolahTab
              profilSekolah={profilSekolah}
              setProfilSekolah={setProfilSekolah}
            />
          )}

          {activeTab === 'background_kta' && (
            <PengaturanBackgroundKTATab
              backgroundKTA={backgroundKTA}
              setBackgroundKTA={setBackgroundKTA}
            />
          )}

          {activeTab === 'jenjang_pendidikan' && (
            <PengaturanJenjangPendidikanTab
              pengaturanJenjang={pengaturanJenjang}
              setPengaturanJenjang={setPengaturanJenjang}
            />
          )}

          {/* <PengaturanInfoSection
            activeTab={activeTab}
            sksFormData={sksFormData}
          /> */}
        </div>
      </div>

      {/* Desktop Summary - Hidden on Mobile Detail View */}
      {!isMobileDetailView && (

        <PengaturanSettingsSummary
          activePengaturan={activePengaturan}
          activePengaturanSKS={activePengaturanSKS}
          activePengaturanIstirahat={activePengaturanIstirahat}
        />
      )}
    </div>
  );
};

export default PengaturanAbsenComponent;
