import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Search } from 'lucide-react';
import { User } from '../../../types';
import { apiService } from '../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../ui/ToastContainer';
import Button from '../../ui/Button';

interface TambahSantriFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: User | null;
}

const TambahSantriForm: React.FC<TambahSantriFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData
}) => {
  const isEditMode = !!editData;
  const [availableMurid, setAvailableMurid] = useState<User[]>([]);
  const [loadingMurid, setLoadingMurid] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rfidError, setRfidError] = useState('');
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nisn: '',
    password: '',
    whatsappOrtu: '',
    isActive: true,
    rfidGuid: '',
  });

  // Fetch available murid when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableMurid();
      // If edit mode, populate form with editData
      if (isEditMode && editData) {
        setFormData({
          name: editData.name || '',
          email: editData.email || '',
          nisn: (editData as any).nisn || '',
          password: '',
          whatsappOrtu: (editData as any).whatsappOrtu || '',
          isActive: (editData as any).isActive !== false,
          rfidGuid: (editData as any).rfidGuid || '',
        });
        setSearchQuery(editData.name || '');
        // If santri is from murid, set selectedMurid
        if ((editData as any).isFromMurid === true) {
          // We'll need to fetch the murid data, but for now just set the name
          setSelectedMurid(editData);
        }
      }
    }
  }, [isOpen, isEditMode, editData]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchAvailableMurid = async () => {
    setLoadingMurid(true);
    try {
      const response = await apiService.getAvailableMurid();
      if (response.success && response.murid) {
        setAvailableMurid(response.murid);
      }
    } catch (error) {
      console.error('Error fetching available murid:', error);
    } finally {
      setLoadingMurid(false);
    }
  };

  const filteredMurid = availableMurid.filter(murid =>
    murid.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    murid.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((murid as any).nisn && (murid as any).nisn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0 && filteredMurid.length > 0);

    // If user clears the input, reset selected murid
    if (!value) {
      setSelectedMurid(null);
      resetFormData();
    } else {
      // Always update formData.name when user types (for manual input)
      // This ensures formData.name is always in sync with the input
      setFormData(prev => ({ ...prev, name: value }));
    }
  };

  const handleSelectMurid = (murid: User) => {
    setSelectedMurid(murid);
    setSearchQuery(murid.name);
    setShowSuggestions(false);
    
    // Auto-fill form with murid data
    setFormData({
      name: murid.name,
      email: murid.email,
      nisn: (murid as any).nisn || '',
      password: '',
      whatsappOrtu: (murid as any).whatsappOrtu || '',
      isActive: (murid as any).isActive !== false,
      rfidGuid: (murid as any).rfidGuid || '',
    });
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      email: '',
      nisn: '',
      password: '',
      whatsappOrtu: '',
      isActive: true,
      rfidGuid: '',
    });
    setRfidError('');
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'rfidGuid') {
      setRfidError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRfidError('');

    if (isEditMode && editData) {
      // Edit mode - update existing santri
      const santriName = formData.name.trim() || searchQuery.trim();
      
      if (!santriName || !formData.email.trim() || !formData.nisn.trim()) {
        showErrorToast('Error', 'Nama, email, dan NISN wajib diisi!');
        return;
      }

      try {
        // Check if santri is from murid collection
        if ((editData as any).isFromMurid === true) {
          // Update murid
          const response = await apiService.updateMurid(editData.id, {
            name: santriName,
            email: formData.email.trim(),
            nisn: formData.nisn.trim(),
            password: formData.password || undefined,
            whatsappOrtu: formData.whatsappOrtu || undefined,
            isActive: formData.isActive,
            rfidGuid: formData.rfidGuid || undefined,
          });

          if (response.success) {
            showSuccessToast('Berhasil', 'Santri berhasil diperbarui');
            onSuccess();
            resetForm();
            onClose();
          } else {
            showErrorToast('Error', response.message || 'Gagal memperbarui santri');
          }
        } else {
          // Update santriData (standalone santri)
          const response = await apiService.updateSantri(editData.id, {
            name: santriName,
            email: formData.email.trim(),
            nisn: formData.nisn.trim(),
            password: formData.password || undefined,
            whatsappOrtu: formData.whatsappOrtu || undefined,
            isActive: formData.isActive,
            rfidGuid: formData.rfidGuid || undefined,
          });

          if (response.success) {
            showSuccessToast('Berhasil', 'Santri berhasil diperbarui');
            onSuccess();
            resetForm();
            onClose();
          } else {
            showErrorToast('Error', response.message || 'Gagal memperbarui santri');
          }
        }
      } catch (error: any) {
        if (error.message?.includes('Email sudah terdaftar')) {
          showErrorToast('Error', 'Email sudah terdaftar');
        } else if (error.message?.includes('NISN sudah terdaftar')) {
          showErrorToast('Error', 'NISN sudah terdaftar');
        } else if (error.message?.includes('GUID/RFID')) {
          setRfidError('GUID/RFID sudah terdaftar ke guru/murid lain');
        } else {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat memperbarui santri');
        }
      }
    } else if (selectedMurid) {
      // Add existing murid as santri
      try {
        const response = await apiService.addSantri({
          muridId: selectedMurid.id,
        });

        if (response.success) {
          showSuccessToast('Berhasil', 'Santri berhasil ditambahkan');
          onSuccess();
          resetForm();
          onClose();
        } else {
          showErrorToast('Error', response.message || 'Gagal menambahkan santri');
        }
      } catch (error: any) {
        if (error.message?.includes('GUID/RFID')) {
          setRfidError('GUID/RFID sudah terdaftar ke guru/murid lain');
        } else {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat menambahkan santri');
        }
      }
    } else {
      // Create new santri (not from murid collection)
      // Use searchQuery as name if formData.name is empty (when user types manually)
      const santriName = formData.name.trim() || searchQuery.trim();
      
      if (!santriName || !formData.email.trim() || !formData.nisn.trim()) {
        showErrorToast('Error', 'Nama, email, dan NISN wajib diisi!');
        return;
      }

      try {
        const response = await apiService.addSantri({
          name: santriName,
          email: formData.email.trim(),
          nisn: formData.nisn.trim(),
          password: formData.password || undefined,
          whatsappOrtu: formData.whatsappOrtu || undefined,
          isActive: formData.isActive,
          rfidGuid: formData.rfidGuid || undefined,
        });

        if (response.success) {
          showSuccessToast('Berhasil', 'Santri berhasil ditambahkan');
          onSuccess();
          resetForm();
          onClose();
        } else {
          showErrorToast('Error', response.message || 'Gagal menambahkan santri');
        }
      } catch (error: any) {
        if (error.message?.includes('Email sudah terdaftar')) {
          showErrorToast('Error', 'Email sudah terdaftar');
        } else if (error.message?.includes('NISN sudah terdaftar')) {
          showErrorToast('Error', 'NISN sudah terdaftar');
        } else if (error.message?.includes('GUID/RFID')) {
          setRfidError('GUID/RFID sudah terdaftar ke guru/murid lain');
        } else {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat menambahkan santri');
        }
      }
    }
  };

  const resetForm = () => {
    setSelectedMurid(null);
    setSearchQuery('');
    setShowSuggestions(false);
    resetFormData();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditMode ? 'Edit Data Santri' : 'Tambah Santri Baru'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nama Lengkap with Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap *
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={selectedMurid ? selectedMurid.name : (searchQuery || formData.name)}
                onChange={handleNameInputChange}
                onFocus={() => {
                  if (searchQuery && filteredMurid.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Update formData.name when user leaves the field
                  if (!selectedMurid && searchQuery) {
                    setFormData(prev => ({ ...prev, name: searchQuery }));
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ketik nama murid atau masukkan nama baru"
                required
              />
              {loadingMurid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredMurid.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredMurid.map((murid) => (
                    <button
                      key={murid.id}
                      type="button"
                      onClick={() => handleSelectMurid(murid)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{murid.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(murid as any).nisn && `NISN: ${(murid as any).nisn}`}
                        {murid.email && ` • ${murid.email}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && filteredMurid.length === 0 && searchQuery && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-600">
                  Tidak ada murid yang tersedia. Data akan ditambahkan sebagai santri baru.
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedMurid 
                ? `Murid terpilih: ${selectedMurid.name} - Form akan terisi otomatis`
                : 'Ketik untuk mencari murid yang ada, atau masukkan nama baru untuk menambahkan santri baru'
              }
            </p>
          </div>

          {/* Form fields - shown when no murid selected or when editing or in edit mode */}
          {(!selectedMurid || isEditMode) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="contoh@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NISN *
                  </label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => handleFormChange('nisn', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nomor Induk Siswa Nasional"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Orang Tua
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsappOrtu}
                    onChange={(e) => handleFormChange('whatsappOrtu', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="08xxxxxxxxxx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 08xxxxxxxxxx atau +62xxxxxxxxxx
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFID GUID (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.rfidGuid}
                  onChange={(e) => {
                    handleFormChange('rfidGuid', e.target.value);
                    setRfidError('');
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    rfidError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan RFID GUID (contoh: 5a2a0a)"
                />
                {rfidError && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {rfidError}
                  </p>
                )}
                {!rfidError && (
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan RFID GUID secara manual
                  </p>
                )}
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
                  Status Aktif
                </label>
              </div>
            </>
          )}

          {/* Show selected murid info - only in add mode */}
          {selectedMurid && !isEditMode && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Data murid terpilih:
              </p>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Nama:</strong> {selectedMurid.name}</p>
                <p><strong>Email:</strong> {selectedMurid.email}</p>
                {(selectedMurid as any).nisn && <p><strong>NISN:</strong> {(selectedMurid as any).nisn}</p>}
                {(selectedMurid as any).whatsappOrtu && <p><strong>WhatsApp Orang Tua:</strong> {(selectedMurid as any).whatsappOrtu}</p>}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Klik "Tambah Santri" untuk menambahkan murid ini sebagai santri.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <Button type="submit" fullWidth className="justify-center flex items-center bg-blue-600 hover:bg-blue-700">
              <Save size={16} className="mr-2" />
              {isEditMode ? 'Simpan Perubahan' : 'Tambah Santri'}
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={onClose} className="justify-center flex items-center">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TambahSantriForm;

