import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full w-full h-full'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      <div className={`
        relative w-full bg-white rounded-lg sm:rounded-xl shadow-2xl flex flex-col
        ${size === 'full' ? sizeClasses[size] : `${sizeClasses[size]} max-h-[95vh] sm:max-h-[90vh]`}
      `}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 pr-2">{title}</h3>
          {showCloseButton && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="p-2 !px-2 hover:bg-gray-100 flex-shrink-0"
            >
              <X size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;