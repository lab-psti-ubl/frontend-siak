import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/school-hero.png';
import { useProfilSekolahPublic } from '../../hooks/useProfilSekolahPublic';
import { getActiveJenjangSync } from '../../utils/jenjangPendidikanUtils';
import LeafletMap from './LeafletMap';
import SectionHeading from './SectionHeading';
import { apiService } from '../../services/apiService';
import { LandingBerita, LandingPrestasi } from '../../types';
import { achievementItems, newsItems } from './content';

const containerClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const kompetensi = [
  { name: 'Teknik Komputer & Jaringan', desc: 'Membangun dan mengelola infrastruktur jaringan komputer modern.' },
  { name: 'Rekayasa Perangkat Lunak', desc: 'Pengembangan aplikasi web, mobile, dan sistem informasi.' },
  { name: 'Teknik Kendaraan Ringan Otomotif', desc: 'Perawatan & perbaikan kendaraan bermotor ringan.' },
  { name: 'Teknik Bisnis & Sepeda Motor', desc: 'Servis sepeda motor dan kewirausahaan bengkel.' },
  { name: 'Akuntansi & Keuangan Lembaga', desc: 'Pengelolaan keuangan, perpajakan, dan akuntansi.' },
  { name: 'Otomatisasi & Tata Kelola Perkantoran', desc: 'Administrasi kantor modern berbasis digital.' },
];

const fasilitas = [
  'Ruang kelas representatif dengan media digital',
  'Laboratorium komputer & jaringan berstandar industri',
  'Bengkel praktik otomotif & mesin',
  'Perpustakaan & ruang literasi digital',
  'Masjid & area kegiatan keagamaan',
  'Lapangan olahraga & ruang ekstrakurikuler',
];

type MarqueeProps = {
  durationSeconds?: number;
  gap?: string;
  children: React.ReactNode;
};

