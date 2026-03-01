import React from 'react';
import { Plus, ImagePlus, Trash2 } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import { showErrorNotification } from '../../../../../../utils/notificationUtils';
import type { SoalFormState } from '../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  soalForm: SoalFormState;
  setSoalForm: React.Dispatch<React.SetStateAction<SoalFormState>>;
  onAddOpsi: () => void;
  onUpdateOpsiText: (id: string, text: string) => void;
  onToggleOpsiCorrect: (id: string) => void;
  onRemoveOpsi: (id: string) => void;
  onAddPair: () => void;
  onUpdatePair: (id: string, side: 'left' | 'right', value: string) => void;
  onRemovePair: (id: string) => void;
  onSave: () => void;
};

const SoalFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  soalForm,
  setSoalForm,
  onAddOpsi,
  onUpdateOpsiText,
  onToggleOpsiCorrect,
  onRemoveOpsi,
  onAddPair,
  onUpdatePair,
  onRemovePair,
  onSave,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Pertanyaan</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                value={soalForm.pertanyaan}
                onChange={(e) => setSoalForm((prev) => ({ ...prev, pertanyaan: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Gambar Soal (opsional)</label>
              <div className="flex flex-col sm:flex-row gap-2 items-start">
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                  <ImagePlus className="w-4 h-4 text-slate-500" />
                  <span>Pilih Gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        showErrorNotification('File terlalu besar', 'Ukuran gambar maksimal 2 MB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setSoalForm((prev) => ({ ...prev, gambar: reader.result as string }));
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {soalForm.gambar && (
                  <div className="relative">
                    <img src={soalForm.gambar} alt="Preview soal" className="max-h-32 rounded-lg border border-slate-200 object-contain" />
                    <button type="button" onClick={() => setSoalForm((prev) => ({ ...prev, gambar: null }))} className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Format: JPG, PNG, GIF. Maks. 2 MB.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Tipe Soal (mengikuti bank soal)</label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={soalForm.tipe} disabled>
                <option value="pilihan_ganda">Pilihan Ganda</option>
                <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks (multi jawaban)</option>
                <option value="benar_salah">Benar / Salah</option>
                <option value="menjodohkan">Menjodohkan</option>
                <option value="essay">Essay</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Poin</label>
              <input type="number" min={0} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={soalForm.poin} onChange={(e) => setSoalForm((prev) => ({ ...prev, poin: Number(e.target.value) || 0 }))} />
            </div>
          </div>
        </div>

        {(soalForm.tipe === 'pilihan_ganda' || soalForm.tipe === 'pilihan_ganda_kompleks') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-slate-700">Opsi Jawaban</p>
              <Button size="sm" variant="secondary" className="flex items-center gap-1 text-xs" onClick={onAddOpsi}><Plus className="w-3 h-3" /> Tambah Opsi</Button>
            </div>
            <div className="space-y-2">
              {soalForm.opsi.map((o, index) => (
                <div key={o.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5">
                  <input type={soalForm.tipe === 'pilihan_ganda' ? 'radio' : 'checkbox'} name="opsiBenar" checked={!!o.isCorrect} onChange={() => onToggleOpsiCorrect(o.id)} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                  <span className="text-xs text-slate-500 w-7">{String.fromCharCode(65 + index)}.</span>
                  <input type="text" className="flex-1 rounded-md border border-transparent focus:border-blue-400 focus:ring-0 text-xs sm:text-sm px-2 py-1" placeholder="Teks opsi..." value={o.text} onChange={(e) => onUpdateOpsiText(o.id, e.target.value)} />
                  {soalForm.opsi.length > 2 && <button type="button" onClick={() => onRemoveOpsi(o.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">Centang jawaban yang benar. Untuk pilihan ganda kompleks, Anda dapat memilih lebih dari satu jawaban benar.</p>
          </div>
        )}

        {soalForm.tipe === 'benar_salah' && (
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-slate-700">Jawaban Benar</p>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                <input type="radio" name="benarSalah" className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" checked={soalForm.jawabanBenarBoolean === true} onChange={() => setSoalForm((prev) => ({ ...prev, jawabanBenarBoolean: true }))} />
                Benar
              </label>
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                <input type="radio" name="benarSalah" className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" checked={soalForm.jawabanBenarBoolean === false} onChange={() => setSoalForm((prev) => ({ ...prev, jawabanBenarBoolean: false }))} />
                Salah
              </label>
            </div>
          </div>
        )}

        {soalForm.tipe === 'menjodohkan' && (
          <div className="space-y-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-3 space-y-2">
              <p className="text-xs sm:text-sm font-medium text-slate-700">Penilaian menjodohkan</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="menjodohkanScoring" checked={soalForm.menjodohkanScoring === 'semua_benar'} onChange={() => setSoalForm((prev) => ({ ...prev, menjodohkanScoring: 'semua_benar' }))} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-700">Harus benar semua</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="menjodohkanScoring" checked={soalForm.menjodohkanScoring === 'minimal_benar'} onChange={() => setSoalForm((prev) => ({ ...prev, menjodohkanScoring: 'minimal_benar' }))} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-700">Minimal benar</span>
                </label>
              </div>
              {soalForm.menjodohkanScoring === 'minimal_benar' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-slate-600">Minimal</span>
                  <input type="number" min={1} max={Math.max(1, soalForm.pasangan.length)} value={soalForm.menjodohkanMinimalBenar} onChange={(e) => setSoalForm((prev) => ({ ...prev, menjodohkanMinimalBenar: Math.max(1, Math.min(prev.pasangan.length || 1, parseInt(e.target.value, 10) || 1)) }))} className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                  <span className="text-sm text-slate-600">pasangan benar → soal dianggap benar</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500">{soalForm.menjodohkanScoring === 'semua_benar' ? 'Soal hanya benar jika semua penjodohan benar.' : `Soal dianggap benar jika minimal ${soalForm.menjodohkanMinimalBenar} pasangan yang benar (dari ${soalForm.pasangan.length} pasangan).`}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-slate-700">Pasangan yang harus dijodohkan</p>
              <Button size="sm" variant="secondary" className="flex items-center gap-1 text-xs" onClick={onAddPair}><Plus className="w-3 h-3" /> Tambah Pasangan</Button>
            </div>
            <div className="space-y-2">
              {soalForm.pasangan.map((p, index) => (
                <div key={p.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-slate-200 px-2 py-2">
                  <span className="text-xs text-slate-500 w-7">{index + 1}.</span>
                  <input type="text" className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="Kolom kiri..." value={p.left} onChange={(e) => onUpdatePair(p.id, 'left', e.target.value)} />
                  <span className="text-xs text-slate-400 text-center px-1">↔</span>
                  <input type="text" className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="Kolom kanan..." value={p.right} onChange={(e) => onUpdatePair(p.id, 'right', e.target.value)} />
                  <button type="button" onClick={() => onRemovePair(p.id)} className="self-end sm:self-auto p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">Di halaman ujian, santri/murid akan diminta untuk menjodohkan pasangan kiri dan kanan yang sesuai.</p>
          </div>
        )}

        {soalForm.tipe === 'essay' && (
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Jawaban Kunci (opsional)</label>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]" placeholder="Tuliskan jawaban kunci atau poin-poin penting untuk penilaian..." value={soalForm.jawabanEssay || ''} onChange={(e) => setSoalForm((prev) => ({ ...prev, jawabanEssay: e.target.value }))} />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="px-3 py-2 text-sm">Batal</Button>
          <Button onClick={onSave} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white border-0">
            {title.startsWith('Edit') ? 'Simpan Perubahan' : 'Simpan Soal'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SoalFormModal;
