import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { Error as MongooseError } from 'mongoose';

@Catch(MongooseError)
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(exception: MongooseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof MongooseError.ValidationError) {
      const errors = Object.values(exception.errors).map(
        (error: any) => error.message,
      );
      response.status(400).json({
        statusCode: 400,
        message: 'Validation failed',
        errors,
      });
    } else if (exception instanceof MongooseError.CastError) {
      response.status(400).json({
        statusCode: 400,
        message: `Invalid ${exception.path}: ${exception.value}`,
      });
    } else {
      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}
