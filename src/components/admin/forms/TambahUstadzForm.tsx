import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Search } from 'lucide-react';
import { User } from '../../../types';
import { apiService } from '../../../services/apiService';
import { showSuccessToast, showErrorToast } from '../../ui/ToastContainer';
import Button from '../../ui/Button';
import { useGurus } from '../../../hooks/useGurus';

interface TambahUstadzFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: User | null;
}

const TambahUstadzForm: React.FC<TambahUstadzFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData
}) => {
  const isEditMode = !!editData;
  const { refreshGurus } = useGurus();
  const [availableGurus, setAvailableGurus] = useState<User[]>([]);
  const [loadingGurus, setLoadingGurus] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rfidError, setRfidError] = useState('');
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nip: '',
    password: '',
    subject: '',
    isActive: true,
    rfidGuid: '',
  });

  // Fetch available gurus when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableGurus();
      // If edit mode, populate form with editData
      if (isEditMode && editData) {
        setFormData({
          name: editData.name || '',
          email: editData.email || '',
          phone: editData.phone || '',
          nip: (editData as any).nip || '',
          password: '',
          subject: (editData as any).subject || '',
          isActive: (editData as any).isActive !== false,
          rfidGuid: (editData as any).rfidGuid || '',
        });
        setSearchQuery(editData.name || '');
        setSelectedGuru(editData);
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

  const fetchAvailableGurus = async () => {
    setLoadingGurus(true);
    try {
      const response = await apiService.getAvailableGurus();
      if (response.success && response.gurus) {
        setAvailableGurus(response.gurus);
      }
    } catch (error) {
      console.error('Error fetching available gurus:', error);
    } finally {
      setLoadingGurus(false);
    }
  };

  const filteredGurus = availableGurus.filter(guru =>
    guru.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guru.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((guru as any).nip && (guru as any).nip.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0 && filteredGurus.length > 0);

    // Sync searchQuery to formData.name when user types manually
    // This ensures validation works when user types a new name
    if (!selectedGuru) {
      setFormData(prev => ({ ...prev, name: value }));
    }

    // If user clears the input, reset selected guru
    if (!value) {
      setSelectedGuru(null);
      resetFormData();
    }
  };

  const handleSelectGuru = (guru: User) => {
    setSelectedGuru(guru);
    setSearchQuery(guru.name);
    setShowSuggestions(false);
    
    // Auto-fill form with guru data
    setFormData({
      name: guru.name,
      email: guru.email,
      phone: guru.phone || '',
      nip: (guru as any).nip || '',
      password: '',
      subject: (guru as any).subject || '',
      isActive: (guru as any).isActive !== false,
      rfidGuid: (guru as any).rfidGuid || '',
    });
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      nip: '',
      password: '',
      subject: '',
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
      // Edit mode - update existing ustadz (which is a guru)
      const ustadzName = formData.name.trim() || searchQuery.trim();
      
      if (!ustadzName || !formData.email.trim() || !formData.nip.trim()) {
        showErrorToast('Error', 'Nama, email, dan NIP wajib diisi!');
        return;
      }

      try {
        const response = await apiService.updateGuru(editData.id, {
          name: ustadzName,
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          nip: formData.nip.trim(),
          password: formData.password.trim() || undefined,
          subject: formData.subject.trim() || undefined,
          isActive: formData.isActive,
          rfidGuid: formData.rfidGuid.trim() || undefined,
        });

        if (response.success) {
          showSuccessToast('Berhasil', 'Ustadz berhasil diperbarui');
          await refreshGurus();
          onSuccess();
          resetForm();
          onClose();
        } else {
          showErrorToast('Error', response.message || 'Gagal memperbarui ustadz');
        }
      } catch (error: any) {
        if (error.message?.includes('Email sudah terdaftar')) {
          showErrorToast('Error', 'Email sudah terdaftar');
        } else if (error.message?.includes('NIP sudah terdaftar')) {
          showErrorToast('Error', 'NIP sudah terdaftar');
        } else if (error.message?.includes('GUID/RFID')) {
          setRfidError('GUID/RFID sudah terdaftar ke guru/murid lain');
        } else {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat memperbarui ustadz');
        }
      }
    } else if (selectedGuru) {
      // Add existing guru as ustadz
      try {
        const response = await apiService.addUstadz({
          guruId: selectedGuru.id,
        });

        if (response.success) {
          showSuccessToast('Berhasil', 'Ustadz berhasil ditambahkan');
          onSuccess();
          resetForm();
          onClose();
        } else {
          showErrorToast('Error', response.message || 'Gagal menambahkan ustadz');
        }
      } catch (error: any) {
        if (error.message?.includes('GUID/RFID')) {
          setRfidError('GUID/RFID sudah terdaftar ke guru/murid lain');
        } else {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat menambahkan ustadz');
        }
      }
    } else {
      // Create new guru and add as ustadz
      // Use searchQuery as name if formData.name is empty (when user types manually)
      const ustadzName = formData.name.trim() || searchQuery.trim();
      
      if (!ustadzName || !formData.email.trim() || !formData.nip.trim()) {
        showErrorToast('Error', 'Nama, email, dan NIP wajib diisi!');
        return;
      }

      try {
        const response = await apiService.addUstadz({
          name: ustadzName,
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          nip: formData.nip.trim(),
          password: formData.password.trim() || undefined,
          subject: formData.subject.trim() || undefined,
          isActive: formData.isActive,
          rfidGuid: formData.rfidGuid.trim() || undefined,
        });

        if (response.success) {
          showSuccessToast('Berhasil', 'Ustadz berhasil ditambahkan');
          // Clear cache dan refresh data guru karena ustadz baru ditambahkan ke collection guru
          await refreshGurus();
          onSuccess();
          resetForm();
          onClose();
        } else {
          showErrorToast('Error', response.message || 'Gagal menambahkan ustadz');
        }
      } catch (error: any) {
        if (error.message?.includes('Email sudah terdaftar')) {
          showErrorToast('Error', 'Email sudah terdaftar');
        } else if (error.message?.includes('NIP sudah terdaftar')) {
          showErrorToast('Error', 'NIP sudah terdaftar');
        } else if (error.message?.includes('GUID/RFID')) {
          setRfidError('GUID/RFID sudah terdaftar ke guru/murid lain');
        } else {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat menambahkan ustadz');
        }
      }
    }
  };

  const resetForm = () => {
    setSelectedGuru(null);
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
              {isEditMode ? 'Edit Data Ustadz' : 'Tambah Ustadz Baru'}
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
                value={searchQuery}
                onChange={handleNameInputChange}
                onFocus={() => {
                  if (searchQuery && filteredGurus.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Ketik nama guru atau masukkan nama baru"
                required
              />
              {loadingGurus && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredGurus.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredGurus.map((guru) => (
                    <button
                      key={guru.id}
                      type="button"
                      onClick={() => handleSelectGuru(guru)}
                      className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{guru.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(guru as any).nip && `NIP: ${(guru as any).nip}`}
                        {guru.email && ` • ${guru.email}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && filteredGurus.length === 0 && searchQuery && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-600">
                  Tidak ada guru yang tersedia. Data akan ditambahkan sebagai guru baru.
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedGuru 
                ? `Guru terpilih: ${selectedGuru.name} - Form akan terisi otomatis`
                : 'Ketik untuk mencari guru yang ada, atau masukkan nama baru untuk menambahkan guru baru'
              }
            </p>
          </div>

          {/* Form fields - shown when no guru selected or when editing or in edit mode */}
          {(!selectedGuru || isEditMode) && (
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="contoh@sekolah.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="08xxxxxxxxxx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 08xxxxxxxxxx atau +62xxxxxxxxxx
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIP *
                  </label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => handleFormChange('nip', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Nomor Induk Pegawai"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posisi / Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleFormChange('subject', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Contoh: Ustadz, Guru Tahfiz"
                  />
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
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
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
                  Status Aktif
                </label>
              </div>
            </>
          )}

          {/* Show selected guru info - only in add mode */}
          {selectedGuru && !isEditMode && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">
                Data guru terpilih:
              </p>
              <div className="space-y-1 text-sm text-green-800">
                <p><strong>Nama:</strong> {selectedGuru.name}</p>
                <p><strong>Email:</strong> {selectedGuru.email}</p>
                {(selectedGuru as any).nip && <p><strong>NIP:</strong> {(selectedGuru as any).nip}</p>}
                {selectedGuru.phone && <p><strong>Telepon:</strong> {selectedGuru.phone}</p>}
              </div>
              <p className="text-xs text-green-700 mt-2">
                Klik "Tambah Ustadz" untuk menambahkan guru ini sebagai ustadz.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <Button type="submit" fullWidth className="justify-center flex items-center bg-green-600 hover:bg-green-700">
              <Save size={16} className="mr-2" />
              {isEditMode ? 'Simpan Perubahan' : 'Tambah Ustadz'}
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

export default TambahUstadzForm;

