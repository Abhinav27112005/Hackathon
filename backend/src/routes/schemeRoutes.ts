import { deleteScheme, getAllSchemes, getSchemeById, getSchemeStatus, reprocessScheme, uploadScheme } from '../controllers/schemeController';
import { Router } from 'express';
import { protect } from '../middleware/auth';
import upload from '../middleware/pdfupload';
import { schemeUploadRules, validate } from '../middleware/validator';

const router = Router();

router.post('/upload', protect, upload.single('pdfFile'), schemeUploadRules, validate, uploadScheme);

//List all scheme
router.get('/', protect, getAllSchemes);

//check processing status for polling
router.get('/:id/status', protect, getSchemeStatus);

//Retry processing for failed schemes
router.post('/:id/reprocess', protect, reprocessScheme);

//Getting single scheme details
router.get('/:id', protect, getSchemeById);

//Delete scheme and all its data
router.delete('/:id', protect, deleteScheme);

export default router;

