import React, { useState, useCallback } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { setConfirmationContainer, ConfirmationOptions } from '../../utils/confirmationUtils';

interface ConfirmationItem {
  id: string;
  title: string;
  message: string;
  onConfirm: () => void;
  options: ConfirmationOptions;
}

const ConfirmationContainer: React.FC = () => {
  const [confirmations, setConfirmations] = useState<ConfirmationItem[]>([]);

  const showConfirmation = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options: ConfirmationOptions = {}
  ) => {
    const id = `confirmation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newConfirmation: ConfirmationItem = {
      id,
      title,
      message,
      onConfirm,
      options
    };

    setConfirmations(prev => [newConfirmation, ...prev.slice(0, 2)]); // Max 3 confirmations
  }, []);

  const removeConfirmation = useCallback((id: string) => {
    setConfirmations(prev => prev.filter(conf => conf.id !== id));
  }, []);

  // Expose showConfirmation function globally
  React.useEffect(() => {
    setConfirmationContainer({ showConfirmation });
    return () => {
      setConfirmationContainer(null);
    };
  }, [showConfirmation]);

  // Only show the most recent confirmation
  const currentConfirmation = confirmations[0];

  return (
    <>
      {currentConfirmation && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => removeConfirmation(currentConfirmation.id)}
          onConfirm={currentConfirmation.onConfirm}
          title={currentConfirmation.title}
          message={currentConfirmation.message}
          type={currentConfirmation.options.type}
          confirmText={currentConfirmation.options.confirmText}
          cancelText={currentConfirmation.options.cancelText}
          confirmVariant={currentConfirmation.options.confirmVariant}
        />
      )}
    </>
  );
};

export default ConfirmationContainer;