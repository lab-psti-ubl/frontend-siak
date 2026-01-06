import React from 'react';
import { BookOpen, Plus, Edit2, Trash2, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Badge from '../../../../../ui/Badge';
import { CapaianPembelajaranKelas } from '../../../../../../types';

interface CapaianPembelajaranTingkatViewProps {
  capaianPembelajaran: CapaianPembelajaranKelas;
  getMataPelajaranName: (mapelId: string) => string;
  onViewDetail: (tingkat: number, mataPelajaranId: string, capaianPembelajaran: string) => void;
  onEdit: (tingkat: number, mataPelajaranId: string, capaianPembelajaran: string) => void;
  onDelete: (tingkat: number, mataPelajaranId: string) => void;
  onAdd: (tingkat?: number, mataPelajaranId?: string) => void;
}

const CapaianPembelajaranTingkatView: React.FC<CapaianPembelajaranTingkatViewProps> = ({
  capaianPembelajaran,
  getMataPelajaranName,
  onViewDetail,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const [expandedTingkat, setExpandedTingkat] = React.useState<Set<number>>(new Set());

  const toggleTingkat = (tingkat: number) => {
    setExpandedTingkat(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tingkat)) {
        newSet.delete(tingkat);
      } else {
        newSet.add(tingkat);
      }
      return newSet;
    });
  };

  // Desktop/Tablet View
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Desktop Accordion View */}
      <div className="hidden lg:block space-y-3">
        {capaianPembelajaran.tingkatData.map((tingkatData) => (
          <Card key={tingkatData.tingkat} className="border border-slate-200 shadow-sm overflow-hidden">
            <div className="w-full px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-50 hover:from-blue-100 hover:to-blue-100 transition-colors flex items-center justify-between">
              <button
                onClick={() => toggleTingkat(tingkatData.tingkat)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                {expandedTingkat.has(tingkatData.tingkat) ? (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                )}
                <Badge  className="text-sm text-slate-900 font-semibold">
                  Tingkat {tingkatData.tingkat}
                </Badge>
                <span className="text-sm text-slate-900">
                  {tingkatData.mataPelajaranData.length} mata pelajaran
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(tingkatData.tingkat);
                }}
                className="p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors flex-shrink-0"
                title="Tambah Capaian"
              >
                <Plus size={18} />
              </button>
            </div>

            {expandedTingkat.has(tingkatData.tingkat) && (
              <div className="p-0 pt-2 border-t border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Mata Pelajaran
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Capaian Pembelajaran
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {tingkatData.mataPelajaranData.map((mapelData, index) => (
                        <tr key={mapelData.mataPelajaranId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                            {getMataPelajaranName(mapelData.mataPelajaranId)}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 max-w-md">
                            <p className="line-clamp-2">{mapelData.capaianPembelajaran}</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => onViewDetail(tingkatData.tingkat, mapelData.mataPelajaranId, mapelData.capaianPembelajaran)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Detail"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => onEdit(tingkatData.tingkat, mapelData.mataPelajaranId, mapelData.capaianPembelajaran)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => onDelete(tingkatData.tingkat, mapelData.mataPelajaranId)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {capaianPembelajaran.tingkatData.map((tingkatData) => (
          <Card key={tingkatData.tingkat} className="border border-slate-200 shadow-sm overflow-hidden">
            <div className="w-full px-4 py-4 bg-gradient-to-r from-blue-50 to-blue-50 hover:from-blue-100 hover:to-blue-100 transition-colors flex items-center justify-between">
              <button
                onClick={() => toggleTingkat(tingkatData.tingkat)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                {expandedTingkat.has(tingkatData.tingkat) ? (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                )}
                <Badge className="text-sm text-slate-900 font-semibold">
                  Tingkat {tingkatData.tingkat}
                </Badge>
                <span className="text-sm text-slate-900">
                  {tingkatData.mataPelajaranData.length} mata pelajaran
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(tingkatData.tingkat);
                }}
                className="p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors flex-shrink-0"
                title="Tambah Capaian"
              >
                <Plus size={18} />
              </button>
            </div>

            {expandedTingkat.has(tingkatData.tingkat) && (
              <div className="p-0 pt-2 border-t border-slate-200 space-y-3">
                {tingkatData.mataPelajaranData.map((mapelData, index) => (
                  <Card key={mapelData.mataPelajaranId} className="border border-slate-200">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                              {index + 1}
                            </span>
                            <Badge variant="success" className="text-xs">
                              {getMataPelajaranName(mapelData.mataPelajaranId)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 line-clamp-3 mt-2">
                            {mapelData.capaianPembelajaran}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => onViewDetail(tingkatData.tingkat, mapelData.mataPelajaranId, mapelData.capaianPembelajaran)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye size={14} />
                          Detail
                        </button>
                        <button
                          onClick={() => onEdit(tingkatData.tingkat, mapelData.mataPelajaranId, mapelData.capaianPembelajaran)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(tingkatData.tingkat, mapelData.mataPelajaranId)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={14} />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CapaianPembelajaranTingkatView;

