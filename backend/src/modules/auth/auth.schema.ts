import { z } from 'zod';

export const registerSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(['patient', 'doctor', 'admin']).default('patient'),
  phone:    z.string().optional(),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});
