import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@impactlens/shared';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  }
);
