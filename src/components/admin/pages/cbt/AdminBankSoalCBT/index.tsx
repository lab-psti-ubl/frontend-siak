import React from 'react';
import Card from '../../../../ui/Card';
import { useAdminBankSoalCBT } from './useAdminBankSoalCBT';
import AdminBankSoalCBTHeader from './AdminBankSoalCBTHeader';
import AdminKelasCBTList from './AdminKelasCBTList';
import AdminBankSoalList from './AdminBankSoalList';
import AdminSoalList from './AdminSoalList';
import AdminAddKelasModal from './modals/AdminAddKelasModal';
import AdminAddBankModal from './modals/AdminAddBankModal';
import AdminSoalFormModal from './modals/AdminSoalFormModal';
import AdminSoalDetailModal from './modals/AdminSoalDetailModal';
import AdminPreviewSoalModal from './modals/AdminPreviewSoalModal';

const AdminBankSoalCBT: React.FC = () => {
  const api = useAdminBankSoalCBT();

  if (!api.isAdmin) {
    return (
      <Card className="py-10 text-center">
        <p className="text-gray-700 font-medium">
          Halaman ini hanya dapat diakses oleh admin.
        </p>
      </Card>
    );
  }

  if (!api.activeTahunAjaran) {
    return (
      <Card className="py-10 text-center">
        <p className="text-gray-700 font-medium">
          Tidak ada tahun ajaran aktif. Hubungi admin untuk mengaktifkan tahun ajaran.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <AdminBankSoalCBTHeader
        selectedKelasAdmin={api.selectedKelasAdmin}
        selectedBank={api.selectedBank}
        activeTahunAjaran={api.activeTahunAjaran}
      />

      {!api.selectedKelasAdmin && (
        <AdminKelasCBTList
          kelasCBTList={api.kelasCBTList}
          loadingAdminBanks={api.loadingAdminBanks}
          activeTahunAjaran={api.activeTahunAjaran}
          jurusanRequired={api.jurusanRequired}
          tingkatLabel={api.tingkatLabel}
          getMapelName={api.getMapelName}
          getJurusanName={api.getJurusanName}
          onOpenAddKelas={api.handleOpenAddKelasModal}
          onSelectKelas={api.setSelectedKelasAdmin}
        />
      )}

      {api.selectedKelasAdmin && !api.selectedBank && (
        <AdminBankSoalList
          selectedKelasAdmin={api.selectedKelasAdmin}
          bankSoal={api.bankSoal}
          activeTahunAjaran={api.activeTahunAjaran}
          jurusanRequired={api.jurusanRequired}
          tingkatLabel={api.tingkatLabel}
          getMapelName={api.getMapelName}
          getJurusanName={api.getJurusanName}
          onBack={() => {
            api.setSelectedKelasAdmin(null);
            api.setSelectedBank(null);
          }}
          onAddBank={api.handleOpenAddBankModal}
          onSelectBank={api.setSelectedBank}
        />
      )}

      {api.selectedKelasAdmin && api.selectedBank && (
        <AdminSoalList
          selectedKelasAdmin={api.selectedKelasAdmin}
          selectedBank={api.selectedBank}
          soal={api.soal}
          jurusanRequired={api.jurusanRequired}
          getMapelName={api.getMapelName}
          getJurusanName={api.getJurusanName}
          tingkatLabel={api.tingkatLabel}
          onBack={() => api.setSelectedBank(null)}
          onAddSoal={api.handleOpenAddSoalModal}
          onPreview={() => api.setShowPreviewSoal(true)}
          onDetail={api.setSelectedSoalDetail}
          onEdit={api.handleOpenEditSoalModal}
          onDelete={api.handleDeleteSoal}
        />
      )}

      <AdminAddKelasModal
        isOpen={api.isAddKelasModalOpen}
        onClose={() => api.setIsAddKelasModalOpen(false)}
        tingkatList={api.tingkatList}
        mataPelajaran={api.mataPelajaran}
        jurusanRequired={api.jurusanRequired}
        jurusan={api.jurusan}
        addKelasTingkat={api.addKelasTingkat}
        addKelasMapelId={api.addKelasMapelId}
        addKelasJurusanId={api.addKelasJurusanId}
        setAddKelasTingkat={api.setAddKelasTingkat}
        setAddKelasMapelId={api.setAddKelasMapelId}
        setAddKelasJurusanId={api.setAddKelasJurusanId}
        tingkatLabel={api.tingkatLabel}
        onCreate={api.handleCreateKelasAdmin}
      />

      <AdminAddBankModal
        isOpen={api.isAddBankModalOpen}
        onClose={() => api.setIsAddBankModalOpen(false)}
        bankJudul={api.bankJudul}
        setBankJudul={api.setBankJudul}
        selectedKategoriId={api.selectedKategoriId}
        setSelectedKategoriId={api.setSelectedKategoriId}
        selectedJenisSoal={api.selectedJenisSoal}
        setSelectedJenisSoal={api.setSelectedJenisSoal}
        totalSoal={api.totalSoal}
        setTotalSoal={api.setTotalSoal}
        customKuota={api.customKuota}
        setCustomKuota={api.setCustomKuota}
        kategoriUTSUAS={api.kategoriUTSUAS}
        onCreate={api.handleCreateBankSoal}
      />

      <AdminSoalFormModal
        isOpen={api.isAddSoalModalOpen}
        onClose={api.handleCloseSoalModal}
        title={api.editingSoal ? 'Edit Soal CBT' : 'Tambah Soal CBT'}
        bankTipe={api.selectedBank?.tipe}
        allowedTipeOptions={api.allowedCustomTypes}
        soalForm={api.soalForm}
        setSoalForm={api.setSoalForm}
        onAddOpsi={api.handleAddOpsi}
        onUpdateOpsiText={api.handleUpdateOpsiText}
        onToggleOpsiCorrect={api.handleToggleOpsiCorrect}
        onRemoveOpsi={api.handleRemoveOpsi}
        onAddPair={api.handleAddPair}
        onUpdatePair={api.handleUpdatePair}
        onRemovePair={api.handleRemovePair}
        onSave={api.editingSoal ? api.handleUpdateSoal : api.handleCreateSoal}
      />

      <AdminSoalDetailModal
        selectedSoal={api.selectedSoalDetail}
        onClose={() => api.setSelectedSoalDetail(null)}
      />

      <AdminPreviewSoalModal
        isOpen={api.showPreviewSoal}
        onClose={() => api.setShowPreviewSoal(false)}
        soal={api.soal}
      />
    </div>
  );
};

export default AdminBankSoalCBT;
