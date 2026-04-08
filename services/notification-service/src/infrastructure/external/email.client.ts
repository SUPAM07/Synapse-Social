import nodemailer from 'nodemailer';
import { createLogger } from '@uevent/utils';
import { config } from '../../config';

const logger = createLogger('notification-service:email');

export class EmailClient {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  }

  async sendWelcomeEmail(to: string, fullName: string): Promise<void> {
    await this.sendEmail(to, 'Welcome to Uevent!',
      `<p>Hello ${fullName},</p><p>Welcome to Uevent! Your account has been created.</p>`);
  }

  async sendBookingConfirmedEmail(to: string, bookingId: string, eventId: string): Promise<void> {
    await this.sendEmail(to, 'Your booking is confirmed!',
      `<p>Your booking <strong>${bookingId}</strong> for event <strong>${eventId}</strong> has been confirmed.</p>`);
  }

  async sendBookingCancelledEmail(to: string, bookingId: string, reason: string): Promise<void> {
    await this.sendEmail(to, 'Your booking has been cancelled',
      `<p>Your booking <strong>${bookingId}</strong> has been cancelled. Reason: ${reason}</p>`);
  }

  async sendPaymentSuccessEmail(to: string, paymentId: string, amount: number, currency: string): Promise<void> {
    await this.sendEmail(to, 'Payment successful',
      `<p>Payment <strong>${paymentId}</strong> of ${amount} ${currency.toUpperCase()} was successful.</p>`);
  }

  async sendPaymentFailedEmail(to: string, reason: string): Promise<void> {
    await this.sendEmail(to, 'Payment failed',
      `<p>Your payment failed. Reason: ${reason}</p><p>Please try again.</p>`);
  }
}

export const emailClient = new EmailClient();
