import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Megaphone,
  Shield,
  Upload,
  Users,
} from 'lucide-react';
import Button from '../components/ui/Button';

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: 'easeOut' as const },
  }),
};

const steps = [
  { icon: ClipboardList, title: 'Isi Formulir', desc: 'Lengkapi data diri dan informasi pendaftaran melalui sistem.' },
  { icon: Upload, title: 'Unggah Dokumen', desc: 'Upload ijazah, rapor, dan dokumen pendukung lainnya.' },
  { icon: Shield, title: 'Verifikasi & Seleksi', desc: 'Tim sekolah memverifikasi data dan melakukan seleksi.' },
  { icon: Megaphone, title: 'Pengumuman', desc: 'Hasil seleksi diumumkan dan peserta melakukan daftar ulang.' },
];

const faqs = [
  {
    q: 'Bagaimana jika dokumen belum lengkap?',
    a: 'Panitia akan memberikan arahan dan batas waktu pemenuhan dokumen sesuai kebijakan sekolah.',
  },
  {
    q: 'Di mana hasil seleksi diumumkan?',
    a: 'Melalui sistem SPMB ini dan kanal resmi sekolah.',
  },
  {
    q: 'Apakah data pendaftar aman?',
    a: 'Ya, data dijaga kerahasiaannya sesuai kebijakan perlindungan data sekolah.',
  },
];

const InformasiSpmbPage: React.FC = () => {
  const handleDaftarClick = () => {
    window.location.href = '/spmb';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero — clean & minimal */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.6) 0.5px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 text-xs text-slate-500 tracking-wide"
          >
            <span className="hover:text-slate-800 cursor-pointer transition-colors">
              Beranda
            </span>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-slate-900 font-medium">Informasi SPMB</span>
          </motion.nav>

          <motion.div initial="hidden" animate="visible" variants={fade} custom={0}>
            <p className="text-[0.65rem] sm:text-xs font-semibold tracking-[0.2em] uppercase text-emerald-600 mb-3">
              Penerimaan Peserta Didik Baru
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] mb-4">
              Informasi SPMB
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mb-8">
              Baca informasi mengenai tujuan, alur, dan ketentuan Seleksi Penerimaan Murid Baru sebelum
              melanjutkan ke formulir pendaftaran.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-10">
              <Button
                onClick={handleDaftarClick}
                className="flex items-center justify-center rounded-full gap-2 font-semibold text-sm px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Daftar Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleDaftarClick}
                className="rounded-full text-sm px-6 py-2.5 border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Lihat Formulir
              </Button>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-8 text-sm">
              {[
                { icon: Users, label: 'Kuota', value: '300 siswa (contoh)' },
                { icon: FileText, label: 'Jenjang', value: 'SMK' },
                { icon: Calendar, label: 'Metode', value: 'Online' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[0.65rem] text-slate-500 uppercase tracking-wider">
                      {s.label}
                    </div>
                    <div className="font-semibold text-sm text-slate-900">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-16">
        {/* Steps */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fade}
          custom={0}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900">Alur Pendaftaran</h2>
          <p className="text-sm text-slate-600 mb-8 max-w-xl">
            Empat langkah sederhana untuk menyelesaikan pendaftaran SPMB.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fade}
                custom={i + 1}
                className="bg-white p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">
                    {i + 1}/{steps.length}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1 text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Ketentuan */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fade}
          custom={0}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900">Ketentuan Umum</h2>
          <p className="text-sm text-slate-600 mb-6 max-w-xl">
            Hal penting yang perlu diperhatikan sebelum mendaftar.
          </p>
          <div className="space-y-3">
            {[
              'Data yang diisikan harus benar, akurat, dan dapat dipertanggungjawabkan.',
              'Pendaftaran hanya dilakukan pada periode SPMB yang aktif.',
              'Simpan bukti pendaftaran atau nomor registrasi dari sistem.',
              'Informasi biaya, jadwal, dan persyaratan mengikuti kebijakan sekolah.',
            ].map((item, i) => (
              <motion.div
                key={item}
                variants={fade}
                custom={i + 1}
                className="flex gap-3 items-start"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-600">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fade}
          custom={0}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900">Pertanyaan Umum</h2>
          <p className="text-sm text-slate-600 mb-6 max-w-xl">
            Jawaban atas pertanyaan yang sering diajukan.
          </p>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-slate-200 overflow-hidden bg-white"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200 flex-shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-600 bg-white">{faq.a}</div>
              </details>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fade}
          custom={0}
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h3 className="font-bold text-lg mb-1 text-slate-900">Siap mendaftar?</h3>
            <p className="text-sm text-slate-600">
              Lanjutkan ke formulir pendaftaran SPMB dan lengkapi data Anda.
            </p>
          </div>
          <Button
            onClick={handleDaftarClick}
            className="rounded-full gap-2 font-semibold flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 text-sm"
          >
            Buka Formulir
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.section>
      </div>
    </div>
  );
};

export default InformasiSpmbPage;

