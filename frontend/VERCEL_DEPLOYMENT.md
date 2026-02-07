# NitiSetu Frontend - Vercel Deployment Guide

## 📋 Overview

This guide will help you deploy your NitiSetu React TypeScript frontend on Vercel.

### Frontend Stack
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **Styling**: CSS3
- **Backend API**: https://niti-setu-backend.onrender.com

---

## 🚀 Deployment Steps

### 1. Push Your Code to GitHub/GitLab

Make sure your code is pushed to your Git repository.

```bash
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Import Project"**
3. Import your Git repository
4. Vercel will auto-detect it's a Vite project

#### Option B: Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

### 3. Configure the Deployment

Use these **exact settings** in the Vercel configuration:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node Version** | `20.x` (auto-detected) |

### 4. Set Environment Variables

In the **Environment Variables** section on Vercel, add:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_API_URL` | `https://niti-setu-backend.onrender.com` | Production, Preview, Development |

**Important Notes:**
- ✅ Vite requires env variables to start with `VITE_`
- ✅ The value must be the full backend URL (no trailing slash)
- ✅ Apply to all environments for consistency

---

## ✅ Deployment Checklist

- [x] Code pushed to Git repository
- [x] Frontend builds successfully with `npm run build`
- [x] `.env` file updated with production backend URL
- [x] Backend CORS configured to allow Vercel domain
- [ ] Environment variables set on Vercel
- [ ] Custom domain configured (optional)

---

## 🔧 Changes Made for Deployment

### 1. Environment Variable Update
**File**: `frontend/.env`
```bash
# Updated from localhost to production backend
VITE_API_URL=https://niti-setu-backend.onrender.com
```

### 2. Backend CORS Configuration
**File**: `backend/src/index.ts`
```typescript
app.use(cors({
    origin: [
        'http://localhost:5173',  // Local Vite dev server
        'http://localhost:3000',  // Alternative local dev
        /\.vercel\.app$/,         // Allow all Vercel deployments
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
    ],
    credentials: true
}));
```

This allows:
- Local development on ports 5173 and 3000
- All Vercel preview and production deployments (*.vercel.app)
- Custom frontend domain (via FRONTEND_URL env variable)

---

## 📍 Your Deployed URLs

After deployment, your frontend will be available at:

- **Production**: `https://your-project-name.vercel.app`
- **Preview Deployments**: `https://your-project-name-git-branch.vercel.app`

### Testing the Deployment

Visit your Vercel URL and check:
1. ✅ Page loads successfully
2. ✅ Backend API status shows "✓ Connected"
3. ✅ "Fetch Example Data" button works
4. ✅ Form submission works

---

## 🔍 Vercel Features

### Automatic Deployments
- **Every push to `main`** triggers a production deployment
- **Every pull request** gets a unique preview URL
- **All branches** can be deployed automatically

### Performance Optimizations
Vercel automatically provides:
- Global CDN distribution
- Automatic HTTPS/SSL
- Edge caching
- Image optimization
- Gzip/Brotli compression

### Build Caching
Vercel caches your `node_modules` between deployments for faster builds.

---

## ⚙️ Advanced Configuration (Optional)

### Custom Domain

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Update DNS records as instructed

### Build Settings Override

Create `vercel.json` in your `frontend` folder:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### Redirects and Rewrites

Add to `vercel.json`:

```json
{
  "routes": [
    {
      "src": "/[^.]+",
      "dest": "/",
      "status": 200
    }
  ]
}
```

This ensures React Router works correctly with direct URL access.

---

## 🐛 Troubleshooting

### Build Fails

**Check build logs on Vercel dashboard**

Common issues:
- TypeScript errors: Run `npm run build` locally first
- Missing dependencies: Ensure all deps are in `package.json`
- Environment variables: Make sure `VITE_API_URL` is set

### Backend Connection Issues

**Error: "✗ Disconnected" in frontend**

