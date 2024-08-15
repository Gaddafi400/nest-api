import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from './rabbitmq.service';
import { ClientProxy } from '@nestjs/microservices';

describe('RabbitMQService', () => {
  let rabbitMQService: RabbitMQService;
  let clientProxy: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: 'RABBITMQ_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
    clientProxy = module.get<ClientProxy>('RABBITMQ_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should emit an email_send_event', async () => {
      const emailDetails = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };

      await rabbitMQService.sendEmail(emailDetails);

      expect(clientProxy.emit).toHaveBeenCalledWith(
        'email_send_event',
        emailDetails,
      );
    });
  });
});
