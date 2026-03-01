import React, { useState } from 'react';
import { Plus, Send, Trash2, Eye, Users, School, GraduationCap, FileText, CheckCircle, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import Modal from '../../../ui/Modal';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useInfoSekolah } from '../../../../hooks/useInfoSekolah';
import { validateImageFile, fileToBase64 } from '../../../../utils/fileUploadUtils';
import { showSuccessNotification, showErrorNotification } from '../../../../utils/notificationUtils';
import { usePengumumanKelulusan } from '../../../../hooks/usePengumumanKelulusan';
import { useStatusKenaikanKelas } from '../../../../hooks/useStatusKenaikanKelas';
import { useStatusBagiRaport } from '../../../../hooks/useStatusBagiRaport';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useNilai } from '../../../../hooks/useNilai';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useJurusan } from '../../../../hooks/useJurusan';
import { usePengaturanNilaiMinimal } from '../../../../hooks/usePengaturanNilaiMinimal';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { apiService } from '../../../../services/apiService';
import { InfoSekolah, PengumumanKelulusan, StatusKenaikanKelas, StatusBagiRaport, User, Kelas, TahunAjaran } from '../../../../types';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { getMaxTingkatSync, isMaxTingkatSync, getGraduationTingkatLabelSync, getGraduationKelasTextSync, getNonMaxTingkatLabelSync } from '../../../../utils/jenjangPendidikanUtils';
import { getTeacherTerm, getStudentTerm } from '../../../../utils/terminologyUtils';

const BeriInfo: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { systemType } = usePengaturanSistem();
  
  const isTahfiz = systemType === 'tahfiz';
  const teacherTerm = getTeacherTerm(systemType);
  const studentTerm = getStudentTerm(systemType);
  
  // Use hooks dengan cache untuk mengambil data dari database
  const { infoSekolah, createInfoSekolah, deleteInfoSekolah, refreshInfoSekolah } = useInfoSekolah();
  const { pengumumanKelulusan, createPengumumanKelulusan, refreshPengumumanKelulusan } = usePengumumanKelulusan();
  const { statusKenaikanKelas, createStatusKenaikanKelas, updateStatusKenaikanKelas, refreshStatusKenaikanKelas } = useStatusKenaikanKelas();
  const { statusBagiRaport, createStatusBagiRaport, updateStatusBagiRaport, refreshStatusBagiRaport } = useStatusBagiRaport();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { tahunAjaran, activeTahunAjaran, refreshTahunAjaran } = useTahunAjaran();
  const { nilai } = useNilai();
  const { mataPelajaran } = useMataPelajaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { jurusan } = useJurusan();
  usePengaturanNilaiMinimal(); // Load nilai minimal settings from database to update cache
  
  // Combine gurus and murid into users array for compatibility
  const users: User[] = [...gurus, ...murid] as User[];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<InfoSekolah | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    judul: '',
    konten: '',
    jenis: 'umum' as 'umum' | 'kelulusan' | 'kenaikan_kelas' | 'bagi_raport',
    target: 'semua' as 'semua' | 'guru' | 'murid' | 'kelas_12',
    kelasId: '',
    gambar: '',
  });

  const maxTingkat = getMaxTingkatSync();
  const kelasEligible = activeTahunAjaran?.semester === 2 ?
    kelas.filter(k => !isMaxTingkatSync(k.tingkat)) : // Kenaikan kelas untuk kelas selain tingkat akhir
    kelas; // Bagi raport untuk semua kelas

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.judul.trim() || !formData.konten.trim()) {
      alert(language === 'ms' ? 'Tajuk dan kandungan mesti diisi!' : 'Judul dan konten wajib diisi!');
      return;
    }

    if (!activeTahunAjaran) {
      showErrorNotification(
        language === 'ms' ? 'Tahun Pengajian Tidak Aktif' : 'Tahun Ajaran Tidak Aktif', 
        language === 'ms' ? 'Tiada tahun pengajian yang aktif. Sila aktifkan tahun pengajian terlebih dahulu.' : 'Tidak ada tahun ajaran yang aktif. Silakan aktifkan tahun ajaran terlebih dahulu.'
      );
      return;
    }

    // Validasi semester untuk jenis tertentu (hanya untuk non-tahfiz)
    if (!isTahfiz) {
      if (formData.jenis === 'kelulusan' && activeTahunAjaran.semester !== 2) {
        showErrorNotification(
          language === 'ms' ? 'Semester Tidak Sesuai' : 'Semester Tidak Sesuai', 
          language === 'ms' ? 'Pengumuman kelulusan hanya boleh dibuat pada semester genap!' : 'Pengumuman kelulusan hanya dapat dibuat pada semester genap!'
        );
        return;
      }

      if (formData.jenis === 'kenaikan_kelas' && activeTahunAjaran.semester !== 2) {
        showErrorNotification(
          language === 'ms' ? 'Semester Tidak Sesuai' : 'Semester Tidak Sesuai', 
          language === 'ms' ? 'Pengumuman kenaikan kelas hanya boleh dibuat pada semester genap!' : 'Pengumuman kenaikan kelas hanya dapat dibuat pada semester genap!'
        );
        return;
      }

      if (formData.jenis === 'bagi_raport' && activeTahunAjaran.semester !== 1) {
        showErrorNotification(
          language === 'ms' ? 'Semester Tidak Sesuai' : 'Semester Tidak Sesuai', 
          language === 'ms' ? 'Bagi raport semester ganjil hanya boleh dibuat pada semester ganjil!' : 'Bagi raport semester ganjil hanya dapat dibuat pada semester ganjil!'
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (formData.jenis === 'kelulusan') {
        // Check if announcement already exists for this academic year
        const existingAnnouncement = pengumumanKelulusan.find(p =>
          p.tahunAjaran === activeTahunAjaran.tahun && p.isPublished
        );

        if (existingAnnouncement) {
          showErrorNotification(
            language === 'ms' ? 'Pengumuman Sudah Ada' : 'Pengumuman Sudah Ada', 
            language === 'ms' ? `Pengumuman kelulusan sudah aktif untuk tahun pengajian ${activeTahunAjaran.tahun}!` : `Pengumuman kelulusan sudah aktif untuk tahun ajaran ${activeTahunAjaran.tahun}!`
          );
          setIsSubmitting(false);
          return;
        }

        // Get snapshot of current final grade murid IDs (menggunakan max_tingkat dinamis sesuai jenjang)
        const muridTingkatAkhirIds = users.filter(u => {
          if (u.role !== 'murid') return false;
          const murid = u as any; // Type assertion for Murid
          const muridKelas = kelas.find(k => k.id === murid.kelasId);
          return !!(muridKelas && isMaxTingkatSync(muridKelas.tingkat) && murid.isActive !== false);
        }).map(u => u.id);

        console.log('Creating pengumuman kelulusan from BeriInfo with snapshot of', muridTingkatAkhirIds.length, 'murid tingkat akhir');

        // Create pengumuman kelulusan
        const newPengumuman: Omit<PengumumanKelulusan, 'id'> = {
          tahunAjaran: activeTahunAjaran.tahun,
          tanggalPengumuman: new Date().toISOString().split('T')[0],
          isPublished: true,
          snapshotMuridIds: muridTingkatAkhirIds,
          createdBy: user?.id || '',
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
        };
        
        await createPengumumanKelulusan(newPengumuman);

        // Automatically publish raport for all final grade classes (menggunakan max_tingkat dinamis sesuai jenjang)
        const kelasTingkatAkhir = kelas.filter(k => isMaxTingkatSync(k.tingkat));
        const kelasTingkatAkhirIds = kelasTingkatAkhir.map(k => k.id);
        
        // Check if status already exists for this tahunAjaran + semester
        const existingStatus = statusKenaikanKelas.find(s =>
          s.tahunAjaran === activeTahunAjaran.tahun &&
          s.semester === 2
        );

        if (existingStatus) {
          // Update existing status with merged kelasIds
          const mergedKelasIds = [...new Set([...existingStatus.kelasIds, ...kelasTingkatAkhirIds])];
          await updateStatusKenaikanKelas(existingStatus.id, {
            kelasIds: mergedKelasIds,
            isPublished: true,
            publishedBy: user?.id || '',
            publishedAt: new Date().toISOString(),
          });
        } else {
          // Create new status with all kelasIds
          await createStatusKenaikanKelas({
            kelasIds: kelasTingkatAkhirIds,
            tahunAjaran: activeTahunAjaran.tahun,
            semester: 2,
            isPublished: true,
            publishedBy: user?.id || '',
            publishedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
        
        console.log('Auto-published raport for', kelasTingkatAkhir.length, 'final grade classes (tingkat akhir sesuai jenjang)');
      }

      if (formData.jenis === 'kenaikan_kelas') {
        const kelasTarget = kelas; // All classes can receive grade promotion status
        const newStatusList: Omit<StatusKenaikanKelas, 'id'>[] = [];

        // Check if status already exists for this tahunAjaran + semester
        const existingStatus = statusKenaikanKelas.find(s =>
          s.tahunAjaran === activeTahunAjaran.tahun &&
          s.semester === activeTahunAjaran.semester
        );

        // Get all kelas IDs that should be included
        const allKelasIds = kelasTarget.map(k => k.id);
        
        // If status exists, merge with existing kelasIds (avoid duplicates)
        // Otherwise, create new status with all kelasIds
        const kelasIdsToSave = existingStatus 
          ? [...new Set([...existingStatus.kelasIds, ...allKelasIds])]
          : allKelasIds;

        if (existingStatus) {
          // Update existing status
          await updateStatusKenaikanKelas(existingStatus.id, {
            kelasIds: kelasIdsToSave,
            isPublished: false
          });
        } else {
          // Create new status with all kelasIds in one document
          await createStatusKenaikanKelas({
            kelasIds: kelasIdsToSave,
            tahunAjaran: activeTahunAjaran.tahun,
            semester: activeTahunAjaran.semester || 2,
            isPublished: false,
            publishedBy: undefined,
            publishedAt: undefined,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (formData.jenis === 'bagi_raport') {
        // Create status bagi raport untuk semua kelas
        const kelasTarget = kelas;
        const newStatusList: Omit<StatusBagiRaport, 'id'>[] = [];
        const updatePromises: Promise<any>[] = [];
        
        kelasTarget.forEach(kelasItem => {
          const existingStatus = statusBagiRaport.find(s => 
            s.kelasId === kelasItem.id && 
            s.tahunAjaran === activeTahunAjaran.tahun &&
            s.semester === activeTahunAjaran.semester
          );

          if (existingStatus) {
            // Don't auto-publish, just update the record to indicate admin has enabled distribution
            updatePromises.push(
              updateStatusBagiRaport(existingStatus.id, {
                isPublished: false,
                publishedBy: undefined,
                publishedAt: undefined
              })
            );
          } else {
            const newStatus: Omit<StatusBagiRaport, 'id'> = {
              kelasId: kelasItem.id,
              tahunAjaran: activeTahunAjaran.tahun,
              semester: activeTahunAjaran.semester || 1,
              isPublished: false,
              publishedBy: undefined,
              publishedAt: undefined,
              createdAt: new Date().toISOString(),
            };
            newStatusList.push(newStatus);
          }
        });
        
        if (newStatusList.length > 0) {
          await Promise.all(newStatusList.map(status => createStatusBagiRaport(status)));
        }
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }

        // Auto create semester genap untuk tahun ajaran yang sama
        if (activeTahunAjaran.semester === 1) {
          const existingSemesterGenap = tahunAjaran.find(ta => 
            ta.tahun === activeTahunAjaran.tahun && 
            ta.semester === 2
          );

          if (!existingSemesterGenap) {
            const newSemesterGenap: Omit<TahunAjaran, 'id'> = {
              tahun: activeTahunAjaran.tahun,
              semester: 2,
              isActive: false, // Tidak langsung diaktifkan
              tanggalMulai: '', // Akan diisi manual oleh admin
              tanggalSelesai: '', // Akan diisi manual oleh admin
              isAutoCreated: true, // Menandakan dibuat otomatis
            };
            
            await apiService.createTahunAjaran(newSemesterGenap);
            await refreshTahunAjaran();
            
            console.log(`Semester genap untuk tahun ajaran ${activeTahunAjaran.tahun} berhasil dibuat otomatis`);
          }
        }
      }

      // Create info sekolah
      const newInfo: Omit<InfoSekolah, 'id'> = {
        judul: formData.judul.trim(),
        konten: formData.konten.trim(),
        jenis: formData.jenis,
        target: formData.target,
        kelasId: undefined, // Tidak perlu kelasId karena otomatis untuk semua kelas
        gambar: formData.gambar || undefined,
        isActive: true,
        createdBy: user?.id || '',
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      };

      await createInfoSekolah(newInfo);
      resetForm();
      
      // Show success message with notification info
      const graduationLabel = getGraduationTingkatLabelSync();
      const targetInfo = formData.target === 'semua' ? (language === 'ms' ? 'semua orang (semua akses)' : 'semua orang (semua akses)') :
                        formData.target === 'guru' ? (teacherTerm === 'ustadz' ? 'ustadz' : 'guru') :
                        formData.target === 'murid' ? (studentTerm === 'santri' ? 'santri' : 'murid') :
                        `${studentTerm === 'santri' ? 'santri' : 'murid'} ${graduationLabel}`;
      
      showSuccessNotification(
        language === 'ms' ? 'Maklumat Berjaya Dihantar' : 'Informasi Berhasil Dikirim',
        language === 'ms' 
          ? `Maklumat telah dihantar kepada ${targetInfo}. Notifikasi akan muncul di ikon loceng untuk pengguna yang relevan.`
          : `Informasi telah dikirim kepada ${targetInfo}. Notifikasi akan muncul di icon bell untuk pengguna yang relevan.`
      );
    } catch (error: any) {
      console.error('Error submitting info:', error);
      showErrorNotification(
        t('common.error'), 
        error.message || (language === 'ms' ? 'Ralat berlaku semasa menghantar maklumat' : 'Terjadi kesalahan saat mengirim informasi')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showErrorNotification(
        language === 'ms' ? 'Fail Tidak Sah' : 'File Tidak Valid',
        validation.error || (language === 'ms' ? 'Fail tidak sesuai kriteria' : 'File tidak sesuai kriteria')
      );
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileData = await fileToBase64(file);
      setPreviewImage(fileData.base64);
      setFormData({ ...formData, gambar: fileData.base64 });
      showSuccessNotification(
        language === 'ms' ? 'Gambar Berjaya Dimuat Naik' : 'Gambar Berhasil Diupload',
        language === 'ms' 
          ? `Gambar "${fileData.fileName}" siap untuk digunakan`
          : `Gambar "${fileData.fileName}" siap untuk digunakan`
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      showErrorNotification(
        language === 'ms' ? 'Ralat Muat Naik' : 'Error Upload',
        language === 'ms' ? 'Gagal memuat naik gambar. Cuba lagi.' : 'Gagal mengupload gambar. Coba lagi.'
      );
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setFormData({ ...formData, gambar: '' });
    showSuccessNotification(
      language === 'ms' ? 'Gambar Dihapus' : 'Gambar Dihapus',
      language === 'ms' ? 'Gambar poster telah dihapus' : 'Gambar poster telah dihapus'
    );
  };

  const resetForm = () => {
    setFormData({
      judul: '',
      konten: '',
      jenis: 'umum',
      target: 'semua',
      kelasId: '',
      gambar: '',
    });
    setPreviewImage(null);
    setIsModalOpen(false);
  };

  const handleViewDetail = (info: InfoSekolah) => {
    setSelectedInfo(info);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const info = infoSekolah.find(i => i.id === id);
    if (!info) return;

    showDangerConfirmation(
      language === 'ms' ? 'Padam Maklumat' : 'Hapus Informasi',
      language === 'ms' 
        ? `Adakah anda pasti ingin memadam maklumat "${info.judul}"?\n\nTindakan ini tidak boleh dibatalkan.`
        : `Apakah Anda yakin ingin menghapus informasi "${info.judul}"?\n\nTindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          await deleteInfoSekolah(id);
          showSuccessNotification(
            t('common.success'), 
            language === 'ms' ? 'Maklumat berjaya dipadam' : 'Informasi berhasil dihapus'
          );
        } catch (error: any) {
          showErrorNotification(
            t('common.error'), 
            error.message || (language === 'ms' ? 'Ralat berlaku semasa memadam maklumat' : 'Terjadi kesalahan saat menghapus informasi')
          );
        }
      },
      {
        confirmText: language === 'ms' ? 'Ya, Padam Maklumat' : 'Ya, Hapus Informasi',
        cancelText: t('common.cancel')
      }
    );
  };

  const getTargetBadge = (target: string) => {
    switch (target) {
      case 'semua': return <Badge variant="info">{language === 'ms' ? 'Semua Orang' : 'Semua Orang'}</Badge>;
      case 'guru': return <Badge variant="success">{teacherTerm === 'ustadz' ? (language === 'ms' ? 'Ustadz' : 'Ustadz') : (language === 'ms' ? 'Guru' : 'Guru')}</Badge>;
      case 'murid': return <Badge variant="warning">{studentTerm === 'santri' ? (language === 'ms' ? 'Santri' : 'Santri') : (language === 'ms' ? 'Murid' : 'Murid')}</Badge>;
      case 'kelas_12': return <Badge variant="danger">{getGraduationKelasTextSync(true)}</Badge>;
      default: return <Badge variant="default">{target}</Badge>;
    }
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'umum': return <Badge variant="info">{language === 'ms' ? 'Umum' : 'Umum'}</Badge>;
      case 'kelulusan': return <Badge variant="success">{language === 'ms' ? 'Kelulusan' : 'Kelulusan'}</Badge>;
      case 'kenaikan_kelas': return <Badge variant="warning">{language === 'ms' ? 'Kenaikan Kelas' : 'Kenaikan Kelas'}</Badge>;
      case 'bagi_raport': return <Badge variant="secondary">{language === 'ms' ? 'Bagi Raport' : 'Bagi Raport'}</Badge>;
      default: return <Badge variant="default">{jenis}</Badge>;
    }
  };

  const getKelasName = (kelasId: string) => {
    return kelas.find(k => k.id === kelasId)?.name || 'Unknown';
  };


  const infoStats = {
    total: infoSekolah.length,
    umum: infoSekolah.filter(i => i.jenis === 'umum').length,
    kelulusan: infoSekolah.filter(i => i.jenis === 'kelulusan').length,
    kenaikankelas: infoSekolah.filter(i => i.jenis === 'kenaikan_kelas').length,
    bagiraport: infoSekolah.filter(i => i.jenis === 'bagi_raport').length,
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-white rounded-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{isTahfiz ? t('beriInfo.titleTahfiz') : t('beriInfo.title')} & {t('beriInfo.pengumuman')}</h1>
            </div>
            <p className="text-xs sm:text-sm text-blue-100">
              {isTahfiz ? t('beriInfo.subtitleTahfiz') : t('beriInfo.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
        <div className="text-xs sm:text-sm text-slate-600">
          {t('beriInfo.totalMaklumat')} <span className="font-semibold text-slate-900">{infoStats.total}</span> {t('beriInfo.informasi')}
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="text-xs sm:text-sm w-full sm:w-auto flex items-center justify-center">
         <Plus size={16} className="sm:mr-2" />
          <span className="hidden sm:inline">{t('beriInfo.buatInfoBaru')}</span>
          <span className="sm:hidden">{t('beriInfo.buatInfo')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">{t('beriInfo.totalInfo')}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{infoStats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">{t('beriInfo.infoUmum')}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{infoStats.umum}</p>
              </div>
            </div>
          </div>
        </div>

        {!isTahfiz && (
          <>
            <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-cyan-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                      <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm ml-2 text-slate-600">{language === 'ms' ? 'Kelulusan' : 'Kelulusan'}</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{infoStats.kelulusan}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-orange-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                      <School className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm ml-2 text-slate-600">{language === 'ms' ? 'Kenaikan Kelas' : 'Kenaikan Kelas'}</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{infoStats.kenaikankelas}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-teal-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm ml-2 text-slate-600">{language === 'ms' ? 'Bagi Raport' : 'Bagi Raport'}</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{infoStats.bagiraport}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {infoSekolah.length > 0 ? (
        <>
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">{t('beriInfo.daftarInformasi')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">{t('beriInfo.judul')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Jenis</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Sasaran</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Dibuat</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">{t('common.aksi')}</th>
                  </tr>
                </thead>
                <tbody>
                  {infoSekolah.map((info) => (
                    <tr key={info.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-slate-900 text-sm truncate" title={info.judul}>
                            {info.judul}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-1" title={info.konten}>
                            {info.konten.substring(0, 50)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getJenisBadge(info.jenis)}</td>
                      <td className="px-6 py-4">{getTargetBadge(info.target)}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <p className="text-slate-900">{new Date(info.createdAt).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={info.isActive ? 'success' : 'default'}>
                          {info.isActive ? (t('common.active') || 'Aktif') : (t('common.inactive') || 'Tidak Aktif')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleViewDetail(info)}
                            className="!p-2 flex items-center justify-center"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(info.id)}
                            className="!p-2 flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {infoSekolah.map((info) => (
              <div key={info.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{info.judul}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{info.konten.substring(0, 60)}...</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{language === 'ms' ? 'Jenis:' : 'Jenis:'}</span>
                      <div>{getJenisBadge(info.jenis)}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{language === 'ms' ? 'Sasaran:' : 'Target:'}</span>
                      <div>{getTargetBadge(info.target)}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{language === 'ms' ? 'Status:' : 'Status:'}</span>
                      <Badge variant={info.isActive ? 'success' : 'default'} className="text-xs">
                        {info.isActive ? (t('common.active') || 'Aktif') : (t('common.inactive') || 'Tidak Aktif')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{language === 'ms' ? 'Dibuat:' : 'Dibuat:'}</span>
                      <span className="text-slate-900">{new Date(info.createdAt).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewDetail(info)}
                      className="flex-1 text-xs flex items-center justify-center"
                    >
                      <Eye size={12} className="mr-1" />
                      {language === 'ms' ? 'Lihat' : 'Lihat'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(info.id)}
                      className="flex-1 text-xs flex items-center justify-center"
                    >
                      <Trash2 size={12} className="mr-1" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 mb-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">{t('beriInfo.belumAdaInfo')}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6">{t('beriInfo.buatInformasiPertama')}</p>
            <Button onClick={() => setIsModalOpen(true)} className="text-xs sm:text-sm ">
              
              <span className="hidden sm:inline">{t('beriInfo.buatInfoBaru')}</span>
              <span className="sm:hidden">{t('beriInfo.buatInfo')}</span>
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={t('beriInfo.buatInfoBaru')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
              {t('beriInfo.judulInformasi')} *
            </label>
            <input
              type="text"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={t('beriInfo.judulPlaceholder')}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
              Jenis Informasi *
            </label>
            <select
              value={formData.jenis}
              onChange={(e) => {
                const jenis = e.target.value as 'umum' | 'kelulusan' | 'kenaikan_kelas' | 'bagi_raport';
                setFormData({
                  ...formData,
                  jenis,
                  target: jenis === 'kelulusan' ? 'kelas_12' :
                          jenis === 'kenaikan_kelas' || jenis === 'bagi_raport' ? 'murid' : 'semua',
                  kelasId: ''
                });
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              required
              disabled={isSubmitting}
            >
              <option value="umum">{t('beriInfo.infoUmum')}</option>
              {!isTahfiz && activeTahunAjaran?.semester === 2 && (
                <>
                  {/* Hide kelulusan option if pengumuman kelulusan already exists for this tahun ajaran */}
                  {!pengumumanKelulusan.find(p => 
                    p.tahunAjaran === activeTahunAjaran.tahun && p.isPublished
                  ) && (
                    <option value="kelulusan">{language === 'ms' ? 'Pengumuman Kelulusan' : 'Pengumuman Kelulusan'}</option>
                  )}
                  {/* Hide kenaikan_kelas option if StatusKenaikanKelas already exists for this tahun ajaran and semester */}
                  {!statusKenaikanKelas.find(s => 
                    s.tahunAjaran === activeTahunAjaran.tahun && 
                    s.semester === activeTahunAjaran.semester
                  ) && (
                    <option value="kenaikan_kelas">{language === 'ms' ? 'Pengumuman Kenaikan Kelas' : 'Pengumuman Kenaikan Kelas'}</option>
                  )}
                </>
              )}
              {!isTahfiz && activeTahunAjaran?.semester === 1 && (
                <option value="bagi_raport">{language === 'ms' ? 'Bagi Raport Semester Ganjil' : 'Bagi Raport Semester Ganjil'}</option>
              )}
            </select>
          </div>

          {formData.jenis === 'umum' && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
                Target Penerima *
              </label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                required
                disabled={isSubmitting}
              >
                <option value="semua">{language === 'ms' ? 'Semua Orang' : 'Semua Orang'}</option>
                <option value="guru">{teacherTerm === 'ustadz' ? (language === 'ms' ? 'Ustadz Sahaja' : 'Ustadz Saja') : (language === 'ms' ? 'Guru Sahaja' : 'Guru Saja')}</option>
                <option value="murid">{studentTerm === 'santri' ? (language === 'ms' ? 'Santri Sahaja' : 'Santri Saja') : (language === 'ms' ? 'Murid Sahaja' : 'Murid Saja')}</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
              {t('beriInfo.isiInformasi')} *
            </label>
            <textarea
              value={formData.konten}
              onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={5}
              placeholder={t('beriInfo.isiPlaceholder')}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
              {language === 'ms' ? 'Gambar Poster (Pilihan)' : 'Gambar Poster (Opsional)'}
            </label>
            {previewImage || formData.gambar ? (
              <div className="space-y-2">
                <div className="relative w-full max-w-md">
                  <img
                    src={previewImage || formData.gambar || ''}
                    alt="Preview"
                    className="w-full h-auto rounded-lg border border-slate-300 object-cover max-h-64"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    disabled={isSubmitting || isUploadingImage}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'ms' ? 'Klik X untuk menghapus gambar' : 'Klik X untuk menghapus gambar'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="image-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isUploadingImage || isSubmitting
                      ? 'border-slate-300 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-xs text-slate-500">
                          {language === 'ms' ? 'Memuat naik...' : 'Mengupload...'}
                        </p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="text-xs text-slate-500 text-center px-4">
                          {language === 'ms' 
                            ? 'Klik untuk memuat naik gambar poster (JPG/PNG, maks 5MB)'
                            : 'Klik untuk mengupload gambar poster (JPG/PNG, maks 5MB)'}
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage || isSubmitting}
                  />
                </label>
              </div>
            )}
          </div>

          {!isTahfiz && formData.jenis === 'kelulusan' && (
            <div className="p-3 sm:p-4 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg">
              <h4 className="font-semibold text-cyan-900 mb-2 text-xs sm:text-sm">{language === 'ms' ? 'Maklumat Pengumuman Kelulusan' : 'Informasi Pengumuman Kelulusan'}</h4>
              <ul className="text-xs sm:text-sm text-cyan-800 space-y-1.5">
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Akan membuat menu "Info Kelulusan" di wali' : 'Akan membuat menu "Info Kelulusan" di wali'} {getGraduationTingkatLabelSync()}</span></li>
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Akan membuat menu "Info Kelulusan" di murid' : 'Akan membuat menu "Info Kelulusan" di murid'} {getGraduationTingkatLabelSync()}</span></li>
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Akan menghantar notifikasi ke guru wali' : 'Akan mengirim notifikasi ke guru wali'} {getGraduationTingkatLabelSync()} {language === 'ms' ? 'dan murid' : 'dan murid'} {getGraduationTingkatLabelSync()}</span></li>
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Memaparkan data kelulusan dan statistik murid terbaik' : 'Menampilkan data kelulusan dan statistik murid terbaik'}</span></li>
              </ul>
            </div>
          )}

          {!isTahfiz && formData.jenis === 'kenaikan_kelas' && (
            <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2 text-xs sm:text-sm">{language === 'ms' ? 'Maklumat Kenaikan Kelas' : 'Informasi Kenaikan Kelas'}</h4>
              <ul className="text-xs sm:text-sm text-orange-800 space-y-1.5">
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Akan mengaktifkan butang "Sebarkan" di menu Raport Murid' : 'Akan mengaktifkan tombol "Sebarkan" di menu Raport Murid'}</span></li>
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Akan menghantar notifikasi ke semua guru wali kelas' : 'Akan mengirim notifikasi ke semua guru wali kelas'}</span></li>
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? `Berlaku untuk semua kelas ${getNonMaxTingkatLabelSync()}` : `Berlaku untuk semua kelas ${getNonMaxTingkatLabelSync()}`}</span></li>
              </ul>
            </div>
          )}

          {!isTahfiz && formData.jenis === 'bagi_raport' && (
            <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
              <h4 className="font-semibold text-emerald-900 mb-2 text-xs sm:text-sm">{language === 'ms' ? 'Maklumat Bagi Raport' : 'Informasi Bagi Raport'}</h4>
              <ul className="text-xs sm:text-sm text-emerald-800 space-y-1.5">
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Akan mengaktifkan butang "Sebarkan" untuk SEMUA wali kelas' : 'Akan mengaktifkan tombol "Sebarkan" untuk SEMUA wali kelas'}</span></li>
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Akan menghantar notifikasi ke semua guru wali kelas' : 'Akan mengirim notifikasi ke semua guru wali kelas'}</span></li>
                <li className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Sistem automatik membuat semester genap' : 'Sistem otomatis membuat semester genap'}</span></li>
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-slate-200">
            <Button type="submit" fullWidth className="text-xs sm:text-sm flex items-center justify-center" disabled={isSubmitting}>
              <Send size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">{isSubmitting ? (language === 'ms' ? 'Menghantar...' : 'Mengirim...') : t('beriInfo.kirimInformasi')}</span>
              <span className="sm:hidden">{isSubmitting ? (language === 'ms' ? 'Menghantar...' : 'Mengirim...') : t('beriInfo.kirimInformasi')}</span>
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={resetForm} className="text-xs sm:text-sm" disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedInfo(null);
        }}
        title={language === 'ms' ? 'Butiran Maklumat' : 'Detail Informasi'}
        size="lg"
      >
        {selectedInfo && (
          <div className="space-y-4 sm:space-y-5">
            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-600">{language === 'ms' ? 'Jenis Maklumat:' : 'Jenis Informasi:'}</span>
                  <div className="mt-1">{getJenisBadge(selectedInfo.jenis)}</div>
                </div>
                <div>
                  <span className="text-slate-600">{language === 'ms' ? 'Sasaran Penerima:' : 'Target Penerima:'}</span>
                  <div className="mt-1">{getTargetBadge(selectedInfo.target)}</div>
                </div>
                <div>
                  <span className="text-slate-600">{language === 'ms' ? 'Tarikh Pembuatan:' : 'Tanggal Pembuatan:'}</span>
                  <span className="ml-2 font-medium text-slate-900">{new Date(selectedInfo.createdAt).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 text-base sm:text-lg mb-3">{selectedInfo.judul}</h3>
              {selectedInfo.gambar && (
                <div className="mb-4">
                  <img
                    src={selectedInfo.gambar}
                    alt={selectedInfo.judul}
                    className="w-full h-auto rounded-lg border border-slate-200 object-cover max-h-96"
                  />
                </div>
              )}
              <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {selectedInfo.konten}
                </p>
              </div>
            </div>

            {!isTahfiz && (selectedInfo.jenis === 'kenaikan_kelas' || selectedInfo.jenis === 'bagi_raport') && (
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                <div className="text-xs sm:text-sm text-blue-800 space-y-2">
                  <div className="font-semibold">{language === 'ms' ? 'Maklumat untuk' : 'Informasi untuk'} {selectedInfo.jenis === 'kenaikan_kelas' ? (language === 'ms' ? 'Kenaikan Kelas' : 'Kenaikan Kelas') : (language === 'ms' ? 'Bagi Raport' : 'Bagi Raport')}:</div>
                  <div className="space-y-1.5">
                    <div className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Akan mengaktifkan butang "Sebarkan Raport" di menu Raport Murid untuk' : 'Akan mengaktifkan tombol "Sebarkan Raport" di menu Raport Murid untuk'} {selectedInfo.jenis === 'bagi_raport' ? (language === 'ms' ? 'SEMUA wali kelas' : 'SEMUA wali kelas') : (language === 'ms' ? `semua wali kelas ${getNonMaxTingkatLabelSync()}` : `semua wali kelas ${getNonMaxTingkatLabelSync()}`)}</span></div>
                    <div className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Wali kelas mesti klik butang "Sebarkan Raport" agar murid dapat melihat raport' : 'Wali kelas harus klik tombol "Sebarkan Raport" agar murid dapat melihat raport'}</span></div>
                    <div className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Murid TIDAK dapat melihat raport sehingga wali kelas menyebarkannya' : 'Murid TIDAK dapat melihat raport sampai wali kelas menyebarkannya'}</span></div>
                    {selectedInfo.jenis === 'kenaikan_kelas' && (
                      <>
                        <div className="flex gap-2"><span className="flex-shrink-0">•</span><span><strong>{language === 'ms' ? 'Syarat naik kelas: Markah purata ≥ 70 dan kehadiran ≥ 75%' : 'Syarat naik kelas: Nilai rata-rata ≥ 70 dan kehadiran ≥ 75%'}</strong></span></div>
                        <div className="flex gap-2"><span className="flex-shrink-0">•</span><span><strong>{language === 'ms' ? 'PENTING:' : 'PENTING:'}</strong> {language === 'ms' ? 'Selepas semua wali kelas menyebarkan raport, admin boleh memproses kenaikan kelas dan kelulusan di menu Pengumuman Kelulusan' : 'Setelah semua wali kelas menyebarkan raport, admin dapat memproses kenaikan kelas dan kelulusan di menu Pengumuman Kelulusan'}</span></div>
                      </>
                    )}
                    {selectedInfo.jenis === 'bagi_raport' && (
                      <>
                        <div className="flex gap-2"><span className="flex-shrink-0">•</span><span><strong>{language === 'ms' ? 'AUTOMATIK:' : 'OTOMATIS:'}</strong> {language === 'ms' ? 'Sistem telah membuat semester genap untuk tahun pengajian yang sama' : 'Sistem telah membuat semester genap untuk tahun ajaran yang sama'}</span></div>
                        <div className="flex gap-2"><span className="flex-shrink-0">•</span><span>{language === 'ms' ? 'Admin boleh mengaktifkan semester genap selepas semester ganjil selesai' : 'Admin dapat mengaktifkan semester genap setelah semester ganjil selesai'}</span></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BeriInfo;
