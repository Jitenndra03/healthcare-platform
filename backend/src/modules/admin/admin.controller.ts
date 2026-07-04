import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { pool, query } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { emailQueue } from '../../jobs/queue';

export const createDoctor = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, specialisation,
          slot_duration, work_start, work_end, work_days, bio } = req.body;

  const bcrypt = require('bcryptjs');
  const hashed = await bcrypt.hash(password || 'Doctor@1234', 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, 'doctor', $4) RETURNING id`,
      [name, email, hashed, phone]
    );
    const userId = userResult.rows[0].id;

    const doctorResult = await client.query(
      `INSERT INTO doctors
         (user_id, specialisation, slot_duration, work_start, work_end, work_days, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, specialisation, slot_duration ?? 30,
       work_start ?? '09:00', work_end ?? '17:00',
       work_days ?? [1,2,3,4,5], bio ?? null]
    );

    await client.query('COMMIT');
    res.status(201).json({ status: 'success', data: doctorResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export const getAllDoctors = asyncHandler(async (_req: Request, res: Response) => {
  const result = await query(
    `SELECT d.*, u.name, u.email, u.phone
     FROM doctors d JOIN users u ON d.user_id = u.id
     ORDER BY u.name`
  );
  res.json({ status: 'success', data: result.rows });
});

export const updateDoctor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { specialisation, slot_duration, work_start, work_end, work_days, bio } = req.body;
  const result = await query(
    `UPDATE doctors SET
       specialisation = COALESCE($1, specialisation),
       slot_duration  = COALESCE($2, slot_duration),
       work_start     = COALESCE($3, work_start),
       work_end       = COALESCE($4, work_end),
       work_days      = COALESCE($5, work_days),
       bio            = COALESCE($6, bio)
     WHERE id = $7 RETURNING *`,
    [specialisation, slot_duration, work_start, work_end, work_days, bio, id]
  );
  if (!result.rows.length) throw new AppError('Doctor not found', 404);
  res.json({ status: 'success', data: result.rows[0] });
});

// KEY FEATURE: mark leave + notify affected patients
export const markLeave = asyncHandler(async (req: Request, res: Response) => {
  const { id: doctorId } = req.params;
  const { leave_date, reason } = req.body;

  if (!leave_date) throw new AppError('leave_date is required', 400);

  // Find all confirmed appointments on that day for this doctor
  const affected = await query(
    `SELECT a.id, a.google_event_id,
            u.email AS patient_email, u.name AS patient_name
     FROM appointments a
     JOIN slots s ON a.slot_id = s.id
     JOIN users u ON a.patient_id = u.id
     WHERE a.doctor_id = $1
       AND DATE(s.start_time AT TIME ZONE 'UTC') = $2
       AND a.status = 'confirmed'`,
    [doctorId, leave_date]
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cancel all affected appointments
    for (const appt of affected.rows) {
      await client.query(
        `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1`,
        [appt.id]
      );

      // Queue cancellation email (decoupled — won't break if email fails)
      await emailQueue.add('cancellation', {
        to: appt.patient_email,
        name: appt.patient_name,
        leave_date,
        reason: reason ?? 'Doctor unavailable',
        google_event_id: appt.google_event_id,
      }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    }

    // Insert leave record
    await client.query(
      `INSERT INTO doctor_leaves (doctor_id, leave_date, reason)
       VALUES ($1, $2, $3) ON CONFLICT (doctor_id, leave_date) DO NOTHING`,
      [doctorId, leave_date, reason ?? null]
    );

    await client.query('COMMIT');
    res.json({
      status: 'success',
      message: `Leave marked. ${affected.rows.length} appointment(s) cancelled and patients notified.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export const getLeaves = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    'SELECT * FROM doctor_leaves WHERE doctor_id = $1 ORDER BY leave_date',
    [req.params.id]
  );
  res.json({ status: 'success', data: result.rows });
});

export const removeLeave = asyncHandler(async (req: Request, res: Response) => {
  await query('DELETE FROM doctor_leaves WHERE id = $1', [req.params.leaveId]);
  res.json({ status: 'success', message: 'Leave removed' });
});
