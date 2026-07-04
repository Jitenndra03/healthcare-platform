import { query } from '../config/db';

interface DoctorSchedule {
  id: string;
  slot_duration: number;
  work_start: string;
  work_end: string;
  work_days: number[];
}

// Generates slots for a given date for a doctor (if not already generated)
export async function generateSlotsForDate(doctor: DoctorSchedule, date: string) {
  const dayOfWeek = new Date(date).getDay(); // 0 = Sun, 1 = Mon ...

  if (!doctor.work_days.includes(dayOfWeek)) return []; // Not a work day

  // Check if slots already exist for this date
  const existing = await query(
    `SELECT id FROM slots
     WHERE doctor_id = $1 AND DATE(start_time AT TIME ZONE 'UTC') = $2
     LIMIT 1`,
    [doctor.id, date]
  );
  if (existing.rows.length > 0) return existing.rows;

  const [startH, startM] = doctor.work_start.split(':').map(Number);
  const [endH, endM]     = doctor.work_end.split(':').map(Number);
  const slotMinutes      = doctor.slot_duration;

  const slots: { start: Date; end: Date }[] = [];
  const base = new Date(`${date}T00:00:00.000Z`);

  let current = new Date(base);
  current.setUTCHours(startH, startM, 0, 0);
  const endTime = new Date(base);
  endTime.setUTCHours(endH, endM, 0, 0);

  while (current < endTime) {
    const slotEnd = new Date(current.getTime() + slotMinutes * 60000);
    if (slotEnd > endTime) break;
    slots.push({ start: new Date(current), end: new Date(slotEnd) });
    current = slotEnd;
  }

  // Bulk insert
  if (slots.length === 0) return [];

  const values = slots
    .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
    .join(', ');
  const params: (string | Date)[] = [doctor.id];
  slots.forEach((s) => { params.push(s.start, s.end); });

  const result = await query(
    `INSERT INTO slots (doctor_id, start_time, end_time)
     VALUES ${values} ON CONFLICT DO NOTHING RETURNING *`,
    params
  );

  return result.rows;
}
