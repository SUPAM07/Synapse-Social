import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: env.smtpUser && env.smtpPass ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
});

export async function sendEmail({ to, subject, html, text }) {
  const from = env.emailFrom;
  const mail = { from, to, subject, html, text };
  return transporter.sendMail(mail);
}


