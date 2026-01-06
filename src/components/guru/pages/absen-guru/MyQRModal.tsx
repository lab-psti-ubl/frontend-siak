import React from 'react';
import Modal from '../../../ui/Modal';
import { User } from '../../../../types';
import { QrCode, User as UserIcon, Mail, Shield } from 'lucide-react';

interface MyQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  qrCodeURL: string;
}

const MyQRModal: React.FC<MyQRModalProps> = ({
  isOpen,
  onClose,
  user,
  qrCodeURL,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code Saya"
      size="md"
    >
      <div className="space-y-5 sm:space-y-6">
        <div className="bg-gradient-to-b from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-blue-200 flex items-center">
          <div className="bg-white p-6 sm:p-8 rounded-xl border-2 border-slate-200 inline-block mx-auto">
            {qrCodeURL ? (
              <img
                src={qrCodeURL}
                alt="My QR Code"
                className="w-56 h-56 sm:w-72 sm:h-72 object-contain"
              />
            ) : (
              <div className="w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-300 border-t-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-blue-200 space-y-3">
            <div className="flex items-start gap-3">
              <UserIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide">Nama</p>
                <p className="text-sm sm:text-base font-bold text-blue-900 mt-1">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-blue-100">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide">NIP</p>
                <p className="text-sm sm:text-base font-bold text-blue-900 mt-1 font-mono">{user?.nip}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-blue-100">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide">Tipe Pengguna</p>
                <p className="text-sm sm:text-base font-bold text-blue-900 mt-1">Guru</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-amber-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-amber-600 rounded-lg p-1.5 flex-shrink-0">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-semibold text-amber-900 text-sm sm:text-base">Cara Penggunaan</h4>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-800">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full flex-shrink-0 mt-1.5"></div>
                <span>Tunjukkan QR Code ini kepada admin</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-800">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full flex-shrink-0 mt-1.5"></div>
                <span>Admin akan memindai QR Code untuk mengabsen Anda</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-800">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full flex-shrink-0 mt-1.5"></div>
                <span>Atau download QR Code untuk backup atau cetak</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MyQRModal;
