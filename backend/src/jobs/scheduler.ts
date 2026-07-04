import { Queue } from 'bullmq';
import redis from '../config/redis';

const reminderQueue = new Queue('reminder', { connection: redis });

// Check for due reminders every 15 minutes
export async function startScheduler() {
  await reminderQueue.add(
    'send_due_reminders',
    {},
    {
      repeat: { every: 15 * 60 * 1000 }, // every 15 min
      jobId:  'reminder-cron',
    }
  );

  console.log('[Scheduler] Medication reminder cron started');
}
