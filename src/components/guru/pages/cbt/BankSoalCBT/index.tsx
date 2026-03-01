import React from 'react';
import Card from '../../../../ui/Card';
import { useBankSoalCBT } from './useBankSoalCBT';
import BankSoalCBTHeader from './BankSoalCBTHeader';
import KelasCBTList from './KelasCBTList';
import BankSoalList from './BankSoalList';
import SoalList from './SoalList';
import AddKelasModal from './modals/AddKelasModal';
import AddBankModal from './modals/AddBankModal';
import SoalFormModal from './modals/SoalFormModal';
import SoalDetailModal from './modals/SoalDetailModal';
import PreviewSoalModal from './modals/PreviewSoalModal';

const BankSoalCBT: React.FC = () => {
  const api = useBankSoalCBT();

  if (!api.isGuru) {
    return (
      <Card className="py-10 text-center">
        <p className="text-gray-700 font-medium">
          Halaman ini hanya dapat diakses oleh guru.
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
      <BankSoalCBTHeader
        selectedCBTKelas={api.selectedCBTKelas}
        activeTahunAjaran={api.activeTahunAjaran}
        userName={api.user?.name}
      />

      {!api.selectedCBTKelas && (
        <KelasCBTList
          cbtKelas={api.cbtKelas}
          tingkatLabel={api.tingkatLabel}
          getMapelName={api.getMapelName}
          onOpenAddKelas={api.handleOpenAddKelasModal}
          onSelectKelas={api.setSelectedCBTKelas}
        />
      )}

      {api.selectedCBTKelas && !api.selectedBank && (
        <BankSoalList
          selectedCBTKelas={api.selectedCBTKelas}
          bankSoal={api.bankSoal}
          tingkatLabel={api.tingkatLabel}
          getMapelName={api.getMapelName}
          onBack={() => {
            api.setSelectedCBTKelas(null);
            api.setSelectedBank(null);
          }}
          onAddBank={api.handleOpenAddBankModal}
          onSelectBank={api.setSelectedBank}
        />
      )}

      {api.selectedCBTKelas && api.selectedBank && (
        <SoalList
          selectedCBTKelas={api.selectedCBTKelas}
          selectedBank={api.selectedBank}
          soal={api.soal}
          getMapelName={api.getMapelName}
          tingkatLabel={api.tingkatLabel}
          onBack={() => api.setSelectedBank(null)}
          onAddSoal={api.handleOpenAddSoalModal}
          onPreview={() => api.setShowPreviewSoal(true)}
          onDetail={api.setSelectedSoalDetail}
          onEdit={api.handleOpenEditSoalModal}
          onDelete={api.handleDeleteSoal}
        />
      )}

      <AddKelasModal
        isOpen={api.isAddKelasModalOpen}
        onClose={() => api.setIsAddKelasModalOpen(false)}
        tingkatYangDiajar={api.tingkatYangDiajar}
        mapelUntukTingkat={api.mapelUntukTingkat}
        selectedTingkat={api.selectedTingkat}
        selectedMapelId={api.selectedMapelId}
        setSelectedTingkat={api.setSelectedTingkat}
        setSelectedMapelId={api.setSelectedMapelId}
        activeTahunAjaran={api.activeTahunAjaran}
        tingkatLabel={api.tingkatLabel}
        onCreate={api.handleCreateCBTKelas}
      />

      <AddBankModal
        isOpen={api.isAddBankModalOpen}
        onClose={() => api.setIsAddBankModalOpen(false)}
        bankJudul={api.bankJudul}
        setBankJudul={api.setBankJudul}
        selectedKategoriId={api.selectedKategoriId}
        setSelectedKategoriId={api.setSelectedKategoriId}
        selectedJenisSoal={api.selectedJenisSoal}
        setSelectedJenisSoal={api.setSelectedJenisSoal}
        komponenNilaiForBank={api.komponenNilaiForBank}
        onCreate={api.handleCreateBankSoal}
      />

      <SoalFormModal
        isOpen={api.isAddSoalModalOpen}
        onClose={api.handleCloseSoalModal}
        title={api.editingSoal ? 'Edit Soal CBT' : 'Tambah Soal CBT'}
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

      <SoalDetailModal
        selectedSoal={api.selectedSoalDetail}
        onClose={() => api.setSelectedSoalDetail(null)}
      />

      <PreviewSoalModal
        isOpen={api.showPreviewSoal}
        onClose={() => api.setShowPreviewSoal(false)}
        soal={api.soal}
      />
    </div>
  );
};

export default BankSoalCBT;
