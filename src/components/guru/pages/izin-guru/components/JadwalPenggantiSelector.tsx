import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Guru, GuruPenggantiJadwal, JadwalPelajaran, MataPelajaran, TahfizSchedule } from '../../../../../types';
import {
  JadwalDetail,
  getGurusWithoutScheduleOnDate,
  getGurusWithoutTimeConflict,
  getUstadzWithoutTimeConflictTahfiz,
  getMataPelajaranNameById,
  getKelasNameById
} from '../utils/jadwalPenggantiUtils';
import { useGurus } from '../../../../../hooks/useGurus';
import { useKelas } from '../../../../../hooks/useKelas';
import { useUstadz } from '../../../../../hooks/useUstadz';
import { useLanguage } from '../../../../../context/LanguageContext';

interface JadwalPenggantiSelectorProps {
  jadwalDetails: JadwalDetail[];
  onSelectionChange: (selections: GuruPenggantiJadwal[]) => void;
  guruIdToExclude: string;
  tahunAjaran: string;
  semester: number;
  jadwalPelajaran: JadwalPelajaran[];
  mataPelajaran: MataPelajaran[];
  jadwalTahfiz?: TahfizSchedule[];
  kelasTahfiz?: any[];
  initialSelections?: GuruPenggantiJadwal[];
}

