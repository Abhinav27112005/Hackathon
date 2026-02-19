import { getDashboardSummary, getMetrics, getRecentActivity } from '../controllers/dashboardController';
import { Router } from 'express';
import { protect } from '../middleware/auth';


const router = Router();

router.get('/summary', protect, getDashboardSummary);

router.get('/metrics', protect, getMetrics);

router.get('/activity', protect, getRecentActivity);

export default router;

