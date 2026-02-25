// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithPassword, sendOTP, isAuthenticated } = useAuth();

  // ── State ──
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [loading, setLoading] = useState(false);
  const [usePasswordMode, setUsePasswordMode] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  // ── Redirect if already logged in ──
  if (isAuthenticated) {
    return <Navigate to='/dashboard' replace />;
  }

  // ── Handle Send OTP ──
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const returnedOtp = await sendOTP(phone);
      if (returnedOtp) {
        setDevOtp(returnedOtp);
        toast.success(`OTP sent! (Dev mode: ${returnedOtp})`);
      } else {
        toast.success('OTP sent to your phone!');
      }
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Verify OTP ──
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await login(phone, otp);
      toast.success('Login successful! 🎉');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Password Login ──
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(phone, password);
      toast.success('Login successful! 🎉');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50
                  flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* ── Logo & Title ── */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl">🏛️</span>
            <span className="text-2xl font-bold text-green-800">Niti-Setu</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Login to check your scheme eligibility</p>
        </div>

        {/* ── Demo Credentials Banner ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm">
          <p className="font-semibold text-amber-800 flex items-center gap-1 mb-2">
            🧪 Demo Account — Try it instantly!
          </p>
          <div className="space-y-1 text-amber-700 font-mono text-xs bg-amber-100 rounded-lg px-3 py-2">
            <p>📱 Phone: <strong>8210523688</strong></p>
            <p>🔑 Password: <strong>Test123</strong></p>
          </div>
          <div className="mt-3 text-xs text-amber-700 border-t border-amber-200 pt-2">
            <p className="font-medium mb-1">⚠️ OTP Login Note (Twilio Trial)</p>
            <p>
              OTP can only be sent to <strong>pre-verified numbers</strong> on our Twilio
              trial account. To use OTP on your own number, please contact the developer
              to get your number added.
            </p>
            <a
              href="mailto:abhinavkumarjha763@gmail.com"
              className="inline-flex items-center gap-1 mt-1.5 text-green-700 font-medium hover:underline"
            >
              ✉️ abhinavkumarjha763@gmail.com
            </a>
          </div>
        </div>

        {/* ── Login Card ── */}
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">

          {/* Step 1: Phone Number */}
          {step === 'phone' && (
            <form onSubmit={usePasswordMode ? handlePasswordLogin : handleSendOTP}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  📱 Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border
                                border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit number"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg
                             focus:ring-2 focus:ring-green-500 focus:border-transparent
                             outline-none text-lg tracking-wider"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password field (if in password mode) */}
              {usePasswordMode && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    🔑 Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg
                             focus:ring-2 focus:ring-green-500 focus:border-transparent
                             outline-none"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium
                         hover:bg-green-700 transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                    Please wait...
                  </>
                ) : usePasswordMode ? (
                  '🔑 Login with Password'
                ) : (
                  '📱 Send OTP'
                )}
              </button>

              {/* Toggle between OTP and Password */}
              <button
                type="button"
                onClick={() => setUsePasswordMode(!usePasswordMode)}
                className="w-full mt-3 text-sm text-green-600 hover:text-green-700
                         transition-colors"
              >
                {usePasswordMode
                  ? '📱 Use OTP instead'
                  : '🔑 Login with password instead'}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  🔢 Enter OTP sent to +91 {phone}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-green-500 focus:border-transparent
                           outline-none text-center text-2xl tracking-[0.5em] font-mono"
                  required
                  autoFocus
                />
                {devOtp && (
                  <p className="text-xs text-orange-500 mt-1.5 text-center">
                    Dev mode OTP: <strong>{devOtp}</strong>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium
                         hover:bg-green-700 transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  '✅ Verify OTP'
                )}
              </button>

              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Change number
                </button>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600">
            New farmer?{' '}
            <Link
              to="/register"
              className="text-green-600 font-medium hover:text-green-700
                       transition-colors"
            >
              Create Account →
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;