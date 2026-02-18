// src/services/twilioService.ts

import twilio from 'twilio';

/**
 * ═══════════════════════════════════════════════════════
 * TWILIO SMS SERVICE
 * Purpose: Send OTP via SMS to users' phone numbers
 * ═══════════════════════════════════════════════════════
 * 
 * HOW IT WORKS:
 * 
 * 1. Import this service in authController
 * 2. Call sendOTPViaSMS(phone, otp)
 * 3. Function formats phone number to E.164 (+91xxxxxxxxxx)
 * 4. Sends SMS using Twilio API
 * 5. Returns success/failure
 * 
 * WHAT IS TWILIO?
 * - Cloud communication platform
 * - Provides APIs to send SMS, make calls, etc.
 * - Like a middleman between your app and mobile networks
 * 
 * WHAT IS E.164 FORMAT?
 * - International phone number standard
 * - Format: +[country code][phone number]
 * - Example: +919876543210 for Indian number
 * 
 * ═══════════════════════════════════════════════════════
 */

// ────────────────────────────────────────────────────────
// Initialize Twilio Client
// ────────────────────────────────────────────────────────
// Think of this as "logging into Twilio"
// We use ACCOUNT_SID (username) and AUTH_TOKEN (password)

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create Twilio client (this is like your "connection" to Twilio)
let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
} else {
    console.warn('⚠️  Twilio credentials not found. SMS sending will be disabled.');
}


/**
 * ────────────────────────────────────────────────────────
 * HELPER FUNCTION: Format Indian phone to E.164
 * ────────────────────────────────────────────────────────
 * 
 * INPUT:  "9876543210" or "919876543210" or "+919876543210"
 * OUTPUT: "+919876543210"
 * 
 * WHY? Twilio requires phone numbers in international format
 */
const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with 91 and is 12 digits total (919876543210)
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return `+${cleaned}`;
    }

    // If it's 10 digits (9876543210), add +91
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }

    // If already has + at the start, return as is
    if (phone.startsWith('+')) {
        return phone;
    }

    // Default: assume it needs +91
    return `+91${cleaned}`;
};


/**
 * ════════════════════════════════════════════════════════
 * MAIN FUNCTION: Send OTP via SMS
 * ════════════════════════════════════════════════════════
 * 
 * @param phone - User's phone number (any format)
 * @param otp - 6-digit OTP code
 * @returns Promise<boolean> - true if sent successfully
 * 
 * PROCESS:
 * 1. Check if Twilio is configured
 * 2. Format phone number to E.164
 * 3. Create SMS message body
 * 4. Send via Twilio API
 * 5. Handle success/errors
 * 
 * ERRORS HANDLED:
 * - Missing Twilio credentials
 * - Invalid phone number
 * - Network errors
 * - Twilio API errors
 */
export const sendOTPViaSMS = async (
    phone: string,
    otp: string
): Promise<boolean> => {
    try {
        // ── Check 1: Is Twilio configured? ──
        if (!twilioClient || !twilioPhoneNumber) {
            console.error('❌ Twilio not configured. Cannot send SMS.');
            console.log('💡 Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env');
            return false;
        }

        // ── Step 2: Format phone number ──
        const formattedPhone = formatPhoneNumber(phone);
        console.log(`📱 Sending OTP to: ${formattedPhone}`);

        // ── Step 3: Create message ──
        const messageBody = `Your NitiSetu verification code is: ${otp}\n\nValid for 5 minutes.\n\nDo not share this code with anyone.`;

        // ── Step 4: Send SMS via Twilio ──
        const message = await twilioClient.messages.create({
            body: messageBody,
            from: twilioPhoneNumber,  // Your Twilio number
            to: formattedPhone,       // User's phone number
        });

        // ── Step 5: Check status ──
        if (message.sid) {
            console.log(`✅ SMS sent successfully! SID: ${message.sid}`);
            console.log(`   Status: ${message.status}`);
            return true;
        } else {
            console.error('❌ Failed to send SMS: No message SID returned');
            return false;
        }

    } catch (error: any) {
        // ── Error Handling ──
        console.error('❌ Twilio SMS Error:', error.message);

        // Specific error messages for common issues
        if (error.code === 21211) {
            console.error('   → Invalid phone number format');
        } else if (error.code === 21608) {
            console.error('   → Phone number is not verified (trial account)');
            console.log('   💡 Add this number to Verified Caller IDs in Twilio');
        } else if (error.code === 20003) {
            console.error('   → Authentication failed. Check your credentials.');
        }

        return false;
    }
};


/**
 * ════════════════════════════════════════════════════════
 * DEVELOPMENT HELPER: Mock SMS sending
 * ════════════════════════════════════════════════════════
 * 
 * In development, you might not want to send real SMS
 * This function just logs the OTP instead
 * 
 * USE CASE: Testing without using Twilio credits
 */
export const sendOTPMock = async (
    phone: string,
    otp: string
): Promise<boolean> => {
    console.log('\n📱 ════ MOCK SMS (Development Mode) ════');
    console.log(`   To: ${phone}`);
    console.log(`   OTP: ${otp}`);
    console.log('═══════════════════════════════════════\n');
    return true;
};


/**
 * ════════════════════════════════════════════════════════
 * SMART FUNCTION: Auto-choose real or mock based on env
 * ════════════════════════════════════════════════════════
 * 
 * Development → Mock (console log)
 * Production → Real SMS via Twilio
 */
export const sendOTP = async (
    phone: string,
    otp: string
): Promise<boolean> => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        console.log('🔧 Development mode: Using mock SMS');
        return sendOTPMock(phone, otp);
    } else {
        console.log('🚀 Production mode: Using Twilio SMS');
        return sendOTPViaSMS(phone, otp);
    }
};


/**
 * ════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ════════════════════════════════════════════════════════
 * 
 * sendOTP() ────────→ Recommended (auto-selects based on env)
 * sendOTPViaSMS() ──→ Force real Twilio SMS
 * sendOTPMock() ────→ Force mock (console only)
 */
