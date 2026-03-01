import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFooterSettings } from '../../hooks/useFooterSettings';

type FooterVariant = 'page' | 'card';

interface FooterProps {
  variant?: FooterVariant;
}

const Footer: React.FC<FooterProps> = ({ variant = 'page' }) => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const { footerCompanyName } = useFooterSettings();
  const companyName = footerCompanyName || 'iSchola - Garnusa Studio Technologi';
  const copyright =
    `© ${currentYear} ${companyName}`;

  if (variant === 'card') {
    return (
      <footer className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          {copyright}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {t('footer.rights')}
        </p>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p className="text-xs text-gray-500 sm:text-sm">
          {copyright}
        </p>
        <p className="text-xs text-gray-400">
          {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
