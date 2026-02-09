import rateLimit from "express-rate-limit"

//This helps to prevents abuse by limiting how many requests a single ip can make in a single time window
//Maximum of 10 login attempts per 15 minutes

//General API limiter(for all routes)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

//Strict limiter for auth routes (login/register)

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,//15 minutes
    max: 10,
    message: {
        success: false,
        message: "Too many login attempts. Try again after 15 minutes",
    },
});

//Ai routes limiter (restricting expensive openai calls)
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000, //1 minute
    max: 5, // 5 ai requests per minutes
    message: {
        success: false,
        message: "AI rate limit reached. Please try again after 1 minute"
    },

});