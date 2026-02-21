// src/pages/ApplicationsPage.tsx
// View all scheme applications submitted by the user

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import type { Application } from '../types';

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  draft:     { label: 'Draft',     color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200',  icon: '📝' },
  submitted: { label: 'Submitted', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',  icon: '📤' },
  pending:   { label: 'Pending',   color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', icon: '⏳' },
  approved:  { label: 'Approved',  color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', icon: '✅' },
  rejected:  { label: 'Rejected',  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   icon: '❌' },
};

const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasProfile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Application['status']>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/application');
        if (res.data.success) {
          setApplications(res.data.applications || []);
        }
      } catch {
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  const count = (s: string) => applications.filter(a => a.status === s).length;

  const handleViewForm = async (appId: string) => {
    navigate(`/applications/${appId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📝 My Applications</h1>
            <p className="text-gray-500 text-sm mt-1">
              Track your scheme applications — {applications.length} total
            </p>
          </div>
          <Link
            to="/check-eligibility"
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl
                      text-sm font-semibold hover:bg-green-700 transition-colors shadow-md
                      shadow-green-200"
          >
            🔍 Check Eligibility
          </Link>
        </motion.div>

        {/* Profile Warning */}
        {!hasProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Complete your profile to apply for schemes</p>
              <Link to="/profile-setup" className="text-xs text-amber-600 underline">
                Set up profile →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Status Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-2"
        >
          {(['all', 'draft', 'submitted', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                        ${filter === status
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}
            >
              {status === 'all'
                ? `All (${applications.length})`
                : `${statusConfig[status].icon} ${statusConfig[status].label} (${count(status)})`}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"
          >
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {filter === 'all'
                ? 'Check your eligibility for a scheme and start an application.'
                : 'Try a different filter above.'}
            </p>
            {filter === 'all' && (
              <Link
                to="/check-eligibility"
                className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-xl
                          text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                🔍 Check Eligibility
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <AnimatePresence>
              {filtered.map((app, i) => {
                const status = statusConfig[app.status] || statusConfig.draft;

                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                              hover:shadow-md transition-shadow"
                  >
                    <div className={`flex items-start gap-4 p-5`}>
                      {/* Status Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                                      text-2xl flex-shrink-0 ${status.bg} border ${status.border}`}>
                        {status.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-sm leading-snug">
                              {app.schemeName}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">
                              {app.schemeShortName}
                            </p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap
                                          border ${status.color} ${status.bg} ${status.border}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>Applied: {new Date(app.createdAt).toLocaleDateString('en-IN')}</span>
                          {app.submittedAt && (
                            <span>Submitted: {new Date(app.submittedAt).toLocaleDateString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-50 px-5 py-3 flex items-center gap-3">
                      <button
                        onClick={() => handleViewForm(app._id)}
                        className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                      >
                        View Auto-Filled Form →
                      </button>
                      {app.status === 'draft' && (
                        <span className="text-xs text-gray-400">
                          Complete and submit your application
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Footer note */}
        {applications.length > 0 && (
          <p className="text-center text-xs text-gray-400 pb-4">
            Applications are auto-filled using your profile data. Review and submit at your nearest CSC centre.
          </p>
        )}
      </main>
    </div>
  );
};

export default ApplicationsPage;
