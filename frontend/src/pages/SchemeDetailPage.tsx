// src/pages/SchemeDetailPage.tsx
// Full detail view of a single scheme — stats, description, and direct eligibility check trigger

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import type { Scheme } from '../types';

const SchemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasProfile } = useAuth();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await api.get(`/schemes/${id}`);
        if (res.data.success) {
          setScheme(res.data.scheme);
        } else {
          toast.error('Scheme not found');
          navigate('/schemes');
        }
      } catch {
        toast.error('Failed to load scheme');
        navigate('/schemes');
      } finally {
        setLoading(false);
      }
    };
    fetch();

    // Poll if still processing
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/schemes/${id}/status`);
        if (res.data.status === 'completed' || res.data.status === 'failed') {
          clearInterval(interval);
          const res2 = await api.get(`/schemes/${id}`);
          if (res2.data.success) setScheme(res2.data.scheme);
        }
      } catch { /* silent */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, navigate]);

  const handleCheckEligibility = async () => {
    if (!hasProfile) {
      toast.error('Please complete your profile first!');
      navigate('/profile-setup');
      return;
    }
    if (!id) return;
    setChecking(true);
    try {
      toast.loading('AI is reading the scheme...', { id: 'check' });
      const res = await api.post('/eligibility/check', { schemeId: id });
      toast.success('Eligibility check complete!', { id: 'check' });
      if (res.data.success && res.data.result?._id) {
        navigate(`/results/${res.data.result._id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check failed', { id: 'check' });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent
                         rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading scheme details...</p>
        </div>
      </div>
    );
  }

  if (!scheme) return null;

  const isReady = scheme.processingStatus === 'completed';
  const isProcessing = scheme.processingStatus === 'processing' || scheme.processingStatus === 'uploaded';

  const statusColors = {
    uploaded:   'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    completed:  'bg-green-100 text-green-700',
    failed:     'bg-red-100 text-red-700',
  };
  const statusLabels = {
    uploaded:   '⏳ Queued',
    processing: '⚙️ Processing',
    completed:  '✅ Ready for AI Checks',
    failed:     '❌ Processing Failed',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/schemes" className="hover:text-green-600 transition-colors">📄 Schemes</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium truncate">{scheme.name}</span>
        </div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-6 text-white shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-4xl mb-3">📄</div>
              <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-1">{scheme.name}</h1>
              {scheme.shortName && (
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mt-1">
                  {scheme.shortName}
                </span>
              )}
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0
                            ${statusColors[scheme.processingStatus]}`}>
              {statusLabels[scheme.processingStatus]}
            </span>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Ministry', value: scheme.ministry || '—', icon: '🏛️' },
              { label: 'Benefit', value: scheme.benefitAmount || '—', icon: '💰' },
              { label: 'Pages', value: scheme.pdf?.totalPages?.toString() || '—', icon: '📃' },
              { label: 'AI Chunks', value: scheme.totalChunks?.toString() || '—', icon: '🧩' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/15 rounded-xl px-3 py-2.5">
                <div className="text-white/60 text-xs mb-0.5">{stat.icon} {stat.label}</div>
                <div className="font-bold text-sm truncate">{stat.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Processing State */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <h3 className="font-semibold text-blue-800">AI is processing this PDF...</h3>
            </div>
            <p className="text-sm text-blue-600 mb-3">
              Our AI is reading the scheme document, extracting eligibility criteria, and indexing
              it for fast queries. This usually takes 30–90 seconds.
            </p>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-blue-400 rounded-full animate-pulse" />
            </div>
          </motion.div>
        )}

        {/* Description */}
        {scheme.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-3">📝 About This Scheme</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{scheme.description}</p>
          </motion.div>
        )}

        {/* PDF Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="font-semibold text-gray-800 mb-4">📁 Document Information</h2>
          <div className="space-y-3">
            {[
              { label: 'Original File', value: scheme.pdf?.originalFileName || 'N/A' },
              { label: 'File Size', value: scheme.pdf?.fileSize ? `${(scheme.pdf.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A' },
              { label: 'Total Pages', value: scheme.pdf?.totalPages?.toString() || 'Processing...' },
              { label: 'AI Index Chunks', value: scheme.totalChunks?.toString() || 'Processing...' },
              { label: 'Uploaded On', value: scheme.createdAt ? new Date(scheme.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
              { label: 'Status', value: statusLabels[scheme.processingStatus] },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b
                                             border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{row.label}</span>
                <span className="text-sm font-medium text-gray-800">{row.value}</span>
              </div>
            ))}
          </div>

          {scheme.pdf?.cloudinaryUrl && (
            <a
              href={scheme.pdf.cloudinaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700
                        font-medium transition-colors"
            >
              🔗 View Original PDF →
            </a>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 pb-6"
        >
          <button
            onClick={handleCheckEligibility}
            disabled={!isReady || checking}
            className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-semibold
                      hover:bg-green-700 transition-colors disabled:opacity-50
                      disabled:cursor-not-allowed flex items-center justify-center gap-2
                      shadow-md shadow-green-200"
          >
            {checking ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking...</>
            ) : !isReady ? (
              '⏳ Waiting for Processing...'
            ) : (
              '🤖 Check My Eligibility'
            )}
          </button>
          <Link
            to="/schemes"
            className="flex-1 py-3.5 bg-white text-gray-700 rounded-xl font-semibold
                      hover:bg-gray-50 border border-gray-200 transition-colors text-center"
          >
            ← All Schemes
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default SchemeDetailPage;
