import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { apiService } from '../../services/apiService';
import { LandingPrestasi } from '../../types';
import { achievementItems } from './content';
import heroImage from '../../assets/school-hero.png';

const containerClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const PrestasiDetailPage: React.FC = () => {
  const { id } = useParams();
  const [item, setItem] = useState<LandingPrestasi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setItem(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await apiService.getLandingPrestasiPublicById(id);
        if (res.success && res.prestasi) {
          setItem(res.prestasi);
        } else {
          setItem((achievementItems as any).find((n: any) => n.id === id) || null);
        }
      } catch (e) {
        console.error(e);
        setItem((achievementItems as any).find((n: any) => n.id === id) || null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <section className="pt-28 pb-16">
          <div className={containerClass}>
            <SectionHeading label="Prestasi" title="Memuat..." description="Sedang memuat detail prestasi." />
          </div>
        </section>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <section className="pt-28 pb-16">
          <div className={containerClass}>
            <SectionHeading label="Prestasi" title="Prestasi tidak ditemukan" description="Silakan kembali ke daftar prestasi." />
            <Link to="/profile-sekolah/prestasi" className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="pt-28 pb-16">
        <div className={containerClass}>
          <Link to="/profile-sekolah/prestasi" className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Prestasi
          </Link>

          <div className="mt-8 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <img
              src={item.imageUrl || heroImage}
              alt={item.title}
              className="w-full h-56 sm:h-72 object-cover"
            />
            <div className="p-8">
              <div className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('id-ID')}</div>
              <div className="flex items-center gap-2 mt-3">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{item.title}</h1>
              </div>
              {item.level ? (
                <div className="mt-3 text-sm text-slate-600">
                  Tingkat: <span className="font-semibold text-slate-900">{item.level}</span>
                </div>
              ) : null}
              <div className="mt-6 text-slate-700 leading-relaxed whitespace-pre-line">{item.content}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrestasiDetailPage;

