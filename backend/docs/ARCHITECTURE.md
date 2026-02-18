# 🏗️ NitiSetu Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION SETUP                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         HTTPS          ┌──────────────────┐
│                     │ ◄──────────────────────► │                  │
│   Frontend (Vercel) │                         │ Backend (Render) │
│                     │                         │                  │
│  React + TypeScript │                         │ Node.js + Express│
│  Vite Build         │                         │ TypeScript       │
│                     │                         │                  │
│  Port: 443 (HTTPS)  │                         │ Port: 443 (HTTPS)│
│                     │                         │                  │
└─────────────────────┘                         └──────────────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
   *.vercel.app                          niti-setu-backend
   (Global CDN)                            .onrender.com


┌─────────────────────────────────────────────────────────────────┐
│                     LOCAL DEVELOPMENT                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐                         ┌──────────────────┐
│                     │   http://localhost      │                  │
│  Frontend (Local)   │ ◄──────────────────────► │ Backend (Local)  │
│                     │                         │                  │
│  npm run dev        │                         │ npm run dev      │
│  Port: 5173         │                         │ Port: 5000       │
│                     │                         │                  │
└─────────────────────┘                         └──────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                       API ENDPOINTS                              │
└─────────────────────────────────────────────────────────────────┘

Backend Base URL: https://niti-setu-backend.onrender.com

GET  /                    → Welcome message
GET  /api/health          → Health check
GET  /api/v1/example      → Get example data
POST /api/v1/example      → Create example data


┌─────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES                         │
└─────────────────────────────────────────────────────────────────┘

Frontend (Vercel):
  VITE_API_URL = https://niti-setu-backend.onrender.com

Backend (Render):
  NODE_ENV = production
  PORT = (auto-assigned by Render)


┌─────────────────────────────────────────────────────────────────┐
│                      CORS CONFIGURATION                          │
└─────────────────────────────────────────────────────────────────┘

Backend allows requests from:
  ✓ http://localhost:5173     (Local Vite dev)
  ✓ http://localhost:3000     (Alternative local)
  ✓ *.vercel.app              (All Vercel deployments)
  ✓ Custom domain (via env)


┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

Developer → Git Commit → Git Push → GitHub → Auto Deploy → Live

                                    ├─→ Render (Backend) → 2-3 min
                                    └─→ Vercel (Frontend) → 30-60s


┌─────────────────────────────────────────────────────────────────┐
│                        TECH STACK                                │
└─────────────────────────────────────────────────────────────────┘

Frontend:                         Backend:
  - React 19                        - Node.js
  - TypeScript                      - Express 5.x
  - Vite 7                          - TypeScript
  - CSS3                            - CORS
                                    - dotenv

Build Tools:                      Hosting:
  - TypeScript Compiler             - Render (Backend)
  - Vite Bundler                    - Vercel (Frontend)


┌─────────────────────────────────────────────────────────────────┐
│                      PROJECT STRUCTURE                           │
└─────────────────────────────────────────────────────────────────┘

NitiSetu/
│
├── backend/
│   ├── src/
│   │   ├── index.ts              (Entry point)
│   │   ├── controllers/          (Business logic)
│   │   ├── middleware/           (Custom middleware)
│   │   └── routes/               (API routes)
│   │
│   ├── dist/                     (Compiled JS - gitignored)
│   ├── package.json              (Backend dependencies)
│   ├── tsconfig.json             (TypeScript config)
│   ├── .env                      (Local env vars - gitignored)
│   ├── RENDER_DEPLOYMENT.md      (Deployment guide)
│   └── RENDER_QUICK_REF.md       (Quick reference)
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx               (Main component)
│   │   ├── main.tsx              (Entry point)
│   │   ├── utils/
│   │   │   └── api.ts            (API client)
│   │   └── assets/               (Static files)
│   │
│   ├── dist/                     (Build output - gitignored)
│   ├── public/                   (Public assets)
│   ├── package.json              (Frontend dependencies)
│   ├── vite.config.ts            (Vite config)
│   ├── tsconfig.json             (TypeScript config)
│   ├── .env                      (Env vars - gitignored)
│   ├── VERCEL_DEPLOYMENT.md      (Deployment guide)
│   └── VERCEL_QUICK_REF.md       (Quick reference)
│
└── DEPLOYMENT_SUMMARY.md         (This overview)


┌─────────────────────────────────────────────────────────────────┐
│                    FREE TIER LIMITS                              │
└─────────────────────────────────────────────────────────────────┘

Render (Backend):
  ✓ 750 hours/month
  ✓ Sleeps after 15min inactivity
  ✓ 30-60s wake time on first request
  ✓ 512 MB RAM
  ✓ No credit card required

Vercel (Frontend):
  ✓ 100 GB bandwidth/month
  ✓ Global CDN
  ✓ Automatic preview deployments
  ✓ 6,000 build minutes/month
  ✓ No credit card required


┌─────────────────────────────────────────────────────────────────┐
│                      QUICK COMMANDS                              │
└─────────────────────────────────────────────────────────────────┘

Local Development:
  Backend:  cd backend && npm run dev
  Frontend: cd frontend && npm run dev

Build & Test:
  Backend:  cd backend && npm run build && npm start
  Frontend: cd frontend && npm run build && npm run preview

Deploy:
  git add .
  git commit -m "Deploy changes"
  git push origin main
  (Both services auto-deploy)


┌─────────────────────────────────────────────────────────────────┐
│                     SUCCESS CHECKLIST                            │
└─────────────────────────────────────────────────────────────────┘

Backend (Render):
  ✅ Code deployed
  ✅ Build successful
  ✅ Service running
  ✅ Health check responds
  ✅ CORS configured

Frontend (Vercel):
  ⏳ Ready to deploy
  ⏳ Environment variable set
  ⏳ Build will succeed
  ⏳ CORS will work
  ⏳ API connection will work


┌─────────────────────────────────────────────────────────────────┐
│                        NEXT STEPS                                │
└─────────────────────────────────────────────────────────────────┘

1. Deploy Frontend to Vercel (5 minutes)
   → Go to https://vercel.com/new
   → Import your GitHub repo
   → Set root directory to "frontend"
   → Add environment variable: VITE_API_URL
   → Click Deploy

2. Test Live Application (10 minutes)
   → Visit your Vercel URL
   → Check backend connection status
   → Test all features
   → Verify no console errors

3. Optional Enhancements
   → Add custom domain
   → Set up monitoring
   → Add database (MongoDB, PostgreSQL)
   → Implement authentication
   → Add more features!


═══════════════════════════════════════════════════════════════════
                     🎉 YOUR APP IS READY! 🎉
═══════════════════════════════════════════════════════════════════
