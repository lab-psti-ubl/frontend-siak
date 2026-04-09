import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading';
import { apiService } from '../../services/apiService';
import { LandingPrestasi } from '../../types';
import { achievementItems } from './content';
import heroImage from '../../assets/school-hero.png';

const containerClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const levelBadge = (level?: string) => {
  if (!level) return 'bg-slate-100 text-slate-700';
  if (level === 'Internasional') return 'bg-violet-100 text-violet-700';
  if (level === 'Nasional') return 'bg-sky-100 text-sky-700';
  if (level === 'Provinsi') return 'bg-emerald-100 text-emerald-700';
  return 'bg-amber-100 text-amber-700';
};

const PrestasiListPage: React.FC = () => {
  const [items, setItems] = useState<LandingPrestasi[]>(() => achievementItems as any);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiService.getLandingPrestasiPublic();
        if (res.success && res.prestasi) {
          setItems(res.prestasi);
        } else {
          setItems(achievementItems as any);
        }
      } catch (e) {
        console.error(e);
        setItems(achievementItems as any);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="pt-28 pb-16">
        <div className={containerClass}>
          <SectionHeading label="Prestasi" title="Prestasi Sekolah" description="Klik salah satu prestasi untuk melihat detailnya." />

          {loading ? (
            <div className="py-10 text-center text-slate-600">Memuat prestasi...</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-slate-600">Belum ada prestasi.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden"
                >
                  <img
                    src={item.imageUrl || heroImage}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('id-ID')}</div>
                      <span className={`text-[0.7rem] font-semibold px-2.5 py-1 rounded-full ${levelBadge(item.level)}`}>
                        {item.level || 'Prestasi'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <div className="font-bold text-slate-900">{item.title}</div>
                    </div>
                    <div className="text-sm text-slate-600 mt-2 line-clamp-3">{item.excerpt}</div>
                    <Link
                      to={`/profile-sekolah/prestasi/${item.id}`}
                      className="mt-4 inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800 text-sm"
                    >
                      Selengkapnya <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PrestasiListPage;

