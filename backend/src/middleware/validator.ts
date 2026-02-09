

//Before Processing check if the data is valid

import { NextFunction, Request, Response } from "express";
import { validationResult, body } from "express-validator";

//Run validation Results
export const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation Failed',
            errors: errors.array().map((e: any) => ({
                field: e.path || 'unknown',
                message: e.msg,
            })),
        });
        return;
    }
    next();
}

//validation rules for each routes..
//Rules for user registration

export const registerRules = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 character long'),

    body('phone').trim().notEmpty().withMessage("Phone number is required").matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10 digit Indian Phone Number"),
    body('password').optional().isLength({ min: 6, max: 20 }).withMessage("Password must be 6-20 characters long"),

    body('language').optional().isIn(['en', 'hi', 'mr', 'ta']).withMessage("Language must be en,hi,mr or ta"),
];

//Rules for user login and send otp

export const phoneRules = [
    body('phone').trim().notEmpty().withMessage("Phone number is required").matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10 digit Indian Phone Number")
];

//rules for verifyOTP

export const verifyOTPRules = [
    body('phone').trim().notEmpty().withMessage("Phone numbebr is required").matches(/^[6-9]\d{9}$/).withMessage("Enter a valid Phone Number"),

    body('otp').trim().notEmpty().withMessage("OTP is required").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits").isNumeric().withMessage("OTP musty contain only numbers")
];