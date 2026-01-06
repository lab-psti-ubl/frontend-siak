import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Grade, validateGradeRange, getDefaultGrades, formatGradeDisplay } from './GradeSettingsUtils';
import { apiService } from '../../../../../services/apiService';

interface GradeSettingsProps {
  // Props will be added when connecting to main component
}

const GradeSettings: React.FC<GradeSettingsProps> = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newGrade, setNewGrade] = useState<Partial<Grade>>({
    grade: '',
    minNilai: 0,
    maxNilai: 0,
    deskripsi: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch grades from API
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        const result = await apiService.getAllGrade();
        if (result.success && result.grades) {
          if (result.grades.length > 0) {
            setGrades(result.grades);
          } else {
            // If no data, initialize with default
            setGrades(getDefaultGrades());
          }
        }
      } catch (error) {
        console.error('Error fetching grades:', error);
        setGrades(getDefaultGrades());
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const validation = validateGradeRange(grades);

  const handleAddGrade = () => {
    if (!newGrade.grade?.trim()) {
      setMessage({ type: 'error', text: 'Huruf grade tidak boleh kosong' });
      return;
    }

    if (newGrade.minNilai === undefined || newGrade.maxNilai === undefined) {
      setMessage({ type: 'error', text: 'Range nilai harus diisi' });
      return;
    }

    if (newGrade.minNilai < 0 || newGrade.maxNilai > 100) {
      setMessage({ type: 'error', text: 'Nilai harus antara 0-100' });
      return;
    }

    if (newGrade.minNilai >= newGrade.maxNilai) {
      setMessage({ type: 'error', text: 'Nilai minimum harus lebih kecil dari maksimum' });
      return;
    }

    if (grades.some((g) => g.grade === newGrade.grade && g.id !== editingId)) {
      setMessage({ type: 'error', text: 'Grade ini sudah ada' });
      return;
    }

    const testGrades = editingId
      ? grades.map((g) =>
          g.id === editingId
            ? ({
                ...g,
                grade: newGrade.grade,
                minNilai: newGrade.minNilai,
                maxNilai: newGrade.maxNilai,
                deskripsi: newGrade.deskripsi,
              } as Grade)
            : g
        )
      : [...grades, { id: Date.now().toString(), ...newGrade } as Grade];

    const testValidation = validateGradeRange(testGrades);
    if (!testValidation.isValid) {
      setMessage({ type: 'error', text: testValidation.error || 'Range nilai tidak valid' });
      return;
    }

    if (editingId) {
      setGrades(testGrades);
      setMessage({ type: 'success', text: 'Grade berhasil diperbarui' });
      setEditingId(null);
    } else {
      setGrades(testGrades);
      setMessage({ type: 'success', text: 'Grade berhasil ditambahkan' });
    }

    setNewGrade({ grade: '', minNilai: 0, maxNilai: 0, deskripsi: '' });
  };

  const handleEditGrade = (grade: Grade) => {
    setEditingId(grade.id);
    setNewGrade({
      grade: grade.grade,
      minNilai: grade.minNilai,
      maxNilai: grade.maxNilai,
      deskripsi: grade.deskripsi,
    });
  };

  const handleDeleteGrade = (id: string) => {
    const grade = grades.find((g) => g.id === id);
    if (grade?.isDefault) {
      setMessage({ type: 'error', text: 'Grade bawaan tidak dapat dihapus' });
      return;
    }

    setGrades(grades.filter((g) => g.id !== id));
    setMessage({ type: 'success', text: 'Grade berhasil dihapus' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewGrade({ grade: '', minNilai: 0, maxNilai: 0, deskripsi: '' });
  };

  const handleUpdateGrade = (id: string, field: keyof Grade, value: any) => {
    setGrades(
      grades.map((g) =>
        g.id === id
          ? {
              ...g,
              [field]: field === 'minNilai' || field === 'maxNilai' ? parseInt(value) || 0 : value,
            }
          : g
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      setMessage({
        type: 'error',
        text: validation.error || 'Pengaturan grade tidak valid',
      });
      return;
    }

    try {
      // Save to API
      const result = await apiService.updateAllGrade(grades);
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Pengaturan grade berhasil disimpan',
        });
        // Refresh data from API
        const refreshResult = await apiService.getAllGrade();
        if (refreshResult.success && refreshResult.grades) {
          setGrades(refreshResult.grades);
        }
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Terjadi kesalahan saat menyimpan pengaturan grade',
        });
      }
    } catch (error) {
      console.error('Error saving grade settings:', error);
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan pengaturan grade',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Memuat data grade...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
      <div className="lg:col-span-2 w-full">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
            <h3 className="text-base sm:text-lg font-bold text-white">Manajemen Grade Nilai</h3>
          </div>
          <div className="p-4 sm:p-5 md:p-6 lg:p-7">
            <form onSubmit={handleSave} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                {grades.length > 0 ? (
                  [...grades].sort((a, b) => a.grade.localeCompare(b.grade)).map((grade) => (
                    <div key={grade.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl p-4 sm:p-5 transition-all duration-200">
                      {/* Mobile: 1 kolom, Tablet: 2 kolom (Grade+Range | Deskripsi), Desktop: 3 kolom horizontal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5">
                        {/* Kolom 1: Grade dan Range Nilai (stacked di mobile & tablet) */}
                        <div className="md:col-span-1 lg:col-span-1 space-y-4 lg:space-y-0">
                          <div className="w-full">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                              Grade
                            </label>
                            <input
                              type="text"
                              value={grade.grade}
                              onChange={(e) => handleUpdateGrade(grade.id, 'grade', e.target.value)}
                              disabled={grade.isDefault}
                              maxLength={1}
                              className={`lg:w-14 w-full h-12 px-0 rounded-lg border text-center font-bold text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                grade.isDefault
                                  ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed'
                                  : 'border-slate-300 focus:ring-blue-500 bg-white'
                              }`}
                            />
                          </div>
                          <div className="w-full lg:hidden">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                              Range Nilai
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={grade.minNilai}
                                onChange={(e) => handleUpdateGrade(grade.id, 'minNilai', e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                              />
                              <span className="text-slate-600 font-medium text-sm">-</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={grade.maxNilai}
                                onChange={(e) => handleUpdateGrade(grade.id, 'maxNilai', e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                              />
                            </div>
                          </div>
                        </div>
                        {/* Kolom 2: Range Nilai (hanya di desktop) */}
                        <div className="hidden lg:block w-full">
                          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                            Range Nilai
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={grade.minNilai}
                              onChange={(e) => handleUpdateGrade(grade.id, 'minNilai', e.target.value)}
                              className="w-16 h-12 px-1 border border-slate-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            />
                            <span className="text-slate-600 font-medium text-sm">-</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={grade.maxNilai}
                              onChange={(e) => handleUpdateGrade(grade.id, 'maxNilai', e.target.value)}
                              className="w-16 h-12 px-1 border border-slate-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            />
                          </div>
                        </div>
                        {/* Kolom 3: Deskripsi */}
                        <div className="md:col-span-1 lg:col-span-1 w-full">
                          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                            Deskripsi
                          </label>
                          <input
                            type="text"
                            value={grade.deskripsi || ''}
                            onChange={(e) => handleUpdateGrade(grade.id, 'deskripsi', e.target.value)}
                            placeholder="Cth: Sangat Baik"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 sm:py-10 text-slate-500">
                    <p className="text-sm sm:text-base">Belum ada grade nilai</p>
                  </div>
                )}
              </div>

              {message.text && (
                <div
                  className={`p-4 sm:p-5 rounded-lg sm:rounded-xl border ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.type === 'success' ? (
                      <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs sm:text-sm">{message.text}</span>
                  </div>
                </div>
              )}

              <Button type="submit" fullWidth className="justify-center flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium">
                <Save size={16} className="mr-2" />
                Simpan Pengaturan Grade
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
            <h3 className="text-base sm:text-lg font-bold text-white">Ringkasan Grade</h3>
          </div>
          <div className="p-5 sm:p-6 lg:p-7 space-y-4">
            <div className="p-4 sm:p-5 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base">Grade Aktif</h4>
              <div className="space-y-2 sm:space-y-3">
                {[...grades].sort((a, b) => a.grade.localeCompare(b.grade)).map((grade) => (
                  <div key={grade.id} className="p-3 bg-white rounded-lg border border-blue-100">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="text-sm sm:text-base font-bold text-blue-900">{grade.grade}</p>
                      <span className="text-xs sm:text-sm text-blue-700 font-medium">{grade.minNilai}-{grade.maxNilai}</span>
                    </div>
                    {grade.deskripsi && (
                      <p className="text-xs sm:text-sm text-blue-700">{grade.deskripsi}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeSettings;
