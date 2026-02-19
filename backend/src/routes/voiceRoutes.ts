
import { parseProfileFromVoice, parseQueryFromVoice } from '../controllers/voiceController';
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/parse-profile', protect, aiLimiter, parseProfileFromVoice);

router.post('/parse-query', protect, aiLimiter, parseQueryFromVoice);

export default router;

