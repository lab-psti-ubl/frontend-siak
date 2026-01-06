import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Download, Mail, Phone, Users } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User, Kelas } from '../../../../../types';
import { getInitials, renderProfileImageOrInitials } from '../utils/muridUtils';
import PhotoPreviewModal from '../../../../ui/PhotoPreviewModal';

interface MuridDataTableProps {
  filteredMurid: User[];
  currentKelas: Kelas | undefined;
  selectedKelas: string;
  muridKelas: User[];
  onViewDetail: (murid: User) => void;
  onEditMurid: (murid: User) => void;
  onDeleteMurid: (murid: User) => void;
  onViewQR: (murid: User) => void;
  onDownloadQR: (murid: User) => void;
  onToggleStatus: (id: string) => void;
  onAddMurid: (kelasId?: string) => void;
  isKepalaSekolah?: boolean;
}

const MuridDataTable: React.FC<MuridDataTableProps> = ({
  filteredMurid,
  currentKelas,
  selectedKelas,
  muridKelas,
  onViewDetail,
  onEditMurid,
  onDeleteMurid,
  onViewQR,
  onDownloadQR,
  onToggleStatus,
  onAddMurid,
  isKepalaSekolah = false
}) => {
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [selectedPhotoMurid, setSelectedPhotoMurid] = useState<User | null>(null);

  const openPhotoPreview = (murid: User) => {
    setSelectedPhotoMurid(murid);
    setIsPhotoPreviewOpen(true);
  };

  const handleWhatsAppCall = (phone: string) => {
    if (!phone) {
      alert('Nomor WhatsApp tidak tersedia');
      return;
    }
    
    let formattedPhone = phone.replace(/\D/g, '');
    
    if (!formattedPhone.startsWith('62') && formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62') && !formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone;
    }
    
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <Card className="hidden lg:block border-0 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-white">
          <h3 className="text-lg font-semibold text-slate-900">Daftar Murid</h3>
        </div>

        <div className="overflow-x-auto">
          {filteredMurid.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableCell header className="text-sm">Murid</TableCell>
                  <TableCell header className="text-sm">Kontak</TableCell>
                  <TableCell header className="text-sm">NISN</TableCell>
                  <TableCell header className="text-sm">Status</TableCell>
                  <TableCell header className="text-sm">QR Code</TableCell>
                  <TableCell header className="text-sm">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMurid.map((murid) => {
                  const profileRender = renderProfileImageOrInitials(murid.profileImage, murid.name);

                  return (
                  <TableRow key={murid.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => murid.profileImage && openPhotoPreview(murid)}
                          className={`transition-all flex-shrink-0 ${
                            murid.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                          }`}
                        >
                          {profileRender.isImage ? (
                            <img
                              src={profileRender.profileImage}
                              alt={murid.name}
                              className="w-10 h-10 object-cover rounded-full hover:shadow-lg hover:scale-110"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {profileRender.initials}
                            </div>
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{murid.name}</p>
                          <p className="text-xs text-slate-500 truncate">{currentKelas?.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-slate-600 truncate">
                          <Mail size={12} className="mr-2 flex-shrink-0" />
                          <span className="truncate" title={murid.email}>{murid.email}</span>
                        </div>
                        {murid.whatsappOrtu ? (
                          <button
                            onClick={() => handleWhatsAppCall(murid.whatsappOrtu || '')}
                            className="flex items-center text-xs text-emerald-600 hover:text-emerald-700 transition-colors truncate"
                            title="Hubungi Orang Tua via WhatsApp"
                          >
                            <Phone size={12} className="mr-2 flex-shrink-0" />
                            <span className="truncate">{murid.whatsappOrtu}</span>
                          </button>
                        ) : (
                          <div className="flex items-center text-xs text-slate-400">
                            <Phone size={12} className="mr-2" />
                            <span>-</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-700">
                        {murid.nisn}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-2">
                        {!isKepalaSekolah && (
                          <button
                            onClick={() => onToggleStatus(murid.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                              murid.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                murid.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}
                        <span className="text-sm font-medium">
                          {murid.isActive !== false ? (
                            <Badge variant="success">Aktif</Badge>
                          ) : (
                            <Badge variant="default">Tidak Aktif</Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onViewQR(murid)}
                          className="!p-2 flex items-center justify-center"
                          title="Lihat QR"
                        >
                          <Eye size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onDownloadQR(murid)}
                          className="!p-2 flex items-center justify-center"
                          title="Download QR"
                        >
                          <Download size={12} />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onViewDetail(murid)}
                          className="!p-2 flex items-center justify-center"
                          title="Lihat detail"
                        >
                          <Eye size={12} className="mr-1"/>Lihat
                        </Button>
                        {!isKepalaSekolah && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onEditMurid(murid)}
                              className="!p-2 flex items-center justify-center"
                              title="Edit"
                            >
                              <Edit size={12} className="mr-1"/>Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => onDeleteMurid(murid)}
                              className="!p-2 flex items-center justify-center"
                              title="Hapus"
                            >
                              <Trash2 size={12} className="mr-1"/>Hapus
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 px-6">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {filteredMurid.length === 0 && muridKelas.length > 0 ? 'Tidak ada hasil' : 'Belum ada murid'}
              </h3>
              <p className="text-sm text-slate-600">
                {filteredMurid.length === 0 && muridKelas.length > 0 ?
                  'Tidak ditemukan murid dengan filter yang dipilih' :
                  `Belum ada murid di kelas ${currentKelas?.name}`
                }
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="lg:hidden space-y-3">
        {filteredMurid.length > 0 ? (
          filteredMurid.map((murid) => {
            const profileRender = renderProfileImageOrInitials(murid.profileImage, murid.name);

            return (
              <div key={murid.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => murid.profileImage && openPhotoPreview(murid)}
                      className={`transition-all flex-shrink-0 ${
                        murid.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                      }`}
                    >
                      {profileRender.isImage ? (
                        <img
                          src={profileRender.profileImage}
                          alt={murid.name}
                          className="w-12 h-12 object-cover rounded-full hover:shadow-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {profileRender.initials}
                        </div>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{murid.name}</p>
                      <p className="text-xs text-slate-500">{currentKelas?.name}</p>
                      <p className="text-xs text-slate-600 mt-1">NISN: {murid.nisn}</p>
                    </div>
                    {!isKepalaSekolah && (
                      <button
                        onClick={() => onToggleStatus(murid.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                          murid.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            murid.isActive !== false ? 'translate-x-4.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs">
                      <Mail size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600 truncate" title={murid.email}>{murid.email}</span>
                    </div>
                    {murid.whatsappOrtu && (
                      <button
                        onClick={() => handleWhatsAppCall(murid.whatsappOrtu || '')}
                        className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 transition-colors w-full"
                        title="Hubungi via WhatsApp"
                      >
                        <Phone size={12} className="flex-shrink-0" />
                        <span className="truncate">{murid.whatsappOrtu}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                    {murid.isActive !== false ? (
                      <Badge variant="success" className="text-xs">Aktif</Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">Tidak Aktif</Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onViewDetail(murid)}
                      className="flex-1 text-xs flex items-center justify-center"
                    >
                      <Eye size={12} className="mr-1" />
                      Detail
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onViewQR(murid)}
                      className="flex-1 text-xs flex items-center justify-center"
                    >
                      <Eye size={12} className="mr-1" />
                      QR
                    </Button>
                    {!isKepalaSekolah && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onEditMurid(murid)}
                          className="flex-1 text-xs flex items-center justify-center"
                        >
                          <Edit size={12} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDeleteMurid(murid)}
                          className="flex-1 text-xs flex items-center justify-center"
                        >
                          <Trash2 size={12} className="mr-1" />
                          Hapus
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {filteredMurid.length === 0 && muridKelas.length > 0 ? 'Tidak ada hasil' : 'Belum ada murid'}
            </h3>
            <p className="text-xs text-slate-600">
              {filteredMurid.length === 0 && muridKelas.length > 0 ?
                'Tidak ditemukan murid dengan filter yang dipilih' :
                `Belum ada murid di kelas ${currentKelas?.name}`
              }
            </p>
          </div>
        )}
      </div>

      <PhotoPreviewModal
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        photoUrl={selectedPhotoMurid?.profileImage || null}
        name={selectedPhotoMurid?.name || ''}
      />
    </>
  );
};

export default MuridDataTable;