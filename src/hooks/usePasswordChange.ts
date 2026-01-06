import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

interface UsePasswordChangeProps {
  user: User | null;
}

export const usePasswordChange = ({ user }: UsePasswordChangeProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    setMessage({ type: '', text: '' });

    if (!user) return;

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }

    setIsLoading(true);

    try {
      // Note: Backend will verify currentPassword and hash newPassword
      // We need to send both currentPassword and newPassword
      // For now, we'll use updateMurid with password field
      // The backend should verify the current password before updating
      const response = await apiService.updateMurid(user.id, {
        currentPassword,
        password: newPassword,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Password berhasil diubah. Anda akan logout otomatis dalam 3 detik...' });

        setTimeout(() => {
          logout();
          navigate('/login', { replace: true });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Gagal mengubah password' });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Password saat ini tidak benar atau terjadi kesalahan';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    message,
    handlePasswordChange,
    isLoading,
  };
};
