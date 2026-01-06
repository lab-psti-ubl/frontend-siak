import React from 'react';

export type ConfirmationType = 'warning' | 'danger' | 'info' | 'success';

export interface ConfirmationOptions {
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success' | 'warning';
}

let confirmationContainer: {
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: ConfirmationOptions
  ) => void;
} | null = null;

export const setConfirmationContainer = (container: typeof confirmationContainer) => {
  confirmationContainer = container;
};

export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  options: ConfirmationOptions = {}
): void => {
  if (confirmationContainer) {
    confirmationContainer.showConfirmation(title, message, onConfirm, options);
  } else {
    // Fallback to browser confirm
    if (confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  }
};

// Convenience functions for different confirmation types
export const showWarningConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: Omit<ConfirmationOptions, 'type'>
) => {
  showConfirmation(title, message, onConfirm, { ...options, type: 'warning' });
};

export const showDangerConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: Omit<ConfirmationOptions, 'type'>
) => {
  showConfirmation(title, message, onConfirm, { 
    ...options, 
    type: 'danger',
    confirmVariant: 'danger'
  });
};

export const showSuccessConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: Omit<ConfirmationOptions, 'type'>
) => {
  showConfirmation(title, message, onConfirm, { 
    ...options, 
    type: 'success',
    confirmVariant: 'success'
  });
};

export const showInfoConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: Omit<ConfirmationOptions, 'type'>
) => {
  showConfirmation(title, message, onConfirm, { ...options, type: 'info' });
};