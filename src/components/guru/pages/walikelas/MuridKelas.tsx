import React, { useState, useMemo } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { exportToExcel } from '../../../../utils/exportUtils';
import Card from '../../../ui/Card';
import { useAuth } from '../../../../context/AuthContext';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { User, Kelas, JadwalPelajaran, SesiAbsensi, Absensi, MataPelajaran, TahunAjaran } from '../../../../types';
import {
  getKelasForTahunAjaran,
  getMuridForSelectedPeriod,
  getAttendanceStats,
  getDetailedAttendance,
  calculateOverallStats,
  getAvailableTahunAjaran,
  getAvailableSemesters
} from './components/murid-kelas/MuridKelasUtils';
import MuridKelasStatsCards from './components/murid-kelas/MuridKelasStatsCards';
import MuridKelasPeriodSelector from './components/murid-kelas/MuridKelasPeriodSelector';
import MuridKelasPeriodInfo from './components/murid-kelas/MuridKelasPeriodInfo';
import MuridKelasTable from './components/murid-kelas/MuridKelasTable';
import MuridKelasDetailModal from './components/murid-kelas/MuridKelasDetailModal';

const MuridKelas: React.FC = () => {
  const { user } = useAuth();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { sesiAbsensi } = useSesiAbsensi();
  const { absensi } = useAbsensi();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();

  // Combine gurus and murid into users array for compatibility
  const users = useMemo(() => {
    return [...gurus, ...murid] as User[];
  }, [gurus, murid]);

  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(() => {
    return activeTahunAjaran?.tahun || '';
  });
  const [selectedSemester, setSelectedSemester] = useState<number>(() => {
    return activeTahunAjaran?.semester || 1;
  });
  const [detailDate, setDetailDate] = useState(new Date().toISOString().split('T')[0]);

  const targetKelas = user?.kelasWali ? getKelasForTahunAjaran(user.kelasWali, selectedTahunAjaran, kelas, activeTahunAjaran) : null;

  if (!user?.isWaliKelas || !user.kelasWali) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Anda tidak memiliki akses sebagai wali kelas.</p>
      </Card>
    );
  }

  const availableTahunAjaran = getAvailableTahunAjaran(tahunAjaran);
  const availableSemesters = getAvailableSemesters(selectedTahunAjaran, tahunAjaran);

  const muridKelas = getMuridForSelectedPeriod(
    selectedTahunAjaran,
    targetKelas,
    users,
    kelas,
    user.kelasWali,
    activeTahunAjaran
  );

  const jadwalKelas = targetKelas ? jadwalPelajaran.filter(j =>
    j.kelasId === (targetKelas.id.startsWith('virtual-') ? user.kelasWali : targetKelas.id) &&
    j.tahunAjaran === selectedTahunAjaran &&
    j.semester === selectedSemester
  ) : [];

  const sesiKelas = sesiAbsensi.filter(s => {
    const jadwal = jadwalKelas.find(j => j.id === s.jadwalId);
    return jadwal;
  });

  const getAttendanceStatsForMurid = (muridId: string) => {
    return getAttendanceStats(muridId, sesiKelas, absensi);
  };

  const getDetailedAttendanceForMurid = (muridId: string) => {
    return getDetailedAttendance(muridId, sesiAbsensi, jadwalKelas, mataPelajaran, users, absensi);
  };

  const overallStats = calculateOverallStats(muridKelas, sesiKelas, absensi);

  const classAttendanceRate = overallStats.totalSesi > 0 ?
    ((overallStats.totalHadir / overallStats.totalSesi) * 100).toFixed(1) : '0';

  const exportClassReport = () => {
    const data = muridKelas.map(murid => {
      const stats = getAttendanceStatsForMurid(murid.id);
      return {
        nisn: murid.nisn,
        nama: murid.name,
        hadir: stats.hadir,
        izin: stats.izin,
        sakit: stats.sakit,
        alfa: stats.alfa,
        totalSesi: stats.total,
        tingkatKehadiran: `${stats.attendanceRate}%`
      };
    });

    const columns = [
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Nama Murid', dataKey: 'nama', width: 25 },
      { header: 'Hadir', dataKey: 'hadir', width: 10 },
      { header: 'Izin', dataKey: 'izin', width: 10 },
      { header: 'Sakit', dataKey: 'sakit', width: 10 },
      { header: 'Alfa', dataKey: 'alfa', width: 10 },
      { header: 'Total Sesi', dataKey: 'totalSesi', width: 12 },
      { header: 'Tingkat Kehadiran', dataKey: 'tingkatKehadiran', width: 18 }
    ];

    const title = `REKAP KEHADIRAN MURID\nKelas: ${targetKelas?.name}\nPeriode: ${selectedTahunAjaran} Semester ${selectedSemester}`;
    const filename = `rekap-kehadiran-${targetKelas?.name}-${selectedTahunAjaran}-S${selectedSemester}`;

    exportToExcel(data, columns, title, filename);
  };

  const openDetailModal = (murid: User) => {
    setSelectedMurid(murid);
    setDetailDate(new Date().toISOString().split('T')[0]);
    setIsDetailModalOpen(true);
  };

  const handleResetToActive = () => {
    const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
    setSelectedTahunAjaran(activeTahunAjaran?.tahun || '');
    setSelectedSemester(activeTahunAjaran?.semester || 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Murid Kelas - {targetKelas?.name || 'Kelas Tidak Ditemukan'}</h2>
          <p className="text-gray-600">Rekap kehadiran murid untuk {selectedTahunAjaran} Semester {selectedSemester}</p>
        </div>
        <MuridKelasPeriodSelector
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          availableTahunAjaran={availableTahunAjaran}
          availableSemesters={availableSemesters}
          onTahunAjaranChange={setSelectedTahunAjaran}
          onSemesterChange={setSelectedSemester}
          onResetToActive={handleResetToActive}
          onExport={exportClassReport}
        />
      </div>

      <MuridKelasPeriodInfo
        targetKelas={targetKelas}
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
        activeTahunAjaran={activeTahunAjaran}
      />

      {!targetKelas ? (
        <Card className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Kelas Tidak Ditemukan</h3>
          <p className="text-gray-600">
            Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}.
            Kemungkinan Anda belum menjadi wali kelas atau sudah tidak menjadi wali kelas pada periode tersebut.
          </p>
        </Card>
      ) : (
        <>
          <MuridKelasStatsCards
            muridCount={muridKelas.length}
            classAttendanceRate={classAttendanceRate}
            sesiCount={sesiKelas.length}
            totalAlfa={overallStats.totalAlfa}
          />

          <MuridKelasTable
            muridKelas={muridKelas}
            getAttendanceStats={getAttendanceStatsForMurid}
            onDetailClick={openDetailModal}
            selectedTahunAjaran={selectedTahunAjaran}
            selectedSemester={selectedSemester}
          />

          <MuridKelasDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            selectedMurid={selectedMurid}
            targetKelas={targetKelas}
            selectedTahunAjaran={selectedTahunAjaran}
            selectedSemester={selectedSemester}
            detailDate={detailDate}
            onDateChange={setDetailDate}
            onTodayClick={() => setDetailDate(new Date().toISOString().split('T')[0])}
            getDetailedAttendance={getDetailedAttendanceForMurid}
          />
        </>
      )}
    </div>
  );
};

export default MuridKelas;
