import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  Award,
  Users,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Car,
  Bike,
  Calculator,
  Briefcase,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import heroImage from '../assets/school-hero.png';

// Helper container (pengganti class section-container)
const containerClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

/* ───────── Animation variant ───────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

/* ───────── Data ───────── */
const navLinks = [
  { label: 'Profil', id: 'hero-sekolah' },
  { label: 'Visi & Misi', id: 'visi-misi' },
  { label: 'Program Keahlian', id: 'kompetensi-keahlian' },
  { label: 'Kontak', id: 'kontak-sekolah' },
];

const kompetensi = [
  { icon: Cpu, name: 'Teknik Komputer & Jaringan', desc: 'Membangun dan mengelola infrastruktur jaringan komputer modern.' },
  { icon: GraduationCap, name: 'Rekayasa Perangkat Lunak', desc: 'Pengembangan aplikasi web, mobile, dan sistem informasi.' },
  { icon: Car, name: 'Teknik Kendaraan Ringan Otomotif', desc: 'Perawatan & perbaikan kendaraan bermotor ringan.' },
  { icon: Bike, name: 'Teknik Bisnis & Sepeda Motor', desc: 'Servis sepeda motor dan kewirausahaan bengkel.' },
  { icon: Calculator, name: 'Akuntansi & Keuangan Lembaga', desc: 'Pengelolaan keuangan, perpajakan, dan akuntansi.' },
  { icon: Briefcase, name: 'Otomatisasi & Tata Kelola Perkantoran', desc: 'Administrasi kantor modern berbasis digital.' },
];

const fasilitas = [
  'Ruang kelas representatif dengan media digital',
  'Laboratorium komputer & jaringan berstandar industri',
  'Bengkel praktik otomotif & mesin',
  'Perpustakaan & ruang literasi digital',
  'Masjid & area kegiatan keagamaan',
  'Lapangan olahraga & ruang ekstrakurikuler',
];

const kontakItems = [
  { icon: MapPin, title: 'Alamat', value: 'Jl. Raya Soekarno Hatta, Bandar Lampung' },
  { icon: Phone, title: 'Telepon', value: '(0721) 000000' },
  { icon: Mail, title: 'Email', value: 'info@smkn5bandarlampung.sch.id' },
];

/* ───────── Section Heading ───────── */
type SectionHeadingProps = {
  label?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

const SectionHeading: React.FC<SectionHeadingProps> = ({ label, title, description, align = 'center' }) => (
  <div className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}>
    {label && (
      <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full mb-4">
        {label}
      </span>
    )}
    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{title}</h2>
    {description && (
      <p
        className={`mt-4 text-slate-600 max-w-2xl leading-relaxed text-base sm:text-lg ${
          align === 'center' ? 'mx-auto' : ''
        }`}
      >
        {description}
      </p>
    )}
  </div>
);

