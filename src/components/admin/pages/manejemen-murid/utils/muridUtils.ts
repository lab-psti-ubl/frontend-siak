import { User, Kelas, Jurusan } from '../../../../../types';
import { getTingkatKelasOptions } from '../../../../../utils/jenjangPendidikanUtils';

export const getMuridCount = (jurusanId: string, kelas: Kelas[], users: User[]) => {
  const kelasIds = kelas.filter(k => k.jurusanId === jurusanId).map(k => k.id);
  return users.filter(u => u.role === 'murid' && kelasIds.includes(u.kelasId || '')).length;
};

export const getMuridCountInKelas = (kelasId: string, users: User[]) => {
  return users.filter(u => u.role === 'murid' && u.kelasId === kelasId && u.isActive !== false).length;
};

export const getKelasStats = (jurusanId: string, kelas: Kelas[]) => {
  const kelasJurusan = kelas.filter(k => k.jurusanId === jurusanId);
  const tingkatOptions = getTingkatKelasOptions();
  const byTingkat: Record<number, number> = {};

  tingkatOptions.forEach(tingkat => {
    byTingkat[tingkat] = kelasJurusan.filter(k => k.tingkat === tingkat).length;
  });

  return {
    total: kelasJurusan.length,
    byTingkat,
    tingkatOptions
  };
};

export const getWaliKelasName = (waliKelasId: string, users: User[]) => {
  const waliKelas = users.find(u => u.id === waliKelasId && u.role === 'guru');
  return waliKelas?.name || 'Belum ditentukan';
};

export const getJurusanName = (jurusanId: string, jurusan: Jurusan[]) => {
  return jurusan.find(j => j.id === jurusanId)?.name || 'Unknown';
};

export const getInitials = (name: string) => {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

export const formatWhatsAppNumber = (phone: string) => {
  let formattedPhone = phone.replace(/\D/g, '');
  
  if (!formattedPhone.startsWith('62') && formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('62') && !formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone;
  }
  
  return formattedPhone;
};

export const openWhatsApp = (phone: string) => {
  const formattedPhone = formatWhatsAppNumber(phone);
  const whatsappUrl = `https://wa.me/${formattedPhone}`;
  window.open(whatsappUrl, '_blank');
};

export const renderProfileImageOrInitials = (profileImage: string | undefined, name: string) => {
  if (profileImage) {
    return {
      isImage: true,
      profileImage: profileImage
    };
  }

  return {
    isImage: false,
    initials: getInitials(name)
  };
};