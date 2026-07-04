import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import { query, pool } from '../../config/db';
import { emailQueue } from '../queue';

function parseFrequencyToHours(frequency: string): number {
  const lower = frequency.toLowerCase();
  if (lower.includes('twice') || lower.includes('2 times')) return 12;
  if (lower.includes('thrice') || lower.includes('3 times')) return 8;
  if (lower.includes('every 6')) return 6;
  if (lower.includes('every 8')) return 8;
  if (lower.includes('every 12')) return 12;
  if (lower.includes('once') || lower.includes('1 time') || lower.includes('daily')) return 24;
  if (lower.includes('weekly')) return 168;
  return 24; // default once daily
}

export const reminderWorker = new Worker('reminder', async (job: Job) => {
  const { name: jobName, data } = job;

  if (jobName === 'setup_reminders') {
    const { appointmentId, patientId, prescription } = data;

    for (const med of prescription) {
      const intervalHours = parseFrequencyToHours(med.frequency || 'once daily');
      const nextReminder  = new Date(Date.now() + intervalHours * 3600000);

      await query(
        `INSERT INTO medication_reminders
           (appointment_id, patient_id, drug_name, dose, frequency, next_reminder)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [appointmentId, patientId, med.drug, med.dose, med.frequency, nextReminder]
      );
    }
  }

  if (jobName === 'send_due_reminders') {
    // Cron job calls this every 15 minutes
    const due = await query(
      `SELECT mr.*, u.email, u.name
       FROM medication_reminders mr
       JOIN users u ON mr.patient_id = u.id
       WHERE mr.active = TRUE AND mr.next_reminder <= NOW()`,
    );

    for (const reminder of due.rows) {
      await emailQueue.add('medication_reminder', {
        to:   reminder.email,
        name: reminder.name,
        drug: reminder.drug_name,
        dose: reminder.dose,
      });

      const intervalHours = parseFrequencyToHours(reminder.frequency || 'once daily');
      const nextReminder  = new Date(Date.now() + intervalHours * 3600000);

      await query(
        `UPDATE medication_reminders SET next_reminder = $1 WHERE id = $2`,
        [nextReminder, reminder.id]
      );
    }
  }
}, { connection: redis });
