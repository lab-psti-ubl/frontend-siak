import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { apiService } from '../../services/apiService';
import { LandingBerita } from '../../types';
import { newsItems } from './content';
import heroImage from '../../assets/school-hero.png';

const containerClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const BeritaDetailPage: React.FC = () => {
  const { id } = useParams();
  const [item, setItem] = useState<LandingBerita | null>(null);
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
        const res = await apiService.getLandingBeritaPublicById(id);
        if (res.success && res.berita) {
          setItem(res.berita);
        } else {
          setItem((newsItems as any).find((n: any) => n.id === id) || null);
        }
      } catch (e) {
        console.error(e);
        setItem((newsItems as any).find((n: any) => n.id === id) || null);
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
            <SectionHeading label="Berita" title="Memuat..." description="Sedang memuat detail berita." />
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
            <SectionHeading label="Berita" title="Berita tidak ditemukan" description="Silakan kembali ke daftar berita." />
            <Link to="/profile-sekolah/berita" className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800">
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
          <Link to="/profile-sekolah/berita" className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Berita
          </Link>

          <div className="mt-8 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <img
              src={item.imageUrl || heroImage}
              alt={item.title}
              className="w-full h-56 sm:h-72 object-cover"
            />
            <div className="p-8">
              <div className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('id-ID')}</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3">{item.title}</h1>
              <div className="mt-6 text-slate-700 leading-relaxed whitespace-pre-line">{item.content}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BeritaDetailPage;

