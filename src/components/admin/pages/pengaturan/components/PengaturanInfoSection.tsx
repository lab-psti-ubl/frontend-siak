import React from 'react';
import { CheckCircle, AlertCircle, Calculator, Clock, BookOpen, Settings,Calendar } from 'lucide-react';
import Card from '../../../../ui/Card';
import { formatDurasi, calculateTotalDurasi } from '../../../../../utils/sksUtils';

interface PengaturanInfoSectionProps {
  activeTab: 'absen' | 'sks' | 'istirahat';
  sksFormData: {
    durasiPerSKS: number;
    istirahatAntarSKS: number;
  };
}

const PengaturanInfoSection: React.FC<PengaturanInfoSectionProps> = ({
  activeTab,
  sksFormData,
}) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Informasi Pengaturan {activeTab === 'absen' ? 'Absensi' : activeTab === 'sks' ? 'SKS' : 'Jam Istirahat'}
      </h3>
      {activeTab === 'absen' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Untuk Guru:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Guru wajib absen masuk sebelum mengajar kelas pertama</span>
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Guru wajib absen keluar setelah selesai mengajar kelas terakhir</span>
              </li>
              <li className="flex items-start">
                <AlertCircle size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Keterlambatan akan dicatat dalam sistem</span>
              </li>
              <li className="flex items-start">
                <AlertCircle size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Pulang lebih awal dari batas akan dicatat sebagai pelanggaran</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Untuk Murid:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Murid wajib absen masuk sebelum jam pelajaran dimulai</span>
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Murid wajib absen keluar setelah jam pelajaran selesai</span>
              </li>
              <li className="flex items-start">
                <AlertCircle size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Keterlambatan akan mempengaruhi nilai kedisiplinan</span>
              </li>
              <li className="flex items-start">
                <AlertCircle size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Absensi digunakan untuk laporan kehadiran bulanan</span>
              </li>
            </ul>
          </div>
        </div>
      ) : activeTab === 'sks' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Cara Kerja Sistem SKS:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <Calculator size={16} className="mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Setiap mata pelajaran memiliki jumlah SKS yang berbeda</span>
              </li>
              <li className="flex items-start">
                <Clock size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Durasi mata pelajaran = SKS × Durasi per SKS + Istirahat</span>
              </li>
              <li className="flex items-start">
                <BookOpen size={16} className="mr-2 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Jam selesai dihitung otomatis saat membuat jadwal</span>
              </li>
              <li className="flex items-start">
                <Settings size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Admin dapat menyesuaikan durasi sesuai kebijakan sekolah</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Contoh Implementasi:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Matematika 2 SKS = {formatDurasi(calculateTotalDurasi(2, {
                  id: '', durasiPerSKS: sksFormData.durasiPerSKS, istirahatAntarSKS: sksFormData.istirahatAntarSKS, isActive: true, createdAt: ''
                }))}</span>
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Fisika 4 SKS = {formatDurasi(calculateTotalDurasi(4, {
                  id: '', durasiPerSKS: sksFormData.durasiPerSKS, istirahatAntarSKS: sksFormData.istirahatAntarSKS, isActive: true, createdAt: ''
                }))}</span>
              </li>
              <li className="flex items-start">
                <AlertCircle size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Jam selesai akan otomatis terisi saat membuat jadwal</span>
              </li>
              <li className="flex items-start">
                <AlertCircle size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Perubahan pengaturan tidak mempengaruhi jadwal yang sudah ada</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Manfaat Pengaturan Jam Istirahat:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <Calendar size={16} className="mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Memastikan tidak ada jadwal pelajaran yang bentrok dengan jam istirahat</span>
              </li>
              <li className="flex items-start">
                <Clock size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Otomatis memotong jadwal yang melewati jam istirahat</span>
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Memberikan waktu istirahat yang konsisten untuk semua</span>
              </li>
              <li className="flex items-start">
                <Settings size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Dapat disesuaikan dengan kebijakan sekolah</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Contoh Penerapan:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Jadwal 10:00-11:30: Tidak terpengaruh istirahat</span>
              </li>
              <li className="flex items-start">
                <AlertCircle size={16} className="mr-2 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>Jadwal 11:00-14:00: Terpotong menjadi 11:00-12:00, lanjut 13:00-14:00</span>
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Jadwal 13:30-15:00: Tidak terpengaruh istirahat</span>
              </li>
              <li className="flex items-start">
                <AlertCircle size={16} className="mr-2 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Sistem otomatis menghitung ulang jam selesai</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PengaturanInfoSection;
