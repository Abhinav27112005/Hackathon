// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// ── Pages ──
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashboardPage from './pages/DashboardPage';
import UploadSchemePage from './pages/UploadSchemePage';
import EligibilityCheckerPage from './pages/EligibilityCheckerPage';
import ResultsPage from './pages/ResultsPage';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* ══ PUBLIC ROUTES ══ */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ══ PROTECTED ROUTES ══ */}
          <Route path="/profile-setup" element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/upload-scheme" element={
            <ProtectedRoute>
              <UploadSchemePage />
            </ProtectedRoute>
          } />

          <Route path="/check-eligibility" element={
            <ProtectedRoute>
              <EligibilityCheckerPage />
            </ProtectedRoute>
          } />

          <Route path="/results/:checkId" element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          } />

          {/* ══ 404 ══ */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center
                          bg-gradient-to-br from-green-50 to-white">
              <div className="text-center">
                <h1 className="text-7xl font-bold text-gray-200">404</h1>
                <p className="text-gray-500 mt-3 text-lg">Page not found</p>
                <a
                  href="/"
                  className="inline-block mt-6 px-6 py-2 bg-green-600 text-white
                           rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go Home →
                </a>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;