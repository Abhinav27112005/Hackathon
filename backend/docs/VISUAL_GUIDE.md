# 🎨 Visual Guide: How Everything Connects

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        YOUR BACKEND                          │
│                                                              │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐   │
│  │   Routes   │  →   │Controllers │  →   │  Services  │   │
│  │            │      │            │      │            │   │
│  │ authRoutes │      │   auth     │      │  twilio    │   │
│  │     .ts    │      │ Controller │      │  Service   │   │
│  └────────────┘      └────────────┘      └────────────┘   │
│        ↓                    ↓                    ↓          │
│   Define API          Business Logic      External APIs    │
│   Endpoints           + Validation                          │
│                                                              │
│  ┌────────────┐                                             │
│  │   Models   │  ←  All layers use this for DB access      │
│  │            │                                             │
│  │ userModels │                                             │
│  │     .ts    │                                             │
│  └────────────┘                                             │
│        ↓                                                     │
│    MongoDB                                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📞 Request Flow Diagram

### Example: User Registers

```
┌─────────┐
│ Client  │  (Frontend - Phone app)
│  App    │
└────┬────┘
     │
     │ HTTP POST /api/auth/register
     │ Body: { name, phone, password }
     ▼
┌─────────────────────────────────────────────────────────┐
│                    EXPRESS APP (app.ts)                 │
│                                                         │
│  1. Middleware Chain:                                   │
│     ├─ helmet()        → Security headers              │
│     ├─ cors()          → Allow cross-origin            │
│     ├─ express.json()  → Parse JSON body               │
│     └─ morgan()        → Log request                   │
│                                                         │
│  2. Route Matching:                                     │
│     app.use('/api/auth', authRoutes)                   │
│                                                         │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│            AUTH ROUTES (authRoutes.ts)                  │
│                                                         │
│  router.post('/register', register)                    │
│               ↓                                         │
│        Match! Execute register controller              │
│                                                         │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│         AUTH CONTROLLER (authController.ts)             │
│                                                         │
│  async register(req, res, next) {                      │
│                                                         │
│    Step 1: Extract data from request                   │
│    ────────────────────────────────────                │
│    const { name, phone, password } = req.body           │
│                                                         │
│    Step 2: Check if user exists                        │
│    ────────────────────────────────────                │
│    const existing = await User.findOne({ phone })      │
│    if (existing) return error                          │
│                              ↓                          │
│                        ┌──────────┐                     │
│                        │ MongoDB  │                     │
│                        └──────────┘                     │
│                                                         │
│    Step 3: Create user                                 │
│    ────────────────────────────────────                │
│    const user = await User.create({...})               │
│      → Mongoose pre-save hook runs                     │
│      → Password gets hashed with bcrypt                │
│      → User saved to MongoDB ✓                         │
│                                                         │
│    Step 4: Generate OTP                                │
│    ────────────────────────────────────                │
│    const otp = generateOTP()  // "589438"              │
│    user.otp = { code: otp, expiresAt: ... }            │
│    await user.save()                                   │
│                                                         │
│    Step 5: Send OTP via SMS                            │
│    ────────────────────────────────────                │
│    await sendOTPViaTwilio(phone, otp)                  │
│                              ↓                          │
└──────────────────────────────┼──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│         TWILIO SERVICE (twilioService.ts)               │
│                                                         │
│  async sendOTPViaTwilio(phone, otp) {                  │
│                                                         │
│    Step 1: Format phone number                         │
│    ────────────────────────────────────                │
│    "9876543210" → "+919876543210"                      │
│                                                         │
│    Step 2: Create message                              │
│    ────────────────────────────────────                │
│    body = "Your NitiSetu code is: 589438"              │
│                                                         │
│    Step 3: Call Twilio API                             │
│    ────────────────────────────────────                │
│    await twilioClient.messages.create({                │
│      from: TWILIO_PHONE_NUMBER,                        │
│      to: "+919876543210",                              │
│      body: "..."                                       │
│    })                ↓                                 │
│                      ↓                                 │
└──────────────────────┼─────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Twilio Cloud  │
              │  SMS Gateway   │
              └───────┬────────┘
                      │
                      │ Routes through
                      │ Mobile Networks
                      ▼
              ┌────────────────┐
              │  User's Phone  │
              │                │
              │  📱 SMS:       │
              │  "Your code    │
              │   is: 589438"  │
              └────────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                        │
│                                                          │
│  Registration → OTP Verify → Authenticated              │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Register │ →  │ Verify   │ →  │  Access  │          │
│  │          │    │   OTP    │    │Protected │          │
│  │ Get Token│    │Get Token │    │ Routes   │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       ↓               ↓                ↓                │
│  isVerified:    isVerified:      All API calls         │
│     false           true          with token           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database State Changes

### Timeline of a User Registration

```
Time    Action                  Database State
────    ──────                  ──────────────

T+0s    User clicks Register    (No user exists)
        
T+1s    POST /register          user = {
        Name: "Ramesh"            name: "Ramesh Kumar",
        Phone: "9876543210"       phone: "9876543210",
        Password: "test123"       password: "$2a$12hash...",
                                  otp: {
                                    code: "589438",
                                    expiresAt: T+6min
                                  },
                                  isVerified: false
                                }

T+2s    SMS sent                (No change)
        "Code: 589438"

T+3s    User enters OTP         user = {
        POST /verify-otp          ...same...
        { otp: "589438" }         isVerified: true,  ← Changed!
                                  otp: undefined,     ← Cleared!
                                  lastLogin: T+3s     ← Updated!
                                }

