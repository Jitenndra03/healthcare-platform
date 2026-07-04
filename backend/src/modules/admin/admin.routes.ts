import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import {
  createDoctor, getAllDoctors, updateDoctor,
  markLeave, getLeaves, removeLeave
} from './admin.controller';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.post('/doctors',              createDoctor);
router.get('/doctors',               getAllDoctors);
router.put('/doctors/:id',           updateDoctor);
router.post('/doctors/:id/leave',    markLeave);
router.get('/doctors/:id/leaves',    getLeaves);
router.delete('/leaves/:leaveId',    removeLeave);

export default router;
