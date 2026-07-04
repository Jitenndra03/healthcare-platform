import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import { sendEmail, templates } from '../../services/email.service';
import { query } from '../../config/db';

export const emailWorker = new Worker('email', async (job: Job) => {
  const { name: jobName, data } = job;

  console.log(`[Email Worker] Processing job: ${jobName}`);

  let template: { subject: string; html: string };

  switch (jobName) {
    case 'booking_confirmation':
      template = templates.bookingConfirmation({
        name:            data.patientName,
        doctorName:      data.doctorName,
        startTime:       data.startTime,
        preVisitSummary: data.preVisitSummary,
      });
      await sendEmail(data.patientEmail, template.subject, template.html);
      break;

    case 'cancellation':
      template = templates.cancellation({
        name:       data.name,
        leave_date: data.leave_date,
        reason:     data.reason,
      });
      await sendEmail(data.to, template.subject, template.html);
      break;

    case 'post_visit_summary':
      template = templates.postVisitSummary({ name: data.name, summary: data.summary });
      await sendEmail(data.to, template.subject, template.html);
      break;

    case 'medication_reminder':
      template = templates.medicationReminder({
        name: data.name, drug: data.drug, dose: data.dose,
      });
      await sendEmail(data.to, template.subject, template.html);
      break;

    default:
      console.warn(`[Email Worker] Unknown job type: ${jobName}`);
  }

  // Log success
  await query(
    `UPDATE notification_log SET status = 'sent', attempts = attempts + 1, updated_at = NOW()
     WHERE payload->>'jobId' = $1`,
    [job.id]
  );
}, { connection: redis, concurrency: 5 });

emailWorker.on('failed', async (job, err) => {
  console.error(`[Email Worker] Job ${job?.id} failed:`, err.message);
});
