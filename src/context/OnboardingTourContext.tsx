import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboardingTour, OnboardingStep } from '../hooks/useOnboardingTour';
import OnboardingTourModal from '../components/admin/OnboardingTourModal';
import { usePengaturanSistem } from '../hooks/usePengaturanSistem';

interface OnboardingTourContextType {
  refreshTour: () => void;
  currentStep: OnboardingStep | null;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | undefined>(undefined);

export const useOnboardingTourContext = () => {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error('useOnboardingTourContext must be used within OnboardingTourProvider');
  }
  return context;
};

interface OnboardingTourProviderProps {
  children: ReactNode;
  enabled?: boolean; // Only show tour for admin users
}

export const OnboardingTourProvider: React.FC<OnboardingTourProviderProps> = ({ 
  children, 
  enabled = true 
}) => {
  const { currentStep, isLoading, refreshData } = useOnboardingTour();
  const { systemType } = usePengaturanSistem();
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();
  const [navigatedFromModal, setNavigatedFromModal] = useState(false);
  
  // Disable onboarding for tahfiz system
  const isTahfizSystem = systemType === 'tahfiz';
  const isOnboardingEnabled = enabled && !isTahfizSystem;

  // Check if user navigated from modal (stored in sessionStorage)
  useEffect(() => {
    const navigated = sessionStorage.getItem('onboardingNavigated');
    if (navigated === 'true') {
      setNavigatedFromModal(true);
      // Clear the flag after a short delay
      setTimeout(() => {
        sessionStorage.removeItem('onboardingNavigated');
        setNavigatedFromModal(false);
      }, 2000);
    }

    // Clear skip flag when user navigates to a different route
    const skippedRoute = sessionStorage.getItem('onboardingSkippedRoute');
    if (skippedRoute && skippedRoute !== location.pathname) {
      sessionStorage.removeItem('onboardingSkippedRoute');
    }
  }, [location.pathname]);

  // Refresh tour by clearing cache and reloading all data
  const refreshTour = async () => {
    // Check if refreshTour is skipped for current route
    const skippedRoute = sessionStorage.getItem('onboardingSkippedRoute');
    if (skippedRoute === location.pathname) {
      // Skip refreshTour for this route
      return;
    }

    // Close modal first
    setShowModal(false);
    // Clear navigation flag
    sessionStorage.removeItem('onboardingNavigated');
    setNavigatedFromModal(false);
    
    // Clear cache and reload all data
    await refreshData();
    
    // Force re-check by updating refresh key
    setRefreshKey(prev => prev + 1);
  };

  // Show modal when there's a current step
  useEffect(() => {
    // Check if this route is skipped
    const skippedRoute = sessionStorage.getItem('onboardingSkippedRoute');
    const isRouteSkipped = skippedRoute === location.pathname;
    
    // Routes where modal should not be shown (form pages)
    const formRoutes = [
      '/dashboard/tambah-murid',
      // Add other form routes here if needed
    ];
    const isFormRoute = formRoutes.some(route => location.pathname.includes(route));
    
    // Don't show modal if:
    // 1. Not enabled (or system is tahfiz)
    // 2. No current step
    // 3. Still loading
    // 4. User just navigated from modal (within 2 seconds)
    // 5. Current route matches the step route (user is already on the target page)
    // 6. Current route is skipped (user clicked "Nanti Saja" while on this route)
    // 7. Current route is a form route (like tambah-murid)
    //    Note: We skip showing modal on the current route, not the target route
    const shouldShow = 
      isOnboardingEnabled && 
      currentStep && 
      !isLoading && 
      !navigatedFromModal &&
      location.pathname !== currentStep.route &&
      !isRouteSkipped &&
      !isFormRoute;

    if (shouldShow) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShowModal(false);
    }
  }, [currentStep, isLoading, isOnboardingEnabled, refreshKey, navigatedFromModal, location.pathname, systemType]);

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <OnboardingTourContext.Provider value={{ refreshTour, currentStep }}>
      {children}
      {isOnboardingEnabled && showModal && currentStep && (
        <OnboardingTourModal
          step={currentStep}
          onClose={handleClose}
        />
      )}
    </OnboardingTourContext.Provider>
  );
};

