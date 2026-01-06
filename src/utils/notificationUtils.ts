// Re-export toast functions for backward compatibility
export { 
  showToast as showNotification,
  showSuccessToast as showSuccessNotification,
  showErrorToast as showErrorNotification,
  showWarningToast as showWarningNotification,
  showInfoToast as showInfoNotification
} from '../components/ui/ToastContainer';

// Re-export confirmation functions
export {
  showConfirmation,
  showWarningConfirmation,
  showDangerConfirmation,
  showSuccessConfirmation,
  showInfoConfirmation
} from './confirmationUtils';