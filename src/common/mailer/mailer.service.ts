import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    const options: SMTPTransport.Options = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.transporter = nodemailer.createTransport(options);
  }

  async sendPasswordReset(to: string, link: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: 'Восстановление пароля',
      html: `<p>Для восстановления пароля перейдите по ссылке:</p>
                <p><a href="${link}">${link}</a></p>
                <p>Если вы не запрашивали восстановление — игнорируйте письмо.</p>`,
    });
  }
}
