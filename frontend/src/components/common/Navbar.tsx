// src/components/common/Navbar.tsx
// Shared sticky navbar used across all authenticated pages

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { to: '/dashboard',        icon: '📊', label: 'Dashboard'   },
  { to: '/check-eligibility',icon: '🔍', label: 'Check'      },
  { to: '/schemes',          icon: '📄', label: 'Schemes'     },
  { to: '/applications',     icon: '📝', label: 'Applications'},
  { to: '/upload-scheme',    icon: '📤', label: 'Upload'      },
];

const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">🏛️</span>
          <span className="font-bold text-green-800 text-sm sm:text-base">Niti-Setu</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                          transition-all duration-150
                          ${active
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-500 hover:text-green-700 hover:bg-green-50'}`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* User info + profile */}
          <Link
            to="/profile-setup"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                       text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center
                           justify-center text-xs font-bold flex-shrink-0">
              {(user?.name?.charAt(0) || 'F').toUpperCase()}
            </span>
            <span className="max-w-24 truncate text-xs font-medium">
              {profile?.name || user?.name || 'Farmer'}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="hidden sm:block text-xs text-gray-400 hover:text-red-500
                      transition-colors px-2 py-1"
          >
            Logout
          </button>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1"
          >
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                            transition-colors
                            ${active
                              ? 'bg-green-100 text-green-700'
                              : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <Link
                to="/profile-setup"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-600"
              >
                ✏️ {profile?.name || user?.name || 'Edit Profile'}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
