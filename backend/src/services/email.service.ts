import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export const templates = {
  bookingConfirmation: (data: {
    name: string; doctorName: string; startTime: string;
    preVisitSummary: { urgency: string; chief_complaint: string };
  }) => ({
    subject: `Appointment Confirmed — Dr. ${data.doctorName}`,
    html: `
      <h2>Your appointment is confirmed</h2>
      <p>Hi ${data.name},</p>
      <p>Your appointment with <strong>Dr. ${data.doctorName}</strong> is scheduled for
         <strong>${new Date(data.startTime).toLocaleString()}</strong>.</p>
      <hr/>
      <h3>Pre-visit summary</h3>
      <p><strong>Urgency:</strong> ${data.preVisitSummary.urgency}</p>
      <p><strong>Chief concern:</strong> ${data.preVisitSummary.chief_complaint}</p>
      <p>Please arrive 10 minutes early. Bring any relevant medical records.</p>
    `,
  }),

  cancellation: (data: { name: string; leave_date: string; reason: string }) => ({
    subject: 'Appointment Cancelled',
    html: `
      <h2>Appointment Cancelled</h2>
      <p>Hi ${data.name},</p>
      <p>Your appointment on <strong>${data.leave_date}</strong> has been cancelled.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>Please rebook at your earliest convenience. We apologise for the inconvenience.</p>
    `,
  }),

  postVisitSummary: (data: { name: string; summary: string }) => ({
    subject: 'Your visit summary',
    html: `
      <h2>Your visit summary</h2>
      <p>Hi ${data.name},</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;">
        ${data.summary.replace(/\n/g, '<br/>')}
      </div>
      <p style="color:#888;font-size:12px;">
        This summary was generated to help you understand your visit.
        Always follow your doctor's direct instructions.
      </p>
    `,
  }),

  medicationReminder: (data: { name: string; drug: string; dose: string }) => ({
    subject: `Medication reminder: ${data.drug}`,
    html: `
      <h2>Time for your medication</h2>
      <p>Hi ${data.name},</p>
      <p>This is a reminder to take your medication:</p>
      <p><strong>${data.drug}</strong> — ${data.dose}</p>
    `,
  }),
};
