# NitiSetu Backend API

Express TypeScript backend for NitiSetu application.

## Features

- TypeScript support
- Express.js framework
- CORS enabled
- Environment variables support
- Hot reload with nodemon
- Organized project structure (routes, controllers, middleware)

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
├── .env                 # Environment variables
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file with:
```
PORT=5000
NODE_ENV=development
```

3. Run development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled production code

## API Documentation

### Health Check
- **GET** `/api/health` - Check server status

### Example Endpoints
- **GET** `/api/v1/example` - Get example data
- **POST** `/api/v1/example` - Create example data
  - Body: `{ "name": string, "description": string }`

## Adding New Routes

1. Create a controller in `src/controllers/`
2. Create routes in `src/routes/`
3. Import and use routes in `src/index.ts`

## Technologies

- Node.js
- Express.js
- TypeScript
- CORS
- dotenv
- ts-node
- nodemon
