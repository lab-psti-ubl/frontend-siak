import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import UploadAreaKTA from './UploadAreaKTA';
import PreviewKTA from './PreviewKTA';
import { BackgroundKTA } from '../../../../../types';
import { apiService } from '../../../../../services/apiService';

interface PengaturanBackgroundKTATabProps {
  backgroundKTA: BackgroundKTA | null;
  setBackgroundKTA: (data: BackgroundKTA | null) => void;
}

interface PreviewState {
  type: 'depan' | 'belakang' | null;
  ktaType: 'murid' | 'guru' | null;
}

const PengaturanBackgroundKTATab: React.FC<PengaturanBackgroundKTATabProps> = ({
  backgroundKTA,
  setBackgroundKTA,
}) => {
  const [backgroundMuridDepan, setBackgroundMuridDepan] = useState<string>(backgroundKTA?.backgroundDepanMuridBase64 || '');
  const [backgroundMuridBelakang, setBackgroundMuridBelakang] = useState<string>(backgroundKTA?.backgroundBelakangMuridBase64 || '');
  const [backgroundGuruDepan, setBackgroundGuruDepan] = useState<string>(backgroundKTA?.backgroundDepanGuruBase64 || '');
  const [backgroundGuruBelakang, setBackgroundGuruBelakang] = useState<string>(backgroundKTA?.backgroundBelakangGuruBase64 || '');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewState, setPreviewState] = useState<PreviewState>({ type: null, ktaType: null });

  // Function to compress image
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'depan' | 'belakang',
    ktaType: 'murid' | 'guru'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'Ukuran file terlalu besar. Maksimal 10MB.',
      });
      return;
    }

    try {
      // Compress image before converting to base64
      let finalBase64: string;
      const maxSizeBytes = 3 * 1024 * 1024; // 3MB limit for base64 payload
      
      // Try compression levels from least to most aggressive
      let base64 = await compressImage(file, 1920, 1080, 0.75);
      
      // Calculate actual payload size (base64 string length in bytes when sent as JSON)
      // Base64 string itself is the payload, so we use the string length
      // For JSON, each character is 1 byte, but base64 encoding makes it ~33% larger than binary
      // So we estimate: base64 string length ≈ actual payload size in JSON
      let base64SizeBytes = base64.length;
      
      if (base64SizeBytes > maxSizeBytes) {
        // Try more aggressive compression
        base64 = await compressImage(file, 1280, 720, 0.6);
        base64SizeBytes = base64.length;
        
        if (base64SizeBytes > maxSizeBytes) {
          // Try even more aggressive compression
          base64 = await compressImage(file, 1024, 576, 0.5);
          base64SizeBytes = base64.length;
          
          if (base64SizeBytes > maxSizeBytes) {
            setMessage({
              type: 'error',
              text: 'Gambar terlalu besar bahkan setelah kompresi. Silakan gunakan gambar yang lebih kecil atau resolusi lebih rendah.',
            });
            return;
          }
        }
      }
      
      finalBase64 = base64;
      
      // Set the compressed base64
      if (ktaType === 'murid') {
        if (type === 'depan') {
          setBackgroundMuridDepan(finalBase64);
        } else {
          setBackgroundMuridBelakang(finalBase64);
        }
      } else {
        if (type === 'depan') {
          setBackgroundGuruDepan(finalBase64);
        } else {
          setBackgroundGuruBelakang(finalBase64);
        }
      }

      // Clear any previous messages
      setMessage({ type: '', text: '' });
    } catch (error: any) {
      console.error('Error compressing image:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Terjadi kesalahan saat memproses gambar',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !backgroundMuridDepan &&
      !backgroundMuridBelakang &&
      !backgroundGuruDepan &&
      !backgroundGuruBelakang
    ) {
      setMessage({
        type: 'error',
        text: 'Minimal upload satu background (Murid atau Guru).',
      });
      return;
    }

    try {
      const newBackgroundKTA: BackgroundKTA = {
        id: backgroundKTA?.id || `bg_${Date.now()}`,
        backgroundDepanMuridBase64: backgroundMuridDepan || undefined,
        backgroundBelakangMuridBase64: backgroundMuridBelakang || undefined,
        backgroundDepanGuruBase64: backgroundGuruDepan || undefined,
        backgroundBelakangGuruBase64: backgroundGuruBelakang || undefined,
        createdAt: backgroundKTA?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await apiService.saveBackgroundKTA(newBackgroundKTA);
      
      if (response.success && response.backgroundKTA) {
        setBackgroundKTA(response.backgroundKTA);
        setMessage({
          type: 'success',
          text: 'Background KTA berhasil disimpan!',
        });
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Gagal menyimpan background KTA',
        });
      }
    } catch (error: any) {
      console.error('Error saving background KTA:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Terjadi kesalahan saat menyimpan background KTA',
      });
    }
  };

  const handleDeleteMuridDepan = () => {
    setBackgroundMuridDepan('');
    setMessage({ type: '', text: '' });
  };

  const handleDeleteMuridBelakang = () => {
    setBackgroundMuridBelakang('');
    setMessage({ type: '', text: '' });
  };

  const handleDeleteGuruDepan = () => {
    setBackgroundGuruDepan('');
    setMessage({ type: '', text: '' });
  };

  const handleDeleteGuruBelakang = () => {
    setBackgroundGuruBelakang('');
    setMessage({ type: '', text: '' });
  };

  const handleClear = () => {
    setBackgroundMuridDepan('');
    setBackgroundMuridBelakang('');
    setBackgroundGuruDepan('');
    setBackgroundGuruBelakang('');
    setBackgroundKTA(null);
    setMessage({
      type: 'success',
      text: 'Semua background KTA telah dihapus.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-8">Pengaturan Background KTA</h3>

        <form onSubmit={handleSave} className="space-y-8">
          <UploadAreaKTA
            backgroundDepan={backgroundMuridDepan}
            backgroundBelakang={backgroundMuridBelakang}
            label="Background KTA Murid"
            onUploadDepan={(e) => handleImageUpload(e, 'depan', 'murid')}
            onUploadBelakang={(e) => handleImageUpload(e, 'belakang', 'murid')}
            onDeleteDepan={handleDeleteMuridDepan}
            onDeleteBelakang={handleDeleteMuridBelakang}
            onPreviewDepan={() => setPreviewState({ type: 'depan', ktaType: 'murid' })}
            onPreviewBelakang={() => setPreviewState({ type: 'belakang', ktaType: 'murid' })}
          />

          <div className="border-t border-gray-200 pt-8" />

          <UploadAreaKTA
            backgroundDepan={backgroundGuruDepan}
            backgroundBelakang={backgroundGuruBelakang}
            label="Background KTA Guru"
            onUploadDepan={(e) => handleImageUpload(e, 'depan', 'guru')}
            onUploadBelakang={(e) => handleImageUpload(e, 'belakang', 'guru')}
            onDeleteDepan={handleDeleteGuruDepan}
            onDeleteBelakang={handleDeleteGuruBelakang}
            onPreviewDepan={() => setPreviewState({ type: 'depan', ktaType: 'guru' })}
            onPreviewBelakang={() => setPreviewState({ type: 'belakang', ktaType: 'guru' })}
          />

          {message.text && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle size={16} className="mr-2" />
                ) : (
                  <AlertCircle size={16} className="mr-2" />
                )}
                {message.text}
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button type="submit" fullWidth={false} className="justify-center flex items-center">
              <Upload size={16} className="mr-2" />
              Simpan Background KTA
            </Button>
            {(backgroundMuridDepan || backgroundMuridBelakang || backgroundGuruDepan || backgroundGuruBelakang) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Hapus Semua
              </button>
            )}
          </div>
        </form>
      </Card>

      {previewState.type && previewState.ktaType && (
        <PreviewKTA
          previewMode={previewState.type}
          backgroundDepan={
            previewState.ktaType === 'murid' ? backgroundMuridDepan : backgroundGuruDepan
          }
          backgroundBelakang={
            previewState.ktaType === 'murid' ? backgroundMuridBelakang : backgroundGuruBelakang
          }
          ktaType={previewState.ktaType}
          onClose={() => setPreviewState({ type: null, ktaType: null })}
        />
      )}
    </div>
  );
};

export default PengaturanBackgroundKTATab;
