import React from 'react';
import { CheckCircle, Clock, UserCheck } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import { User } from '../../../../../../types';

interface AbsenKelasKeteranganModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  activeSession: 'masuk' | 'pulang' | null;
  keterangan: string;
  setKeterangan: (keterangan: string) => void;
  isToday: boolean;
  confirmMarkAttendance: (status: 'hadir' | 'izin' | 'sakit' | 'alfa') => void;
}

const AbsenKelasKeteranganModal: React.FC<AbsenKelasKeteranganModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  activeSession,
  keterangan,
  setKeterangan,
  isToday,
  confirmMarkAttendance
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tambah Keterangan - ${selectedMurid?.name}`}
      size="md"
    >
      {selectedMurid && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Nama Murid</p>
            <p className="font-medium">{selectedMurid.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              Absen: {activeSession?.charAt(0).toUpperCase() + activeSession?.slice(1)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Masukkan keterangan absensi..."
            />
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="success" 
              onClick={() => confirmMarkAttendance('hadir')}
              fullWidth
              disabled={!isToday}
            >
              <CheckCircle size={16} className="mr-2" />
              Hadir
            </Button>
            <Button 
              variant="warning" 
              onClick={() => confirmMarkAttendance('izin')}
              fullWidth
              disabled={!isToday}
            >
              <Clock size={16} className="mr-2" />
              Izin
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => confirmMarkAttendance('sakit')}
              fullWidth
              disabled={!isToday}
            >
              <UserCheck size={16} className="mr-2" />
              Sakit
            </Button>
          </div>
          {!isToday && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Absensi manual hanya dapat dilakukan untuk hari ini. Pilih tanggal hari ini untuk melakukan absensi.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AbsenKelasKeteranganModal;