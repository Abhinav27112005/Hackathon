

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


export const createProfileRules = [
    body('name').trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters long"),

    body('state').trim().notEmpty().withMessage("State is required"),

    body('district').trim().notEmpty().withMessage("District is required"),

    body('landHolding').notEmpty().withMessage("Land holding is required").isFloat({ min: 0, max: 10000 }).withMessage("Land holding must be a valid number between 0 and 10000 acres"),

    body('socialCategory').notEmpty().withMessage("Social Category is required").isIn(['General', 'OBC', 'Sc', 'ST', 'Minority']).withMessage("Social category must be one of General, OBC, SC, ST, MINORITY"),

    body('age').optional().isInt({ min: 18, max: 120 }).withMessage("Age must be between 18 and 120"),

    body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage("Gender must be Male Female or Other"),

    body('landType').optional().isIn(['Irrigated', 'Rainfed', 'Both']).withMessage("Land type must be Irrigated Rainfed or Both"),

    body('cropTypes').optional().isArray().withMessage("Crop types must be an array"),

    body('annualIncome').optional().isIn(['Below 2L', '2L-5L', '5L-10L', 'Above 10L']).withMessage("Annual income must be one of Below 2L, 2L-5L, 5L-10L, Above 10L"),

    body('hasBankAccount').optional().isBoolean().withMessage("Has bank account must be a boolean"),

    body('hasKCC').optional().isBoolean().withMessage("Has KCC must be a boolean"),

];

//New Rules for Update Profile put api/profile

export const updateProfileRules = [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters long"),

    body('landHolding').optional().isFloat({ min: 0, max: 10000 }).withMessage("Land holding must be valid"),

    body('socialCategory').optional().isIn(['General', 'OBC', 'SC', 'ST', 'MINORITY']).withMessage("Invalid Social Category"),

    body('age').optional().isInt({ min: 18, max: 120 }).withMessage("Age must be between 18 and 120"),

    body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage("Invalid gender")
];


//New rules for post api/profile/voice
export const voiceProfileRules = [
    body('voiceText').trim().notEmpty().withMessage("Voice text is required").isLength({ min: 10, max: 5000 }).withMessage("Voice text must be between 10 and 5000 characters long"),

    body('language').optional().isIn(['en', 'hi', 'mr', 'ta']).withMessage("Language must be en,hi,mr or ta"),
];