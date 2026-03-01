import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfilSekolahPublic } from '../hooks/useProfilSekolahPublic';
import { useLanguage } from '../context/LanguageContext';
import Button from './ui/Button';
import Card from './ui/Card';
import Footer from './layout/Footer';
import { School, Eye, EyeOff, LogIn } from 'lucide-react';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { profilSekolah } = useProfilSekolahPublic();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || t('login.errorInvalidCredentials'));
      }
    } catch (error: any) {
      // Handle any unexpected errors
      setError(error.message || t('login.errorGeneral'));
    }
  };

  const schoolName = profilSekolah?.namaSekolah || t('login.systemName');
  const schoolLogo = profilSekolah?.logoSekolah;

 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4 sm:p-6 md:p-8">

    {/* ================= MOBILE VIEW (TETAP SESUAI PROGRAM AWAL) ================= */}
    <div className="w-full max-w-md md:hidden">
      <div className="mb-8 animate-fade-in">
        <Card className="overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 pt-8 pb-6 rounded-xl">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                {schoolLogo ? (
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20">
                    <img src={schoolLogo} className="w-16 h-16 object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/30 backdrop-blur-sm">
                    <School className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">
                {schoolName}
              </h1>
              <p className="text-blue-100 text-sm font-medium">
                {t('login.systemSubtitle')}
              </p>
            </div>
          </div>

          {/* FORM MOBILE */}
          <div className="px-6 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {t('login.welcomeTitle')}
              </h2>
              <p className="text-gray-600 text-sm">
                {t('login.welcomeSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('login.emailOrNisn')}
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  placeholder={t('login.emailOrNisnPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    placeholder={t('login.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                className="mt-8 h-12 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg flex items-center justify-center"
              >
                <LogIn size={18} className="mr-1"/> {t('login.loginButton')}
              </Button>
            </form>
            {/* Footer di dalam section login, bawah tombol masuk */}
            <Footer variant="card" />
          </div>
        </Card>
      </div>
    </div>

    {/* ================= DESKTOP VIEW ================= */}
    <div className="hidden md:flex bg-white shadow-xl rounded-3xl overflow-hidden w-full max-w-4xl">

      {/* LEFT BLUE PANEL */}
      <div className="w-1/2 bg-gradient-to-b from-blue-600 to-blue-500 text-white flex flex-col items-center justify-center p-12">
        {schoolLogo ? (
          <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-xl overflow-hidden mb-6">
            <img src={schoolLogo} className="w-24 h-24 object-contain" />
          </div>
        ) : (
          <div className="w-28 h-28 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md mb-6">
            <School className="w-14 h-14 text-white" />
          </div>
        )}

        <h1 className="text-3xl font-bold text-center mb-2">
          {schoolName}
        </h1>
        <p className="text-blue-100 text-sm">
          {t('login.systemSubtitle')}
        </p>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="w-1/2 p-12">
        <h2 className="text-2xl font-semibold mb-1">{t('login.welcomeTitle')}</h2>
        <p className="text-gray-600 text-sm mb-6">
          {t('login.welcomeSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">{t('login.emailOrNisn')}</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
              placeholder={t('login.emailOrNisnPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={isLoading}
            fullWidth
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center justify-center"
          >
            <LogIn size={18} className="mr-1"/> {t('login.loginButton')}
          </Button>
        </form>
        {/* Footer di dalam section login, bawah tombol masuk */}
        <Footer variant="card" />
      </div>
    </div>
  </div>
);

};

export default LoginForm;