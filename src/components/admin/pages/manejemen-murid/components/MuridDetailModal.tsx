import React, { useState, useMemo, useEffect } from 'react';
import { FileText, User as UserIcon, BookOpen, Calendar, Filter } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Badge from '../../../../ui/Badge';
import Card from '../../../../ui/Card';
import { User, Kelas, Jurusan, Murid } from '../../../../../types';
import MuridContactInfo from './MuridContactInfo';
import MuridAcademicInfo from './MuridAcademicInfo';
import PhotoPreviewModal from '../../../../ui/PhotoPreviewModal';
import { generateRaportData, RaportData } from '../../../../../utils/raport';
import { useNilai } from '../../../../../hooks/useNilai';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useJadwalPelajaran } from '../../../../../hooks/useJadwalPelajaran';
import { useAbsensi } from '../../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../../hooks/useSesiAbsensi';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';
import { useGurus } from '../../../../../hooks/useGurus';
import { useMurid } from '../../../../../hooks/useMurid';
import { useKelas } from '../../../../../hooks/useKelas';
import { useJurusan } from '../../../../../hooks/useJurusan';
import { useStatusBagiRaport } from '../../../../../hooks/useStatusBagiRaport';
import { usePengaturanNilaiMinimal } from '../../../../../hooks/usePengaturanNilaiMinimal';
import { useKomponenNilai } from '../../../../../hooks/useKomponenNilai';
import { setNilaiMinimalCache, setKomponenNilaiCache } from '../../../../../utils/nilaiUtils';
import MuridRaportSection from './MuridRaportSection';

interface MuridDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  murid: User | null;
  currentKelas: Kelas | undefined;
  currentJurusan: Jurusan | undefined;
  onDownloadKartu: (murid: User) => void;
  onWhatsAppCall: (phone: string) => void;
  detailTahunAjaran?: string;
  detailSemester?: number;
}

