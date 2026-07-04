import { Queue } from 'bullmq';
import redis from '../config/redis';

const connection = redis;

export const emailQueue    = new Queue('email',    { connection });
export const calendarQueue = new Queue('calendar', { connection });
export const reminderQueue = new Queue('reminder', { connection });
