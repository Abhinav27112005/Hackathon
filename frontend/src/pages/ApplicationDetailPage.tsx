// src/pages/ApplicationDetailPage.tsx
// Shows the auto-filled application form for a specific scheme application

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import type { Application } from '../types';

interface AutoFilledForm {
  applicantName?: string;
  fatherName?: string;
  dateOfBirth?: string;
  gender?: string;
  category?: string;
  aadhaarNumber?: string;
  mobileNumber?: string;
  address?: {
    village?: string;
    block?: string;
    district?: string;
    state?: string;
    pinCode?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };
  landDetails?: {
    surveyNumber?: string;
    area?: string;
    landType?: string;
    cropSeason?: string;
  };
  declaration?: string;
  [key: string]: any;
}

interface ApplicationDetailData {
  application: Application;
  form: AutoFilledForm;
  schemeName: string;
  schemeShortName: string;
}

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ApplicationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await api.get(`/application/${id}/form`);
        if (res.data.success) {
          setData(res.data);
        } else {
          toast.error('Application not found');
          navigate('/applications');
        }
      } catch {
        toast.error('Failed to load application');
        navigate('/applications');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await api.put(`/application/${id}`, { status: 'submitted' });
      toast.success('Application submitted! 🎉');
      navigate('/applications');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent
                         rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your auto-filled form...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { form, application, schemeName } = data;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const FormSection = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center gap-2">
        <span>{icon}</span>
        <h3 className="font-semibold text-green-800 text-sm">{title}</h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">
        {value || <span className="text-gray-300 font-normal italic">Not provided</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 print:py-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 print:hidden">
          <Link to="/applications" className="hover:text-green-600">📝 Applications</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium truncate">{schemeName}</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white
                     print:bg-green-600"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-green-100 text-xs mb-1">Auto-Filled Application Form</p>
              <h1 className="text-xl font-bold">{schemeName}</h1>
              {data.schemeShortName && (
                <span className="inline-block mt-1 px-3 py-0.5 bg-white/20 rounded-full text-xs">
                  {data.schemeShortName}
                </span>
              )}
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0
                            ${statusColors[application.status] || statusColors.draft}`}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
          </div>

          <div className="mt-4 flex gap-3 text-xs text-green-100">
            <span>Applied: {new Date(application.createdAt).toLocaleDateString('en-IN')}</span>
            {application.submittedAt && (
              <span>· Submitted: {new Date(application.submittedAt).toLocaleDateString('en-IN')}</span>
            )}
          </div>
        </motion.div>

        {/* Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 print:hidden"
        >
          <span className="text-xl">🤖</span>
          <div>
            <p className="text-sm font-medium text-blue-800">Auto-filled from your profile</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Review the details below carefully before submitting. Take this form to your nearest CSC / Gram Panchayat
              office along with original documents.
            </p>
          </div>
        </motion.div>

        {/* Form Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Personal Details */}
          <FormSection title="Personal Details" icon="👤">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <Field label="Full Name" value={form.applicantName} />
              <Field label="Father's Name" value={form.fatherName} />
              <Field label="Date of Birth" value={form.dateOfBirth} />
              <Field label="Gender" value={form.gender} />
              <Field label="Social Category" value={form.category} />
              <Field label="Aadhaar No." value={form.aadhaarNumber} />
              <Field label="Mobile Number" value={form.mobileNumber} />
            </div>
          </FormSection>

          {/* Address */}
          {form.address && (
            <FormSection title="Address Details" icon="📍">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <Field label="Village / Town" value={form.address.village} />
                <Field label="Block / Taluka" value={form.address.block} />
                <Field label="District" value={form.address.district} />
                <Field label="State" value={form.address.state} />
                <Field label="PIN Code" value={form.address.pinCode} />
              </div>
            </FormSection>
          )}

          {/* Land Details */}
          {form.landDetails && (
            <FormSection title="Land & Farm Details" icon="🌾">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <Field label="Survey Number" value={form.landDetails.surveyNumber} />
                <Field label="Total Area" value={form.landDetails.area} />
                <Field label="Land Type" value={form.landDetails.landType} />
                <Field label="Crop Season" value={form.landDetails.cropSeason} />
              </div>
            </FormSection>
          )}

          {/* Bank Details */}
          {form.bankDetails && (
            <FormSection title="Bank Account Details" icon="🏦">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <Field label="Account Number" value={form.bankDetails.accountNumber} />
                <Field label="IFSC Code" value={form.bankDetails.ifscCode} />
                <Field label="Bank Name" value={form.bankDetails.bankName} />
                <Field label="Branch" value={form.bankDetails.branchName} />
              </div>
            </FormSection>
          )}

          {/* Declaration */}
          {form.declaration && (
            <FormSection title="Declaration" icon="📜">
              <p className="text-xs text-gray-600 leading-relaxed italic">
                {form.declaration}
              </p>
              <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Signature of Applicant</span>
                <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </FormSection>
          )}

          {/* Raw data fallback — show any extra fields from AI form */}
          {Object.entries(form)
            .filter(([key]) => !['applicantName', 'fatherName', 'dateOfBirth', 'gender', 'category',
                                  'aadhaarNumber', 'mobileNumber', 'address', 'bankDetails',
                                  'landDetails', 'declaration'].includes(key))
            .filter(([, val]) => val && typeof val === 'string')
            .length > 0 && (
            <FormSection title="Additional Details" icon="📋">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {Object.entries(form)
                  .filter(([key]) => !['applicantName', 'fatherName', 'dateOfBirth', 'gender', 'category',
                                       'aadhaarNumber', 'mobileNumber', 'address', 'bankDetails',
                                       'landDetails', 'declaration'].includes(key))
                  .filter(([, val]) => val && typeof val === 'string')
                  .map(([key, val]) => (
                    <Field
                      key={key}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      value={val as string}
                    />
                  ))
                }
              </div>
            </FormSection>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 pb-8 print:hidden"
        >
          {application.status === 'draft' && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-semibold
                        hover:bg-green-700 transition-colors disabled:opacity-50
                        flex items-center justify-center gap-2 shadow-md shadow-green-200"
            >
              {submitting ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              ) : '📤 Mark as Submitted'}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex-1 py-3.5 bg-white text-gray-700 rounded-xl font-semibold
                      hover:bg-gray-50 border border-gray-200 transition-colors
                      flex items-center justify-center gap-2"
          >
            🖨️ Print / Save PDF
          </button>
          <Link
            to="/applications"
            className="flex-1 py-3.5 bg-white text-gray-700 rounded-xl font-semibold text-center
                      hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            ← All Applications
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default ApplicationDetailPage;
