import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMQService {
  constructor(@Inject('RABBITMQ_SERVICE') private client: ClientProxy) {}

  async sendEmail(emailDetails: any) {
    return this.client.emit('email_send_event', emailDetails);
  }
}
