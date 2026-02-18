# NitiSetu Backend - Render Deployment Guide

## 📋 Overview

This guide will help you deploy your NitiSetu backend API on Render.

### Backend Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express 5.x
- **Build Tool**: TypeScript Compiler (tsc)
- **Dependencies**: express, cors, dotenv

---

## 🚀 Deployment Steps

### 1. Push Your Code to GitHub/GitLab

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

```bash
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### 2. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Select your repository containing NitiSetu

### 3. Configure the Web Service

Use these **exact settings** in the Render configuration:

| Setting | Value |
|---------|-------|
| **Name** | `nitisetu-backend` (or your preferred name) |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or paid tier as needed) |

### 4. Set Environment Variables

In the **Environment** section on Render, add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `PORT` | *(leave empty)* | Render auto-assigns this |

**Additional variables you might need later:**
- Database connection strings
- API keys
- JWT secrets
- CORS origins

### 5. Deploy

Click **"Create Web Service"** and Render will:
1. Clone your repository
2. Run `npm install && npm run build`
3. Execute `npm start`
4. Assign a public URL (e.g., `https://nitisetu-backend.onrender.com`)

---

## ✅ Deployment Checklist

- [x] Code pushed to Git repository
- [x] Backend builds successfully with `npm run build`
- [x] `package.json` has correct scripts
- [x] `.gitignore` excludes `node_modules`, `dist`, and `.env`
- [x] Server listens on `0.0.0.0` (✅ Already configured)
- [x] Port reads from `process.env.PORT` (✅ Already configured)
- [ ] Environment variables set on Render
- [ ] Database/external services configured (if applicable)

---

## 🔧 Changes Made for Deployment

### 1. Port Configuration
**File**: `src/index.ts`
```typescript
// Ensures PORT is a number type
const port = Number(process.env.PORT) || 5000;

// Binds to 0.0.0.0 for external access
app.listen(port, '0.0.0.0', () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
```

---

## 📍 Your API Endpoints

After deployment, your API will be accessible at:

- **Base URL**: `https://your-app-name.onrender.com`
- **Health Check**: `GET https://your-app-name.onrender.com/api/health`
- **Welcome**: `GET https://your-app-name.onrender.com/`
- **API v1**: `GET https://your-app-name.onrender.com/api/v1/*`

---

## 🔍 Testing the Deployment

### Test Health Endpoint
```bash
curl https://your-app-name.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-07T10:46:59.000Z"
}
```

### Test Welcome Endpoint
```bash
curl https://your-app-name.onrender.com/
```

Expected response:
```json
{
  "message": "Welcome to NitiSetu API",
  "version": "1.0.0",
  "status": "running"
}
```

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Sleep after inactivity**: Free tier services sleep after 15 minutes of inactivity
- **Cold starts**: First request after sleep takes ~30-60 seconds
- **Monthly hours**: 750 hours/month (enough for 1 service running 24/7)

### CORS Configuration
When connecting your frontend, update CORS settings in `src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',           // Local development
    'https://your-frontend-url.com'    // Production frontend
  ],
  credentials: true
}));
```

### Automatic Deploys
Render automatically redeploys when you push to your connected branch. To disable:
- Go to **Settings** → **Build & Deploy** → Disable **Auto-Deploy**

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs on Render dashboard
- Ensure `npm run build` works locally
- Verify all dependencies are in `dependencies` (not `devDependencies` for production needs)

### Service Won't Start
- Check start logs on Render dashboard
- Verify `npm start` works with built files locally
- Ensure `dist/index.js` exists after build

### Port Issues
- Don't hardcode port numbers
- Always use `process.env.PORT`
- Bind to `0.0.0.0`, not `localhost`

### Environment Variables Not Working
- Verify variables are set in Render dashboard
- Redeploy after adding new environment variables
- Use `dotenv` only for local development

---

## 🔄 Updating Your Deployment

### Manual Redeploy
1. Go to Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Automated via Git
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys
```

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)

---

## 📝 Next Steps

1. **Deploy the backend** following this guide
2. **Test all endpoints** using the deployed URL
3. **Update frontend** to use the Render URL instead of `localhost:5000`
4. **Set up monitoring** (Render provides basic metrics)
5. **Configure custom domain** (optional, available on paid tiers)

---

## ✨ Your Backend is Ready!

Your NitiSetu backend is now configured and ready to deploy on Render. The deployment should take about 2-5 minutes. Once live, you'll have a publicly accessible API URL to use with your frontend.

Good luck with your deployment! 🚀
