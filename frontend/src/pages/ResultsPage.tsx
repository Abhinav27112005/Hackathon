import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import type { EligibilityResult } from '../types';

const ResultsPage: React.FC = () => {
  const { checkId } = useParams<{ checkId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      if (!checkId) return;
      try {
        // Backend route: GET /eligibility/:checkId  (NOT /eligibility/result/:checkId)
        const res = await api.get(`/eligibility/${checkId}`);
        if (res.data.success) {
          // Normalise: DB stores criterialMatched (typo) — support both spellings
          const raw = res.data.result;
          setResult({
            ...raw,
            criteriaMatched: raw.criteriaMatched ?? raw.criterialMatched ?? [],
          });
        } else {
          toast.error('Result not found');
          navigate('/dashboard');
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load result');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [checkId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
                     bg-gradient-to-br from-green-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent
                         rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading result...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isEligible = result.isEligible === 'eligible' || result.isEligible === 'likely_eligible';
  const headerGradient = {
    eligible: 'from-green-500 to-emerald-600',
    likely_eligible: 'from-blue-500 to-blue-600',
    not_eligible: 'from-red-500 to-rose-600',
    error: 'from-gray-500 to-gray-600',
  }[result.isEligible] || 'from-gray-500 to-gray-600';

  const statusEmoji = {
    eligible: '✅',
    likely_eligible: '🔵',
    not_eligible: '❌',
    error: '⚠️',
  }[result.isEligible] || '⚠️';

  const statusText = {
    eligible: 'You are Eligible!',
    likely_eligible: 'You are Likely Eligible',
    not_eligible: 'Not Eligible',
    error: 'Check Error',
  }[result.isEligible] || 'Unknown';

  // confidenceScore is stored as 0-100 in the DB (max: 100 in schema)
  // Guard: if somehow it comes as 0-1 decimal, scale it up
  const confidencePercent = result.confidenceScore > 1
    ? Math.round(result.confidenceScore)
    : Math.round(result.confidenceScore * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Big Status Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${headerGradient} rounded-3xl p-7 text-white shadow-xl`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-5xl mb-3">{statusEmoji}</div>
              <h1 className="text-2xl font-bold mb-1">{statusText}</h1>
              <p className="text-white/80 text-base">{result.schemeName}</p>
              {result.schemeShortName && (
                <span className="inline-block mt-2 text-xs px-3 py-1 bg-white/20
                               rounded-full font-medium">
                  {result.schemeShortName}
                </span>
              )}
            </div>

            {/* Confidence Meter */}
            <div className="flex-shrink-0 text-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke="white" strokeOpacity="0.3" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke="white" strokeWidth="2.5"
                    strokeDasharray={`${confidencePercent} ${100 - confidencePercent}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{confidencePercent}%</span>
                </div>
              </div>
              <p className="text-white/70 text-xs mt-1">Confidence</p>
            </div>
          </div>

          {/* Benefit & Time */}
          <div className="mt-5 flex flex-wrap gap-3">
            {result.benefitAmount && (
              <div className="bg-white/15 rounded-xl px-4 py-2.5 text-sm">
                <div className="text-white/70 text-xs mb-0.5">Benefit Amount</div>
                <div className="font-bold">{result.benefitAmount}</div>
              </div>
            )}
            <div className="bg-white/15 rounded-xl px-4 py-2.5 text-sm">
              <div className="text-white/70 text-xs mb-0.5">Check Time</div>
              <div className="font-bold">{result.responseTimeMs}ms</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2.5 text-sm">
              <div className="text-white/70 text-xs mb-0.5">AI Model</div>
              <div className="font-bold text-xs">{result.llmModel}</div>
            </div>
          </div>
        </motion.div>

        {/* ── AI Reasoning ── */}
        {result.reasoning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🤖 AI Analysis
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {result.reasoning}
            </p>
          </motion.div>
        )}

        {/* ── Criteria Matched ── */}
        {result.criteriaMatched && result.criteriaMatched.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📊 Criteria Analysis ({result.criteriaMatched.filter(c => c.isMatch).length}/
              {result.criteriaMatched.length} matched)
            </h2>
            <div className="space-y-2">
              {result.criteriaMatched.map((c, i) => (
                <div key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm
                            ${c.isMatch
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-red-50 border border-red-200'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center
                                  text-xs font-bold flex-shrink-0
                                  ${c.isMatch ? 'bg-green-500 text-white' : 'bg-red-400 text-white'}`}>
                    {c.isMatch ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${c.isMatch ? 'text-green-800' : 'text-red-800'}`}>
                      {c.criterion}
                    </div>
                    <div className="text-xs mt-0.5 text-gray-500">
                      Your value: <strong>{c.farmerValue}</strong>
                      {c.requiredValue && ` · Required: ${c.requiredValue}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Citations ── */}
        {result.citations && result.citations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-4">
              📜 Citations from Official Document
            </h2>
            <div className="space-y-3">
              {result.citations.map((c, i) => (
                <div key={i}
                  className={`p-3.5 rounded-xl border-l-4 text-sm
                            ${c.matchType === 'supports'
                              ? 'bg-green-50 border-green-500'
                              : 'bg-red-50 border-red-400'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                    ${c.matchType === 'supports'
                                      ? 'bg-green-200 text-green-800'
                                      : 'bg-red-200 text-red-800'}`}>
                      {c.matchType === 'supports' ? 'Supports' : 'Excludes'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Page {c.page} · {c.section}
                    </span>
                  </div>
                  <p className="text-gray-700 italic">"{c.text}"</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Next Steps ── */}
        {isEligible && result.nextSteps && result.nextSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-4">👣 How to Apply</h2>
            <ol className="space-y-3">
              {result.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-gray-700">
                  <span className="flex-shrink-0 w-7 h-7 bg-green-600 text-white rounded-full
                                  flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}

        {/* ── Required Documents ── */}
        {result.requiredDocuments && result.requiredDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-4">📁 Documents You'll Need</h2>
            <div className="flex flex-wrap gap-2">
              {result.requiredDocuments.map((doc, i) => (
                <span key={i}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 bg-blue-50
                           text-blue-700 rounded-xl border border-blue-200">
                  📋 {doc}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Footer Actions ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3 pb-8"
        >
          <Link
            to="/check-eligibility"
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold
                     hover:bg-green-700 transition-colors text-center text-sm"
          >
            🔍 Check Another Scheme
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-semibold
                     hover:bg-gray-50 border border-gray-200 transition-colors
                     text-center text-sm"
          >
            ← Dashboard
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default ResultsPage;