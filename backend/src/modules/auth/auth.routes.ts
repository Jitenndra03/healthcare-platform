import { Router } from 'express';
import { register, login, googleCallback, getMe } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.get('/google/callback', googleCallback);
router.get('/me', authenticate, getMe);

export default router;