T+4s    User makes API call     Token verified
        with JWT token          → Request allowed ✓
```

---

## 🔄 Data Flow: Register to Verified

```
┌────────┐
│ Client │
└───┬────┘
    │
    │ 1. POST /register { name, phone, password }
    ▼
┌────────────────┐
│   Express      │
│   Middleware   │
└───┬────────────┘
    │ 2. Parse JSON body
    ▼
┌────────────────┐
│   Controller   │
│ - Validate     │
│ - Check exists │
└───┬────────────┘
    │ 3. Call User.create()
    ▼
┌────────────────┐
│   Mongoose     │
│ pre('save')    │
│ - Hash password│
└───┬────────────┘
    │ 4. Save to MongoDB
    ▼
┌────────────────┐
│   MongoDB      │
│   [User doc]   │
└───┬────────────┘
    │ 5. Generate OTP
    ▼
┌────────────────┐
│   Update doc   │
│   with OTP     │
└───┬────────────┘
    │ 6. Call Twilio
    ▼
┌────────────────┐
│ Twilio Service │
│ - Format phone │
│ - Send SMS     │
└───┬────────────┘
    │ 7. Twilio API
    ▼
┌────────────────┐
│  Twilio Cloud  │
│  SMS Gateway   │
└───┬────────────┘
    │ 8. Mobile network
    ▼
┌────────────────┐
│  User's Phone  │
│  📱 "589438"   │
└────────────────┘
```

---

## 🔒 JWT Token Lifecycle

```
┌─────────────────────────────────────────────┐
│         JWT TOKEN LIFECYCLE                 │
│                                             │
│  1. User logs in/registers                  │
│     ↓                                       │
│  2. Server generates token:                 │
│     ┌─────────────────────────────┐        │
│     │ Header                      │        │
│     │ { alg: "HS256" }            │        │
│     ├─────────────────────────────┤        │
│     │ Payload                     │        │
│     │ {                           │        │
│     │   userId: "65a2b...",       │        │
│     │   role: "farmer",           │        │
│     │   iat: 1234567890,          │        │
│     │   exp: 1234999999           │        │
│     │ }                           │        │
│     ├─────────────────────────────┤        │
│     │ Signature                   │        │
│     │ HMACSHA256(                 │        │
│     │   base64(header) + "." +    │        │
│     │   base64(payload),          │        │
│     │   JWT_SECRET                │        │
│     │ )                           │        │
│     └─────────────────────────────┘        │
│     ↓                                       │
│  3. Client stores in localStorage           │
│     localStorage.setItem('token', '...')    │
│     ↓                                       │
│  4. Every API call includes token:          │
│     Authorization: Bearer eyJhbGc...        │
│     ↓                                       │
│  5. Server verifies:                        │
│     - Signature valid? (using JWT_SECRET)   │
│     - Not expired?                          │
│     - User exists in DB?                    │
│     ↓                                       │
│  6. If valid → Attach user to req.user      │
│     If invalid → 401 Unauthorized           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🛡️ Security Layers

```
┌──────────────────────────────────────┐
│         SECURITY LAYERS              │
│                                      │
│  1. HTTPS (in production)            │
│     ↓                                │
│     Encrypted communication          │
│                                      │
│  2. Helmet Middleware                │
│     ↓                                │
│     Security headers                 │
│                                      │
│  3. CORS                             │
│     ↓                                │
│     Only allowed origins             │
│                                      │
│  4. Input Validation                 │
│     ↓                                │
│     Reject invalid data              │
│                                      │
│  5. Password Hashing (bcrypt)        │
│     ↓                                │
│     Never store plain passwords      │
│                                      │
│  6. OTP Expiry (5 minutes)           │
│     ↓                                │
│     Time-limited verification        │
│                                      │
│  7. JWT Expiry (7 days)              │
│     ↓                                │
│     Sessions auto-expire             │
│                                      │
│  8. MongoDB Indexes                  │
│     ↓                                │
│     Fast lookups, unique constraints │
│                                      │
└──────────────────────────────────────┘
```

---

## 📊 Complete System Map

```
┌───────────────────────────────────────────────────────────────┐
│                           FRONTEND                            │
│                                                               │
│  React App → Makes API calls → Stores JWT in localStorage    │
│                                                               │
└─────────────────────────┬─────────────────────────────────────┘
                          │ HTTP Requests
                          ▼
┌───────────────────────────────────────────────────────────────┐
│                       BACKEND (Express)                       │
│                                                               │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐ │
│  │ Routes  │ → │Controller│ →  │ Service │ →  │External │ │
│  │         │    │          │    │         │    │   API   │ │
│  │ /auth   │    │ register │    │ twilio  │    │ Twilio  │ │
│  │ /verify │    │ verifyOTP│    │         │    │         │ │
│  │ /login  │    │ login    │    │         │    │         │ │
│  └─────────┘    └──────────┘    └─────────┘    └─────────┘ │
│                        ↓                              ↓       │
│                  ┌──────────┐                   ┌─────────┐ │
│                  │  Models  │                   │   SMS   │ │
│                  │  (User)  │                   │ Gateway │ │
│                  └──────────┘                   └─────────┘ │
│                        ↓                              ↓       │
└────────────────────────┼──────────────────────────────┼──────┘
                         │                              │
                         ▼                              ▼
                  ┌──────────┐                   ┌──────────┐
                  │ MongoDB  │                   │ User's   │
                  │ Database │                   │  Phone   │
                  └──────────┘                   └──────────┘
```

---

This visual guide should help you understand how all the pieces fit together! 🎯
