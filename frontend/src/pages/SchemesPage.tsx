// src/pages/SchemesPage.tsx
// Browse all uploaded government scheme PDFs with status and details

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import type { SchemeOverview } from '../types';

// Extended scheme type with details shown on this page
interface SchemeDetail extends SchemeOverview {
  ministry?: string;
  description?: string;
  benefitAmount?: string;
  isActive?: boolean;
  createdAt?: string;
  totalChunks?: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  uploaded:   { label: '⏳ Queued',     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  processing: { label: '⚙️ Processing', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  completed:  { label: '✅ Ready',       color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  failed:     { label: '❌ Failed',      color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'   },
};

const SchemesPage: React.FC = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<SchemeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'uploaded' | 'failed'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/schemes');
      if (res.data.success) {
        setSchemes(res.data.schemes || []);
      }
    } catch {
      toast.error('Failed to load schemes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemes(); }, []);

  // Poll processing schemes every 5s
  useEffect(() => {
    const hasProcessing = schemes.some(s => s.processingStatus === 'processing' || s.processingStatus === 'uploaded');
    if (!hasProcessing) return;
    const interval = setInterval(fetchSchemes, 5000);
    return () => clearInterval(interval);
  }, [schemes]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/schemes/${id}`);
      toast.success('Scheme deleted');
      setSchemes(prev => prev.filter(s => s._id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReprocess = async (id: string) => {
    setReprocessingId(id);
    try {
      await api.post(`/schemes/${id}/reprocess`);
      toast.success('Reprocessing started!');
      await fetchSchemes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reprocess failed');
    } finally {
      setReprocessingId(null);
    }
  };

  const filtered = schemes.filter(s => {
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.shortName?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || s.processingStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const countByStatus = (status: string) => schemes.filter(s => s.processingStatus === status).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📄 Government Schemes</h1>
            <p className="text-gray-500 text-sm mt-1">
              All uploaded scheme PDFs — {schemes.length} total, {countByStatus('completed')} ready
            </p>
          </div>
          <Link
            to="/upload-scheme"
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl
                      text-sm font-semibold hover:bg-green-700 transition-colors shadow-md
                      shadow-green-200"
          >
            📤 Upload New Scheme
          </Link>
        </motion.div>

        {/* Status Summary Chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-2"
        >
          {(['all', 'completed', 'processing', 'uploaded', 'failed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                        ${filter === status
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}
            >
              {status === 'all' ? `All (${schemes.length})` :
               status === 'completed' ? `✅ Ready (${countByStatus('completed')})` :
               status === 'processing' ? `⚙️ Processing (${countByStatus('processing')})` :
               status === 'uploaded' ? `⏳ Queued (${countByStatus('uploaded')})` :
               `❌ Failed (${countByStatus('failed')})`}
            </button>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schemes by name..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl
                      focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none
                      text-sm shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm"
          >
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {search ? 'No schemes match your search' : 'No schemes uploaded yet'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {search
                ? 'Try a different keyword'
                : 'Upload government scheme PDFs to start checking eligibility'}
            </p>
            {!search && (
              <Link
                to="/upload-scheme"
                className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-xl
                          text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                📤 Upload First Scheme
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filtered.map((scheme, i) => {
                const status = statusConfig[scheme.processingStatus] || statusConfig.uploaded;
                const isDeleting = deletingId === scheme._id;
                const isReprocessing = reprocessingId === scheme._id;

                return (
                  <motion.div
                    key={scheme._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md
                              transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Card Header */}
                    <div className={`p-4 border-b ${status.border} ${status.bg}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm leading-snug truncate">
                            {scheme.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">{scheme.shortName}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap
                                        flex-shrink-0 border ${status.color} ${status.bg} ${status.border}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 space-y-3">
                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {scheme.totalPages && (
                          <span className="flex items-center gap-1">
                            📃 <strong className="text-gray-700">{scheme.totalPages}</strong> pages
                          </span>
                        )}
                        {scheme.totalChunks && (
                          <span className="flex items-center gap-1">
                            🧩 <strong className="text-gray-700">{scheme.totalChunks}</strong> chunks
                          </span>
                        )}
                      </div>

                      {/* Processing indicator */}
                      {(scheme.processingStatus === 'processing' || scheme.processingStatus === 'uploaded') && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                          <div className="flex items-center gap-2 text-xs text-blue-700">
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            AI is reading this PDF...
                          </div>
                          <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full animate-pulse w-2/3" />
                          </div>
                        </div>
                      )}

                      {/* Failed state */}
                      {scheme.processingStatus === 'failed' && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-600">
                          PDF processing failed. You can reprocess it.
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="border-t border-gray-100 p-3 flex items-center gap-2">
                      {scheme.processingStatus === 'completed' ? (
                        <>
                          <Link
                            to={`/schemes/${scheme._id}`}
                            className="flex-1 text-center py-2 bg-green-600 text-white rounded-lg
                                      text-xs font-semibold hover:bg-green-700 transition-colors"
                          >
                            View Details →
                          </Link>
                          <button
                            onClick={() => navigate(`/check-eligibility?scheme=${scheme._id}`)}
                            className="flex-1 text-center py-2 bg-green-50 text-green-700 rounded-lg
                                      text-xs font-semibold hover:bg-green-100 transition-colors border
                                      border-green-200"
                          >
                            🔍 Check Me
                          </button>
                        </>
                      ) : scheme.processingStatus === 'failed' ? (
                        <button
                          onClick={() => handleReprocess(scheme._id)}
                          disabled={isReprocessing}
                          className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-xs
                                    font-semibold hover:bg-orange-600 transition-colors
                                    disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isReprocessing ? (
                            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Retrying...</>
                          ) : '🔄 Retry Processing'}
                        </button>
                      ) : (
                        <div className="flex-1 py-2 text-center text-xs text-gray-400">
                          Waiting for AI to process...
                        </div>
                      )}

                      <button
                        onClick={() => handleDelete(scheme._id, scheme.name)}
                        disabled={isDeleting}
                        className="p-2 text-gray-300 hover:text-red-400 transition-colors
                                  disabled:opacity-50 rounded-lg hover:bg-red-50"
                        title="Delete scheme"
                      >
                        {isDeleting ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : '🗑️'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Refresh button */}
        {!loading && (
          <div className="text-center">
            <button
              onClick={fetchSchemes}
              className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              🔄 Refresh List
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SchemesPage;