const JadwalPenggantiSelector: React.FC<JadwalPenggantiSelectorProps> = ({
  jadwalDetails,
  onSelectionChange,
  guruIdToExclude,
  tahunAjaran,
  semester,
  jadwalPelajaran,
  mataPelajaran,
  jadwalTahfiz = [],
  kelasTahfiz = [],
  initialSelections = []
}) => {
  const { t } = useLanguage();
  const { gurus } = useGurus();
  const { kelas } = useKelas();
  const { ustadz } = useUstadz();
  const [selections, setSelections] = useState<Map<string, string>>(new Map());
  const [expandedJadwals, setExpandedJadwals] = useState<Set<string>>(new Set());
  const [availableGurusMap, setAvailableGurusMap] = useState<Map<string, Guru[]>>(new Map());

  // Initialize selections from initialSelections (for edit mode)
  useEffect(() => {
    if (initialSelections.length > 0 && jadwalDetails.length > 0) {
      const initialMap = new Map<string, string>();
      initialSelections.forEach(selection => {
        // Find matching jadwal detail by jadwalId
        // Try exact match first
        let matchingDetail = jadwalDetails.find(d => d.jadwalKey === selection.jadwalId);
        
        // If not found and jadwalId starts with "tahfiz_", try without prefix (backward compatibility)
        if (!matchingDetail && selection.jadwalId.startsWith('tahfiz_')) {
          const idWithoutPrefix = selection.jadwalId.replace('tahfiz_', '');
          matchingDetail = jadwalDetails.find(d => 
            d.jadwalKey === `tahfiz_${idWithoutPrefix}` || 
            (d.isTahfiz && (d.jadwal as any).id === idWithoutPrefix)
          );
          // If found, use the new jadwalKey format
          if (matchingDetail) {
            initialMap.set(matchingDetail.jadwalKey, selection.guruPenggantiId);
          }
        } else if (matchingDetail) {
          initialMap.set(selection.jadwalId, selection.guruPenggantiId);
        }
      });
      
      // Only update if selections are different to avoid infinite loop
      const currentSelectionsStr = Array.from(selections.entries()).sort().join(',');
      const newSelectionsStr = Array.from(initialMap.entries()).sort().join(',');
      
      if (currentSelectionsStr !== newSelectionsStr && initialMap.size > 0) {
        setSelections(initialMap);
        
        // Trigger onSelectionChange with initial data
        const guruPenggantiList: GuruPenggantiJadwal[] = Array.from(initialMap.entries()).map(
          ([jadwalKey, guruId]) => {
            const detail = jadwalDetails.find(d => d.jadwalKey === jadwalKey);
            return {
              jadwalId: jadwalKey,
              tanggal: detail?.tanggal || '',
              guruPenggantiId: guruId
            };
          }
        );
        onSelectionChange(guruPenggantiList);
      }
    } else if (initialSelections.length === 0 && selections.size > 0 && jadwalDetails.length === 0) {
      // Clear selections if initialSelections is empty and no jadwal (new form or cleared)
      setSelections(new Map());
      onSelectionChange([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialSelections), jadwalDetails.map(d => d.jadwalKey).join(',')]);

  useEffect(() => {
    const gurusMap = new Map<string, (Guru | any)[]>();

    jadwalDetails.forEach(detail => {
      const key = detail.jadwalKey;
      
      if (detail.isTahfiz) {
        // For tahfiz schedule, get available ustadz
        const availableUstadz = getUstadzWithoutTimeConflictTahfiz(
          guruIdToExclude,
          detail.tanggal,
          detail.jadwal.jamMulai,
          detail.jadwal.jamSelesai,
          ustadz,
          jadwalTahfiz,
          kelasTahfiz
        );
        gurusMap.set(key, availableUstadz);
      } else {
        // For regular schedule, get available gurus
        const availableGurus = getGurusWithoutTimeConflict(
          guruIdToExclude,
          detail.tanggal,
          detail.jadwal.jamMulai,
          detail.jadwal.jamSelesai,
          tahunAjaran,
          semester,
          gurus,
          jadwalPelajaran
        );
        gurusMap.set(key, availableGurus);
      }
    });

    setAvailableGurusMap(gurusMap);
    
    // Clean up selections for jadwal that no longer exist
    const currentJadwalKeys = new Set(jadwalDetails.map(d => d.jadwalKey));
    const newSelections = new Map<string, string>();
    selections.forEach((guruId, jadwalKey) => {
      if (currentJadwalKeys.has(jadwalKey)) {
        newSelections.set(jadwalKey, guruId);
      }
    });
    
    if (newSelections.size !== selections.size) {
      setSelections(newSelections);
      
      // Update onSelectionChange
      const guruPenggantiList: GuruPenggantiJadwal[] = Array.from(newSelections.entries()).map(
        ([jadwalKey, guruId]) => {
          const detail = jadwalDetails.find(d => d.jadwalKey === jadwalKey);
          return {
            jadwalId: jadwalKey,
            tanggal: detail?.tanggal || '',
            guruPenggantiId: guruId
          };
        }
      );
      onSelectionChange(guruPenggantiList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jadwalDetails.map(d => d.jadwalKey).join(','), guruIdToExclude, tahunAjaran, semester, gurus.length, jadwalPelajaran.length, ustadz.length, jadwalTahfiz.length, kelasTahfiz.length]);

  const handleSelectionChange = (jadwalKey: string, guruId: string) => {
    const newSelections = new Map(selections);

    if (guruId) {
      newSelections.set(jadwalKey, guruId);
    } else {
      newSelections.delete(jadwalKey);
    }

    setSelections(newSelections);

    const guruPenggantiList: GuruPenggantiJadwal[] = Array.from(newSelections.entries()).map(
      ([jadwalKey, guruId]) => {
        const detail = jadwalDetails.find(d => d.jadwalKey === jadwalKey);
        return {
          jadwalId: jadwalKey,
          tanggal: detail?.tanggal || '', // Use tanggal (YYYY-MM-DD), not hari
          guruPenggantiId: guruId
        };
      }
    );

    onSelectionChange(guruPenggantiList);
  };

  const toggleExpanded = (jadwalKey: string) => {
    const newExpanded = new Set(expandedJadwals);

    if (newExpanded.has(jadwalKey)) {
      newExpanded.delete(jadwalKey);
    } else {
      newExpanded.add(jadwalKey);
    }

    setExpandedJadwals(newExpanded);
  };

  if (jadwalDetails.length === 0) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          {t('izinGuru.jadwalPengganti.tidakAdaJadwalMengajar')}
        </p>
      </div>
    );
  }

  const groupedByDay = jadwalDetails.reduce((acc, detail) => {
    const hari = detail.hari.charAt(0).toUpperCase() + detail.hari.slice(1);
    if (!acc[hari]) {
      acc[hari] = [];
    }
    acc[hari].push(detail);
    return acc;
  }, {} as Record<string, JadwalDetail[]>);

  return (
    <div className="space-y-3">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <h3 className="text-sm font-semibold text-amber-900">{t('izinGuru.jadwalPengganti.guruPenggantiWajibDipilih')}</h3>
        <p className="text-xs text-amber-800 mt-1">{t('izinGuru.jadwalPengganti.silakanPilihGuruPengganti')}</p>
      </div>
      <div className="space-y-4">
        {Object.entries(groupedByDay).map(([hari, details]) => {
          const dayKey = hari;
          const isExpanded = expandedJadwals.has(dayKey);

          return (
            <div
              key={dayKey}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleExpanded(dayKey)}
                className="w-full px-4 py-3 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {hari}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('izinGuru.jadwalPengganti.jadwalMengajarCount', { count: details.length })}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp size={18} className="text-gray-600" />
                ) : (
                  <ChevronDown size={18} className="text-gray-600" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 py-4 bg-white border-t border-gray-200 space-y-3">
                  {details.map((detail) => {
                    const key = detail.jadwalKey;
                    const selectedGuruId = selections.get(key);
                    const availableGurus = availableGurusMap.get(key) || [];
                    const selectedGuru = availableGurus.find(g => g.id === selectedGuruId);

                    // Get mata pelajaran name and kelas name
                    let mataPelajaranName = t('izinGuru.jadwalPengganti.tahfizQuran');
                    let kelasName = t('izinGuru.jadwalPengganti.tidakDiketahui');
                    
                    if (detail.isTahfiz) {
                      // For tahfiz schedule
                      const tahfizJadwal = detail.jadwal as TahfizSchedule;
                      const kelasTahfizItem = kelasTahfiz.find(k => k.id === tahfizJadwal.kelasId);
                      kelasName = kelasTahfizItem?.namaKelas || t('izinGuru.jadwalPengganti.tidakDiketahui');
                    } else {
                      // For regular schedule
                      const regularJadwal = detail.jadwal as JadwalPelajaran;
                      mataPelajaranName = getMataPelajaranNameById(regularJadwal.mataPelajaranId, mataPelajaran);
                      kelasName = getKelasNameById(regularJadwal.kelasId, kelas);
                    }

                    return (
                      <div key={key} className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {mataPelajaranName}
                              </p>
                              {detail.isTahfiz && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                                  {t('izinGuru.jadwalPengganti.tahfiz')}
                                </span>
                              )}
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {kelasName}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {detail.jadwal.jamMulai} - {detail.jadwal.jamSelesai}
                            </p>
                          </div>
                        </div>

                        {availableGurus.length > 0 ? (
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {detail.isTahfiz ? t('izinGuru.jadwalPengganti.ustadzPengganti') : t('izinGuru.jadwalPengganti.guruPengganti')} *
                            </label>
                            <select
                              value={selectedGuruId || ''}
                              onChange={(e) =>
                                handleSelectionChange(key, e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">-- {t('izinGuru.jadwalPengganti.pilihGuruPengganti', { jenis: detail.isTahfiz ? t('izinGuru.jadwalPengganti.ustadz') : t('izinGuru.jadwalPengganti.guru') })} --</option>
                              {availableGurus.map(guru => (
                                <option key={guru.id} value={guru.id}>
                                  {guru.name}
                                </option>
                              ))}
                            </select>
                            {selectedGuru && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ {t('izinGuru.jadwalPengganti.terpilih')}: {selectedGuru.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-red-600 mt-2">
                            {t('izinGuru.jadwalPengganti.tidakAdaGuruPengganti', { jenis: detail.isTahfiz ? t('izinGuru.jadwalPengganti.ustadz') : t('izinGuru.jadwalPengganti.guru') })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JadwalPenggantiSelector;
