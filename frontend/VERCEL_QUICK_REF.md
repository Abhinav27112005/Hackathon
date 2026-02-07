# 🚀 Quick Vercel Deployment Reference

## Vercel Configuration (Copy These Exact Values)

```
Framework Preset:    Vite (auto-detected)
Root Directory:      frontend
Build Command:       npm run build
Output Directory:    dist
Install Command:     npm install
```

## Environment Variable to Set on Vercel

```
VITE_API_URL = https://niti-setu-backend.onrender.com
```

**Important**: Apply this to Production, Preview, AND Development environments!

## Changes Made to Your Code

✅ Updated `.env` to use production backend URL
✅ Configured backend CORS to allow Vercel deployments
✅ Backend now accepts requests from *.vercel.app domains

## Your Frontend Structure

```
frontend/
├── src/
│   ├── App.tsx              (Main component)
│   ├── utils/
│   │   └── api.ts           (API client with backend URL)
│   ├── assets/              (Static assets)
│   └── main.tsx             (Entry point)
├── public/                  (Public assets)
├── dist/                    (Build output - created on build)
├── package.json            (Dependencies & scripts)
├── vite.config.ts          (Vite configuration)
└── .env                     (Environment variables)
```

## Current API Integration

Your frontend connects to:
- **Backend**: https://niti-setu-backend.onrender.com
- **Health Check**: GET /api/health
- **Example API**: GET /api/v1/example
- **Create API**: POST /api/v1/example

## Test After Deployment

Visit your Vercel URL and check:
1. ✅ "Backend API: ✓ Connected" appears
2. ✅ "Fetch Example Data" button works
3. ✅ Form submission works
4. ✅ No CORS errors in browser console

## Quick Deploy Commands

```bash
# Commit and push (auto-deploys)
git add .
git commit -m "Deploy to Vercel"
git push origin main

# Or use Vercel CLI
npm install -g vercel
vercel login
vercel --prod
```

## Next: Update Backend Environment

After getting your Vercel URL, add this to Render backend env vars:
```
FRONTEND_URL = https://your-project.vercel.app
```

Then redeploy the backend for the CORS settings to take effect.

---

💡 See VERCEL_DEPLOYMENT.md for the full detailed guide!
