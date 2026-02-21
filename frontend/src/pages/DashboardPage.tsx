// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import type { DashboardData, EligibilityResult } from '../types';

// ── Sub-components ──────────────────────────────────────────

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}> = ({ icon, label, value, color, sub }) => (
  <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm
                  hover:shadow-md transition-shadow`}>
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center
                    justify-center text-xl mb-3`}>
      {icon}
    </div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
    <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    {sub && <div className="text-xs text-green-600 mt-1 font-medium">{sub}</div>}
  </div>
);

const SchemeCard: React.FC<{ result: EligibilityResult; detailed?: boolean }> = ({
  result,
  detailed = false,
}) => {
  const isEligible = result.isEligible === 'eligible' || result.isEligible === 'likely_eligible';
  const colorMap = {
    eligible: 'bg-green-100 text-green-700 border-green-200',
    likely_eligible: 'bg-blue-100 text-blue-700 border-blue-200',
    not_eligible: 'bg-red-100 text-red-700 border-red-200',
    error: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const badgeClass = colorMap[result.isEligible] || colorMap.error;
  const badge = {
    eligible: '✅ Eligible',
    likely_eligible: '🔵 Likely Eligible',
    not_eligible: '❌ Not Eligible',
    error: '⚠️ Error',
  }[result.isEligible];

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-200
                    ${isEligible
                      ? 'bg-green-50 border-green-200 hover:shadow-md'
                      : 'bg-gray-50 border-gray-200 hover:shadow-sm'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug">
          {result.schemeName}
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium
                        whitespace-nowrap flex-shrink-0 ${badgeClass}`}>
          {badge}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span>Confidence: <strong>{Math.round(result.confidenceScore * 100)}%</strong></span>
        {result.benefitAmount && (
          <span>• Benefit: <strong className="text-green-700">{result.benefitAmount}</strong></span>
        )}
      </div>

      {detailed && result.reasoning && (
        <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
          {result.reasoning}
        </p>
      )}

      <Link
        to={`/results/${result._id}`}
        className={`text-xs font-medium transition-colors
                  ${isEligible ? 'text-green-600 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
      >
        View Details →
      </Link>
    </div>
  );
};

// ── Main Dashboard ──────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, hasProfile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'eligible' | 'not_eligible'>('eligible');

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/dashboard/summary');
      if (res.data.success) {
        setData(res.data.data);
        setError(null);
      }
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setError('Failed to load your dashboard data. Please check your connection.');
        if (!silent) toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    // Re-fetch silently when user returns to this tab/page (e.g. after editing profile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboard(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDashboard]);

  const handleCheckAll = async () => {
    if (!hasProfile) {
      toast.error('Please complete your profile first!');
      navigate('/profile-setup');
      return;
    }
    setChecking(true);
    try {
      toast.loading('AI is checking all schemes...', { id: 'check-all' });
      const res = await api.post('/eligibility/check-all');
      toast.success(
        `Checked ${res.data.totalChecked || 0} schemes!`,
        { id: 'check-all', duration: 3000 }
      );
      await fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Eligibility check failed', { id: 'check-all' });
    } finally {
      setChecking(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
                     bg-gradient-to-br from-green-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent
                         rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  // ── Error state ──
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-sm px-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Couldn't load dashboard</h2>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => fetchDashboard()}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold
                        hover:bg-green-700 transition-colors text-sm"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const eligibleList = data?.eligibleSchemes || [];
  const notEligibleList = data?.notEligibleSchemes || [];
  const hasCheckedAnything = eligibleList.length > 0 || notEligibleList.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Welcome Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl
                     p-6 sm:p-8 text-white shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-center
                         sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                👋 Welcome, {user?.name?.split(' ')[0] || 'Farmer'}!
              </h1>
              <p className="text-green-100 text-sm">
                {hasProfile
                  ? `Profile ${profile?.profileCompleteness ?? 0}% complete · ${profile?.district}, ${profile?.state}`
                  : '⚠️ Complete your profile to check scheme eligibility'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {!hasProfile ? (
                <Link
                  to="/profile-setup"
                  className="px-5 py-2.5 bg-white text-green-700 rounded-xl text-sm
                           font-semibold hover:bg-green-50 transition-colors text-center"
                >
                  📝 Set Up Profile
                </Link>
              ) : (
                <button
                  onClick={handleCheckAll}
                  disabled={checking}
                  className="px-5 py-2.5 bg-white text-green-700 rounded-xl text-sm
                           font-semibold hover:bg-green-50 transition-colors
                           disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-600
                                    border-t-transparent rounded-full animate-spin" />
                      Checking...
                    </>
                  ) : (
                    '🤖 Check All Schemes'
                  )}
                </button>
              )}
              <Link
                to="/check-eligibility"
                className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm
                         font-semibold hover:bg-green-400 transition-colors
                         border border-green-400 text-center"
              >
                🔍 Single Check
              </Link>
            </div>
          </div>

          {/* Profile completeness bar */}
          {hasProfile && profile && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-green-200 mb-1">
                <span>Profile Completeness</span>
                <span>{profile.profileCompleteness}%</span>
              </div>
              <div className="h-2 bg-green-700/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.profileCompleteness}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Stat Cards ── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            icon="✅"
            label="Eligible Schemes"
            value={metrics?.eligibleCount ?? 0}
            color="bg-green-100"
            sub={metrics && metrics.eligibleCount > 0 ? "You qualify!" : undefined}
          />
          <StatCard
            icon="💰"
            label="Potential Benefit"
            value={metrics?.potentialBenefit ?? '₹0'}
            color="bg-yellow-100"
            sub="Estimated total"
          />
          <StatCard
            icon="📊"
            label="Total Checks Run"
            value={metrics?.totalChecks ?? 0}
            color="bg-blue-100"
          />
          <StatCard
            icon="📄"
            label="Scheme PDFs"
            value={metrics?.pdfsUploaded ?? 0}
            color="bg-purple-100"
            sub="Analyzed by AI"
          />
        </motion.div>

        {/* ── No profile / no checks state ── */}
        {!hasProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"
          >
            <div className="text-4xl mb-3">👤</div>
            <h3 className="font-semibold text-amber-800 mb-2">
              Complete your profile to get started
            </h3>
            <p className="text-sm text-amber-600 mb-4">
              We need your details (land, crops, state, category) to match you with schemes.
            </p>
            <Link
              to="/profile-setup"
              className="inline-block px-6 py-2.5 bg-amber-500 text-white rounded-xl
                       text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              📝 Set Up Profile Now
            </Link>
          </motion.div>
        )}

        {/* ── Results Section ── */}
        {hasProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {!hasCheckedAnything ? (
              // Empty state — no checks run yet
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Ready to check your eligibility?
                </h3>
                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                  Click "Check All Schemes" and our AI will go through every
                  government scheme PDF and find what you qualify for.
                </p>
                <button
                  onClick={handleCheckAll}
                  disabled={checking}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold
                           hover:bg-green-700 transition-colors disabled:opacity-50
                           flex items-center gap-2 mx-auto"
                >
                  {checking ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent
                                    rounded-full animate-spin" />
                      Checking all schemes...
                    </>
                  ) : (
                    '🤖 Check All My Schemes'
                  )}
                </button>
              </div>
            ) : (
              // Results tabs
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Tab headers */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab('eligible')}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative
                              ${activeTab === 'eligible'
                                ? 'text-green-700'
                                : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    ✅ Eligible ({eligibleList.length})
                    {activeTab === 'eligible' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('not_eligible')}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative
                              ${activeTab === 'not_eligible'
                                ? 'text-red-600'
                                : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    ❌ Not Eligible ({notEligibleList.length})
                    {activeTab === 'not_eligible' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                    )}
                  </button>
                </div>

                {/* Tab content */}
                <div className="p-5">
                  {activeTab === 'eligible' && (
                    eligibleList.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">
                        No eligible schemes found yet. Try running a check!
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {eligibleList.map((r) => (
                          <SchemeCard key={r._id} result={r} detailed />
                        ))}
                      </div>
                    )
                  )}
                  {activeTab === 'not_eligible' && (
                    notEligibleList.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">
                        All checked schemes show as eligible or pending!
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {notEligibleList.slice(0, 8).map((r) => (
                          <SchemeCard key={r._id} result={r} />
                        ))}
                      </div>
                    )
                  )}
                </div>

                <div className="border-t border-gray-100 p-4 text-center">
                  <button
                    onClick={handleCheckAll}
                    disabled={checking}
                    className="text-sm text-green-600 hover:text-green-700 font-medium
                             transition-colors disabled:opacity-50"
                  >
                    {checking ? '⏳ Checking...' : '🔄 Re-run all checks'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Quick Links ── */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { to: '/profile-setup',   icon: '👤', label: 'Edit Profile',  color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' },
            { to: '/check-eligibility',icon: '🔍', label: 'Check Scheme', color: 'border-green-200 hover:border-green-400 hover:bg-green-50' },
            { to: '/schemes',          icon: '📄', label: 'All Schemes',  color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50' },
            { to: '/applications',     icon: '📝', label: 'Applications', color: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-white
                        border transition-all duration-200 text-center ${link.color}`}
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-xs font-medium text-gray-700">{link.label}</span>
            </Link>
          ))}
        </motion.div>

      </main>
    </div>
  );
};

export default DashboardPage;