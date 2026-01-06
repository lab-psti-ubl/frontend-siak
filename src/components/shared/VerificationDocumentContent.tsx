import React, { useMemo, useEffect } from 'react';
import SuratIzinDisplay from './modals/SuratIzinDisplay';
import IzinDetailContent from './modals/IzinDetailContent';
import RaportMuridContent from '../murid/pages/raport/RaportMuridContent';
import { DocumentType, SuratIzin, IzinGuru, User, Kelas } from '../../types';
import { generateRaportData, RaportData, setProfilSekolahCache, setDataKepsekCache } from '../../utils/raport';
import { setNilaiMinimalCache, setKomponenNilaiCache } from '../../utils/nilaiUtils';

interface VerificationDocumentContentProps {
  documentType: DocumentType;
  documentData: SuratIzin | IzinGuru | any | null;
  users: User[];
  kelas: Kelas[];
  loading?: boolean;
  error?: string | null;
}

const VerificationDocumentContent: React.FC<VerificationDocumentContentProps> = ({
  documentType,
  documentData,
  users,
  kelas,
  loading,
  error
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600">Memuat dokumen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium">Gagal memuat dokumen</p>
        <p className="text-slate-500 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-slate-400 mb-4">
          <svg className="w-16 h-16 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">Dokumen tidak ditemukan</p>
        <p className="text-slate-500 text-sm mt-1">
          Dokumen dengan ID tersebut tidak ditemukan dalam database
        </p>
      </div>
    );
  }

  // Render based on document type
  // Check if it's IzinGuru (has guruId) or SuratIzin (has muridId)
  if ('guruId' in documentData) {
    // This is IzinGuru (guru izin)
    const izinGuru = documentData as any;
    // Use data from backend response if available, otherwise fallback to users
    const guru = izinGuru.guru || users.find(u => u.id === izinGuru.guruId);
    return (
      <IzinDetailContent
        izin={izinGuru}
        user={guru || null}
        showVerificationStatus={false}
      />
    );
  } else if ('muridId' in documentData) {
    // This is SuratIzin (murid izin)
    const suratIzin = documentData as any;
    // Use data from backend response if available, otherwise fallback to users/kelas
    const murid = suratIzin.murid || users.find(u => u.id === suratIzin.muridId);
    const kelasData = suratIzin.kelas || (murid?.kelasId ? kelas.find(k => k.id === murid.kelasId) : null);
    
    // Create users array with murid if not in users
    const usersWithMurid = murid && !users.find(u => u.id === murid.id) 
      ? [...users, murid] 
      : users;
    
    // Create kelas array with kelasData if not in kelas
    const kelasWithData = kelasData && !kelas.find(k => k.id === kelasData.id)
      ? [...kelas, kelasData]
      : kelas;
    
    return (
      <SuratIzinDisplay
        surat={suratIzin}
        users={usersWithMurid}
        kelas={kelasWithData}
        showVerificationSection={false}
      />
    );
  }

  // For laporan hasil belajar, generate raport data from raw data
  if (documentType === 'raport' && documentData && documentData.type === 'raport') {
    return <RaportVerificationContent documentData={documentData} />;
  }

  return (
    <div className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
      <p className="text-slate-600 font-medium">Jenis dokumen tidak dikenali</p>
    </div>
  );
};

// Wrapper component for RaportMuridContent in verification page
// Uses data from rawData to set cache and provide data to RaportMuridContent
const RaportVerificationContent: React.FC<{ documentData: any }> = ({ documentData }) => {
  // Set cache for data kepsek, nilai minimal, and komponen nilai from rawData
  useEffect(() => {
    if (documentData.rawData) {
      const { dataKepsek, pengaturanNilaiMinimal, komponenNilai } = documentData.rawData;
      
      // Set data kepsek cache (use first item if array, or the object itself)
      if (dataKepsek) {
        const kepsekData = Array.isArray(dataKepsek) && dataKepsek.length > 0 
          ? dataKepsek[0] 
          : dataKepsek;
        setDataKepsekCache(kepsekData);
        // Also set as global variable for fallback access
        (window as any).__dataKepsekCache = kepsekData;
      }
      
      // Set nilai minimal cache
      if (pengaturanNilaiMinimal) {
        setNilaiMinimalCache({
          nilaiAkhirMinimal: pengaturanNilaiMinimal.nilaiAkhirMinimal || 70,
          tingkatKehadiranMinimal: pengaturanNilaiMinimal.tingkatKehadiranMinimal || 75,
        });
      }

      // Set komponen nilai cache
      if (komponenNilai && Array.isArray(komponenNilai) && komponenNilai.length > 0) {
        setKomponenNilaiCache(komponenNilai);
      }
    }
  }, [documentData.rawData]);

  const raportData = useMemo(() => {
    if (!documentData.rawData) return null;

    const { users: raportUsers, kelas: raportKelas, jurusan, nilai, mataPelajaran, tahunAjaran, jadwalPelajaran, absensi, sesiAbsensi, statusBagiRaport, pengaturanNilaiMinimal, komponenNilai } = documentData.rawData;

    // Set cache immediately before generating raport data to ensure it's available
    if (pengaturanNilaiMinimal) {
      setNilaiMinimalCache({
        nilaiAkhirMinimal: pengaturanNilaiMinimal.nilaiAkhirMinimal || 70,
        tingkatKehadiranMinimal: pengaturanNilaiMinimal.tingkatKehadiranMinimal || 75,
      });
    }

    if (komponenNilai && Array.isArray(komponenNilai) && komponenNilai.length > 0) {
      setKomponenNilaiCache(komponenNilai);
    }

    return generateRaportData(
      documentData.studentId,
      documentData.semester,
      raportUsers,
      raportKelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran,
      jadwalPelajaran,
      absensi,
      sesiAbsensi,
      statusBagiRaport
    );
  }, [documentData]);

  if (!raportData) {
    return (
      <div className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-slate-400 mb-4">
          <svg className="w-16 h-16 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">Gagal memuat data laporan hasil belajar</p>
      </div>
    );
  }

  return (
    <RaportMuridContent
      raportData={raportData}
      onPrintRaport={() => {}}
      onDownloadRaportPDF={() => {}}
      onExportRaportData={() => {}}
    />
  );
};

export default VerificationDocumentContent;

