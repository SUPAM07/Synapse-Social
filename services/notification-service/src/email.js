import nodemailer from 'nodemailer';
import { env } from '../config.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    if (!env.smtpUser) {
      console.log(`[Email – SKIPPED (no SMTP config)] To: ${to} | Subject: ${subject}`);
      return;
    }
    await getTransporter().sendMail({ from: env.emailFrom, to, subject, html, text });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}
