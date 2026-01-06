import React from 'react';
import { Calendar } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { User, Kelas } from '../../../../../../types';

interface DetailedAttendanceRecord {
  tanggal: string;
  mataPelajaran: string;
  guru: string;
  jam: string;
  status: string;
  waktu: string;
  keterangan: string;
}

interface MuridKelasDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  targetKelas: Kelas | null;
  selectedTahunAjaran: string;
  selectedSemester: number;
  detailDate: string;
  onDateChange: (date: string) => void;
  onTodayClick: () => void;
  getDetailedAttendance: (muridId: string) => DetailedAttendanceRecord[];
}

const MuridKelasDetailModal: React.FC<MuridKelasDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  targetKelas,
  selectedTahunAjaran,
  selectedSemester,
  detailDate,
  onDateChange,
  onTodayClick,
  getDetailedAttendance
}) => {
  if (!selectedMurid) return null;

  const filteredRecords = getDetailedAttendance(selectedMurid.id).filter(
    record => record.tanggal === detailDate
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Kehadiran - ${selectedMurid?.name}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">NISN</p>
            <p className="font-medium">{selectedMurid.nisn}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Kelas</p>
            <p className="font-medium">{targetKelas?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tahun Ajaran</p>
            <p className="font-medium">{selectedTahunAjaran}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Semester</p>
            <p className="font-medium">Semester {selectedSemester} ({selectedSemester === 1 ? 'Ganjil' : 'Genap'})</p>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium text-indigo-900 mb-3">Filter Tanggal Detail</h4>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-indigo-700">Tanggal:</label>
              <input
                type="date"
                value={detailDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={onTodayClick}
            >
              Hari Ini
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <h4 className="font-semibold text-gray-900 mb-3">
            Riwayat Absensi - {new Date(detailDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h4>
          <div className="mb-3 text-sm text-gray-600">
            Kelas: {targetKelas?.name} (Tingkat {targetKelas?.tingkat})
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Mata Pelajaran</TableCell>
                <TableCell header>Guru</TableCell>
                <TableCell header>Jam</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Waktu</TableCell>
                <TableCell header>Keterangan</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.mataPelajaran}</TableCell>
                  <TableCell>{record.guru}</TableCell>
                  <TableCell>{record.jam}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === 'hadir' ? 'success' :
                        record.status === 'izin' ? 'warning' :
                        record.status === 'sakit' ? 'info' : 'danger'
                      }
                    >
                      {record.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.waktu !== '-' ?
                      new Date(record.waktu).toLocaleTimeString('id-ID') :
                      '-'
                    }
                  </TableCell>
                  <TableCell>{record.keterangan}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Tidak ada data absensi untuk tanggal {new Date(detailDate).toLocaleDateString('id-ID')}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MuridKelasDetailModal;
