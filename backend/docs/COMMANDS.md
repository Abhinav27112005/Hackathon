# NitiSetu - Quick Commands Reference

## 🚀 Getting Started

### First Time Setup
```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### Running the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📦 Backend Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production code |
| `npm test` | Run tests |

**Backend runs on:** http://localhost:5000

## 🎨 Frontend Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

**Frontend runs on:** http://localhost:5173

## 🔧 Common Tasks

### Adding New Backend Route
1. Create controller in `backend/src/controllers/`
2. Create route in `backend/src/routes/`
3. Import and use in `backend/src/index.ts`

### Adding New Frontend Component
1. Create component file in `frontend/src/components/`
2. Import and use in `App.tsx` or other components

### Environment Variables

**Backend** (`.env`)
```env
PORT=5000
NODE_ENV=development
```

**Frontend** (`.env`)
```env
VITE_API_URL=http://localhost:5000
```

## 📝 API Testing

### Using cURL

```bash
# Health Check
curl http://localhost:5000/api/health

# Get Example
curl http://localhost:5000/api/v1/example

# Create Example
curl -X POST http://localhost:5000/api/v1/example \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test description"}'
```

### Using Browser
- http://localhost:5000 - Welcome message
- http://localhost:5000/api/health - Health check
- http://localhost:5173 - Frontend app

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows - Kill process on port
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Clear node_modules
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📂 Project Structure at a Glance

```
NitiSetu/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── utils/
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env
    └── package.json
```

## 💡 Quick Tips

1. **Always run backend before frontend**
2. **Check `.env` files if API calls fail**
3. **Use `npm run dev` for development**
4. **Use `npm run build` before production deployment**
5. **Check console for errors in both terminals**

---

Made with ❤️ for NitiSetu
