import { checkAllSchemes, checkSingleScheme, getCheckById, getHistory } from '../controllers/eligibilityController';
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { checkEligibilityRules, validate } from '../middleware/validator';

const router = Router();

router.post('/check', protect, aiLimiter, checkEligibilityRules, validate, checkSingleScheme);

router.post('/check-all', protect, aiLimiter, checkAllSchemes);

router.get('/history', protect, getHistory);

router.get('/:checkId', protect, getCheckById);

export default router;

