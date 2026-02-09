import User, { IUser } from "../models/userModels";
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express";

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

interface JwtPayload {
    userId: string;
    role: string;
}

//Protect Middleware: checks if the user is logged in or not, runs before the controller function

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token: string | undefined;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Not authorized Please Login First",
            })
            return;
        }
        //Verify Token

        const decode = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        //Finding user in db
        const user = await User.findById(decode.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User belonging to this token is no longer exists.",
            });
            return;
        }
        //Attaching user to request
        req.user = user;

        //Moving to the next middleware/controller
        next();
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: "Invalid Token Login Again"
            })
            return;
        }

        if (error.name === "TokenExpiredError") {
            res.status(401).json({
                success: false,
                message: "Token expired"
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Auth Error"
        })
    }
};

//Authorize middleware
//Checks for the user has the right role
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Role ${req.user?.role} is not authorized for this action`
            });
            return;
        }
        next();
    }
}

