import React, { useState, useCallback } from 'react';
import Toast, { ToastType, ToastOptions } from './Toast';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

interface ToastContainerProps {
  maxToasts?: number;
}

let toastContainer: {
  addToast: (type: ToastType, title: string, message: string, options?: ToastOptions) => void;
} | null = null;

const ToastContainer: React.FC<ToastContainerProps> = ({ maxToasts = 5 }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message: string,
    options: ToastOptions = {}
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = {
      id,
      type,
      title,
      message,
      duration: options.duration || 5000
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Expose addToast function globally
  React.useEffect(() => {
    toastContainer = { addToast };
    return () => {
      toastContainer = null;
    };
  }, [addToast]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );
};

// Global toast functions
export const showToast = (
  type: ToastType,
  title: string,
  message: string,
  options?: ToastOptions
) => {
  if (toastContainer) {
    toastContainer.addToast(type, title, message, options);
  }
};

export const showSuccessToast = (title: string, message: string, options?: ToastOptions) => {
  showToast('success', title, message, options);
};

export const showErrorToast = (title: string, message: string, options?: ToastOptions) => {
  showToast('error', title, message, options);
};

export const showWarningToast = (title: string, message: string, options?: ToastOptions) => {
  showToast('warning', title, message, options);
};

export const showInfoToast = (title: string, message: string, options?: ToastOptions) => {
  showToast('info', title, message, options);
};

export default ToastContainer;