import React from 'react';
import { X, Award, BookOpen, Calendar, GraduationCap, Info } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { NilaiEkstrakulikuler } from '../../../../../../types';

interface DetailNilaiEkstrakulikulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNilai: NilaiEkstrakulikuler | null;
}

const DetailNilaiEkstrakulikulerModal: React.FC<DetailNilaiEkstrakulikulerModalProps> = ({
  isOpen,
  onClose,
  selectedNilai,
}) => {
  if (!isOpen || !selectedNilai) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header dengan gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Detail Nilai Ekstrakulikuler</h3>
                <p className="text-sm text-blue-100 mt-0.5">Informasi lengkap nilai kegiatan</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content dengan scroll */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Highlight Cards - Nilai dan Predikat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Card Nilai */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nilai</div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">{selectedNilai.nilai}</span>
                <span className="text-lg text-slate-500">/100</span>
              </div>
            </div>

            {/* Card Predikat */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-600 rounded-lg p-2">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Predikat</div>
              </div>
              <div className="flex items-center">
                <Badge variant="info">{selectedNilai.predikat}</Badge>
              </div>
            </div>
          </div>

          {/* Informasi Detail */}
          <div className="space-y-4">
            {/* Kegiatan Ekstrakulikuler */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-slate-100 rounded-lg p-2">
                  <BookOpen className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kegiatan Ekstrakulikuler</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-slate-900 ml-12">{selectedNilai.ekstrakulikuler?.nama || '-'}</p>
            </div>

            {/* Keterangan */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-slate-100 rounded-lg p-2">
                  <Info className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Keterangan</p>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNilai.keterangan}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Periode - Semester & Tahun Ajaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-100 rounded-lg p-2">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Semester</p>
                  </div>
                </div>
                <p className="text-base font-semibold text-slate-900 ml-12">
                  Semester {selectedNilai.semester} ({selectedNilai.semester === 1 ? 'Ganjil' : 'Genap'})
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-100 rounded-lg p-2">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tahun Ajaran</p>
                  </div>
                </div>
                <p className="text-base font-semibold text-slate-900 ml-12">{selectedNilai.tahunAjaran}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            Tutup
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DetailNilaiEkstrakulikulerModal;

