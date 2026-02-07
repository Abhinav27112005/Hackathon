import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './middleware';
import exampleRoutes from './routes/exampleRoutes';

dotenv.config();

const app: Express = express();
const port = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);


// Routes
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to NitiSetu API',
        version: '1.0.0',
        status: 'running'
    });
});

app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/v1', exampleRoutes);


// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
