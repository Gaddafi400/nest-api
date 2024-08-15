import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Controller()
export class RabbitMQController {
  constructor(private configService: ConfigService) {}

  @EventPattern('email_send_event')
  async handleEmailSendEvent(emailDetails: any) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: this.configService.get<string>('MAILTRAP_USERNAME'),
        pass: this.configService.get<string>('MAILTRAP_PASSWORD'),
      },
    });

    try {
      await transporter.sendMail({
        from: 'no-reply@gaddafi.com',
        to: emailDetails.to,
        subject: emailDetails.subject,
        text: emailDetails.text,
      });
      console.log(`Email sent to ${emailDetails.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}
