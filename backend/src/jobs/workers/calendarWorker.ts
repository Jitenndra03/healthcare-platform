import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import { createCalendarEvent, deleteCalendarEvent } from '../../services/calendar.service';
import { query } from '../../config/db';

export const calendarWorker = new Worker('calendar', async (job: Job) => {
  const { name: jobName, data } = job;

  if (jobName === 'create_event') {
    const eventId = await createCalendarEvent(data);
    if (eventId) {
      await query(
        `UPDATE appointments SET google_event_id = $1 WHERE id = $2`,
        [eventId, data.appointmentId]
      );
    }
  }

  if (jobName === 'delete_event' && data.google_event_id) {
    const userResult = await query(
      'SELECT google_refresh_token FROM users WHERE id = $1',
      [data.patientId]
    );
    if (userResult.rows[0]?.google_refresh_token) {
      await deleteCalendarEvent(
        userResult.rows[0].google_refresh_token,
        data.google_event_id
      );
    }
  }
}, { connection: redis });

calendarWorker.on('failed', (job, err) => {
  console.error(`[Calendar Worker] Job ${job?.id} failed:`, err.message);
});
