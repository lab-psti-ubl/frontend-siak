import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useProfilSekolahPublic } from '../../hooks/useProfilSekolahPublic';
import { getActiveJenjangSync } from '../../utils/jenjangPendidikanUtils';
import LeafletMap from './LeafletMap';
import SectionHeading from './SectionHeading';
import heroImage from '../../assets/school-hero.png';

const containerClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const kompetensi = [
  'Teknik Komputer & Jaringan',
  'Rekayasa Perangkat Lunak',
  'Teknik Kendaraan Ringan Otomotif',
  'Teknik Bisnis & Sepeda Motor',
  'Akuntansi & Keuangan Lembaga',
  'Otomatisasi & Tata Kelola Perkantoran',
];

type FaqItem = { q: string; a: string };

const faqItems: FaqItem[] = [
  {
    q: 'Bagaimana cara melihat informasi pendaftaran?',
    a: 'Buka menu Informasi Pendaftaran (SPMB) dari navbar profil sekolah.',
  },
  {
    q: 'Apakah lokasi pada peta bisa disesuaikan?',
    a: 'Bisa. Pastikan data latitude dan longitude pada Profil Sekolah sudah diisi agar marker muncul tepat.',
  },
  {
    q: 'Bagaimana cara melihat berita dan prestasi?',
    a: 'Masuk ke menu Berita atau Prestasi di navbar, lalu klik “Selengkapnya” untuk detail.',
  },
  {
    q: 'Apakah sekolah memiliki program keahlian?',
    a: 'Ya. Daftar kompetensi keahlian tersedia di halaman Tentang Kami dan Beranda.',
  },
];

const TentangKamiProfileSekolah: React.FC = () => {
  const { profilSekolah } = useProfilSekolahPublic();
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const activeJenjang = getActiveJenjangSync();
  const shouldShowKompetensi = activeJenjang !== 'SD' && activeJenjang !== 'SMP';

  const visi = useMemo(
    () =>
      profilSekolah?.visiSekolah ||
      'Menjadi sekolah unggulan yang melahirkan lulusan berkarakter, adaptif, dan berdaya saing.',
    [profilSekolah]
  );

  const misi = useMemo(() => {
    const raw = profilSekolah?.misiSekolah?.trim();
    if (!raw) {
      return [
        'Menyelenggarakan pembelajaran yang relevan dengan kebutuhan dunia kerja.',
        'Mengembangkan kompetensi dan karakter peserta didik.',
        'Membangun budaya sekolah yang disiplin, kolaboratif, dan berintegritas.',
        'Memperkuat kemitraan dengan industri dan pemangku kepentingan.',
      ];
    }
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [profilSekolah]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TENTANG (layout seperti contoh) */}
      <section className="pt-28 pb-12 bg-white">
        <div className={containerClass}>
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.25em] uppercase text-blue-600">TENTANG KAMI</div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-4">
              {profilSekolah?.namaSekolah || 'Profil Sekolah'}
            </h1>
          </div>

          <div className="mt-10 grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="text-slate-600 leading-relaxed">
                <p>
                  {showFullAbout
                    ? profilSekolah?.deskripsi ||
                      'Sekolah merupakan wadah bagi peserta didik untuk berkumpul, berdiskusi, dan mengembangkan kompetensi profesional melalui berbagai kegiatan pembelajaran dan pengembangan.'
                    : (profilSekolah?.deskripsi ||
                        'Sekolah merupakan wadah bagi peserta didik untuk berkumpul, berdiskusi, dan mengembangkan kompetensi profesional melalui berbagai kegiatan pembelajaran dan pengembangan.')
                        .slice(0, 220)}
                  {!showFullAbout &&
                  (profilSekolah?.deskripsi || '').length > 220 ? (
                    <span className="text-slate-500">…</span>
                  ) : null}
                </p>

                <AnimatePresence initial={false}>
                  {showFullAbout ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      {(profilSekolah?.deskripsi || '').trim().length > 0 ? null : (
                        <div className="mt-4 space-y-3 text-slate-600">
                          <p>
                            Kami berkomitmen menghadirkan lingkungan belajar yang kolaboratif, inklusif, dan berorientasi pada pengembangan kompetensi serta karakter peserta didik.
                          </p>
                          <p>
                            Melalui kegiatan pembelajaran, praktik, proyek, dan pembinaan minat-bakat, sekolah mendukung peserta didik untuk tumbuh menjadi pribadi yang siap menghadapi tantangan masa depan.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => setShowFullAbout((v) => !v)}
                className="inline-block mt-4 text-blue-700 font-semibold text-sm hover:underline"
              >
                {showFullAbout ? 'Tutup' : 'Baca Selengkapnya'}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex justify-center"
            >
              <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm w-full max-w-xl">
                <img src={heroImage} alt="Logo/Ilustrasi sekolah" className="w-full h-72 sm:h-80 object-contain bg-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VISI MISI */}
      <section id="visi-misi" className="py-16 bg-slate-100">
        <div className={containerClass}>
          <SectionHeading label="Arah" title="Visi & Misi" description="Landasan dan tujuan besar sekolah." />

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-3xl bg-white border border-slate-200 p-7 shadow-sm"
            >
              <h3 className="text-xl font-bold text-slate-900">Visi</h3>
              <p className="text-slate-600 leading-relaxed mt-3">{visi}</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="rounded-3xl bg-white border border-slate-200 p-7 shadow-sm"
            >
              <h3 className="text-xl font-bold text-slate-900">Misi</h3>
              <ul className="space-y-3 mt-4">
                {misi.map((item, idx) => (
                  <li key={`${idx}-${item}`} className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                    <span className="leading-relaxed text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* KOMPETENSI (hanya SMA/SMK) */}
      {shouldShowKompetensi ? (
        <section className="py-16 bg-slate-50">
          <div className={containerClass}>
            <SectionHeading
              label="Program"
              title="Kompetensi Keahlian"
              description="Bidang keahlian yang dikembangkan untuk membentuk lulusan siap bersaing."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {kompetensi.map((name, i) => (
                <motion.div
                  key={name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="font-semibold text-slate-900">{name}</div>
                  <div className="text-sm text-slate-600 mt-2">Kurikulum adaptif, praktik terarah, dan penguatan portofolio.</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* LOKASI + MAP */}
      <section className="py-16 bg-slate-100">
        <div className={containerClass}>
          <SectionHeading label="Lokasi" title="Lokasi Sekolah" description="Akses dan titik lokasi sekolah melalui peta." />
          <LeafletMap
            lat={profilSekolah?.latitude}
            lng={profilSekolah?.longitude}
            popupTitle={profilSekolah?.namaSekolah || 'Lokasi Sekolah'}
            popupSubtitle={profilSekolah?.alamat}
            heightClassName="h-[420px] sm:h-[520px]"
            className="shadow-md"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className={containerClass}>
          <SectionHeading label="FAQ" title="Pertanyaan yang Sering Ditanyakan" description="Klik pertanyaan untuk melihat jawabannya." />

          <div className="max-w-3xl mx-auto space-y-3">
            {faqItems.map((item, idx) => {
              const open = openFaqIndex === idx;
              return (
                <div key={item.q} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex((v) => (v === idx ? null : idx))}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <div className="font-semibold text-slate-900">{item.q}</div>
                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Use grid 0fr->1fr to avoid "2 step" height:auto animation */}
                  <motion.div
                    animate={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
                    transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                    className="grid px-6"
                    style={{ gridTemplateRows: '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-5 text-slate-600 text-sm leading-relaxed">{item.a}</div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TentangKamiProfileSekolah;

