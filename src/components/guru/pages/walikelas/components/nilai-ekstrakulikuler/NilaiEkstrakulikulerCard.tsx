import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Badge from '../../../../../ui/Badge';
import { NilaiEkstrakulikuler } from '../../../../../../types';

interface NilaiEkstrakulikulerCardProps {
  nilaiEkstrakulikuler: NilaiEkstrakulikuler[];
  onEditClick: (nilai: NilaiEkstrakulikuler) => void;
  onDelete: (nilai: NilaiEkstrakulikuler) => void;
}

const NilaiEkstrakulikulerCard: React.FC<NilaiEkstrakulikulerCardProps> = ({
  nilaiEkstrakulikuler,
  onEditClick,
  onDelete,
}) => {
  return (
    <div className="lg:hidden space-y-3">
      {nilaiEkstrakulikuler.map((nilai, index) => (
        <Card key={nilai.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="p-4">
            {/* Header dengan Nomor dan Nama Kegiatan */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 text-base leading-tight mb-1">
                  {nilai.ekstrakulikuler?.nama || '-'}
                </h4>
              </div>
            </div>

            {/* Grid Nilai dan Predikat */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Nilai</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{nilai.nilai}</span>
                  <span className="text-xs text-slate-500">/100</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
                <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Predikat</div>
                <div className="flex items-center">
                  <Badge variant="info">{nilai.predikat}</Badge>
                </div>
              </div>
            </div>

            {/* Keterangan */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Keterangan</div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">{nilai.keterangan}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => onEditClick(nilai)}
                className="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 active:bg-yellow-800 transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onDelete(nilai)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default NilaiEkstrakulikulerCard;

