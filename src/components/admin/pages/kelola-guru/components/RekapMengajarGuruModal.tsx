import React, { useState, useMemo } from 'react';
import { Download, Printer, Calendar, BookOpen, GraduationCap, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import {
  User as UserType,
  JadwalPelajaran,
  SesiAbsensi,
  TahunAjaran,
  Kelas,
  MataPelajaran
} from '../../../../../types';
import { generateRekapMengajarGuru, exportRekapMengajarToExcel, printRekapMengajar } from '../utils/rekapMengajarGuruUtils';

interface RekapMengajarGuruModalProps {
  guru: UserType;
  jadwalPelajaran: JadwalPelajaran[];
  sesiAbsensi: SesiAbsensi[];
  tahunAjaran: TahunAjaran[];
  kelas: Kelas[];
  mataPelajaran: MataPelajaran[];
}

interface MeetingCalendarViewProps {
  subjects: any[];
  maxPertemuan: number;
}

const MeetingCalendarView: React.FC<MeetingCalendarViewProps> = ({ subjects, maxPertemuan }) => {
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const itemsPerScreen = 4;
  const totalPages = Math.ceil(maxPertemuan / itemsPerScreen);
  const currentPage = Math.floor(currentStartIndex / itemsPerScreen);

  const visibleMeetings = Array.from({ length: Math.min(itemsPerScreen, maxPertemuan - currentStartIndex) }, (_, i) => currentStartIndex + i + 1);

  const handlePrevious = () => {
    setCurrentStartIndex(Math.max(0, currentStartIndex - itemsPerScreen));
  };

  const handleNext = () => {
    if (currentStartIndex + itemsPerScreen < maxPertemuan) {
      setCurrentStartIndex(currentStartIndex + itemsPerScreen);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'mengajar') return 'bg-green-100 border-l-4 border-green-500';
    if (status === 'guru_memberi_absen') return 'bg-yellow-100 border-l-4 border-yellow-500';
    return 'bg-red-100 border-l-4 border-red-500';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'mengajar') return { label: 'M', color: 'bg-green-600' };
    if (status === 'guru_memberi_absen') return { label: 'A', color: 'bg-yellow-600' };
    return { label: 'T', color: 'bg-red-600' };
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={handlePrevious}
          disabled={currentStartIndex === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-gray-600">
          Halaman {currentPage + 1} dari {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentStartIndex + itemsPerScreen >= maxPertemuan}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {visibleMeetings.map((meetingNum) => (
          <div key={meetingNum} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">Pertemuan {meetingNum}</h4>
              <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                #{meetingNum}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {subjects.map((subject, idx) => {
                const meeting = subject.meetings[meetingNum];
                if (!meeting) return null;

                const statusBadge = getStatusBadge(meeting.status);

                return (
                  <div key={`${idx}-${meetingNum}`} className={`p-2 rounded text-xs sm:text-sm ${getStatusColor(meeting.status)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{subject.namaMapel}</p>
                        <p className="text-gray-700 text-xs">Kelas: {subject.kelas}</p>
                        <p className="text-gray-600 text-xs">{meeting.tanggal}</p>
                      </div>
                      <div className={`${statusBadge.color} text-white font-bold px-2 py-1 rounded flex-shrink-0`}>
                        {statusBadge.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RekapMengajarGuruModal: React.FC<RekapMengajarGuruModalProps> = ({
  guru,
  jadwalPelajaran,
  sesiAbsensi,
  tahunAjaran,
  kelas,
  mataPelajaran,
}) => {
  const { t } = useLanguage();
  const availableTahunAjaran = (tahunAjaran || []).filter(ta => {
    return jadwalPelajaran.some(j =>
      j.guruId === guru.id &&
      j.tahunAjaran === ta.tahun &&
      j.semester === ta.semester
    );
  }).sort((a, b) => {
    if (a.tahun === b.tahun) {
      return b.semester - a.semester;
    }
    return b.tahun.localeCompare(a.tahun);
  });

  const activeTahunAjaran = availableTahunAjaran.find(ta => ta.isActive) || availableTahunAjaran[0];

  const [selectedTahun, setSelectedTahun] = useState(activeTahunAjaran?.tahun || '');
  const [selectedSemester, setSelectedSemester] = useState(activeTahunAjaran?.semester || 1);

  const availableTahuns = useMemo(() => {
    const uniqueTahuns = [...new Set((availableTahunAjaran || []).map(ta => ta.tahun))];
    return uniqueTahuns.sort((a, b) => b.localeCompare(a));
  }, [availableTahunAjaran]);

  const availableSemesters = useMemo(() => {
    return (availableTahunAjaran || [])
      .filter(ta => ta.tahun === selectedTahun)
      .map(ta => ta.semester)
      .sort((a, b) => b - a);
  }, [selectedTahun, availableTahunAjaran]);

  React.useEffect(() => {
    if (selectedTahun && availableSemesters.length > 0) {
      if (!availableSemesters.includes(selectedSemester)) {
        setSelectedSemester(availableSemesters[0]);
      }
    }
  }, [selectedTahun, availableSemesters, selectedSemester]);

  const rekapData = useMemo(() => {
    if (!selectedTahun || !selectedSemester) return null;

    return generateRekapMengajarGuru(
      guru.id,
      selectedTahun,
      selectedSemester,
      jadwalPelajaran,
      sesiAbsensi,
      tahunAjaran,
      kelas,
      mataPelajaran
    );
  }, [guru.id, selectedTahun, selectedSemester, jadwalPelajaran, sesiAbsensi, tahunAjaran, kelas, mataPelajaran]);

  const handleExportExcel = async () => {
    if (!rekapData) return;

    await exportRekapMengajarToExcel(
      rekapData,
      guru.name,
      selectedTahun,
      selectedSemester.toString()
    );
  };

  const handlePrint = () => {
    if (!rekapData) return;

    printRekapMengajar(
      rekapData,
      guru.name,
      selectedTahun,
      selectedSemester.toString()
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
              <div className="flex-shrink-0 h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg sm:text-xl">
                {getInitials(guru.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('detailAbsensiModal.rekapMengajarGuru')}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {guru.name}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button
                onClick={handlePrint}
                variant="secondary"
                className="flex items-center justify-center text-xs sm:text-sm px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-300 w-full sm:w-auto"
                disabled={!rekapData}
              >
                <Printer size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('detailAbsensiModal.cetak')}</span>
                <span className="sm:hidden">{t('detailAbsensiModal.cetak')}</span>
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="primary"
                className="flex items-center justify-center text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto"
                disabled={!rekapData}
              >
                <Download size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('detailAbsensiModal.exportExcel')}</span>
                <span className="sm:hidden">{t('detailAbsensiModal.exportExcel')}</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-blue-200">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <User size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600">{t('absenGuru.guruLabel')}:</span>
                  <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                    {guru.name}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <GraduationCap size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600">{t('detailAbsensiModal.nip')}:</span>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">
                    {guru.nip || '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Calendar size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm text-gray-600 block">{t('detailAbsensiModal.tahunAjaran')}:</span>
                  <select
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(e.target.value)}
                    className="mt-1 w-full px-2 sm:px-3 py-1.5 border border-blue-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableTahuns.map(tahun => (
                      <option key={tahun} value={tahun}>
                        {tahun}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm text-gray-600 block">{t('detailAbsensiModal.semester')}:</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    className="mt-1 w-full px-2 sm:px-3 py-1.5 border border-blue-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableSemesters.map(sem => (
                      <option key={sem} value={sem}>
                        {t('detailAbsensiModal.semester')} {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <BookOpen size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600 block">{t('detailAbsensiModal.totalMataPelajaran')}:</span>
                  <p className="font-semibold text-sm sm:text-base text-gray-900 mt-1">
                    {rekapData?.subjects.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {rekapData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {rekapData.subjects.reduce((sum, subject) => {
                    return sum + Object.keys(subject.meetings).length;
                  }, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('detailAbsensiModal.totalPertemuan')}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {rekapData.meetings.reduce((sum, m) => sum + m.mengajar, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('detailAbsensiModal.guruMengajar')}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {rekapData.meetings.reduce((sum, m) => sum + m.memberiAbsen, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('detailAbsensiModal.guruMemberiAbsen')}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-r from-red-50 to-red-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {rekapData.meetings.reduce((sum, m) => sum + m.tidakMengajar, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('detailAbsensiModal.tidakMengajar')}</p>
              </div>
            </Card>
          </div>

          <div className="block md:hidden">
            <Card>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t('detailAbsensiModal.dataPertemuanMobile')}</h3>
                <MeetingCalendarView
                  subjects={rekapData.subjects}
                  maxPertemuan={rekapData.maxPertemuan}
                />
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('detailAbsensiModal.keteranganStatus')}:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-green-50 rounded flex items-center justify-center">
                      <span className="font-semibold text-green-700 text-xs">M</span>
                    </div>
                    <span className="text-gray-700">{t('detailAbsensiModal.guruMengajar')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-yellow-50 rounded flex items-center justify-center">
                      <span className="font-semibold text-yellow-700 text-xs">A</span>
                    </div>
                    <span className="text-gray-700">{t('detailAbsensiModal.guruMemberiAbsen')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-red-50 rounded flex items-center justify-center">
                      <span className="font-semibold text-red-700 text-xs">T</span>
                    </div>
                    <span className="text-gray-700">{t('detailAbsensiModal.tidakMengajar')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-gray-50 rounded flex items-center justify-center border border-gray-200">
                      <span className="font-semibold text-gray-400 text-xs">-</span>
                    </div>
                    <span className="text-gray-700">{t('detailAbsensiModal.tidakAdaJadwal')}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell header className="sticky left-0 z-10 bg-white border-r text-xs sm:text-sm">No</TableCell>
                        <TableCell header className="sticky left-12 z-10 bg-white border-r text-xs sm:text-sm">Kode </TableCell>
                        <TableCell header className="sticky min-w-52 left-32 z-10 bg-white border-r text-xs sm:text-sm">Nama Mapel</TableCell>
                        <TableCell header className="sticky min-w-32 left-32 z-10 bg-white border-r text-xs sm:text-sm">Kelas</TableCell>
                        {Array.from({ length: rekapData.maxPertemuan }, (_, i) => (
                          <TableCell key={i + 1} header className="text-center min-w-10 text-xs sm:text-sm">
                            {i + 1}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rekapData.subjects.map((subject, idx) => (
                        <TableRow key={subject.jadwalId} className="hover:bg-gray-50">
                          <TableCell className="sticky left-0 z-10 bg-white border-r text-xs sm:text-sm">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="sticky left-12 z-10 bg-white border-r font-medium text-blue-600 text-xs sm:text-sm">
                            {subject.kodeMapel}
                          </TableCell>
                          <TableCell className="sticky left-32 z-10 bg-white border-r font-medium text-xs sm:text-sm">
                            {subject.namaMapel}
                          </TableCell>
                          <TableCell className="font-medium border-r text-xs sm:text-sm">{subject.kelas}</TableCell>
                          {Array.from({ length: rekapData.maxPertemuan }, (_, i) => {
                            const meeting = subject.meetings[i + 1];
                            if (!meeting) {
                              return (
                                <TableCell key={i + 1} className="text-center text-gray-300 text-xs sm:text-sm">
                                  -
                                </TableCell>
                              );
                            }

                            let bgColor = 'bg-red-50';
                            let textColor = 'text-red-700';
                            let status = 'T';

                            if (meeting.status === 'mengajar') {
                              bgColor = 'bg-green-50';
                              textColor = 'text-green-700';
                              status = 'M';
                            } else if (meeting.status === 'guru_memberi_absen') {
                              bgColor = 'bg-yellow-50';
                              textColor = 'text-yellow-700';
                              status = 'A';
                            }

                            return (
                              <TableCell
                                key={i + 1}
                                className={`text-center font-semibold text-xs sm:text-sm ${bgColor} ${textColor}`}
                                title={`Tanggal: ${meeting.tanggal}\nStatus: ${
                                  meeting.status === 'mengajar' ? 'Guru Mengajar' :
                                  meeting.status === 'guru_memberi_absen' ? 'Guru Memberi Absen' :
                                  'Tidak Mengajar'
                                }`}
                              >
                                {status}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('detailAbsensiModal.keteranganStatus')}:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                      <span className="font-semibold text-green-700">M</span>
                    </div>
                    <span className="text-gray-700">{t('detailAbsensiModal.guruMengajar')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-yellow-50 rounded flex items-center justify-center">
                      <span className="font-semibold text-yellow-700">A</span>
                    </div>
                    <span className="text-gray-700">{t('detailAbsensiModal.guruMemberiAbsen')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
                      <span className="font-semibold text-red-700">T</span>
                    </div>
                    <span className="text-gray-700">{t('detailAbsensiModal.tidakMengajar')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center border border-gray-200">
                      <span className="font-semibold text-gray-400">-</span>
                    </div>
                    <span className="text-gray-700">{t('detailAbsensiModal.tidakAdaJadwal')}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {!rekapData && (
        <Card className="p-8 sm:p-12">
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-base sm:text-lg font-medium">{t('detailAbsensiModal.tidakAdaDataRekapMengajar')}</p>
            <p className="text-xs sm:text-sm mt-2 text-gray-600">{t('detailAbsensiModal.pilihTahunSemesterRekap')}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RekapMengajarGuruModal;
