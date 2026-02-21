// src/pages/EligibilityCheckerPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import type { SchemeOverview, EligibilityResult } from '../types';

const EligibilityCheckerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasProfile } = useAuth();
  const [schemes, setSchemes] = useState<SchemeOverview[]>([]);
  const [selectedScheme, setSelectedScheme] = useState(searchParams.get('scheme') || '');
  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSchemes, setFetchingSchemes] = useState(true);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await api.get('/schemes');
        if (res.data.success) {
          // Only show schemes that have been processed
          const processed = (res.data.schemes || []).filter(
            (s: SchemeOverview) => s.processingStatus === 'completed'
          );
          setSchemes(processed);
          // Pre-select from URL param if scheme exists in list
          const paramId = searchParams.get('scheme');
          if (paramId && processed.some((s: SchemeOverview) => s._id === paramId)) {
            setSelectedScheme(paramId);
          }
        }
      } catch {
        toast.error('Failed to load schemes');
      } finally {
        setFetchingSchemes(false);
      }
    };
    fetchSchemes();
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasProfile) {
      toast.error('Complete your profile first!');
      navigate('/profile-setup');
      return;
    }
    if (!selectedScheme) {
      toast.error('Please select a scheme to check');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/eligibility/check', {
        schemeId: selectedScheme,
        question: customQuestion || undefined,
      });
      if (res.data.success) {
        // Normalise: DB field is 'criterialMatched' (typo in schema) — support both
        const raw = res.data.result;
        setResult({
          ...raw,
          criteriaMatched: raw.criteriaMatched ?? raw.criterialMatched ?? [],
        });
        toast.success('Eligibility check complete!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    eligible: 'from-green-500 to-emerald-600',
    likely_eligible: 'from-blue-500 to-blue-600',
    not_eligible: 'from-red-500 to-red-600',
    error: 'from-gray-500 to-gray-600',
  };
  const statusLabel: Record<string, string> = {
    eligible: '✅ You are Eligible!',
    likely_eligible: '🔵 Likely Eligible',
    not_eligible: '❌ Not Eligible',
    error: '⚠️ Check Error',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-800">Check Single Scheme Eligibility</h1>
          <p className="text-gray-500 text-sm mt-1">
            Select a scheme and our AI will read the official PDF to check if you qualify.
          </p>
        </motion.div>

        {/* No profile warning */}
        {!hasProfile && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex
                         items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Profile required</p>
              <Link to="/profile-setup" className="text-xs text-amber-600 underline">
                Complete your profile first →
              </Link>
            </div>
          </div>
        )}

        {/* Checker Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleCheck}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"
        >
          {/* Scheme Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📄 Select Scheme *
            </label>
            {fetchingSchemes ? (
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ) : schemes.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
                No processed schemes available.{' '}
                <Link to="/upload-scheme" className="text-green-600 underline">
                  Upload one →
                </Link>
              </div>
            ) : (
              <select
                value={selectedScheme}
                onChange={(e) => setSelectedScheme(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl
                         focus:ring-2 focus:ring-green-500 focus:border-transparent
                         outline-none bg-white"
              >
                <option value="">-- Choose a government scheme --</option>
                {schemes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.totalPages ?? '?'} pages)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Optional custom question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 Custom Question (optional)
            </label>
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="e.g., Do I qualify if I have 2 acres of rainfed land?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl
                       focus:ring-2 focus:ring-green-500 focus:border-transparent
                       outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank for a full eligibility check based on your profile.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedScheme || !hasProfile}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold
                     hover:bg-green-700 transition-colors disabled:opacity-50
                     flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
                AI is reading the scheme PDF...
              </>
            ) : (
              '🤖 Check My Eligibility'
            )}
          </button>
        </motion.form>

        {/* Result Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Status header */}
            <div className={`bg-gradient-to-r ${statusColor[result.isEligible] || statusColor.error}
                            p-6 text-white`}>
              <h2 className="text-xl font-bold mb-1">
                {statusLabel[result.isEligible] || '⚠️ Unknown'}
              </h2>
              <p className="text-white/80 text-sm">{result.schemeName}</p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span>Confidence: <strong>{result.confidenceScore > 1 ? Math.round(result.confidenceScore) : Math.round(result.confidenceScore * 100)}%</strong></span>
                {result.benefitAmount && (
                  <span>Benefit: <strong>{result.benefitAmount}</strong></span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Reasoning */}
              {result.reasoning && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 AI Reasoning</h3>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50
                               rounded-xl p-4">{result.reasoning}</p>
                </div>
              )}

              {/* Criteria matches */}
              {result.criteriaMatched && result.criteriaMatched.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    ✅ Criteria Matched
                  </h3>
                  <div className="space-y-2">
                    {result.criteriaMatched.map((c, i) => (
                      <div key={i} className={`flex items-center gap-3 text-xs p-2.5
                                             rounded-lg
                                             ${c.isMatch
                                               ? 'bg-green-50 text-green-700'
                                               : 'bg-red-50 text-red-700'}`}>
                        <span>{c.isMatch ? '✓' : '✗'}</span>
                        <span className="flex-1">{c.criterion}</span>
                        <span className="font-medium">{c.farmerValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next steps */}
              {result.nextSteps && result.nextSteps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">👣 Next Steps</h3>
                  <ol className="space-y-1.5">
                    {result.nextSteps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700
                                        rounded-full flex items-center justify-center
                                        text-xs font-bold">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Documents */}
              {result.requiredDocuments && result.requiredDocuments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    📁 Required Documents
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.requiredDocuments.map((doc, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 bg-blue-50
                                              text-blue-700 rounded-full border border-blue-200">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <Link to="/dashboard"
                  className="text-sm text-green-600 hover:text-green-700 font-medium">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default EligibilityCheckerPage;