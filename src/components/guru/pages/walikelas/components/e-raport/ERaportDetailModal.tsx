import React, { useMemo, useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import { User, ERaport } from '../../../../../../types';
import { downloadERaportPDF, generateERaportPDFBlob } from '../../../../../../utils/eRaportPdfUtils';
import { useProfilSekolah } from '../../../../../../hooks/useProfilSekolah';

interface ERaportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  eraport: ERaport | null;
  targetKelas: any;
  selectedTahunAjaran: string;
  selectedSemester: number;
}

const ERaportDetailModal: React.FC<ERaportDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  eraport,
  targetKelas,
  selectedTahunAjaran,
  selectedSemester,
}) => {
  const { profilSekolah } = useProfilSekolah();
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const muridData = useMemo(() => {
    if (!eraport || !selectedMurid) return null;
    return eraport.muridData.find(m => m.muridId === selectedMurid.id);
  }, [eraport, selectedMurid]);

  // Generate PDF preview when modal opens or data changes
  useEffect(() => {
    if (isOpen && selectedMurid && eraport && muridData) {
      setIsGeneratingPdf(true);
      generateERaportPDFBlob({
        eraport,
        muridData,
        selectedMurid,
        profilSekolah: profilSekolah || null,
      })
        .then((url) => {
          setPdfPreviewUrl(url);
          setIsGeneratingPdf(false);
        })
        .catch((error) => {
          console.error('Error generating PDF preview:', error);
          setIsGeneratingPdf(false);
        });
    }

    // Cleanup: revoke URL when component unmounts or modal closes
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }
    };
  }, [isOpen, selectedMurid, eraport, muridData, profilSekolah]);

  if (!selectedMurid || !eraport || !muridData) {
    return null;
  }

  const handleDownloadPDF = async () => {
    try {
      await downloadERaportPDF({
        eraport,
        muridData,
        selectedMurid,
        profilSekolah: profilSekolah || null,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="full"
    >
      <div className="relative">
        

        {/* PDF Preview */}
        <div className="eraport-container">
          {isGeneratingPdf ? (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Membuat preview PDF...</p>
              </div>
            </div>
          ) : pdfPreviewUrl ? (
            <div className="w-full h-screen">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="E-Raport Preview"
                style={{ minHeight: '100vh' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <p className="text-gray-600">Gagal memuat preview PDF</p>
              </div>
            </div>
          )}
        </div>

        {/* Styles for PDF Preview */}
        <style>{`
          .eraport-container {
            padding: 0;
            background: #f5f5f5;
            min-height: 100vh;
            width: 100%;
          }
        `}</style>
      </div>
    </Modal>
  );
};

export default ERaportDetailModal;

