import { Router } from 'express';
import { exampleController } from '../controllers/exampleController';

const router = Router();

// Example routes
router.get('/example', exampleController.getExample);
router.post('/example', exampleController.createExample);

export default router;
