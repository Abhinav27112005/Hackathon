# NitiSetu

A full-stack application with React TypeScript frontend and Node.js TypeScript backend.

## Project Structure

```
NitiSetu/
├── frontend/          # React TypeScript application
├── backend/           # Node.js Express TypeScript API
└── README.md         # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Getting Started

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- CSS3

### Backend
- Node.js
- Express
- TypeScript
- CORS
- dotenv

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/v1/example` - Example GET endpoint
- `POST /api/v1/example` - Example POST endpoint

## Development

1. Start the backend server first
2. Start the frontend development server
3. The frontend will proxy API requests to the backend

## License

ISC
