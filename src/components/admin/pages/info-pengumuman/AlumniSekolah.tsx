import React, { useState, useMemo } from 'react';
import { GraduationCap, Users, TrendingUp, Award, Calendar, Download, Eye, Search, Filter } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import { useAlumni } from '../../../../hooks/useAlumni';
import { useKelas } from '../../../../hooks/useKelas';
import { useJurusan } from '../../../../hooks/useJurusan';
import { useProfilSekolah } from '../../../../hooks/useProfilSekolah';
import { Alumni, Kelas, Jurusan } from '../../../../types';
import AlumniStatsCards from './components/AlumniStatsCards';
import AlumniFilters from './components/AlumniFilters';
import AlumniTable from './components/AlumniTable';
import AlumniDetailModal from './components/AlumniDetailModal';
import { exportAlumniData } from './utils/alumniUtils';
import { isJurusanRequiredSync } from '../../../../utils/jenjangPendidikanUtils';

const AlumniSekolah: React.FC = () => {
  // Use hooks dengan cache untuk mengambil data dari database
  const { alumni, loading: loadingAlumni } = useAlumni();
  const { kelas } = useKelas();
  const { jurusan } = useJurusan();
  const { profilSekolah } = useProfilSekolah();
  
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tahunLulusFilter, setTahunLulusFilter] = useState<string>('');
  const [jurusanFilter, setJurusanFilter] = useState<string>('');
  const [kelasFilter, setKelasFilter] = useState<string>('');

  const filteredAlumni = useMemo(() => {
    return alumni.filter(alumniItem => {
      const matchesSearch = alumniItem.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alumniItem.nisn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alumniItem.namaKelas.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTahunLulus = !tahunLulusFilter || alumniItem.tahunLulus === tahunLulusFilter;
      const matchesJurusan = !jurusanFilter || alumniItem.jurusanId === jurusanFilter;
      const matchesKelas = !kelasFilter || alumniItem.kelasId === kelasFilter;
      
      return matchesSearch && matchesTahunLulus && matchesJurusan && matchesKelas;
    }).sort((a, b) => {
      // Sort by tahun lulus (descending), then by peringkat sekolah (ascending)
      if (a.tahunLulus !== b.tahunLulus) {
        // Parse tahun ajaran untuk sorting yang benar
        const yearA = parseInt(a.tahunLulus.split('/')[0]);
        const yearB = parseInt(b.tahunLulus.split('/')[0]);
        return yearB - yearA; // Descending (newest first)
      }
      return a.peringkatSekolah - b.peringkatSekolah;
    });
  }, [alumni, searchTerm, tahunLulusFilter, jurusanFilter, kelasFilter]);

  const handleViewDetail = (alumniItem: Alumni) => {
    setSelectedAlumni(alumniItem);
    setIsDetailModalOpen(true);
  };

  const handleExportData = () => {
    exportAlumniData(filteredAlumni, {
      searchTerm,
      tahunLulusFilter,
      jurusanFilter: jurusan.find(j => j.id === jurusanFilter)?.name || '',
      kelasFilter: kelas.find(k => k.id === kelasFilter)?.name || ''
    }, profilSekolah);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTahunLulusFilter('');
    setJurusanFilter('');
    setKelasFilter('');
  };

  // Get unique values for filters
  const uniqueTahunLulus = useMemo(() => {
    return [...new Set(alumni.map(a => a.tahunLulus))].sort().reverse();
  }, [alumni]);

  const uniqueJurusan = useMemo(() => {
    return [...new Set(alumni.map(a => a.jurusanId).filter(Boolean))];
  }, [alumni]);

  const showJurusan = isJurusanRequiredSync();

  const availableKelas = useMemo(() => {
    // Get unique kelas IDs that have alumni
    const uniqueKelasIds = [...new Set(alumni.map(a => a.kelasId))];
    
    // Filter kelas to only include tingkat 12 that have alumni, excluding alumni classes (tingkat 99 or name contains 'Alumni')
    let filteredKelas = kelas.filter(k => 
      k.tingkat === 12 && 
      uniqueKelasIds.includes(k.id) &&
      !k.name.toLowerCase().includes('alumni')
    );
    
    // If jurusan filter is selected, further filter by jurusan
    if (showJurusan && jurusanFilter) {
      filteredKelas = filteredKelas.filter(k => k.jurusanId === jurusanFilter);
    }
    
    return filteredKelas;
  }, [showJurusan, jurusanFilter, kelas, alumni]);

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Alumni Sekolah
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                Data alumni dan lulusan {profilSekolah?.namaSekolah || 'Sekolah'}
              </p>
            </div>
            <Button onClick={handleExportData} variant="secondary" className="text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">
              <Download size={16} className="mr-1 sm:mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <AlumniStatsCards alumni={filteredAlumni} />

      <AlumniFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        tahunLulusFilter={tahunLulusFilter}
        setTahunLulusFilter={setTahunLulusFilter}
        jurusanFilter={jurusanFilter}
        setJurusanFilter={setJurusanFilter}
        kelasFilter={kelasFilter}
        setKelasFilter={setKelasFilter}
        uniqueTahunLulus={uniqueTahunLulus}
        uniqueJurusan={uniqueJurusan}
        availableKelas={availableKelas}
        jurusan={jurusan}
        onResetFilters={resetFilters}
        filteredCount={filteredAlumni.length}
        totalCount={alumni.length}
      />

      <AlumniTable
        alumni={filteredAlumni}
        onViewDetail={handleViewDetail}
        searchTerm={searchTerm}
      />

      <AlumniDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAlumni(null);
        }}
        alumni={selectedAlumni}
        kelas={kelas}
        jurusan={jurusan}
      />
    </div>
  );
};

export default AlumniSekolah;