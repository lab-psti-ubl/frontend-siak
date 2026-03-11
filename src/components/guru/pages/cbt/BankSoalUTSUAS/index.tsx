import React from 'react';
import { BookOpen, ChevronLeft } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import BankSoalList from '../BankSoalCBT/BankSoalList';
import SoalList from '../BankSoalCBT/SoalList';
import AddBankModal from '../BankSoalCBT/modals/AddBankModal';
import SoalFormModal from '../BankSoalCBT/modals/SoalFormModal';
import SoalDetailModal from '../BankSoalCBT/modals/SoalDetailModal';
import PreviewSoalModal from '../BankSoalCBT/modals/PreviewSoalModal';
import { useBankSoalUTSUAS } from './useBankSoalUTSUAS';

const BankSoalUTSUAS: React.FC = () => {
  const api = useBankSoalUTSUAS();

  if (!api.isGuru) {
    return (
      <Card className="py-10 text-center">
        <p className="text-gray-700 font-medium">Halaman ini hanya dapat diakses oleh guru.</p>
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

  if (api.loadingAssignments) {
    return (
      <Card className="py-10 text-center">
        <p className="text-gray-700 font-medium">Memuat penugasan UTS/UAS...</p>
      </Card>
    );
  }

  if (api.assignments.length === 0) {
    return (
      <Card className="py-10 text-center">
        <p className="text-gray-700 font-medium">
          Anda belum ditunjuk sebagai penginput soal UTS/UAS untuk semester ini.
        </p>
      </Card>
    );
  }

  const selectedCBTKelasLike = api.selectedAssignment
    ? {
        id: api.globalCBTKelasId,
        tingkat: api.selectedAssignment.tingkat,
        mataPelajaranId: api.selectedAssignment.mataPelajaranId,
        semester: api.activeTahunAjaran.semester,
        tahunAjaran: api.activeTahunAjaran.tahun,
      }
    : null;

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-violet-700 via-violet-700 to-violet-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Bank Soal UTS/UAS (Global)
              </h1>
              <p className="text-sm sm:text-base text-violet-100">
                Kelola bank soal global UTS/UAS sesuai penugasan admin pada semester aktif.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-white/10 text-white border border-white/20">
                Tahun Ajaran {api.activeTahunAjaran.tahun} • Semester {api.activeTahunAjaran.semester}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {!api.selectedAssignment && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-700" />
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Pilih Penugasan UTS/UAS
              </h2>
            </div>
            <Badge variant="outline" className="border-violet-200 text-violet-700">
              Total: {api.assignments.length}
            </Badge>
          </div>
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {api.assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => api.setSelectedAssignment(a)}
                className="text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md transition-all p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {a.kategoriNama}
                    </div>
                    <div className="mt-1 font-bold text-slate-900 line-clamp-2">
                      {api.getMapelName(a.mataPelajaranId)}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {api.tingkatLabel(a.tingkat)}
                    </div>
                    {api.jurusanRequired && (
                      <div className="mt-1 text-xs text-slate-500">
                        Jurusan: <span className="font-medium text-slate-700">{api.getJurusanName(a.jurusanId)}</span>
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 shrink-0">
                    {api.activeTahunAjaran.tahun} • S{api.activeTahunAjaran.semester}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {api.selectedAssignment && !api.selectedBank && selectedCBTKelasLike && (
        <>
          

          <BankSoalList
            selectedCBTKelas={selectedCBTKelasLike}
            bankSoal={api.bankSoal}
            tingkatLabel={api.tingkatLabel}
            getMapelName={api.getMapelName}
            onBack={() => {
              api.setSelectedAssignment(null);
              api.setSelectedBank(null);
            }}
            onAddBank={api.handleOpenAddBankModal}
            onSelectBank={api.setSelectedBank}
          />
        </>
      )}

      {api.selectedAssignment && api.selectedBank && selectedCBTKelasLike && (
        <SoalList
          selectedCBTKelas={selectedCBTKelasLike}
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

      <AddBankModal
        isOpen={api.isAddBankModalOpen}
        onClose={() => api.setIsAddBankModalOpen(false)}
        bankJudul={api.bankJudul}
        setBankJudul={api.setBankJudul}
        selectedKategoriId={api.kategoriAssignment?.id || ''}
        setSelectedKategoriId={(_v: string) => {}}
        selectedJenisSoal={api.selectedJenisSoal}
        setSelectedJenisSoal={api.setSelectedJenisSoal}
        totalSoal={api.totalSoal}
        setTotalSoal={api.setTotalSoal}
        customKuota={api.customKuota}
        setCustomKuota={api.setCustomKuota}
        komponenNilaiForBank={api.kategoriAssignment ? [api.kategoriAssignment] : []}
        onCreate={api.handleCreateBankSoal}
      />

      <SoalFormModal
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

      <SoalDetailModal selectedSoal={api.selectedSoalDetail} onClose={() => api.setSelectedSoalDetail(null)} />

      <PreviewSoalModal isOpen={api.showPreviewSoal} onClose={() => api.setShowPreviewSoal(false)} soal={api.soal} />
    </div>
  );
};

export default BankSoalUTSUAS;

