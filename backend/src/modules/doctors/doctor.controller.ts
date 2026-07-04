import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { query } from '../../config/db';
import { generateSlotsForDate } from '../../utils/slotGenerator';
import { AppError } from '../../utils/AppError';

export const searchDoctors = asyncHandler(async (req: Request, res: Response) => {
  const { specialisation, name } = req.query;
  const result = await query(
    `SELECT d.id, d.specialisation, d.slot_duration, d.bio,
            u.name, u.email
     FROM doctors d JOIN users u ON d.user_id = u.id
     WHERE ($1::text IS NULL OR LOWER(d.specialisation) LIKE LOWER($1))
       AND ($2::text IS NULL OR LOWER(u.name) LIKE LOWER($2))
     ORDER BY u.name`,
    [
      specialisation ? `%${specialisation}%` : null,
      name           ? `%${name}%`           : null,
    ]
  );
  res.json({ status: 'success', data: result.rows });
});

export const getDoctorProfile = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT d.*, u.name, u.email, u.phone
     FROM doctors d JOIN users u ON d.user_id = u.id
     WHERE d.id = $1`,
    [req.params.id]
  );
  if (!result.rows.length) throw new AppError('Doctor not found', 404);
  res.json({ status: 'success', data: result.rows[0] });
});

export const getDoctorSlots = asyncHandler(async (req: Request, res: Response) => {
  const { id: doctorId, date } = req.params;

  // Check for leave
  const leave = await query(
    'SELECT id FROM doctor_leaves WHERE doctor_id = $1 AND leave_date = $2',
    [doctorId, date]
  );
  if (leave.rows.length > 0) {
    return res.json({ status: 'success', data: [], message: 'Doctor on leave' });
  }

  const doctorResult = await query('SELECT * FROM doctors WHERE id = $1', [doctorId]);
  if (!doctorResult.rows.length) throw new AppError('Doctor not found', 404);

  await generateSlotsForDate(doctorResult.rows[0], date);

  // Return only available slots (and release expired holds first)
  await query(
    `UPDATE slots SET status = 'available', held_until = NULL, held_by = NULL
     WHERE status = 'held' AND held_until < NOW()`
  );

  const slots = await query(
    `SELECT id, start_time, end_time, status
     FROM slots
     WHERE doctor_id = $1
       AND DATE(start_time AT TIME ZONE 'UTC') = $2
       AND status = 'available'
     ORDER BY start_time`,
    [doctorId, date]
  );

  res.json({ status: 'success', data: slots.rows });
});
