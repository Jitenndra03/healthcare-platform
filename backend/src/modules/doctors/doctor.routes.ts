import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { searchDoctors, getDoctorSlots, getDoctorProfile } from './doctor.controller';

const router = Router();

router.get('/search',         authenticate, searchDoctors);
router.get('/:id',            authenticate, getDoctorProfile);
router.get('/:id/slots/:date', authenticate, getDoctorSlots);

export default router;