Solutions:
1. Check backend is running on Render
2. Verify `VITE_API_URL` is correct in Vercel env vars
3. Check backend CORS settings allow Vercel domain
4. Test backend health: `curl https://niti-setu-backend.onrender.com/api/health`

### CORS Errors

**Error: "blocked by CORS policy"**

1. Verify backend CORS configuration includes Vercel domains
2. Redeploy backend after CORS changes
3. Check browser console for exact error
4. Verify credentials setting matches on both ends

### Environment Variables Not Working

1. Ensure variable starts with `VITE_`
2. Redeploy after adding environment variables
3. Check variable is set for correct environment (Production/Preview/Development)
4. Hard refresh browser (Ctrl+F5) after deployment

### Page Shows 404 on Refresh

Add the redirect configuration in `vercel.json` (see Advanced Configuration above)

---

## 🔄 Updating Your Deployment

### Automatic Update (Recommended)
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys in ~30 seconds
```

### Manual Redeploy
1. Go to Vercel dashboard
2. Go to **"Deployments"**
3. Click **"Redeploy"** on the latest deployment

### Rollback to Previous Version
1. Go to **"Deployments"**
2. Click on a previous successful deployment
3. Click **"Promote to Production"**

---

## 📊 Monitoring & Analytics

### View Deployment Logs
1. Go to your project in Vercel Dashboard
2. Click **"Deployments"** → Select a deployment
3. View **"Build Logs"** or **"Function Logs"**

### Enable Analytics
1. Go to **"Analytics"** tab
2. Enable Web Analytics (free tier available)
3. Track page views, performance, and Web Vitals

### Real-time Logs
```bash
vercel logs [deployment-url]
```

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` to Git
- ✅ Use different API URLs for dev/staging/production
- ✅ Rotate API keys regularly
- ✅ Use Vercel's encrypted environment variables

### HTTPS
- ✅ Vercel provides automatic HTTPS
- ✅ Enforce HTTPS redirects (enabled by default)
- ✅ Use secure cookies if implementing authentication

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Custom Domains](https://vercel.com/docs/custom-domains)

---

## 📝 Next Steps After Deployment

1. ✅ **Test the deployed application** - Click all buttons, test all features
2. ✅ **Set up custom domain** (optional)
3. ✅ **Enable Vercel Analytics** for performance monitoring
4. ✅ **Configure automatic preview deployments** for PRs
5. ✅ **Set up production monitoring** (Sentry, LogRocket, etc.)
6. ✅ **Update backend FRONTEND_URL** env variable with your Vercel domain
7. ✅ **Configure CI/CD workflows** if needed

---

## 🎯 Production Checklist

Before going live:
- [ ] Test all API endpoints from deployed frontend
- [ ] Verify error handling works correctly
- [ ] Check mobile responsiveness
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify loading states and user feedback
- [ ] Check console for errors or warnings
- [ ] Test with slow network (DevTools throttling)
- [ ] Verify SEO meta tags (if applicable)
- [ ] Test backend on Render (ensure it doesn't sleep)

---

## 💡 Tips for Success

### Faster Deployments
- Use Vercel's build cache
- Minimize dependencies
- Use environment-specific builds
- Enable parallel builds in monorepos

### Better Performance
- Enable Vercel Analytics to monitor performance
- Use lazy loading for routes
- Optimize images (use Vercel Image Optimization)
- Minimize bundle size
- Use code splitting

### Development Workflow
- Use preview deployments for testing
- Create separate branches for features
- Use Vercel CLI for local testing with production env
- Set up GitHub integration for automatic deployments

---

## ✨ Your Frontend is Ready!

Your NitiSetu frontend is now configured and ready to deploy on Vercel! The entire deployment process takes about 30-60 seconds. Once live, you'll have:

- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on every push
- ✅ Preview URLs for every PR
- ✅ Built-in performance monitoring
- ✅ Zero-configuration deployment

**Deployment URL**: `https://[your-project-name].vercel.app`

Good luck with your deployment! 🚀
