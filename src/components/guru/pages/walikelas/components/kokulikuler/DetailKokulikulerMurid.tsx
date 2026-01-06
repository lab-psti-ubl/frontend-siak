import React, { useState } from 'react';
import { X, User, BookOpen, Save } from 'lucide-react';
import { User as UserType } from '../../../../../../types';

interface DetailKokulikulerMuridProps {
  isOpen: boolean;
  onClose: () => void;
  murid: UserType & { kokulikuler: string };
  onSave: (muridId: string, kokulikuler: string) => Promise<void>;
}

const DetailKokulikulerMurid: React.FC<DetailKokulikulerMuridProps> = ({
  isOpen,
  onClose,
  murid,
  onSave,
}) => {
  const [kokulikuler, setKokulikuler] = useState(murid.kokulikuler || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setKokulikuler(murid.kokulikuler || '');
    }
  }, [isOpen, murid.kokulikuler]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(murid.id, kokulikuler.trim());
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-2">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Detail Kokulikuler Murid
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-100 mt-0.5">
                    {murid.name}
                  </p>
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

          {/* Content */}
          <div className="bg-white px-4 sm:px-6 py-5 sm:py-6">
            {/* Murid Info Card */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
                      {murid.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs sm:text-sm text-slate-600">
                        NISN: {(murid as any).nisn || '-'}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-400">•</span>
                      <span className="text-xs sm:text-sm text-slate-600">
                        Email: {murid.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kokulikuler Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    Kokulikuler
                  </div>
                </label>
                <textarea
                  value={kokulikuler}
                  onChange={(e) => setKokulikuler(e.target.value)}
                  placeholder="Masukkan kokulikuler murid..."
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm sm:text-base resize-y"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Masukkan kegiatan kokulikuler yang diikuti oleh murid ini.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:justify-end gap-3 border-t border-slate-200">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {murid.kokulikuler ? 'Perbarui Kokulikuler' : 'Simpan Kokulikuler'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailKokulikulerMurid;


