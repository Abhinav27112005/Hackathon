import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import User from '../models/userModels';
import { AppError } from '../middleware/errorhandler';
import { sendOTP as sendOTPViaTwilio } from '../services/twilioService';

// ──────────────────────────────────────
// HELPER: Generate JWT Token
//
// JWT = JSON Web Token
// It's like a "pass" that proves who you are
//
// Contents: { userId: "abc123", role: "farmer" }
// Signed with: JWT_SECRET (only server knows this)
// Expires: 7 days (user has to login again after 7 days)
// ──────────────────────────────────────
const generateToken = (userId: string, role: string): string => {
    const secret = process.env.JWT_SECRET;
    const expire = process.env.JWT_EXPIRE || '7d';

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Type assertion needed due to TypeScript's limitation with jwt.sign overloads
    return jwt.sign({ userId, role }, secret as any, { expiresIn: expire } as any) as string;
};


// ──────────────────────────────────────
// HELPER: Generate 6-digit OTP
//
// Math.random() → 0.123456...
// × 900000 → 111110.4...
// + 100000 → 211110.4...
// Math.floor → 211110
// .toString → "211110"
//
// Result: Random number between 100000-999999
// ──────────────────────────────────────
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


// ──────────────────────────────────────
// HELPER: Format user response
//
// We don't want to send password, otp, or __v
// This creates a clean user object for responses
// ──────────────────────────────────────
const formatUserResponse = (user: any) => ({
    _id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    language: user.language,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
});


// ══════════════════════════════════════
// CONTROLLER 1: REGISTER
// POST /api/auth/register
//
// WHAT HAPPENS:
// 1. Get name, phone, password from request body
// 2. Check if phone already registered
// 3. Create new user in database
// 4. Generate OTP for verification
// 5. Generate JWT token
// 6. Return token + user data
//
// REQUEST BODY:
// {
//   "name": "Ramesh Kumar",
//   "phone": "9876543210",
//   "password": "test123"  (optional)
// }
//
// RESPONSE:
// {
//   "success": true,
//   "token": "eyJhb...",
//   "user": { _id, name, phone, role }
// }
// ══════════════════════════════════════
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name, phone, password, language } = req.body;

        // ── Check 1: Is phone already registered? ──
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'This phone number is already registered. Please login.',
            });
            return;
        }

        // ── Step 2: Create user in database ──
        const user = await User.create({
            name,
            phone,
            password,              // Will be hashed by pre-save hook
            language: language || 'en',
            role: 'farmer',
        });

        // ── Step 3: Generate OTP ──
        const otp = generateOTP();
        user.otp = {
            code: otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Valid for 5 minutes
        };
        await user.save();

        // ── Step 4: Send OTP via Twilio SMS ──
        // This will automatically use mock in development, real SMS in production
        const otpSent = await sendOTPViaTwilio(phone, otp);

        if (!otpSent) {
            console.warn('⚠️  SMS sending failed, but user is created. OTP logged in console.');
        }

        // Always log OTP in development for easy testing
        if (process.env.NODE_ENV === 'development') {
            console.log(`📱 OTP for ${phone}: ${otp}`);
        }

        // ── Step 5: Generate JWT token ──
        const token = generateToken(
            user._id.toString(),
            user.role
        );

        // ── Step 5: Send response ──
        res.status(201).json({
            success: true,
            message: 'Registration successful! Please verify OTP.',
            token,
            user: formatUserResponse(user),
            // Only return OTP in development mode (remove in production!)
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });

    } catch (error) {
        next(error);
    }
};


