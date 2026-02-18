# NitiSetu - Setup Guide

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

Backend will run on: http://localhost:5000

### 2. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: http://localhost:5173

## What's Included

### Backend Structure
```
backend/
├── src/
│   ├── controllers/
│   │   └── exampleController.ts    # Example API handlers
│   ├── routes/
│   │   └── exampleRoutes.ts        # API route definitions
│   ├── middleware/
│   │   └── index.ts                # Custom middleware (logger, validation)
│   └── index.ts                    # Main Express server
├── .env                            # Environment variables
├── tsconfig.json                   # TypeScript config
└── package.json                    # Dependencies & scripts
```

### Frontend Structure
```
frontend/
├── src/
│   ├── utils/
│   │   └── api.ts                  # API client utility
│   ├── App.tsx                     # Main React component
│   ├── App.css                     # Component styles
│   ├── index.css                   # Global styles
│   └── main.tsx                    # Entry point
├── .env                            # Environment variables
└── package.json                    # Dependencies & scripts
```

## Features Implemented

### Backend ✓
- ✅ TypeScript configuration
- ✅ Express.js server
- ✅ CORS enabled
- ✅ Environment variables (.env)
- ✅ Structured routing (routes/controllers/middleware)
- ✅ Error handling middleware
- ✅ Request logging middleware
- ✅ Example API endpoints (GET/POST)
- ✅ Hot reload with nodemon

### Frontend ✓
- ✅ React 18 with TypeScript
- ✅ Vite for fast development
- ✅ API client utility
- ✅ Environment variables support
- ✅ Modern UI with dark theme
- ✅ Responsive design
- ✅ API health check
- ✅ Example data fetching
- ✅ Form handling
- ✅ Beautiful gradients & animations

## Available API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/v1/example` - Get example data
- `POST /api/v1/example` - Create example data
  - Body: `{ "name": string, "description": string }`

## Testing the Setup

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173 in your browser
4. You should see the NitiSetu app with:
   - Backend connection status
   - Button to fetch example data
   - Form to create new data

## Next Steps

### Add Database
```bash
cd backend
npm install mongoose  # For MongoDB
# OR
npm install pg        # For PostgreSQL
```

### Add More Features
- User authentication
- Database integration
- More API endpoints
- Additional React components
- State management (Redux/Zustand)
- Form validation
- File upload
- Real-time features (Socket.io)

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
# Add your database URL here when ready
# DATABASE_URL=your_database_url
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Troubleshooting

### Port already in use
- Change PORT in backend/.env
- Update VITE_API_URL in frontend/.env

### CORS errors
- Make sure backend is running
- Check backend CORS configuration in src/index.ts

### Module not found errors
- Run `npm install` in both frontend and backend directories

## Tech Stack Summary

**Frontend:**
- React 18
- TypeScript
- Vite
- Modern CSS (Dark theme, gradients, animations)

**Backend:**
- Node.js
- Express.js
- TypeScript
- CORS middleware
- dotenv for environment variables

Happy Coding! 🚀
