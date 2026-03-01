import React from 'react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import type { CBTSoalItem } from '../../../../../types';

type Props = {
  selectedSoal: CBTSoalItem | null;
  onClose: () => void;
};

const AdminSoalDetailModal: React.FC<Props> = ({ selectedSoal, onClose }) => {
  return (
    <Modal isOpen={!!selectedSoal} onClose={onClose} title="Detail Soal" size="xl">
      {selectedSoal && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Pertanyaan</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 whitespace-pre-wrap">
              {selectedSoal.pertanyaan}
            </div>
            {selectedSoal.gambar && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Gambar Soal</label>
                <img
                  src={selectedSoal.gambar}
                  alt="Gambar soal"
                  className="max-w-full max-h-64 rounded-lg border border-slate-200 object-contain bg-white"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center rounded-full px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {selectedSoal.tipe.replace(/_/g, ' ')}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 font-medium bg-slate-50 text-slate-700 border border-slate-200">
              Poin: {selectedSoal.poin}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Jawaban</label>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 space-y-2">
              {(selectedSoal.tipe === 'pilihan_ganda' ||
                selectedSoal.tipe === 'pilihan_ganda_kompleks') &&
                Array.isArray(selectedSoal.opsi) &&
                selectedSoal.opsi.length > 0 && (
                  <ul className="space-y-2">
                    {selectedSoal.opsi.map((o, idx) => {
                      const isCorrect =
                        Array.isArray(selectedSoal.jawabanBenar) &&
                        selectedSoal.jawabanBenar.includes(o.id);
                      return (
                        <li
                          key={o.id}
                          className={`flex items-start gap-2 rounded-lg px-3 py-2 ${
                            isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
                          }`}
                        >
                          <span className="text-slate-500 w-6 font-medium">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span className="flex-1 text-slate-800">{o.text || '-'}</span>
                          {isCorrect && (
                            <span className="text-xs font-medium text-emerald-600">✓ Benar</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

              {selectedSoal.tipe === 'benar_salah' && (
                <p className="text-slate-800 font-medium">
                  Jawaban: {selectedSoal.jawabanBenar === true ? 'Benar' : 'Salah'}
                </p>
              )}

              {selectedSoal.tipe === 'menjodohkan' &&
                Array.isArray(selectedSoal.pasanganMenjodohkan) &&
                selectedSoal.pasanganMenjodohkan.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">
                      Penilaian:{' '}
                      {selectedSoal.menjodohkanScoring === 'minimal_benar'
                        ? `Minimal ${selectedSoal.menjodohkanMinimalBenar ?? 1} pasangan benar → soal dianggap benar`
                        : 'Harus benar semua'}
                    </p>
                    <ul className="space-y-2">
                      {selectedSoal.pasanganMenjodohkan.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span className="flex-1 text-slate-800">{p.left || '-'}</span>
                          <span className="text-slate-400">↔</span>
                          <span className="flex-1 text-slate-800">{p.right || '-'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedSoal.tipe === 'essay' && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    Jawaban Kunci / Pedoman Penilaian
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap">
                    {selectedSoal.jawabanBenar || '-'}
                  </p>
                </div>
              )}

              {selectedSoal.tipe !== 'pilihan_ganda' &&
                selectedSoal.tipe !== 'pilihan_ganda_kompleks' &&
                selectedSoal.tipe !== 'benar_salah' &&
                selectedSoal.tipe !== 'menjodohkan' &&
                selectedSoal.tipe !== 'essay' && <p className="text-slate-500">-</p>}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={onClose} className="px-4 py-2 text-sm">
              Tutup
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AdminSoalDetailModal;
