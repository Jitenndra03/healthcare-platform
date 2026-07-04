import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import {
  holdSlot, bookAppointment, getMyAppointments,
  submitPostVisitNotes, getDoctorAppointments,
  cancelAppointment
} from './appointment.controller';

const router = Router();

// Patient routes
router.post('/slots/:slotId/hold',  authenticate, requireRole('patient'), holdSlot);
router.post('/',                    authenticate, requireRole('patient'), bookAppointment);
router.get('/my',                   authenticate, requireRole('patient'), getMyAppointments);
router.delete('/:id',               authenticate, requireRole('patient'), cancelAppointment);

// Doctor routes
router.get('/doctor',               authenticate, requireRole('doctor'), getDoctorAppointments);
router.put('/:id/notes',            authenticate, requireRole('doctor'), submitPostVisitNotes);

export default router;
