import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import Badge from '../../../../../ui/Badge';
import { NilaiEkstrakulikuler } from '../../../../../../types';

interface NilaiEkstrakulikulerTableProps {
  nilaiEkstrakulikuler: NilaiEkstrakulikuler[];
  onDetailClick: (nilai: NilaiEkstrakulikuler) => void;
  onEditClick: (nilai: NilaiEkstrakulikuler) => void;
  onDelete: (nilai: NilaiEkstrakulikuler) => void;
}

const NilaiEkstrakulikulerTable: React.FC<NilaiEkstrakulikulerTableProps> = ({
  nilaiEkstrakulikuler,
  onDetailClick,
  onEditClick,
  onDelete,
}) => {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
              No
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Kegiatan (Ekstrakulikuler)
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Nilai
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Predikat
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Keterangan
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {nilaiEkstrakulikuler.map((nilai, index) => (
            <tr key={nilai.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-slate-900">
                {index + 1}
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-900">
                {nilai.ekstrakulikuler?.nama || '-'}
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-slate-900">
                {nilai.nilai}
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                <Badge variant="info">{nilai.predikat}</Badge>
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-700 max-w-xs truncate">
                {nilai.keterangan}
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDetailClick(nilai)}
                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditClick(nilai)}
                    className="p-1.5 sm:p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(nilai)}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NilaiEkstrakulikulerTable;

