import express from 'express';
import {
    register,
    sendOTP,
    verifyOTP,
    login,
    getMe,
    logout
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { phoneRules, registerRules, validate, verifyOTPRules } from '../middleware/validator';
const router = express.Router();

/**
 * ═══════════════════════════════════════════════════════
 * AUTHENTICATION ROUTES
 * ═══════════════════════════════════════════════════════
 * 
 * These routes handle user authentication flow:
 * 1. Registration (creates user + sends OTP)
 * 2. OTP verification (confirms phone ownership)
 * 3. Login (password-based auth)
 * 4. Profile access (get current user)
 * 5. Logout (client-side token deletion)
 */

// ──────────────────────────────────────────────────────
// PUBLIC ROUTES (No authentication required)
// ──────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Create new user account and send OTP
 * 
 * Body: { name, phone, password?, language? }
 * Response: { success, token, user, otp? }
 */
router.post('/register', authLimiter, registerRules, validate, register);

/**
 * POST /api/auth/send-otp
 * Resend OTP to existing user
 * 
 * Body: { phone }
 * Response: { success, message, otp? }
 */
router.post('/send-otp', authLimiter, phoneRules, validate, sendOTP);

/**
 * POST /api/auth/verify-otp
 * Verify OTP and mark user as verified
 * 
 * Body: { phone, otp }
 * Response: { success, token, user }
 */
router.post('/verify-otp', authLimiter, verifyOTPRules, validate, verifyOTP);

/**
 * POST /api/auth/login
 * Login with phone and password
 * 
 * Body: { phone, password }
 * Response: { success, token, user }
 */
router.post('/login', authLimiter, phoneRules, validate, login);

/**
 * POST /api/auth/logout
 * Logout (client should delete token)
 * 
 * Response: { success, message }
 */
router.post('/logout', protect, logout);

// ──────────────────────────────────────────────────────
// PROTECTED ROUTES (Authentication required)
// ──────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Get current user's profile
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success, user }
 */
router.get('/me', protect, getMe);

export default router;
