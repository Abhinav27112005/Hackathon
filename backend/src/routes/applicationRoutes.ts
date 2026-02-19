import { createApplication, getAutoFilledForm, getMyApplications, updateApplication } from '../controllers/applicationController';
import { Router } from 'express';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, createApplication);

router.get('/', protect, getMyApplications);

router.get('/:id/form', protect, getAutoFilledForm);

router.put('/:id', protect, updateApplication);

export default router;
