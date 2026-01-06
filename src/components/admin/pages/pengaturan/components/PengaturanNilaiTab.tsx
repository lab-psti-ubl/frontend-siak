import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import GradeSettings from './GradeSettings';
import PengaturanNilaiMinimalTab from './PengaturanNilaiMinimalTab';
import { apiService } from '../../../../../services/apiService';

interface NilaiComponent {
  id: string;
  nama: string;
  persentase: number;
  isDefault?: boolean;
  hasNilai?: boolean;
}

interface PengaturanNilaiTabProps {
  // Props will be added when connecting to main component
}

const DEFAULT_KOMPONEN_NILAI: NilaiComponent[] = [
  { id: '1', nama: 'UTS', persentase: 25, isDefault: true, hasNilai: false },
  { id: '2', nama: 'UAS', persentase: 25, isDefault: true, hasNilai: false },
  { id: '3', nama: 'Tugas', persentase: 30, isDefault: true, hasNilai: true },
  { id: '4', nama: 'Kehadiran', persentase: 20, isDefault: true, hasNilai: false },
];

const abbreviateComponentName = (nama: string): string => {
  const words = nama.trim().split(/\s+/);
  if (words.length === 1) {
    return nama;
  }
  return words.map(word => word.charAt(0).toUpperCase()).join('');
};

const cleanupNilaiDataForDeletedComponent = (componentName: string): void => {
  try {
    const nilaiData = localStorage.getItem('nilai');
    if (!nilaiData) return;

    const nilaiArray = JSON.parse(nilaiData);
    const updatedNilai = nilaiArray.map((nilai: any) => {
      let hasComponentData = false;

      if (nilai.komponenDinamis && Array.isArray(nilai.komponenDinamis)) {
        const initialLength = nilai.komponenDinamis.length;
        nilai.komponenDinamis = nilai.komponenDinamis.filter(
          (kd: any) => kd.komponenNama !== componentName
        );
        hasComponentData = nilai.komponenDinamis.length < initialLength;
      }

      if (hasComponentData || (nilai.nilaiAkhir !== null && nilai.nilaiAkhir !== undefined)) {
        nilai.nilaiAkhir = null;
        nilai.grade = null;
      }

      return nilai;
    });

    localStorage.setItem('nilai', JSON.stringify(updatedNilai));
  } catch (error) {
    console.error('Error cleaning up nilai data:', error);
  }
};

