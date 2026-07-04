import { google } from 'googleapis';
import { oauth2Client } from '../config/google';

export async function createCalendarEvent(data: {
  patientRefreshToken: string | null;
  doctorRefreshToken:  string | null;
  patientEmail: string;
  doctorEmail:  string;
  summary:      string;
  startTime:    string;
  endTime:      string;
}) {
  if (!data.patientRefreshToken && !data.doctorRefreshToken) return null;

  // Use whichever token is available (prefer patient)
  const refreshToken = data.patientRefreshToken || data.doctorRefreshToken!;
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const { data: event } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: data.summary,
      start: { dateTime: data.startTime, timeZone: 'Asia/Kolkata' },
      end:   { dateTime: data.endTime,   timeZone: 'Asia/Kolkata' },
      attendees: [
        { email: data.patientEmail },
        { email: data.doctorEmail  },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email',  minutes: 60 },
          { method: 'popup',  minutes: 30 },
        ],
      },
    },
  });

  return event.id;
}

export async function deleteCalendarEvent(refreshToken: string, eventId: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  await calendar.events.delete({ calendarId: 'primary', eventId });
}
