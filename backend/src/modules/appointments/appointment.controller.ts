import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { pool, query } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { generatePreVisitSummary, generatePostVisitSummary } from '../../services/llm.service';
import { emailQueue, calendarQueue } from '../../jobs/queue';

const HOLD_MINUTES = 10;

// ─── HOLD SLOT (patient selects slot, fills symptom form) ─────────────────────
export const holdSlot = asyncHandler(async (req: Request, res: Response) => {
  const { slotId } = req.params;
  const patientId = req.user!.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const slotResult = await client.query(
      `SELECT * FROM slots WHERE id = $1 AND status = 'available' FOR UPDATE`,
      [slotId]
    );

    if (!slotResult.rows.length) {
      await client.query('ROLLBACK');
      throw new AppError('Slot is no longer available', 409);
    }

    const heldUntil = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    await client.query(
      `UPDATE slots
       SET status = 'held', held_until = $1, held_by = $2
       WHERE id = $3`,
      [heldUntil, patientId, slotId]
    );

    await client.query('COMMIT');
    res.json({ status: 'success', data: { slotId, held_until: heldUntil } });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ─── BOOK APPOINTMENT (after symptom form — atomic with FOR UPDATE) ───────────
export const bookAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { slot_id, symptoms } = req.body;
  const patientId = req.user!.id;

  if (!slot_id) throw new AppError('slot_id is required', 400);

  // Generate LLM pre-visit summary (with graceful fallback)
  const preVisitSummary = await generatePreVisitSummary(symptoms || '');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row — concurrent requests queue here
    const slotResult = await client.query(
      `SELECT s.*, d.id AS doctor_id
       FROM slots s
       JOIN doctors d ON s.doctor_id = d.id
       WHERE s.id = $1
         AND (s.status = 'available' OR (s.status = 'held' AND s.held_by = $2))
       FOR UPDATE`,
      [slot_id, patientId]
    );

    if (!slotResult.rows.length) {
      await client.query('ROLLBACK');
      throw new AppError('Slot is no longer available', 409);
    }

    const slot = slotResult.rows[0];

    // Mark slot as booked
    await client.query(
      `UPDATE slots SET status = 'booked', held_until = NULL, held_by = NULL
       WHERE id = $1`,
      [slot_id]
    );

    // Create appointment
    const apptResult = await client.query(
      `INSERT INTO appointments
         (slot_id, patient_id, doctor_id, symptoms, pre_visit_summary, status)
       VALUES ($1, $2, $3, $4, $5, 'confirmed')
       RETURNING *`,
      [slot_id, patientId, slot.doctor_id, symptoms || null,
       JSON.stringify(preVisitSummary)]
    );

    const appointment = apptResult.rows[0];
    await client.query('COMMIT');

    // ── Post-booking side effects (decoupled — failures don't roll back booking) ──
    const [patientResult, doctorResult] = await Promise.all([
      query('SELECT name, email, google_refresh_token FROM users WHERE id = $1', [patientId]),
      query(
        `SELECT u.name, u.email, u.google_refresh_token
         FROM users u JOIN doctors d ON d.user_id = u.id
         WHERE d.id = $1`,
        [slot.doctor_id]
      ),
    ]);

    const patient = patientResult.rows[0];
    const doctor  = doctorResult.rows[0];

    await emailQueue.add('booking_confirmation', {
      appointmentId: appointment.id,
      patientEmail:  patient.email,
      patientName:   patient.name,
      doctorName:    doctor.name,
      startTime:     slot.start_time,
      endTime:       slot.end_time,
      preVisitSummary,
    }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

    await calendarQueue.add('create_event', {
      appointmentId:          appointment.id,
      patientRefreshToken:    patient.google_refresh_token,
      doctorRefreshToken:     doctor.google_refresh_token,
      patientEmail:           patient.email,
      doctorEmail:            doctor.email,
      summary:                `Medical Appointment with Dr. ${doctor.name}`,
      startTime:              slot.start_time,
      endTime:                slot.end_time,
    }, { attempts: 3 });

    res.status(201).json({
      status: 'success',
      data: { ...appointment, pre_visit_summary: preVisitSummary },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ─── DOCTOR SUBMITS POST-VISIT NOTES ─────────────────────────────────────────
export const submitPostVisitNotes = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes, prescription } = req.body;

  const apptResult = await query(
    `SELECT a.*, u.email, u.name
     FROM appointments a
     JOIN users u ON a.patient_id = u.id
     WHERE a.id = $1 AND a.doctor_id = (
       SELECT id FROM doctors WHERE user_id = $2
     )`,
    [id, req.user!.id]
  );

  if (!apptResult.rows.length) throw new AppError('Appointment not found', 404);

  // LLM post-visit summary (with fallback)
  const postVisitSummary = await generatePostVisitSummary(notes || '');

  await query(
    `UPDATE appointments SET
       post_visit_notes   = $1,
       post_visit_summary = $2,
       prescription       = $3,
       status             = 'completed',
       updated_at         = NOW()
     WHERE id = $4`,
    [notes, postVisitSummary, JSON.stringify(prescription ?? []), id]
  );

  // Queue medication reminders if prescription provided
  if (prescription && prescription.length > 0) {
    const { reminderQueue } = await import('../../jobs/queue');
    await reminderQueue.add('setup_reminders', {
      appointmentId: id,
      patientId: apptResult.rows[0].patient_id,
      prescription,
    });
  }

  // Send post-visit summary email to patient
  await emailQueue.add('post_visit_summary', {
    to:         apptResult.rows[0].email,
    name:       apptResult.rows[0].name,
    summary:    postVisitSummary,
    prescription,
  }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

  res.json({ status: 'success', data: { post_visit_summary: postVisitSummary } });
});

export const getMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT a.*, s.start_time, s.end_time, u.name AS doctor_name
     FROM appointments a
     JOIN slots s ON a.slot_id = s.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE a.patient_id = $1
     ORDER BY s.start_time DESC`,
    [req.user!.id]
  );
  res.json({ status: 'success', data: result.rows });
});

export const getDoctorAppointments = asyncHandler(async (req: Request, res: Response) => {
  const doctorResult = await query(
    'SELECT id FROM doctors WHERE user_id = $1', [req.user!.id]
  );
  if (!doctorResult.rows.length) throw new AppError('Doctor profile not found', 404);

  const result = await query(
    `SELECT a.*, s.start_time, s.end_time,
            u.name AS patient_name, u.email AS patient_email, u.phone AS patient_phone
     FROM appointments a
     JOIN slots s ON a.slot_id = s.id
     JOIN users u ON a.patient_id = u.id
     WHERE a.doctor_id = $1
     ORDER BY s.start_time DESC`,
    [doctorResult.rows[0].id]
  );
  res.json({ status: 'success', data: result.rows });
});

export const cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await query(
    `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND patient_id = $2 AND status = 'confirmed'
     RETURNING *, (SELECT start_time FROM slots WHERE slots.id = appointments.slot_id) AS start_time`,
    [id, req.user!.id]
  );
  if (!result.rows.length) throw new AppError('Appointment not found or already cancelled', 404);

  // Free the slot
  await query(
    `UPDATE slots SET status = 'available' WHERE id = $1`,
    [result.rows[0].slot_id]
  );

  // Queue cancellation + calendar delete
  if (result.rows[0].google_event_id) {
    await calendarQueue.add('delete_event', {
      google_event_id: result.rows[0].google_event_id,
      patientId: req.user!.id,
    });
  }

  res.json({ status: 'success', message: 'Appointment cancelled' });
});
