# 📖 Complete Guide: Understanding Your Authentication System

## 🎯 Overview

Your NitiSetu backend now has a complete **phone-based authentication system** with **OTP verification** using Twilio SMS.

---

## 📁 File Structure

```
backend/src/
├── controllers/
│   └── authController.ts    ← Main authentication logic
├── services/
│   └── twilioService.ts      ← Twilio SMS integration
├── models/
│   └── userModels.ts         ← User database schema
├── routes/
│   └── authRoutes.ts         ← API endpoints
├── middleware/
│   └── auth.ts               ← JWT verification (protect)
└── app.ts                    ← Express app setup
```

---

## 🔄 Complete Authentication Flow

### **Flow 1: Registration with OTP**

```
┌─────────────┐
│   User      │
│  (Frontend) │
└──────┬──────┘
       │ 1. POST /api/auth/register
       │    { name, phone, password }
       ▼
┌─────────────────────────────────────┐
│  authController.register()          │
│  ─────────────────────────────────  │
│  ✓ Check if phone already exists    │
│  ✓ Create user in MongoDB           │
│  ✓ Hash password (automatic)        │
│  ✓ Generate 6-digit OTP              │
│  ✓ Save OTP to user.otp              │
│  ✓ Send SMS via Twilio               │
│  ✓ Generate JWT token                │
│  ✓ Return: { token, user, otp? }    │
└──────┬──────────────────────────────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────┐                   ┌──────────────┐
│   MongoDB   │                   │   Twilio     │
│  User saved │                   │  SMS sent    │
└─────────────┘                   └──────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ User's Phone │
                                  │  "OTP: 123456"│
                                  └──────────────┘
```

### **Flow 2: OTP Verification**

```
User receives SMS → Enters OTP in app
       │
       ▼
POST /api/auth/verify-otp
{ phone: "9876543210", otp: "123456" }
       │
       ▼
┌─────────────────────────────────┐
│  authController.verifyOTP()     │
│  ─────────────────────────────  │
│  ✓ Find user by phone           │
│  ✓ Check OTP exists             │
│  ✓ Check OTP matches            │
│  ✓ Check not expired (5 min)    │
│  ✗ If any check fails → Error   │
│  ✓ Mark user.isVerified = true  │
│  ✓ Clear OTP from database      │
│  ✓ Update lastLogin             │
│  ✓ Generate new JWT token       │
│  ✓ Return: { token, user }      │
└─────────────────────────────────┘
       │
       ▼
User is now authenticated! ✅
```

### **Flow 3: Login with Password (Alternative)**

```
POST /api/auth/login
{ phone: "9876543210", password: "test123" }
       │
       ▼
┌─────────────────────────────────┐
│  authController.login()         │
│  ─────────────────────────────  │
│  ✓ Find user (including password)│
│  ✓ Compare password with hash   │
│  ✓ Update lastLogin             │
│  ✓ Generate JWT token           │
│  ✓ Return: { token, user }      │
└─────────────────────────────────┘
```

---

## 🔐 How JWT Works

### What is JWT?

**JWT = JSON Web Token**

It's a secure way to prove who you are without storing sessions on the server.

```
JWT Structure:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWEyYiIsInJvbGUiOiJmYXJtZXIifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│                                     │                                    │
HEADER                               PAYLOAD                           SIGNATURE
(Algorithm: HS256)          (Data: {userId, role, exp})         (Signed with JWT_SECRET)
```

### How it works:

1. **User logs in** → Server creates JWT
2. **Frontend stores JWT** in localStorage
3. **Every API call** → Frontend sends: `Authorization: Bearer <token>`
4. **Server verifies** → Checks signature with JWT_SECRET
5. **If valid** → Allow access

### Why JWT?

- ✅ **Stateless**: Server doesn't store sessions
- ✅ **Scalable**: Works across multiple servers
- ✅ **Secure**: Can't be tampered (signature will fail)
- ✅ **Expiry**: Auto-expires after 7 days

---

## 📱 How OTP Works

### Step-by-Step OTP Process:

```
1. GENERATE OTP
   ─────────────
   Math.random() → 0.543821...
   × 900000      → 489438.9
   + 100000      → 589438.9
   Math.floor    → 589438
   .toString()   → "589438"

2. SAVE TO DATABASE
   ────────────────
   user.otp = {
     code: "589438",
     expiresAt: Date.now() + 5 minutes
   }

3. SEND VIA TWILIO
   ───────────────
   Your Backend → Twilio API → Mobile Network → User's Phone
   
   SMS Content:
   "Your NitiSetu verification code is: 589438
    Valid for 5 minutes.
    Do not share this code with anyone."

4. USER ENTERS OTP
   ───────────────
   Frontend sends { phone, otp: "589438" } to /verify-otp

5. SERVER VERIFIES
   ───────────────
   ✓ Does OTP exist?
   ✓ Does it match?
   ✓ Is it not expired?
   If all ✓ → Mark user as verified
```

---

## 🔧 Key Functions Explained

### `generateToken(userId, role)`

**Purpose**: Create a JWT token for authentication

```typescript
const token = generateToken("65a2b...", "farmer");
// Returns: "eyJhbGc..."

// Token contains:
{
  userId: "65a2b...",
  role: "farmer",
  iat: 1234567890,    // Issued at (timestamp)
  exp: 1234999999     // Expires at (7 days later)
}
```