const PengaturanNilaiTab: React.FC<PengaturanNilaiTabProps> = () => {
  const [activeSubTab, setActiveSubTab] = useState<'komponen' | 'grade' | 'minimal'>('komponen');
  const [komponenNilai, setKomponenNilai] = useState<NilaiComponent[]>(DEFAULT_KOMPONEN_NILAI);
  const [isLoading, setIsLoading] = useState(true);

  const [newComponent, setNewComponent] = useState({ nama: '', persentase: 0, hasNilai: false });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalPersentase = komponenNilai.reduce((sum, item) => sum + item.persentase, 0);
  const isValid = totalPersentase === 100;

  // Fetch komponen nilai from API
  useEffect(() => {
    const fetchKomponenNilai = async () => {
      try {
        setIsLoading(true);
        const result = await apiService.getAllKomponenNilai();
        if (result.success && result.komponenNilai) {
          if (result.komponenNilai.length > 0) {
            setKomponenNilai(result.komponenNilai);
          } else {
            // If no data, initialize with default
            setKomponenNilai(DEFAULT_KOMPONEN_NILAI);
          }
        }
      } catch (error) {
        console.error('Error fetching komponen nilai:', error);
        setKomponenNilai(DEFAULT_KOMPONEN_NILAI);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKomponenNilai();
  }, []);

  const handleAddComponent = () => {
    if (!newComponent.nama.trim()) {
      setMessage({ type: 'error', text: 'Nama komponen tidak boleh kosong' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (newComponent.persentase <= 0 || newComponent.persentase > 100) {
      setMessage({ type: 'error', text: 'Persentase harus antara 0-100' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (komponenNilai.some((item) => item.nama.toLowerCase() === newComponent.nama.toLowerCase())) {
      setMessage({ type: 'error', text: 'Komponen dengan nama ini sudah ada' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const abbreviatedName = abbreviateComponentName(newComponent.nama);
    const newId = Date.now().toString();

    try {
      const updatedComponents = [
        ...komponenNilai,
        {
          id: newId,
          nama: abbreviatedName,
          persentase: newComponent.persentase,
          isDefault: false,
          hasNilai: newComponent.hasNilai,
        },
      ];

      // Calculate total persentase after adding
      const totalPersentaseAfter = updatedComponents.reduce((sum, item) => sum + item.persentase, 0);

      setKomponenNilai(updatedComponents);
      setNewComponent({ nama: '', persentase: 0, hasNilai: false });

      // Show appropriate message based on total persentase
      if (totalPersentaseAfter > 100) {
        setMessage({ type: 'error', text: 'Komponen ditambahkan melebihi persentase' });
        // Message will stay until user clicks "Simpan Pengaturan"
      } else if (totalPersentaseAfter === 100) {
        setMessage({ type: 'success', text: 'Persentase Komponen Sesuai, Klik Simpan Pengaturan' });
        // Message will stay until user clicks "Simpan Pengaturan"
      } else {
        setMessage({ type: 'success', text: 'Komponen nilai berhasil ditambahkan' });
        // Message will stay until user clicks "Simpan Pengaturan"
      }
    } catch (error) {
      console.error('Error adding component:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menambah komponen' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleUpdateComponent = (id: string, field: 'nama' | 'persentase' | 'hasNilai', value: any) => {
    const updatedComponents = komponenNilai.map((item) =>
      item.id === id
        ? {
            ...item,
            [field]: field === 'persentase' ? parseInt(value) || 0 : field === 'hasNilai' ? Boolean(value) : value
          }
        : item
    );

    setKomponenNilai(updatedComponents);

    // If updating persentase, check total and show message
    if (field === 'persentase') {
      const totalPersentaseAfter = updatedComponents.reduce((sum, item) => sum + item.persentase, 0);
      
      if (totalPersentaseAfter > 100) {
        setMessage({ type: 'error', text: 'Komponen ditambahkan melebihi persentase' });
        // Message will stay until user clicks "Simpan Pengaturan"
      } else if (totalPersentaseAfter === 100) {
        setMessage({ type: 'success', text: 'Persentase Komponen Sesuai, Klik Simpan Pengaturan' });
        // Message will stay until user clicks "Simpan Pengaturan"
      } else {
        // Keep previous message or show info if needed
        // Don't clear message automatically
      }
    }
  };

  const handleDeleteComponent = (id: string) => {
    const component = komponenNilai.find((item) => item.id === id);
    if (component?.isDefault) {
      setMessage({ type: 'error', text: 'Komponen bawaan tidak dapat dihapus' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    cleanupNilaiDataForDeletedComponent(component!.nama);

    const updatedComponents = komponenNilai.filter((item) => item.id !== id);
    setKomponenNilai(updatedComponents);

    // Check total persentase after deletion
    const totalPersentaseAfter = updatedComponents.reduce((sum, item) => sum + item.persentase, 0);

    if (totalPersentaseAfter === 100) {
      setMessage({ type: 'success', text: 'Persentase Komponen Sesuai, Klik Simpan Pengaturan' });
      // Message will stay until user clicks "Simpan Pengaturan"
    } else if (totalPersentaseAfter > 100) {
      setMessage({ type: 'error', text: 'Komponen ditambahkan melebihi persentase' });
      // Message will stay until user clicks "Simpan Pengaturan"
    } else {
      setMessage({ type: 'success', text: `Komponen nilai "${component!.nama}" berhasil dihapus. Semua data nilai untuk komponen ini juga telah dihapus.` });
      // Message will stay until user clicks "Simpan Pengaturan"
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setMessage({
        type: 'error',
        text: `Total persentase harus 100%, saat ini ${totalPersentase}%`,
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    try {
      // Save to API
      const result = await apiService.updateAllKomponenNilai(komponenNilai);
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Pengaturan nilai berhasil disimpan',
        });
        // Refresh data from API
        const refreshResult = await apiService.getAllKomponenNilai();
        if (refreshResult.success && refreshResult.komponenNilai) {
          setKomponenNilai(refreshResult.komponenNilai);
        }
        // Clear message after successful save (after 3 seconds)
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Terjadi kesalahan saat menyimpan pengaturan',
        });
        // Keep error message visible until user fixes it
      }
    } catch (error) {
      console.error('Error saving component settings:', error);
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan pengaturan',
      });
      // Keep error message visible until user fixes it
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <nav className="flex gap-1 p-4 sm:p-4 lg:p-5 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('komponen')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${
              activeSubTab === 'komponen'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Komponen
          </button>
          <button
            onClick={() => setActiveSubTab('grade')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${
              activeSubTab === 'grade'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Grade 
          </button>
          <button
            onClick={() => setActiveSubTab('minimal')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${
              activeSubTab === 'minimal'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Nilai Minimal
          </button>
        </nav>
      </div>

      {activeSubTab === 'komponen' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-white">Tambah Komponen Nilai Baru</h3>
              </div>
              <div className="p-5 sm:p-6 lg:p-7">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                        Nama Komponen
                      </label>
                      <input
                        type="text"
                        value={newComponent.nama}
                        onChange={(e) => setNewComponent({ ...newComponent, nama: e.target.value })}
                        placeholder="Cth: Praktek"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                        Persentase (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newComponent.persentase}
                        onChange={(e) => setNewComponent({ ...newComponent, persentase: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                        Tipe Nilai
                      </label>
                      <select
                        value={newComponent.hasNilai ? 'multiple' : 'single'}
                        onChange={(e) => setNewComponent({ ...newComponent, hasNilai: e.target.value === 'multiple' })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="single">Tunggal</option>
                        <option value="multiple">Ganda</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddComponent();
                        }}
                        className="w-full justify-center flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200"
                      >
                        <Plus size={16} className="mr-1.5" />
                        <span className="">Tambah</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-white">Daftar Komponen Nilai</h3>
              </div>
              <div className="p-5 sm:p-6 lg:p-7">
                <form onSubmit={handleSave} className="space-y-6">

                <div className="space-y-3">
                  {komponenNilai.length > 0 ? (
                    komponenNilai.map((item) => (
                      <div key={item.id} className="group bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base font-semibold text-slate-900">
                              {item.nama}
                            </span>
                            {item.isDefault && (
                              <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                                Bawaan
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 mt-1">
                            <span>{item.persentase}%</span>
                            <span className="text-slate-400">•</span>
                            <span>{item.hasNilai ? 'Nilai Ganda' : 'Nilai Tunggal'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.persentase}
                              onChange={(e) => handleUpdateComponent(item.id, 'persentase', e.target.value)}
                              className="w-14 sm:w-16 px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-lg text-center text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <span className="text-slate-600 text-xs sm:text-sm">%</span>
                          </div>
                          {!item.isDefault && (
                            <button
                              onClick={() => handleDeleteComponent(item.id)}
                              className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Hapus komponen"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 sm:py-10 text-slate-500">
                      <p className="text-sm sm:text-base">Belum ada komponen nilai</p>
                    </div>
                  )}
                </div>
                {message.text && (
                  <div
                    className={`p-4 sm:p-5 rounded-lg sm:rounded-xl border ${
                      message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {message.type === 'success' ? (
                        <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                      )}
                      <span className="text-xs sm:text-sm">{message.text}</span>
                    </div>
                  </div>
                )}

                <Button type="submit" fullWidth className="justify-center flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium">
                  <Save size={16} className="mr-2" />
                  Simpan Pengaturan
                </Button>
                </form>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-white">Ringkasan Pengaturan</h3>
              </div>
              <div className="p-5 sm:p-6 lg:p-7 space-y-4">
                <div className="p-4 sm:p-5 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base">Komponen Aktif</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {komponenNilai.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-xs sm:text-sm">
                        <div>
                          <p className="font-semibold text-blue-900">{item.nama}</p>
                          {item.isDefault && (
                            <p className="text-xs text-blue-700 mt-0.5">Bawaan</p>
                          )}
                        </div>
                        <p className="font-bold text-blue-900">{item.persentase}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`p-4 sm:p-5 rounded-lg sm:rounded-xl border ${
                    isValid
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <h4 className={`font-semibold mb-2 sm:mb-3 text-sm sm:text-base ${
                    isValid ? 'text-emerald-900' : 'text-orange-900'
                  }`}>
                    Total Persentase
                  </h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs sm:text-sm ${
                      isValid ? 'text-emerald-700' : 'text-orange-700'
                    }`}>
                      Jumlah
                    </span>
                    <p className={`text-2xl sm:text-3xl font-bold ${
                      isValid ? 'text-emerald-900' : 'text-orange-900'
                    }`}>
                      {totalPersentase}%
                    </p>
                  </div>
                  {!isValid && (
                    <p className="text-xs text-orange-700">
                      Harus 100% untuk simpan
                    </p>
                  )}
                </div>

                <div className="p-4 sm:p-5 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">Info Penting</h4>
                  <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 sm:space-y-2">
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Komponen bawaan tidak bisa dihapus</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Nama tidak bisa diubah setelah ditambah</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Total persentase harus 100%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'grade' && (
        <GradeSettings />
      )}

      {activeSubTab === 'minimal' && (
        <PengaturanNilaiMinimalTab />
      )}
    </div>
  );
};

export default PengaturanNilaiTab;
