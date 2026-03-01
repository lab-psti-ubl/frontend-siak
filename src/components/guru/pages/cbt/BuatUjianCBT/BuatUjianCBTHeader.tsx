import React from 'react';
import Button from '../../../../ui/Button';
import { Plus, FileText, PlayCircle, CheckCircle, FileEdit } from 'lucide-react';

type Stats = { total: number; draft: number; sedang: number; selesai: number };

type Props = {
  onAddUjian: () => void;
  loading?: boolean;
  stats?: Stats;
};

const BuatUjianCBTHeader: React.FC<Props> = ({ onAddUjian, loading, stats = { total: 0, draft: 0, sedang: 0, selesai: 0 } }) => {
  const { total, draft, sedang, selesai } = stats;
  const display = (n: number) => (loading ? '—' : n);

  const statCards = [
    { label: 'Total ujian', value: display(total), icon: FileText, className: 'bg-slate-50 border-slate-200 text-slate-700' },
    { label: 'Sedang berlangsung', value: display(sedang), icon: PlayCircle, className: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Selesai', value: display(selesai), icon: CheckCircle, className: 'bg-slate-100 border-slate-200 text-slate-700' },
    { label: 'Draft', value: display(draft), icon: FileEdit, className: 'bg-amber-50 border-amber-200 text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Buat Ujian CBT
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-xl">
            Kelola dan atur ujian berbasis komputer untuk kelas yang Anda ajar.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onAddUjian}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Ujian CBT
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-xl border p-4 flex items-center gap-3 ${stat.className}`}
            >
              <div className="p-2 rounded-lg bg-white/80 border border-white/50">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                <div className="text-xs font-medium opacity-90 truncate">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BuatUjianCBTHeader;
