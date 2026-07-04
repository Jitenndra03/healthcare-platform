import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import { errorHandler } from './middleware/errorHandler';
import authRoutes        from './modules/auth/auth.routes';
import adminRoutes       from './modules/admin/admin.routes';
import doctorRoutes      from './modules/doctors/doctor.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';

// Start background workers
import './jobs/workers/emailWorker';
import './jobs/workers/calendarWorker';
import './jobs/workers/reminderWorker';
import { startScheduler } from './jobs/scheduler';

const app = express();

// ─── SECURITY ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL?.replace(/\/$/, ''), // without trailing slash
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS blocked origin:', origin);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── PARSING ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/doctors',      doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await startScheduler();
});

export default app;
