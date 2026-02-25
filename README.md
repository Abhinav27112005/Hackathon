# 🏛️ NitiSetu — Bridging Farmers and Government Schemes

<div align="center">

**An AI-powered platform helping Indian farmers discover & apply for government schemes**

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-nitisetu--zeta.vercel.app-22c55e?style=for-the-badge)](https://nitisetu-zeta.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> 🌟 Built for the **NPTEL Internship Hackathon 2026**

</div>

---

## 🌐 Live Site

> **[👉 Visit NitiSetu → https://nitisetu-zeta.vercel.app/](https://nitisetu-zeta.vercel.app/)**

| Service | URL |
|---|---|
| 🖥️ Frontend (Vercel) | https://nitisetu-zeta.vercel.app/ |

---

## 🎯 What is NitiSetu?

**NitiSetu** (नीति-सेतु) means *"Policy Bridge"* in Hindi. It bridges the information gap between Indian farmers and the hundreds of government welfare schemes they're eligible for but often unaware of.

### The Problem
- Millions of Indian farmers miss out on government benefits due to lack of awareness
- Complex eligibility criteria are hard to understand without guidance
- Language barriers prevent access to scheme information

### Our Solution
- 🤖 **AI-powered eligibility checking** — Gemini AI reads scheme PDFs and checks eligibility
- 🎤 **Voice profile creation** — Farmers describe themselves in Hindi/English, AI structures the data
- 📱 **Mobile-first design** — Accessible on any device, even low-end smartphones
- 🔒 **OTP-based login** — No passwords to remember, just phone number

---

## ✨ Key Features

### 🎤 Voice-to-Profile (AI)
Farmers speak naturally — AI extracts structured profile data automatically.
```
Input:  "मेरा नाम रमेश है, मैं महाराष्ट्र के पुणे से हूं, मेरे पास 5 एकड़ जमीन है"
Output: { name: "Ramesh", state: "Maharashtra", district: "Pune", landHolding: 5 }
```

### 📄 PDF Scheme Upload & RAG Pipeline
- Upload government scheme PDFs → AI extracts text → Gemini embeds into 384-dim vectors
- Chunks stored in MongoDB for semantic search
- Powers the eligibility checker with accurate, document-grounded answers

### ✅ AI Eligibility Checker
- Upload any government scheme PDF
- AI checks whether a farmer's profile matches the scheme criteria
- Returns clear YES/NO with detailed explanation and matched criteria

### 📊 Applications Tracker
- Track which schemes the farmer has applied for
- Status updates: Pending → Submitted → Approved

### 🔐 Secure Authentication
- OTP via Twilio SMS (no password required)
- Password login as fallback
- JWT tokens with 7-day expiry
- Rate limiting to prevent abuse

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS |
| **Backend** | Node.js + Express.js + TypeScript |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **AI / LLM** | Google Gemini 2.5 Flash + Gemini Embedding 001 |
| **File Storage** | Cloudinary (PDF storage) |
| **SMS / OTP** | Twilio |
| **Auth** | JWT + bcrypt |
| **Security** | Helmet, CORS, express-rate-limit |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User (Browser / Mobile)               │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
          ┌───────────▼───────────┐
          │   Vercel (Frontend)   │
          │   React + TypeScript  │
          └───────────┬───────────┘
                      │ REST API
          ┌───────────▼───────────┐
          │  Render (Backend)     │
          │  Express + TypeScript │
          └──┬──────────┬─────────┘
             │          │
    ┌─────────▼──┐  ┌────▼──────────┐
    │  MongoDB   │  │  Cloudinary   │
    │  Atlas     │  │  (PDFs)       │
    └────────────┘  └───────────────┘
             │
    ┌─────────▼──────────────────────┐
    │   Google Gemini AI             │
    │   • Text extraction            │
    │   • Embedding generation       │
    │   • Eligibility checking       │
    └────────────────────────────────┘
```

---

## 📦 Local Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Twilio account (free trial)
- Google AI Studio API key (free)
- Cloudinary account (free)

### 1. Clone the repository

```bash
git clone https://github.com/Abhinav27112005/Hackathon.git
cd Hackathon
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/niti-setu

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
npm run dev   # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev   # Starts on http://localhost:5173
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register with name + phone |
| `POST` | `/api/auth/send-otp` | Send OTP to phone |
| `POST` | `/api/auth/verify-otp` | Verify OTP → get JWT |
| `POST` | `/api/auth/login` | Login with password |
| `GET` | `/api/auth/me` | Get current user |

### Farmer Profile
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Get profile |
| `POST` | `/api/profile` | Create profile (form) |
| `PUT` | `/api/profile` | Update profile |
| `POST` | `/api/profile/voice` | Create profile via voice AI 🎤 |

### Schemes (RAG Pipeline)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/schemes/upload` | Upload scheme PDF (multipart) |
| `GET` | `/api/schemes` | List all schemes |
| `GET` | `/api/schemes/:id` | Get scheme details |
| `GET` | `/api/schemes/:id/status` | Poll processing status |
| `POST` | `/api/schemes/:id/reprocess` | Retry failed processing |
| `DELETE` | `/api/schemes/:id` | Delete scheme |

### Eligibility
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/eligibility/check` | Check farmer eligibility for a scheme |
| `GET` | `/api/eligibility/history` | Get past eligibility checks |

### Applications & Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Dashboard stats + activity |
| `GET` | `/api/application` | List applications |
| `POST` | `/api/application` | Submit application |
| `GET` | `/api/application/:id` | Application details |

---

## 📁 Project Structure

```
NitiSetu/
├── backend/
│   └── src/
│       ├── controllers/          # Request handlers
│       │   ├── authController.ts
│       │   ├── profileController.ts
│       │   ├── schemeController.ts
│       │   ├── eligibilityController.ts
│       │   └── dashboardController.ts
│       ├── models/               # Mongoose schemas
│       │   ├── userModels.ts
│       │   ├── farmerProfile.ts
│       │   ├── scheme.ts
│       │   ├── schemeChunk.ts    # RAG vector chunks
│       │   ├── eligibilityCheck.ts
│       │   └── activity.ts
│       ├── routes/               # Express routers
│       ├── middleware/           # Auth, validation, rate limiting
│       │   ├── auth.ts
│       │   ├── pdfupload.ts      # Cloudinary upload
│       │   ├── rateLimiter.ts
│       │   └── errorhandler.ts
│       ├── services/
│       │   └── pdfProcessingService.ts  # RAG pipeline
│       └── config/
│           ├── cloudinary.ts
│           └── Gemini.ts
│
├── frontend/
│   └── src/
│       ├── pages/                # Route-level components
│       │   ├── LandingPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── ProfileSetupPage.tsx
│       │   ├── SchemesPage.tsx
│       │   ├── EligibilityCheckerPage.tsx
│       │   ├── ResultsPage.tsx
│       │   └── ApplicationsPage.tsx
│       ├── components/           # Reusable UI components
│       ├── context/              # AuthContext (global state)
│       ├── hooks/                # useVoiceInput, etc.
│       └── services/             # Axios API client
│
└── README.md
```

---

## 🗄️ Database Schema

### Farmer Profile
```typescript
{
  userId:             ObjectId,
  name:               String,
  age:                Number,
  gender:             'Male' | 'Female' | 'Other',
  socialCategory:     'General' | 'OBC' | 'SC' | 'ST' | 'Minority',
  state:              String,
  district:           String,
  village:            String,
  landHolding:        Number,   // acres
  landType:           'Irrigated' | 'Rainfed' | 'Both',
  cropTypes:          String[],
  annualIncome:       String,
  hasBankAccount:     Boolean,
  hasKCC:             Boolean,
  profileCompleteness: Number,  // auto-calculated %
  createdVia:         'form' | 'voice'
}
```

### Scheme (with RAG)
```typescript
{
  name, shortName, ministry, description, benefitAmount,
  pdf: { cloudinaryUrl, cloudinaryPublicId, fileSize, totalPages },
  processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed',
  totalChunks:  Number,
  extractedText: String,   // first 5000 chars preview
}
```

---

## 🔒 Security Highlights

- ✅ All secrets stored in environment variables (never in code)
- ✅ JWT authentication with expiry
- ✅ bcrypt password hashing (salt rounds: 10)
- ✅ Input validation via express-validator on every route
- ✅ Rate limiting (100 req/15 min per IP)
- ✅ CORS whitelist — only frontend domains allowed
- ✅ Helmet security headers
- ✅ MongoDB injection prevention via Mongoose

---

## 🚀 Deployment

### Frontend → Vercel
1. Push to GitHub → Vercel auto-deploys
2. Set environment variable in Vercel dashboard:
   ```
   VITE_API_URL = https://niti-setu-backend.onrender.com/api
   ```

### Backend → Render
1. Connect GitHub repo to Render
2. Build command: `npm install && npm run build`
3. Start command: `node dist/index.js`
4. Set all `.env` variables in Render's Environment dashboard

---

## 🧪 Testing with Postman

Import the collection:
```
backend/NitiSetu_Auth_API.postman_collection.json
```

**Quick test flow:**
1. `POST /api/auth/register` → get token
2. Add `Authorization: Bearer <token>` header to all requests
3. `POST /api/profile/voice` → create profile with natural language
4. `POST /api/schemes/upload` → upload a PDF (field name: `pdfFile`)
5. `POST /api/eligibility/check` → check eligibility

---

## 🎯 Roadmap

- [x] OTP + password authentication
- [x] Farmer profile (form + voice AI)
- [x] PDF scheme upload to Cloudinary
- [x] RAG pipeline (chunk → embed → store)
- [x] AI eligibility checker
- [x] Applications tracker
- [x] Dashboard with activity feed
- [x] Deployed on Vercel + Render
- [ ] Hindi UI translation (i18n)
- [ ] WhatsApp bot integration
- [ ] PWA / offline mode
- [ ] Admin dashboard

---

## 🙏 Acknowledgments

| Tool | Purpose |
|---|---|
| [Google Gemini AI](https://ai.google.dev/) | Voice parsing, embeddings, eligibility AI |
| [Twilio](https://www.twilio.com/) | OTP SMS delivery |
| [MongoDB Atlas](https://www.mongodb.com/atlas) | Free cloud database |
| [Cloudinary](https://cloudinary.com/) | PDF file storage |
| [Vercel](https://vercel.com/) | Frontend hosting |
| [Render](https://render.com/) | Backend hosting |

---

## 👤 Author

- **Developer**: Abhinav Kumar Jha
- **Hackathon**: NPTEL Internship 2026
- **GitHub**: [@Abhinav27112005](https://github.com/Abhinav27112005)

---

<div align="center">

**Built with ❤️ for Indian Farmers** 🇮🇳

*"Technology should reach the last farmer, not just the first developer."*

[![Visit Site](https://img.shields.io/badge/🌐%20Visit%20NitiSetu-nitisetu--zeta.vercel.app-22c55e?style=for-the-badge)](https://nitisetu-zeta.vercel.app/)

</div>
