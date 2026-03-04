# NitiSetu — Complete Project Overview
> **One file to understand everything.** This document is gitignored and intended for internal use,
> AI planning sessions (ChatGPT/Gemini), and onboarding new developers.
> Last updated: March 2026

---

## Table of Contents
1. [What is NitiSetu?](#1-what-is-nitisetu)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack — Every Library Explained](#3-tech-stack--every-library-explained)
4. [Folder Structure](#4-folder-structure)
5. [Database Models (MongoDB Schemas)](#5-database-models-mongodb-schemas)
6. [Backend — API Routes & Controllers](#6-backend--api-routes--controllers)
7. [Core Concept: Authentication Flow (OTP + JWT)](#7-core-concept-authentication-flow-otp--jwt)
8. [Core Concept: Auto Login with useCallback](#8-core-concept-auto-login-with-usecallback)
9. [Core Concept: RAG Pipeline (AI Eligibility Engine)](#9-core-concept-rag-pipeline-ai-eligibility-engine)
10. [Core Concept: PDF Processing Pipeline](#10-core-concept-pdf-processing-pipeline)
11. [Core Concept: Vector Embeddings & Semantic Search](#11-core-concept-vector-embeddings--semantic-search)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Security Concepts Used](#13-security-concepts-used)
14. [Deployment](#14-deployment)
15. [Environment Variables](#15-environment-variables)
16. [Future Improvements](#16-future-improvements)
17. [Quick Cheat Sheet for ChatGPT Prompting](#17-quick-cheat-sheet-for-chatgpt-prompting)

---

## 1. What is NitiSetu?

**NitiSetu** (नीतिसेतु — "Bridge to Policy") is an AI-powered web platform that helps **Indian farmers** discover and apply for **government welfare schemes** they are eligible for.

### The Problem It Solves
- India has 100+ government schemes for farmers (PM-KISAN, PM-KUSUM, PMFBY, etc.)
- Each scheme has a complex PDF with eligibility rules buried in legal language
- Farmers don't know which schemes they qualify for
- Manually reading every PDF is impossible

### The Solution
1. **Admin uploads a scheme PDF** → System uses AI to extract and chunk the text
2. **Farmer creates a profile** (name, land size, income, location, social category)
3. **Farmer clicks "Check Eligibility"** → AI reads the PDF chunks + farmer profile → gives a YES/NO/MAYBE answer with citations from the actual document
4. **Farmer can apply** directly and track application status

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                  │
│              Deployed on: Vercel                             │
│                                                             │
│  Pages: Login → Profile Setup → Dashboard                   │
│         ↓                                                   │
│  Upload Scheme PDF → Check Eligibility → View Results       │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTPS REST API calls (Axios)
                       │  JWT token in Authorization header
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)              │
│              Deployed on: Render                            │
│                                                             │
│  express app.ts → routes → controllers → services          │
│                                                             │
│  Middleware: helmet, cors, morgan, rateLimit, auth(JWT)     │
└──────┬───────────────┬──────────────────┬───────────────────┘
       │               │                  │
       ▼               ▼                  ▼
  MongoDB Atlas    Cloudinary         Google Gemini AI
  (User, Profile,  (PDF file         (Embeddings +
  Scheme, Chunks,  storage)          Chat completions)
  Application)
```

### Data Flow Summary
```
User Uploads PDF
  → Multer (buffer) → Cloudinary (stored)
  → pdf-parse (extract text)
  → Split into 500-word chunks
  → Gemini Embedding API (each chunk → 3072-dim vector)
  → Save chunks + vectors to MongoDB (SchemeChunk collection)

User Checks Eligibility
  → Load farmer profile from MongoDB
  → Generate query embedding (Gemini)
  → Vector search → top 6 most relevant PDF chunks
  → Build prompt: farmer profile + PDF excerpts
  → Gemini Chat API → JSON response
  → Validate & save EligibilityCheck to MongoDB
  → Return to frontend
```

---

## 3. Tech Stack — Every Library Explained

### Backend Dependencies

| Package | Version | Purpose | Why This One? |
|---|---|---|---|
| `express` | ^5.x | HTTP server framework | Industry standard; v5 adds async error handling |
| `mongoose` | ^9.x | MongoDB ODM (Object-Document Mapper) | Schemas, validation, pre-save hooks, TypeScript support |
| `jsonwebtoken` | ^9.x | Create & verify JWT tokens | Most popular; signs with secret key |
| `bcryptjs` | ^3.x | Hash passwords | Safe one-way hashing with salt; pure JS (no native deps) |
| `cors` | ^2.x | Allow cross-origin requests | Required because frontend (Vercel) ≠ backend (Render) |
| `helmet` | ^8.x | Set security HTTP headers | Prevents XSS, clickjacking, MIME sniffing etc. in one line |
| `morgan` | ^1.x | HTTP request logger | Shows `GET /api/auth/me 200 12ms` in development |
| `express-rate-limit` | ^8.x | Limit API requests per IP | Prevents brute force attacks on OTP/login endpoints |
| `express-validator` | ^7.x | Validate request body fields | Checks phone format, required fields before hitting DB |
| `multer` | ^2.x | Handle file uploads (multipart/form-data) | Parses PDF uploads; we use `memoryStorage` (buffer, not disk) |
| `cloudinary` | ^1.x | Cloud file storage | Stores uploaded PDFs; provides a CDN URL |
| `pdf-parse` | ^2.x | Extract text from PDF buffer | Reads raw PDF bytes → returns text string |
| `@google/generative-ai` | ^0.24 | Google Gemini AI SDK | Used for both embeddings and chat completions |
| `twilio` | ^5.x | Send SMS messages | Delivers OTP to farmer's phone number |
| `dotenv` | ^17.x | Load `.env` file variables | Makes `process.env.JWT_SECRET` available |
| `typescript` | ^5.x | Type safety | Catches bugs at compile time; better IDE support |
| `nodemon` | dev | Auto-restart server on file change | Development quality-of-life |
| `ts-node` | dev | Run TypeScript directly | No need to compile before running in dev |

### Frontend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.x | UI component library |
| `react-dom` | ^19.x | Renders React to the browser DOM |
| `react-router-dom` | ^7.x | Client-side routing (no page reloads) |
| `axios` | ^1.x | HTTP client for API calls; auto-sets headers |
| `framer-motion` | ^12.x | Smooth animations and page transitions |
| `react-hot-toast` | ^2.x | Toast notifications (success/error popups) |
| `react-icons` | ^5.x | SVG icon library (no image files needed) |
| `recharts` | ^3.x | Charts/graphs for the dashboard |
| `date-fns` | ^4.x | Date formatting utilities |
| `tailwindcss` | ^4.x | Utility-first CSS framework |
| `vite` | ^7.x | Fast build tool (replaces CRA); HMR in dev |

---

## 4. Folder Structure

```
NitiSetu/
├── PROJECT_OVERVIEW.md          ← You are here (gitignored)
├── .gitignore
├── README.md
│
├── backend/
│   ├── src/
│   │   ├── index.ts             ← Entry point: connects MongoDB, starts server
│   │   ├── app.ts               ← Express app: middleware + routes registered
│   │   │
│   │   ├── config/
│   │   │   ├── db.ts            ← Mongoose.connect() to MongoDB Atlas
│   │   │   ├── Gemini.ts        ← Google Gemini SDK initialization (chat + embedding models)
│   │   │   └── cloudinary.ts    ← Cloudinary SDK config
│   │   │
│   │   ├── models/              ← MongoDB schemas (what data looks like in DB)
│   │   │   ├── userModels.ts    ← User (phone, password hash, OTP, role)
│   │   │   ├── farmerProfile.ts ← FarmerProfile (land, income, location, crops)
│   │   │   ├── scheme.ts        ← Scheme (PDF info, processing status, eligibility summary)
│   │   │   ├── schemeChunk.ts   ← SchemeChunk (text chunk + 3072-dim embedding vector)
│   │   │   ├── eligibilityCheck.ts ← EligibilityCheck (AI result saved per farmer+scheme)
│   │   │   ├── application.ts   ← Application (farmer applies to a scheme)
│   │   │   └── activity.ts      ← Activity log (recent actions on dashboard)
│   │   │
│   │   ├── controllers/         ← Business logic for each route
│   │   │   ├── authController.ts      ← register, sendOTP, verifyOTP, login, getMe, logout
│   │   │   ├── profileController.ts   ← createProfile, getProfile, updateProfile
│   │   │   ├── schemeController.ts    ← uploadScheme, listSchemes, getScheme, reprocess
│   │   │   ├── eligibilityController.ts ← checkOne, checkAll, getResults
│   │   │   ├── applicationController.ts ← apply, listApplications, updateStatus
│   │   │   ├── dashboardController.ts ← getDashboardStats
│   │   │   ├── voiceController.ts     ← voice profile creation via speech recognition
│   │   │   └── userController.ts      ← admin user management
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts          ← protect (verifies JWT), restrictTo (role-based access)
│   │   │   ├── errorhandler.ts  ← Global error handler + 404 handler
│   │   │   ├── rateLimiter.ts   ← express-rate-limit config
│   │   │   └── validators/      ← express-validator rules per route
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts         ← Master router (mounts all sub-routes at /api/*)
│   │   │   ├── authRoutes.ts    ← /api/auth/*
│   │   │   ├── profileRoutes.ts ← /api/profile/*
│   │   │   ├── schemeRoutes.ts  ← /api/schemes/*
│   │   │   ├── eligibilityRoutes.ts ← /api/eligibility/*
│   │   │   └── applicationRoutes.ts ← /api/applications/*
│   │   │
│   │   └── services/            ← Reusable logic called by controllers
│   │       ├── ragService.ts    ← THE BRAIN: vector search + Gemini AI eligibility check
│   │       ├── pdfProcessingService.ts ← pdf-parse + chunk + embed + save
│   │       ├── embeddingService.ts     ← Gemini embedding API wrapper
│   │       ├── twilioService.ts        ← SMS OTP sending
│   │       ├── profileService.ts       ← Profile completeness calculation
│   │       └── tokenService.ts         ← JWT generate/verify helpers
│   │
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── index.html               ← Single HTML file (React mounts here)
    ├── vite.config.ts           ← Vite build config
    ├── vercel.json              ← Vercel SPA routing config (all paths → index.html)
    │
    └── src/
        ├── main.tsx             ← ReactDOM.createRoot → <App />
        ├── App.tsx              ← Router + AuthProvider + all Routes defined
        │
        ├── context/
        │   └── AuthContext.tsx  ← Global auth state (user, profile, login, logout)
        │
        ├── hooks/
        │   └── useVoiceInput.ts ← Web Speech API hook for voice profile creation
        │
        ├── services/
        │   └── api.ts           ← Axios instance with baseURL + JWT interceptor
        │
        ├── types/
        │   └── index.ts         ← TypeScript interfaces (User, FarmerProfile, Scheme, etc.)
        │
        ├── utils/
        │   └── helpers.ts       ← Date formatters, number helpers
        │
        ├── components/
        │   └── common/
        │       ├── ProtectedRoute.tsx ← Redirects to /login if not authenticated
        │       └── Navbar.tsx
        │
        └── pages/
            ├── LandingPage.tsx
            ├── LoginPage.tsx
            ├── RegisterPage.tsx
            ├── ProfileSetupPage.tsx
            ├── DashboardPage.tsx
            ├── UploadSchemePage.tsx
            ├── EligibilityCheckerPage.tsx
            ├── ResultsPage.tsx
            ├── SchemesPage.tsx
            ├── SchemeDetailPage.tsx
            ├── ApplicationsPage.tsx
            └── ApplicationDetailPage.tsx
```

---

## 5. Database Models (MongoDB Schemas)

### User (`userModels.ts`)
```
{
  name: String          // "Ramesh Kumar"
  phone: String         // "9876543210" — UNIQUE login identifier
  password: String      // bcrypt hash — select: false (never returned in queries)
  language: enum        // 'en' | 'hi' | 'mr' | 'ta'
  role: enum            // 'farmer' | 'admin'
  isVerified: Boolean   // true after OTP verified
  otp: {
    code: String        // "123456" — select: false
    expiresAt: Date     // now + 5 minutes
  }
  lastLogin: Date
  createdAt, updatedAt  // auto (timestamps: true)
}
```
**Key behaviors:**
- `select: false` on `password` and `otp.code` — these fields are NEVER returned unless explicitly requested with `.select('+password')`
- Pre-save hook: automatically bcrypt-hashes password before saving (only if modified)
- Instance method: `comparePassword(candidate)` → bcryptjs.compare()

### FarmerProfile (`farmerProfile.ts`)
```
{
  userId: ObjectId → User   // One-to-one: each user has ONE profile
  name, age, gender
  socialCategory: enum      // 'General' | 'OBC' | 'SC' | 'ST' | 'Minority'
  aadhaarLast4: String      // regex: must be exactly 4 digits
  state, district, block, village
  landHolding: Number       // in ACRES (input from farmer)
  landHoldingHectares: Number // AUTO-CALCULATED in pre-save hook
  landType: enum            // 'Irrigated' | 'Rainfed' | 'Both'
  cropTypes: [String]       // ["Wheat", "Rice"]
  annualIncome: enum        // 'Below 2L' | '2L-5L' | '5L-10L' | 'Above 10L'
  hasBankAccount: Boolean
  hasKCC: Boolean           // Kisan Credit Card
  profileCompleteness: Number  // AUTO-CALCULATED 0-100%
  createdVia: enum          // 'voice' | 'form'
}
```
**Key behaviors:**
- Pre-save hook auto-converts acres → hectares (`landHolding * 0.4047`)
- Pre-save hook auto-calculates `profileCompleteness` (counts filled fields / 14 total)

### Scheme (`scheme.ts`)
```
{
  name: String          // "Pradhan Mantri Kisan Samman Nidhi"
  shortName: String     // "PM-KISAN"
  ministry: String
  description: String
  benefitAmount: String // "₹6,000/year"
  pdf: {
    cloudinaryUrl: String       // Download/view URL
    cloudinaryPublicId: String  // Used to delete from Cloudinary
    originalFileName: String
    fileSize: Number
    totalPages: Number
  }
  processingStatus: enum  // 'uploaded' | 'processing' | 'completed' | 'failed'
  processingError: String // error message if failed
  extractedText: String   // select: false (raw PDF text, large)
  totalChunks: Number
  eligibilitySummary: {
    inclusions: [String]  // ["Must be a farmer", "Land < 2 hectares"]
    exclusions: [String]  // ["Income tax payer", "Government employee"]
  }
  uploadedBy: ObjectId → User
  uploadType: enum      // 'admin' | 'farmer'
  isActive: Boolean
}
```

### SchemeChunk (`schemeChunk.ts`)
```
{
  schemeId: ObjectId → Scheme
  chunkIndex: Number        // 0, 1, 2, 3... (order in original PDF)
  chunkText: String         // ~500 words of PDF text
  embedding: [Number]       // 3072 floating-point numbers (Gemini vector)
  metadata: {
    pageNumber: Number
    sectionTitle: String
    wordCount: Number
  }
  createdAt: Date
}
```
**This is the core of the RAG system.** One scheme PDF creates dozens of SchemeChunks.
MongoDB Atlas Vector Search index is on the `embedding` field.

### EligibilityCheck (`eligibilityCheck.ts`)
Stores the AI result so the farmer can view it again without re-running the AI.
```
{
  userId: ObjectId → User
  profileId: ObjectId → FarmerProfile
  schemeId: ObjectId → Scheme
  schemeName, schemeShortName: String
  isEligible: enum        // 'eligible' | 'not_eligible' | 'likely_eligible'
  confidenceScore: Number // 0-100
  benefitAmount: String
  reasoning: String
  citations: [{           // Quotes from the actual PDF
    text: String,
    page: Number,
    section: String,
    matchType: 'supports' | 'excludes'
  }]
  criteriaMatched: [{
    criterion: String,
    farmerValue: String,
    requiredValue: String,
    isMatch: Boolean
  }]
  exclusionsChecked: [{ exclusion, isExcluded, reason }]
  requiredDocuments: [String]
  nextSteps: [String]
  responseTimeMs: Number
  llmModel: String        // "gemini-2.5-flash"
  checkedAt: Date
}
```

---

## 6. Backend — API Routes & Controllers

### Auth Routes (`/api/auth/*`)
| Method | Endpoint | Description | Protected? |
|---|---|---|---|
| POST | `/register` | Create account, send OTP | No |
| POST | `/send-otp` | Send OTP to existing phone | No |
| POST | `/verify-otp` | Verify OTP → get JWT | No |
| POST | `/login` | Login with password → get JWT | No |
| GET | `/me` | Get current user info | Yes (JWT) |
| POST | `/logout` | Logout (client-side token deletion) | Yes (JWT) |

### Profile Routes (`/api/profile/*`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create farmer profile |
| GET | `/` | Get my profile |
| PUT | `/` | Update my profile |

### Scheme Routes (`/api/schemes/*`)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/upload` | Upload PDF + metadata | Admin/Farmer |
| GET | `/` | List all active schemes | Protected |
| GET | `/:id` | Get one scheme detail | Protected |
| POST | `/:id/reprocess` | Re-run PDF processing | Admin |

### Eligibility Routes (`/api/eligibility/*`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/check/:schemeId` | Check one scheme (RAG) |
| POST | `/check-all` | Check all schemes (RAG loop) |
| GET | `/results` | Get my past results |
| GET | `/results/:checkId` | Get specific result |

### Application Routes (`/api/applications/*`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Apply for a scheme |
| GET | `/` | My applications list |
| GET | `/:id` | Application detail |
| PUT | `/:id/status` | Update status (admin) |

---

## 7. Core Concept: Authentication Flow (OTP + JWT)

### Why OTP instead of just password?
Most Indian farmers have phones but may not remember passwords. OTP via SMS is simpler and more reliable. The system supports **both** — OTP (primary) and password (fallback).

### Complete Registration + Login Flow

```
REGISTRATION:
─────────────
Client                          Server                         3rd Party
  │                               │                               │
  ├─ POST /auth/register ─────────►│                               │
  │  { name, phone, password }    │                               │
  │                               ├─ Check phone not taken        │
  │                               ├─ User.create() → DB           │
  │                               ├─ generateOTP() → "483920"     │
  │                               ├─ Save otp + expiresAt → DB    │
  │                               ├─ sendOTPViaTwilio() ──────────►│ SMS sent
  │                               ├─ generateToken(userId, role)  │
  │◄─ { token, user, otp* } ──────┤                               │
  │  *otp only in dev mode        │                               │
  │                               │                               │
  ├─ POST /auth/verify-otp ───────►│                               │
  │  { phone, otp }               │                               │
  │                               ├─ User.findOne({phone})        │
  │                               │   .select('+otp.code +otp.expiresAt')
  │                               ├─ Check otp.code === otp ✓     │
  │                               ├─ Check new Date() < expiresAt ✓
  │                               ├─ user.isVerified = true       │
  │                               ├─ user.otp = undefined (clear) │
  │                               ├─ generateToken()              │
  │◄─ { success, token, user } ───┤                               │

PASSWORD LOGIN:
───────────────
  ├─ POST /auth/login ────────────►│
  │  { phone, password }          │
  │                               ├─ User.findOne({phone}).select('+password')
  │                               ├─ user.comparePassword(password)
  │                               │   └─ bcryptjs.compare(candidate, hash)
  │                               ├─ user.lastLogin = new Date()
  │∣◄─ { token, user } ───────────┤

AUTHENTICATED REQUEST:
──────────────────────
  ├─ GET /api/auth/me ────────────►│
  │  Header: Authorization: Bearer <token>
  │                               ├─ auth middleware (protect):
  │                               │   └─ jwt.verify(token, JWT_SECRET)
  │                               │   └─ User.findById(decoded.userId)
  │                               │   └─ req.user = user
  │                               ├─ controller: res.json(req.user)
  │◄─ { user } ───────────────────┤
```

### JWT Explained
```
JWT = Base64(header) + "." + Base64(payload) + "." + Signature

Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "userId": "64a1b2c3...", "role": "farmer", "iat": 1234567890, "exp": 1235167890 }
Signature: HMAC-SHA256(header + "." + payload, JWT_SECRET)

The secret (JWT_SECRET) is only known to the server.
If someone tampers with the payload, the signature won't match → rejected.
```

### Token Storage Strategy
- Token stored in `localStorage` under key `niti_setu_token`
- Axios interceptor in `services/api.ts` automatically attaches it:
  ```js
  headers: { Authorization: `Bearer ${token}` }
  ```

---

## 8. Core Concept: Auto Login with useCallback

This is one of the most important frontend patterns in the project. Located in `frontend/src/context/AuthContext.tsx`.

### The Problem
When a user refreshes the browser page:
- React state resets (user = null)
- But the token is still in `localStorage`
- Without auto-login, the user would be logged out on every refresh

### The Solution: `checkAuthStatus` on Mount
```tsx
// AuthContext.tsx (simplified)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);  // ← starts TRUE

  useEffect(() => {
    checkAuthStatus();   // runs ONCE when component mounts
  }, []);                // empty [] = only on mount, like componentDidMount

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('niti_setu_token');

    if (!token) {
      setLoading(false);   // no token = not logged in, done
      return;
    }

    try {
      // Token exists → ask server if it's still valid
      const { data } = await api.get('/auth/me');
      setUser(data.user);   // ← auto-login! user is restored

      // Also fetch profile if it exists
      try {
        const profileRes = await api.get('/profile');
        if (profileRes.data.success) setProfile(profileRes.data.profile);
      } catch { /* no profile yet, that's fine */ }

    } catch (error) {
      // ONLY clear token on 401 (token actually invalid/expired)
      // NOT on network errors (backend might just be sleeping on Render free tier)
      if (error?.response?.status === 401) {
        localStorage.removeItem('niti_setu_token');
        setUser(null);
      }
    } finally {
      setLoading(false);   // ← always set loading to false when done
    }
  };
```

### Why `loading` Starts as `true`
```tsx
// ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;   // ← wait for checkAuthStatus to finish

  if (!isAuthenticated) return <Navigate to="/login" />;

  return children;
};
```
Without `loading = true`, the ProtectedRoute would flash the login page for a millisecond before the auto-login check completes. The `loading` flag prevents this "flash of unauthenticated content" (FOUC).

---

### Why useCallback is Used Everywhere

Every function in AuthContext (login, logout, register, etc.) is wrapped in `useCallback`:

```tsx
const login = useCallback(async (phone: string, otp: string) => {
  const { data } = await api.post('/auth/verify-otp', { phone, otp });
  localStorage.setItem('niti_setu_token', data.token);
  setUser(data.user);
}, []);  // ← empty dependency array
```

**Why?**

**Without `useCallback`:** Every time AuthProvider re-renders (which happens when `user` or `loading` state changes), React creates a **brand new function reference** for `login`, `logout`, etc. Any child component that has `login` in its `useEffect` dependency array would re-run its effect unnecessarily.

**With `useCallback(fn, [])` (empty deps):** React **memoizes** the function — it returns the exact same function reference on every render. This means:
- Components using `useEffect([login])` won't re-run unnecessarily
- Avoids infinite re-render loops
- Better performance for deeply nested component trees

**Visual Analogy:**
```
Without useCallback:
  Render 1: login = function@0x001
  Render 2: login = function@0x002  ← different reference! (triggers effects)
  Render 3: login = function@0x003  ← different reference again!

With useCallback(fn, []):
  Render 1: login = function@0x001
  Render 2: login = function@0x001  ← SAME reference (no unnecessary effects)
  Render 3: login = function@0x001  ← SAME reference
```

**Context-specific reason:** The AuthContext `value` object is recalculated every render. If `login` was a new function each time, every consumer of AuthContext would re-render even if user/profile didn't change. `useCallback` makes the context value stable.

---

## 9. Core Concept: RAG Pipeline (AI Eligibility Engine)

**RAG = Retrieval-Augmented Generation**

### Why Not Just Ask AI Directly?
```
WITHOUT RAG:
  Question: "Is Ramesh eligible for PM-KISAN?"
  AI Answer: "Yes, PM-KISAN gives ₹6000/year to farmers with land < 2 hectares"
  Problem: AI might HALLUCINATE rules that don't exist or are outdated!

WITH RAG:
  1. RETRIEVE: Find actual PM-KISAN PDF text chunks about eligibility
  2. AUGMENT:  Combine farmer profile + real PDF text in the prompt
  3. GENERATE: AI reads REAL rules and makes a verifiable decision
  Result: Every answer is backed by exact quotes from the official PDF
```

### RAG Flow in Detail (`ragService.ts`)

```
STEP 1: Build search query
  query = "eligibility criteria requirements conditions who is eligible
           who can apply exclusion not eligible land holding income category"

STEP 2: Embed the query
  queryEmbedding = await embeddingModel.embedContent(query)
  → [0.023, -0.045, 0.078, ...] (3072 numbers)

STEP 3: Vector Search
  Try: MongoDB Atlas $vectorSearch (fast, O(log n))
  Fallback: Load all chunks → cosineSimilarity() manually (O(n))
  → Returns top 6 most relevant chunks with similarity scores

STEP 4: Build context from chunks
  "[Source 1: Page 2, Section: Eligibility Criteria]
   The scheme covers all small and marginal farmer families..."
  "[Source 2: Page 3, Section: Exclusions]
   Former/present holders of constitutional posts are excluded..."

STEP 5: Build prompt
  systemMessage = "You are an expert eligibility assessor..."
  userMessage = FARMER PROFILE + SCHEME NAME + DOCUMENT EXCERPTS

STEP 6: Call Gemini AI
  temperature = 0.1 (low = deterministic, not creative)
  responseMimeType = 'application/json' (forces JSON output)

STEP 7: Parse + Validate response
  Try: JSON.parse(response)
  Fallback: Strip ```json``` fences
  Fallback: Regex extract { ... }
  Validate: enum values, number ranges (clamp 0-100), array types

STEP 8: Return structured result
  { isEligible, confidenceScore, citations, criteriaMatched, nextSteps, ... }
```

---

## 10. Core Concept: PDF Processing Pipeline

When an admin uploads a PDF, the following chain runs **in the background**:

```
1. Upload (Multer + Cloudinary)
   ├── Multer receives multipart/form-data in memoryStorage (req.file.buffer)
   ├── multer-storage-cloudinary uploads the buffer to Cloudinary
   └── Returns: { cloudinaryUrl, cloudinaryPublicId }

2. Extract Text (pdf-parse)
   ├── Download PDF from Cloudinary → buffer
   ├── pdfParse(buffer) → { text, numpages }
   └── Returns: full text string from all pages

3. Chunk the Text
   ├── Split text into ~500 word chunks
   ├── Preserve metadata: page number, section title
   └── Result: Array of { chunkText, chunkIndex, metadata }

4. Embed Each Chunk (Gemini Embedding API)
   ├── For each chunk: embeddingModel.embedContent(chunkText)
   ├── Returns: [0.023, -0.045, ...] (3072 dimensions)
   └── Rate limit: small delay between API calls

5. Save to MongoDB (SchemeChunk collection)
   ├── Bulk insert all chunks with their embeddings
   └── Update Scheme.processingStatus → 'completed'
       Update Scheme.totalChunks
       Update Scheme.eligibilitySummary (AI-generated)
```

### Why memoryStorage instead of diskStorage?
- Saves to RAM (buffer) instead of server's hard disk
- On Render (cloud host), the disk is ephemeral — files disappear on redeploy
- We immediately pass the buffer to Cloudinary and pdf-parse
- Never touches the filesystem

---

## 11. Core Concept: Vector Embeddings & Semantic Search

### What is an Embedding?
An embedding converts text into a list of numbers that captures **meaning**, not just characters.

```
"eligible farmer who owns land"  → [0.02, -0.04, 0.07, 0.01, ...]  (3072 numbers)
"qualified agriculturalist with property" → [0.021, -0.039, 0.068, 0.012, ...]  (similar!)

"cat sitting on a mat"  → [0.89, -0.12, 0.44, ...]  (very different!)
```

### Cosine Similarity
Used to measure how similar two embeddings are:
```
cos(θ) = (A · B) / (||A|| × ||B||)

Result:
  1.0 = identical meaning
  0.0 = no relation
 -1.0 = opposite meaning
```

The code in `ragService.ts`:
```typescript
private cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0, magnitudeA = 0, magnitudeB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}
```

### MongoDB Atlas Vector Search
With the Atlas vector index configured on `embedding` field:
```json
{ "$vectorSearch": {
    "index": "vector_index",
    "path": "embedding",
    "queryVector": [0.02, -0.04, ...],
    "numCandidates": 60,
    "limit": 6,
    "filter": { "schemeId": ObjectId("...") }
  }
}
```
This does the cosine similarity math inside MongoDB, much faster than loading all vectors into Node.js.

---

## 12. Frontend Architecture

### React Context (Global State)
`AuthContext.tsx` provides global auth state to ALL components without prop drilling:
```
<AuthProvider>           ← wraps entire app
  value = { user, profile, login, logout, ... }
    ↓ available to every child component
    <LoginPage />        ← uses: const { login } = useAuth()
    <Dashboard />        ← uses: const { user, profile } = useAuth()
    <ProtectedRoute />   ← uses: const { isAuthenticated, loading } = useAuth()
```

### Route Protection
```tsx
// App.tsx — protected routes wrapped in ProtectedRoute
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />

// ProtectedRoute.tsx logic:
if (loading) → show spinner (waiting for checkAuthStatus)
if (!isAuthenticated) → <Navigate to="/login" />
else → render children
```

### Axios Interceptor (Auto JWT Injection)
In `services/api.ts`:
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('niti_setu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
Every API call automatically adds the JWT header — components never need to manually add it.

### Framer Motion Animations
Used for smooth page transitions and component animations:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <DashboardCard />
</motion.div>
```

---

## 13. Security Concepts Used

| Concept | Implementation | Why |
|---|---|---|
| **Password Hashing** | `bcryptjs.hash(password, 12)` — 12 salt rounds | Never store plain password; even if DB leaks, passwords are safe |
| **JWT Authentication** | Stateless token signed with `JWT_SECRET` | No server-side sessions needed; scales horizontally |
| **OTP Expiry** | `expiresAt = now + 5 minutes` | OTP is one-time use and time-limited |
| **select: false** | On `password`, `otp.code` fields | These sensitive fields are excluded from all queries by default |
| **Helmet** | Sets 15+ security HTTP headers | Prevents XSS, clickjacking, MIME sniffing automatically |
| **CORS Whitelist** | Only allows Vercel URL + localhost | Blocks requests from unknown origins |
| **Rate Limiting** | `express-rate-limit` on `/api/*` | Prevents brute-force attacks on OTP/login |
| **Input Validation** | `express-validator` middleware | Validates phone format, required fields before reaching DB |
| **Role-Based Access** | `restrictTo('admin')` middleware | Admin-only routes (upload scheme, manage users) |
| **Error Sanitization** | Global error handler strips stack traces | Stack traces are never sent to client (only in development) |
| **Trust Proxy** | `app.set('trust proxy', 1)` | Lets rate limiter read real IP from `X-Forwarded-For` on Render |

---

## 14. Deployment

### Backend → Render (render.com)
- **Build Command:** `npm install && npm run build` (runs `tsc`)
- **Start Command:** `node dist/index.js`
- **Environment:** Set all variables in Render dashboard
- **Free Tier Limitation:** Server "sleeps" after 15 minutes of inactivity → cold start ~30s
  - This is why `checkAuthStatus` only clears token on `401`, not on network errors

### Frontend → Vercel (vercel.com)
- **Build Command:** `npm run build` (runs `tsc -b && vite build`)
- **Output Directory:** `dist/`
- **`vercel.json`:** Routes all paths to `index.html` (required for React Router SPA)
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

---

## 15. Environment Variables

### Backend `.env`
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nitisetu

# JWT
JWT_SECRET=your-very-long-random-secret-string
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini
GEMINI_API_KEY=your_gemini_key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1...

# Frontend URL (for CORS)
FRONTEND_URL=https://nitisetu-zeta.vercel.app
CLIENT_URL=https://nitisetu-zeta.vercel.app
```

### Frontend `.env`
```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

---

## 16. Future Improvements

> This section is designed for ChatGPT/Gemini planning sessions.
> Copy any item below as a prompt to plan implementation.

### 🔴 High Priority (Core Feature Gaps)

#### 1. Multilingual Support (Hindi, Marathi, Tamil)
**Current state:** Language preference is stored in User model but UI is English-only.
**Goal:** Translate all UI text + AI responses into the farmer's preferred language.
**Approach:**
- Frontend: `i18next` library with JSON translation files per language
- Backend: Pass `language` to Gemini prompt: "Respond in Hindi"
- Voice input: Web Speech API already supports `lang="hi-IN"`
**ChatGPT prompt:** "I have a React app with AuthContext that stores user.language ('en'|'hi'|'mr'|'ta'). Help me add i18next, create translation keys for all pages, and auto-detect language from user profile."

#### 2. Real Document Upload for Applications
**Current state:** Application model exists but has no document file attachment.
**Goal:** Farmer can upload Aadhaar, land records, bank passbook when applying.
**Approach:** Multer + Cloudinary (same as PDF), store URLs in Application document.

#### 3. SMS Status Notifications via Twilio
**Current state:** Twilio is set up only for OTP.
**Goal:** Send SMS when application status changes (Approved/Rejected/Under Review).
**Approach:** In `applicationController.ts` update status route → call `twilioService.sendSMS(phone, message)`.

#### 4. Admin Dashboard
**Current state:** There's a `role: 'admin'` field but no admin UI.
**Goal:** Admin panel to manage schemes, view all applications, update application statuses.
**Approach:** New protected pages behind `restrictTo('admin')` middleware.

#### 5. Scheme Expiry & Deadline Tracking
**Current state:** Schemes have no deadline field.
**Goal:** Add `applicationDeadline: Date` to Scheme, show countdown on frontend, auto-mark expired.

---

### 🟡 Medium Priority (Performance & UX)

#### 6. Background Job Queue for PDF Processing
**Current state:** PDF processing happens synchronously in the request (blocks for 30-60s).
**Goal:** PDF upload returns immediately; processing happens in background; webhook/polling updates status.
**Approach:** Bull queue (Redis-backed) or simple setImmediate pattern.
**ChatGPT prompt:** "I have a Node.js/Express app. When a PDF is uploaded, it triggers a 60-second AI processing pipeline. Currently it blocks the HTTP response. Help me implement a BullMQ job queue so the upload returns immediately with {status: 'processing'} and processing happens in the background."

#### 7. Profile Photo Upload
**Approach:** Add `profilePhoto: { cloudinaryUrl, publicId }` to FarmerProfile. Reuse Multer + Cloudinary pattern from PDF upload.

#### 8. Pagination & Infinite Scroll
**Current state:** All schemes and results are fetched at once.
**Goal:** Add `?page=1&limit=10` query param support in all list endpoints.
**Backend approach:** `Scheme.find().skip((page-1)*limit).limit(limit)`

#### 9. Refresh Token System
**Current state:** JWT expires in 7 days; user must re-login after expiry.
**Goal:** Silent refresh — access token (15 min) + refresh token (30 days) stored in httpOnly cookie.
**ChatGPT prompt:** "I have a JWT auth system. Help me add a refresh token flow: short-lived access tokens (15 min) + long-lived refresh tokens (30 days) stored in httpOnly cookies. Include the backend endpoints and Axios interceptor that automatically refreshes the token on 401."

#### 10. Scheme Comparison Feature
**Goal:** Farmer can select 2-3 schemes and see a side-by-side comparison of eligibility criteria, benefits, and application process.

---

### 🟢 Future Enhancements (v2.0)

#### 11. Voice-Based Complete Interaction
**Current state:** `useVoiceInput.ts` hook exists for profile creation only.
**Goal:** Voice-first interface — farmer can say "Check if I'm eligible for PM-KISAN" in Hindi and get a spoken answer.
**Approach:** Web Speech API (input) + browser SpeechSynthesis (output) + Gemini for intent parsing.

#### 12. Scheme Recommendation Engine
**Goal:** Based on farmer's profile (state, income, land size, crops), proactively recommend the top 3 most likely eligible schemes WITHOUT user needing to check manually.
**Approach:** Run checkAllSchemes() on profile creation/update. Cache results.

#### 13. Progressive Web App (PWA)
**Goal:** Farmers on low-end phones can install the app homescreen, use it offline.
**Approach:** `vite-plugin-pwa` + service worker + IndexedDB cache for profile and recent results.

#### 14. Government API Integration
**Goal:** Connect to DigiLocker API to auto-fetch Aadhaar, land records, and pre-fill farmer profile.
**Approach:** OAuth 2.0 with DigiLocker → pull documents → extract fields with AI.

#### 15. Analytics Dashboard
**Goal:** Track: which schemes are most checked, application success rates, common eligibility failures.
**Approach:** Aggregation pipelines on EligibilityCheck and Application collections.

#### 16. Mobile App (React Native)
**Goal:** Native iOS/Android app using the existing REST API.
**Note:** The API is already mobile-ready. Backend needs no changes. Just build a React Native frontend.

#### 17. AI Chatbot for Scheme Questions
**Goal:** Farmer can ask "What documents do I need for PM-KISAN?" and get an AI answer using the scheme's PDF.
**Approach:** Dedicated chat endpoint using RAG — same vector search pipeline but conversational (multi-turn).
**ChatGPT prompt:** "I have a RAG system that searches PDF chunks with vector embeddings. Help me add a multi-turn chatbot endpoint where farmers can ask questions about a specific scheme. Include conversation history in the Gemini prompt."

---

## 17. Quick Cheat Sheet for ChatGPT Prompting

Use this context when asking ChatGPT to help extend this project:

```
PROJECT CONTEXT for ChatGPT:
─────────────────────────────
Stack:
- Backend: Node.js, Express v5, TypeScript, MongoDB (Mongoose), JWT auth
- Frontend: React 19, TypeScript, Vite, React Router v7, TailwindCSS v4, Axios
- AI: Google Gemini API (gemini-2.5-flash for chat, gemini-embedding-001 for embeddings)
- File Storage: Cloudinary (PDFs stored here)
- SMS: Twilio (OTP delivery)
- Deployment: Backend on Render, Frontend on Vercel

Architecture Patterns:
- REST API (not GraphQL)
- JWT in localStorage (not cookies) — token key: 'niti_setu_token'
- Auth state via React Context (AuthContext.tsx) with useCallback memoization
- Auto-login on page load via checkAuthStatus() in useEffect([])
- Global error handler in Express (errorHandler middleware)
- RAG pipeline: PDF → chunk → embed (Gemini) → MongoDB vector search → Gemini chat

Key Collections: User, FarmerProfile, Scheme, SchemeChunk, EligibilityCheck, Application, Activity

When asking for help, include:
1. Which file/feature you're modifying
2. The exact TypeScript type/interface involved
3. Whether it's a new route, new model field, or frontend page
```

---

*This file is gitignored. Do not commit it to GitHub.*
*Generated for NitiSetu project — NPTEL Hackathon 2026*