// ══════════════════════════════════════
// CONTROLLER 2: SEND OTP
// POST /api/auth/send-otp
//
// WHAT HAPPENS:
// 1. Get phone number
// 2. Find user with that phone
// 3. Generate new OTP
// 4. Save OTP to user document
// 5. Send OTP (via SMS in production)
//
// REQUEST BODY:
// { "phone": "9876543210" }
//
// RESPONSE:
// { "success": true, "message": "OTP sent" }
// ══════════════════════════════════════
export const sendOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { phone } = req.body;

        // ── Find user ──
        const user = await User.findOne({ phone });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'No account found with this phone number. Please register first.',
            });
            return;
        }

        // ── Generate and save OTP ──
        const otp = generateOTP();
        user.otp = {
            code: otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        };
        await user.save();

        // ── Send OTP via Twilio ──
        const otpSent = await sendOTPViaTwilio(phone, otp);

        if (!otpSent) {
            console.warn('⚠️  SMS sending failed. OTP logged in console.');
        }

        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📱 OTP for ${phone}: ${otp}`);
        }

        // ── Response ──
        res.json({
            success: true,
            message: 'OTP sent successfully to your phone',
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });

    } catch (error) {
        next(error);
    }
};


// ══════════════════════════════════════
// CONTROLLER 3: VERIFY OTP
// POST /api/auth/verify-otp
//
// WHAT HAPPENS:
// 1. Get phone + OTP from request
// 2. Find user and their stored OTP
// 3. Check if OTP matches
// 4. Check if OTP is not expired
// 5. Mark user as verified
// 6. Clear OTP from database
// 7. Generate JWT token
// 8. Return token + user data
//
// REQUEST BODY:
// { "phone": "9876543210", "otp": "123456" }
//
// RESPONSE:
// { "success": true, "token": "...", "user": {...} }
// ══════════════════════════════════════
export const verifyOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            res.status(400).json({
                success: false,
                message: 'Phone and OTP are required',
            });
            return;
        }

        // ── Find user WITH OTP fields ──
        // Remember: otp.code has select: false
        // So we need .select('+otp.code +otp.expiresAt') to include them
        const user = await User.findOne({ phone })
            .select('+otp.code +otp.expiresAt');

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        // ── Check 1: Does OTP exist? ──
        if (!user.otp || !user.otp.code) {
            res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new one.',
            });
            return;
        }

        // ── Check 2: Does OTP match? ──
        if (user.otp.code !== otp) {
            res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.',
            });
            return;
        }

        // ── Check 3: Is OTP expired? ──
        if (new Date() > user.otp.expiresAt) {
            res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.',
            });
            return;
        }

        // ── All checks passed! ──

        // Mark user as verified
        user.isVerified = true;

        // Clear OTP (one-time use)
        user.otp = undefined;

        // Update last login time
        user.lastLogin = new Date();

        await user.save();

        // Generate new token
        const token = generateToken(
            user._id.toString(),
            user.role
        );

        // ── Response ──
        res.json({
            success: true,
            message: 'OTP verified successfully! You are now logged in.',
            token,
            user: formatUserResponse(user),
        });

    } catch (error) {
        next(error);
    }
};


// ══════════════════════════════════════
// CONTROLLER 4: LOGIN WITH PASSWORD
// POST /api/auth/login
//
// Alternative login method using password
// (Some users prefer password over OTP)
//
// REQUEST BODY:
// { "phone": "9876543210", "password": "test123" }
// ══════════════════════════════════════
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { phone, password } = req.body;

        // ── Find user WITH password ──
        // We need .select('+password') because password has select: false
        const user = await User.findOne({ phone }).select('+password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid phone number or password',
            });
            return;
        }

        // ── Check if user has a password set ──
        if (!user.password) {
            res.status(400).json({
                success: false,
                message: 'No password set. Please use OTP login.',
            });
            return;
        }

        // ── Check password ──
        if (!password) {
            res.status(400).json({
                success: false,
                message: 'Password is required',
            });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid phone number or password',
            });
            return;
        }

        // ── Update last login ──
        user.lastLogin = new Date();
        await user.save();

        // ── Generate token ──
        const token = generateToken(user._id.toString(), user.role);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: formatUserResponse(user),
        });

    } catch (error) {
        next(error);
    }
};


// ══════════════════════════════════════
// CONTROLLER 5: GET ME (Current User)
// GET /api/auth/me
//
// Returns the currently logged-in user's data
// The 'protect' middleware already found the user
// and attached it to req.user
// ══════════════════════════════════════
export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // req.user is set by protect middleware
        const user = req.user!;

        res.json({
            success: true,
            user: formatUserResponse(user),
        });

    } catch (error) {
        next(error);
    }
};


// ══════════════════════════════════════
// CONTROLLER 6: LOGOUT
// POST /api/auth/logout
//
// JWT is stateless - server doesn't store tokens
// Logout = client deletes the token from localStorage
// This endpoint just confirms the action
// ══════════════════════════════════════
export const logout = async (
    req: Request,
    res: Response
): Promise<void> => {
    res.json({
        success: true,
        message: 'Logged out successfully. Please remove token from client.',
    });
};