// src/pages/ProfileSetupPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StepIndicator from '../components/profile/StepIndicator';
import VoiceProfileInput from '../components/profile/VoiceProfileInput';
import { indianStates, getDistricts, commonCrops } from '../utils/indianStates';

// ──────────────────────────────────────
// PROFILE SETUP PAGE
//
// Multi-step form with voice input option
// Steps: Personal → Location → Farm → Financial
//
// Two modes:
// 1. Voice mode: Speak → AI extracts → Pre-fill form → Confirm
// 2. Form mode: Fill step by step
// ──────────────────────────────────────

// ── Form steps configuration ──
const steps = [
  { number: 1, title: 'Personal', icon: '👤' },
  { number: 2, title: 'Location', icon: '📍' },
  { number: 3, title: 'Farm', icon: '🌾' },
  { number: 4, title: 'Financial', icon: '💰' },
];

// ── Initial form state ──
const initialFormData = {
  name: '',
  age: '',
  gender: '',
  socialCategory: '',
  aadhaarLast4: '',
  state: '',
  district: '',
  block: '',
  village: '',
  landHolding: '',
  landType: '',
  cropTypes: [] as string[],
  annualIncome: '',
  hasBankAccount: false,
  hasKCC: false,
};

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, hasProfile, refreshProfile } = useAuth();

  // ── State ──
  const [mode, setMode] = useState<'choose' | 'voice' | 'form'>('choose');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);

  // ── Pre-fill form if profile exists ──
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        socialCategory: profile.socialCategory || '',
        aadhaarLast4: profile.aadhaarLast4 || '',
        state: profile.state || '',
        district: profile.district || '',
        block: profile.block || '',
        village: profile.village || '',
        landHolding: profile.landHolding?.toString() || '',
        landType: profile.landType || '',
        cropTypes: profile.cropTypes || [],
        annualIncome: profile.annualIncome || '',
        hasBankAccount: profile.hasBankAccount || false,
        hasKCC: profile.hasKCC || false,
      });
      if (profile.state) {
        setDistricts(getDistricts(profile.state));
      }
      setMode('form');
    }
  }, [profile]);

  // ── Update districts when state changes ──
  useEffect(() => {
    if (formData.state) {
      setDistricts(getDistricts(formData.state));
      // Reset district if state changed
      if (formData.district && !getDistricts(formData.state).includes(formData.district)) {
        setFormData((prev) => ({ ...prev, district: '' }));
      }
    }
  }, [formData.state]);

  // ── Helpers ──
  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCrop = (crop: string) => {
    setFormData((prev) => ({
      ...prev,
      cropTypes: prev.cropTypes.includes(crop)
        ? prev.cropTypes.filter((c) => c !== crop)
        : [...prev.cropTypes, crop],
    }));
  };

  // ── Handle voice data ──
  const handleVoiceData = (data: Record<string, any>) => {
    const updated = { ...formData };

    if (data.name) updated.name = data.name;
    if (data.age) updated.age = data.age.toString();
    if (data.gender) updated.gender = data.gender;
    if (data.socialCategory) updated.socialCategory = data.socialCategory;
    if (data.state) updated.state = data.state;
    if (data.district) updated.district = data.district;
    if (data.village) updated.village = data.village;
    if (data.landHolding) updated.landHolding = data.landHolding.toString();
    if (data.landType) updated.landType = data.landType;
    if (data.cropTypes) updated.cropTypes = data.cropTypes;
    if (data.annualIncome) updated.annualIncome = data.annualIncome;
    if (data.hasBankAccount !== undefined) updated.hasBankAccount = data.hasBankAccount;
    if (data.hasKCC !== undefined) updated.hasKCC = data.hasKCC;

    setFormData(updated);

    if (updated.state) {
      setDistricts(getDistricts(updated.state));
    }

    setMode('form');
    setCurrentStep(1);
  };

  // ── Save profile ──
  const handleSave = async () => {
    // Validate required fields
    if (!formData.name.trim()) return toast.error('Name is required');
    if (!formData.socialCategory) return toast.error('Social category is required');
    if (!formData.state) return toast.error('State is required');
    if (!formData.district) return toast.error('District is required');
    if (!formData.landHolding || parseFloat(formData.landHolding) < 0) {
      return toast.error('Valid land holding is required');
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        socialCategory: formData.socialCategory,
        aadhaarLast4: formData.aadhaarLast4 || undefined,
        state: formData.state,
        district: formData.district,
        block: formData.block || undefined,
        village: formData.village || undefined,
        landHolding: parseFloat(formData.landHolding),
        landType: formData.landType || undefined,
        cropTypes: formData.cropTypes,
        annualIncome: formData.annualIncome || undefined,
        hasBankAccount: formData.hasBankAccount,
        hasKCC: formData.hasKCC,
        createdVia: mode === 'voice' ? 'voice' : 'form',
      };

      if (hasProfile) {
        await api.put('/profile', payload);
        toast.success('Profile updated successfully! 🎉');
      } else {
        await api.post('/profile', payload);
        toast.success('Profile created successfully! 🎉');
      }

      await refreshProfile();
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── Navigation ──
  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">

      {/* ── Sticky top bar with back button ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-green-700
                       hover:text-green-800 transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏛️</span>
            <span className="font-bold text-green-800 text-sm">NitiSetu</span>
          </div>
          <div className="w-24" />{/* spacer for centering */}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {hasProfile ? '✏️ Update Your Profile' : '👤 Set Up Your Profile'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {hasProfile
              ? 'Update your details for better scheme matching'
              : 'Tell us about yourself to find eligible schemes'}
          </p>
        </div>

        {/* Mode Chooser */}
        <AnimatePresence mode="wait">
          {mode === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-lg border border-green-100 p-8"
            >
              <h2 className="text-lg font-semibold text-gray-800 text-center mb-6">
                How would you like to enter your details?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Voice Option */}
                <button
                  onClick={() => setMode('voice')}
                  className="p-6 rounded-xl border-2 border-purple-200 bg-purple-50
                           hover:border-purple-400 hover:bg-purple-100 transition-all
                           text-center group"
                >
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                    🎤
                  </div>
                  <h3 className="font-semibold text-purple-800 mb-1">
                    Speak Your Details
                  </h3>
                  <p className="text-xs text-purple-600">
                    Say your details in Hindi or English. AI will extract them automatically.
                  </p>
                  <span className="inline-block mt-3 px-3 py-1 text-xs bg-purple-200
                                text-purple-800 rounded-full">
                    ✨ Recommended
                  </span>
                </button>

                {/* Form Option */}
                <button
                  onClick={() => setMode('form')}
                  className="p-6 rounded-xl border-2 border-green-200 bg-green-50
                           hover:border-green-400 hover:bg-green-100 transition-all
                           text-center group"
                >
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                    📝
                  </div>
                  <h3 className="font-semibold text-green-800 mb-1">
                    Fill Form Manually
                  </h3>
                  <p className="text-xs text-green-600">
                    Step-by-step form to enter your personal, location, and farm details.
                  </p>
                  <span className="inline-block mt-3 px-3 py-1 text-xs bg-green-200
                                text-green-800 rounded-full">
                    Traditional
                  </span>
                </button>
              </div>

              {/* Skip Button */}
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full mt-6 text-sm text-gray-400 hover:text-gray-600
                         transition-colors"
              >
                Skip for now →
              </button>
            </motion.div>
          )}

          {/* Voice Mode */}
          {mode === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-lg border border-green-100 p-6"
            >
              <VoiceProfileInput
                onProfileExtracted={handleVoiceData}
                onSwitchToForm={() => setMode('form')}
              />
            </motion.div>
          )}

          {/* Form Mode */}
          {mode === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-lg border border-green-100 p-6"
            >
              {/* Step Indicator */}
              <StepIndicator steps={steps} currentStep={currentStep} />

              {/* Step 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">👤 Personal Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="number"
                        min="18"
                        max="120"
                        value={formData.age}
                        onChange={(e) => updateField('age', e.target.value)}
                        placeholder="Age"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => updateField('gender', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Social Category *
                    </label>
                    <select
                      value={formData.socialCategory}
                      onChange={(e) => updateField('socialCategory', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Category</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC (Other Backward Classes)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="Minority">Minority</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Location Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">📍 Location Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select State</option>
                      {indianStates.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <select
                      value={formData.district}
                      onChange={(e) => updateField('district', e.target.value)}
                      disabled={!formData.state}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none
                               disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {formData.state ? 'Select District' : 'Select state first'}
                      </option>
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                      <input
                        type="text"
                        value={formData.block}
                        onChange={(e) => updateField('block', e.target.value)}
                        placeholder="Block / Taluka"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                      <input
                        type="text"
                        value={formData.village}
                        onChange={(e) => updateField('village', e.target.value)}
                        placeholder="Village name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Farm Details */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">🌾 Farm Details</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Land Holding (Acres) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.landHolding}
                        onChange={(e) => updateField('landHolding', e.target.value)}
                        placeholder="e.g., 3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                      {formData.landHolding && (
                        <p className="text-xs text-gray-500 mt-1">
                          = {(parseFloat(formData.landHolding) * 0.4047).toFixed(2)} hectares
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Land Type
                      </label>
                      <select
                        value={formData.landType}
                        onChange={(e) => updateField('landType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select Type</option>
                        <option value="Irrigated">Irrigated</option>
                        <option value="Rainfed">Rainfed</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                  </div>

                  {/* Crop Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Crops You Grow (Select multiple)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {commonCrops.slice(0, 20).map((crop) => (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => toggleCrop(crop)}
                          className={`px-3 py-1.5 text-xs rounded-full font-medium
                                    transition-colors border
                                    ${formData.cropTypes.includes(crop)
                                      ? 'bg-green-500 text-white border-green-500'
                                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                                    }`}
                        >
                          {formData.cropTypes.includes(crop) ? '✓ ' : ''}
                          {crop}
                        </button>
                      ))}
                    </div>
                    {formData.cropTypes.length > 0 && (
                      <p className="text-xs text-green-600 mt-2">
                        Selected: {formData.cropTypes.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Financial Details */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">💰 Financial Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Income
                    </label>
                    <select
                      value={formData.annualIncome}
                      onChange={(e) => updateField('annualIncome', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Income Range</option>
                      <option value="Below 2L">Below ₹2,00,000</option>
                      <option value="2L-5L">₹2,00,000 - ₹5,00,000</option>
                      <option value="5L-10L">₹5,00,000 - ₹10,00,000</option>
                      <option value="Above 10L">Above ₹10,00,000</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    {/* Bank Account */}
                    <label className="flex items-center gap-3 p-3 rounded-lg border
                                   border-gray-200 hover:border-green-300 cursor-pointer
                                   transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.hasBankAccount}
                        onChange={(e) => updateField('hasBankAccount', e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">🏦 Bank Account</span>
                        <p className="text-xs text-gray-500">
                          Do you have a bank account? (Required for most schemes)
                        </p>
                      </div>
                    </label>

                    {/* KCC */}
                    <label className="flex items-center gap-3 p-3 rounded-lg border
                                   border-gray-200 hover:border-green-300 cursor-pointer
                                   transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.hasKCC}
                        onChange={(e) => updateField('hasKCC', e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          💳 Kisan Credit Card (KCC)
                        </span>
                        <p className="text-xs text-gray-500">
                          Do you have a KCC?
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Profile Summary */}
                  <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">📋 Profile Summary</h4>
                    <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium text-gray-800">{formData.name || '—'}</span>
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium text-gray-800">
                        {formData.district && formData.state
                          ? `${formData.district}, ${formData.state}`
                          : '—'}
                      </span>
                      <span className="text-gray-500">Land:</span>
                      <span className="font-medium text-gray-800">
                        {formData.landHolding ? `${formData.landHolding} acres` : '—'}
                      </span>
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium text-gray-800">
                        {formData.socialCategory || '—'}
                      </span>
                      <span className="text-gray-500">Crops:</span>
                      <span className="font-medium text-gray-800">
                        {formData.cropTypes.length > 0 ? formData.cropTypes.join(', ') : '—'}
                      </span>
                      <span className="text-gray-500">Income:</span>
                      <span className="font-medium text-gray-800">
                        {formData.annualIncome || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={currentStep === 1 ? () => setMode('choose') : prevStep}
                  className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg
                           hover:bg-gray-200 transition-colors"
                >
                  ← {currentStep === 1 ? 'Back' : 'Previous'}
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg
                             font-medium hover:bg-green-700 transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 text-sm bg-green-600 text-white rounded-lg
                             font-medium hover:bg-green-700 transition-colors
                             disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent
                                      rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>✅ {hasProfile ? 'Update Profile' : 'Save Profile'}</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileSetupPage;