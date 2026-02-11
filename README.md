# 🏛️ NitiSetu - Empowering Farmers Through Technology

A bilingual (Hindi/English) web platform that helps Indian farmers discover and apply for government schemes, built for hackathon submission.

## 🎯 Overview

NitiSetu bridges the gap between government agricultural schemes and farmers by providing:
- **Voice-to-Profile AI**: Extract farmer information from natural language (Hindi/English)
- **OTP-based Authentication**: Secure, passwordless login via SMS
- **Profile Management**: Complete farmer profile with auto-completeness tracking
- **Scheme Discovery**: Find relevant government schemes based on profile
- **Multilingual Support**: Full Hindi and English support

---

## 🚀 Features

### ✅ Implemented

#### **Authentication System**
- **OTP-based Registration**: Passwordless registration with phone verification
- **SMS Integration**: Twilio-powered OTP delivery
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent abuse with request throttling

#### **Voice-to-Profile AI** 🎤 ⭐ **NEW**
- **AI-Powered Extraction**: Uses Google Gemini 2.5 Flash (free tier)
- **Multilingual**: Supports Hindi and English voice input
- **Smart Parsing**: Extracts farmer details (name, land, crops, location)
- **Auto-Validation**: Validates and structures data automatically

#### **Profile Management**
- **CRUD Operations**: Create, Read, Update farmer profiles
- **Auto-Completeness**: Tracks profile completion percentage
- **Activity Logging**: Audit trail for all profile changes
- **Data Validation**: Express-validator for all inputs

### 🔜 Coming Soon
- Scheme recommendation engine
- Application tracking
- Document upload
- Frontend UI (React TypeScript)

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + bcrypt
- **SMS**: Twilio
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

### Frontend (In Progress)
- React 18 + TypeScript
- Vite
- TailwindCSS

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Twilio account (free tier)
- Google AI Studio API key (free)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/NitiSetu.git
cd NitiSetu/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure .env (see Configuration section)
nano .env

# Run development server
npm run dev

# Server starts on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev

# Frontend starts on http://localhost:5173
```

---

## ⚙️ Configuration

Create `.env` file in `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/niti-setu
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/niti-setu

# JWT
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Gemini AI (Free)
GEMINI_API_KEY=your_gemini_api_key
```

### Getting API Keys

#### Twilio (Free Tier)
1. Sign up: https://www.twilio.com/try-twilio
2. Get phone number (free trial)
3. Copy Account SID, Auth Token, and Phone Number

#### Google Gemini (100% Free)
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

---

## 🔌 API Endpoints

### Authentication

```bash
# Register new user
POST /api/auth/register
Content-Type: application/json
{
  "name": "Ramesh Kumar",
  "phone": "+919876543210",
  "password": "secure123",
  "language": "en"
}

# Send/Resend OTP
POST /api/auth/send-otp
{
  "phone": "+919876543210"
}

# Verify OTP
POST /api/auth/verify-otp
{
  "phone": "+919876543210",
  "otp": "123456"
}

# Login (password-based)
POST /api/auth/login
{
  "phone": "+919876543210",
  "password": "secure123"
}
```

### Profile Management

```bash
# Get profile (requires auth)
GET /api/profile
Authorization: Bearer <jwt_token>

# Create profile
POST /api/profile
Authorization: Bearer <jwt_token>
{
  "name": "Ramesh Kumar",
  "age": 45,
  "state": "Maharashtra",
  "district": "Pune",
  "landHolding": 5,
  "cropTypes": ["Rice", "Wheat"],
  "socialCategory": "OBC"
}

# Update profile
PUT /api/profile
Authorization: Bearer <jwt_token>
{
  "landHolding": 7,
  "cropTypes": ["Rice", "Wheat", "Sugarcane"]
}

# Create profile from voice (AI-powered) 🎤
POST /api/profile/voice
Authorization: Bearer <jwt_token>
{
  "voiceText": "My name is Ramesh Kumar, I am from Maharashtra, Pune district. I have 5 acres of land where I grow rice and wheat. I belong to OBC category.",
  "language": "en"
}
```

---

## 🧪 Testing with Postman

Import the collection:
```
backend/NitiSetu_Auth_API.postman_collection.json
```

**Steps**:
1. Import collection into Postman
2. Register a new user → Get JWT token
3. Copy token to Authorization header
4. Test profile endpoints
5. Try voice-to-profile with natural language input!

---

## 🏗️ Project Structure

```
NitiSetu/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   │   ├── authController.ts
│   │   │   └── profileController.ts (Voice AI here!)
│   │   ├── models/            # Database schemas
│   │   │   ├── userModels.ts
│   │   │   ├── farmerProfile.ts
│   │   │   └── activity.ts
│   │   ├── routes/            # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── profileRoutes.ts
│   │   │   └── index.ts
│   │   ├── middleware/        # Auth, validation, rate limiting
│   │   │   ├── auth.ts
│   │   │   ├── validator.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── errorhandler.ts
│   │   ├── utils/             # Helper functions
│   │   └── index.ts           # App entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
│
└── README.md (you are here!)
```

---

## 🎤 Voice-to-Profile Feature

### How It Works

1. **User speaks/types in natural language** (Hindi/English):
   ```
   "मेरा नाम रमेश कुमार है, मेरे पास पुणे में 5 एकड़ जमीन है जहाँ मैं गेहूं और चावल उगाता हूं"
   ```

2. **AI extracts structured data** using Gemini 2.5 Flash:
   ```json
   {
     "name": "Ramesh Kumar",
     "district": "Pune",
     "landHolding": 5,
     "cropTypes": ["Wheat", "Rice"]
   }
   ```

3. **Profile created automatically** with validation

### Supported Languages
- ✅ English
- ✅ Hindi (देवनागरी)
- 🔜 Marathi, Tamil, Telugu (coming soon)

### Example Inputs

```
English:
"My name is Sita Devi, I am a 50 year old farmer from Karnataka. I have 3 acres of land where I grow sugarcane and vegetables."

Hindi:
"मेरा नाम राजेश है, मैं महाराष्ट्र के नासिक जिले से हूं। मेरे पास 2 एकड़ सिंचित जमीन है।"
```

---

## 🔒 Security

- ✅ Environment variables for secrets
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Rate limiting on all endpoints
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ MongoDB injection prevention

---

## 🚀 Deployment

### Backend (Render/Railway)

```bash
# Build
npm run build

# Start production
npm start
```

Environment variables required on hosting platform:
- All variables from `.env.example`
- `NODE_ENV=production`

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build

# Deploy dist/ folder
```

---

## 📊 Database Schema

### User
```typescript
{
  name: String,
  phone: String (unique, indexed),
  password: String (hashed),
  language: 'en' | 'hi' | 'mr' | 'ta',
  role: 'farmer' | 'admin',
  isVerified: Boolean,
  otp: { code: String, expiresAt: Date }
}
```

### Farmer Profile
```typescript
{
  userId: ObjectId (ref: User),
  name: String,
  age: Number,
  gender: 'Male' | 'Female' | 'Other',
  socialCategory: 'General' | 'OBC' | 'SC' | 'ST' | 'Minority',
  state: String,
  district: String,
  village: String,
  landHolding: Number (acres),
  landType: 'Irrigated' | 'Rainfed' | 'Both',
  cropTypes: [String],
  annualIncome: String,
  hasBankAccount: Boolean,
  hasKCC: Boolean,
  profileCompleteness: Number (auto-calculated),
  createdVia: 'form' | 'voice'
}
```

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: Add your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

---

## 📝 License

MIT License - Free to use for educational and commercial purposes

---

## 👥 Team

- **Developer**: [Your Name]
- **Hackathon**: NPTEL Internship
- **Year**: 2026

---

## 🙏 Acknowledgments

- **Google Gemini AI**: Free AI API for voice processing
- **Twilio**: Free SMS service for OTP
- **MongoDB Atlas**: Free database hosting
- **NPTEL**: Internship opportunity

---

## 📧 Contact

- **Email**: your.email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)
- **LinkedIn**: [Your Name](https://linkedin.com/in/your-profile)

---

## 🎯 Roadmap

- [x] Authentication system with OTP
- [x] Profile CRUD operations
- [x] Voice-to-profile AI feature
- [x] Activity logging
- [ ] Scheme recommendation engine
- [ ] Application submission
- [ ] Document upload (Aadhaar, land records)
- [ ] Admin dashboard
- [ ] Mobile app (React Native)
- [ ] Offline support (PWA)

---

**Built with ❤️ for Indian Farmers** 🇮🇳
