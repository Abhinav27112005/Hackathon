import { Router, Request, Response, NextFunction } from "express";

import authRoutes from './authRoutes';
import exampleRoutes from "./exampleRoutes";
import profileRoutes from "./profileRoutes";
import schemeRoutes from './schemeRoutes';

const router = Router();
// Routes
router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Welcome to NitiSetu API',
        version: '1.0.0',
        status: 'running'
    });
});

router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        success: true,
        timestamp: new Date().toISOString()
    });
});

router.use('/auth', authRoutes);
router.use('/v1', exampleRoutes);//this routes is only for testing purpose
router.use('/profile', profileRoutes);
router.use('/schemes', schemeRoutes);

export default router;