/* ───────── Main Page Component ───────── */
const ProfileSekolahPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSpmbClick = () => {
    window.location.href = '/informasi-spmb';
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-lg shadow-md border-b border-slate-200/70' : 'bg-transparent'
        }`}
      >
        <div className={`${containerClass} flex items-center justify-between h-16 lg:h-20`}>
          <button onClick={() => scrollToSection('hero-sekolah')} className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                scrolled ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              5
            </div>
            <div className="hidden sm:block text-left">
              <div
                className={`text-[0.65rem] font-medium tracking-[0.18em] uppercase ${
                  scrolled ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                SMK Negeri
              </div>
              <div
                className={`font-semibold text-sm ${
                  scrolled ? 'text-slate-900' : 'text-white drop-shadow-sm'
                }`}
              >
                SMKN 5 Bandar Lampung
              </div>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`text-sm font-medium transition-colors ${
                  scrolled
                    ? 'text-slate-600 hover:text-emerald-600'
                    : 'text-slate-100/80 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={handleSpmbClick}
              className="inline-flex items-center gap-2 bg-sky-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-sky-400 shadow-sm"
            >
              Informasi Pendaftaran <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg ${
              scrolled ? 'text-slate-800' : 'text-white'
            }`}
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
              className="lg:hidden bg-white/95 backdrop-blur-lg border-b border-slate-200"
            >
              <div className={`${containerClass} py-4 flex flex-col gap-2`}>
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      scrollToSection(link.id);
                      setMobileOpen(false);
                    }}
                    className="text-left py-2.5 px-3 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </button>
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

      {/* HERO */}
      <section id="hero-sekolah" className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="SMKN 5 Bandar Lampung"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/85 to-emerald-700/70" />
        </div>

        <div className={`relative ${containerClass} pt-28 pb-20`}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="space-y-6"
            >
              <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase bg-white/10 text-emerald-50 px-4 py-1.5 rounded-full border border-white/20">
                SMK Negeri 5 Bandar Lampung
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]">
                Mempersiapkan{' '}
                <span className="text-amber-300">Generasi Siap Kerja</span> &amp; Berkarakter
              </h1>
              <p className="text-emerald-50/80 text-lg max-w-lg leading-relaxed">
                Pendidikan kejuruan modern yang terhubung dengan dunia usaha dan industri, membantu
                peserta didik melangkah yakin menuju masa depan.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleSpmbClick}
                  className="inline-flex items-center gap-2 bg-amber-400 text-emerald-950 font-semibold px-6 py-3 rounded-full hover:bg-amber-300 transition-colors text-sm shadow-md shadow-amber-500/40"
                >
                  Informasi Pendaftaran <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection('kompetensi-keahlian')}
                  className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 font-medium px-6 py-3 rounded-full hover:bg-white/15 transition-colors text-sm"
                >
                  Lihat Program Keahlian
                </button>
              </div>
              <div className="flex flex-wrap gap-8 pt-6">
                {[
                  { value: '1.000+', label: 'Peserta Didik' },
                  { value: '7', label: 'Program Keahlian' },
                  { value: '30+', label: 'Mitra Industri' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-emerald-50/70 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 space-y-6 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center text-2xl font-bold text-emerald-950">
                    5
                  </div>
                  <div>
                    <div className="text-xs text-emerald-50/70 uppercase tracking-[0.18em]">
                      Sekolah Menengah Kejuruan
                    </div>
                    <div className="text-lg font-semibold text-white">
                      SMKN 5 Bandar Lampung
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {kontakItems.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <item.icon className="w-4 h-4 text-amber-300 mt-1 shrink-0" />
                      <div>
                        <div className="text-xs text-emerald-50/60">{item.title}</div>
                        <div className="text-sm text-emerald-50/90">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/15">
                  <Award className="w-5 h-5 text-amber-300" />
                  <span className="text-sm text-emerald-50/80">
                    Terakreditasi <span className="font-bold text-amber-300">A</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VISI MISI */}
      <section id="visi-misi" className="py-24 bg-slate-50">
        <div className={containerClass}>
          <SectionHeading label="Tentang Kami" title="Visi & Misi Sekolah" />
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-3xl bg-white/80 backdrop-blur border border-slate-200 p-8 space-y-5 shadow-sm"
            >
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" /> Visi
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Menjadi SMK unggulan di Bandar Lampung yang melahirkan lulusan berkarakter, berdaya saing global,
                adaptif terhadap perkembangan teknologi, serta berkontribusi nyata bagi dunia kerja dan masyarakat.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="rounded-3xl bg-white/80 backdrop-blur border border-slate-200 p-8 space-y-5 shadow-sm"
            >
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> Misi
              </h3>
              <ul className="space-y-3">
                {[
                  'Menyelenggarakan pendidikan kejuruan yang relevan dengan kebutuhan dunia usaha dan dunia industri.',
                  'Mengembangkan kompetensi profesional, sosial, dan spiritual peserta didik.',
                  'Membangun budaya sekolah yang berintegritas, disiplin, dan berorientasi pada pelayanan.',
                  'Memperkuat kemitraan dengan industri, perguruan tinggi, dan lembaga terkait.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                    <span className="leading-relaxed text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mt-10">
            {[
              {
                title: 'Budaya & Lingkungan Belajar',
                desc: 'Lingkungan belajar yang humanis, kolaboratif, dan berorientasi pada proyek nyata (project based learning).',
              },
              {
                title: 'Keunggulan Sekolah',
                desc: 'Prakerin terstruktur, sertifikasi kompetensi melalui LSP, dan ekstrakurikuler yang variatif & inklusif.',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100"
              >
                <h4 className="font-semibold text-slate-900 mb-2">{card.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* KOMPETENSI KEAHLIAN */}
      <section id="kompetensi-keahlian" className="py-24 bg-slate-100">
        <div className={containerClass}>
          <SectionHeading
            label="Program Keahlian"
            title="Kompetensi Keahlian"
            description="Enam program keahlian yang dirancang untuk mencetak lulusan siap kerja dan siap berwirausaha."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kompetensi.map((item, i) => (
              <motion.div
                key={item.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <item.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.name}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FASILITAS */}
      <section className="py-24 bg-slate-50">
        <div className={containerClass}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionHeading
                label="Fasilitas"
                title="Fasilitas Pendukung"
                align="left"
                description="Sarana dan prasarana modern untuk menunjang proses pembelajaran kejuruan yang berkualitas."
              />
              <ul className="space-y-3">
                {fasilitas.map((item, i) => (
                  <motion.li
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                    className="flex items-center gap-3 text-slate-600"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-3xl overflow-hidden shadow-xl border border-slate-200"
            >
              <img
                src={heroImage}
                alt="Fasilitas SMKN 5"
                className="w-full h-80 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section id="kontak-sekolah" className="py-24 bg-slate-100">
        <div className={containerClass}>
          <SectionHeading label="Hubungi Kami" title="Kontak Sekolah" />
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {kontakItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 p-6 text-center shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1">{item.title}</h4>
                <p className="text-slate-600 text-xs leading-relaxed">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-50">
        <div className={containerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-500" />
            <div className="relative px-8 py-16 sm:px-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Tertarik bergabung dengan SMKN 5?
                </h2>
                <p className="text-emerald-50/80 max-w-lg text-sm">
                  Pelajari informasi pendaftaran peserta didik baru pada halaman SPMB.
                </p>
              </div>
              <button
                onClick={handleSpmbClick}
                className="inline-flex items-center gap-2 bg-amber-300 text-emerald-950 font-semibold px-8 py-4 rounded-full hover:bg-amber-200 transition-colors text-sm shrink-0"
              >
                Buka Informasi SPMB <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className={`${containerClass} text-center text-slate-500 text-xs`}>
          © {new Date().getFullYear()} SMKN 5 Bandar Lampung. Halaman profil sekolah.
        </div>
      </footer>
    </div>
  );
};

export default ProfileSekolahPage;
