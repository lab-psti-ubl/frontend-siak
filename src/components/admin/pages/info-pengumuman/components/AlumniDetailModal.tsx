import React, { useMemo, useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Award, 
  Calendar, 
  School, 
  User as UserIcon,
  Mail,
  Phone,
  UserCircle,
  Trophy,
  BookOpen,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { Alumni, Kelas, Jurusan } from '../../../../../types';
import { getSchoolName } from '../../../../../utils/jenjangPendidikanUtils';
import { apiService } from '../../../../../services/apiService';

interface AlumniDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumni: Alumni | null;
  kelas: Kelas[];
  jurusan: Jurusan[];
}

const AlumniDetailModal: React.FC<AlumniDetailModalProps> = ({
  isOpen,
  onClose,
  alumni
}) => {
  const [muridData, setMuridData] = useState<any>(null);
  const [loadingMurid, setLoadingMurid] = useState(false);

  // Fetch murid data untuk mendapatkan createdAt dan data lengkap
  useEffect(() => {
    const fetchMuridData = async () => {
      if (!alumni?.muridId) {
        setMuridData(null);
        return;
      }

      setLoadingMurid(true);
      try {
        const response = await apiService.getMuridById(alumni.muridId);
        if (response.success && response.murid) {
          setMuridData(response.murid);
        }
      } catch (error) {
        console.error('Error fetching murid data:', error);
      } finally {
        setLoadingMurid(false);
      }
    };

    if (isOpen && alumni) {
      fetchMuridData();
    } else {
      // Reset state ketika modal ditutup
      setMuridData(null);
      setLoadingMurid(false);
    }
  }, [alumni?.muridId, isOpen]);

  // Gunakan createdAt dari murid (sama seperti di profil murid)
  const tanggalBergabung = useMemo(() => {
    if (muridData?.createdAt) {
      return muridData.createdAt;
    }
    return alumni?.createdAt || null;
  }, [muridData, alumni]);

  const handleWhatsAppCall = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  if (!alumni) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Profile Header - Enhanced Mobile */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-400 to-blue-600 rounded-2xl sm:rounded-3xl shadow-2xl">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative p-5 sm:p-8">
            {/* Mobile Layout - Centered */}
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 sm:gap-6">
              {/* Avatar - Larger on Mobile */}
              <div className="relative flex-shrink-0">
                {muridData?.profileImage ? (
                  <img
                    src={muridData.profileImage}
                    alt={alumni.nama}
                    className="w-28 h-28 sm:w-24 sm:h-24 rounded-3xl sm:rounded-2xl border-4 border-white shadow-2xl object-cover"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-24 sm:h-24 bg-white bg-opacity-25 backdrop-blur-md rounded-3xl sm:rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center">
                    <span className="text-3xl sm:text-3xl font-bold text-white">
                      {getInitials(alumni.nama)}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-emerald-500 rounded-full p-2.5 sm:p-2 border-4 border-white shadow-xl">
                  <GraduationCap className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>

              {/* Info - Better Mobile Layout */}
              <div className="flex-1 w-full sm:w-auto">
                <h2 className="text-2xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-2 text-white drop-shadow-lg">
                  {alumni.nama}
                </h2>
                
                {/* Badges - Better Mobile Layout */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4 sm:mb-3">
                  <span className="px-4 py-1.5 sm:px-3 sm:py-1 bg-white bg-opacity-25 backdrop-blur-sm text-white border-2 border-white border-opacity-50 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    {alumni.namaKelas}
                  </span>
                  {alumni.namaJurusan && (
                    <span className="px-4 py-1.5 sm:px-3 sm:py-1 bg-white bg-opacity-25 backdrop-blur-sm text-white border-2 border-white border-opacity-50 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                      {alumni.namaJurusan}
                    </span>
                  )}
                  <span className="px-4 py-1.5 sm:px-3 sm:py-1 bg-emerald-500 text-white border-2 border-emerald-400 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    Alumni {alumni.tahunLulus}
                  </span>
                </div>
                
                {/* NISN - Better Mobile Layout */}
                <div className="flex items-center justify-center sm:justify-start gap-2 text-white text-opacity-95 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-xl sm:rounded-lg sm:bg-transparent sm:backdrop-blur-none sm:p-0">
                  <CreditCard className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold">NISN: {alumni.nisn}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Diri Section */}
        <Card className="p-4 sm:p-6 border-0 shadow-lg">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600" />
            Data Diri
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Email */}
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Email</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 break-all text-left">
                  {muridData?.email || '-'}
                </p>
              </div>
            </div>

            {/* Phone */}
            {muridData?.phone && (
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Nomor Telepon</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900 break-words sm:whitespace-nowrap text-left">
                    {muridData.phone}
                  </p>
                </div>
              </div>
            )}

            {/* WhatsApp Orang Tua */}
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">WhatsApp Orang Tua</p>
                {muridData?.whatsappOrtu ? (
                  <button
                    onClick={() => handleWhatsAppCall(muridData.whatsappOrtu)}
                    className="text-sm sm:text-base font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-2 group text-left"
                  >
                    <span className="break-words sm:whitespace-nowrap">{muridData.whatsappOrtu}</span>
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      (Klik untuk WhatsApp)
                    </span>
                  </button>
                ) : (
                  <p className="text-sm sm:text-base font-medium text-gray-400 text-left">-</p>
                )}
              </div>
            </div>

            
          </div>
        </Card>

        {/* Academic Achievement & Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Prestasi Akademik */}
          <Card className="p-4 sm:p-6 border-0 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-600" />
              Prestasi Akademik
            </h3>
            <div className="space-y-4">
              {/* Peringkat Kelas */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Peringkat Kelas</span>
                </div>
                <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base ${getRankBadgeColor(alumni.peringkatKelas)}`}>
                  #{alumni.peringkatKelas}
                </div>
              </div>

              {/* Peringkat Sekolah */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Peringkat Sekolah</span>
                </div>
                <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base ${getRankBadgeColor(alumni.peringkatSekolah)}`}>
                  #{alumni.peringkatSekolah}
                </div>
              </div>

              {/* Nilai Akhir */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Rata-rata Nilai</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-blue-600">{alumni.nilaiAkhir.toFixed(1)}</span>
              </div>

              {/* Tingkat Kehadiran */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Tingkat Kehadiran</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-emerald-600">{alumni.tingkatKehadiran.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          {/* Informasi Akademik */}
          <Card className="p-4 sm:p-6 border-0 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <School className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" />
              Informasi Akademik
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-xl">
                <span className="text-sm sm:text-base text-gray-700 font-medium">Kelas</span>
                <Badge variant="info">{alumni.namaKelas}</Badge>
              </div>
              {alumni.namaJurusan && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-amber-50 rounded-xl">
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Jurusan</span>
                  <Badge variant="warning">{alumni.namaJurusan}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 rounded-xl">
                <span className="text-sm sm:text-base text-gray-700 font-medium">Tahun Lulus</span>
                <Badge variant="success">{alumni.tahunLulus}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-xl">
                <span className="text-sm sm:text-base text-gray-700 font-medium">Tanggal Lulus</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {new Date(alumni.tanggalLulus).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Wali Kelas Information */}
        {alumni.namaWaliKelasSebelumnya && (
          <Card className="p-4 sm:p-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-4 sm:mb-6 flex items-center">
              <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Wali Kelas Saat Lulus
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 sm:p-4 bg-white rounded-xl">
                <p className="text-xs sm:text-sm text-blue-700 mb-1">Nama Wali Kelas</p>
                <p className="text-sm sm:text-base font-semibold text-blue-900">{alumni.namaWaliKelasSebelumnya}</p>
              </div>
              <div className="p-3 sm:p-4 bg-white rounded-xl">
                <p className="text-xs sm:text-sm text-blue-700 mb-1">NIP</p>
                <p className="text-sm sm:text-base font-semibold text-blue-900">{alumni.nipWaliKelasSebelumnya || '-'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Timeline */}
        <Card className="p-4 sm:p-6 border-0 shadow-lg">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-gray-600" />
            Timeline
          </h3>
          <div className="space-y-4">
            {/* Bergabung */}
            <div className="relative flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full border-4 border-white shadow-lg z-10"></div>
                <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                  Bergabung di {getSchoolName()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {tanggalBergabung 
                    ? new Date(tanggalBergabung).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : loadingMurid 
                      ? 'Memuat...'
                      : '-'
                  }
                </p>
              </div>
            </div>

            {/* Lulus */}
            <div className="relative flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-4 border-white shadow-lg z-10"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                  Lulus dari {alumni.namaKelas}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {new Date(alumni.tanggalLulus).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} - {alumni.tahunLulus}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default AlumniDetailModal;
