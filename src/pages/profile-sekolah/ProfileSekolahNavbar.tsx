import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const containerClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

type NavItem = { label: string; to: string };

const navItems: NavItem[] = [
  { label: 'Beranda', to: '/profile-sekolah' },
  { label: 'Tentang Kami', to: '/profile-sekolah/tentang' },
  { label: 'Berita', to: '/profile-sekolah/berita' },
  { label: 'Prestasi', to: '/profile-sekolah/prestasi' },
];

type ProfileSekolahNavbarProps = {
  brandTitle?: string;
  logoUrl?: string;
};

const ProfileSekolahNavbar: React.FC<ProfileSekolahNavbarProps> = ({ brandTitle = 'Profil Sekolah', logoUrl }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSpmbClick = () => {
    navigate('/informasi-spmb');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md border-b border-slate-200' : 'bg-white border-b border-slate-200'
      }`}
    >
      <div className={`${containerClass} flex items-center justify-between h-16 lg:h-20`}>
        <NavLink to="/profile-sekolah" className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${brandTitle}`}
              className="w-10 h-10 object-contain"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                scrolled ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {brandTitle?.trim()?.[0]?.toUpperCase() || 'S'}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className={`text-[0.65rem] font-medium tracking-[0.18em] uppercase ${scrolled ? 'text-slate-500' : 'text-slate-500'}`}>
              Sekolah
            </div>
            <div className={`font-semibold text-sm ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>{brandTitle}</div>
          </div>
        </NavLink>

        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/profile-sekolah'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-emerald-700' : 'text-slate-600 hover:text-emerald-600'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleSpmbClick}
            className="inline-flex items-center gap-2 bg-sky-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-sky-400 shadow-sm"
          >
            Informasi Pendaftaran <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden p-2 rounded-lg text-slate-800"
          aria-label="Buka menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-slate-200"
          >
            <div className={`${containerClass} py-4 flex flex-col gap-2`}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/profile-sekolah'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `text-left py-2.5 px-3 rounded-lg transition-colors text-sm font-medium ${
                      isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-800 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  handleSpmbClick();
                  setMobileOpen(false);
                }}
                className="mt-2 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold text-sm px-5 py-3 rounded-full"
              >
                Informasi Pendaftaran <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default ProfileSekolahNavbar;

