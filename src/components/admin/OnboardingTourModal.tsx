import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { OnboardingStep } from '../../hooks/useOnboardingTour';

interface OnboardingTourModalProps {
  step: OnboardingStep;
  onClose: () => void;
}

const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({ step, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = () => {
    // Set flag that user navigated from modal
    sessionStorage.setItem('onboardingNavigated', 'true');
    navigate(step.route);
    onClose();
  };

  const handleSkip = () => {
    // Set flag to skip refreshTour for current route (not the target route)
    // This way, when admin adds data again in the current menu, refreshTour will be skipped
    sessionStorage.setItem('onboardingSkippedRoute', location.pathname);
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={step.title}
      size="md"
      showCloseButton={false}
    >
      <div className="space-y-6">
        {/* Icon and Message */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-gray-700 text-base leading-relaxed">
            {step.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="primary"
            fullWidth
            onClick={handleNavigate}
            className="flex items-center justify-center"
          >
            <span>Ke Menu {step.title.replace('Belum Ada ', '').replace(' Data ', ' ')}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleSkip}
          >
            Nanti Saja
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingTourModal;

