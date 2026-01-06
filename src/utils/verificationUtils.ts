export const handleVerificationRedirect = () => {
  const params = new URLSearchParams(window.location.search);
  const verification = params.get('verification');
  const message = params.get('message');

  if (verification && message) {
    return {
      suratId: verification,
      message: decodeURIComponent(message),
      isVerified: true
    };
  }

  return null;
};

export const showVerificationModal = (suratId: string, message: string) => {
  return {
    title: 'Verifikasi Surat Izin',
    suratId,
    message,
    timestamp: new Date().toLocaleString('id-ID'),
    isValid: true
  };
};
