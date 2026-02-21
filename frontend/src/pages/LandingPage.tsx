// src/pages/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// ── Animation variants ──
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

// ── Data ──
const features = [
  {
    icon: '🎤',
    title: 'Voice-First Interface',
    desc: 'Speak in Hindi or English — our AI understands you and fills your profile automatically.',
    color: 'from-purple-500 to-purple-700',
  },
  {
    icon: '🤖',
    title: 'AI Eligibility Checker',
    desc: 'Powered by Gemini AI, we read scheme PDFs and instantly check if you qualify.',
    color: 'from-blue-500 to-blue-700',
  },
  {
    icon: '📄',
    title: '30+ Government Schemes',
    desc: 'From PM-KISAN to Fasal Bima Yojana — all major central and state schemes in one place.',
    color: 'from-green-500 to-green-700',
  },
  {
    icon: '🌐',
    title: 'Multilingual Support',
    desc: 'Available in Hindi, English, Marathi, and Tamil. Designed for every Indian farmer.',
    color: 'from-orange-500 to-orange-700',
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    desc: 'OTP-based login, no passwords needed. Your data stays safe with encrypted storage.',
    color: 'from-red-500 to-red-700',
  },
  {
    icon: '⚡',
    title: 'Instant Results',
    desc: 'Get eligibility decisions in seconds, with citations from official documents.',
    color: 'from-yellow-500 to-yellow-600',
  },
];

const stats = [
  { value: '30+', label: 'Govt. Schemes' },
  { value: '1M+', label: 'Farmers Targeted' },
  { value: '95%', label: 'Accuracy Rate' },
  { value: '<5s', label: 'Check Time' },
];

const howItWorks = [
  { step: '01', icon: '📱', title: 'Register', desc: 'Sign up with just your phone number — no email or password needed.' },
  { step: '02', icon: '🎤', title: 'Tell Us About Yourself', desc: 'Speak or fill a form with your name, land, crops, state, and category.' },
  { step: '03', icon: '🤖', title: 'AI Checks Eligibility', desc: 'Our AI reads official scheme PDFs and matches them with your profile.' },
  { step: '04', icon: '✅', title: 'Get Results', desc: 'See which schemes you qualify for, with benefit amounts and next steps.' },
];

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══ NAVBAR ══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
                       ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <span className="text-xl font-bold text-green-800">Niti-Setu</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2 bg-green-600 text-white rounded-full text-sm
                         font-medium hover:bg-green-700 transition-colors"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-green-700 font-medium
                           hover:text-green-800 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-green-600 text-white rounded-full text-sm
                           font-medium hover:bg-green-700 transition-colors"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══ HERO SECTION ══ */}
      <section className="relative min-h-screen flex items-center justify-center
                          bg-gradient-to-br from-green-50 via-white to-orange-50
                          overflow-hidden pt-16">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full
                         opacity-20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200 rounded-full
                         opacity-20 blur-3xl" />
        </div>

        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100
                           text-green-800 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              AI-Powered Scheme Eligibility Platform for Indian Farmers
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6 leading-tight"
          >
            Find Government{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r
                           from-green-600 to-emerald-500">
              Schemes
            </span>{' '}
            You Actually{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r
                           from-orange-500 to-amber-500">
              Qualify For
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Just speak your details in <strong>Hindi or English</strong>.
            Our AI reads official scheme documents and tells you exactly
            which benefits you're eligible for — in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center
                                                    justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="px-8 py-4 bg-green-600 text-white rounded-2xl text-lg font-semibold
                       hover:bg-green-700 transition-all duration-300 shadow-lg
                       shadow-green-200 hover:shadow-xl hover:-translate-y-0.5 transform"
            >
              🚀 Check Your Eligibility Free
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-white text-gray-700 rounded-2xl text-lg font-semibold
                       border border-gray-200 hover:border-green-300 hover:text-green-700
                       transition-all duration-300"
            >
              See How It Works ↓
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.p variants={fadeUp} className="mt-8 text-sm text-gray-400">
            ✓ Free forever &nbsp;&nbsp; ✓ No app download needed &nbsp;&nbsp;
            ✓ Works on any smartphone
          </motion.p>

          {/* Stats Row */}
          <motion.div
            variants={fadeUp}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6"
          >
            {stats.map((s) => (
              <div key={s.label} className="bg-white/80 backdrop-blur rounded-2xl
                                           p-4 shadow-sm border border-gray-100">
                <div className="text-3xl font-extrabold text-green-600">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══ FEATURES SECTION ══ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p variants={fadeUp}
              className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Why Niti-Setu?
            </motion.p>
            <motion.h2 variants={fadeUp}
              className="text-4xl font-bold text-gray-900">
              Everything a farmer needs
            </motion.h2>
            <motion.p variants={fadeUp}
              className="text-gray-500 mt-3 max-w-xl mx-auto">
              Built specifically for India's 150 million farm households —
              simple, fast, and completely free.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="p-6 rounded-2xl border border-gray-100 hover:border-green-200
                         hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color}
                               flex items-center justify-center text-2xl mb-4
                               shadow-md group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p variants={fadeUp}
              className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Simple Process
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-gray-900">
              Get results in 4 steps
            </motion.h2>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-16 left-[12%] right-[12%]
                           h-0.5 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
            >
              {howItWorks.map((step) => (
                <motion.div key={step.step} variants={fadeUp} className="text-center">
                  <div className="relative inline-flex">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-md border
                                   border-green-100 flex items-center justify-center
                                   text-3xl mx-auto mb-4">
                      {step.icon}
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-600
                                    text-white text-xs font-bold rounded-full flex
                                    items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ CTA SECTION ══ */}
      <section className="py-24 bg-gradient-to-br from-green-600 to-emerald-700">
        <motion.div
          className="max-w-3xl mx-auto px-4 text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp}
            className="text-4xl font-bold text-white mb-4">
            Don't miss benefits you deserve
          </motion.h2>
          <motion.p variants={fadeUp}
            className="text-green-100 text-lg mb-10">
            Thousands of farmers miss government benefits every year because they
            don't know what they qualify for. Don't be one of them.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="inline-block px-10 py-4 bg-white text-green-700 rounded-2xl
                       text-lg font-bold hover:bg-green-50 transition-all duration-300
                       shadow-xl hover:shadow-2xl hover:-translate-y-1 transform"
            >
              🌾 Start for Free — Check My Schemes
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-6 text-green-200 text-sm">
            No credit card. No app. Just your phone number.
          </motion.p>
        </motion.div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="py-10 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row
                       items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <span className="text-white font-bold">Niti-Setu</span>
            <span className="text-xs ml-2">
              AI-Powered Farmer Scheme Platform
            </span>
          </div>
          <div className="text-xs text-center">
            Built for NPTEL Hackathon 2026 · Problem Statement #3 ·{' '}
            <span className="text-green-400">Made with ❤️ for Indian Farmers</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;