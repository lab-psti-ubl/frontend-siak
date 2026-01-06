import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import { User, Nilai, NilaiTugas } from '../../../../../../types';
import { showErrorNotification } from '../../../../../../utils/notificationUtils';
import { useKomponenNilai } from '../../../../../../hooks/useKomponenNilai';

interface InputNilaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  inputType: string;
  selectedMapel: string;
  selectedKelas: string;
  nilai: Nilai[];
  onSaveNilai: (nilaiValue: number, keterangan?: string) => void;
  getNilaiMurid: (muridId: string, mapelId: string, kelasId: string) => Nilai | undefined;
  getMapelName: (mapelId: string) => string;
  getKelasName: (kelasId: string) => string;
  editingTugas?: NilaiTugas | null;
  onSaveEditTugas?: (tugasId: string, nilaiValue: number, keterangan?: string) => void;
  editingKomponen?: any | null;
  isKomponenTunggal?: (komponenNama: string) => boolean;
}

const InputNilaiModal: React.FC<InputNilaiModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  inputType,
  selectedMapel,
  selectedKelas,
  nilai,
  onSaveNilai,
  getNilaiMurid,
  getMapelName,
  getKelasName,
  editingTugas,
  onSaveEditTugas,
  editingKomponen,
  isKomponenTunggal
}) => {
  const { komponenNilai: semuaKomponen } = useKomponenNilai();
  const [nilaiForm, setNilaiForm] = useState({ nilai: '', keterangan: '' });

  React.useEffect(() => {
    if (editingTugas) {
      setNilaiForm({
        nilai: editingTugas.nilai.toString(),
        keterangan: editingTugas.keterangan || ''
      });
    } else if (editingKomponen) {
      setNilaiForm({
        nilai: editingKomponen.nilai.toString(),
        keterangan: editingKomponen.keterangan || ''
      });
    } else if (inputType === 'uts') {
      const existingNilai = getNilaiMurid(selectedMurid?.id || '', selectedMapel, selectedKelas);
      setNilaiForm({
        nilai: existingNilai?.uts?.toString() || '',
        keterangan: ''
      });
    } else if (inputType === 'uas') {
      const existingNilai = getNilaiMurid(selectedMurid?.id || '', selectedMapel, selectedKelas);
      setNilaiForm({
        nilai: existingNilai?.uas?.toString() || '',
        keterangan: ''
      });
    } else if (isKomponenTunggal && isKomponenTunggal(inputType)) {
      const existingNilai = getNilaiMurid(selectedMurid?.id || '', selectedMapel, selectedKelas);
      const existingKomponen = existingNilai?.komponenDinamis?.find(k => k.komponenNama === inputType);
      setNilaiForm({
        nilai: existingKomponen?.nilai.toString() || '',
        keterangan: existingKomponen?.keterangan || ''
      });
    } else {
      setNilaiForm({ nilai: '', keterangan: '' });
    }
  }, [selectedMurid, inputType, selectedMapel, selectedKelas, getNilaiMurid, editingTugas, editingKomponen, isKomponenTunggal]);

  const handleSave = () => {
    if (!selectedMurid) return;

    if (!nilaiForm.nilai.trim()) {
      showErrorNotification('Nilai Tidak Boleh Kosong', 'Nilai wajib diisi!');
      return;
    }

    const nilaiValue = parseFloat(nilaiForm.nilai);
    if (isNaN(nilaiValue) || nilaiValue < 0 || nilaiValue > 100) {
      showErrorNotification('Nilai Tidak Valid', 'Nilai harus berupa angka antara 0-100!');
      return;
    }

    if (editingTugas && onSaveEditTugas) {
      onSaveEditTugas(editingTugas.id, nilaiValue, nilaiForm.keterangan.trim() || undefined);
    } else if (editingKomponen && onSaveEditTugas) {
      onSaveEditTugas(editingKomponen.id, nilaiValue, nilaiForm.keterangan.trim() || undefined);
    } else {
      onSaveNilai(nilaiValue, nilaiForm.keterangan.trim() || undefined);
    }
    setNilaiForm({ nilai: '', keterangan: '' });
  };

  const getTugasCount = () => {
    if (!selectedMurid) return 0;
    const existingNilai = getNilaiMurid(selectedMurid.id, selectedMapel, selectedKelas);
    return existingNilai ? existingNilai.tugas.length : 0;
  };

  const getKomponenCount = (komponenNama: string) => {
    if (!selectedMurid) return 0;
    const existingNilai = getNilaiMurid(selectedMurid.id, selectedMapel, selectedKelas);
    if (!existingNilai) return 0;
    return existingNilai.komponenDinamis?.filter(k => k.komponenNama === komponenNama).length || 0;
  };

  const isKomponenGanda = () => {
    const komponen = semuaKomponen.find(k => k.nama === inputType);
    return komponen && komponen.hasNilai && !['UTS', 'UAS', 'Tugas', 'Kehadiran'].includes(inputType);
  };

  const getModalTitle = () => {
    if (editingTugas) {
      return `Edit ${editingTugas.nama} - ${selectedMurid?.name}`;
    }
    if (editingKomponen) {
      return `Edit ${editingKomponen.komponenNama} - ${selectedMurid?.name}`;
    }
    if (inputType === 'tugas') {
      return `Input Tugas ${getTugasCount() + 1} - ${selectedMurid?.name}`;
    }
    if (isKomponenGanda()) {
      return `Input ${inputType} ${getKomponenCount(inputType) + 1} - ${selectedMurid?.name}`;
    }
    return `Input ${inputType.toUpperCase()} - ${selectedMurid?.name}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="md"
    >
      {selectedMurid && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nama:</span>
                <span className="ml-2 font-medium">{selectedMurid.name}</span>
              </div>
              <div>
                <span className="text-gray-600">NISN:</span>
                <span className="ml-2 font-medium">{selectedMurid.nisn}</span>
              </div>
              <div>
                <span className="text-gray-600">Mata Pelajaran:</span>
                <span className="ml-2 font-medium">{getMapelName(selectedMapel)}</span>
              </div>
              <div>
                <span className="text-gray-600">Kelas:</span>
                <span className="ml-2 font-medium">{getKelasName(selectedKelas)}</span>
              </div>
            </div>
          </div>

          {inputType === 'tugas' && !editingTugas && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tugas {getTugasCount() + 1}</strong> - Akan otomatis tersimpan dengan nama "Tugas {getTugasCount() + 1}"
              </p>
            </div>
          )}

          {(editingTugas || editingKomponen) && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Mode Edit</strong> - Anda sedang mengedit {editingTugas?.nama || editingKomponen?.komponenNama}
              </p>
            </div>
          )}

          {isKomponenGanda() && !editingTugas && !editingKomponen && (
            <div className="p-3 bg-cyan-50 rounded-lg">
              <p className="text-sm text-cyan-800">
                <strong>{inputType} {getKomponenCount(inputType) + 1}</strong> - Akan otomatis tersimpan dengan nama "{inputType} {getKomponenCount(inputType) + 1}"
              </p>
            </div>
          )}

          {!['tugas', 'uts', 'uas'].includes(inputType) && !editingTugas && !editingKomponen && !isKomponenGanda() && (
            <div className="p-3 bg-cyan-50 rounded-lg">
              <p className="text-sm text-cyan-800">
                <strong>{inputType}</strong> - Komponen nilai tunggal
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nilai {editingKomponen ? editingKomponen.komponenNama : editingTugas ? editingTugas.nama : (inputType === 'tugas' ? `Tugas ${getTugasCount() + 1}` : isKomponenGanda() ? `${inputType} ${getKomponenCount(inputType) + 1}` : inputType.toUpperCase())} (0-100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={nilaiForm.nilai}
              onChange={(e) => setNilaiForm({ ...nilaiForm, nilai: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan nilai"
              autoFocus
            />
          </div>

          {(inputType === 'tugas' || isKomponenGanda()) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan (Opsional)
              </label>
              <textarea
                value={nilaiForm.keterangan}
                onChange={(e) => setNilaiForm({ ...nilaiForm, keterangan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tambahkan keterangan (opsional)"
                rows={3}
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSave} fullWidth className="flex items-center justify-center">
              <Save size={16} className="mr-2" />
              Simpan Nilai
            </Button>
            <Button variant="secondary" fullWidth onClick={onClose}className="flex items-center justify-center">
              <X size={16} className="mr-2" />
              Batal
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default InputNilaiModal;