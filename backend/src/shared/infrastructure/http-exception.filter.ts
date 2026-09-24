import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ConflictDomainError,
  DomainError,
  NotFoundDomainError,
  UnauthorizedDomainError,
  ValidationDomainError,
} from '../domain/domain-error';

interface ErrorBody {
  ok: false;
  error: {
    statusCode: number;
    message: string | string[];
    code: string;
    path: string;
    timestamp: string;
  };
}

/**
 * Uniform JSON error shape for every thrown exception, per ADR 0005
 * ("respuestas usan ... cuerpos JSON uniformes") and ADR 0010
 * (errors returned as 4xx JSON, never a raw stack trace).
 *
 * Also maps domain errors (framework-free, thrown by use cases) to HTTP
 * status codes here, at the infrastructure boundary, so the domain and
 * application layers never depend on `@nestjs/common`.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, code } = this.resolve(exception);

    const body: ErrorBody = {
      ok: false,
      error: {
        statusCode,
        message,
        code,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string | string[];
    code: string;
  } {
    if (exception instanceof NotFoundDomainError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof ConflictDomainError) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof ValidationDomainError) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof UnauthorizedDomainError) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof DomainError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const statusCode = exception.getStatus();
      if (typeof body === 'string') {
        return {
          statusCode,
          message: body,
          code: this.codeFromStatus(statusCode),
        };
      }
      if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        return {
          statusCode,
          message: (b.message as string | string[]) ?? exception.message,
          code: (b.code as string) ?? this.codeFromStatus(statusCode),
        };
      }
      return {
        statusCode,
        message: exception.message,
        code: this.codeFromStatus(statusCode),
      };
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      code: 'internal_error',
    };
  }

  private codeFromStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'bad_request';
      case HttpStatus.UNAUTHORIZED:
        return 'unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'forbidden';
      case HttpStatus.NOT_FOUND:
        return 'not_found';
      case HttpStatus.CONFLICT:
        return 'conflict';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'validation_error';
      default:
        return 'internal_error';
    }
  }
}