### `generateOTP()`

**Purpose**: Create a random 6-digit number

```typescript
const otp = generateOTP();
// Returns: "123456" or "789012" etc.
// Always 6 digits (100000 to 999999)
```

### `formatPhoneNumber(phone)`

**Purpose**: Convert Indian phone to international format

```typescript
formatPhoneNumber("9876543210")    → "+919876543210"
formatPhoneNumber("919876543210")  → "+919876543210"
formatPhoneNumber("+919876543210") → "+919876543210"
```

### `sendOTPViaTwilio(phone, otp)`

**Purpose**: Send SMS using Twilio

```typescript
await sendOTPViaTwilio("9876543210", "123456");

// What happens:
// 1. Format phone to +919876543210
// 2. Create message body
// 3. Call Twilio API
// 4. Return true/false
```

---

## 🛡️ Security Features

### 1. **Password Hashing**

```typescript
// User enters: "test123"
// Stored in DB: "$2a$12$XkZ7WeD.../BqYjLQ2eXP1"
//               ↑ This is a bcrypt hash (irreversible)

// When user logs in:
bcrypt.compare("test123", storedHash) → true ✓
```

### 2. **OTP Expiry**

```typescript
expiresAt: new Date(Date.now() + 5 * 60 * 1000)
//                                 ↑
//                           5 minutes in milliseconds

// Check on verification:
if (new Date() > user.otp.expiresAt) {
  // OTP expired! User needs to request new one
}
```

### 3. **Selective Field Retrieval**

```typescript
// Default query (OTP hidden):
User.findOne({ phone })
// Returns: { name, phone, role } ❌ otp

// Explicit selection (OTP included):
User.findOne({ phone }).select('+otp.code')
// Returns: { name, phone, role, otp } ✓
```

### 4. **One-Time Use**

```typescript
// After successful verification:
user.otp = undefined;  // Clear OTP
await user.save();     // Can't be reused
```

---

## 🧪 Testing Your API

### Test 1: Register

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "password": "test123",
  "language": "hi"
}

Expected Response:
{
  "success": true,
  "message": "Registration successful! Please verify OTP.",
  "token": "eyJhbGc...",
  "user": {
    "_id": "65a2b...",
    "name": "Ramesh Kumar",
    "phone": "9876543210",
    "role": "farmer",
    "language": "hi",
    "isVerified": false
  },
  "otp": "123456"  // Only in development
}
```

### Test 2: Verify OTP

```bash
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}

Expected Response:
{
  "success": true,
  "message": "OTP verified successfully! You are now logged in.",
  "token": "eyJhbGc...",
  "user": {
    "_id": "65a2b...",
    "isVerified": true  ← Changed!
  }
}
```

### Test 3: Login

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "phone": "9876543210",
  "password": "test123"
}
```

### Test 4: Get Current User

```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer eyJhbGc...

Expected Response:
{
  "success": true,
  "user": { /* user data */ }
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "No overload matches this call" (JWT)

```typescript
❌ WRONG:
jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: ... })

✓ CORRECT:
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET not defined');
jwt.sign({ userId }, secret, { expiresIn: ... });
```

### Issue 2: "OTP not found" when verifying

```typescript
❌ WRONG:
const user = await User.findOne({ phone });

✓ CORRECT:
const user = await User.findOne({ phone })
  .select('+otp.code +otp.expiresAt');
//          ↑ Must explicitly include hidden fields
```

### Issue 3: Password not hashing

```typescript
Make sure in userModels.ts:

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;  ← Important!
  // Only hash when password is actually changed
});
```

---

## 📊 Database Schema Understanding

### User Document in MongoDB:

```javascript
{
  _id: ObjectId("65a2b..."),
  name: "Ramesh Kumar",
  phone: "9876543210",
  password: "$2a$12$...",           // Hashed, select: false
  language: "hi",
  role: "farmer",
  isVerified: true,
  otp: {
    code: "123456",                 // select: false
    expiresAt: ISODate("2026-02-08T15:10:00Z")
  },
  lastLogin: ISODate("2026-02-08T15:05:00Z"),
  createdAt: ISODate("2026-02-08T14:55:00Z"),
  updatedAt: ISODate("2026-02-08T15:05:00Z")
}
```

---

## 🎓 Learning Summary

### What you've built:

✅ **User Registration** with automatic password hashing  
✅ **OTP Generation** with 5-minute expiry  
✅ **SMS Integration** via Twilio  
✅ **OTP Verification** with validation  
✅ **JWT Authentication** for API protection  
✅ **Login System** with password verification  
✅ **Protected Routes** using middleware  

### Skills gained:

- Express.js controllers
- MongoDB with Mongoose
- Bcrypt password hashing
- JWT token management
- Twilio SMS API
- TypeScript interfaces
- Error handling
- RESTful API design

---

## 🚀 Next Steps

1. **Add Twilio credentials** to `.env`
2. **Test in Postman** (see testing section)
3. **Integrate with frontend**
4. **Add rate limiting** (prevent spam)
5. **Add refresh tokens** (for longer sessions)

---

Need any clarification? Ask me! 😊
