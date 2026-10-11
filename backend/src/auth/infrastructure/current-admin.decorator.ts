import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SessionPayload } from './session.types';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { admin?: SessionPayload }>();
    return request.admin as SessionPayload;
  },
);
