import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected server error occurred.';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        code = res.code || (status === 404 ? 'NOT_FOUND' : status === 403 ? 'FORBIDDEN' : status === 401 ? 'UNAUTHORIZED' : 'BAD_REQUEST');
        message = res.message || exception.message;
        details = res.details || (Array.isArray(res.message) ? res.message : null);
      } else {
        message = res || exception.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error at ${request.method} ${request.url}: ${exception.message}`, exception.stack);
      message = process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred.' : exception.message;
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
