import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  if (isAuthenticated) {
    return <Navigate to='/profile-setup' replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ── Handle Registration ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (formData.phone.length !== 10) {
      toast.error('Enter valid 10-digit phone number');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const returnedOtp = await register(
        formData.name.trim(),
        formData.phone,
        formData.password || undefined
      );

      if (returnedOtp) {
        setDevOtp(returnedOtp);
        toast.success(`Registered! OTP: ${returnedOtp}`);
      } else {
        toast.success('Registered! OTP sent to your phone.');
      }

      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle OTP Verification ──
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.phone, otp);
      toast.success('Account verified! Let\'s set up your profile 🎉');
      navigate('/profile-setup');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50
                  flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl">🏛️</span>
            <span className="text-2xl font-bold text-green-800">Niti-Setu</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join to discover your scheme benefits</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">

          {/* Step 1: Registration Form */}
          {step === 'form' && (
            <form onSubmit={handleRegister}>
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  👤 Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-green-500 focus:border-transparent
                           outline-none"
                  required
                  autoFocus
                />
              </div>

              {/* Phone */}
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
                    name="phone"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg
                             focus:ring-2 focus:ring-green-500 focus:border-transparent
                             outline-none text-lg tracking-wider"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  🔑 Password <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters (or use OTP login)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-green-500 focus:border-transparent
                           outline-none"
                />
              </div>

              {/* Confirm Password (only if password entered) */}
              {formData.password && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    🔑 Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg
                             focus:ring-2 focus:ring-green-500 focus:border-transparent
                             outline-none"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium
                         hover:bg-green-700 transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  '📝 Create Account'
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-sm text-gray-600">
                  OTP sent to <strong>+91 {formData.phone}</strong>
                </p>
              </div>

              <div className="mb-4">
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
                    Dev OTP: <strong>{devOtp}</strong>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium
                         hover:bg-green-700 transition-colors disabled:opacity-50
                         flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  '✅ Verify & Continue'
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-medium hover:text-green-700">
              Login →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;