import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQController } from './rabbitmq.controller';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('RabbitMQController', () => {
  let rabbitMQController: RabbitMQController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RabbitMQController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'MAILTRAP_USERNAME':
                  return 'test-username';
                case 'MAILTRAP_PASSWORD':
                  return 'test-password';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    rabbitMQController = module.get<RabbitMQController>(RabbitMQController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleEmailSendEvent', () => {
    it('should send an email successfully', async () => {
      const emailDetails = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const sendMailMock = jest.fn().mockResolvedValueOnce(true);
      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: sendMailMock,
      });

      await rabbitMQController.handleEmailSendEvent(emailDetails);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: 'test-username',
          pass: 'test-password',
        },
      });
      expect(sendMailMock).toHaveBeenCalledWith({
        from: 'no-reply@gaddafi.com',
        to: emailDetails.to,
        subject: emailDetails.subject,
        text: emailDetails.text,
      });
    });

    it('should log an error if email sending fails', async () => {
      const emailDetails = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const sendMailMock = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failed to send email'));
      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: sendMailMock,
      });

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementation(() => {});

      await rabbitMQController.handleEmailSendEvent(emailDetails);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send email:',
        expect.any(Error),
      );
    });
  });
});
