import React, { createContext, useContext, useState, ReactNode } from 'react';

interface QRScannerContextType {
  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (isOpen: boolean) => void;
  isCameraCaptureOpen: boolean;
  setIsCameraCaptureOpen: (isOpen: boolean) => void;
}

const QRScannerContext = createContext<QRScannerContextType | undefined>(undefined);

export const useQRScanner = () => {
  const context = useContext(QRScannerContext);
  if (!context) {
    throw new Error('useQRScanner must be used within a QRScannerProvider');
  }
  return context;
};

interface QRScannerProviderProps {
  children: ReactNode;
}

export const QRScannerProvider: React.FC<QRScannerProviderProps> = ({ children }) => {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

  return (
    <QRScannerContext.Provider value={{ isQRScannerOpen, setIsQRScannerOpen, isCameraCaptureOpen, setIsCameraCaptureOpen }}>
      {children}
    </QRScannerContext.Provider>
  );
};

