import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
};

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    // Add your validation logic here
    next();
};
