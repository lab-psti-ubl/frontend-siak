import React from 'react';
import { Calculator, TrendingUp, BookOpen, FileText, UserCheck } from 'lucide-react';
import Card from '../../../../ui/Card';
import { User } from '../../../../../types';
import { getGradeColor, KOMPONEN_NILAI, getSemuaKomponenNilai, getNilaiMinimalSettings } from '../../../../../utils/nilaiUtils';
import { isMaxTingkat, formatTingkatKelas } from '../../../../../utils/jenjangPendidikanUtils';

interface MuridRaportSectionProps {
  murid: User;
  detailTahunAjaran: string;
  detailSemester: number;
  generateMuridRaportData: (muridId: string, tahunAjaranValue: string, semester: number) => any;
}

const MuridRaportSection: React.FC<MuridRaportSectionProps> = ({
  murid,
  detailTahunAjaran,
  detailSemester,
  generateMuridRaportData
}) => {
  const raportData = generateMuridRaportData(murid.id, detailTahunAjaran, detailSemester);

  if (!raportData) {
    return (
      <Card className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Data Raport Tidak Tersedia</h3>
        <p className="text-gray-600">
          Tidak ada data raport untuk {murid.name} pada {detailTahunAjaran} semester {detailSemester}.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Kemungkinan murid belum memiliki nilai atau belum ada jadwal pelajaran untuk periode tersebut.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ringkasan Prestasi */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Ringkasan Prestasi</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{raportData.overallGrade.toFixed(1)}</div>
            <div className="text-sm text-blue-700">Rata-rata Nilai</div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg text-center">
            <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-600">{raportData.attendanceRate.toFixed(1)}%</div>
            <div className="text-sm text-emerald-700">Tingkat Kehadiran</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{raportData.subjects.length}</div>
            <div className="text-sm text-purple-700">Mata Pelajaran</div>
          </div>
        </div>
        
        {/* Status Kenaikan Kelas - hanya untuk semester genap */}
        {raportData.showKenaikanKelas && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            raportData.isNaikKelas 
              ? 'bg-emerald-50 border-emerald-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <h5 className={`font-bold text-center mb-2 ${
              raportData.isNaikKelas ? 'text-emerald-900' : 'text-red-900'
            }`}>
              {isMaxTingkat(raportData.kelas.tingkat) ? 'STATUS KELULUSAN' : 'STATUS KENAIKAN KELAS'}
            </h5>
            <div className={`text-center p-3 rounded-lg ${
              raportData.isNaikKelas 
                ? 'bg-emerald-100 border border-emerald-300' 
                : 'bg-red-100 border border-red-300'
            }`}>
              <p className={`text-lg font-bold ${
                raportData.isNaikKelas ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {(() => {
                  if (isMaxTingkat(raportData.kelas.tingkat)) {
                    return raportData.isNaikKelas ? 'LULUS' : 'TIDAK LULUS';
                  } else if (raportData.isNaikKelas) {
                    const nextTingkat = raportData.kelas.tingkat + 1;
                    return `NAIK KE KELAS ${formatTingkatKelas(nextTingkat)}`;
                  } else {
                    return 'TIDAK NAIK KELAS';
                  }
                })()}
              </p>
              <p className={`text-xs ${
                raportData.isNaikKelas ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {raportData.isNaikKelas 
                  ? 'Memenuhi syarat dengan nilai rata-rata ≥ 70 dan kehadiran ≥ 75%'
                  : 'Belum memenuhi syarat (nilai rata-rata < 70 atau kehadiran < 75%)'
                }
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Tabel Raport */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-900">
            Raport - {detailTahunAjaran} Semester {detailSemester}
          </h4>
         
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto -mx-4 px-4">
          {(() => {
            // Ambil semua komponen dari database untuk mendapatkan persentase
            const semuaKomponenDB = getSemuaKomponenNilai();
            
            // Ambil komponen dinamis yang ada di data raport
            const semuaKomponen = new Set<string>();
            raportData.subjects.forEach((subject: any) => {
              if (subject.komponenDinamis) {
                subject.komponenDinamis.forEach((kd: any) => {
                  semuaKomponen.add(kd.komponenNama);
                });
              }
            });
            const komponenList = Array.from(semuaKomponen);

            // Buat map untuk mendapatkan persentase dari database
            const komponenMap = new Map<string, number>();
            semuaKomponenDB.forEach(k => {
              komponenMap.set(k.nama, k.persentase);
            });

            return (
              <table className="w-full border-collapse border border-gray-300 min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left text-sm font-medium whitespace-nowrap">No</th>
                    <th className="border border-gray-300 p-3 text-left text-sm font-medium whitespace-nowrap">Mata Pelajaran</th>
                    <th className="border border-gray-300 p-3 text-center text-sm font-medium whitespace-nowrap">Guru</th>
                    <th className="border border-gray-300 p-3 text-center text-sm font-medium whitespace-nowrap">
                      Kehadiran<br/>({KOMPONEN_NILAI.kehadiran}%)
                    </th>
                    <th className="border border-gray-300 p-3 text-center text-sm font-medium whitespace-nowrap">
                      Tugas<br/>({KOMPONEN_NILAI.tugas}%)
                    </th>
                    <th className="border border-gray-300 p-3 text-center text-sm font-medium whitespace-nowrap">
                      UTS<br/>({KOMPONEN_NILAI.uts}%)
                    </th>
                    <th className="border border-gray-300 p-3 text-center text-sm font-medium whitespace-nowrap">
                      UAS<br/>({KOMPONEN_NILAI.uas}%)
                    </th>
                    {komponenList.map((komponen) => {
                      const persentase = komponenMap.get(komponen) || 0;
                      return (
                        <th key={komponen} className="border border-gray-300 p-3 text-center text-sm font-medium whitespace-nowrap">
                          {komponen}<br/>({persentase}%)
                        </th>
                      );
                    })}
                    <th className="border border-gray-300 p-3 text-center text-sm font-medium whitespace-nowrap">Nilai Akhir</th>
                    <th className="border border-gray-300 p-3 text-center text-sm font-medium whitespace-nowrap">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {raportData.subjects.map((subject: any, index: number) => (
                    <tr key={subject.mapelId} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 text-center">{index + 1}</td>
                      <td className="border border-gray-300 p-3 text-left">
                        <div className="flex items-center">
                          <BookOpen size={14} className="mr-2 text-blue-600 flex-shrink-0" />
                          <span className="whitespace-nowrap">{subject.mapelName}</span>
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center text-sm whitespace-nowrap">{subject.guruName}</td>
                      <td className="border border-gray-300 p-3 text-center">
                        <div className="text-sm font-medium">{subject.kehadiran.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">
                          {((subject.kehadiran / 100) * KOMPONEN_NILAI.kehadiran).toFixed(1)} poin
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        <div className="text-sm font-medium">{subject.rataTugas.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">{subject.jumlahTugas} tugas</div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center text-sm">
                        {subject.uts !== null ? subject.uts : '-'}
                      </td>
                      <td className="border border-gray-300 p-3 text-center text-sm">
                        {subject.uas !== null ? subject.uas : '-'}
                      </td>
                      {komponenList.map((komponen) => {
                        const nilaiKomponen = subject.komponenDinamis?.find((kd: any) => kd.komponenNama === komponen)?.rataValues;
                        return (
                          <td key={`${subject.mapelId}-${komponen}`} className="border border-gray-300 p-3 text-center text-sm">
                            {nilaiKomponen !== undefined ? nilaiKomponen.toFixed(1) : '-'}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 p-3 text-center text-sm font-bold">
                        {subject.nilaiAkhir !== null ? subject.nilaiAkhir.toFixed(1) : '-'}
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        {subject.grade ? (
                          <div className={`inline-flex px-2 py-1 rounded text-xs font-bold ${getGradeColor(subject.grade)}`}>
                            {subject.grade}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {(() => {
            // Ambil semua komponen dari database untuk mendapatkan persentase
            const semuaKomponenDB = getSemuaKomponenNilai();
            
            // Ambil komponen dinamis yang ada di data raport
            const semuaKomponen = new Set<string>();
            raportData.subjects.forEach((subject: any) => {
              if (subject.komponenDinamis) {
                subject.komponenDinamis.forEach((kd: any) => {
                  semuaKomponen.add(kd.komponenNama);
                });
              }
            });
            const komponenList = Array.from(semuaKomponen);

            // Buat map untuk mendapatkan persentase dari database
            const komponenMap = new Map<string, number>();
            semuaKomponenDB.forEach(k => {
              komponenMap.set(k.nama, k.persentase);
            });

            return raportData.subjects.map((subject: any, index: number) => (
              <div key={subject.mapelId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-gray-900 text-sm truncate">{subject.mapelName}</h5>
                      <p className="text-xs text-gray-500 mt-0.5">{subject.guruName}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {subject.grade ? (
                      <div className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(subject.grade)}`}>
                        {subject.grade}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </div>

                {/* Nilai Utama */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600 mb-1">Kehadiran</p>
                    <p className="text-sm font-bold text-blue-700">{subject.kehadiran.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">({KOMPONEN_NILAI.kehadiran}%)</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600 mb-1">Tugas</p>
                    <p className="text-sm font-bold text-green-700">{subject.rataTugas.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{subject.jumlahTugas} tugas</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600 mb-1">UTS</p>
                    <p className="text-sm font-bold text-purple-700">
                      {subject.uts !== null ? subject.uts : '-'}
                    </p>
                    <p className="text-xs text-gray-500">({KOMPONEN_NILAI.uts}%)</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600 mb-1">UAS</p>
                    <p className="text-sm font-bold text-orange-700">
                      {subject.uas !== null ? subject.uas : '-'}
                    </p>
                    <p className="text-xs text-gray-500">({KOMPONEN_NILAI.uas}%)</p>
                  </div>
                </div>

                {/* Komponen Dinamis */}
                {komponenList.length > 0 && (
                  <div className="mb-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">Komponen Lainnya:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {komponenList.map((komponen) => {
                        const nilaiKomponen = subject.komponenDinamis?.find((kd: any) => kd.komponenNama === komponen)?.rataValues;
                        const persentase = komponenMap.get(komponen) || 0;
                        return (
                          <div key={`${subject.mapelId}-${komponen}`} className="bg-gray-50 rounded p-2">
                            <p className="text-xs text-gray-600 mb-0.5 truncate">{komponen}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {nilaiKomponen !== undefined ? nilaiKomponen.toFixed(1) : '-'}
                            </p>
                            <p className="text-xs text-gray-500">({persentase}%)</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Nilai Akhir */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Nilai Akhir:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {subject.nilaiAkhir !== null ? subject.nilaiAkhir.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>

        {raportData.subjects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Tidak ada mata pelajaran untuk periode ini</p>
          </div>
        )}
      </Card>

      {/* Catatan Wali Kelas */}
      {raportData.waliKelas && (
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Catatan Wali Kelas
          </h4>
          <p className="text-yellow-800 italic leading-relaxed">
            {(() => {
              const studentName = raportData.student.name;
              const overallGrade = raportData.overallGrade;
              const attendanceRate = raportData.attendanceRate;
              
              let academicNote = '';
              if (overallGrade >= 80) {
                academicNote = `${studentName} menunjukkan prestasi akademik yang sangat baik dengan rata-rata nilai ${overallGrade.toFixed(1)}.`;
              } else if (overallGrade >= 70) {
                academicNote = `${studentName} menunjukkan prestasi akademik yang baik dengan rata-rata nilai ${overallGrade.toFixed(1)}.`;
              } else if (overallGrade >= 60) {
                academicNote = `${studentName} menunjukkan prestasi akademik yang cukup dengan rata-rata nilai ${overallGrade.toFixed(1)}.`;
              } else {
                academicNote = `${studentName} perlu meningkatkan prestasi akademik dengan rata-rata nilai ${overallGrade.toFixed(1)}.`;
              }

              let attendanceNote = '';
              if (attendanceRate >= 90) {
                attendanceNote = ' Tingkat kehadiran sangat baik dan konsisten.';
              } else if (attendanceRate >= 80) {
                attendanceNote = ' Tingkat kehadiran baik, namun masih bisa ditingkatkan.';
              } else if (attendanceRate >= 70) {
                attendanceNote = ' Tingkat kehadiran cukup, perlu lebih konsisten dalam menghadiri pelajaran.';
              } else {
                attendanceNote = ' Perlu meningkatkan kehadiran untuk mendukung prestasi akademik.';
              }

              return academicNote + attendanceNote + ' Terus semangat belajar dan pertahankan prestasi yang baik!';
            })()}
          </p>
          <div className="mt-3 text-sm text-yellow-700">
            <strong>Wali Kelas:</strong> {raportData.waliKelas.name}
            {raportData.waliKelas.nip && (
              <span className="text-yellow-600"> (NIP: {raportData.waliKelas.nip})</span>
            )}
          </div>
        </Card>
      )}

      {/* Analisis Prestasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Mata Pelajaran Terbaik</h4>
          {(() => {
            // Ambil nilai minimal dari database
            const minimalSettings = getNilaiMinimalSettings();
            const nilaiAkhirMinimal = minimalSettings.nilaiAkhirMinimal;
            
            // Filter mata pelajaran dengan nilai akhir > nilai minimal, diurutkan dari tertinggi
            const topSubjects = raportData.subjects
              .filter((s: any) => s.nilaiAkhir !== null && s.nilaiAkhir > nilaiAkhirMinimal)
              .sort((a: any, b: any) => (b.nilaiAkhir || 0) - (a.nilaiAkhir || 0))
              .slice(0, 3);
            
            return topSubjects.length > 0 ? (
              <div className="space-y-2">
                {topSubjects.map((subject: any, index: number) => (
                  <div key={subject.mapelId} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-emerald-900">{subject.mapelName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-emerald-700">{subject.nilaiAkhir?.toFixed(1)}</span>
                      {subject.grade && (
                        <div className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Belum ada mata pelajaran dengan nilai di atas {nilaiAkhirMinimal} (nilai minimal)
              </p>
            );
          })()}
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Perlu Perbaikan</h4>
          {(() => {
            // Ambil nilai minimal dari database
            const minimalSettings = getNilaiMinimalSettings();
            const nilaiAkhirMinimal = minimalSettings.nilaiAkhirMinimal;
            
            // Filter mata pelajaran dengan nilai akhir < nilai minimal, diurutkan dari terendah
            const lowSubjects = raportData.subjects
              .filter((s: any) => s.nilaiAkhir !== null && s.nilaiAkhir < nilaiAkhirMinimal)
              .sort((a: any, b: any) => (a.nilaiAkhir || 0) - (b.nilaiAkhir || 0))
              .slice(0, 3);
            
            return lowSubjects.length > 0 ? (
              <div className="space-y-2">
                {lowSubjects.map((subject: any, index: number) => (
                  <div key={subject.mapelId} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-red-900">{subject.mapelName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-red-700">{subject.nilaiAkhir?.toFixed(1)}</span>
                      {subject.grade && (
                        <div className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <UserCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-emerald-800 font-medium">Semua nilai sudah baik!</p>
                <p className="text-emerald-600 text-sm">
                  Semua mata pelajaran sudah mencapai nilai minimal ({nilaiAkhirMinimal})
                </p>
              </div>
            );
          })()}
        </Card>
      </div>
    </div>
  );
};

export default MuridRaportSection;