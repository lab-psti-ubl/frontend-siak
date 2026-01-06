import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, Upload } from 'lucide-react';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { useAuth } from '../../../../context/AuthContext';
import {
  Nilai,
  NilaiTugas,
  NilaiKomponen,
  User,
  StatusKenaikanKelas,
  StatusBagiRaport,
  RiwayatKelasMurid
} from '../../../../types';
import { updateNilaiAkhir } from '../../../../utils/nilaiUtils';
import { showSuccessNotification, showErrorNotification } from '../../../../utils/notificationUtils';
import { syncRiwayatKelasMuridFromNilai, ensureRiwayatKelasMuridFromNilai } from '../../../../utils/riwayatKelasMuridUtils';
import NilaiFilters from './components/input-nilai/NilaiFilters';
import NilaiStats from './components/input-nilai/NilaiStats';
import NilaiTable from './components/input-nilai/NilaiTable';
import InputNilaiModal from './components/input-nilai/InputNilaiModal';
import DetailNilaiModal from './components/input-nilai/DetailNilaiModal';
import ImportNilaiModal from './components/input-nilai/ImportNilaiModal';
import { NilaiImportData } from '../../../../utils/excelNilaiImport';
import { useNilai } from '../../../../hooks/useNilai';
import { useMurid } from '../../../../hooks/useMurid';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';
import { useRiwayatKelasMurid } from '../../../../hooks/useRiwayatKelasMurid';
import { useStatusKenaikanKelas } from '../../../../hooks/useStatusKenaikanKelas';
import { useStatusBagiRaport } from '../../../../hooks/useStatusBagiRaport';

