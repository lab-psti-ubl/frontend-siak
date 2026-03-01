import React, { useMemo, useState } from 'react';
import Card from '../../../../ui/Card';
import { AlertCircle } from 'lucide-react';
import { useBuatUjianCBT } from './useBuatUjianCBT';
import BuatUjianCBTHeader from './BuatUjianCBTHeader';
import UjianListCard from './UjianListCard';
import AddUjianModal from './modals/AddUjianModal';
import DetailUjianModal from './modals/DetailUjianModal';
import LihatUjianMuridModal from './modals/LihatUjianMuridModal';

const BuatUjianCBT: React.FC = () => {
  const api = useBuatUjianCBT();
  const [filterKelasId, setFilterKelasId] = useState('');
  const [filterMapelId, setFilterMapelId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const muridInKelas = useMemo(() => {
    if (!api.detailUjian) return [];
    return api.murid.filter((m: { id: string; name: string; nisn?: string; kelasId?: string }) => m.kelasId === api.detailUjian?.kelasId);
  }, [api.murid, api.detailUjian]);

  const filterOpts = useMemo(() => {
    const list = api.ujianList;
    const kelasIds = Array.from(new Set(list.map((u) => u.kelasId))).sort();
    const mapelIds = Array.from(new Set(list.map((u) => u.mataPelajaranId))).sort();
    const kategoriNamas = Array.from(new Set(list.map((u) => (u.kategoriNama || '').trim()).filter(Boolean))).sort();
    return { kelasIds, mapelIds, kategoriNamas };
  }, [api.ujianList]);

  const filteredUjianList = useMemo(() => {
    const list = api.ujianList;
    const getStatus = api.getUjianStatus;
    return list.filter((u) => {
      if (filterKelasId && u.kelasId !== filterKelasId) return false;
      if (filterMapelId && u.mataPelajaranId !== filterMapelId) return false;
      if (filterStatus) {
        const s = getStatus(u);
        if (s !== filterStatus) return false;
      }
      if (filterKategori && (u.kategoriNama || '').trim() !== filterKategori) return false;
      return true;
    });
  }, [api.ujianList, api.getUjianStatus, filterKelasId, filterMapelId, filterStatus, filterKategori]);

  const ujianStats = useMemo(() => {
    const list = filteredUjianList;
    const getStatus = api.getUjianStatus;
    if (!list.length || !getStatus) {
      return { total: list.length, draft: 0, sedang: 0, selesai: 0 };
    }
    let draft = 0;
    let sedang = 0;
    let selesai = 0;
    for (const u of list) {
      const s = getStatus(u);
      if (s === 'Draft') draft++;
      else if (s === 'Sedang berlangsung') sedang++;
      else if (s === 'Selesai') selesai++;
    }
    return { total: list.length, draft, sedang, selesai };
  }, [filteredUjianList, api.getUjianStatus]);

  if (!api.activeTahunAjaran) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tahun Ajaran Tidak Aktif</h3>
        <p className="text-gray-600">
          Tidak ada tahun ajaran yang sedang aktif. Hubungi admin untuk mengaktifkan tahun ajaran terlebih dahulu sebelum membuat ujian CBT.
        </p>
      </Card>
    );
  }

  if (!api.user || api.user.role !== 'guru') {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Hanya guru yang dapat mengakses modul ini</h3>
        <p className="text-gray-600">Silakan login sebagai guru untuk mengelola ujian CBT.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <BuatUjianCBTHeader
        onAddUjian={api.handleOpenModal}
        loading={api.loading}
        stats={ujianStats}
      />

      <UjianListCard
        loading={api.loading}
        ujianList={filteredUjianList}
        allUjianCount={api.ujianList.length}
        activeTahunAjaran={api.activeTahunAjaran}
        getMapelName={api.getMapelName}
        getKelasName={api.getKelasName}
        getUjianStatus={api.getUjianStatus}
        onPublish={api.handlePublishUjian}
        onDetail={api.setDetailUjian}
        filterKelasId={filterKelasId}
        filterMapelId={filterMapelId}
        filterStatus={filterStatus}
        filterKategori={filterKategori}
        onFilterKelasChange={setFilterKelasId}
        onFilterMapelChange={setFilterMapelId}
        onFilterStatusChange={setFilterStatus}
        onFilterKategoriChange={setFilterKategori}
        filterOpts={filterOpts}
      />

      <AddUjianModal
        isOpen={api.isModalOpen}
        onClose={api.handleCloseModal}
        form={api.form}
        onChange={api.handleChange}
        saving={api.saving}
        uniqueMapelIds={api.uniqueMapelIds}
        uniqueKelasIds={api.uniqueKelasIds}
        matchingCBTKelasId={api.matchingCBTKelasId}
        loadingBankSoal={api.loadingBankSoal}
        availableBankSoal={api.availableBankSoal}
        komponenNilai={api.komponenNilai}
        kategoriIsGanda={api.kategoriIsGanda}
        getMapelName={api.getMapelName}
        getKelasName={api.getKelasName}
        onCreate={api.handleCreateUjian}
      />

      <DetailUjianModal
        detailUjian={api.detailUjian}
        onClose={() => api.setDetailUjian(null)}
        detailAttempts={api.detailAttempts}
        muridInKelas={muridInKelas}
        getKelasName={api.getKelasName}
        getMapelName={api.getMapelName}
        onLihatUjian={api.openMuridAttempt}
        onReset={api.handleResetAttempt}
        onIzinkanEdit={api.handleAllowEditAttempt}
      />

      <LihatUjianMuridModal
        selected={api.selectedMuridAttempt}
        onClose={() => {
          api.setSelectedMuridAttempt(null);
          api.setEssayReview({});
        }}
        loading={api.loadingMuridAttempt}
        essayReview={api.essayReview}
        setEssayReview={api.setEssayReview}
        savingEssayReview={api.savingEssayReview}
        onSaveEssayReview={api.handleSaveEssayReview}
      />
    </div>
  );
};

export default BuatUjianCBT;