const Marquee: React.FC<MarqueeProps> = ({ durationSeconds = 30, gap = '20px', children }) => {
  return (
    <div className="marquee">
      <div
        className="marquee__track"
        style={{
          ['--marquee-duration' as any]: `${durationSeconds}s`,
          ['--marquee-gap' as any]: gap,
        }}
      >
        <div className="marquee__group">{children}</div>
        <div className="marquee__group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
};

const BerandaProfileSekolah: React.FC = () => {
  const { profilSekolah } = useProfilSekolahPublic();
  const activeJenjang = getActiveJenjangSync();
  const shouldShowKompetensi = activeJenjang !== 'SD' && activeJenjang !== 'SMP';
  const [beritaItems, setBeritaItems] = useState<LandingBerita[]>(() => newsItems as any);
  const [prestasiItems, setPrestasiItems] = useState<LandingPrestasi[]>(() => achievementItems as any);

  useEffect(() => {
    const load = async () => {
      try {
        const [beritaRes, prestasiRes] = await Promise.all([
          apiService.getLandingBeritaPublic(),
          apiService.getLandingPrestasiPublic(),
        ]);

        setBeritaItems(beritaRes.success && beritaRes.berita ? beritaRes.berita : (newsItems as any));
        setPrestasiItems(prestasiRes.success && prestasiRes.prestasi ? prestasiRes.prestasi : (achievementItems as any));
      } catch (e) {
        console.error(e);
        setBeritaItems(newsItems as any);
        setPrestasiItems(achievementItems as any);
      }
    };

    load();
  }, []);

  const kontakItems = useMemo(
    () => [
      { icon: MapPin, title: 'Alamat', value: profilSekolah?.alamat || 'Alamat sekolah belum diatur' },
      { icon: Phone, title: 'Telepon', value: profilSekolah?.nomorTelepon || '-' },
      { icon: Mail, title: 'Email', value: profilSekolah?.email || '-' },
    ],
    [profilSekolah]
  );

  // Duplikat ke 3 card jika data hanya 1 item, supaya marquee terlihat rapi dan tidak terputus
  const beritaForMarquee = useMemo(
    () => (beritaItems.length === 1 ? [...beritaItems, ...beritaItems, ...beritaItems] : beritaItems),
    [beritaItems]
  );
  const prestasiForMarquee = useMemo(
    () => (prestasiItems.length === 1 ? [...prestasiItems, ...prestasiItems, ...prestasiItems] : prestasiItems),
    [prestasiItems]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO */}
      <section className="relative min-h-[78vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt={profilSekolah?.namaSekolah || 'Sekolah'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/85 to-emerald-700/70" />
        </div>

        <div className={`relative ${containerClass} pt-28 pb-16`}>
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
              <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase bg-white/10 text-emerald-50 px-4 py-1.5 rounded-full border border-white/20">
                {profilSekolah?.namaSekolah || 'Profil Sekolah'}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08]">
                Selamat datang di <span className="text-amber-300">{profilSekolah?.namaSekolah || 'Sekolah Kami'}</span>
              </h1>
              <p className="text-emerald-50/80 text-lg max-w-xl leading-relaxed">
                {profilSekolah?.deskripsi ||
                  'Pendidikan kejuruan modern yang terhubung dengan dunia usaha dan industri, membantu peserta didik melangkah yakin menuju masa depan.'}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/profile-sekolah/berita"
                  className="inline-flex items-center gap-2 bg-amber-400 text-emerald-950 font-semibold px-6 py-3 rounded-full hover:bg-amber-300 transition-colors text-sm shadow-md shadow-amber-500/40"
                >
                  Lihat Berita <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/profile-sekolah/tentang"
                  className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 font-medium px-6 py-3 rounded-full hover:bg-white/15 transition-colors text-sm"
                >
                  Tentang Kami <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 space-y-6 shadow-2xl">
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
                <div className="pt-2 border-t border-white/15 text-sm text-emerald-50/80">
                  Jelajahi profil sekolah, berita, dan prestasi terbaru.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRESTASI (di atas Sekilas) */}
      <section className="py-12 bg-slate-50">
        <div className={containerClass}>
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <div className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-700">Prestasi</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">Prestasi Terbaru</h2>
            </div>
            <Link
              to="/profile-sekolah/prestasi"
              className="hidden sm:inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800"
            >
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur px-3 py-4">
            {prestasiItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-600">Belum ada prestasi.</div>
            ) : (
              <Marquee durationSeconds={26}>
                {prestasiForMarquee.slice(0, 6).map((item, i) => (
                  <div key={`${item.id}-${i}`} className="w-[320px] sm:w-[380px] shrink-0">
                    <Link
                      to={`/profile-sekolah/prestasi/${item.id}`}
                      className="group flex items-stretch rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-[60px] sm:w-[70px] shrink-0 overflow-hidden bg-slate-100">
                        <img
                          src={item.imageUrl || heroImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5 flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 line-clamp-2">{item.title}</div>
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                          <span>{new Date(item.date).toLocaleDateString('id-ID')}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-700">{item.level || 'Prestasi'}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </Marquee>
            )}
          </div>

          <div className="sm:hidden mt-6">
            <Link
              to="/profile-sekolah/prestasi"
              className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800"
            >
              Lihat semua prestasi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SEKILAS + PETA (layout seperti contoh) */}
      <section className="py-16 bg-white">
        <div className={containerClass}>
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Sekilas Tentang Sekolah</h2>
              <p className="text-slate-600 leading-relaxed mt-4 max-w-xl">
                {profilSekolah?.deskripsi ||
                  'Sekolah kami merupakan wadah strategis untuk meningkatkan kompetensi, profesionalisme, serta kualitas pembelajaran melalui kegiatan kolaborasi dan pengembangan bersama.'}
              </p>
              <div className="mt-6">
                <Link
                  to="/profile-sekolah/tentang"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm"
                >
                  Pelajari Selengkapnya
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="rounded-2xl overflow-hidden border border-slate-200 shadow-md"
            >
              <LeafletMap
                lat={profilSekolah?.latitude}
                lng={profilSekolah?.longitude}
                popupTitle={profilSekolah?.namaSekolah || 'Lokasi Sekolah'}
                popupSubtitle={profilSekolah?.alamat}
                heightClassName="h-64 sm:h-72"
                className="rounded-none border-0"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* BERITA (CARD ANIMASI GESER KIRI) */}
      <section className="py-20 bg-slate-100 overflow-hidden">
        <div className={containerClass}>
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-700">Berita</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3">Info & Update Terbaru</h2>
              <p className="text-slate-600 mt-3 max-w-2xl">
                Ringkasan berita dan informasi sekolah. Klik “selengkapnya” untuk melihat detail.
              </p>
            </div>
            <Link to="/profile-sekolah/berita" className="hidden sm:inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800">
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur px-3 py-4"
          >
            {beritaItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-600">Belum ada berita.</div>
            ) : (
              <Marquee durationSeconds={30}>
                {beritaForMarquee.slice(0, 8).map((item, i) => (
                  <div key={`${item.id}-${i}`} className="w-[300px] sm:w-[360px] shrink-0">
                    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                      <div className="w-full aspect-[16/8] shrink-0 overflow-hidden bg-slate-100">
                        <img
                          src={item.imageUrl || heroImage}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-6">
                        <div className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('id-ID')}</div>
                        <div className="font-bold text-slate-900 mt-2 line-clamp-2">{item.title}</div>
                        <div className="text-sm text-slate-600 mt-2 line-clamp-3">{item.excerpt}</div>
                        <Link
                          to={`/profile-sekolah/berita/${item.id}`}
                          className="mt-4 inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800 text-sm"
                        >
                          Selengkapnya <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </Marquee>
            )}
          </motion.div>

          <div className="sm:hidden mt-6">
            <Link to="/profile-sekolah/berita" className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800">
              Lihat semua berita <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* KOMPETENSI KEAHLIAN (hanya SMA/SMK) */}
      {shouldShowKompetensi ? (
        <section className="py-20 bg-slate-50">
          <div className={containerClass}>
            <SectionHeading
              label="Program Keahlian"
              title="Kompetensi Keahlian"
              description="Kompetensi keahlian yang dirancang untuk mencetak lulusan siap kerja dan siap berwirausaha."
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
                  className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mt-2">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FASILITAS PENDUKUNG */}
      <section className="py-20 bg-slate-100">
        <div className={containerClass}>
          <SectionHeading
            label="Fasilitas"
            title="Fasilitas Pendukung"
            description="Sarana dan prasarana untuk menunjang proses pembelajaran yang berkualitas."
          />
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white">
              <img src={heroImage} alt="Fasilitas sekolah" className="w-full h-72 object-cover" />
            </div>
            <div className="rounded-3xl bg-white border border-slate-200 p-7 shadow-sm">
              <ul className="space-y-3">
                {fasilitas.map((item, i) => (
                  <motion.li
                    key={item}
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
          </div>
        </div>
      </section>

      {/* HUBUNGI KAMI */}
      <section className="py-20 bg-slate-50">
        <div className={containerClass}>
          <SectionHeading label="Hubungi Kami" title="Kontak Sekolah" description="Kami siap membantu informasi yang kamu butuhkan." />
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {kontakItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm"
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

      {/* TERTARIK GABUNG */}
      <section className="py-16 bg-slate-50">
        <div className={containerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-500" />
            <div className="relative px-8 py-14 sm:px-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Tertarik gabung?</h2>
                <p className="text-emerald-50/80 max-w-lg text-sm">
                  Pelajari informasi pendaftaran peserta didik baru pada halaman SPMB.
                </p>
              </div>
              <Link
                to="/informasi-spmb"
                className="inline-flex items-center gap-2 bg-amber-300 text-emerald-950 font-semibold px-8 py-4 rounded-full hover:bg-amber-200 transition-colors text-sm shrink-0"
              >
                Buka Informasi SPMB <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BerandaProfileSekolah;

