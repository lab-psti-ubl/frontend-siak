import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import { User } from '../../../../../../types';

interface DataMuridKelasEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  editFormData: {
    name: string;
    email: string;
    nisn: string;
    whatsappOrtu: string;
  };
  setEditFormData: (data: any) => void;
  onUpdateMurid: (e: React.FormEvent) => void;
}

const DataMuridKelasEditModal: React.FC<DataMuridKelasEditModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  editFormData,
  setEditFormData,
  onUpdateMurid
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Murid - ${selectedMurid?.name}`}
      size="md"
    >
      <form onSubmit={onUpdateMurid} className="pb-12 sm:pb-0 space-y-5 sm:space-y-6">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Masukkan nama lengkap murid"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Masukkan email murid"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
            NISN
          </label>
          <input
            type="text"
            value={editFormData.nisn}
            onChange={(e) => setEditFormData({ ...editFormData, nisn: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Masukkan NISN murid"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
            WhatsApp Orang Tua
          </label>
          <input
            type="tel"
            value={editFormData.whatsappOrtu}
            onChange={(e) => setEditFormData({ ...editFormData, whatsappOrtu: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx"
          />
          <p className="text-xs text-slate-500 mt-2">
            Nomor WhatsApp orang tua untuk notifikasi absensi
          </p>
        </div>

        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 border-t border-slate-200">
          <Button
            type="submit"
            fullWidth
            className="text-xs sm:text-sm py-2.5 sm:py-3 justify-center flex items-center"
          >
            <Save size={16} className="mr-2" />
            Update Data
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            className="text-xs sm:text-sm py-2.5 sm:py-3 justify-center flex items-center"
          >
            <X size={16} className="mr-2" />
            Batal
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DataMuridKelasEditModal;