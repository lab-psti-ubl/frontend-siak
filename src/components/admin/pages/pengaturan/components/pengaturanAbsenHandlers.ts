import { PengaturanAbsen, PengaturanSKS, PengaturanIstirahat } from '../../../../../types';
import { validateAbsenForm, validateSKSForm, validateIstirahatForm, createPengaturanAbsen, createPengaturanSKS, createPengaturanIstirahat } from './pengaturanAbsenUtils';
import { apiService } from '../../../../../services/apiService';

export const handleAbsenSubmit = async (
  formData: any,
  activePengaturan: PengaturanAbsen | undefined,
  pengaturanAbsen: PengaturanAbsen[],
  setPengaturanAbsen: (data: PengaturanAbsen[]) => void,
  setMessage: (msg: { type: string; text: string }) => void
) => {
  setMessage({ type: '', text: '' });

  const validation = validateAbsenForm(
    formData.jamMasuk, 
    formData.jamPulang, 
    formData.toleransiMasuk, 
    formData.toleransiPulang,
    formData.hariSekolah,
    formData.hariKerja
  );
  if (!validation.valid) {
    setMessage({ type: 'error', text: validation.message });
    return;
  }

  try {
    if (activePengaturan) {
      // Update existing
      const response = await apiService.updatePengaturanAbsen(activePengaturan.id, {
        ...formData,
        isActive: true,
      });

      if (response.success) {
        // Refresh data
        const allResponse = await apiService.getAllPengaturanAbsen();
        if (allResponse.success && allResponse.pengaturanAbsen) {
          setPengaturanAbsen(allResponse.pengaturanAbsen);
        }
        setMessage({ type: 'success', text: 'Pengaturan absen berhasil diperbarui!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Gagal memperbarui pengaturan absen' });
      }
    } else {
      // Create new
      const response = await apiService.createPengaturanAbsen({
        ...formData,
        isActive: true,
      });

      if (response.success) {
        // Refresh data
        const allResponse = await apiService.getAllPengaturanAbsen();
        if (allResponse.success && allResponse.pengaturanAbsen) {
          setPengaturanAbsen(allResponse.pengaturanAbsen);
        }
        setMessage({ type: 'success', text: 'Pengaturan absen berhasil disimpan!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Gagal menyimpan pengaturan absen' });
      }
    }
  } catch (error: any) {
    console.error('Error saving pengaturan absen:', error);
    setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menyimpan pengaturan absen' });
  }

  setTimeout(() => {
    setMessage({ type: '', text: '' });
  }, 3000);
};

export const handleSKSSubmit = async (
  formData: any,
  activePengaturanSKS: PengaturanSKS | undefined,
  pengaturanSKS: PengaturanSKS[],
  setPengaturanSKS: (data: PengaturanSKS[]) => void,
  setSksMessage: (msg: { type: string; text: string }) => void
) => {
  setSksMessage({ type: '', text: '' });

  const validation = validateSKSForm(formData.durasiPerSKS, formData.istirahatAntarSKS);
  if (!validation.valid) {
    setSksMessage({ type: 'error', text: validation.message });
    return;
  }

  try {
    if (activePengaturanSKS) {
      // Update existing
      const response = await apiService.updatePengaturanSKS(activePengaturanSKS.id, {
        ...formData,
        isActive: true,
      });

      if (response.success) {
        // Refresh data
        const allResponse = await apiService.getAllPengaturanSKS();
        if (allResponse.success && allResponse.pengaturanSKS) {
          setPengaturanSKS(allResponse.pengaturanSKS);
        }
        setSksMessage({ type: 'success', text: 'Pengaturan SKS berhasil diperbarui!' });
      } else {
        setSksMessage({ type: 'error', text: response.message || 'Gagal memperbarui pengaturan SKS' });
      }
    } else {
      // Create new
      const response = await apiService.createPengaturanSKS({
        ...formData,
        isActive: true,
      });

      if (response.success) {
        // Refresh data
        const allResponse = await apiService.getAllPengaturanSKS();
        if (allResponse.success && allResponse.pengaturanSKS) {
          setPengaturanSKS(allResponse.pengaturanSKS);
        }
        setSksMessage({ type: 'success', text: 'Pengaturan SKS berhasil disimpan!' });
      } else {
        setSksMessage({ type: 'error', text: response.message || 'Gagal menyimpan pengaturan SKS' });
      }
    }
  } catch (error: any) {
    console.error('Error saving pengaturan SKS:', error);
    setSksMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menyimpan pengaturan SKS' });
  }

  setTimeout(() => {
    setSksMessage({ type: '', text: '' });
  }, 3000);
};

export const handleIstirahatSubmit = async (
  formData: any,
  activePengaturanIstirahat: PengaturanIstirahat | undefined,
  pengaturanIstirahat: PengaturanIstirahat[],
  setPengaturanIstirahat: (data: PengaturanIstirahat[]) => void,
  setIstirahatMessage: (msg: { type: string; text: string }) => void
) => {
  setIstirahatMessage({ type: '', text: '' });

  const validation = validateIstirahatForm(formData.jamMulai, formData.jamSelesai);
  if (!validation.valid) {
    setIstirahatMessage({ type: 'error', text: validation.message });
    return;
  }

  try {
    if (activePengaturanIstirahat) {
      // Update existing
      const response = await apiService.updatePengaturanIstirahat(activePengaturanIstirahat.id, {
        ...formData,
        isActive: true,
      });

      if (response.success) {
        // Refresh data
        const allResponse = await apiService.getAllPengaturanIstirahat();
        if (allResponse.success && allResponse.pengaturanIstirahat) {
          setPengaturanIstirahat(allResponse.pengaturanIstirahat);
        }
        setIstirahatMessage({ type: 'success', text: 'Pengaturan jam istirahat berhasil diperbarui!' });
      } else {
        setIstirahatMessage({ type: 'error', text: response.message || 'Gagal memperbarui pengaturan istirahat' });
      }
    } else {
      // Create new
      const response = await apiService.createPengaturanIstirahat({
        ...formData,
        isActive: true,
      });

      if (response.success) {
        // Refresh data
        const allResponse = await apiService.getAllPengaturanIstirahat();
        if (allResponse.success && allResponse.pengaturanIstirahat) {
          setPengaturanIstirahat(allResponse.pengaturanIstirahat);
        }
        setIstirahatMessage({ type: 'success', text: 'Pengaturan jam istirahat berhasil disimpan!' });
      } else {
        setIstirahatMessage({ type: 'error', text: response.message || 'Gagal menyimpan pengaturan istirahat' });
      }
    }
  } catch (error: any) {
    console.error('Error saving pengaturan istirahat:', error);
    setIstirahatMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menyimpan pengaturan istirahat' });
  }

  setTimeout(() => {
    setIstirahatMessage({ type: '', text: '' });
  }, 3000);
};
