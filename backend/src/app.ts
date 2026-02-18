import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rateLimiter';
import routes from './routes/index';
import { errorHandler, notFound } from './middleware/errorhandler';

const app = express();

app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
    ],
    credentials: true
}));



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use('/api', apiLimiter);
app.use('/api', routes)

//404 handler (Must be after routes)
app.use(notFound);
//Global Error Handler(Must be at last)
app.use(errorHandler);



export default app;