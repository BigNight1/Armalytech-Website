import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TicketWhatsAppError } from '../application/ticket-whatsapp.service';

/**
 * Maps an application error to an HTTP exception whose body is
 * `{ message: <code>, code: <code> }` (plus `detail` for send failures), so
 * `HttpExceptionFilter` exposes the contract code as `error.code` and
 * `error.message`.
 */
export function toWhatsAppHttpException(error: unknown): unknown {
  if (!(error instanceof TicketWhatsAppError)) return error;
  const body = { message: error.code, code: error.code };

  switch (error.code) {
    case 'ticket_not_found':
      return new NotFoundException(body);
    case 'invalid_state':
    case 'already_sent':
      return new ConflictException(body);
    case 'marketing_not_allowed':
      return new ForbiddenException(body);
    case 'invalid_phone':
      return new UnprocessableEntityException(body);
    case 'whatsapp_send_failed':
      return new BadGatewayException({ ...body, detail: error.detail });
    case 'whatsapp_not_configured':
      return new ServiceUnavailableException(body);
    default:
      return new HttpException(body, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
