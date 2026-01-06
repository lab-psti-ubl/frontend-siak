import React, { useEffect, useState } from 'react';
import GSTActivationModal from './GSTActivationModal';
import { isSystemActive } from '../../utils/systemActivationUtils';

interface ActivationGuardProps {
  children: React.ReactNode;
}

const ActivationGuard: React.FC<ActivationGuardProps> = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkActivation = async () => {
      try {
        const active = await isSystemActive();
        setShowModal(!active);
      } catch (error) {
        console.error('Error checking system activation:', error);
        setShowModal(true); // Show modal on error to be safe
      } finally {
        setIsLoading(false);
      }
    };

    checkActivation();
  }, []);

  const handleActivationSuccess = () => {
    setShowModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('gst_modal_shown');
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (showModal) {
    return (
      <>
        <GSTActivationModal
          onActivationSuccess={handleActivationSuccess}
          onLogout={handleLogout}
        />
        <div className="blur-sm pointer-events-none">
          {children}
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default ActivationGuard;
