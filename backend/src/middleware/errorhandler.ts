import { Request, Response, NextFunction } from "express";


export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Internal Server Error";
    //handling mongoose validation error

    if (error.name === 'ValidationError') {
        statusCode = 400;
        const errors = Object.values(error.errors).map((e: any) => e.message);
        message = errors.join(". ");
    }
    //handling dublicate key errors
    if (error.code === 11000) {
        statusCode = 400;
        const field = Object.keys(error.keyValue)[0];
        message = `${field} already exists`;
    }

    //handling invalid mongodb objectid
    if (error.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${error.path}:${error.value}`;
    }
    //handling jwt errors

    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = "Invalid Token. Please Login Again.";
    }
    if (error.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token Expired Please Login Again.";
    }
    //Log error in development 
    if (process.env.NODE_ENV === "development") {
        console.error(`ERROR 💥:`, error);
        console.error(error.stack);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    });
};

//if someone hits a route that doesn't exist

export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not Found`
    });
};