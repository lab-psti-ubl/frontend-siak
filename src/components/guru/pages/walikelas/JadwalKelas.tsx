import React, { useState, useMemo } from 'react';
import { exportToExcel } from '../../../../utils/exportUtils';
import { useAuth } from '../../../../context/AuthContext';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { JadwalPelajaran, Kelas, MataPelajaran, User, TahunAjaran, SesiAbsensi, Absensi } from '../../../../types';
import JadwalKelasHeader from './components/jadwal-kelas/JadwalKelasHeader';
import JadwalKelasEmptyState from './components/jadwal-kelas/JadwalKelasEmptyState';
import JadwalKelasDayCard from './components/jadwal-kelas/JadwalKelasDayCard';
import JadwalKelasSummary from './components/jadwal-kelas/JadwalKelasSummary';

import {
  hariOrder,
  getMapelName,
  getGuruName,
  groupSchedulesByDay,
  getAttendanceHistory,
  getDetailedAttendanceForDate,
  getJadwalStats
} from './components/jadwal-kelas/JadwalKelasUtils';

const JadwalKelas: React.FC = () => {
  const { user } = useAuth();
  const { activeTahunAjaran } = useTahunAjaran();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { gurus } = useGurus();
  const { murid } = useMurid({ status: 'active' });
  const { sesiAbsensi } = useSesiAbsensi();
  const { absensi } = useAbsensi();

  // Get jadwal pelajaran dengan filter kelas, tahun ajaran, dan semester
  const { jadwalPelajaran } = useJadwalPelajaran(
    activeTahunAjaran
      ? {
          kelasId: user?.kelasWali,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  // Combine gurus and murid into users array for compatibility with utils
  const users = useMemo(() => {
    return [...gurus, ...murid];
  }, [gurus, murid]);

  const [selectedJadwal, setSelectedJadwal] = useState<JadwalPelajaran | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [dateFilter] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  });

  if (!user?.isWaliKelas || !user.kelasWali) {
    return <JadwalKelasEmptyState type="no-access" />;
  }

  if (!activeTahunAjaran) {
    return <JadwalKelasEmptyState type="no-tahun-ajaran" />;
  }

  const myKelas = kelas.find(k => k.id === user.kelasWali);
  // Jadwal sudah difilter di useJadwalPelajaran hook berdasarkan kelasId, tahunAjaran, dan semester
  const jadwalKelas = jadwalPelajaran;

  const schedulesByDay = groupSchedulesByDay(jadwalKelas);

  const mapelNameGetter = (mapelId: string) => getMapelName(mataPelajaran, mapelId);
  const guruNameGetter = (guruId: string) => getGuruName(users, guruId);

  const attendanceHistoryGetter = (jadwalId: string) =>
    getAttendanceHistory(jadwalId, dateFilter, sesiAbsensi, absensi, users, user?.kelasWali);

  const detailedAttendanceGetter = (jadwalId: string, tanggal: string) =>
    getDetailedAttendanceForDate(jadwalId, tanggal, sesiAbsensi, absensi, users, user?.kelasWali);

  const jadwalStatsGetter = (jadwalId: string) =>
    getJadwalStats(jadwalId, dateFilter, sesiAbsensi, absensi, users, user?.kelasWali);

  const openDetailModal = (jadwal: JadwalPelajaran) => {
    setSelectedJadwal(jadwal);
    setIsDetailModalOpen(true);
  };

  const exportJadwalReport = () => {
    const data = jadwalKelas.map(jadwal => {
      const stats = jadwalStatsGetter(jadwal.id);
      return {
        mataPelajaran: mapelNameGetter(jadwal.mataPelajaranId),
        guru: guruNameGetter(jadwal.guruId),
        hari: jadwal.hari,
        jamMulai: jadwal.jamMulai,
        jamSelesai: jadwal.jamSelesai,
        totalSesi: stats.totalSesi,
        tingkatKehadiran: `${stats.attendanceRate}%`
      };
    });

    const columns = [
      { header: 'Mata Pelajaran', dataKey: 'mataPelajaran', width: 25 },
      { header: 'Guru', dataKey: 'guru', width: 20 },
      { header: 'Hari', dataKey: 'hari', width: 12 },
      { header: 'Jam Mulai', dataKey: 'jamMulai', width: 12 },
      { header: 'Jam Selesai', dataKey: 'jamSelesai', width: 12 },
      { header: 'Total Sesi', dataKey: 'totalSesi', width: 12 },
      { header: 'Tingkat Kehadiran', dataKey: 'tingkatKehadiran', width: 18 }
    ];

    const title = `JADWAL PELAJARAN KELAS\nKelas: ${myKelas?.name}\nPeriode: ${activeTahunAjaran.tahun} Semester ${activeTahunAjaran.semester}`;
    const filename = `jadwal-kelas-${myKelas?.name}-${activeTahunAjaran.tahun}-S${activeTahunAjaran.semester}`;

    exportToExcel(data, columns, title, filename);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <JadwalKelasHeader
        myKelas={myKelas}
        activeTahunAjaran={activeTahunAjaran}
        onExport={exportJadwalReport}
      />

      {jadwalKelas.length === 0 ? (
        <JadwalKelasEmptyState
          type="no-schedule"
          myKelas={myKelas}
          activeTahunAjaran={activeTahunAjaran}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {hariOrder.map((hari) => (
            <JadwalKelasDayCard
              key={hari}
              hari={hari}
              schedules={schedulesByDay[hari]}
              getMapelName={mapelNameGetter}
              getGuruName={guruNameGetter}
              getJadwalStats={jadwalStatsGetter}
              onDetailClick={openDetailModal}
            />
          ))}
        </div>
      )}

      <JadwalKelasSummary
        jadwalKelas={jadwalKelas}
        schedulesByDay={schedulesByDay}
      />

      
    </div>
  );
};

export default JadwalKelas;
