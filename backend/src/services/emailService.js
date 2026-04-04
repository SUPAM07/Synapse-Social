import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: false,
      auth: config.EMAIL_USER ? { user: config.EMAIL_USER, pass: config.EMAIL_PASSWORD } : undefined,
    });
  }
  return transporter;
}

export async function sendWelcomeEmail(email, name) {
  try {
    await getTransporter().sendMail({
      from: config.EMAIL_FROM,
      to: email,
      subject: 'Welcome to AI Event Organiser!',
      html: `<h1>Welcome, ${name}!</h1><p>Thank you for joining AI Event Organiser. Start exploring and creating amazing events!</p>`,
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err.message);
  }
}

export async function sendTicketConfirmation(email, name, eventTitle, qrCode) {
  try {
    await getTransporter().sendMail({
      from: config.EMAIL_FROM,
      to: email,
      subject: `Ticket Confirmation - ${eventTitle}`,
      html: `<h1>You're registered!</h1><p>Hi ${name},</p><p>Your registration for <strong>${eventTitle}</strong> is confirmed.</p><p>Your QR Code: <strong>${qrCode}</strong></p>`,
    });
  } catch (err) {
    console.error('Failed to send ticket confirmation email:', err.message);
  }
}

export async function sendEventReminder(email, name, eventTitle, eventDate) {
  try {
    await getTransporter().sendMail({
      from: config.EMAIL_FROM,
      to: email,
      subject: `Reminder: ${eventTitle} is coming up!`,
      html: `<h1>Event Reminder</h1><p>Hi ${name},</p><p>This is a reminder that <strong>${eventTitle}</strong> is scheduled for <strong>${eventDate}</strong>.</p>`,
    });
  } catch (err) {
    console.error('Failed to send event reminder email:', err.message);
  }
}