const InputNilai: React.FC = () => {
  const { user } = useAuth();
  const { nilai, setNilai, upsertNilai, bulkUpsertNilai, refreshNilai } = useNilai();
  const { murid: users } = useMurid();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { mataPelajaran } = useMataPelajaran();
  const { kelas } = useKelas();
  const { tahunAjaran } = useTahunAjaran();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { komponenNilai: komponenDinamisList } = useKomponenNilai();
  const { riwayatKelasMurid, setRiwayatKelasMurid, createRiwayatKelasMurid } = useRiwayatKelasMurid();
  const { statusKenaikanKelas } = useStatusKenaikanKelas();
  const { statusBagiRaport } = useStatusBagiRaport();

  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [inputType, setInputType] = useState<string>('tugas');
  const [editingTugas, setEditingTugas] = useState<NilaiTugas | null>(null);
  const [editingKomponen, setEditingKomponen] = useState<NilaiKomponen | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const syncedRiwayat = syncRiwayatKelasMuridFromNilai(nilai, riwayatKelasMurid);
    if (syncedRiwayat.length !== riwayatKelasMurid.length) {
      // Sync new riwayat to database
      const newRiwayat = syncedRiwayat.filter(sr => !riwayatKelasMurid.find(r => r.id === sr.id));
      newRiwayat.forEach(r => createRiwayatKelasMurid(r));
      setRiwayatKelasMurid(syncedRiwayat);
    }
  }, [nilai]);

  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
  const mySchedules = jadwalPelajaran.filter(j =>
    j.guruId === user?.id &&
    j.tahunAjaran === activeTahunAjaran?.tahun &&
    j.semester === activeTahunAjaran?.semester
  );

  const checkIfEditingLocked = (kelasId: string) => {
    if (!activeTahunAjaran) return false;

    if (activeTahunAjaran.semester === 1) {
      const statusBagi = statusBagiRaport.find(s =>
        s.kelasId === kelasId &&
        s.tahunAjaran === activeTahunAjaran.tahun &&
        s.semester === activeTahunAjaran.semester &&
        s.isPublished
      );
      return !!statusBagi;
    }

    if (activeTahunAjaran.semester === 2) {
      const statusKenaikan = statusKenaikanKelas.find(s =>
        s.kelasIds.includes(kelasId) &&
        s.tahunAjaran === activeTahunAjaran.tahun &&
        s.semester === activeTahunAjaran.semester &&
        s.isPublished
      );
      return !!statusKenaikan;
    }

    return false;
  };

  if (!activeTahunAjaran) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tahun Ajaran Tidak Aktif</h3>
        <p className="text-gray-600">Tidak ada tahun ajaran yang sedang aktif. Hubungi admin untuk mengaktifkan tahun ajaran.</p>
      </Card>
    );
  }

  const uniqueMapel = [...new Set(mySchedules.map(j => j.mataPelajaranId))];
  const uniqueKelas = selectedMapel ? 
    [...new Set(mySchedules.filter(j => j.mataPelajaranId === selectedMapel).map(j => j.kelasId))] : 
    [];

  const getMuridKelas = (kelasId: string) => {
    return users.filter(u => u.kelasId === kelasId && u.isActive !== false);
  };

  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  const getKelasName = (kelasId: string) => {
    return kelas.find(k => k.id === kelasId)?.name || 'Unknown';
  };

  const getNilaiMurid = (muridId: string, mapelId: string, kelasId: string) => {
    return nilai.find(n =>
      n.muridId === muridId &&
      n.mataPelajaranId === mapelId &&
      n.kelasId === kelasId &&
      n.semester === activeTahunAjaran?.semester &&
      n.tahunAjaran === activeTahunAjaran?.tahun
    );
  };

  const isKomponenTunggal = (komponenNama: string): boolean => {
    const komponen = komponenDinamisList.find(k => k.nama === komponenNama);
    return komponen ? !komponen.hasNilai : false;
  };

  const createOrUpdateNilai = async (muridId: string, mapelId: string, kelasId: string, updates: Partial<Nilai>) => {
    const existingNilai = getNilaiMurid(muridId, mapelId, kelasId);

    const updatedRiwayat = ensureRiwayatKelasMuridFromNilai(
      [muridId],
      kelasId,
      activeTahunAjaran?.tahun || '',
      activeTahunAjaran?.semester || 1,
      riwayatKelasMurid
    );
    if (updatedRiwayat.length !== riwayatKelasMurid.length) {
      const newRiwayat = updatedRiwayat.filter(ur => !riwayatKelasMurid.find(r => r.id === ur.id));
      newRiwayat.forEach(r => createRiwayatKelasMurid(r));
      setRiwayatKelasMurid(updatedRiwayat);
    }

    let finalNilai: Nilai;
    if (existingNilai) {
      const updatedNilai = { ...existingNilai, ...updates, updatedAt: new Date().toISOString() };
      finalNilai = updateNilaiAkhir(updatedNilai, absensi, sesiAbsensi, jadwalPelajaran);
    } else {
      const newNilai: Nilai = {
        id: `nilai-${Date.now()}`,
        muridId,
        mataPelajaranId: mapelId,
        kelasId,
        guruId: user?.id || '',
        semester: activeTahunAjaran?.semester || 1,
        tahunAjaran: activeTahunAjaran?.tahun || '',
        tugas: [],
        uts: null,
        uas: null,
        nilaiAkhir: null,
        grade: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates
      };
      finalNilai = updateNilaiAkhir(newNilai, absensi, sesiAbsensi, jadwalPelajaran);
    }

    // Save to database via API
    try {
      await upsertNilai(finalNilai);
    } catch (error) {
      console.error('Error saving nilai:', error);
      // Update local state anyway for optimistic UI
      if (existingNilai) {
        setNilai(nilai.map(n => n.id === existingNilai.id ? finalNilai : n));
      } else {
        setNilai([...nilai, finalNilai]);
      }
    }
  };

  const handleInputNilai = (murid: User, type: string) => {
    if (checkIfEditingLocked(selectedKelas)) {
      const semesterText = activeTahunAjaran?.semester === 1 ? 'ganjil' : 'genap';
      showErrorNotification(
        'Input Nilai Dikunci',
        `Input nilai tidak dapat dilakukan karena raport semester ${semesterText} sudah disebarkan. Nilai tidak dapat diubah lagi setelah raport dipublikasikan.`
      );
      return;
    }
    setSelectedMurid(murid);
    setInputType(type);
    setEditingKomponen(null);
    setIsInputModalOpen(true);
  };

  const handleViewDetail = (murid: User) => {
    setSelectedMurid(murid);
    setIsDetailModalOpen(true);
  };

  const handleSaveNilai = async (nilaiValue: number, keterangan?: string) => {
    if (!selectedMurid) return;

    if (inputType === 'tugas') {
      const existingNilai = getNilaiMurid(selectedMurid.id, selectedMapel, selectedKelas);
      const tugasCount = existingNilai ? existingNilai.tugas.length : 0;

      const newTugas: NilaiTugas = {
        id: `tugas-${Date.now()}`,
        nama: `Tugas ${tugasCount + 1}`,
        nilai: nilaiValue,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: keterangan
      };

      const updatedTugas = existingNilai ? [...existingNilai.tugas, newTugas] : [newTugas];
      await createOrUpdateNilai(selectedMurid.id, selectedMapel, selectedKelas, { tugas: updatedTugas });

      showSuccessNotification('Tugas Berhasil Ditambahkan', `Tugas ${tugasCount + 1} untuk ${selectedMurid.name} berhasil disimpan.`);
    } else if (inputType === 'uts' || inputType === 'uas') {
      const updates = inputType === 'uts' ? { uts: nilaiValue } : { uas: nilaiValue };
      await createOrUpdateNilai(selectedMurid.id, selectedMapel, selectedKelas, updates);

      showSuccessNotification(
        `${inputType.toUpperCase()} Berhasil Disimpan`,
        `Nilai ${inputType.toUpperCase()} untuk ${selectedMurid.name} berhasil disimpan.`
      );
    } else {
      const existingNilai = getNilaiMurid(selectedMurid.id, selectedMapel, selectedKelas);
      const isTunggal = isKomponenTunggal(inputType);

      let updatedKomponenDinamis: NilaiKomponen[] = [];

      if (isTunggal) {
        const existingKomponen = existingNilai?.komponenDinamis?.find(k => k.komponenNama === inputType);
        const komponenToUse = existingKomponen || {
          id: `komponen-${Date.now()}`,
          komponenId: inputType,
          komponenNama: inputType,
          nilai: nilaiValue,
          tanggal: new Date().toISOString().split('T')[0],
          keterangan: keterangan
        };

        if (existingKomponen) {
          updatedKomponenDinamis = existingNilai!.komponenDinamis!.map(k =>
            k.komponenNama === inputType
              ? { ...k, nilai: nilaiValue, keterangan: keterangan }
              : k
          );
        } else {
          updatedKomponenDinamis = existingNilai?.komponenDinamis ? [...existingNilai.komponenDinamis, komponenToUse as NilaiKomponen] : [komponenToUse as NilaiKomponen];
        }
      } else {
        const newKomponen: NilaiKomponen = {
          id: `komponen-${Date.now()}`,
          komponenId: inputType,
          komponenNama: inputType,
          nilai: nilaiValue,
          tanggal: new Date().toISOString().split('T')[0],
          keterangan: keterangan
        };

        updatedKomponenDinamis = existingNilai?.komponenDinamis ? [...existingNilai.komponenDinamis, newKomponen] : [newKomponen];
      }

      await createOrUpdateNilai(selectedMurid.id, selectedMapel, selectedKelas, { komponenDinamis: updatedKomponenDinamis });

      const actionText = isTunggal ? 'Disimpan' : 'Ditambahkan';
      showSuccessNotification(
        `${inputType} Berhasil ${actionText}`,
        `Nilai ${inputType} untuk ${selectedMurid.name} berhasil disimpan.`
      );
    }

    setIsInputModalOpen(false);
    setSelectedMurid(null);
    setEditingTugas(null);
  };

  const handleEditTugas = (murid: User, tugas: NilaiTugas) => {
    if (checkIfEditingLocked(selectedKelas)) {
      const semesterText = activeTahunAjaran?.semester === 1 ? 'ganjil' : 'genap';
      showErrorNotification(
        'Edit Nilai Dikunci',
        `Edit nilai tidak dapat dilakukan karena raport semester ${semesterText} sudah disebarkan. Nilai tidak dapat diubah lagi setelah raport dipublikasikan.`
      );
      return;
    }
    setSelectedMurid(murid);
    setInputType('tugas');
    setEditingTugas(tugas);
    setIsInputModalOpen(true);
  };

  const handleSaveEditTugas = async (tugasId: string, nilaiValue: number, keterangan?: string) => {
    if (!selectedMurid) return;

    const existingNilai = getNilaiMurid(selectedMurid.id, selectedMapel, selectedKelas);
    if (!existingNilai) return;

    if (inputType === 'tugas') {
      const updatedTugas = existingNilai.tugas.map(t =>
        t.id === tugasId
          ? { ...t, nilai: nilaiValue, keterangan: keterangan }
          : t
      );

      await createOrUpdateNilai(selectedMurid.id, selectedMapel, selectedKelas, { tugas: updatedTugas });
      showSuccessNotification('Tugas Berhasil Diupdate', `Nilai tugas untuk ${selectedMurid.name} berhasil diperbarui.`);
    } else if (['uts', 'uas'].includes(inputType)) {
      const updates = inputType === 'uts' ? { uts: nilaiValue } : { uas: nilaiValue };
      await createOrUpdateNilai(selectedMurid.id, selectedMapel, selectedKelas, updates);
      showSuccessNotification(`${inputType.toUpperCase()} Berhasil Diupdate`, `Nilai ${inputType.toUpperCase()} untuk ${selectedMurid.name} berhasil diperbarui.`);
    } else {
      const updatedKomponen = existingNilai.komponenDinamis?.map(k =>
        k.id === tugasId
          ? { ...k, nilai: nilaiValue, keterangan: keterangan }
          : k
      ) || [];

      await createOrUpdateNilai(selectedMurid.id, selectedMapel, selectedKelas, { komponenDinamis: updatedKomponen });
      showSuccessNotification(`${inputType} Berhasil Diupdate`, `Nilai ${inputType} untuk ${selectedMurid.name} berhasil diperbarui.`);
    }

    setIsInputModalOpen(false);
    setSelectedMurid(null);
    setEditingTugas(null);
  };

  const handleDeleteTugas = async (murid: User, tugasId: string) => {
    if (checkIfEditingLocked(selectedKelas)) {
      const semesterText = activeTahunAjaran?.semester === 1 ? 'ganjil' : 'genap';
      showErrorNotification(
        'Hapus Nilai Dikunci',
        `Hapus nilai tidak dapat dilakukan karena raport semester ${semesterText} sudah disebarkan. Nilai tidak dapat diubah lagi setelah raport dipublikasikan.`
      );
      return;
    }

    const existingNilai = getNilaiMurid(murid.id, selectedMapel, selectedKelas);
    if (!existingNilai) return;

    if (inputType === 'tugas') {
      const tugas = existingNilai.tugas.find(t => t.id === tugasId);
      if (!tugas) return;

      if (window.confirm(`Apakah Anda yakin ingin menghapus ${tugas.nama}?`)) {
        const updatedTugas = existingNilai.tugas.filter(t => t.id !== tugasId);
        await createOrUpdateNilai(murid.id, selectedMapel, selectedKelas, { tugas: updatedTugas });
        showSuccessNotification('Tugas Berhasil Dihapus', `${tugas.nama} untuk ${murid.name} berhasil dihapus.`);
      }
    } else if (!['uts', 'uas'].includes(inputType)) {
      const komponen = existingNilai.komponenDinamis?.find(k => k.id === tugasId);
      if (!komponen) return;

      if (window.confirm(`Apakah Anda yakin ingin menghapus ${komponen.komponenNama}?`)) {
        const updatedKomponen = existingNilai.komponenDinamis?.filter(k => k.id !== tugasId) || [];
        await createOrUpdateNilai(murid.id, selectedMapel, selectedKelas, { komponenDinamis: updatedKomponen });
        showSuccessNotification('Nilai Berhasil Dihapus', `${komponen.komponenNama} untuk ${murid.name} berhasil dihapus.`);
      }
    }
  };

  const handleEditKomponen = (murid: User, komponen: NilaiKomponen) => {
    if (checkIfEditingLocked(selectedKelas)) {
      const semesterText = activeTahunAjaran?.semester === 1 ? 'ganjil' : 'genap';
      showErrorNotification(
        'Edit Nilai Dikunci',
        `Edit nilai tidak dapat dilakukan karena raport semester ${semesterText} sudah disebarkan. Nilai tidak dapat diubah lagi setelah raport dipublikasikan.`
      );
      return;
    }
    setSelectedMurid(murid);
    setInputType(komponen.komponenNama);
    setEditingKomponen(komponen);
    setIsInputModalOpen(true);
  };

  const handleDeleteKomponen = async (murid: User, komponenId: string) => {
    if (checkIfEditingLocked(selectedKelas)) {
      const semesterText = activeTahunAjaran?.semester === 1 ? 'ganjil' : 'genap';
      showErrorNotification(
        'Hapus Nilai Dikunci',
        `Hapus nilai tidak dapat dilakukan karena raport semester ${semesterText} sudah disebarkan. Nilai tidak dapat diubah lagi setelah raport dipublikasikan.`
      );
      return;
    }

    const existingNilai = getNilaiMurid(murid.id, selectedMapel, selectedKelas);
    if (!existingNilai) return;

    const komponen = existingNilai.komponenDinamis?.find(k => k.id === komponenId);
    if (!komponen) return;

    if (window.confirm(`Apakah Anda yakin ingin menghapus ${komponen.komponenNama}?`)) {
      const updatedKomponen = existingNilai.komponenDinamis?.filter(k => k.id !== komponenId) || [];
      await createOrUpdateNilai(murid.id, selectedMapel, selectedKelas, { komponenDinamis: updatedKomponen });
      showSuccessNotification('Nilai Berhasil Dihapus', `${komponen.komponenNama} untuk ${murid.name} berhasil dihapus.`);
    }
  };

  const handleImportNilai = async (data: NilaiImportData[]) => {
    if (checkIfEditingLocked(selectedKelas)) {
      const semesterText = activeTahunAjaran?.semester === 1 ? 'ganjil' : 'genap';
      showErrorNotification(
        'Import Nilai Dikunci',
        `Import nilai tidak dapat dilakukan karena raport semester ${semesterText} sudah disebarkan. Nilai tidak dapat diubah lagi setelah raport dipublikasikan.`
      );
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    const today = new Date().toISOString().split('T')[0];
    const baseTimestamp = Date.now();

    const allNilaiUpdates: Nilai[] = [];
    const processedMuridIds = new Set<string>();

    data.forEach((item, itemIndex) => {
      const murid = muridList.find(m => m.nisn === item.nisn);

      if (!murid) {
        failedCount++;
        return;
      }

      const tugasList: NilaiTugas[] = [];
      const uniqueTimestamp = baseTimestamp + itemIndex;

      Object.keys(item.tugas).sort((a, b) => {
        const numA = parseInt(a.replace('t', ''));
        const numB = parseInt(b.replace('t', ''));
        return numA - numB;
      }).forEach((key, tugasIndex) => {
        const tugasNum = key.replace('t', '');
        const nilaiTugas = item.tugas[key];

        if (nilaiTugas !== undefined && nilaiTugas !== null) {
          tugasList.push({
            id: `tugas-${murid.nisn}-${tugasNum}-${uniqueTimestamp}-${tugasIndex}`,
            nama: `Tugas ${tugasNum}`,
            nilai: nilaiTugas,
            tanggal: today
          });
        }
      });

      const komponenDinamisImport: NilaiKomponen[] = [];

      if (item.komponenDinamis) {
        let kompIdx = 0;
        Object.entries(item.komponenDinamis).forEach(([komponenNama, nilaiArray]) => {
          nilaiArray.forEach((nilaiItem, idx) => {
            komponenDinamisImport.push({
              id: `komponen-${murid.nisn}-${komponenNama}-${idx}-${uniqueTimestamp}`,
              komponenId: komponenNama,
              komponenNama: komponenNama,
              nilai: nilaiItem.nilai,
              tanggal: today,
              keterangan: nilaiItem.nama
            });
            kompIdx++;
          });
        });
      }

      const existingNilai = getNilaiMurid(murid.id, selectedMapel, selectedKelas);

      if (existingNilai) {
        const updatedNilai = {
          ...existingNilai,
          tugas: tugasList,
          uts: item.uts !== undefined && item.uts !== null ? item.uts : existingNilai.uts,
          uas: item.uas !== undefined && item.uas !== null ? item.uas : existingNilai.uas,
          komponenDinamis: komponenDinamisImport.length > 0 ? komponenDinamisImport : existingNilai.komponenDinamis,
          updatedAt: new Date().toISOString()
        };
        const finalNilai = updateNilaiAkhir(updatedNilai, absensi, sesiAbsensi, jadwalPelajaran);
        allNilaiUpdates.push(finalNilai);
      } else {
        const newNilai: Nilai = {
          id: `nilai-${murid.nisn}-${uniqueTimestamp}`,
          muridId: murid.id,
          mataPelajaranId: selectedMapel,
          kelasId: selectedKelas,
          guruId: user?.id || '',
          semester: activeTahunAjaran?.semester || 1,
          tahunAjaran: activeTahunAjaran?.tahun || '',
          tugas: tugasList,
          uts: item.uts !== undefined && item.uts !== null ? item.uts : null,
          uas: item.uas !== undefined && item.uas !== null ? item.uas : null,
          nilaiAkhir: null,
          grade: null,
          komponenDinamis: komponenDinamisImport.length > 0 ? komponenDinamisImport : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const finalNilai = updateNilaiAkhir(newNilai, absensi, sesiAbsensi, jadwalPelajaran);
        allNilaiUpdates.push(finalNilai);
      }

      processedMuridIds.add(murid.id);
      successCount++;
    });

    const updatedRiwayat = ensureRiwayatKelasMuridFromNilai(
      Array.from(processedMuridIds),
      selectedKelas,
      activeTahunAjaran?.tahun || '',
      activeTahunAjaran?.semester || 1,
      riwayatKelasMurid
    );
    if (updatedRiwayat.length !== riwayatKelasMurid.length) {
      const newRiwayat = updatedRiwayat.filter(ur => !riwayatKelasMurid.find(r => r.id === ur.id));
      newRiwayat.forEach(r => createRiwayatKelasMurid(r));
      setRiwayatKelasMurid(updatedRiwayat);
    }

    // Save to database via bulk upsert API
    try {
      await bulkUpsertNilai(allNilaiUpdates);
    } catch (error) {
      console.error('Error bulk upserting nilai:', error);
      // Update local state anyway for optimistic UI
      setNilai(prevNilai => {
        const nilaiMap = new Map<string, Nilai>();

        prevNilai.forEach(n => {
          const key = `${n.muridId}-${n.mataPelajaranId}-${n.kelasId}-${n.semester}-${n.tahunAjaran}`;
          nilaiMap.set(key, n);
        });

        allNilaiUpdates.forEach(newNilai => {
          const key = `${newNilai.muridId}-${newNilai.mataPelajaranId}-${newNilai.kelasId}-${newNilai.semester}-${newNilai.tahunAjaran}`;
          nilaiMap.set(key, newNilai);
        });

        return Array.from(nilaiMap.values());
      });
    }

    if (successCount > 0) {
      showSuccessNotification(
        'Import Berhasil',
        `${successCount} nilai berhasil diimport${failedCount > 0 ? `, ${failedCount} gagal` : ''}`
      );
    }

    if (failedCount > 0 && successCount === 0) {
      showErrorNotification(
        'Import Gagal',
        `${failedCount} nilai gagal diimport. Periksa kembali NISN murid.`
      );
    }
  };

  const muridList = selectedKelas ? getMuridKelas(selectedKelas) : [];
  const isEditingLocked = selectedKelas ? checkIfEditingLocked(selectedKelas) : false;

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Input Nilai
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Kelola nilai tugas, UTS, UAS, dan komponen penilaian lainnya untuk murid
              </p>
              {isEditingLocked && (
                <p className="text-xs sm:text-sm text-red-200 mt-3 font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  Input nilai dikunci - Raport sudah disebarkan
                </p>
              )}
            </div>
            {activeTahunAjaran && (
              <div className="flex-shrink-0">
                <div className="inline-flex px-4 sm:px-5 py-2.5 sm:py-3 bg-white/15 rounded-xl text-white text-xs sm:text-sm font-semibold backdrop-blur-sm">
                  {activeTahunAjaran.tahun} • Semester {activeTahunAjaran.semester}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NilaiFilters
        selectedMapel={selectedMapel}
        setSelectedMapel={setSelectedMapel}
        selectedKelas={selectedKelas}
        setSelectedKelas={setSelectedKelas}
        uniqueMapel={uniqueMapel}
        uniqueKelas={uniqueKelas}
        mataPelajaran={mataPelajaran}
        kelas={kelas}
      />

      {selectedMapel && selectedKelas && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">Import Nilai dari Excel</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Untuk {getMapelName(selectedMapel)} - {getKelasName(selectedKelas)}</p>
                {isEditingLocked && (
                  <p className="text-xs sm:text-sm text-red-600 mt-2 font-medium flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    Input nilai dikunci - Raport sudah disebarkan
                  </p>
                )}
              </div>
              <Button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                disabled={isEditingLocked}
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Import Excel</span>
                <span className="sm:hidden">Import</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <NilaiStats />

      {selectedMapel && selectedKelas && (
        <NilaiTable
          muridList={muridList}
          selectedMapel={selectedMapel}
          selectedKelas={selectedKelas}
          nilai={nilai}
          absensi={absensi}
          sesiAbsensi={sesiAbsensi}
          activeTahunAjaran={activeTahunAjaran}
          jadwalPelajaran={jadwalPelajaran}
          guruId={user?.id || ''}
          onInputNilai={handleInputNilai}
          onEditKomponen={handleEditKomponen}
          onViewDetail={handleViewDetail}
          getNilaiMurid={getNilaiMurid}
          getMapelName={getMapelName}
          getKelasName={getKelasName}
          isEditingLocked={isEditingLocked}
          isKomponenTunggal={isKomponenTunggal}
        />
      )}

      {!selectedMapel && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="text-center py-12 sm:py-16 lg:py-20 px-5 sm:px-6 lg:px-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-2">Pilih Mata Pelajaran</h3>
            <p className="text-xs sm:text-sm text-slate-500">Pilih mata pelajaran dan kelas di atas untuk mulai input nilai</p>
          </div>
        </div>
      )}

      <InputNilaiModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setSelectedMurid(null);
          setEditingTugas(null);
          setEditingKomponen(null);
        }}
        selectedMurid={selectedMurid}
        inputType={inputType}
        selectedMapel={selectedMapel}
        selectedKelas={selectedKelas}
        nilai={nilai}
        onSaveNilai={handleSaveNilai}
        getNilaiMurid={getNilaiMurid}
        getMapelName={getMapelName}
        getKelasName={getKelasName}
        editingTugas={editingTugas}
        onSaveEditTugas={handleSaveEditTugas}
        editingKomponen={editingKomponen}
        isKomponenTunggal={isKomponenTunggal}
      />

      <DetailNilaiModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMurid(null);
        }}
        selectedMurid={selectedMurid}
        selectedMapel={selectedMapel}
        selectedKelas={selectedKelas}
        nilai={nilai}
        absensi={absensi}
        sesiAbsensi={sesiAbsensi}
        jadwalPelajaran={jadwalPelajaran}
        activeTahunAjaran={activeTahunAjaran}
        guruId={user?.id || ''}
        onInputNilai={handleInputNilai}
        onEditTugas={handleEditTugas}
        onDeleteTugas={handleDeleteTugas}
        onEditKomponen={handleEditKomponen}
        onDeleteKomponen={handleDeleteKomponen}
        getNilaiMurid={getNilaiMurid}
        getMapelName={getMapelName}
        getKelasName={getKelasName}
        isEditingLocked={isEditingLocked}
      />

      <ImportNilaiModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportNilai}
        muridList={muridList}
        mapelName={getMapelName(selectedMapel)}
        kelasName={getKelasName(selectedKelas)}
        komponenDinamis={komponenDinamisList}
      />
    </div>
  );
};

export default InputNilai;