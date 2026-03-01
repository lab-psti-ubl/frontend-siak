import React, { useEffect, useState } from 'react';
import { Search, Eye, Video, User, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../../../../services/apiService';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import { showErrorToast, showSuccessToast } from '../../../ui/ToastContainer';
import FaceRegistrationModal, {
  FaceRegistrationTarget,
} from './face-recognition/FaceRegistrationModal';
import FaceDetectionCamera from '../../../guru/pages/absen-guru/FaceDetectionCamera';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { useFaceAbsenGuruHandlers } from '../../../guru/pages/absen-guru/useFaceAbsenGuruHandlers';
import { getTodayIndonesia } from '../../../../utils/absensiUtils';
import type { ScanResult } from '../../../ui/QRScanner';

export type FaceRecognitionStatus = 'completed' | 'not_completed';

export interface FaceRecognitionListItem {
  id: string;
  name: string;
  nip: string;
  status: FaceRecognitionStatus;
  registeredFacesCount: number;
}

const DataFaceRecognition: React.FC = () => {
  const [list, setList] = useState<FaceRecognitionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailGuru, setDetailGuru] = useState<FaceRecognitionListItem | null>(null);
  const [detailData, setDetailData] = useState<{
    registeredFacesCount: number;
  } | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [registrationTarget, setRegistrationTarget] = useState<FaceRegistrationTarget | null>(null);
  const [existingFaces, setExistingFaces] = useState<string[]>([]);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);

  const [attendanceTarget, setAttendanceTarget] = useState<FaceRecognitionListItem | null>(null);
  const [attendanceFaces, setAttendanceFaces] = useState<string[]>([]);
  const [faceAttendanceModalOpen, setFaceAttendanceModalOpen] = useState(false);
  const [isLoadingAttendanceFaces, setIsLoadingAttendanceFaces] = useState(false);
  const [faceAttendanceResult, setFaceAttendanceResult] = useState<ScanResult | null>(null);

  const today = getTodayIndonesia();
  const { activeTahunAjaran } = useTahunAjaran();
  const activeTahunAjaranId = activeTahunAjaran?.id || '';
  const semester = activeTahunAjaran?.semester || 1;
  const { activePengaturanAbsen } = usePengaturanAbsen();

  const { handleFaceAttendance } = useFaceAbsenGuruHandlers({
    user: attendanceTarget
      ? ({
          id: attendanceTarget.id,
          name: attendanceTarget.name,
          email: '',
          role: 'guru',
          createdAt: new Date().toISOString(),
        } as any)
      : null,
    // Di halaman admin ini kita tidak menampilkan daftar absensi guru secara langsung,
    // jadi refreshAbsensiGuru bisa berupa fungsi kosong.
    refreshAbsensiGuru: async () => {},
    activePengaturan: activePengaturanAbsen || undefined,
    today,
    activeTahunAjaranId,
    semester,
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await apiService.getFaceRecognitionList();
      if (res.success && res.list) {
        setList(res.list);
      } else {
        showErrorToast('Error', res.message || 'Gagal memuat data face recognition');
      }
    } catch (e: unknown) {
      showErrorToast('Error', (e as Error)?.message || 'Gagal memuat data face recognition');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filteredList = list.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nip && item.nip.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLihatDetail = async (item: FaceRecognitionListItem) => {
    try {
      const res = await apiService.getFaceRecognitionByGuruId(item.id);
      if (res.success) {
        setDetailGuru(item);
        setDetailData({
          registeredFacesCount: res.registeredFacesCount ?? (res.faceDescriptors?.length || 0),
        });
        setDetailModalOpen(true);
      } else {
        showErrorToast('Error', res.message || 'Gagal mengambil detail face recognition');
      }
    } catch (e: unknown) {
      showErrorToast('Error', (e as Error)?.message || 'Gagal mengambil detail face recognition');
    }
  };

  const handleRekamWajah = async (item: FaceRecognitionListItem) => {
    try {
      const res = await apiService.getFaceRecognitionByGuruId(item.id);
      const faces = res.success && res.faceDescriptors ? res.faceDescriptors : [];
      setRegistrationTarget({
        id: item.id,
        name: item.name,
        nip: item.nip,
      });
      setExistingFaces(faces);
      setRegistrationModalOpen(true);
    } catch (e: unknown) {
      showErrorToast('Error', (e as Error)?.message || 'Gagal memuat data wajah guru');
    }
  };

  const handleAbsenGuruDenganWajah = async (item: FaceRecognitionListItem) => {
    try {
      setIsLoadingAttendanceFaces(true);
      const res = await apiService.getFaceRecognitionByGuruId(item.id);
      const faces = res.success && res.faceDescriptors ? res.faceDescriptors : [];

      if (!faces.length) {
        showErrorToast(
          'Error',
          'Guru ini belum memiliki data wajah terdaftar. Silakan rekam wajah terlebih dahulu.'
        );
        return;
      }

      setAttendanceTarget(item);
      setAttendanceFaces(faces);
      setFaceAttendanceResult(null);
      setFaceAttendanceModalOpen(true);
    } catch (e: unknown) {
      showErrorToast(
        'Error',
        (e as Error)?.message || 'Gagal memuat data wajah guru untuk absensi'
      );
    } finally {
      setIsLoadingAttendanceFaces(false);
    }
  };

  const handleSaveFaces = async (descriptors: string[]) => {
    if (!registrationTarget) return;
    try {
      const res = await apiService.saveGuruFaceDescriptors(registrationTarget.id, descriptors);
      if (res.success) {
        const message =
          descriptors.length === 0
            ? `Data wajah untuk ${registrationTarget.name} berhasil dihapus`
            : `Data wajah untuk ${registrationTarget.name} berhasil disimpan (${descriptors.length} wajah)`;
        showSuccessToast('Berhasil', message);
        setRegistrationModalOpen(false);
        setRegistrationTarget(null);
        setExistingFaces([]);
        fetchList();
      } else {
        showErrorToast('Error', res.message || 'Gagal menyimpan data wajah');
      }
    } catch (e: unknown) {
      showErrorToast('Error', (e as Error)?.message || 'Gagal menyimpan data wajah');
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-700 to-indigo-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Data Face Recognition
              </h1>
              <p className="text-sm sm:text-base text-indigo-100">
                Registrasi wajah guru untuk absensi face recognition. Data yang disimpan berupa
                descriptor wajah (bukan foto asli).
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Cari nama atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <p className="text-sm text-slate-600">
            Menampilkan <span className="font-semibold">{filteredList.length}</span> dari{' '}
            <span className="font-semibold">{list.length}</span> guru
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Nama Guru</TableCell>
                <TableCell header>NIP</TableCell>
                <TableCell header>Status Face Recognition</TableCell>
                <TableCell header>Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{item.nip}</TableCell>
                  <TableCell>
                    {item.status === 'completed' ? (
                      <Badge variant="success">
                        Completed (
                        {item.registeredFacesCount}
                        )
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not Completed</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLihatDetail(item)}
                        className="flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Lihat Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleRekamWajah(item)}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Video size={14} />
                        Rekam Wajah
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleAbsenGuruDenganWajah(item)}
                        className="flex items-center gap-1"
                        disabled={isLoadingAttendanceFaces}
                      >
                        <CheckCircle size={14} />
                        Absen Guru
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && filteredList.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            {list.length === 0
              ? 'Belum ada data guru.'
              : 'Tidak ada guru yang cocok dengan pencarian.'}
          </div>
        )}
      </Card>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailGuru(null);
          setDetailData(null);
        }}
        title="Detail Face Recognition"
        size="md"
      >
        <div className="space-y-3">
          {detailGuru ? (
            <>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nama Guru</p>
                <p className="font-medium text-slate-900">{detailGuru.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">NIP</p>
                <p className="text-slate-700">{detailGuru.nip || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Status Face Recognition
                </p>
                <p className="font-medium">
                  {detailGuru.status === 'completed' ? (
                    <span className="text-emerald-600">Completed</span>
                  ) : (
                    <span className="text-amber-600">Not Completed</span>
                  )}
                </p>
              </div>
              {detailData && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Jumlah Wajah Terdaftar
                  </p>
                  <p className="text-slate-700">{detailData.registeredFacesCount}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-sm">Data tidak ditemukan.</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={faceAttendanceModalOpen}
        onClose={() => {
          setFaceAttendanceModalOpen(false);
          setAttendanceTarget(null);
          setAttendanceFaces([]);
          setFaceAttendanceResult(null);
        }}
        title={
          attendanceTarget
            ? `Absen Guru - ${attendanceTarget.name}`
            : 'Absen Guru dengan Wajah'
        }
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Posisikan wajah guru di depan kamera. Sistem akan mencocokkan dengan data wajah yang
            sudah tersimpan dan otomatis membuat absensi masuk/pulang sesuai status hari ini.
          </p>

          {faceAttendanceResult && (
            <div
              className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
                faceAttendanceResult.isError
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {faceAttendanceResult.isError ? (
                <XCircle className="w-4 h-4 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 mt-0.5" />
              )}
              <span>{faceAttendanceResult.statusMessage}</span>
            </div>
          )}

          <FaceDetectionCamera
            registeredFaces={attendanceFaces}
            onFaceMatch={async () => {
              const result = await handleFaceAttendance();
              if (result) {
                setFaceAttendanceResult(result);
                if (!result.isError && result.status !== 'sudah_terpenuhi') {
                  setTimeout(() => {
                    setFaceAttendanceModalOpen(false);
                    setAttendanceTarget(null);
                    setAttendanceFaces([]);
                    setFaceAttendanceResult(null);
                  }, 1500);
                }
              }
            }}
            onError={(msg) => {
              setFaceAttendanceResult({
                isError: true,
                statusMessage: msg,
                errorType: 'absen_failed',
              } as ScanResult);
            }}
            isActive={faceAttendanceModalOpen}
          />
        </div>
      </Modal>

      {registrationModalOpen && registrationTarget && (
        <FaceRegistrationModal
          guru={registrationTarget}
          existingFaces={existingFaces}
          onSave={handleSaveFaces}
          onClose={() => {
            setRegistrationModalOpen(false);
            setRegistrationTarget(null);
            setExistingFaces([]);
          }}
        />
      )}
    </div>
  );
};

export default DataFaceRecognition;

