import React from 'react';

type SectionHeadingProps = {
  label?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

const SectionHeading: React.FC<SectionHeadingProps> = ({ label, title, description, align = 'center' }) => (
  <div className={`mb-10 ${align === 'center' ? 'text-center' : ''}`}>
    {label ? (
      <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full mb-4">
        {label}
      </span>
    ) : null}
    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{title}</h2>
    {description ? (
      <p className={`mt-4 text-slate-600 max-w-2xl leading-relaxed text-base sm:text-lg ${align === 'center' ? 'mx-auto' : ''}`}>
        {description}
      </p>
    ) : null}
  </div>
);

export default SectionHeading;

