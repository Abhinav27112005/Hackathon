// src/pages/UploadSchemePage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import type { SchemeOverview } from '../types';

const UploadSchemePage: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [schemes, setSchemes] = useState<SchemeOverview[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    ministry: '',
    description: '',
    benefitAmount: '',
  });

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/schemes');
      if (res.data.success) setSchemes(res.data.schemes || []);
    } catch {
      /* silent */
    } finally {
      setLoadingSchemes(false);
    }
  };

  useEffect(() => { fetchSchemes(); }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('Only PDF files are allowed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select a PDF file');
    if (!formData.name.trim()) return toast.error('Scheme name is required');
    if (!formData.shortName.trim()) return toast.error('Short name is required');

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('pdfFile', selectedFile);   // must match upload.single('pdfFile') in schemeRoutes.ts
      payload.append('name', formData.name.trim());
      payload.append('shortName', formData.shortName.trim());
      if (formData.ministry) payload.append('ministry', formData.ministry);
      if (formData.description) payload.append('description', formData.description);
      if (formData.benefitAmount) payload.append('benefitAmount', formData.benefitAmount);

      const res = await api.post('/schemes/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Scheme uploaded! AI processing started in background.');
        setSelectedFile(null);
        setFormData({ name: '', shortName: '', ministry: '', description: '', benefitAmount: '' });
        if (fileRef.current) fileRef.current.value = '';
        await fetchSchemes();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const statusBadge: Record<string, { label: string; className: string }> = {
    uploaded: { label: '⏳ Uploaded', className: 'bg-yellow-100 text-yellow-700' },
    processing: { label: '⚙️ Processing', className: 'bg-blue-100 text-blue-700 animate-pulse' },
    completed: { label: '✅ Ready', className: 'bg-green-100 text-green-700' },
    failed: { label: '❌ Failed', className: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-800">Upload Government Scheme PDF</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload official scheme documents. AI will read them and extract eligibility criteria automatically.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Upload Form ── */}
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleUpload}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"
          >
            <h2 className="font-semibold text-gray-800">📄 Scheme Details</h2>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                        transition-all duration-200
                        ${dragActive
                          ? 'border-green-500 bg-green-50'
                          : selectedFile
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="mt-2 text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📤</div>
                  <p className="text-sm font-medium text-gray-700">
                    Drag & drop a PDF or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Only PDF files, max 50MB</p>
                </>
              )}
            </div>

            {/* Scheme Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="PM Kisan Samman Nidhi"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Short Name *
                </label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  placeholder="PM-KISAN"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ministry / Department
              </label>
              <input
                type="text"
                value={formData.ministry}
                onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                placeholder="Ministry of Agriculture"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Benefit Amount
              </label>
              <input
                type="text"
                value={formData.benefitAmount}
                onChange={(e) => setFormData({ ...formData, benefitAmount: e.target.value })}
                placeholder="₹6,000 per year"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this scheme..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none
                         resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold
                       hover:bg-green-700 transition-colors disabled:opacity-50
                       flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent
                                rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                '📤 Upload & Start AI Processing'
              )}
            </button>
          </motion.form>

          {/* ── Existing Schemes List ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">
                📚 Uploaded Schemes ({schemes.length})
              </h2>
              <button
                onClick={fetchSchemes}
                className="text-xs text-green-600 hover:text-green-700"
              >
                🔄 Refresh
              </button>
            </div>

            {loadingSchemes ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : schemes.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">No schemes uploaded yet.</p>
                <p className="text-xs mt-1">Upload your first scheme PDF!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {schemes.map((scheme) => {
                    const badge = statusBadge[scheme.processingStatus] || statusBadge.uploaded;
                    return (
                      <motion.div
                        key={scheme._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-xl border border-gray-100 hover:border-green-200
                                  hover:bg-green-50/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {scheme.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {scheme.shortName}
                              {scheme.totalPages && ` · ${scheme.totalPages} pages`}
                              {scheme.totalChunks && ` · ${scheme.totalChunks} chunks`}
                            </p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                                         whitespace-nowrap flex-shrink-0 ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default UploadSchemePage;