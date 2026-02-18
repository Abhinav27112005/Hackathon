import { createProfile, createProfileFromVoice, getProfile, updateProfile } from "../controllers/profileController";
import { Router } from "express"
import { protect } from "../middleware/auth";
import { aiLimiter } from "../middleware/rateLimiter";
import { createProfileRules, updateProfileRules, validate, voiceProfileRules } from "../middleware/validator";

const router = Router();

//All Profile routes require authentication so protect middleware runns first on every routes

//client -> Profile -> validator -> controller

router.get('/', protect, getProfile);

//Creating new Profile
router.post('/', protect, createProfileRules, validate, createProfile);

//update existing profile
router.put('/', protect, updateProfileRules, validate, updateProfile);

router.post('/voice', protect, aiLimiter, voiceProfileRules, validate, createProfileFromVoice);

export default router;