const MuridDetailModal: React.FC<MuridDetailModalProps> = ({
  isOpen,
  onClose,
  murid,
  currentKelas,
  currentJurusan,
  onDownloadKartu,
  onWhatsAppCall,
  detailTahunAjaran,
  detailSemester
}) => {
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'raport'>('info');
  
  // Local state for filters
  const [localTahunAjaran, setLocalTahunAjaran] = useState<string>('');
  const [localSemester, setLocalSemester] = useState<number>(1);

  // Fetch all necessary data for raport
  const { nilai } = useNilai();
  const { mataPelajaran } = useMataPelajaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const { gurus } = useGurus();
  const { murid: allMurid } = useMurid();
  const { kelas } = useKelas();
  const { jurusan } = useJurusan();
  const { statusBagiRaport } = useStatusBagiRaport();
  const { pengaturanNilaiMinimal } = usePengaturanNilaiMinimal();
  const { komponenNilai } = useKomponenNilai();

  // Set nilai minimal cache from database
  React.useEffect(() => {
    if (pengaturanNilaiMinimal) {
      setNilaiMinimalCache({
        nilaiAkhirMinimal: pengaturanNilaiMinimal.nilaiAkhirMinimal,
        tingkatKehadiranMinimal: pengaturanNilaiMinimal.tingkatKehadiranMinimal,
      });
    }
  }, [pengaturanNilaiMinimal]);

  // Set komponen nilai cache from database
  React.useEffect(() => {
    if (komponenNilai && komponenNilai.length > 0) {
      setKomponenNilaiCache(komponenNilai);
    }
  }, [komponenNilai]);

  // Combine users for raport generation
  const users = useMemo(() => {
    return [...gurus, ...allMurid];
  }, [gurus, allMurid]);

  // Get available semesters for selected tahun ajaran (helper function)
  const getAvailableSemestersForTahunAjaran = useMemo(() => {
    return (tahunAjaranValue: string): number[] => {
      if (!tahunAjaranValue) return [];
      
      // Ambil semua semester yang ada di database untuk tahun ajaran ini
      const semestersFromTahunAjaran = tahunAjaran
        .filter(ta => ta.tahun === tahunAjaranValue)
        .map(ta => ta.semester);
      
      // Ambil semester dari data nilai untuk murid ini (jika ada)
      const semestersFromNilai = new Set<number>();
      if (nilai && murid) {
        nilai
          .filter(n => n.tahunAjaran === tahunAjaranValue && n.muridId === murid.id)
          .forEach(n => semestersFromNilai.add(n.semester));
      }
      
      // Ambil semester dari jadwal pelajaran untuk kelas murid (jika ada)
      const semestersFromJadwal = new Set<number>();
      if (jadwalPelajaran && currentKelas) {
        jadwalPelajaran
          .filter(j => j.tahunAjaran === tahunAjaranValue && j.kelasId === currentKelas.id)
          .forEach(j => semestersFromJadwal.add(j.semester));
      }
      
      // Gabungkan semua semester yang ditemukan
      const allSemesters = new Set([
        ...semestersFromTahunAjaran,
        ...Array.from(semestersFromNilai),
        ...Array.from(semestersFromJadwal)
      ]);
      
      return Array.from(allSemesters).sort((a, b) => a - b);
    };
  }, [tahunAjaran, nilai, jadwalPelajaran, murid, currentKelas]);

  // Initialize local state from props or active tahun ajaran
  useEffect(() => {
    if (detailTahunAjaran) {
      setLocalTahunAjaran(detailTahunAjaran);
    } else if (activeTahunAjaran?.tahun) {
      setLocalTahunAjaran(activeTahunAjaran.tahun);
    } else if (tahunAjaran.length > 0) {
      const active = tahunAjaran.find(ta => ta.isActive);
      if (active) {
        setLocalTahunAjaran(active.tahun);
      } else {
        setLocalTahunAjaran(tahunAjaran[0].tahun);
      }
    }
  }, [detailTahunAjaran, activeTahunAjaran, tahunAjaran]);

  // Initialize and validate semester when tahun ajaran changes
  useEffect(() => {
    if (!localTahunAjaran) return;
    
    const availableSemestersList = getAvailableSemestersForTahunAjaran(localTahunAjaran);
    
    if (availableSemestersList.length === 0) {
      setLocalSemester(1);
      return;
    }
    
    // Jika detailSemester diberikan dan valid, gunakan itu
    if (detailSemester !== undefined && availableSemestersList.includes(detailSemester)) {
      setLocalSemester(detailSemester);
      return;
    }
    
    // Jika semester yang dipilih tidak valid, pilih semester yang tersedia
    if (!availableSemestersList.includes(localSemester)) {
      // Coba semester aktif dulu
      const activeTA = tahunAjaran.find(ta => ta.tahun === localTahunAjaran && ta.isActive);
      if (activeTA && availableSemestersList.includes(activeTA.semester)) {
        setLocalSemester(activeTA.semester);
      } else {
        // Gunakan semester pertama yang tersedia
        setLocalSemester(availableSemestersList[0]);
      }
    } else if (detailSemester === undefined && activeTahunAjaran?.tahun === localTahunAjaran) {
      // Jika tidak ada detailSemester, gunakan semester aktif
      if (activeTahunAjaran.semester && availableSemestersList.includes(activeTahunAjaran.semester)) {
        setLocalSemester(activeTahunAjaran.semester);
      }
    }
  }, [localTahunAjaran, detailSemester, activeTahunAjaran, tahunAjaran, getAvailableSemestersForTahunAjaran, localSemester]);

  // Get available tahun ajaran list
  const availableTahunAjaran = useMemo(() => {
    return tahunAjaran.sort((a, b) => b.tahun.localeCompare(a.tahun));
  }, [tahunAjaran]);

  // Get available semesters for selected tahun ajaran
  // Hanya menampilkan semester yang benar-benar ada di database untuk tahun ajaran tersebut
  const availableSemesters = useMemo(() => {
    if (!localTahunAjaran) return [];
    
    // Ambil semua semester yang ada di database untuk tahun ajaran ini
    const semestersFromTahunAjaran = tahunAjaran
      .filter(ta => ta.tahun === localTahunAjaran)
      .map(ta => ta.semester);
    
    // Jika tidak ada data tahun ajaran untuk tahun ini, return empty
    if (semestersFromTahunAjaran.length === 0) return [];
    
    // Ambil semester dari data nilai untuk murid ini (jika ada)
    const semestersFromNilai = new Set<number>();
    if (nilai && murid) {
      nilai
        .filter(n => n.tahunAjaran === localTahunAjaran && n.muridId === murid.id)
        .forEach(n => semestersFromNilai.add(n.semester));
    }
    
    // Ambil semester dari jadwal pelajaran untuk kelas murid (jika ada)
    const semestersFromJadwal = new Set<number>();
    if (jadwalPelajaran && currentKelas) {
      jadwalPelajaran
        .filter(j => j.tahunAjaran === localTahunAjaran && j.kelasId === currentKelas.id)
        .forEach(j => semestersFromJadwal.add(j.semester));
    }
    
    // Gabungkan semua semester yang ditemukan
    // Prioritas: semester dari data tahunAjaran (sumber kebenaran utama)
    const allSemesters = new Set([
      ...semestersFromTahunAjaran,
      ...Array.from(semestersFromNilai),
      ...Array.from(semestersFromJadwal)
    ]);
    
    // Cari tahun ajaran aktif untuk menentukan semester aktif
    const activeTA = tahunAjaran.find(ta => ta.tahun === localTahunAjaran && ta.isActive);
    
    // Konversi ke array dengan format yang sesuai
    return Array.from(allSemesters)
      .sort((a, b) => a - b)
      .map(sem => ({
        id: `sem-${sem}`,
        tahun: localTahunAjaran,
        semester: sem,
        isActive: activeTA?.semester === sem || false,
        tanggalMulai: '',
        tanggalSelesai: ''
      }));
  }, [localTahunAjaran, tahunAjaran, nilai, jadwalPelajaran, murid, currentKelas]);

  // Use local state for selected values
  const selectedTahunAjaran = localTahunAjaran;
  const selectedSemester = localSemester;

  // Function to generate raport data
  const generateMuridRaportData = useMemo(() => {
    return (muridId: string, tahunAjaranValue: string, semester: number): RaportData | null => {
      if (!tahunAjaranValue || !semester) return null;
      
      const filteredTahunAjaran = tahunAjaran.filter(ta => ta.tahun === tahunAjaranValue);
      
      return generateRaportData(
        muridId,
        semester,
        users,
        kelas,
        jurusan,
        nilai,
        mataPelajaran,
        filteredTahunAjaran,
        jadwalPelajaran,
        absensi,
        sesiAbsensi,
        statusBagiRaport
      );
    };
  }, [users, kelas, jurusan, nilai, mataPelajaran, tahunAjaran, jadwalPelajaran, absensi, sesiAbsensi, statusBagiRaport]);

  if (!murid) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Murid - ${murid.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Student Info */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => murid.profileImage && setIsPhotoPreviewOpen(true)}
              className={`transition-all ${
                murid.profileImage ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'cursor-default'
              }`}
            >
              {murid.profileImage ? (
                <img
                  src={murid.profileImage}
                  alt={murid.name}
                  className="w-16 h-16 object-cover rounded-full border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {getInitials(murid.name)}
                </div>
              )}
            </button>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{murid.name}</h3>
              <p className="text-blue-600 font-medium">NISN: {(murid as Murid).nisn || 'N/A'}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={(murid as Murid).isActive !== false ? 'success' : 'default'}>
                  {(murid as Murid).isActive !== false ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserIcon size={16} />
                <span>Informasi</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('raport')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'raport'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText size={16} />
                <span>Raport</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MuridContactInfo 
              murid={murid}
              onWhatsAppCall={onWhatsAppCall}
            />
            
            <MuridAcademicInfo 
              murid={murid}
              currentKelas={currentKelas}
              currentJurusan={currentJurusan}
              onDownloadKartu={onDownloadKartu}
            />
          </div>
        )}

        {activeTab === 'raport' && (
          <div className="space-y-4">
            {/* Filter Section */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <Filter size={18} className="text-blue-600" />
                <h4 className="font-semibold text-gray-900">Filter Raport</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>Tahun Ajaran</span>
                    </div>
                  </label>
                  <select
                    value={selectedTahunAjaran}
                    onChange={(e) => {
                      const newTahunAjaran = e.target.value;
                      setLocalTahunAjaran(newTahunAjaran);
                      
                      // Reset semester to first available semester when tahun ajaran changes
                      const availableSemestersList = getAvailableSemestersForTahunAjaran(newTahunAjaran);
                      if (availableSemestersList.length > 0) {
                        // Coba semester aktif dulu
                        const activeTA = tahunAjaran.find(ta => ta.tahun === newTahunAjaran && ta.isActive);
                        if (activeTA && availableSemestersList.includes(activeTA.semester)) {
                          setLocalSemester(activeTA.semester);
                        } else {
                          setLocalSemester(availableSemestersList[0]);
                        }
                      } else {
                        setLocalSemester(1);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium shadow-sm transition-all bg-white"
                  >
                    {availableTahunAjaran.length > 0 ? (
                      availableTahunAjaran.map((ta) => (
                        <option key={ta.id} value={ta.tahun}>
                          {ta.tahun} {ta.isActive && '(Aktif)'}
                        </option>
                      ))
                    ) : (
                      <option value="">Tidak ada tahun ajaran</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setLocalSemester(parseInt(e.target.value))}
                    disabled={!selectedTahunAjaran}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium shadow-sm transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {availableSemesters.length > 0 ? (
                      availableSemesters.map((sem) => (
                        <option key={`${sem.tahun}-${sem.semester}`} value={sem.semester}>
                          Semester {sem.semester} {sem.semester === 1 ? '(Ganjil)' : '(Genap)'} {sem.isActive && '• Aktif'}
                        </option>
                      ))
                    ) : (
                      <option value="">Pilih tahun ajaran terlebih dahulu</option>
                    )}
                  </select>
                </div>
              </div>
            </Card>

            {/* Raport Content */}
            {selectedTahunAjaran && selectedSemester ? (
              <MuridRaportSection
                murid={murid}
                detailTahunAjaran={selectedTahunAjaran}
                detailSemester={selectedSemester}
                generateMuridRaportData={generateMuridRaportData}
              />
            ) : (
              <Card className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Data Tidak Tersedia</h3>
                <p className="text-gray-600">
                  Tahun ajaran atau semester belum dipilih. Silakan pilih tahun ajaran dan semester untuk melihat raport.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>

      <PhotoPreviewModal
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        photoUrl={murid.profileImage || null}
        name={murid.name}
      />
    </Modal>
  );
};

export default MuridDetailModal;