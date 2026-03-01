import React from 'react';
import Button from '../../../../../ui/Button';
import Modal from '../../../../../ui/Modal';
import type { CBTSoalItem } from '../../../../../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  soal: CBTSoalItem[];
};

const AdminPreviewSoalModal: React.FC<Props> = ({ isOpen, onClose, soal }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preview Soal - Tampilan Murid"
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        <p className="text-sm text-slate-600">
          Berikut tampilan soal seperti yang akan dilihat murid saat mengerjakan ujian. Jawaban tidak disimpan.
        </p>
        {soal.map((s, index) => (
          <div
            key={s.id}
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base text-slate-800 whitespace-pre-wrap">
                  {s.pertanyaan}
                </p>
                {s.gambar && (
                  <div className="mt-3">
                    <img
                      src={s.gambar}
                      alt="Gambar soal"
                      className="max-w-full max-h-48 rounded-lg border border-slate-200 object-contain bg-slate-50"
                    />
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-500">Poin: {s.poin}</p>
              </div>
            </div>

            <div className="pl-10 sm:pl-12 space-y-2">
              {(s.tipe === 'pilihan_ganda' || s.tipe === 'pilihan_ganda_kompleks') &&
                Array.isArray(s.opsi) &&
                s.opsi.length > 0 && (
                  <div className="space-y-2">
                    {s.opsi.map((o, idx) => (
                      <label
                        key={o.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type={s.tipe === 'pilihan_ganda' ? 'radio' : 'checkbox'}
                          name={`preview-soal-${s.id}`}
                          className="w-4 h-4 text-blue-600 border-slate-300"
                        />
                        <span className="font-medium text-slate-600 w-6">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="text-sm text-slate-800">{o.text || '-'}</span>
                      </label>
                    ))}
                  </div>
                )}

              {s.tipe === 'benar_salah' && (
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 cursor-pointer hover:bg-slate-50">
                    <input type="radio" name={`preview-bs-${s.id}`} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-slate-800">Benar</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 cursor-pointer hover:bg-slate-50">
                    <input type="radio" name={`preview-bs-${s.id}`} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-slate-800">Salah</span>
                  </label>
                </div>
              )}

              {s.tipe === 'menjodohkan' &&
                Array.isArray(s.pasanganMenjodohkan) &&
                s.pasanganMenjodohkan.length > 0 && (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-2 gap-px bg-slate-200">
                      <div className="bg-slate-50 font-medium text-xs text-slate-500 px-3 py-2">
                        Kolom Kiri
                      </div>
                      <div className="bg-slate-50 font-medium text-xs text-slate-500 px-3 py-2">
                        Pilihan (Kolom Kanan)
                      </div>
                      {s.pasanganMenjodohkan.map((p) => (
                        <React.Fragment key={p.id}>
                          <div className="bg-white px-3 py-2 text-sm text-slate-800">
                            {p.left || '-'}
                          </div>
                          <div className="bg-white px-3 py-2">
                            <select className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                              <option value="">Pilih pasangan</option>
                              {s.pasanganMenjodohkan?.map((p2, i) => (
                                <option key={p2.id} value={i}>
                                  {p2.right || '-'}
                                </option>
                              ))}
                            </select>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 px-3 py-2 bg-slate-50 border-t border-slate-200">
                      Murid menjodohkan kolom kiri dengan pilihan di kolom kanan.
                    </p>
                  </div>
                )}

              {s.tipe === 'essay' && (
                <div className="rounded-lg border border-slate-200 bg-white">
                  <textarea
                    placeholder="Tulis jawaban essay di sini..."
                    className="w-full px-3 py-2.5 text-sm border-0 rounded-lg resize-none min-h-[80px] placeholder:text-slate-400 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
        <Button variant="secondary" onClick={onClose} className="px-4 py-2 text-sm">
          Tutup Preview
        </Button>
      </div>
    </Modal>
  );
};

export default AdminPreviewSoalModal;
